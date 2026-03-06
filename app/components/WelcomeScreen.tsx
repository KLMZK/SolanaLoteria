import React from "react";
import "@fontsource/space-grotesk"; // ensure font is loaded

export function WelcomeScreen() {
  return (
    <div className="bg-welcome-bg-light dark:bg-welcome-bg-dark font-display text-slate-900 dark:text-slate-100 antialiased overflow-x-hidden min-h-screen">
      {/* Main Wrapper with Festive Background Pattern */}
      <div className="relative min-h-screen w-full flex flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_50%,_rgba(127,19,236,0.15),_transparent_70%)]">
        {/* Top Navigation Bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-welcome-primary/20 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="text-welcome-primary size-8">
              <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.263 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z"></path>
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Solana <span className="text-welcome-primary">Loteria</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex gap-6 mr-6">
              <a className="text-sm font-medium hover:text-welcome-primary transition-colors" href="#">How to Play</a>
              <a className="text-sm font-medium hover:text-welcome-primary transition-colors" href="#">Lobbies</a>
              <a className="text-sm font-medium hover:text-welcome-primary transition-colors" href="#">Leaderboard</a>
            </nav>
            <button className="flex items-center gap-2 px-5 h-11 bg-welcome-primary hover:bg-welcome-primary/90 text-white rounded-lg font-bold text-sm transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-welcome-primary/25">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              <span>Connect Wallet</span>
            </button>
          </div>
        </header>
        {/* Hero Content */}
        <main className="flex-grow flex flex-col items-center justify-center relative px-6 py-12">
          {/* Subtle Floating Cards Decoration */}
          <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-30 overflow-hidden">
            <div className="absolute top-[10%] left-[5%] rotate-[-12deg] w-32 h-48 bg-slate-800 rounded-lg border-2 border-welcome-primary/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-welcome-primary">potted_plant</span>
            </div>
            <div className="absolute top-[60%] left-[10%] rotate-[15deg] w-28 h-40 bg-slate-800 rounded-lg border-2 border-welcome-primary/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-yellow-500">star</span>
            </div>
            <div className="absolute top-[15%] right-[8%] rotate-[10deg] w-36 h-52 bg-slate-800 rounded-lg border-2 border-welcome-primary/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-blue-400">brightness_2</span>
            </div>
            <div className="absolute bottom-[10%] right-[15%] rotate-[-8deg] w-32 h-48 bg-slate-800 rounded-lg border-2 border-welcome-primary/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-red-500">favorite</span>
            </div>
          </div>
          {/* Welcome Card */}
          <div className="z-10 text-center max-w-2xl w-full p-8 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl border border-welcome-primary/10 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-welcome-primary/20 text-welcome-primary rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-welcome-primary/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-welcome-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-welcome-primary"></span>
              </span>
              On-Chain Raffle Live
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter text-slate-900 dark:text-slate-100">
              SOLANA <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-welcome-primary to-pink-500 italic">LOTERIA</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl mb-10 max-w-lg mx-auto">
              The ultimate blockchain version of the classic Mexican game. Win SOL, collect unique card NFTs, and shout &quot;LOTERIA!&quot; across the metaverse.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto min-w-[200px] h-14 bg-welcome-primary hover:bg-welcome-primary/90 text-white rounded-xl font-black text-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-welcome-primary/40 group">
                <span>PLAY NOW</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">play_arrow</span>
              </button>
              <button className="w-full sm:w-auto min-w-[200px] h-14 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all">
                <span className="material-symbols-outlined">help_outline</span>
                <span>Tutorial</span>
              </button>
            </div>
            {/* Stats Row */}
            <div className="mt-12 grid grid-cols-3 gap-4 border-t border-welcome-primary/10 pt-8">
              <div>
                <div className="text-2xl font-black text-welcome-primary">1,240</div>
                <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">Active Players</div>
              </div>
              <div className="border-x border-welcome-primary/10">
                <div className="text-2xl font-black text-welcome-primary">452 SOL</div>
                <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">Total Won</div>
              </div>
              <div>
                <div className="text-2xl font-black text-welcome-primary">98%</div>
                <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">Provably Fair</div>
              </div>
            </div>
          </div>
          {/* Feature Grid Bottom */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full z-10">
            <div className="p-6 bg-slate-900/40 rounded-xl border border-welcome-primary/10 hover:border-welcome-primary/40 transition-all group">
              <div className="w-12 h-12 rounded-lg bg-welcome-primary/20 flex items-center justify-center text-welcome-primary mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Fastest Draws</h3>
              <p className="text-sm text-slate-400">Powered by Solana&apos;s lightning speed. Cards are drawn every 10 seconds for non-stop action.</p>
            </div>
            <div className="p-6 bg-slate-900/40 rounded-xl border border-welcome-primary/10 hover:border-welcome-primary/40 transition-all group">
              <div className="w-12 h-12 rounded-lg bg-welcome-primary/20 flex items-center justify-center text-welcome-primary mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">verified_user</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Secure &amp; Verifiable</h3>
              <p className="text-sm text-slate-400">Every draw is recorded on the blockchain with VRF technology for 100% transparency.</p>
            </div>
            <div className="p-6 bg-slate-900/40 rounded-xl border border-welcome-primary/10 hover:border-welcome-primary/40 transition-all group">
              <div className="w-12 h-12 rounded-lg bg-welcome-primary/20 flex items-center justify-center text-welcome-primary mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">celebration</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Festive Spirit</h3>
              <p className="text-sm text-slate-400">Classic Mexican aesthetic meets modern web3 interface. Experience culture in crypto.</p>
            </div>
          </div>
        </main>
        {/* Footer Area */}
        <footer className="px-6 py-6 border-t border-welcome-primary/10 flex flex-col md:flex-row items-center justify-between text-xs font-medium text-slate-500 gap-4">
          <div className="flex items-center gap-4">
            <span>© 2024 Solana Loteria</span>
            <a className="hover:text-welcome-primary" href="#">Terms</a>
            <a className="hover:text-welcome-primary" href="#">Privacy</a>
          </div>
          <div className="flex items-center gap-6">
            <a className="flex items-center gap-1 hover:text-welcome-primary" href="#">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
              Twitter
            </a>
            <a className="flex items-center gap-1 hover:text-welcome-primary" href="#">
              <span className="material-symbols-outlined text-sm">groups</span>
              Discord
            </a>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Solana Mainnet: Active
            </div>
          </div>
        </footer>
        {/* Decorative Gradients */}
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-welcome-primary/20 blur-[120px] -z-10 rounded-full"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-pink-500/10 blur-[120px] -z-10 rounded-full"></div>
      </div>
    </div>
  );
}
