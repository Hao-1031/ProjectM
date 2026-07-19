"use client";

import type { HeroId } from "@/lib/game/types";
import type { HeroDef } from "@/lib/game/heroes";

interface HeroSelectProps {
  heroes: HeroDef[];
  selected?: HeroId;
  onSelect: (heroId: HeroId) => void;
}

export default function HeroSelect({ heroes, selected, onSelect }: HeroSelectProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {heroes.map((hero) => {
        const isSelected = hero.id === selected;
        return (
          <button
            key={hero.id}
            data-testid={`hero-card-${hero.id}`}
            onClick={() => onSelect(hero.id)}
            className={`rounded-2xl border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              isSelected
                ? "border-primary bg-primary/10"
                : "border-border bg-panel hover:bg-panel/80"
            }`}
          >
            <h3 className="font-bold" style={{ color: hero.color }}>
              {hero.name}
            </h3>
            <p className="mt-1 text-xs text-muted">{hero.description}</p>
          </button>
        );
      })}
    </div>
  );
}
