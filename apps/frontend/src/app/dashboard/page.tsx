"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import VotingInterface from "@/components/voting-interface";
import styles from "../flow.module.css";

type Submission = {
    name: string;
    category: string;
    requestedEth: string;
};

export default function DashboardPage(): React.JSX.Element {
    const router = useRouter();
    const { loading, isConnected, isVerified, voiceCredits, shortAddress, nullifierSeed, nullifierKey } = useWallet();
    const [hasGeneratedProof, setHasGeneratedProof] = useState(false);
    const [proofChecked, setProofChecked] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [category, setCategory] = useState("Public Goods");
    const [requestedEth, setRequestedEth] = useState("");
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const savedProof = window.localStorage.getItem("user_proof");
        setHasGeneratedProof(Boolean(savedProof));
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

        if (!hasGeneratedProof) {
            router.replace("/register");
        }
    }, [loading, proofChecked, isConnected, hasGeneratedProof, router]);

    const defaultProjects = [
        {
            id: 1,
            owner: "0x0000000000000000000000000000000000000001",
            title: "Community Education Grants",
            description: "Fund open educational resources and local training cohorts.",
            category: "Education",
            requestedFunding: 50e18,
            receivedFunding: 0,
            totalVotes: 0,
            createdAt: Date.now(),
            status: 0,
            metadataURI: ""
        },
        {
            id: 2,
            owner: "0x0000000000000000000000000000000000000002",
            title: "Open Source Security Audits",
            description: "Support independent audits for critical public-good repositories.",
            category: "Security",
            requestedFunding: 75e18,
            receivedFunding: 0,
            totalVotes: 0,
            createdAt: Date.now(),
            status: 0,
            metadataURI: ""
        }
    ];

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!projectName.trim() || !requestedEth.trim()) {
            return;
        }

        setSubmissions((current) => [
            {
                name: projectName.trim(),
                category,
                requestedEth: requestedEth.trim()
            },
            ...current
        ]);

        setProjectName("");
        setRequestedEth("");
    };

    if (loading || !proofChecked || !isConnected || !hasGeneratedProof) {
        return (
            <main className={styles.page}>
                <section className={styles.panel}>
                    <h1>Checking Access</h1>
                    <p className={styles.lead}>Dashboard access is granted only after proof generation.</p>
                </section>
            </main>
        );
    }

    return (
        <main className={styles.page}>
            <section className={styles.panelWide}>
                <div className={styles.topRow}>
                    <div>
                        <p className={styles.eyebrow}>Control Center</p>
                        <h1>Project Submission Dashboard</h1>
                    </div>
                    <div className={styles.walletPill}>{loading ? "Loading..." : shortAddress}</div>
                </div>

                {!isConnected && (
                    <div className={styles.notice}>
                        Wallet not connected. <Link href="/connect">Connect now</Link>.
                    </div>
                )}

                {isConnected && !isVerified && (
                    <div className={styles.notice}>
                        Verification pending. <Link href="/register">Complete registration</Link> to continue.
                    </div>
                )}

                <div className={styles.kpiGrid}>
                    <article className={styles.kpiCard}>
                        <span>Verification Status</span>
                        <strong>{isVerified ? "Eligible" : "Locked"}</strong>
                    </article>
                    <article className={styles.kpiCard}>
                        <span>Voice Credits</span>
                        <strong>{voiceCredits}</strong>
                    </article>
                    <article className={styles.kpiCard}>
                        <span>Nullifier Seed</span>
                        <strong>{nullifierSeed ?? "-"}</strong>
                    </article>
                    <article className={styles.kpiCard}>
                        <span>Nullifier Key</span>
                        <strong>{nullifierKey ? `${nullifierKey.slice(0, 10)}...` : "-"}</strong>
                    </article>
                </div>

                <div className={styles.tableWrap}>
                    <h2>Submit Project</h2>
                    <form onSubmit={handleSubmit} className={styles.projectForm}>
                        <label>
                            Project Name
                            <input
                                value={projectName}
                                onChange={(event) => setProjectName(event.target.value)}
                                placeholder="Open Source Grants"
                                disabled={!isVerified}
                            />
                        </label>
                        <label>
                            Category
                            <select value={category} onChange={(event) => setCategory(event.target.value)} disabled={!isVerified}>
                                <option>Public Goods</option>
                                <option>Education</option>
                                <option>Infrastructure</option>
                                <option>Security</option>
                            </select>
                        </label>
                        <label>
                            Requested (ETH)
                            <input
                                value={requestedEth}
                                onChange={(event) => setRequestedEth(event.target.value)}
                                placeholder="100"
                                disabled={!isVerified}
                            />
                        </label>
                        <button type="submit" disabled={!isVerified} className={styles.primary}>
                            Submit Project
                        </button>
                    </form>

                    <h2>Submitted Projects</h2>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Category</th>
                                <th>Requested</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.length === 0 && (
                                <tr>
                                    <td colSpan={3}>No projects submitted yet.</td>
                                </tr>
                            )}
                            {submissions.map((project) => (
                                <tr key={`${project.name}-${project.requestedEth}`}>
                                    <td>{project.name}</td>
                                    <td>{project.category}</td>
                                    <td>{project.requestedEth} ETH</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {isVerified && <VotingInterface projects={defaultProjects} />}
                </div>
            </section>
        </main>
    );
}
