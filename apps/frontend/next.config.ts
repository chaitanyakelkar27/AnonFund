import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@anon-aadhaar/react', 'snarkjs', '@noble/curves'],
    webpack: (config, { isServer }) => {
        // Suppress "Critical dependency: the request of a dependency is an expression"
        // warnings from snarkjs / web-worker used by anon-aadhaar
        config.module.exprContextCritical = false;

        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }

        return config;
    },
};

export default nextConfig;
