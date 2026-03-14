"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/use-wallet";
import styles from "../flow.module.css";

const proposals = [
    { title: "Open Source Security Grants", requested: "120 ETH", category: "Security", supporters: 142 },
    { title: "Public Goods Education Program", requested: "80 ETH", category: "Education", supporters: 97 },
    { title: "Civic Data Infrastructure", requested: "140 ETH", category: "Data", supporters: 118 }
];

export default function DashboardPage(): React.JSX.Element {
    const { loading, isConnected, isVerified, voiceCredits, shortAddress } = useWallet();

    return (
        <main className={styles.page}>
            <section className={styles.panelWide}>
                <div className={styles.topRow}>
                    <div>
                        <p className={styles.eyebrow}>Control Center</p>
                        <h1>Funding Dashboard</h1>
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
                        Verification pending. <Link href="/register">Complete registration</Link> to vote.
                    </div>
                )}

                <div className={styles.kpiGrid}>
                    <article className={styles.kpiCard}>
                        <span>Voting Status</span>
                        <strong>{isVerified ? "Eligible" : "Locked"}</strong>
                    </article>
                    <article className={styles.kpiCard}>
                        <span>Voice Credits</span>
                        <strong>{voiceCredits}</strong>
                    </article>
                    <article className={styles.kpiCard}>
                        <span>Active Rounds</span>
                        <strong>3</strong>
                    </article>
                    <article className={styles.kpiCard}>
                        <span>Total Pool</span>
                        <strong>1,500 ETH</strong>
                    </article>
                </div>

                <div className={styles.tableWrap}>
                    <h2>Active Proposals</h2>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Category</th>
                                <th>Requested</th>
                                <th>Supporters</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {proposals.map((proposal) => (
                                <tr key={proposal.title}>
                                    <td>{proposal.title}</td>
                                    <td>{proposal.category}</td>
                                    <td>{proposal.requested}</td>
                                    <td>{proposal.supporters}</td>
                                    <td>
                                        <button type="button" disabled={!isVerified} className={styles.voteBtn}>
                                            Allocate
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
