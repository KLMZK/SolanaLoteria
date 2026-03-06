"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";

// ── Types ────────────────────────────────────────────────────────────────────

interface PhantomProvider {
    publicKey: PublicKey | null;
    isConnected: boolean;
    connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>;
    disconnect: () => Promise<void>;
    signTransaction: (tx: Transaction) => Promise<Transaction>;
    signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
    on: (event: string, handler: (args: unknown) => void) => void;
    off: (event: string, handler: (args: unknown) => void) => void;
}

export interface WalletContextState {
    connected: boolean;
    connecting: boolean;
    publicKey: PublicKey | null;
    balance: number | null; // SOL balance on devnet
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    placeBet: (lamports: number, recipient: string) => Promise<string | null>;
    error: string | null;
}

// ── Context ──────────────────────────────────────────────────────────────────

const WalletContext = createContext<WalletContextState | undefined>(undefined);

const DEVNET_ENDPOINT = clusterApiUrl("devnet");

// ── Provider ─────────────────────────────────────────────────────────────────

export function WalletContextProvider({ children }: { children: ReactNode }) {
    const [provider, setProvider] = useState<PhantomProvider | null>(null);
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const connection = new Connection(DEVNET_ENDPOINT, "confirmed");

    // Detect Phantom on mount
    useEffect(() => {
        if (typeof window === "undefined") return;

        const phantom = (window as unknown as { solana?: PhantomProvider }).solana;
        if (phantom?.isConnected !== undefined) {
            setProvider(phantom);
        }

        // Also try eager connect if already trusted
        const tryEagerConnect = async () => {
            try {
                if (phantom) {
                    const resp = await phantom.connect({ onlyIfTrusted: true });
                    setPublicKey(resp.publicKey);
                    setConnected(true);
                }
            } catch {
                // Not previously approved — silent fail, user needs to click connect
            }
        };
        tryEagerConnect();
    }, []);

    // Fetch balance whenever publicKey changes
    useEffect(() => {
        if (!publicKey) { setBalance(null); return; }
        const fetchBalance = async () => {
            try {
                const lamports = await connection.getBalance(publicKey);
                setBalance(lamports / LAMPORTS_PER_SOL);
            } catch {
                setBalance(null);
            }
        };
        fetchBalance();
        const id = setInterval(fetchBalance, 15000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicKey]);

    const connect = useCallback(async () => {
        setError(null);
        const phantom = (window as unknown as { solana?: PhantomProvider }).solana;
        if (!phantom) {
            setError("Phantom no está instalado. Visita https://phantom.app");
            return;
        }
        setConnecting(true);
        try {
            const resp = await phantom.connect();
            setProvider(phantom);
            setPublicKey(resp.publicKey);
            setConnected(true);
        } catch (e) {
            setError("Conexión cancelada.");
        } finally {
            setConnecting(false);
        }
    }, []);

    const disconnect = useCallback(async () => {
        if (!provider) return;
        await provider.disconnect();
        setConnected(false);
        setPublicKey(null);
        setBalance(null);
    }, [provider]);

    /**
     * Send SOL on Devnet.
     * Returns the transaction signature, or null if it failed.
     */
    const placeBet = useCallback(
        async (lamports: number, recipient: string): Promise<string | null> => {
            if (!provider || !publicKey) { setError("Wallet no conectada."); return null; }
            setError(null);
            try {
                const toPublicKey = new PublicKey(recipient);
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

                const tx = new Transaction({
                    recentBlockhash: blockhash,
                    feePayer: publicKey,
                }).add(
                    SystemProgram.transfer({
                        fromPubkey: publicKey,
                        toPubkey: toPublicKey,
                        lamports,
                    })
                );

                const signed = await provider.signTransaction(tx);
                const sig = await connection.sendRawTransaction(signed.serialize());
                await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
                return sig;
            } catch (e: unknown) {
                setError((e as Error).message ?? "Error al enviar la transacción");
                return null;
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [provider, publicKey]
    );

    return (
        <WalletContext.Provider value={{ connected, connecting, publicKey, balance, connect, disconnect, placeBet, error }}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error("useWallet must be inside WalletContextProvider");
    return ctx;
}
