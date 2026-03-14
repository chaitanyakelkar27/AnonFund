"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { initializeWeb3Modal, openWalletModal } from "@/lib/wagmi";

initializeWeb3Modal();

type VerificationState = {
    isVerified: boolean;
    voiceCredits: number;
    nullifierSeed: string | null;
    nullifierKey: string | null;
};

type UseWalletResult = VerificationState & {
    isConnected: boolean;
    address: string | null;
    loading: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    markVerified: () => void;
    setVerificationData: (data: { nullifierSeed: string; nullifierKey: string }) => void;
    shortAddress: string;
    openConnectModal: () => Promise<void>;
};

const STORAGE_KEY = "anonfund.wallet.verification";

const initialState: VerificationState = {
    isVerified: false,
    voiceCredits: 0,
    nullifierSeed: null,
    nullifierKey: null
};

export function useWallet(): UseWalletResult {
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const { connectAsync, connectors } = useConnect();

    const [state, setState] = useState<VerificationState>(initialState);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!address) {
            setState(initialState);
            setLoading(false);
            return;
        }

        try {
            const raw = window.localStorage.getItem(`${STORAGE_KEY}.${address.toLowerCase()}`);
            if (raw) {
                const parsed = JSON.parse(raw) as Partial<VerificationState>;
                setState({ ...initialState, ...parsed });
            } else {
                setState(initialState);
            }
        } catch {
            setState(initialState);
        } finally {
            setLoading(false);
        }
    }, [address]);

    useEffect(() => {
        if (loading || !address) {
            return;
        }

        window.localStorage.setItem(`${STORAGE_KEY}.${address.toLowerCase()}`, JSON.stringify(state));
    }, [state, loading, address]);

    const connect = useCallback(async () => {
        const opened = await openWalletModal();

        if (opened) {
            return;
        }

        const injectedConnector = connectors.find((connector) => connector.type === "injected") ?? connectors[0];

        if (!injectedConnector) {
            throw new Error("No wallet connector available. Install MetaMask or add a wallet connector.");
        }

        await connectAsync({ connector: injectedConnector });
    }, [connectAsync, connectors]);

    const openConnectModal = useCallback(async () => {
        await connect();
    }, [connect]);

    const handleDisconnect = useCallback(() => {
        disconnect();
    }, [disconnect]);

    const markVerified = useCallback(() => {
        setState((current) => ({
            ...current,
            isVerified: true,
            voiceCredits: Math.max(current.voiceCredits, 100)
        }));
    }, []);

    const setVerificationData = useCallback((data: { nullifierSeed: string; nullifierKey: string }) => {
        setState((current) => ({
            ...current,
            isVerified: true,
            voiceCredits: Math.max(current.voiceCredits, 100),
            nullifierSeed: data.nullifierSeed,
            nullifierKey: data.nullifierKey
        }));
    }, []);

    const shortAddress = useMemo(() => {
        if (loading || !address) {
            return "Not connected";
        }

        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }, [loading, address]);

    const effectiveIsConnected = !loading && isConnected;
    const effectiveAddress = !loading && address ? address : null;

    return {
        ...state,
        isConnected: effectiveIsConnected,
        address: effectiveAddress,
        loading,
        connect,
        disconnect: handleDisconnect,
        markVerified,
        setVerificationData,
        shortAddress,
        openConnectModal
    };
}
