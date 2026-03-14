"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useWallet } from "@/hooks/use-wallet";
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
            <section className={styles.panel}>
                <p className={styles.eyebrow}>Step 1</p>
                <h1>Connect Your Wallet</h1>
                <p className={styles.lead}>
                    Start by connecting your wallet to enter the AnonFund private funding flow.
                </p>

                <div className={styles.statusBox}>
                    <span>Status</span>
                    <strong>{loading ? "Checking wallet..." : isConnected ? "Connected" : "Disconnected"}</strong>
                    <code>{loading ? "-" : shortAddress}</code>
                </div>

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

                <div className={styles.actions}>
                    <button type="button" onClick={() => void connect()} disabled={loading || isConnected} className={styles.primary}>
                        Connect Wallet
                    </button>
                    <button type="button" onClick={disconnect} disabled={loading || !isConnected} className={styles.ghost}>
                        Disconnect
                    </button>
                    <Link href="/register" className={styles.secondary} aria-disabled={!isConnected}>
                        Continue To Verification
                    </Link>
                </div>
            </section>
        </main>
    );
}
