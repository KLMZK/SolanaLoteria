"use client";

import { Header } from './components/Header';
import { LoteriaBoard } from './components/LoteriaBoard';
import { Caller } from './components/Caller';
import { useGame } from './context/GameContext';
import { useWallet } from './context/WalletContext';
import { useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

// Placeholder house address — replace with your smart contract address later
const HOUSE_ADDRESS = "11111111111111111111111111111111";

const BET_OPTIONS = [
  { label: "0.05 SOL", lamports: 0.05 * LAMPORTS_PER_SOL },
  { label: "0.1 SOL", lamports: 0.1 * LAMPORTS_PER_SOL },
  { label: "0.25 SOL", lamports: 0.25 * LAMPORTS_PER_SOL },
];

export default function Home() {
  const { gameState, markedCards, startGame } = useGame();
  const { connected, balance, placeBet } = useWallet();
  const [betAmount, setBetAmount] = useState(BET_OPTIONS[0].lamports);
  const [betTx, setBetTx] = useState<string | null>(null);
  const [betLoading, setBetLoading] = useState(false);
  const [betError, setBetError] = useState<string | null>(null);

  const handleStartWithBet = async () => {
    setBetError(null);
    setBetTx(null);
    setBetLoading(true);
    try {
      const sig = await placeBet(betAmount, HOUSE_ADDRESS);
      if (sig) {
        setBetTx(sig);
        startGame();
      } else {
        setBetError("La apuesta falló o fue cancelada.");
      }
    } finally {
      setBetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1a1a2e', color: 'white', backgroundImage: 'radial-gradient(at 0% 0%, rgba(233,30,99,0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(0,188,212,0.10) 0px, transparent 50%)' }}>
      <Header />

      <main className="flex-1 container mx-auto px-4 flex flex-col lg:flex-row items-start justify-center gap-10 py-6 pb-24">

        {/* Left column */}
        <div className="flex flex-col gap-6 w-full lg:w-auto items-center">
          <div className="text-center">
            <h2 className="text-4xl font-black text-white mb-1">¡LOTERÍA!</h2>
            <p className="text-white/40 text-sm max-w-xs">
              La lotería mexicana tradicional en Solana Devnet.
            </p>
          </div>

          <Caller />

          {/* Bet Panel */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full max-w-sm" style={{ backdropFilter: 'blur(12px)' }}>
            <p className="text-white/60 text-xs uppercase tracking-widest mb-3 font-bold">💰 Tu Apuesta</p>

            {!connected ? (
              <div className="text-center py-4">
                <p className="text-white/40 text-sm mb-1">Conecta Phantom para apostar</p>
                <a
                  href="https://faucet.solana.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-2 text-cyan-400 hover:text-cyan-300 text-xs underline"
                >
                  Obtener SOL gratis en Devnet →
                </a>
              </div>
            ) : gameState === 'idle' ? (
              <>
                <div className="flex gap-2 mb-4">
                  {BET_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setBetAmount(opt.lamports)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${betAmount === opt.lamports
                          ? 'bg-[#E91E63] border-[#E91E63] text-white shadow-lg'
                          : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {balance !== null && balance < betAmount / LAMPORTS_PER_SOL && (
                  <p className="text-red-400 text-xs mb-3 text-center">
                    ⚠ Balance insuficiente ({balance.toFixed(4)} SOL)
                  </p>
                )}

                {betError && (
                  <p className="text-red-400 text-xs mb-3 text-center bg-red-500/10 rounded-lg p-2">{betError}</p>
                )}

                <button
                  onClick={handleStartWithBet}
                  disabled={betLoading || (balance !== null && balance < betAmount / LAMPORTS_PER_SOL)}
                  className="w-full bg-[#E91E63] hover:bg-[#C2185B] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-all uppercase tracking-wider text-sm"
                >
                  {betLoading ? '⏳ Firmando en Phantom...' : `🎮 Apostar y Comenzar`}
                </button>

                <p className="text-white/20 text-[10px] mt-2 text-center">
                  Transacción en Solana Devnet
                </p>
              </>
            ) : (
              <div>
                {betTx && (
                  <div className="mb-3">
                    <p className="text-green-400 text-xs font-bold mb-1">✅ Apuesta confirmada</p>
                    <a
                      href={`https://solscan.io/tx/${betTx}?cluster=devnet`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 text-[10px] font-mono hover:underline break-all"
                    >
                      {betTx.slice(0, 20)}...{betTx.slice(-8)}
                    </a>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-xs">Premio estimado</span>
                  <span className="text-yellow-400 font-black">
                    {(betAmount / LAMPORTS_PER_SOL * 1.8).toFixed(3)} SOL
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: board */}
        <div className="flex flex-col items-center gap-6 w-full lg:w-auto">
          <LoteriaBoard />

          {markedCards.length >= 4 && gameState === 'playing' && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-yellow-400 text-sm font-bold text-center">
              🎉 ¡Vas bien! Completa una línea y grita LOTERÍA
            </div>
          )}
        </div>
      </main>

      {/* Dot grid background */}
      <div
        className="fixed inset-0 -z-50 pointer-events-none"
        style={{ opacity: 0.03, backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />
    </div>
  );
}
