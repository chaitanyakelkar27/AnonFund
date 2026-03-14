"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { initializeWeb3Modal, wagmiConfig } from "@/lib/wagmi";

initializeWeb3Modal();

export function WalletLayer({ children }: { children: ReactNode }): React.JSX.Element {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
    );
}
