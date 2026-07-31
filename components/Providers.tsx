"use client";

import type { ReactNode } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";
import { AppStateProvider } from "@/lib/state";
import { GameProvider } from "@/lib/context/GameContext";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppStateProvider>
          <GameProvider>
            {children}
          </GameProvider>
        </AppStateProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}