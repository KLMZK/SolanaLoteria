"use client";

import React, { useState } from 'react';

export const Header: React.FC = () => {
    const [connected, setConnected] = useState(false);
    const [address] = useState('8Kp3...xFz2');

    return (
        <header className="w-full py-5 px-8 flex justify-between items-center relative z-50">
            {/* Logo */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#E91E63] rounded-full border-2 border-white/30 flex items-center justify-center text-2xl shadow-lg shadow-pink-500/30">
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

            {/* Wallet button */}
            <div className="flex items-center gap-3">
                {connected ? (
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:block bg-white/10 text-white/70 text-xs font-mono px-3 py-2 rounded-lg border border-white/10">
                            {address}
                        </span>
                        <button
                            onClick={() => setConnected(false)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold py-2 px-4 rounded-xl transition-all text-sm"
                        >
                            Desconectar
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setConnected(true)}
                        className="bg-[#E91E63] hover:bg-[#C2185B] active:scale-95 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-pink-500/30 text-sm flex items-center gap-2"
                    >
                        <span>🔗</span> Conectar Wallet
                    </button>
                )}
            </div>
        </header>
    );
};
