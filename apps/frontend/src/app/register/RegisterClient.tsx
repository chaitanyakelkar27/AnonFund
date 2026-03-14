"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
    AnonAadhaarProof,
    AnonAadhaarProvider,
    LogInWithAnonAadhaar,
    useAnonAadhaar,
    useProver
} from "@anon-aadhaar/react";
import { useWallet } from "@/hooks/use-wallet";
import { VOTER_REGISTRY_ABI, VOTER_REGISTRY_ADDRESS } from "@/contracts";
import styles from "../flow.module.css";

const DEFAULT_NULLIFIER_SEED = 1234;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function extractNullifierKey(proof: unknown): string | null {
    if (!proof || typeof proof !== "object") {
        return null;
    }

    const record = proof as Record<string, unknown>;
    const claim = (record.claim ?? {}) as Record<string, unknown>;

    const candidates = [
        claim.nullifier,
        claim.nullifierHash,
        claim.nullifier_hash,
        claim.nullifierSeed,
        record.nullifier,
        record.nullifierHash
    ];

    for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.length > 0) {
            return candidate;
        }

        if (typeof candidate === "number" || typeof candidate === "bigint") {
            return `${candidate}`;
        }
    }

    return null;
}

function extractNullifierFromProof(proof: unknown): bigint | null {
    if (!proof || typeof proof !== "object") {
        return null;
    }

    const record = proof as Record<string, unknown>;
    const directProof = (record.proof ?? {}) as Record<string, unknown>;
    const claim = (record.claim ?? {}) as Record<string, unknown>;

    const candidates = [
        directProof.nullifier,
        claim.nullifier,
        claim.nullifierHash,
        claim.nullifier_hash,
        record.nullifier,
        record.nullifierHash
    ];

    for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.length > 0) {
            try {
                return BigInt(candidate);
            } catch {
                // Keep trying other candidates.
            }
        }

        if (typeof candidate === "number" || typeof candidate === "bigint") {
            return BigInt(candidate);
        }
    }

    return null;
}

