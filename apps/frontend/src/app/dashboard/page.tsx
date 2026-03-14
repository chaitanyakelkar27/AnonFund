"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useChainId } from "wagmi";
import { useWallet } from "@/hooks/use-wallet";
import { ProtectedRoute } from "@/components/protected-route";
import { ModeToggle } from "@/components/mode-toggle";
import { VOTER_REGISTRY_ADDRESS } from "@/contracts";
import styles from "./dashboard.module.css";

export default function DashboardPage(): React.JSX.Element {
    const router = useRouter();
    const chainId = useChainId();
    const { loading, isConnected, isVerified, voiceCredits, shortAddress, connect, disconnect } = useWallet();
    const [hasStoredProof, setHasStoredProof] = useState(false);
    const [proofChecked, setProofChecked] = useState(false);
    const [registrationDate, setRegistrationDate] = useState<string>("-");
    const [storedNullifier, setStoredNullifier] = useState<string>("-");
    const [totalVoters, setTotalVoters] = useState(0);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const savedProof = window.localStorage.getItem("user_proof");
        const timestamp = window.localStorage.getItem("registration_timestamp");
        const savedNullifier = window.localStorage.getItem("user_nullifier");

        setHasStoredProof(Boolean(savedProof));
        setStoredNullifier(savedNullifier ?? "-");

        setTotalVoters(savedNullifier ? 1 : 0);

        if (timestamp) {
            const parsedDate = new Date(Number(timestamp));
            if (!Number.isNaN(parsedDate.getTime())) {
                setRegistrationDate(parsedDate.toLocaleDateString());
            }
        }

        setProofChecked(true);
    }, []);

    useEffect(() => {
        if (loading || !proofChecked) {
            return;
        }

        if (!isConnected) {
            router.replace("/connect");
            return;
        }

        if (!hasStoredProof) {
            router.replace("/register");
        }
    }, [loading, proofChecked, isConnected, hasStoredProof, router]);

    const verificationLabel = useMemo(() => {
        if (!isConnected) {
            return "Wallet disconnected";
        }

        return isVerified ? "Anon Aadhaar verified" : "Verification pending";
    }, [isConnected, isVerified]);

    const truncatedNullifier = useMemo(() => {
        if (storedNullifier === "-") {
            return "-";
        }

        if (storedNullifier.length <= 24) {
            return storedNullifier;
        }

        return `${storedNullifier.slice(0, 18)}...${storedNullifier.slice(-18)}`;
    }, [storedNullifier]);

    const chainLabel = chainId === 11155111 ? "Sepolia" : `Chain ${chainId}`;
    const hasVerifierContract = VOTER_REGISTRY_ADDRESS !== "0x0000000000000000000000000000000000000000";

    const handleWalletButton = () => {
        if (isConnected) {
            disconnect();
            return;
        }

        void connect();
    };

    if (loading || !proofChecked || !isConnected || !hasStoredProof) {
        return (
            <main className={styles.page}>
                <section className={styles.checking}>
                    <h1>Checking access</h1>
                    <p className={styles.muted}>Dashboard access is granted only after proof generation.</p>
                </section>
            </main>
        );
    }

    return (
        <ProtectedRoute>
            <main className={styles.page}>
                <nav className={styles.nav}>
                    <div className={styles.navInner}>
                        <Link href="/" className={styles.brand}>
                            <span className={styles.brandMark}>A</span>
                            <span>AnonFund</span>
                        </Link>
                        <div className={styles.navActions}>
                            <Link href="/" className={styles.navBtn}>
                                Home
                            </Link>
                            <span className={styles.chip}>{chainLabel}</span>
                            <span className={styles.chip}>{shortAddress}</span>
                            <button type="button" className={styles.navBtn} onClick={handleWalletButton}>
                                {isConnected ? "Disconnect" : "Connect wallet"}
                            </button>
                            <ModeToggle className={styles.navBtn} />
                        </div>
                    </div>
                </nav>

                <section className={`${styles.shell} ${styles.main}`}>
                    <div className={styles.heroRow}>
                        <div>
                            <h1 className={styles.title}>Dashboard</h1>
                            <p className={styles.subtitle}>Welcome to anonfund platform</p>
                        </div>
                        <span className={styles.statusPill}>
                            {isVerified ? "Verified voter" : "Verification pending"}
                        </span>
                    </div>

                    <section className={styles.grid3}>
                        <article className={styles.card}>
                            <p className={styles.cardLabel}>Registration status</p>
                            <p className={styles.cardValue}>{isVerified ? "Active" : "Pending"}</p>
                            <p className={styles.cardHint}>Registered on {registrationDate}</p>
                        </article>
                        <article className={styles.card}>
                            <p className={styles.cardLabel}>Voice credits</p>
                            <p className={styles.cardValue}>{voiceCredits || 100}</p>
                            <p className={styles.cardHint}>Available for voting</p>
                        </article>
                        <article className={styles.card}>
                            <p className={styles.cardLabel}>Total voters</p>
                            <p className={styles.cardValue}>{totalVoters}</p>
                            <p className={styles.cardHint}>Registered voters</p>
                        </article>
                    </section>

                    <section className={styles.grid2}>
                        <article className={styles.panel}>
                            <h2 className={styles.sectionTitle}>Submit your project</h2>
                            <p className={styles.sectionLead}>Request funding for your public goods project.</p>
                            <p className={styles.bodyText}>
                                Have a project idea that benefits the ecosystem? Submit your proposal and get funded
                                through quadratic funding.
                            </p>
                            <Link href="/dashboard/submit-project" className={`${styles.buttonPrimary} ${styles.buttonFull}`}>
                                Submit project proposal
                            </Link>
                        </article>

                        <article className={styles.panel}>
                            <h2 className={styles.sectionTitle}>Browse projects</h2>
                            <p className={styles.sectionLead}>Discover and support public goods projects.</p>
                            <p className={styles.bodyText}>
                                Explore active projects seeking funding and contribute to the ones that matter to you.
                            </p>
                            <Link href="/dashboard/projects" className={`${styles.buttonSecondary} ${styles.buttonFull}`}>
                                View all projects
                            </Link>
                        </article>
                    </section>

                    <section className={styles.panel}>
                        <h2 className={styles.sectionTitle}>Your voter identity</h2>
                        <p className={styles.sectionLead}>Your verified identity secured with zero-knowledge proofs.</p>

                        <div className={styles.infoGrid}>
                            <article className={styles.card}>
                                <p className={styles.sectionTitle}>Wallet address</p>
                                <p className={styles.bodyText}>{shortAddress}</p>
                            </article>
                            <article className={styles.card}>
                                <p className={styles.sectionTitle}>Verification status</p>
                                <p className={styles.bodyText}>{verificationLabel}</p>
                            </article>
                        </div>

                        <article className={styles.card}>
                            <p className={styles.sectionTitle}>Nullifier (anonymous ID)</p>
                            <p className={styles.bodyText}>{truncatedNullifier}</p>
                        </article>

                        <article className={styles.card}>
                            <p className={styles.sectionTitle}>Privacy guarantees</p>
                            <ul className={styles.list}>
                                <li>1. Your votes are completely anonymous</li>
                                <li>2. No one can link your wallet to your real identity</li>
                                <li>3. Sybil-resistant through Anon Aadhaar</li>
                                <li>4. One person = one vote set</li>
                            </ul>
                        </article>

                        {hasVerifierContract && (
                            <article className={styles.card}>
                                <p className={styles.sectionTitle}>On-chain verification</p>
                                <p className={styles.bodyText}>Contract: {VOTER_REGISTRY_ADDRESS}</p>
                            </article>
                        )}
                    </section>

                    <section className={styles.panel}>
                        <h2 className={styles.sectionTitle}>Funding rounds</h2>
                        <p className={styles.sectionLead}>Participate in quadratic funding rounds.</p>
                        <div className={styles.emptyState}>
                            <p className={styles.muted}>0</p>
                            <h3>No active rounds</h3>
                            <p>There are currently no active funding rounds. Check back later.</p>
                        </div>
                    </section>
                </section>
            </main>
        </ProtectedRoute>
    );
}
