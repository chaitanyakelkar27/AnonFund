"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import {
    AnonAadhaarProof,
    LogInWithAnonAadhaar,
    useAnonAadhaar,
    useProver
} from "@anon-aadhaar/react/dist/index.js";
import { useWallet } from "@/hooks/use-wallet";
import styles from "../flow.module.css";

const DEFAULT_NULLIFIER_SEED = 1234;

export default function RegisterPage(): React.JSX.Element {
    const { loading, isConnected, isVerified, voiceCredits, markVerified, address } = useWallet();
    const [anonAadhaar, setAnonAadhaar] = useAnonAadhaar();
    const [proverState, latestProof] = useProver();

    const canVerify = !loading && isConnected && !isVerified;
    const isAnonLoggedIn = anonAadhaar.status === "logged-in";
    const nullifierSeed = Number.parseInt(process.env.NEXT_PUBLIC_AA_NULLIFIER_SEED ?? `${DEFAULT_NULLIFIER_SEED}`, 10);

    useEffect(() => {
        if (isAnonLoggedIn && !isVerified) {
            markVerified();
        }
    }, [isAnonLoggedIn, isVerified, markVerified]);

    const proofAsString = useMemo(() => {
        if (!latestProof) {
            return "";
        }

        try {
            return JSON.stringify(latestProof, null, 2);
        } catch {
            return "Proof generated. Unable to preview as JSON.";
        }
    }, [latestProof]);

    return (
        <main className={styles.page}>
            <section className={styles.panel}>
                <p className={styles.eyebrow}>Step 2</p>
                <h1>Complete Anon Aadhaar Verification</h1>
                <p className={styles.lead}>
                    Verify with Anon Aadhaar to unlock private voting and receive your initial voice credits.
                </p>

                <ul className={styles.checklist}>
                    <li className={isConnected ? styles.done : ""}>Wallet connected</li>
                    <li className={isAnonLoggedIn ? styles.done : ""}>Anon Aadhaar proof generated</li>
                    <li className={voiceCredits > 0 ? styles.done : ""}>Voice credits assigned</li>
                </ul>

                <div className={styles.statsRow}>
                    <div>
                        <span>Anon Aadhaar</span>
                        <strong>{anonAadhaar.status}</strong>
                    </div>
                    <div>
                        <span>Prover</span>
                        <strong>{proverState}</strong>
                    </div>
                </div>

                <div className={styles.statsRow}>
                    <div>
                        <span>Verification</span>
                        <strong>{isVerified ? "Approved" : "Pending"}</strong>
                    </div>
                    <div>
                        <span>Voice Credits</span>
                        <strong>{voiceCredits}</strong>
                    </div>
                </div>

                <div className={styles.actions}>
                    {canVerify && (
                        <LogInWithAnonAadhaar
                            nullifierSeed={Number.isFinite(nullifierSeed) ? nullifierSeed : DEFAULT_NULLIFIER_SEED}
                            signal={address ?? "anonfund-voter"}
                        />
                    )}
                    <button
                        type="button"
                        className={styles.ghost}
                        onClick={() => setAnonAadhaar({ type: "logout" })}
                        disabled={anonAadhaar.status === "logged-out"}
                    >
                        Reset Anon Aadhaar Session
                    </button>
                    <Link href="/connect" className={styles.ghost}>
                        Back To Connect
                    </Link>
                    <Link href="/dashboard" className={styles.secondary} aria-disabled={!isVerified}>
                        Go To Dashboard
                    </Link>
                </div>

                {isAnonLoggedIn && proofAsString && (
                    <AnonAadhaarProof code={proofAsString} label="Latest Anon Aadhaar Proof" />
                )}
            </section>
        </main>
    );
}
