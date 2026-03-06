"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LOTERIA_CARDS, CARD_BY_ID } from "@/app/lib/cards";
import { useWallet } from "@/app/context/WalletContext";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────
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
    bet_tx: string | null;
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function shortAddr(addr: string) {
    return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

// Pool address on devnet — replace with your treasury later
const POOL_ADDRESS = "11111111111111111111111111111111";

const BET_OPTIONS = [
    { label: "0.05 SOL", lamports: Math.round(0.05 * 1e9) },
    { label: "0.1 SOL", lamports: Math.round(0.1 * 1e9) },
    { label: "0.25 SOL", lamports: Math.round(0.25 * 1e9) },
];

// ─── Card components ─────────────────────────────────────────────────────────
function BigCard({ cardId }: { cardId: number | undefined }) {
    const card = cardId ? CARD_BY_ID[cardId] : null;
    if (!card) return (
        <div className="w-40 h-56 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center text-5xl text-white/20">🎴</div>
    );
    return (
        <div key={cardId} className="w-40 h-56 bg-white rounded-2xl overflow-hidden shadow-2xl border-4 border-yellow-500/40 flex flex-col" style={{ animation: "fadeIn 0.4s ease-out" }}>
            <div className="flex-1 flex items-center justify-center text-6xl bg-gradient-to-br from-orange-50 to-yellow-100">{card.emoji}</div>
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
        <button onClick={onClick} disabled={disabled} title={card?.name}
            className={`relative w-16 h-20 rounded-lg overflow-hidden border-2 flex flex-col bg-white transition-all
                ${isMarked ? "border-red-500 shadow-red-500/40 shadow-lg scale-105" :
                    isDrawn ? "border-yellow-400 shadow-yellow-400/30 shadow-md" :
                        "border-transparent opacity-60 hover:opacity-80"}
                ${disabled ? "cursor-default" : "cursor-pointer hover:scale-105"}`}
        >
            <div className="flex-1 flex items-center justify-center text-xl bg-gradient-to-br from-orange-50 to-yellow-50">
                {card?.emoji ?? "🎴"}
            </div>
            <div className="bg-[#E91E63] py-0.5">
                <p className="text-white text-[5px] font-bold text-center uppercase truncate px-0.5">{card?.name}</p>
            </div>
            {isMarked && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-2xl font-black drop-shadow">●</span>
                </div>
            )}
            {isDrawn && !isMarked && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-400 animate-pulse pointer-events-none" />
            )}
        </button>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function GameRoom({ params }: { params: Promise<{ id: string }> }) {
    const { publicKey, balance, placeBet, connect, connected } = useWallet();
    const walletAddress = publicKey?.toBase58() ?? null;

    const [gameId, setGameId] = useState("");
    const [game, setGame] = useState<GameData | null>(null);
    const [players, setPlayers] = useState<PlayerRow[]>([]);
    const [myPlayer, setMyPlayer] = useState<PlayerRow | null>(null);
    const [loading, setLoading] = useState(true);
    const [winner, setWinner] = useState<PlayerRow | null>(null);
    const [startLoading, setStartLoading] = useState(false);
    const [selectedBet, setSelectedBet] = useState(BET_OPTIONS[1].lamports);
    const [betLoading, setBetLoading] = useState(false);
    const [betError, setBetError] = useState<string | null>(null);

    useEffect(() => { params.then(p => setGameId(p.id)); }, [params]);

    // ── Fetch ─────────────────────────────────────────────────────────────
    const fetchGame = useCallback(async () => {
        if (!gameId) return;
        const { data } = await supabase
            .from("games")
            .select("id, lobby_code, status, drawn_card_ids, deck_card_ids, host_wallet")
            .eq("id", gameId).single();
        if (data) setGame(data as GameData);
    }, [gameId]);

    const fetchPlayers = useCallback(async () => {
        if (!gameId) return;
        const { data } = await supabase
            .from("game_players")
            .select("id, wallet_address, board_card_ids, marked_card_ids, has_won, bet_tx")
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
        if (walletAddress) {
            setMyPlayer(players.find(p => p.wallet_address === walletAddress) ?? null);
        }
    }, [players, walletAddress]);

    // ── Realtime ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!gameId) return;
        const ch = supabase
            .channel(`game-${gameId}`)
            .on("postgres_changes",
                { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
                (payload) => setGame(prev => ({ ...prev, ...payload.new } as GameData)))
            .on("postgres_changes",
                { event: "*", schema: "public", table: "game_players", filter: `game_id=eq.${gameId}` },
                () => fetchPlayers())
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [gameId, fetchPlayers]);

    // ── Auto-draw every 4s (host only, only when playing) ─────────────────
    useEffect(() => {
        if (!game || game.status !== "playing") return;
        if (!walletAddress || game.host_wallet !== walletAddress) return;

        const timerId = setInterval(async () => {
            const { data: fresh } = await supabase
                .from("games")
                .select("deck_card_ids, drawn_card_ids, status")
                .eq("id", gameId)
                .single();

            if (!fresh || fresh.status !== "playing") { clearInterval(timerId); return; }
            if (!fresh.deck_card_ids || fresh.deck_card_ids.length === 0) {
                await supabase.from("games").update({ status: "finished", finished_at: new Date().toISOString() }).eq("id", gameId);
                clearInterval(timerId);
                return;
            }

            const [next, ...rest] = fresh.deck_card_ids;
            const newDrawn = [next, ...(fresh.drawn_card_ids ?? [])];
            await supabase.from("games").update({
                deck_card_ids: rest,
                drawn_card_ids: newDrawn,
            }).eq("id", gameId);
        }, 4000);

        return () => clearInterval(timerId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [game?.status, game?.host_wallet, walletAddress, gameId]);

    // ── Actions ───────────────────────────────────────────────────────────

    /** Host starts the game — no bet required, bet is optional */
    const handleStart = async () => {
        if (!walletAddress) { await connect(); return; }
        setStartLoading(true);
        const deck = shuffle(LOTERIA_CARDS.map(c => c.id));
        const { error } = await supabase.from("games").update({
            status: "playing",
            started_at: new Date().toISOString(),
            deck_card_ids: deck,
            drawn_card_ids: [],
        }).eq("id", gameId);
        if (error) console.error("Start error:", error);
        setStartLoading(false);
    };

    /** Place SOL bet (optional, separate from starting) */
    const handlePlaceBet = async () => {
        if (!walletAddress) { await connect(); return; }
        if (!myPlayer) return;
        setBetLoading(true);
        setBetError(null);
        const sig = await placeBet(selectedBet, POOL_ADDRESS);
        setBetLoading(false);
        if (!sig) {
            setBetError("Apuesta cancelada o fallida. Intenta de nuevo.");
            return;
        }
        await supabase.from("game_players").update({ bet_tx: sig }).eq("id", myPlayer.id);
        setMyPlayer({ ...myPlayer, bet_tx: sig });
    };

    const handleMarkCard = async (cardId: number) => {
        if (!myPlayer || game?.status !== "playing") return;
        const current = myPlayer.marked_card_ids ?? [];
        const updated = current.includes(cardId)
            ? current.filter(id => id !== cardId)
            : [...current, cardId];

        setMyPlayer({ ...myPlayer, marked_card_ids: updated });
        await supabase.from("game_players").update({ marked_card_ids: updated }).eq("id", myPlayer.id);

        // Win check
        const drawn = game?.drawn_card_ids ?? [];
        const hasLoteria = myPlayer.board_card_ids.every(id => drawn.includes(id) && updated.includes(id));
        if (hasLoteria) {
            await supabase.from("game_players").update({ has_won: true }).eq("id", myPlayer.id);
            await supabase.from("games").update({
                status: "finished",
                finished_at: new Date().toISOString(),
            }).eq("id", gameId);
        }
    };

    // ── Derived ───────────────────────────────────────────────────────────
    const isHost = !!(walletAddress && game?.host_wallet === walletAddress);
    const drawnIds = game?.drawn_card_ids ?? [];
    const myBetPlaced = !!(myPlayer?.bet_tx);

    // ── Render ────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e] text-white">
            <div className="text-center">
                <div className="text-5xl mb-4 animate-spin">🎴</div>
                <p className="text-white/40">Cargando partida...</p>
            </div>
        </div>
    );

    if (!game) return (
        <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e] text-white">
            <div className="text-center">
                <div className="text-4xl mb-4">❌</div>
                <p className="text-white/60 mb-4">Partida no encontrada</p>
                <Link href="/lobby" className="bg-[#E91E63] font-bold px-6 py-3 rounded-xl">Volver al Lobby</Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen text-white" style={{
            backgroundColor: "#1a1a2e",
            backgroundImage: "radial-gradient(at 0% 0%, rgba(233,30,99,0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(0,188,212,0.10) 0px, transparent 50%)"
        }}>

            {/* Victory overlay */}
            {winner && game.status === "finished" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" style={{ backdropFilter: "blur(12px)" }}>
                    <div className="bg-slate-900 border border-yellow-500/30 rounded-3xl p-10 text-center max-w-md w-full mx-4 shadow-2xl">
                        <div className="text-7xl mb-4">🏆</div>
                        <h1 className="text-5xl font-black text-yellow-400 mb-3">¡LOTERÍA!</h1>
                        <p className="text-white/70 text-lg mb-8">
                            {winner.wallet_address === walletAddress
                                ? "🎉 ¡Tú ganaste!"
                                : `Ganó: ${shortAddr(winner.wallet_address ?? "")}`}
                        </p>
                        <Link href="/lobby" className="block w-full bg-[#E91E63] hover:bg-[#C2185B] text-white font-black py-4 rounded-xl text-center transition-all text-lg">
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
                    <span className="font-mono text-cyan-400 font-black tracking-widest text-lg">{game.lobby_code}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${game.status === "playing" ? "bg-green-500/20 text-green-400" :
                            game.status === "finished" ? "bg-red-500/20 text-red-400" :
                                "bg-yellow-500/20 text-yellow-400"}`}>
                        {game.status === "waiting" ? "⏳ Esperando" :
                            game.status === "playing" ? "🔴 En vivo" : "✅ Terminado"}
                    </span>
                    <span className="text-white/40 text-sm">{players.length} jugadores</span>
                    {walletAddress && (
                        <span className="hidden sm:block text-white/30 text-xs font-mono">👻 {shortAddr(walletAddress)}</span>
                    )}
                </div>
            </header>

            {/* Main grid */}
            <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Col 1: Controls + Caller */}
                <div className="flex flex-col gap-4">

                    {/* ── HOST START BUTTON (always visible in waiting) ── */}
                    {isHost && game.status === "waiting" && (
                        <button
                            onClick={handleStart}
                            disabled={startLoading}
                            className="w-full h-14 bg-[#E91E63] hover:bg-[#C2185B] disabled:opacity-50 font-black text-lg rounded-2xl transition-all shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2"
                        >
                            {startLoading ? "⏳ Iniciando..." : `🎮 Iniciar Partida (${players.length} jugador${players.length !== 1 ? "es" : ""})`}
                        </button>
                    )}

                    {/* ── WAITING (non-host) ── */}
                    {!isHost && game.status === "waiting" && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-center">
                            <div className="text-2xl mb-1">⏳</div>
                            <p className="text-yellow-400 font-bold text-sm">Esperando al host...</p>
                            <p className="text-white/30 text-xs mt-1">El juego comenzará cuando el host lo inicie</p>
                        </div>
                    )}

                    {/* ── BET PANEL (waiting + has player slot) ── */}
                    {game.status === "waiting" && myPlayer && connected && !myBetPlaced && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-3">💰 Apuesta (opcional)</p>
                            <div className="flex gap-2 mb-3">
                                {BET_OPTIONS.map(opt => (
                                    <button key={opt.label}
                                        onClick={() => setSelectedBet(opt.lamports)}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${selectedBet === opt.lamports
                                                ? "bg-[#E91E63] border-[#E91E63] text-white"
                                                : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"}`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            {balance !== null && balance < selectedBet / 1e9 && (
                                <p className="text-red-400 text-xs text-center mb-2">⚠ Balance insuficiente ({balance.toFixed(4)} SOL)</p>
                            )}
                            {betError && <p className="text-red-400 text-xs text-center mb-2 bg-red-500/10 rounded-lg p-2">{betError}</p>}
                            <button
                                onClick={handlePlaceBet}
                                disabled={betLoading || (balance !== null && balance < selectedBet / 1e9)}
                                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 font-black py-3 rounded-xl text-sm transition-all"
                            >
                                {betLoading ? "⏳ Firmando en Phantom..." : "💸 Apostar en Devnet"}
                            </button>
                        </div>
                    )}

                    {myBetPlaced && game.status === "waiting" && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
                            <p className="text-green-400 font-bold text-sm">✅ Apuesta confirmada</p>
                            <a href={`https://solscan.io/tx/${myPlayer?.bet_tx}?cluster=devnet`}
                                target="_blank" rel="noreferrer"
                                className="text-cyan-400/60 text-[10px] font-mono hover:underline break-all mt-1 block">
                                Ver en Solscan →
                            </a>
                        </div>
                    )}

                    {/* ── CURRENT CARD ── */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-4">
                        <p className="text-white/40 text-xs uppercase tracking-widest font-bold">🎴 Carta Actual</p>
                        <BigCard cardId={drawnIds[0]} />
                        <p className="text-white/30 text-xs">{drawnIds.length} / 54 cantadas</p>
                    </div>

                    {/* ── HISTORY ── */}
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

                {/* Col 2: Board */}
                <div className="flex flex-col items-center gap-4">
                    <h3 className="font-black text-lg uppercase tracking-wider">Mi Tabla</h3>
                    {myPlayer ? (
                        <>
                            <div className="bg-[#5D2E0C] p-3 rounded-2xl shadow-2xl border-4 border-[#3e1a04]">
                                <div className="grid grid-cols-4 gap-1.5">
                                    {myPlayer.board_card_ids.map(cardId => (
                                        <BoardCard key={cardId} cardId={cardId}
                                            isMarked={(myPlayer.marked_card_ids ?? []).includes(cardId)}
                                            isDrawn={drawnIds.includes(cardId)}
                                            onClick={() => handleMarkCard(cardId)}
                                            disabled={game.status !== "playing"} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-white/30 text-xs text-center">
                                {(myPlayer.marked_card_ids ?? []).length}/16 marcadas
                                {game.status === "playing" && " • Toca para marcar"}
                            </p>
                        </>
                    ) : !connected ? (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 text-center text-yellow-400">
                            <p className="font-bold mb-2">Conecta Phantom para jugar</p>
                            <button onClick={connect} className="bg-[#E91E63] font-bold px-4 py-2 rounded-xl text-sm">👻 Conectar</button>
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white/30 text-center text-sm">
                            No estás registrado en esta partida
                        </div>
                    )}
                </div>

                {/* Col 3: Players + invite */}
                <div className="flex flex-col gap-4">
                    <h3 className="font-black text-lg uppercase tracking-wider">Jugadores ({players.length})</h3>
                    <div className="flex flex-col gap-2">
                        {players.map(p => (
                            <div key={p.id} className={`bg-white/5 border rounded-xl px-4 py-3 flex items-center justify-between ${p.has_won ? "border-yellow-500/50 bg-yellow-500/10" : "border-white/10"}`}>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-xs text-white/60">{p.wallet_address ? shortAddr(p.wallet_address) : "???"}</span>
                                    {p.wallet_address === game.host_wallet && <span className="text-[10px] text-yellow-400 font-bold">HOST</span>}
                                    {p.wallet_address === walletAddress && <span className="text-[10px] text-cyan-400 font-bold">TÚ</span>}
                                    {p.bet_tx && <span title="Apuesta enviada" className="text-[10px] text-green-400">💰</span>}
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
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-2 font-bold">📨 Invitar amigos</p>
                        <div className="bg-black/30 rounded-xl px-4 py-3 text-center">
                            <p className="text-cyan-400 font-black text-2xl tracking-widest font-mono">{game.lobby_code}</p>
                        </div>
                        <p className="text-white/20 text-xs text-center mt-2">Comparten este código en el lobby</p>
                    </div>

                    {/* Prize pool hint */}
                    {game.status === "waiting" && players.filter(p => p.bet_tx).length > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                            <p className="text-white/40 text-xs uppercase tracking-wider mb-1 font-bold">Premio Estimado</p>
                            <p className="text-yellow-400 font-black text-xl">
                                ~{((selectedBet / 1e9) * players.filter(p => p.bet_tx).length * 0.9).toFixed(3)} SOL
                            </p>
                            <p className="text-white/20 text-[10px]">90% del pool · {players.filter(p => p.bet_tx).length} apuesta{players.filter(p => p.bet_tx).length !== 1 ? "s" : ""} confirmada{players.filter(p => p.bet_tx).length !== 1 ? "s" : ""}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
