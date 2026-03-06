"use client";

import { Header } from './components/Header';
import { LoteriaBoard } from './components/LoteriaBoard';
import { Caller } from './components/Caller';
import { useGame } from './context/GameContext';

export default function Home() {
  const { gameState, markedCards } = useGame();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 flex flex-col lg:flex-row items-start justify-center gap-10 py-6 pb-20">

        {/* Left: Caller machine */}
        <div className="flex flex-col gap-6 w-full lg:w-auto items-center">
          <div className="text-center">
            <h2 className="text-4xl font-black text-white mb-1">¡LOTERÍA!</h2>
            <p className="text-white/40 text-sm max-w-xs">
              Conecta tu wallet de Solana (Devnet) y juega con tus amigos.
            </p>
          </div>

          <Caller />

          {/* Prize pool display */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full max-w-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/50 text-xs uppercase tracking-wider">Premio Acumulado</span>
              <span className="text-yellow-400 font-black text-lg">0.5 SOL</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full">
              <div className="bg-gradient-to-r from-[#E91E63] to-cyan-400 h-full rounded-full" style={{ width: '40%' }}></div>
            </div>
            <p className="text-white/30 text-xs mt-2 text-center italic">
              La apuesta se maneja por smart contract en Devnet
            </p>
          </div>
        </div>

        {/* Right: Player board */}
        <div className="flex flex-col items-center gap-6 w-full lg:w-auto">
          <LoteriaBoard />

          {/* Win condition hint */}
          {markedCards.length >= 4 && gameState === 'playing' && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-yellow-400 text-sm font-bold text-center animate-pulse">
              🎉 ¡Vas bien! Completa una línea y grita LOTERÍA
            </div>
          )}
        </div>
      </main>

      {/* Decorative background dots */}
      <div
        className="fixed inset-0 -z-50 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />
    </div>
  );
}
