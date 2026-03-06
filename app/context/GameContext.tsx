"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LOTERIA_CARDS, LoteriaCard } from '@/app/lib/cards';

interface GameContextType {
    deck: LoteriaCard[];
    drawnCards: LoteriaCard[];
    currentCard: LoteriaCard | null;
    playerBoard: LoteriaCard[];
    gameState: 'idle' | 'playing' | 'ended';
    drawNextCard: () => void;
    startGame: () => void;
    resetGame: () => void;
    generateNewBoard: () => void;
    markedCards: number[]; // IDs of cards marked on the board
    toggleMarkCard: (cardId: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [deck, setDeck] = useState<LoteriaCard[]>([]);
    const [drawnCards, setDrawnCards] = useState<LoteriaCard[]>([]);
    const [currentCard, setCurrentCard] = useState<LoteriaCard | null>(null);
    const [playerBoard, setPlayerBoard] = useState<LoteriaCard[]>([]);
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
    const [markedCards, setMarkedCards] = useState<number[]>([]);

    const shuffle = (array: any[]) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const generateNewBoard = useCallback(() => {
        const shuffled = shuffle(LOTERIA_CARDS);
        setPlayerBoard(shuffled.slice(0, 16));
        setMarkedCards([]);
    }, []);

    const startGame = () => {
        setDeck(shuffle(LOTERIA_CARDS));
        setDrawnCards([]);
        setCurrentCard(null);
        setGameState('playing');
        setMarkedCards([]);
    };

    const drawNextCard = useCallback(() => {
        if (deck.length === 0 || gameState !== 'playing') return;

        const nextCard = deck[0];
        const remainingDeck = deck.slice(1);

        setDeck(remainingDeck);
        setDrawnCards(prev => [nextCard, ...prev]);
        setCurrentCard(nextCard);

        if (remainingDeck.length === 0) {
            setGameState('ended');
        }
    }, [deck, gameState]);

    const resetGame = () => {
        setGameState('idle');
        setDrawnCards([]);
        setCurrentCard(null);
        setMarkedCards([]);
    };

    const toggleMarkCard = (cardId: number) => {
        if (gameState !== 'playing') return;

        setMarkedCards(prev =>
            prev.includes(cardId)
                ? prev.filter(id => id !== cardId)
                : [...prev, cardId]
        );
    };

    // Automatically draw cards every 3 seconds if playing
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === 'playing' && deck.length > 0) {
            interval = setInterval(() => {
                drawNextCard();
            }, 3500);
        }
        return () => clearInterval(interval);
    }, [gameState, deck, drawNextCard]);

    // Generate initial board
    useEffect(() => {
        generateNewBoard();
    }, [generateNewBoard]);

    return (
        <GameContext.Provider value={{
            deck,
            drawnCards,
            currentCard,
            playerBoard,
            gameState,
            drawNextCard,
            startGame,
            resetGame,
            generateNewBoard,
            markedCards,
            toggleMarkCard
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};
