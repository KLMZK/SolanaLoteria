"use client";

import React from 'react';
import { LoteriaCard } from '@/app/lib/cards';

interface CardItemProps {
    card: LoteriaCard;
    isMarked?: boolean;
    onClick?: () => void;
    size?: 'sm' | 'md' | 'lg';
}

export const CardItem: React.FC<CardItemProps> = ({ card, isMarked, onClick, size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-16 h-24 text-[9px]',
        md: 'w-24 h-36 text-xs',
        lg: 'w-44 h-64 text-base'
    };

    return (
        <div
            onClick={onClick}
            className={`
        ${sizeClasses[size]} 
        relative cursor-pointer rounded-lg overflow-hidden border-2 
        ${isMarked ? 'border-yellow-400 shadow-yellow-400/40' : 'border-white/20'} 
        bg-white shadow-xl transition-all duration-200 hover:scale-105 hover:-translate-y-1
      `}
        >
            {/* Number */}
            <div className="absolute top-1 left-1.5 font-black text-gray-800 z-10 leading-none text-[8px]">
                {card.id}
            </div>

            {/* Card Body */}
            <div className="flex flex-col h-full">
                <div className="flex-1 bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-1">
                    <div className="text-center">
                        <div className="text-2xl leading-none">
                            {getCardEmoji(card.id)}
                        </div>
                    </div>
                </div>
                <div className="bg-[#E91E63] flex items-center justify-center py-1 px-0.5">
                    <span className="text-white font-bold uppercase tracking-tight text-center leading-tight truncate w-full text-center"
                        style={{ fontSize: size === 'lg' ? '10px' : '7px' }}>
                        {card.name}
                    </span>
                </div>
            </div>

            {/* Marked overlay (frijolito) */}
            {isMarked && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-lg opacity-85 flex items-center justify-center text-white text-xs">
                        ●
                    </div>
                </div>
            )}
        </div>
    );
};

function getCardEmoji(id: number): string {
    const emojis: Record<number, string> = {
        1: '🐓', 2: '😈', 3: '👩', 4: '🎩', 5: '☂️',
        6: '🧜', 7: '🪜', 8: '🍾', 9: '🪣', 10: '🌳',
        11: '🍈', 12: '🗡️', 13: '🎓', 14: '💀', 15: '🍐',
        16: '🚩', 17: '🪕', 18: '🎻', 19: '🦢', 20: '🐦',
        21: '✋', 22: '👢', 23: '🌙', 24: '🦜', 25: '🍺',
        26: '🧑', 27: '❤️', 28: '🍉', 29: '🥁', 30: '🦐',
        31: '🏹', 32: '🎵', 33: '🕷️', 34: '💂', 35: '⭐',
        36: '🍳', 37: '🌍', 38: '🪶', 39: '🌵', 40: '🦂',
        41: '🌹', 42: '💀', 43: '🔔', 44: '🫙', 45: '🦌',
        46: '☀️', 47: '👑', 48: '🚣', 49: '🌲', 50: '🐟',
        51: '🌴', 52: '🪴', 53: '🎵', 54: '🐸',
    };
    return emojis[id] || '🎴';
}
