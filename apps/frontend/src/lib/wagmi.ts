"use client";

import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi/react";
import { sepolia } from "wagmi/chains";

export const appName = "AnonFund";

export const walletConnectProjectId =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

const metadata = {
    name: appName,
    description: "AnonFund privacy-preserving quadratic funding",
    url: "http://localhost:3000",
    icons: ["https://avatars.githubusercontent.com/u/37784886"]
};

export const chains = [sepolia] as const;

export const wagmiConfig = defaultWagmiConfig({
    chains,
    projectId: walletConnectProjectId,
    metadata,
    enableCoinbase: true,
    enableEIP6963: true,
    enableInjected: true,
    enableWalletConnect: true
});

let modalInitialized = false;
let modalInstance: { open: (params?: unknown) => Promise<unknown> } | null = null;

export function initializeWeb3Modal(): void {
    if (typeof window === "undefined" || modalInitialized || !walletConnectProjectId) {
        return;
    }

    const created = createWeb3Modal({
        wagmiConfig,
        projectId: walletConnectProjectId,
        themeMode: "dark",
        themeVariables: {
            "--w3m-accent": "#2d6cff"
        }
    });

    modalInstance = created as unknown as { open: (params?: unknown) => Promise<unknown> };

    modalInitialized = true;
}

export async function openWalletModal(): Promise<boolean> {
    initializeWeb3Modal();

    if (!modalInstance) {
        return false;
    }

    await modalInstance.open();
    return true;
}
