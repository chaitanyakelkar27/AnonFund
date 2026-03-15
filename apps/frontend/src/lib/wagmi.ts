"use client";

import { injected, walletConnect } from "wagmi/connectors";
import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";

export const walletConnectProjectId =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

const walletConnectMetadata = {
    name: "AnonFund",
    description: "AnonFund privacy-preserving quadratic funding",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    icons: ["https://avatars.githubusercontent.com/u/37784886"]
};

export const chains = [sepolia] as const;

const connectors = [
    injected(),
    ...(typeof window !== "undefined" && walletConnectProjectId
        ? [
              walletConnect({
                  projectId: walletConnectProjectId,
                  metadata: walletConnectMetadata,
                  showQrModal: false
              })
          ]
        : [])
];

export const wagmiConfig = createConfig({
    chains,
    connectors,
    transports: {
        [sepolia.id]: http()
    }
});

let modalInitialized = false;
let modalInitPromise: Promise<void> | null = null;
let modalInstance: { open: (params?: unknown) => Promise<unknown> } | null = null;

export async function initializeWeb3Modal(): Promise<void> {
    if (typeof window === "undefined" || modalInitialized || !walletConnectProjectId) {
        return;
    }

    if (modalInitPromise) {
        await modalInitPromise;
        return;
    }

    modalInitPromise = (async () => {
        const { createWeb3Modal } = await import("@web3modal/wagmi/react");

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
    })();

    try {
        await modalInitPromise;
    } finally {
        modalInitPromise = null;
    }
}

export async function openWalletModal(): Promise<boolean> {
    await initializeWeb3Modal();

    if (!modalInstance) {
        return false;
    }

    await modalInstance.open();
    return true;
}
