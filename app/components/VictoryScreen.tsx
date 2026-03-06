import React from "react";
import "@fontsource/space-grotesk";

export function VictoryScreen() {
    return (
        <div className="bg-victory-bg-light dark:bg-victory-bg-dark font-display text-slate-900 dark:text-slate-100 overflow-hidden min-h-screen">
            <style dangerouslySetInnerHTML={{
                __html: `
        .gold-gradient-text {
            background: linear-gradient(to bottom, #FFD700, #FFA500);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .confetti-pattern {
            background-image: radial-gradient(circle, #2bee6c 1px, transparent 1px), radial-gradient(circle, #FFD700 1px, transparent 1px);
            background-size: 40px 40px;
            background-position: 0 0, 20px 20px;
        }
      `}} />
            {/* Background Game Screen (Dimmed/Blurred) */}
            <div className="fixed inset-0 z-0 opacity-40 blur-sm pointer-events-none">
                <div className="layout-container flex h-full flex-col">
                    <div className="px-10 lg:px-40 flex flex-1 justify-center py-5">
                        <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
                            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-victory-primary/20 px-10 py-3">
                                <div className="flex items-center gap-4">
                                    <div className="size-6 text-victory-primary">
                                        <span className="material-symbols-outlined">token</span>
                                    </div>
                                    <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">Solana Lottery</h2>
                                </div>
                                <div className="flex flex-1 justify-end gap-8">
                                    <div className="flex items-center gap-9 opacity-50">
                                        <span className="text-sm font-medium">Home</span>
                                        <span className="text-sm font-medium">Games</span>
                                        <span className="text-sm font-medium">Leaderboard</span>
                                    </div>
                                    <button className="flex min-w-[84px] items-center justify-center rounded-lg h-10 px-4 bg-victory-primary text-background-dark text-sm font-bold">
                                        0x71C...3A2
                                    </button>
                                </div>
                            </header>
                            <div className="grid grid-cols-3 gap-6 mt-12">
                                <div className="h-64 bg-victory-primary/10 rounded-xl border border-victory-primary/20"></div>
                                <div className="h-64 bg-victory-primary/10 rounded-xl border border-victory-primary/20"></div>
                                <div className="h-64 bg-victory-primary/10 rounded-xl border border-victory-primary/20"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Victory Overlay Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-dark/80 backdrop-blur-md">
                {/* Confetti/Particle layer */}
                <div className="absolute inset-0 confetti-pattern opacity-20"></div>
                <div className="relative max-w-[600px] w-full mx-4 bg-slate-900/40 border border-victory-primary/30 rounded-3xl p-8 md:p-12 text-center shadow-[0_0_50px_rgba(43,238,108,0.2)] overflow-hidden">
                    {/* Decorative Glow */}
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-victory-primary/20 rounded-full blur-[80px]"></div>
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px]"></div>
                    {/* Icon Header */}
                    <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-victory-primary/10 border-4 border-victory-primary shadow-[0_0_20px_rgba(43,238,108,0.4)]">
                        <span className="material-symbols-outlined text-5xl text-victory-primary" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                    </div>
                    {/* Title */}
                    <h1 className="gold-gradient-text text-6xl md:text-8xl font-black italic tracking-tighter mb-4">
                        VICTORY!
                    </h1>
                    {/* Winner Content */}
                    <div className="space-y-4 mb-10">
                        <p className="text-2xl md:text-3xl font-bold text-slate-100">
                            <span className="text-victory-primary">@SolanaWhale</span> has won <span className="text-yellow-400">25.5 SOL</span>
                        </p>
                        <p className="text-slate-400 text-lg max-w-md mx-auto">
                            Congratulations on your massive win! Your reward has been transferred to your connected wallet.
                        </p>
                    </div>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="bg-victory-primary/5 border border-victory-primary/10 rounded-xl p-4">
                            <p className="text-xs uppercase tracking-widest text-victory-primary/60 font-bold mb-1">Total Prize</p>
                            <p className="text-2xl font-bold text-slate-100">25.5 SOL</p>
                        </div>
                        <div className="bg-victory-primary/5 border border-victory-primary/10 rounded-xl p-4">
                            <p className="text-xs uppercase tracking-widest text-victory-primary/60 font-bold mb-1">Win Multiplier</p>
                            <p className="text-2xl font-bold text-slate-100">x42.0</p>
                        </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col gap-4">
                        <button className="w-full py-5 bg-victory-primary hover:bg-victory-primary/90 text-background-dark rounded-xl font-bold text-xl transition-all shadow-[0_4px_20px_rgba(43,238,108,0.4)] flex items-center justify-center gap-2 group">
                            <span className="material-symbols-outlined">refresh</span>
                            Play Again
                        </button>
                        <button className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-sm">share</span>
                            Share Result
                        </button>
                    </div>
                    {/* Footer Decorative */}
                    <div className="mt-8 flex justify-center gap-4">
                        <div className="h-1 w-12 bg-victory-primary/20 rounded-full"></div>
                        <div className="h-1 w-12 bg-victory-primary/20 rounded-full"></div>
                        <div className="h-1 w-12 bg-victory-primary/20 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
