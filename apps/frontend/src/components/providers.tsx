"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";
import { ThemeProvider } from "@/components/theme-provider";

const WalletLayer = dynamic(
    () => import("@/components/wallet-layer").then((mod) => mod.WalletLayer),
    { ssr: false }
);

export function Providers({ children }: { children: ReactNode }): React.JSX.Element {
    return (
        <ThemeProvider>
            <WalletLayer>{children}</WalletLayer>
        </ThemeProvider>
    );
}
