"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LOTERIA_CARDS, CARD_BY_ID } from "@/app/lib/cards";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type GameData = {
    id: string;
    lobby_code: string | null;
    status: string;
    drawn_card_ids: number[] | null;
    deck_card_ids: number[] | null;
    host_wallet: string | null;
};

type PlayerRow = {
    id: string;
    wallet_address: string | null;
    board_card_ids: number[];
    marked_card_ids: number[] | null;
    has_won: boolean | null;
};

// ─── Phantom hook ─────────────────────────────────────────────────────────────

function useWalletAddress() {
    const [address, setAddress] = useState<string | null>(null);
    useEffect(() => {
        const phantom = (window as any).solana;
        if (!phantom) return;
        if (phantom.publicKey) setAddress(phantom.publicKey.toBase58());
        const onConnect = () => { if (phantom.publicKey) setAddress(phantom.publicKey.toBase58()); };
        phantom.on("connect", onConnect);
        phantom.on("disconnect", () => setAddress(null));
        return () => { phantom.off?.("connect", onConnect); };
    }, []);
    return address;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function shortAddr(addr: string) {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

// ─── Card components ──────────────────────────────────────────────────────────

function BigCard({ cardId }: { cardId: number | undefined }) {
    const card = cardId ? CARD_BY_ID[cardId] : null;
    if (!card) return (
        <div className="w-40 h-56 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center text-white/20 text-5xl">
            🎴
        </div>
    );
    return (
        <div className="w-40 h-56 bg-white rounded-2xl overflow-hidden shadow-2xl border-4 border-yellow-500/40 flex flex-col" style={{ animation: "fadeIn 0.4s ease-out" }}>
            <div className="flex-1 flex items-center justify-center text-6xl bg-gradient-to-br from-orange-50 to-yellow-100">
                {card.emoji}
            </div>
            <div className="bg-[#E91E63] py-2 text-center">
                <p className="text-white font-black uppercase text-xs tracking-wider">{card.name}</p>
            </div>
        </div>
    );
}

function BoardCard({ cardId, isMarked, isDrawn, onClick, disabled }: {
    cardId: number; isMarked: boolean; isDrawn: boolean; onClick: () => void; disabled: boolean;
}) {
    const card = CARD_BY_ID[cardId];
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={card?.name}
            className={`relative w-16 h-20 rounded-lg overflow-hidden border-2 flex flex-col bg-white transition-all
                ${isMarked ? "border-red-500 shadow-red-500/40 shadow-lg scale-105" :
                    isDrawn ? "border-yellow-400 shadow-yellow-400/30 shadow-md" :
                        "border-transparent opacity-60 hover:opacity-80"}
                ${disabled ? "cursor-default" : "cursor-pointer hover:scale-105"}
            `}
        >
            <div className="flex-1 flex items-center justify-center text-xl bg-gradient-to-br from-orange-50 to-yellow-50">
                {card?.emoji ?? "🎴"}
            </div>
            <div className="bg-[#E91E63] py-0.5">
                <p className="text-white text-[5px] font-bold text-center uppercase truncate px-0.5">{card?.name}</p>
            </div>
            {isMarked && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-2xl drop-shadow font-black">●</span>
                </div>
            )}
            {isDrawn && !isMarked && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-400 animate-pulse pointer-events-none" />
            )}
        </button>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GameRoom({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const walletAddress = useWalletAddress();
    const [gameId, setGameId] = useState("");
    const [game, setGame] = useState<GameData | null>(null);
    const [players, setPlayers] = useState<PlayerRow[]>([]);
    const [myPlayer, setMyPlayer] = useState<PlayerRow | null>(null);
    const [loading, setLoading] = useState(true);
    const [winner, setWinner] = useState<PlayerRow | null>(null);

    useEffect(() => { params.then(p => setGameId(p.id)); }, [params]);

    // ── Fetch ──────────────────────────────────────────────────────────────
    const fetchGame = useCallback(async () => {
        if (!gameId) return;
        const { data } = await supabase
            .from("games")
            .select("id, lobby_code, status, drawn_card_ids, deck_card_ids, host_wallet")
            .eq("id", gameId)
            .single();
        if (data) setGame(data as GameData);
    }, [gameId]);

    const fetchPlayers = useCallback(async () => {
        if (!gameId) return;
        const { data } = await supabase
            .from("game_players")
            .select("id, wallet_address, board_card_ids, marked_card_ids, has_won")
            .eq("game_id", gameId);
        if (data) {
            setPlayers(data as PlayerRow[]);
            const won = (data as PlayerRow[]).find(p => p.has_won);
            if (won) setWinner(won);
        }
    }, [gameId]);

    useEffect(() => {
        if (!gameId) return;
        Promise.all([fetchGame(), fetchPlayers()]).then(() => setLoading(false));
    }, [gameId, fetchGame, fetchPlayers]);

    // Sync myPlayer
    useEffect(() => {
        if (walletAddress) setMyPlayer(players.find(p => p.wallet_address === walletAddress) ?? null);
    }, [players, walletAddress]);

    // ── Realtime ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!gameId) return;
        const ch = supabase
            .channel(`game-${gameId}`)
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
                (payload) => setGame(payload.new as GameData))
            .on("postgres_changes", { event: "*", schema: "public", table: "game_players", filter: `game_id=eq.${gameId}` },
                () => fetchPlayers())
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [gameId, fetchPlayers]);

    // ── Auto-draw every 4s (host only) ─────────────────────────────────────
    useEffect(() => {
        if (!game || game.status !== "playing") return;
        if (game.host_wallet !== walletAddress) return;
        if (!game.deck_card_ids?.length) return;

        const id = setInterval(async () => {
            // Re-fetch fresh state to avoid stale closures
            const { data: fresh } = await supabase
                .from("games").select("deck_card_ids, drawn_card_ids").eq("id", gameId).single();
            if (!fresh || !fresh.deck_card_ids?.length) { clearInterval(id); return; }
            const next = fresh.deck_card_ids[0];
            const newDeck = fresh.deck_card_ids.slice(1);
            const newDrawn = [next, ...(fresh.drawn_card_ids ?? [])];
            await supabase.from("games").update({
                deck_card_ids: newDeck,
                drawn_card_ids: newDrawn,
                status: newDeck.length === 0 ? "finished" : "playing",
            }).eq("id", gameId);
        }, 4000);

        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [game?.status, game?.host_wallet, walletAddress, gameId]);

    // ── Actions ────────────────────────────────────────────────────────────

    const handleStart = async () => {
        const deck = shuffle(LOTERIA_CARDS.map(c => c.id));
        await supabase.from("games").update({
            status: "playing",
            started_at: new Date().toISOString(),
            deck_card_ids: deck,
            drawn_card_ids: [],
        }).eq("id", gameId);
    };

    const handleMarkCard = async (cardId: number) => {
        if (!myPlayer || game?.status !== "playing") return;
        const current = myPlayer.marked_card_ids ?? [];
        const updated = current.includes(cardId)
            ? current.filter(id => id !== cardId)
            : [...current, cardId];

        setMyPlayer({ ...myPlayer, marked_card_ids: updated });
        await supabase.from("game_players").update({ marked_card_ids: updated }).eq("id", myPlayer.id);

        // Win check: all 16 board cards drawn AND marked
        const drawn = game?.drawn_card_ids ?? [];
        const hasLoteria = myPlayer.board_card_ids.every(id => drawn.includes(id) && updated.includes(id));
        if (hasLoteria) {
            await supabase.from("game_players").update({ has_won: true }).eq("id", myPlayer.id);
            await supabase.from("games").update({
                winner_id: walletAddress,
                status: "finished",
                finished_at: new Date().toISOString(),
            }).eq("id", gameId);
        }
    };

    // ── Derived ────────────────────────────────────────────────────────────
    const isHost = walletAddress && game?.host_wallet === walletAddress;
    const drawnIds = game?.drawn_card_ids ?? [];
    const currentCardId = drawnIds[0];

    // ─── Render ────────────────────────────────────────────────────────────

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e] text-white">
            <div className="text-center"><div className="text-5xl mb-4 animate-spin">🎴</div><p className="text-white/40">Cargando...</p></div>
        </div>
    );

    return (
        <div className="min-h-screen text-white" style={{
            backgroundColor: "#1a1a2e",
            backgroundImage: "radial-gradient(at 0% 0%, rgba(233,30,99,0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(0,188,212,0.10) 0px, transparent 50%)"
        }}>

            {/* Victory overlay */}
            {winner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" style={{ backdropFilter: "blur(12px)" }}>
                    <div className="bg-slate-900 border border-yellow-500/30 rounded-3xl p-10 text-center max-w-md w-full mx-4 shadow-2xl">
                        <div className="text-7xl mb-4">🏆</div>
                        <h1 className="text-5xl font-black text-yellow-400 mb-3">¡LOTERÍA!</h1>
                        <p className="text-white/70 text-lg mb-8">
                            {winner.wallet_address === walletAddress ? "🎉 ¡Tú ganaste!" : `Ganó: ${shortAddr(winner.wallet_address ?? "")}`}
                        </p>
                        <Link href="/lobby" className="block w-full bg-[#E91E63] hover:bg-[#C2185B] text-white font-black py-4 rounded-xl transition-all text-lg text-center">
                            Volver al Lobby
                        </Link>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 z-10 bg-[#1a1a2e]/80" style={{ backdropFilter: "blur(8px)" }}>
                <div className="flex items-center gap-4">
                    <Link href="/lobby" className="text-white/40 hover:text-white text-sm transition-colors">← Lobby</Link>
                    <span className="text-white/20">|</span>
                    <span className="font-mono text-cyan-400 font-black tracking-widest text-lg">{game?.lobby_code}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${game?.status === "playing" ? "bg-green-500/20 text-green-400" :
                            game?.status === "finished" ? "bg-red-500/20 text-red-400" :
                                "bg-yellow-500/20 text-yellow-400"}`}>
                        {game?.status === "waiting" ? "⏳ Esperando" : game?.status === "playing" ? "🔴 En vivo" : "✅ Terminado"}
                    </span>
                    <span className="text-white/40 text-sm">{players.length} jugadores</span>
                    {walletAddress && (
                        <span className="hidden sm:block text-white/30 text-xs font-mono">👻 {shortAddr(walletAddress)}</span>
                    )}
                </div>
            </header>

            {/* Main grid */}
            <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Col 1: Caller */}
                <div className="flex flex-col gap-4">

                    {isHost && game?.status === "waiting" && (
                        <button
                            onClick={handleStart}
                            disabled={players.length < 1}
                            className="w-full h-14 bg-[#E91E63] hover:bg-[#C2185B] disabled:opacity-40 font-black text-lg rounded-2xl transition-all shadow-lg shadow-pink-500/20"
                        >
                            🎮 Iniciar Partida ({players.length} jugador{players.length !== 1 ? "es" : ""})
                        </button>
                    )}

                    {!isHost && game?.status === "waiting" && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-center">
                            <div className="text-2xl mb-1">⏳</div>
                            <p className="text-yellow-400 font-bold text-sm">Esperando al host...</p>
                        </div>
                    )}

                    {/* Current card */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-4">
                        <p className="text-white/40 text-xs uppercase tracking-widest font-bold">🎴 Carta Actual</p>
                        <BigCard cardId={currentCardId} />
                        <p className="text-white/30 text-xs">{drawnIds.length} / 54 cartas cantadas</p>
                    </div>

                    {/* History */}
                    {drawnIds.length > 1 && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-3">Anteriores</p>
                            <div className="flex flex-wrap gap-1.5">
                                {drawnIds.slice(1, 13).map(id => (
                                    <div key={id} title={CARD_BY_ID[id]?.name} className="w-10 h-14 bg-white rounded overflow-hidden flex flex-col opacity-50">
                                        <div className="flex-1 flex items-center justify-center text-base bg-orange-50">{CARD_BY_ID[id]?.emoji}</div>
                                        <div className="bg-[#E91E63] py-0.5 px-0.5">
                                            <p className="text-white text-[4px] text-center font-bold uppercase truncate">{CARD_BY_ID[id]?.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Col 2: My board */}
                <div className="flex flex-col items-center gap-4">
                    <h3 className="font-black text-lg uppercase tracking-wider">Mi Tabla</h3>
                    {myPlayer ? (
                        <>
                            <div className="bg-[#5D2E0C] p-3 rounded-2xl shadow-2xl border-4 border-[#3e1a04]">
                                <div className="grid grid-cols-4 gap-1.5">
                                    {myPlayer.board_card_ids.map(cardId => (
                                        <BoardCard
                                            key={cardId}
                                            cardId={cardId}
                                            isMarked={(myPlayer.marked_card_ids ?? []).includes(cardId)}
                                            isDrawn={drawnIds.includes(cardId)}
                                            onClick={() => handleMarkCard(cardId)}
                                            disabled={game?.status !== "playing"}
                                        />
                                    ))}
                                </div>
                            </div>
                            <p className="text-white/30 text-xs text-center">
                                {(myPlayer.marked_card_ids ?? []).length}/16 marcadas • Click para marcar
                            </p>
                        </>
                    ) : !walletAddress ? (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 text-center text-yellow-400">
                            Conecta Phantom para ver tu tabla
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white/30 text-center text-sm">
                            No estás en esta partida
                        </div>
                    )}
                </div>

                {/* Col 3: Players + invite */}
                <div className="flex flex-col gap-4">
                    <h3 className="font-black text-lg uppercase tracking-wider">Jugadores ({players.length})</h3>
                    <div className="flex flex-col gap-2">
                        {players.map(p => (
                            <div key={p.id} className={`bg-white/5 border rounded-xl px-4 py-3 flex items-center justify-between ${p.has_won ? "border-yellow-500/50 bg-yellow-500/10" : "border-white/10"}`}>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-white/60">
                                        {p.wallet_address ? shortAddr(p.wallet_address) : "???"}
                                    </span>
                                    {p.wallet_address === game?.host_wallet && <span className="text-xs text-yellow-400 font-bold">HOST</span>}
                                    {p.wallet_address === walletAddress && <span className="text-xs text-cyan-400 font-bold">TÚ</span>}
                                </div>
                                <div className="text-xs">
                                    {p.has_won
                                        ? <span className="text-yellow-400 font-black">🏆 ¡LOTERÍA!</span>
                                        : <span className="text-white/40">{(p.marked_card_ids ?? []).length}/16</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Invite box */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-2">
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-2 font-bold">Invitar amigos</p>
                        <div className="bg-black/30 rounded-xl px-4 py-3 text-center">
                            <p className="text-cyan-400 font-black text-2xl tracking-widest font-mono">{game?.lobby_code}</p>
                        </div>
                        <p className="text-white/20 text-xs text-center mt-2">Comparte este código en el lobby</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