function RegisterPageContent(): React.JSX.Element {
    const router = useRouter();
    const { loading, isConnected, isVerified, setVerificationData, address, shortAddress } = useWallet();
    const [anonAadhaar] = useAnonAadhaar();
    const [, latestProof] = useProver();
    const [isRegistering, setIsRegistering] = useState(false);
    const [storedNullifier, setStoredNullifier] = useState<string | null>(null);
    const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
    const { data: hash, error, isPending, writeContract } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash
    });

    const nullifier = useMemo(() => extractNullifierFromProof(latestProof), [latestProof]);
    const proofAsString = useMemo(() => {
        if (!latestProof) {
            return "";
        }

        try {
            return JSON.stringify(latestProof, null, 2);
        } catch {
            return "";
        }
    }, [latestProof]);

    const canVerify = !loading && isConnected;
    const isAnonLoggedIn = anonAadhaar.status === "logged-in";
    const canUseRegistry = VOTER_REGISTRY_ADDRESS.toLowerCase() !== ZERO_ADDRESS && VOTER_REGISTRY_ABI.length > 0;

    const nullifierSeed = useMemo(() => {
        if (!address) {
            return DEFAULT_NULLIFIER_SEED;
        }

        const fromAddress = Number.parseInt(address.slice(2, 10), 16);

        if (Number.isFinite(fromAddress) && fromAddress > 0) {
            return fromAddress;
        }

        return DEFAULT_NULLIFIER_SEED;
    }, [address]);

    const { data: isNullifierUsed } = useReadContract({
        address: VOTER_REGISTRY_ADDRESS,
        abi: VOTER_REGISTRY_ABI,
        functionName: "isNullifierUsed",
        args: [nullifier ?? 0n],
        query: {
            enabled: canUseRegistry && nullifier !== null
        }
    });

    const { data: storedNullifierUsed, isLoading: isCheckingStoredNullifier } = useReadContract({
        address: VOTER_REGISTRY_ADDRESS,
        abi: VOTER_REGISTRY_ABI,
        functionName: "isNullifierUsed",
        args: storedNullifier ? [BigInt(storedNullifier)] : [0n],
        query: {
            enabled: canUseRegistry && hasCheckedStorage
        }
    });

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        setStoredNullifier(window.localStorage.getItem("user_nullifier"));
        setHasCheckedStorage(true);
    }, []);

    useEffect(() => {
        if (!loading && !isConnected) {
            router.push("/connect");
        }
    }, [loading, isConnected, router]);

    useEffect(() => {
        if (!loading && isConnected && hasCheckedStorage && storedNullifier && storedNullifierUsed === true && !isCheckingStoredNullifier) {
            router.push("/dashboard");
        }
    }, [loading, isConnected, hasCheckedStorage, storedNullifier, storedNullifierUsed, isCheckingStoredNullifier, router]);

    useEffect(() => {
        if (isAnonLoggedIn && !isVerified && latestProof) {
            const nullifierKey = extractNullifierKey(latestProof) ?? `${nullifierSeed}`;

            setVerificationData({
                nullifierSeed: `${nullifierSeed}`,
                nullifierKey
            });
        }
    }, [isAnonLoggedIn, isVerified, latestProof, nullifierSeed, setVerificationData]);

    useEffect(() => {
        if (!isConfirmed || !nullifier || !latestProof) {
            return;
        }

        window.localStorage.setItem("user_nullifier", nullifier.toString());
        window.localStorage.setItem("user_proof", JSON.stringify(latestProof));
        window.localStorage.setItem("registration_timestamp", Date.now().toString());

        const loadVoterProof = async () => {
            try {
                const response = await fetch("/api/voter/proof", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ nullifier: nullifier.toString() })
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch voter proof data");
                }

                const data = await response.json();

                window.localStorage.setItem("voterIdentity", JSON.stringify(data.identity));
                window.localStorage.setItem("merkleProof", JSON.stringify(data.merkleProof));
                window.localStorage.setItem("merkleRoot", data.merkleRoot);
            } catch (fetchError) {
                console.error("Error fetching voter proof data", fetchError);
            } finally {
                setIsRegistering(false);
                router.push("/dashboard");
            }
        };

        void loadVoterProof();
    }, [isConfirmed, nullifier, latestProof, router]);

    useEffect(() => {
        if (!error) {
            return;
        }

        setIsRegistering(false);
        console.error("Registration error:", error);
    }, [error]);

    const handleRegisterVoter = () => {
        if (!canUseRegistry || !nullifier || anonAadhaar.status !== "logged-in") {
            return;
        }

        setIsRegistering(true);

        writeContract({
            address: VOTER_REGISTRY_ADDRESS,
            abi: VOTER_REGISTRY_ABI,
            functionName: "registerVoter",
            args: [nullifier]
        });
    };

    if (!isConnected) {
        return <main className={styles.page} />;
    }

    return (
        <main className={styles.page}>
            <section className={styles.panel}>
                <h1>Register as Voter</h1>
                <p className={styles.lead}>
                    Complete your one-time registration to participate in quadratic funding.
                </p>

                <div className={styles.stepCard}>
                    <h2>Step 1: Wallet Connected</h2>
                    <p>{isConnected ? `Your wallet ${shortAddress} is connected` : "Connect your wallet to continue"}</p>
                </div>

                <div className={styles.stepCard}>
                    <div className={styles.stepTitleRow}>
                        <span className={styles.stepIcon} aria-hidden="true">
                            {isAnonLoggedIn ? "✓" : "○"}
                        </span>
                        <h2>Step 2: Verify Identity</h2>
                    </div>
                    <p>Generate zero-knowledge proof using Anon Aadhaar</p>
                    <p className={styles.subtleText}>
                        Use a test QR from{" "}
                        <a href="https://boilerplate.anon-aadhaar.pse.dev/" target="_blank" rel="noreferrer">
                            boilerplate.anon-aadhaar.pse.dev
                        </a>
                        , then upload it in the popup to verify zkey proof.
                    </p>
                    {canVerify && (
                        <div className={styles.loginWrap}>
                            <LogInWithAnonAadhaar
                                nullifierSeed={nullifierSeed}
                                signal={address ?? "anonfund-voter"}
                            />
                        </div>
                    )}
                    {isVerified && <span className={styles.infoPill}>Local verification already detected for this wallet.</span>}
                    {isAnonLoggedIn && <span className={styles.successPill}>Identity Verified</span>}
                    {isNullifierUsed === true && <span className={styles.errorPill}>This identity is already registered</span>}
                </div>

                {isAnonLoggedIn && proofAsString && (
                    <div className={styles.stepCard}>
                        <h2 className={styles.proofTitle}>Your Proof Details</h2>
                        <div className={styles.proofBox}>
                            <AnonAadhaarProof code={proofAsString} />
                        </div>
                    </div>
                )}

                <div className={styles.privacyBox}>
                    <h3>Privacy Guarantees</h3>
                    <ul>
                        <li>No Aadhaar number stored on-chain</li>
                        <li>No personal information revealed</li>
                        <li>One-person-one-identity verification</li>
                    </ul>
                </div>

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.primary}
                        disabled={
                            !canUseRegistry ||
                            !nullifier ||
                            anonAadhaar.status !== "logged-in" ||
                            isNullifierUsed === true ||
                            isRegistering ||
                            isPending ||
                            isConfirming
                        }
                        onClick={handleRegisterVoter}
                    >
                        {isPending
                            ? "Confirm in wallet..."
                            : isConfirming
                                ? "Registering on blockchain..."
                                : isRegistering
                                    ? "Processing..."
                                    : "Complete Registration"}
                    </button>
                    <Link href="/connect" className={styles.ghost}>
                        Back To Connect
                    </Link>
                    <Link href="/dashboard" className={styles.secondary} aria-disabled={!isVerified}>
                        Continue To Project Dashboard
                    </Link>
                </div>

                {hash && <p className={styles.subtleText}>Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}</p>}
                {error && <p className={styles.errorText}>Registration failed: {error.message}</p>}
                {!canUseRegistry && (
                    <p className={styles.errorText}>
                        Configure a valid VoterRegistry contract address and ABI to complete on-chain registration.
                    </p>
                )}
            </section>
        </main>
    );
}

export default function RegisterClient(): React.JSX.Element {
    return (
        <AnonAadhaarProvider _appName="AnonFund" _useTestAadhaar={true}>
            <RegisterPageContent />
        </AnonAadhaarProvider>
    );
}
