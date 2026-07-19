"use client";

import type { GameModeType } from "@/lib/game/types";

export interface ModeOption {
  type: GameModeType;
  name: string;
  description: string;
}

interface ModeSelectProps {
  modes: ModeOption[];
  selected?: GameModeType;
  onSelect: (mode: GameModeType) => void;
}

export default function ModeSelect({ modes, selected, onSelect }: ModeSelectProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {modes.map((mode) => {
        const isSelected = mode.type === selected;
        return (
          <button
            key={mode.type}
            data-testid={`mode-card-${mode.type}`}
            onClick={() => onSelect(mode.type)}
            className={`rounded-2xl border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              isSelected
                ? "border-primary bg-primary/10"
                : "border-border bg-panel hover:bg-panel/80"
            }`}
          >
            <h3 className="font-bold text-foreground">{mode.name}</h3>
            <p className="mt-1 text-xs text-muted">{mode.description}</p>
          </button>
        );
      })}
    </div>
  );
}
