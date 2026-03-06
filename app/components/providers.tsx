"use client";

import { GameProvider } from "../context/GameContext";
import { WalletContextProvider } from "../context/WalletContext";
import { PropsWithChildren } from "react";

export function Providers({ children }: PropsWithChildren) {
  return (
    <WalletContextProvider>
      <GameProvider>
        {children}
      </GameProvider>
    </WalletContextProvider>
  );
}
