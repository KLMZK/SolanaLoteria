"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LOTERIA_CARDS } from "@/app/lib/cards";
import { useWallet } from "@/app/context/WalletContext";

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

const BET_OPTIONS = [
    { label: "0.05 SOL", lamports: Math.round(0.05 * 1e9) },
    { label: "0.1 SOL", lamports: Math.round(0.1 * 1e9) },
    { label: "0.25 SOL", lamports: Math.round(0.25 * 1e9) },
];

type GameRow = {
    id: string;
    lobby_code: string | null;
    status: string;
    host_wallet: string | null;
    entry_fee_lamports: number | null;
    created_at: string;
    player_count?: number;
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LobbyPage() {
    const router = useRouter();
    const { publicKey, connect, connected, balance, placeBet } = useWallet();
    const walletAddress = publicKey?.toBase58() ?? null;

    const [games, setGames] = useState<GameRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [joinCode, setJoinCode] = useState("");
    const [joinError, setJoinError] = useState<string | null>(null);
    const [joiningId, setJoiningId] = useState<string | null>(null);
    const [newBet, setNewBet] = useState(BET_OPTIONS[1].lamports);

    // ── Load open games ───────────────────────────────────────────────────────
    const fetchGames = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("games")
            .select("id, lobby_code, status, host_wallet, entry_fee_lamports, created_at")
            .eq("status", "waiting")
            .order("created_at", { ascending: false })
            .limit(20);

        if (!error && data) {
            const withCounts = await Promise.all(
                data.map(async (g) => {
                    const { count } = await supabase
                        .from("game_players")
                        .select("*", { count: "exact", head: true })
                        .eq("game_id", g.id);
                    return { ...g, player_count: count ?? 0 };
                })
            );
            setGames(withCounts);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchGames(); }, [fetchGames]);

    // Realtime lobby list
    useEffect(() => {
        const ch = supabase
            .channel("lobby-list")
            .on("postgres_changes", { event: "*", schema: "public", table: "games" }, fetchGames)
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [fetchGames]);

    // ── Create game ───────────────────────────────────────────────────────────
    const handleCreate = async () => {
        if (!walletAddress) { await connect(); return; }
        setCreating(true);

        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: game, error } = await supabase
            .from("games")
            .insert({
                host_wallet: walletAddress,
                status: "waiting",
                prize_pool: 0,
                lobby_code: code,
                entry_fee_lamports: newBet,
            })
            .select()
            .single();

        if (error || !game) { setCreating(false); return; }

        // Host joins — no payment needed from host (they're the bank)
        const board = shuffle(LOTERIA_CARDS).slice(0, 16).map((c) => c.id);
        await supabase.from("game_players").insert({
            game_id: game.id,
            wallet_address: walletAddress,
            board_card_ids: board,
            marked_card_ids: [],
            bet_tx: "host", // host doesn't need to pay themselves
        });

        setCreating(false);
        router.push(`/game/${game.id}`);
    };

    // ── Join + pay bet ────────────────────────────────────────────────────────
    const joinGame = async (gameId: string) => {
        if (!walletAddress) { await connect(); return; }
        setJoiningId(gameId);
        setJoinError(null);

        // Get game info
        const { data: gameData } = await supabase
            .from("games")
            .select("host_wallet, entry_fee_lamports, status")
            .eq("id", gameId)
            .single();

        if (!gameData || gameData.status !== "waiting") {
            setJoinError("Partida no disponible.");
            setJoiningId(null);
            return;
        }

        // Check already joined
        const { data: existing } = await supabase
            .from("game_players")
            .select("id, bet_tx")
            .eq("game_id", gameId)
            .eq("wallet_address", walletAddress)
            .maybeSingle();

        if (existing?.bet_tx) {
            // Already paid — just go
            setJoiningId(null);
            router.push(`/game/${gameId}`);
            return;
        }

        // Pay the bet
        const betLamports = gameData.entry_fee_lamports ?? Math.round(0.1 * 1e9);
        const hostWallet = gameData.host_wallet ?? "";

        if (!hostWallet) {
            setJoinError("Host wallet no encontrado.");
            setJoiningId(null);
            return;
        }

        const betSOL = betLamports / 1e9;
        if (balance !== null && balance < betSOL) {
            setJoinError(`Balance insuficiente. Necesitas ${betSOL} SOL.`);
            setJoiningId(null);
            return;
        }

        const sig = await placeBet(betLamports, hostWallet);
        if (!sig) {
            setJoinError("Apuesta cancelada. No se unió a la partida.");
            setJoiningId(null);
            return;
        }

        // Insert or update player with bet_tx
        if (existing) {
            await supabase.from("game_players").update({ bet_tx: sig }).eq("id", existing.id);
        } else {
            const board = shuffle(LOTERIA_CARDS).slice(0, 16).map((c) => c.id);
            const { error } = await supabase.from("game_players").insert({
                game_id: gameId,
                wallet_address: walletAddress,
                board_card_ids: board,
                marked_card_ids: [],
                bet_tx: sig,
            });
            if (error) {
                setJoinError("Error al unirse: " + error.message);
                setJoiningId(null);
                return;
            }
        }

        // Update prize pool
        await supabase.from("games").update({
            prize_pool: supabase.rpc as any, // we'll just track via player count
        }).eq("id", gameId);

        setJoiningId(null);
        router.push(`/game/${gameId}`);
    };

    // ── Join by code ──────────────────────────────────────────────────────────
    const handleJoinByCode = async () => {
        setJoinError(null);
        const trim = joinCode.trim().toUpperCase();
        if (!trim) return;

        const { data: game } = await supabase
            .from("games")
            .select("id, status")
            .eq("lobby_code", trim)
            .maybeSingle();

        if (!game) { setJoinError("Código no encontrado."); return; }
        if (game.status !== "waiting") { setJoinError("Esta partida ya comenzó o terminó."); return; }
        await joinGame(game.id);
    };

    // ─── UI ───────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen text-white" style={{
            backgroundColor: "#1a1a2e",
            backgroundImage: "radial-gradient(at 0% 0%, rgba(233,30,99,0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(0,188,212,0.10) 0px, transparent 50%)"
        }}>
            <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <span className="text-2xl">🎴</span>
                    <h1 className="text-xl font-black tracking-tight">SOLANA <span className="text-[#E91E63]">LOTERÍA</span></h1>
                </Link>
                <div className="flex items-center gap-3">
                    {walletAddress ? (
                        <span className="text-white/40 text-xs font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                            👻 {shortAddr(walletAddress)}
                            {balance !== null && <span className="text-yellow-400 ml-2">{balance.toFixed(3)} SOL</span>}
                        </span>
                    ) : (
                        <button onClick={connect} className="bg-[#E91E63] hover:bg-[#C2185B] text-white font-bold text-sm px-4 py-2 rounded-xl transition-all">
                            👻 Conectar Phantom
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-8">
                <div className="text-center">
                    <h2 className="text-4xl font-black mb-2">Sala de Espera</h2>
                    <p className="text-white/40">Crea una partida con apuesta o únete con el código</p>
                </div>

                {!connected && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 text-center">
                        <p className="text-yellow-400 font-bold mb-3">Conecta Phantom para jugar</p>
                        <button onClick={connect} className="bg-[#E91E63] hover:bg-[#C2185B] text-white font-bold px-6 py-3 rounded-xl transition-all">
                            👻 Conectar Phantom
                        </button>
                    </div>
                )}

                {/* Create game panel */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                    <p className="font-black uppercase tracking-widest text-white/60 text-sm">➕ Crear Partida</p>

                    <div>
                        <p className="text-white/40 text-xs mb-2 font-bold uppercase tracking-wider">Apuesta por jugador (obligatoria)</p>
                        <div className="flex gap-2">
                            {BET_OPTIONS.map(opt => (
                                <button key={opt.label}
                                    onClick={() => setNewBet(opt.lamports)}
                                    className={`flex-1 py-3 rounded-xl text-sm font-black border transition-all ${newBet === opt.lamports
                                            ? "bg-[#E91E63] border-[#E91E63] text-white shadow-lg shadow-pink-500/20"
                                            : "bg-white/5 border-white/10 text-white/50 hover:border-white/30 hover:text-white"}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-white/20 text-xs mt-2 text-center">
                            El ganador recibe todo el bote: todos pagan, uno gana 🏆
                        </p>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={creating || !connected}
                        className="h-14 bg-[#E91E63] hover:bg-[#C2185B] disabled:opacity-50 font-black text-lg rounded-2xl transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-3"
                    >
                        {creating ? "⏳ Creando..." : `Crear Partida (${(newBet / 1e9).toFixed(2)} SOL por jugador)`}
                    </button>
                </div>

                {/* Join by code */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        maxLength={6}
                        placeholder="Código de la partida (ej. AB3K9Z)"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleJoinByCode()}
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 font-mono text-base uppercase tracking-widest focus:outline-none focus:border-cyan-400 transition-colors text-white"
                    />
                    <button
                        onClick={handleJoinByCode}
                        disabled={!!joiningId}
                        className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 font-bold px-6 rounded-2xl transition-all text-white"
                    >
                        {joiningId ? "⏳" : "Unirse"}
                    </button>
                </div>

                {joinError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
                        {joinError}
                    </div>
                )}

                {/* Games list */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-lg uppercase tracking-wider">Partidas Abiertas</h3>
                        <button onClick={fetchGames} className="text-white/40 hover:text-white text-sm transition-colors">🔄</button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-white/30">Cargando...</div>
                    ) : games.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10 text-white/30">
                            <div className="text-4xl mb-3">🎴</div>
                            No hay partidas abiertas. ¡Crea la primera!
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {games.map((game) => {
                                const betSOL = ((game.entry_fee_lamports ?? 0) / 1e9).toFixed(2);
                                const isMyGame = game.host_wallet === walletAddress;
                                return (
                                    <div key={game.id} className={`bg-white/5 border rounded-2xl px-5 py-4 flex items-center justify-between transition-all ${isMyGame ? "border-yellow-500/30" : "border-white/10 hover:border-white/20"}`}>
                                        <div className="flex items-center gap-5">
                                            <span className="font-mono text-xl font-black text-cyan-400 tracking-widest">{game.lobby_code}</span>
                                            <div>
                                                <div className="text-sm font-bold text-white/80">💰 {betSOL} SOL</div>
                                                <div className="text-xs text-white/40">{game.player_count} jugadores</div>
                                            </div>
                                            {isMyGame && <span className="text-xs text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full">TU PARTIDA</span>}
                                        </div>
                                        <button
                                            onClick={() => isMyGame ? router.push(`/game/${game.id}`) : joinGame(game.id)}
                                            disabled={joiningId === game.id}
                                            className="bg-[#E91E63] hover:bg-[#C2185B] disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
                                        >
                                            {joiningId === game.id ? "⏳ Pagando..." :
                                                isMyGame ? "Entrar →" : `Apostar ${betSOL} SOL →`}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
