"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnonAadhaarProvider } from "@anon-aadhaar/react/dist/index.js";
import { WagmiProvider } from "wagmi";
import { initializeWeb3Modal, wagmiConfig } from "@/lib/wagmi";

initializeWeb3Modal();

export function Providers({ children }: { children: ReactNode }): React.JSX.Element {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <AnonAadhaarProvider _appName="AnonFund" _useTestAadhaar={true}>
                    {children}
                </AnonAadhaarProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
