import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const appFont = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-base"
});

export const metadata: Metadata = {
    title: "AnonFund",
    description: "AnonFund decentralized funding platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={appFont.variable}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
