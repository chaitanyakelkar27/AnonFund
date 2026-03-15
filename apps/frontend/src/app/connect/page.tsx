"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { ModeToggle } from "@/components/mode-toggle";
import styles from "../flow.module.css";

export default function ConnectPage(): React.JSX.Element {
    const { loading, isConnected, shortAddress, connect, disconnect, isVerified, openConnectModal } = useWallet();
    const attemptedAutoOpen = useRef(false);

    useEffect(() => {
        if (attemptedAutoOpen.current || loading || isConnected) {
            return;
        }

        attemptedAutoOpen.current = true;

        void openConnectModal().catch(() => {
            // Keep UI usable even if auto-open fails; user can click Connect Wallet manually.
        });
    }, [loading, isConnected, openConnectModal]);

    return (
        <main className={styles.page}>
            <nav className={styles.flowNav}>
                <Link href="/" className={styles.brand}>
                    <span className={styles.brandMark}>A</span>
                    <span>AnonFund</span>
                </Link>
                <div className={styles.flowNavActions}>
                    <Link href="/" className={styles.navLink}>← Home</Link>
                    <ModeToggle className={styles.themeBtn} />
                </div>
            </nav>

            <section className={styles.centeredPanel}>
                <div className={styles.shieldIcon} aria-hidden="true">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                </div>
                <h1 className={styles.panelHeading}>Connect Your Wallet</h1>
                <p className={styles.panelSub}>Connect your wallet to access the AnonFund platform</p>

                {!isConnected && (
                    <button type="button" onClick={() => void connect()} disabled={loading} className={styles.primaryCenter}>
                        Connect Wallet
                    </button>
                )}

                {isConnected && (
                    <div className={styles.statusBox}>
                        <span>Status</span>
                        <strong>Connected</strong>
                        <code>{shortAddress}</code>
                    </div>
                )}

                {isConnected && !isVerified && (
                    <div className={styles.notice}>
                        Anon Aadhaar verification is required before voting. <Link href="/register">Verify now</Link>.
                    </div>
                )}

                {isConnected && isVerified && (
                    <div className={styles.notice}>
                        Wallet connected and Anon Aadhaar verified. <Link href="/dashboard">Continue to dashboard</Link>.
                    </div>
                )}

                {isConnected && (
                    <div className={styles.actions}>
                        <button type="button" onClick={() => void connect()} disabled={loading || isConnected} className={styles.primary}>
                            Connect Wallet
                        </button>
                        <button type="button" onClick={disconnect} disabled={loading || !isConnected} className={styles.ghost}>
                            Disconnect
                        </button>
                        <Link href="/register" className={styles.secondary} aria-disabled={!isConnected}>
                            Continue To Verify
                        </Link>
                    </div>
                )}

                <h3 className={styles.whyTitle}>Why connect your wallet?</h3>
                <ul className={styles.benefitList}>
                    <li>Register as a verified voter with Anon Aadhaar</li>
                    <li>Participate in quadratic funding rounds</li>
                    <li>Vote anonymously on project proposals</li>
                    <li>Submit your own projects for funding</li>
                </ul>

                <div className={styles.privacyNotice}>
                    <strong>Privacy Notice:</strong> Your wallet address is used only for authentication. All votes are completely anonymous through zero-knowledge proofs.
                </div>
            </section>
        </main>
    );
}
