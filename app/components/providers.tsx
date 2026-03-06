"use client";

import { GameProvider } from "../context/GameContext";
import { PropsWithChildren } from "react";

export function Providers({ children }: PropsWithChildren) {
  return (
    <GameProvider>
      {children}
    </GameProvider>
  );
}
