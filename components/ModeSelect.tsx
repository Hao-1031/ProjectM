"use client";

import { motion, useReducedMotion } from "framer-motion";
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
  const reducedMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {modes.map((mode, index) => {
        const isSelected = mode.type === selected;
        return (
          <motion.button
            key={mode.type}
            data-testid={`mode-card-${mode.type}`}
            onClick={() => onSelect(mode.type)}
            initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
            whileTap={reducedMotion ? undefined : { scale: 0.98 }}
            className={`relative min-h-[72px] rounded-2xl border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-[0.98] sm:min-h-[88px] sm:p-4 ${
              isSelected
                ? "border-primary bg-primary/10"
                : "border-border bg-panel hover:bg-panel/80"
            }`}
          >
            <h3 className="text-sm font-bold text-foreground sm:text-base">{mode.name}</h3>
            <p className="mt-1 line-clamp-2 text-[10px] text-muted sm:text-xs">{mode.description}</p>
            {isSelected && (
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
