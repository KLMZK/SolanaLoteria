"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LOTERIA_CARDS } from "@/app/lib/cards";

// ─── Phantom helpers ──────────────────────────────────────────────────────────
function getPhantom() {
    if (typeof window === "undefined") return null;
    return (window as any).solana ?? null;
}

function useWalletAddress() {
    const [address, setAddress] = useState<string | null>(null);

    useEffect(() => {
        const phantom = getPhantom();
        if (!phantom) return;
        if (phantom.publicKey) setAddress(phantom.publicKey.toBase58());

        const handler = () => {
            if (phantom.publicKey) setAddress(phantom.publicKey.toBase58());
            else setAddress(null);
        };
        phantom.on("connect", handler);
        phantom.on("disconnect", () => setAddress(null));
        return () => { phantom.off?.("connect", handler); };
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

type GameRow = {
    id: string;
    lobby_code: string | null;
    status: string;
    host_wallet: string | null;
    created_at: string;
    player_count?: number;
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LobbyPage() {
    const router = useRouter();
    const walletAddress = useWalletAddress();
    const [games, setGames] = useState<GameRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [joinCode, setJoinCode] = useState("");
    const [joinError, setJoinError] = useState<string | null>(null);
    const [joiningId, setJoiningId] = useState<string | null>(null);

    // ── Connect Phantom if not connected ─────────────────────────────────────
    const connectWallet = async () => {
        const phantom = getPhantom();
        if (!phantom) {
            window.open("https://phantom.app", "_blank");
            return;
        }
        await phantom.connect();
    };

    // ── Load open games ───────────────────────────────────────────────────────
    const fetchGames = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("games")
            .select("id, lobby_code, status, host_wallet, created_at")
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

    // ── Join game (takes game id directly — no stale state) ───────────────────
    const joinGame = async (gameId: string) => {
        if (!walletAddress) { await connectWallet(); return; }
        setJoiningId(gameId);
        setJoinError(null);

        // Check already joined
        const { data: existing } = await supabase
            .from("game_players")
            .select("id")
            .eq("game_id", gameId)
            .eq("wallet_address", walletAddress)
            .maybeSingle();

        if (!existing) {
            const board = shuffle(LOTERIA_CARDS).slice(0, 16).map((c) => c.id);
            const { error } = await supabase.from("game_players").insert({
                game_id: gameId,
                wallet_address: walletAddress,
                board_card_ids: board,
                marked_card_ids: [],
            });
            if (error) {
                setJoinError("Error al unirse: " + error.message);
                setJoiningId(null);
                return;
            }
        }

        setJoiningId(null);
        router.push(`/game/${gameId}`);
    };

    // ── Create game ───────────────────────────────────────────────────────────
    const handleCreate = async () => {
        if (!walletAddress) { await connectWallet(); return; }
        setCreating(true);

        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: game, error } = await supabase
            .from("games")
            .insert({ host_wallet: walletAddress, status: "waiting", prize_pool: 0, lobby_code: code })
            .select()
            .single();

        if (error || !game) { setCreating(false); return; }

        // Host joins their own table
        const board = shuffle(LOTERIA_CARDS).slice(0, 16).map((c) => c.id);
        await supabase.from("game_players").insert({
            game_id: game.id,
            wallet_address: walletAddress,
            board_card_ids: board,
            marked_card_ids: [],
        });

        setCreating(false);
        router.push(`/game/${game.id}`);
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
                        </span>
                    ) : (
                        <button
                            onClick={connectWallet}
                            className="bg-[#E91E63] hover:bg-[#C2185B] text-white font-bold text-sm px-4 py-2 rounded-xl transition-all"
                        >
                            👻 Conectar Phantom
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-8">
                <div className="text-center">
                    <h2 className="text-4xl font-black mb-2">Sala de Espera</h2>
                    <p className="text-white/40">Crea una partida o únete con el código de 6 letras</p>
                </div>

                {!walletAddress && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 text-center">
                        <p className="text-yellow-400 font-bold mb-3">Necesitas conectar Phantom para jugar</p>
                        <button
                            onClick={connectWallet}
                            className="bg-[#E91E63] hover:bg-[#C2185B] text-white font-bold px-6 py-3 rounded-xl transition-all"
                        >
                            👻 Conectar Phantom
                        </button>
                    </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={handleCreate}
                        disabled={creating}
                        className="h-16 bg-[#E91E63] hover:bg-[#C2185B] disabled:opacity-50 font-black text-lg rounded-2xl transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-3"
                    >
                        {creating ? "⏳ Creando..." : "➕ Crear Partida"}
                    </button>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            maxLength={6}
                            placeholder="Código (ej. AB3K9Z)"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && handleJoinByCode()}
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 font-mono text-base uppercase tracking-widest focus:outline-none focus:border-cyan-400 transition-colors text-white"
                        />
                        <button
                            onClick={handleJoinByCode}
                            disabled={!!joiningId}
                            className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 font-bold px-5 rounded-2xl transition-all text-white"
                        >
                            {joiningId ? "⏳" : "Unirse"}
                        </button>
                    </div>
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
                        <button onClick={fetchGames} className="text-white/40 hover:text-white text-sm transition-colors">
                            🔄 Actualizar
                        </button>
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
                            {games.map((game) => (
                                <div key={game.id} className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl px-5 py-4 flex items-center justify-between transition-all">
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono text-xl font-black text-cyan-400 tracking-widest">{game.lobby_code}</span>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-white/40">{game.player_count ?? 0} jugadores</span>
                                            {game.host_wallet === walletAddress && (
                                                <span className="text-xs text-yellow-400 font-bold">TU PARTIDA</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => joinGame(game.id)}
                                        disabled={joiningId === game.id}
                                        className="bg-[#E91E63] hover:bg-[#C2185B] disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all"
                                    >
                                        {joiningId === game.id ? "⏳" : "Unirse →"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
