"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
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
    entry_fee_lamports: number | null;
    prize_pool: number;
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
    return addr ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : "???";
}

// ─── Card Components ─────────────────────────────────────────────────────────
function BigCard({ cardId }: { cardId: number | undefined }) {
    const card = cardId ? CARD_BY_ID[cardId] : null;
    if (!card) return (
        <div className="w-40 h-56 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center text-5xl text-white/20">
            🎴
        </div>
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
    const [startError, setStartError] = useState<string | null>(null);
    const [payoutLoading, setPayoutLoading] = useState(false);
    const [payoutTx, setPayoutTx] = useState<string | null>(null);
    const [payoutError, setPayoutError] = useState<string | null>(null);

    useEffect(() => { params.then(p => setGameId(p.id)); }, [params]);

    // ── Fetch ─────────────────────────────────────────────────────────────
    const fetchGame = useCallback(async () => {
        if (!gameId) return;
        const { data } = await supabase
            .from("games")
            .select("id, lobby_code, status, drawn_card_ids, deck_card_ids, host_wallet, entry_fee_lamports, prize_pool")
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
        if (walletAddress) setMyPlayer(players.find(p => p.wallet_address === walletAddress) ?? null);
    }, [players, walletAddress]);

    // ── Realtime & Polling Fallback ──────────────────────────────────────────
    useEffect(() => {
        if (!gameId) return;

        // WebSocket listener
        const ch = supabase
            .channel(`game-${gameId}`)
            .on("postgres_changes",
                { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
                (payload) => setGame(prev => ({ ...prev, ...payload.new } as GameData)))
            .on("postgres_changes",
                { event: "*", schema: "public", table: "game_players", filter: `game_id=eq.${gameId}` },
                () => fetchPlayers())
            .subscribe();

        // Polling fallback to ensure we catch new players if WebSocket drops
        let pollTimer: NodeJS.Timeout;
        if (game?.status === "waiting") {
            pollTimer = setInterval(() => {
                fetchPlayers();
                // Also optionally refresh game data in case an update was missed
                fetchGame();
            }, 3000);
        }

        return () => {
            supabase.removeChannel(ch);
            if (pollTimer) clearInterval(pollTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameId, game?.status, fetchPlayers, fetchGame]);

    // ── Auto-draw every 4s (host only) ────────────────────────────────────
    useEffect(() => {
        if (!game || game.status !== "playing") return;
        if (!walletAddress || game.host_wallet !== walletAddress) return;

        const timerId = setInterval(async () => {
            const { data: fresh } = await supabase
                .from("games")
                .select("deck_card_ids, drawn_card_ids, status")
                .eq("id", gameId).single();

            if (!fresh || fresh.status !== "playing") { clearInterval(timerId); return; }

            if (!fresh.deck_card_ids || fresh.deck_card_ids.length === 0) {
                await supabase.from("games").update({ status: "finished", finished_at: new Date().toISOString() }).eq("id", gameId);
                clearInterval(timerId);
                return;
            }

            const [next, ...rest] = fresh.deck_card_ids;
            const newDrawn = [next, ...(fresh.drawn_card_ids ?? [])];
            const { error: drawErr } = await supabase.from("games")
                .update({ deck_card_ids: rest, drawn_card_ids: newDrawn })
                .eq("id", gameId);

            if (drawErr) console.error("AutoDraw Error:", drawErr.message);
        }, 4000);

        return () => clearInterval(timerId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [game?.status, game?.host_wallet, walletAddress, gameId]);

    // ── Actions ───────────────────────────────────────────────────────────

    /** Host starts game — also places their own bet, paying the first non-host player's wallet */
    const handleStart = async () => {
        if (!walletAddress) { await connect(); return; }
        setStartLoading(true);
        setStartError(null);

        // Host must also pay their bet (sends to first non-host player as escrow)
        const nonHostPlayer = players.find(p => p.wallet_address !== walletAddress && p.bet_tx);
        const fee = game?.entry_fee_lamports ?? 0;

        if (fee > 0 && nonHostPlayer?.wallet_address) {
            const hostSig = await placeBet(fee, nonHostPlayer.wallet_address);
            if (!hostSig) {
                setStartError("Apuesta fallida o rechazada en Phantom.");
                setStartLoading(false);
                return; // user cancelled
            }
            // Record host's bet_tx
            await supabase.from("game_players")
                .update({ bet_tx: hostSig })
                .eq("game_id", gameId)
                .eq("wallet_address", walletAddress);
        }

        const deck = shuffle(LOTERIA_CARDS.map(c => c.id));
        const [firstCard, ...restDeck] = deck;
        const allPaid = players.filter(p => p.bet_tx && p.bet_tx !== 'host').length + 1; // +1 for host
        const pool = allPaid * fee;

        const { error } = await supabase.from("games").update({
            status: "playing",
            started_at: new Date().toISOString(),
            deck_card_ids: restDeck,
            drawn_card_ids: [firstCard],
            prize_pool: pool,
        }).eq("id", gameId);

        if (error) console.error("Start failed:", error.message);
        setStartLoading(false);
    };

    /** Mark a card on your board */
    const handleMarkCard = async (cardId: number) => {
        if (!myPlayer || game?.status !== "playing") return;
        const current = myPlayer.marked_card_ids ?? [];
        const updated = current.includes(cardId)
            ? current.filter(id => id !== cardId)
            : [...current, cardId];

        setMyPlayer({ ...myPlayer, marked_card_ids: updated });
        await supabase.from("game_players").update({ marked_card_ids: updated }).eq("id", myPlayer.id);

        const drawn = game?.drawn_card_ids ?? [];
        const hasLoteria = myPlayer.board_card_ids.every(id => drawn.includes(id) && updated.includes(id));
        if (hasLoteria) {
            await supabase.from("game_players").update({ has_won: true }).eq("id", myPlayer.id);
            await supabase.from("games").update({ status: "finished", finished_at: new Date().toISOString() }).eq("id", gameId);
        }
    };

    /** HOST pays the prize to the winner via Phantom */
    const handlePayWinner = async () => {
        if (!winner?.wallet_address || !game) return;
        setPayoutError(null);
        setPayoutLoading(true);

        // Prize = all paid players * fee (minus tiny house cut if desired)
        const paidPlayers = players.filter(p => p.bet_tx).length;
        const prizeTotal = paidPlayers * (game.entry_fee_lamports ?? 0);
        // Keep a small buffer for tx fees (~10k lamports), send 99%
        const prizePayout = Math.floor(prizeTotal * 0.99);

        const sig = await placeBet(prizePayout, winner.wallet_address);
        setPayoutLoading(false);

        if (!sig) {
            setPayoutError("Transacción cancelada. Intenta de nuevo.");
            return;
        }
        setPayoutTx(sig);
    };

    // ── Derived ───────────────────────────────────────────────────────────
    const isHost = !!(walletAddress && game?.host_wallet === walletAddress);
    const drawnIds = game?.drawn_card_ids ?? [];
    // Non-host paid = those who actually submitted a Phantom transaction (not the 'host' placeholder)
    const paidNonHost = players.filter(p => p.bet_tx && p.wallet_address !== game?.host_wallet).length;
    // Total pool shown: includes host's bet (which is paid at start)
    const paidCount = players.filter(p => p.bet_tx).length;
    const totalPool = paidCount * (game?.entry_fee_lamports ?? 0);
    const iWon = winner?.wallet_address === walletAddress;
    const hostWon = winner?.wallet_address === game?.host_wallet;
    // Host can start if at least 1 non-host player has paid (the host is mostly checking others)
    const canStart = paidNonHost >= 1;

    // ── Render ────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e] text-white">
            <div className="text-center"><div className="text-5xl mb-4 animate-spin">🎴</div><p className="text-white/40">Cargando...</p></div>
        </div>
    );
    if (!game) return (
        <div className="min-h-screen flex items-center justify-center bg-[#1a1a2e] text-white">
            <div className="text-center"><p className="text-white/60 mb-4">Partida no encontrada</p>
                <Link href="/lobby" className="bg-[#E91E63] font-bold px-6 py-3 rounded-xl">← Lobby</Link></div>
        </div>
    );

    return (
        <div className="min-h-screen text-white" style={{
            backgroundColor: "#1a1a2e",
            backgroundImage: "radial-gradient(at 0% 0%, rgba(233,30,99,0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(0,188,212,0.10) 0px, transparent 50%)"
        }}>

            {/* ── VICTORY OVERLAY ── */}
            {winner && game.status === "finished" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85" style={{ backdropFilter: "blur(16px)" }}>
                    <div className="bg-slate-900 border border-yellow-500/40 rounded-3xl p-8 text-center max-w-md w-full mx-4 shadow-2xl">
                        <div className="text-7xl mb-3">🏆</div>
                        <h1 className="text-5xl font-black text-yellow-400 mb-1">¡LOTERÍA!</h1>
                        <p className="text-white/50 mb-4 text-sm">
                            {iWon ? "¡GANASTE TÚ! 🎉" : `Ganó: ${shortAddr(winner.wallet_address ?? "")}`}
                        </p>

                        {/* Prize info */}
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-6 py-4 mb-6">
                            <p className="text-yellow-400 font-black text-3xl">{(totalPool / 1e9).toFixed(3)} SOL</p>
                            <p className="text-white/40 text-xs mt-1">{paidCount} jugadores × {((game.entry_fee_lamports ?? 0) / 1e9).toFixed(2)} SOL</p>
                        </div>

                        {/* HOST pays winner */}
                        {isHost && !hostWon && !payoutTx && (
                            <div className="mb-4">
                                <p className="text-white/60 text-sm mb-3">
                                    Como host, tú tienes el bote. Paga al ganador:
                                </p>
                                <button
                                    onClick={handlePayWinner}
                                    disabled={payoutLoading}
                                    className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all text-lg"
                                >
                                    {payoutLoading ? "⏳ Firmando en Phantom..." : `💸 Pagar ${(totalPool * 0.99 / 1e9).toFixed(3)} SOL al ganador`}
                                </button>
                                {payoutError && <p className="text-red-400 text-xs mt-2">{payoutError}</p>}
                            </div>
                        )}

                        {/* Payout confirmed */}
                        {payoutTx && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4">
                                <p className="text-green-400 font-bold">✅ Premio enviado</p>
                                <a href={`https://solscan.io/tx/${payoutTx}?cluster=devnet`} target="_blank" rel="noreferrer"
                                    className="text-cyan-400/60 text-[10px] font-mono hover:underline break-all">
                                    Ver en Solscan →
                                </a>
                            </div>
                        )}

                        {/* Host won, they keep the pot */}
                        {isHost && hostWon && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4 text-yellow-300 text-sm font-bold">
                                🎰 ¡Ganaste el bote! Los pagos ya están en tu wallet.
                            </div>
                        )}

                        {/* Non-host winner: if host hasn't paid yet */}
                        {!isHost && iWon && !payoutTx && (
                            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 mb-4 text-cyan-300 text-sm">
                                El host debe enviarte el premio ({(totalPool * 0.99 / 1e9).toFixed(3)} SOL) a tu wallet.
                            </div>
                        )}

                        <Link href="/lobby" className="block w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all text-sm">
                            Volver al Lobby
                        </Link>
                    </div>
                </div>
            )}

            {/* ── HEADER ── */}
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
                        {game.status === "waiting" ? "⏳ Esperando" : game.status === "playing" ? "🔴 En vivo" : "✅ Terminado"}
                    </span>
                    <span className="text-yellow-400 text-sm font-bold">
                        💰 {(totalPool / 1e9).toFixed(3)} SOL
                    </span>
                    {walletAddress && (
                        <span className="hidden sm:block text-white/30 text-xs font-mono">👻 {shortAddr(walletAddress)}</span>
                    )}
                </div>
            </header>

            {/* ── MAIN ── */}
            <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Col 1: Controls + Caller */}
                <div className="flex flex-col gap-4">

                    {/* HOST: Start button */}
                    {isHost && game.status === "waiting" && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <p className="text-white/40 text-xs uppercase tracking-wider font-bold">Rivales que apostaron</p>
                                <span className="font-black text-white">{paidNonHost} / {players.length <= 1 ? "1 (mini)" : players.length - 1}</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-[#E91E63] rounded-full transition-all"
                                    style={{ width: `${players.length > 1 ? (paidNonHost / (players.length - 1)) * 100 : 0}%` }} />
                            </div>

                            {!canStart ? (
                                <p className="text-yellow-400 text-xs text-center border border-yellow-500/30 bg-yellow-500/10 rounded-lg p-2">
                                    ⏳ Debes esperar a que algún oponente se una a la partida y termine de pagar la apuesta de {(game?.entry_fee_lamports ?? 0) / 1e9} SOL.
                                </p>
                            ) : (
                                <p className="text-green-400 text-xs text-center border border-green-500/30 bg-green-500/10 rounded-lg p-2">
                                    ✅ ¡Rivales listos! Haz clic para apostar tu parte e iniciar el juego.
                                </p>
                            )}

                            <button
                                onClick={handleStart}
                                disabled={startLoading || !canStart}
                                className="w-full h-14 bg-[#E91E63] hover:bg-[#C2185B] disabled:opacity-40 font-black rounded-xl transition-all shadow-lg"
                            >
                                {startLoading ? "⏳ Firmando apuesta en Phantom..." : `🎮 Apostar e Iniciar Partida`}
                            </button>

                            {startError && (
                                <p className="text-red-400 font-bold bg-red-500/10 border border-red-500/20 p-2 rounded-lg text-center text-sm">
                                    ⚠️ {startError}
                                </p>
                            )}
                        </div>
                    )}

                    {/* NON-HOST: waiting */}
                    {!isHost && game.status === "waiting" && myPlayer?.bet_tx && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 text-center">
                            <p className="text-green-400 font-black text-sm">✅ Apuesta pagada</p>
                            <p className="text-white/40 text-xs mt-1">Esperando que el host inicie la partida...</p>
                        </div>
                    )}

                    {/* NOT in game */}
                    {!myPlayer && !connected && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-center">
                            <p className="text-yellow-400 font-bold mb-2 text-sm">Conecta Phantom para jugar</p>
                            <button onClick={connect} className="bg-[#E91E63] font-bold px-4 py-2 rounded-xl text-sm">👻 Conectar</button>
                        </div>
                    )}

                    {/* Current card */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-4">
                        <p className="text-white/40 text-xs uppercase tracking-widest font-bold">🎴 Carta Actual</p>
                        <BigCard cardId={drawnIds[0]} />
                        <p className="text-white/30 text-xs">{drawnIds.length} / 54 cantadas</p>
                    </div>

                    {/* History */}
                    {drawnIds.length > 1 && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Anteriores</p>
                            <div className="flex flex-wrap gap-1.5">
                                {drawnIds.slice(1, 13).map(id => (
                                    <div key={id} title={CARD_BY_ID[id]?.name} className="w-9 h-12 bg-white rounded overflow-hidden flex flex-col opacity-50">
                                        <div className="flex-1 flex items-center justify-center text-sm bg-orange-50">{CARD_BY_ID[id]?.emoji}</div>
                                        <div className="bg-[#E91E63] py-0.5">
                                            <p className="text-white text-[4px] text-center font-bold uppercase truncate px-0.5">{CARD_BY_ID[id]?.name}</p>
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
                    ) : (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-white/30 text-center text-sm">
                            <div className="text-3xl mb-2">🎴</div>
                            No estás en esta partida
                        </div>
                    )}
                </div>

                {/* Col 3: Players + invite */}
                <div className="flex flex-col gap-4">

                    {/* Prize pool display */}
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-center">
                        <p className="text-white/40 text-xs uppercase tracking-wider font-bold mb-1">🏆 Bote Total</p>
                        <p className="text-yellow-400 font-black text-3xl">{(totalPool / 1e9).toFixed(3)} SOL</p>
                        <p className="text-white/25 text-[10px] mt-1">{paidCount} apuesta{paidCount !== 1 ? "s" : ""} × {((game.entry_fee_lamports ?? 0) / 1e9).toFixed(2)} SOL</p>
                    </div>

                    <h3 className="font-black text-base uppercase tracking-wider">Jugadores ({players.length})</h3>
                    <div className="flex flex-col gap-2">
                        {players.map(p => (
                            <div key={p.id} className={`bg-white/5 border rounded-xl px-4 py-3 flex items-center justify-between ${p.has_won ? "border-yellow-500/50 bg-yellow-500/10" : "border-white/10"}`}>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-xs text-white/60">{shortAddr(p.wallet_address ?? "")}</span>
                                    {p.wallet_address === game.host_wallet && <span className="text-[10px] text-yellow-400 font-bold">HOST</span>}
                                    {p.wallet_address === walletAddress && <span className="text-[10px] text-cyan-400 font-bold">TÚ</span>}
                                    {p.bet_tx
                                        ? <span className="text-[10px] text-green-400 font-bold">💰 Pagó</span>
                                        : <span className="text-[10px] text-red-400">⏳ Sin pagar</span>}
                                </div>
                                <div className="text-xs">
                                    {p.has_won
                                        ? <span className="text-yellow-400 font-black">🏆 ¡LOTERÍA!</span>
                                        : <span className="text-white/40">{(p.marked_card_ids ?? []).length}/16</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Invite */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-2 font-bold">📨 Código de invitación</p>
                        <div className="bg-black/30 rounded-xl px-4 py-3 text-center">
                            <p className="text-cyan-400 font-black text-2xl tracking-widest font-mono">{game.lobby_code}</p>
                        </div>
                        <p className="text-white/20 text-xs text-center mt-2">
                            Apuesta: {((game.entry_fee_lamports ?? 0) / 1e9).toFixed(2)} SOL por jugador
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
