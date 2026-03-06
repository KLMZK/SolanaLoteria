"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LOTERIA_CARDS } from "@/app/lib/cards";
import Link from "next/link";

type GameData = {
    id: string;
    lobby_code: string | null;
    status: string;
    drawn_card_ids: number[] | null;
    deck_card_ids: number[] | null;
    host_id: string | null;
    max_players: number | null;
};

type PlayerRow = {
    id: string;
    player_id: string;
    board_card_ids: number[];
    marked_card_ids: number[] | null;
    has_won: boolean | null;
};

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const cardById = Object.fromEntries(LOTERIA_CARDS.map((c) => [c.id, c]));

export default function GameRoom({ params }: { params: { id: string } }) {
    const router = useRouter();
    const gameId = params.id;
    const [user, setUser] = useState<any>(null);
    const [game, setGame] = useState<GameData | null>(null);
    const [myPlayer, setMyPlayer] = useState<PlayerRow | null>(null);
    const [players, setPlayers] = useState<PlayerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawing, setDrawing] = useState(false);
    const [winner, setWinner] = useState<PlayerRow | null>(null);

    // Get current user
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) router.push("/login");
            else setUser(session.user);
        });
    }, [router]);

    // Load game and players
    const fetchGame = useCallback(async () => {
        const { data } = await supabase
            .from("games")
            .select("id, lobby_code, status, drawn_card_ids, deck_card_ids, host_id, max_players")
            .eq("id", gameId)
            .single();
        if (data) setGame(data);
    }, [gameId]);

    const fetchPlayers = useCallback(async () => {
        const { data } = await supabase
            .from("game_players")
            .select("id, player_id, board_card_ids, marked_card_ids, has_won")
            .eq("game_id", gameId);
        if (data) {
            setPlayers(data);
            const won = data.find((p) => p.has_won);
            if (won) setWinner(won);
        }
    }, [gameId]);

    useEffect(() => {
        if (!user) return;
        const init = async () => {
            await Promise.all([fetchGame(), fetchPlayers()]);
            setLoading(false);
        };
        init();
    }, [user, fetchGame, fetchPlayers]);

    // Sync myPlayer
    useEffect(() => {
        if (user) setMyPlayer(players.find((p) => p.player_id === user.id) ?? null);
    }, [players, user]);

    // Realtime subscriptions
    useEffect(() => {
        const gameChannel = supabase
            .channel(`game-${gameId}`)
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` }, (payload) => {
                setGame(payload.new as GameData);
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "game_players", filter: `game_id=eq.${gameId}` }, () => {
                fetchPlayers();
            })
            .subscribe();
        return () => { supabase.removeChannel(gameChannel); };
    }, [gameId, fetchPlayers]);

    // Host: start game
    const handleStart = async () => {
        const deck = shuffle(LOTERIA_CARDS.map((c) => c.id));
        await supabase.from("games").update({
            status: "playing",
            started_at: new Date().toISOString(),
            deck_card_ids: deck,
            drawn_card_ids: [],
        }).eq("id", gameId);
        fetchGame();
    };

    // Host: draw next card
    const handleDrawCard = async () => {
        if (!game || drawing) return;
        const remaining = game.deck_card_ids ?? [];
        if (remaining.length === 0) return;
        setDrawing(true);
        const nextCardId = remaining[0];
        const newDeck = remaining.slice(1);
        const newDrawn = [nextCardId, ...(game.drawn_card_ids ?? [])];
        await supabase.from("games").update({
            deck_card_ids: newDeck,
            drawn_card_ids: newDrawn,
            status: newDeck.length === 0 ? "finished" : "playing",
        }).eq("id", gameId);
        setDrawing(false);
    };

    // Player: toggle mark a card on their board
    const handleMarkCard = async (cardId: number) => {
        if (!myPlayer || game?.status !== "playing") return;
        const current = myPlayer.marked_card_ids ?? [];
        const updated = current.includes(cardId)
            ? current.filter((id) => id !== cardId)
            : [...current, cardId];

        await supabase.from("game_players").update({ marked_card_ids: updated }).eq("id", myPlayer.id);
        setMyPlayer({ ...myPlayer, marked_card_ids: updated });

        // Check for win: all marked cards must also be in drawn cards
        const drawn = game?.drawn_card_ids ?? [];
        const boardCards = myPlayer.board_card_ids;
        const allMarked = boardCards.every((id) => updated.includes(id) ? drawn.includes(id) : true);
        const hasLoteria = boardCards.every((id) => drawn.includes(id) && updated.includes(id));
        if (hasLoteria) {
            await supabase.from("game_players").update({ has_won: true }).eq("id", myPlayer.id);
            await supabase.from("games").update({ winner_id: user.id, status: "finished", finished_at: new Date().toISOString() }).eq("id", gameId);
        }
    };

    const isHost = user && game?.host_id === user.id;
    const drawnIds = game?.drawn_card_ids ?? [];
    const currentCardId = drawnIds[0];
    const currentCard = currentCardId ? cardById[currentCardId] : null;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white bg-[#1a1a2e]">
                <div className="text-center">
                    <div className="text-4xl mb-4 animate-spin">🎴</div>
                    <p className="text-white/40">Cargando partida...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white" style={{ backgroundColor: "#1a1a2e", backgroundImage: "radial-gradient(at 0% 0%, rgba(233,30,99,0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(0,188,212,0.10) 0px, transparent 50%)" }}>
            {/* Victory overlay */}
            {winner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-green-500/30 rounded-3xl p-10 text-center shadow-2xl max-w-md w-full mx-4">
                        <div className="text-6xl mb-4">🏆</div>
                        <h1 className="text-5xl font-black text-yellow-400 mb-3">¡LOTERÍA!</h1>
                        <p className="text-xl text-white/70 mb-8">
                            {winner.player_id === user?.id ? "¡Tú ganaste!" : "Alguien ganó la partida"}
                        </p>
                        <Link href="/lobby" className="inline-block w-full bg-[#E91E63] hover:bg-[#C2185B] text-white font-black py-4 rounded-xl transition-all text-lg">
                            Volver al lobby
                        </Link>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/lobby" className="text-white/40 hover:text-white text-sm transition-colors">← Lobby</Link>
                    <span className="text-white/20">|</span>
                    <span className="font-mono text-cyan-400 font-black tracking-widest text-lg">{game?.lobby_code}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${game?.status === "playing" ? "bg-green-500/20 text-green-400" :
                            game?.status === "finished" ? "bg-red-500/20 text-red-400" :
                                "bg-yellow-500/20 text-yellow-400"
                        }`}>
                        {game?.status === "waiting" ? "⏳ Esperando" : game?.status === "playing" ? "🔴 En vivo" : "✅ Terminado"}
                    </span>
                    <span className="text-white/40 text-sm">{players.length} jugadores</span>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Caller column */}
                <div className="flex flex-col gap-4">
                    {/* Host controls */}
                    {isHost && game?.status === "waiting" && (
                        <button
                            onClick={handleStart}
                            disabled={players.length < 1}
                            className="w-full h-14 bg-[#E91E63] hover:bg-[#C2185B] disabled:opacity-40 font-black text-lg rounded-2xl transition-all shadow-lg shadow-pink-500/20"
                        >
                            🎮 Iniciar Partida
                        </button>
                    )}

                    {isHost && game?.status === "playing" && (
                        <button
                            onClick={handleDrawCard}
                            disabled={drawing || (game?.deck_card_ids?.length ?? 0) === 0}
                            className="w-full h-14 bg-[#E91E63] hover:bg-[#C2185B] disabled:opacity-40 font-black text-lg rounded-2xl transition-all shadow-lg shadow-pink-500/20"
                        >
                            {drawing ? "⏳ Jalando..." : "🃏 Jalar Carta"}
                        </button>
                    )}

                    {/* Current card display */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-3">
                        <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Carta Actual</p>
                        {currentCard ? (
                            <>
                                <img src={currentCard.image} alt={currentCard.name} className="w-36 h-48 object-cover rounded-xl shadow-2xl border-4 border-yellow-500/30" />
                                <p className="font-black text-xl text-yellow-400">{currentCard.name}</p>
                            </>
                        ) : (
                            <div className="w-36 h-48 bg-white/5 rounded-xl flex items-center justify-center">
                                <span className="text-4xl opacity-30">🎴</span>
                            </div>
                        )}
                        <p className="text-white/30 text-xs">{drawnIds.length} de {LOTERIA_CARDS.length} cartas jaladas</p>
                    </div>

                    {/* Last drawn cards */}
                    {drawnIds.length > 1 && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-3">Anteriores</p>
                            <div className="flex flex-wrap gap-1">
                                {drawnIds.slice(1, 9).map((id) => (
                                    <img key={id} src={cardById[id]?.image} alt={cardById[id]?.name} title={cardById[id]?.name}
                                        className="w-10 h-14 object-cover rounded-md border border-white/10 opacity-60" />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Center: My board */}
                <div className="flex flex-col items-center gap-4">
                    <h3 className="font-black text-lg uppercase tracking-wider text-white">Mi Tabla</h3>
                    {myPlayer ? (
                        <>
                            <div className="bg-[#5D2E0C] p-3 rounded-2xl shadow-2xl border-4 border-[#3e1a04]">
                                <div className="grid grid-cols-4 gap-1.5">
                                    {myPlayer.board_card_ids.map((cardId) => {
                                        const card = cardById[cardId];
                                        const isMarked = (myPlayer.marked_card_ids ?? []).includes(cardId);
                                        const isDrawn = drawnIds.includes(cardId);
                                        return (
                                            <button
                                                key={cardId}
                                                onClick={() => handleMarkCard(cardId)}
                                                disabled={game?.status !== "playing"}
                                                className={`relative w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${isMarked ? "border-red-500 scale-100" : "border-transparent hover:border-white/30"
                                                    }`}
                                            >
                                                <img src={card?.image} alt={card?.name} className={`w-full h-full object-cover ${isDrawn ? "" : "brightness-50"}`} />
                                                {isMarked && (
                                                    <div className="absolute inset-0 bg-red-600/40 flex items-center justify-center">
                                                        <span className="text-2xl font-black text-white drop-shadow-lg">●</span>
                                                    </div>
                                                )}
                                                {isDrawn && !isMarked && (
                                                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <p className="text-white/30 text-xs">
                                {(myPlayer.marked_card_ids ?? []).length} / 16 marcadas
                            </p>
                        </>
                    ) : (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-white/30 text-center">
                            No estás en esta partida
                        </div>
                    )}
                </div>

                {/* Right: Players list */}
                <div className="flex flex-col gap-4">
                    <h3 className="font-black text-lg uppercase tracking-wider">Jugadores ({players.length})</h3>
                    <div className="flex flex-col gap-2">
                        {players.map((p) => (
                            <div key={p.id} className={`bg-white/5 border rounded-xl px-4 py-3 flex items-center justify-between ${p.has_won ? "border-yellow-500/50 bg-yellow-500/10" : "border-white/10"}`}>
                                <div>
                                    <span className="font-mono text-sm text-white/60">{p.player_id.slice(0, 8)}…</span>
                                    {p.player_id === game?.host_id && <span className="ml-2 text-xs text-yellow-400 font-bold">HOST</span>}
                                    {p.player_id === user?.id && <span className="ml-2 text-xs text-cyan-400 font-bold">TÚ</span>}
                                </div>
                                <div className="text-xs text-white/40">
                                    {p.has_won
                                        ? <span className="text-yellow-400 font-black">🏆 ¡LOTERÍA!</span>
                                        : <span>{(p.marked_card_ids ?? []).length}/16</span>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
