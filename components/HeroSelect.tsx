"use client";

import { motion } from "framer-motion";
import type { HeroId } from "@/lib/game/types";
import type { HeroDef } from "@/lib/game/heroes";
import { useReducedMotion } from "framer-motion";

interface HeroSelectProps {
  heroes: HeroDef[];
  selected?: HeroId;
  onSelect: (heroId: HeroId) => void;
}

export default function HeroSelect({ heroes, selected, onSelect }: HeroSelectProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
      {heroes.map((hero, index) => {
        const isSelected = hero.id === selected;
        return (
          <motion.button
            key={hero.id}
            data-testid={`hero-card-${hero.id}`}
            onClick={() => onSelect(hero.id)}
            initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
            whileTap={reducedMotion ? undefined : { scale: 0.98 }}
            className={`relative min-h-[80px] rounded-2xl border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-[0.98] sm:min-h-[96px] sm:p-4 ${
              isSelected
                ? "border-primary bg-primary/10"
                : "border-border bg-panel hover:bg-panel/80"
            }`}
          >
            <div
              className="absolute inset-x-0 top-0 h-1 rounded-t-2xl opacity-70"
              style={{ backgroundColor: hero.color }}
            />
            <h3 className="mt-2 text-sm font-bold sm:text-base" style={{ color: hero.color }}>
              {hero.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-[10px] text-muted sm:text-xs">{hero.role}</p>
            {isSelected && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
