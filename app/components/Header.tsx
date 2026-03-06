"use client";

import React, { useEffect, useState } from 'react';
import { useWallet } from '@/app/context/WalletContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export const Header: React.FC = () => {
    const { connected, connecting, publicKey, balance, connect, disconnect, error } = useWallet();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const shortAddress = publicKey
        ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
        : null;

    return (
        <header className="w-full py-5 px-8 flex justify-between items-center relative z-50">
            {/* Logo */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#E91E63] rounded-full border-2 border-white/30 flex items-center justify-center text-2xl shadow-lg shadow-pink-500/30 select-none">
                    🎴
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white leading-none tracking-tighter">
                        SOLANA <span className="text-[#E91E63]">LOTERÍA</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <p className="text-xs text-cyan-400 font-bold tracking-widest uppercase">Devnet</p>
                    </div>
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {error && (
                    <span className="hidden md:block text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg max-w-xs truncate">
                        ⚠ {error}
                    </span>
                )}

                {/* Supabase Auth */}
                {user ? (
                    <div className="flex items-center gap-3 border-r border-white/20 pr-4 mr-1">
                        <span className="hidden sm:block text-white/70 text-xs font-mono px-3 py-2">
                            {user.email}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-white/50 hover:text-white transition-colors text-sm font-bold active:scale-95"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 border-r border-white/20 pr-4 mr-1">
                        <Link href="/login" className="text-white hover:text-cyan-400 transition-colors text-sm font-bold">
                            Log In
                        </Link>
                        <Link href="/register" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold py-2 px-4 rounded-xl transition-all text-sm active:scale-95">
                            Sign Up
                        </Link>
                    </div>
                )}

                {/* Solana Wallet */}
                {connected && publicKey ? (
                    <div className="flex items-center gap-3">
                        {/* Balance */}
                        {balance !== null && (
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-yellow-400 font-black text-sm leading-none">
                                    {balance.toFixed(4)} SOL
                                </span>
                                <span className="text-white/30 text-[10px] leading-none mt-0.5">Devnet</span>
                            </div>
                        )}

                        {/* Address */}
                        <span className="hidden sm:block bg-white/10 text-white/70 text-xs font-mono px-3 py-2 rounded-lg border border-white/10">
                            {shortAddress}
                        </span>

                        {/* Disconnect */}
                        <button
                            onClick={disconnect}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold py-2 px-4 rounded-xl transition-all text-sm active:scale-95"
                        >
                            Salir
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={connect}
                        disabled={connecting}
                        className={`
              flex items-center gap-2 font-bold py-3 px-6 rounded-xl transition-all text-sm
              ${connecting
                                ? 'bg-white/10 text-white/40 cursor-wait'
                                : 'bg-[#E91E63] hover:bg-[#C2185B] active:scale-95 text-white shadow-lg shadow-pink-500/30'
                            }
            `}
                    >
                        {connecting ? (
                            <>
                                <span className="animate-spin">⟳</span> Conectando...
                            </>
                        ) : (
                            <>👻 Conectar Phantom</>
                        )}
                    </button>
                )}
            </div>
        </header>
    );
};
