"use client";

import React from 'react';
import { useGame } from '@/app/context/GameContext';
import { CardItem } from './CardItem';

export const Caller: React.FC = () => {
    const { currentCard, drawnCards, gameState, startGame, resetGame, deck } = useGame();

    return (
        <div className="flex flex-col items-center gap-6 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white uppercase tracking-[0.2em]">🎴 El Cantor</h2>

            {/* Current Card Display */}
            <div className="relative h-64 flex items-center justify-center w-full">
                {currentCard ? (
                    <div className="animate-[fadeIn_0.4s_ease-out]">
                        <CardItem card={currentCard} size="lg" />
                    </div>
                ) : (
                    <div className="w-44 h-64 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center text-white/30 italic text-center px-4 text-sm">
                        {gameState === 'idle'
                            ? '¡Presiona comenzar!'
                            : 'Sacando carta...'}
                    </div>
                )}

                {/* Stack effect behind */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 -z-10 w-44 h-64 bg-white/10 rounded-lg scale-95"></div>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 -z-20 w-44 h-64 bg-white/5 rounded-lg scale-90"></div>
            </div>

            {/* Stats */}
            {gameState === 'playing' && (
                <div className="flex gap-6 text-center text-sm">
                    <div>
                        <div className="text-2xl font-black text-white">{drawnCards.length}</div>
                        <div className="text-white/40 text-xs">Cantadas</div>
                    </div>
                    <div className="w-px bg-white/10"></div>
                    <div>
                        <div className="text-2xl font-black text-white">{deck.length}</div>
                        <div className="text-white/40 text-xs">Restantes</div>
                    </div>
                </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 w-full">
                {gameState === 'idle' ? (
                    <button
                        onClick={startGame}
                        className="w-full bg-[#E91E63] hover:bg-[#C2185B] active:scale-95 text-white font-black py-4 px-8 rounded-xl transition-all shadow-lg shadow-pink-500/30 uppercase tracking-wider"
                    >
                        🎮 Comenzar Juego
                    </button>
                ) : gameState === 'ended' ? (
                    <button
                        onClick={resetGame}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-black font-black py-4 rounded-xl transition-all uppercase tracking-wider"
                    >
                        🔄 Jugar de Nuevo
                    </button>
                ) : (
                    <button
                        onClick={resetGame}
                        className="w-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold py-3 rounded-xl transition-all text-sm"
                    >
                        ✕ Terminar Partida
                    </button>
                )}
            </div>

            {/* History */}
            {drawnCards.length > 1 && (
                <div className="w-full">
                    <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Historial</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {drawnCards.slice(1, 8).map((card, i) => (
                            <div key={i} className="opacity-40 flex-shrink-0 scale-75 origin-left">
                                <CardItem card={card} size="sm" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
