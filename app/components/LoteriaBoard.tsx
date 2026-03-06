"use client";

import React from 'react';
import { useGame } from '@/app/context/GameContext';
import { CardItem } from './CardItem';

export const LoteriaBoard: React.FC = () => {
    const { playerBoard, markedCards, toggleMarkCard, generateNewBoard, gameState } = useGame();

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Board title */}
            <div className="flex items-center justify-between w-full px-1">
                <h3 className="text-white font-black uppercase tracking-widest text-sm">Mi Tabla</h3>
                {gameState === 'idle' && (
                    <button
                        onClick={generateNewBoard}
                        className="text-[#E91E63] hover:text-pink-300 text-xs font-bold transition-colors flex items-center gap-1"
                    >
                        🔀 Nueva Tabla
                    </button>
                )}
            </div>

            {/* 4x4 Board */}
            <div className="bg-[#5D2E0C] p-3 rounded-2xl shadow-2xl border-4 border-[#3e1a04]">
                <div className="grid grid-cols-4 gap-1.5">
                    {playerBoard.map((card, index) => (
                        <CardItem
                            key={`board-${card.id}-${index}`}
                            card={card}
                            size="md"
                            isMarked={markedCards.includes(card.id)}
                            onClick={() => toggleMarkCard(card.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Marked count */}
            <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span>
                {markedCards.length} / 16 marcadas
            </div>
        </div>
    );
};
