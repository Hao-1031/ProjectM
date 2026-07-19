import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Lock,
  Check,
  Star,
  Plus,
  ArrowBendUpRight,
  Lightning,
  Shield,
  Heart,
  Crosshair,
} from "@phosphor-icons/react";

export type TalentCategory = "offense" | "defense" | "utility";

export interface Talent {
  id: string;
  name: string;
  description: string;
  category: TalentCategory;
  maxRank: number;
  currentRank: number;
  requires?: string[];
  icon?: "offense" | "defense" | "utility" | "lightning" | "shield" | "heart" | "crosshair";
}

export interface TalentTreeProps {
  heroName: string;
  heroColor?: string;
  talents: Talent[];
  availablePoints: number;
  onUpgrade: (talentId: string) => void;
  readOnly?: boolean;
}

const CATEGORY_META: Record<
  TalentCategory,
  { label: string; color: string; border: string; bg: string }
> = {
  offense: {
    label: "进攻",
    color: "text-danger",
    border: "border-danger/30",
    bg: "bg-danger/10",
  },
  defense: {
    label: "防御",
    color: "text-success",
    border: "border-success/30",
    bg: "bg-success/10",
  },
  utility: {
    label: "辅助",
    color: "text-primary",
    border: "border-primary/30",
    bg: "bg-primary/10",
  },
};

const ICON_MAP: Record<NonNullable<Talent["icon"]>, typeof Lightning> = {
  offense: Lightning,
  defense: Shield,
  utility: ArrowBendUpRight,
  lightning: Lightning,
  shield: Shield,
  heart: Heart,
  crosshair: Crosshair,
};

function isUnlockable(talent: Talent, talentMap: Map<string, Talent>): boolean {
  if (talent.currentRank >= talent.maxRank) return false;
  if (!talent.requires || talent.requires.length === 0) return true;
  return talent.requires.every((id) => {
    const req = talentMap.get(id);
    return req !== undefined && req.currentRank > 0;
  });
}

function TalentNode({
  talent,
  canUnlock,
  hasPoints,
  heroColor,
  onUpgrade,
  readOnly,
}: {
  talent: Talent;
  canUnlock: boolean;
  hasPoints: boolean;
  heroColor?: string;
  onUpgrade: () => void;
  readOnly?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const meta = CATEGORY_META[talent.category];
  const Icon = talent.icon ? ICON_MAP[talent.icon] : ICON_MAP[talent.category];
  const isMaxed = talent.currentRank >= talent.maxRank;
  const isLocked = !canUnlock && !isMaxed && talent.currentRank === 0;
  const canClick = !readOnly && hasPoints && canUnlock && !isMaxed;

  return (
    <motion.button
      type="button"
      disabled={!canClick}
      onClick={onUpgrade}
      whileHover={reducedMotion || !canClick ? undefined : { y: -2 }}
      whileTap={reducedMotion || !canClick ? undefined : { scale: 0.98 }}
      className={`group relative flex flex-col items-center rounded-2xl border p-4 text-center transition-all focus-ring md:p-5 ${
        isMaxed
          ? `${meta.border} ${meta.bg}`
          : canClick
            ? `${meta.border} bg-panel hover:bg-panel-raised`
            : "border-border bg-panel/60 opacity-70"
      }`}
      aria-label={`${talent.name}，当前等级 ${talent.currentRank}/${talent.maxRank}`}
    >
      {isLocked && (
        <div className="absolute right-2 top-2 text-muted">
          <Lock size={12} weight="bold" />
        </div>
      )}

      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors md:h-14 md:w-14 ${
          isMaxed
            ? `${meta.border} bg-background ${meta.color}`
            : canClick
              ? `border-border bg-background ${meta.color} group-hover:border-current`
              : "border-border bg-panel-raised text-muted"
        }`}
      >
        {isMaxed ? <Check size={24} weight="bold" /> : <Icon size={24} weight="bold" />}
      </div>

      <h4 className="mt-3 text-xs font-bold md:text-sm">{talent.name}</h4>
      <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-muted md:text-xs">
        {talent.description}
      </p>

      <div className="mt-3 flex items-center gap-1">
        {Array.from({ length: talent.maxRank }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-3 rounded-full md:w-4 ${
              i < talent.currentRank ? (isMaxed ? "bg-current" : "bg-current") : "bg-border"
            }`}
            style={i < talent.currentRank ? { color: heroColor ?? "var(--primary)" } : undefined}
          />
        ))}
      </div>

      {canClick && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-background shadow-md">
          <Plus size={10} weight="bold" />
        </div>
      )}
    </motion.button>
  );
}

export default function TalentTree({
  heroName,
  heroColor,
  talents,
  availablePoints,
  onUpgrade,
  readOnly = false,
}: TalentTreeProps) {
  const reducedMotion = useReducedMotion();
  const talentMap = useMemo(() => {
    const map = new Map<string, Talent>();
    talents.forEach((t) => map.set(t.id, t));
    return map;
  }, [talents]);

  const categories: TalentCategory[] = ["offense", "defense", "utility"];

  return (
    <div className="rounded-2xl border border-border bg-panel p-5 shadow-2xl md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold md:text-xl">{heroName} 天赋</h3>
          <p className="mt-1 text-xs text-muted">分配天赋点以强化英雄在据点防守中的表现</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-panel-raised px-3 py-2">
            <Star size={18} weight="bold" className="text-warning" />
            <span className="font-mono text-sm font-bold">{availablePoints}</span>
            <span className="text-xs text-muted">可用点数</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {categories.map((category) => {
          const meta = CATEGORY_META[category];
          const categoryTalents = talents.filter((t) => t.category === category);

          return (
            <motion.section
              key={category}
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${meta.bg.replace("/10", "")}`} />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>
                  {meta.label}
                </h4>
              </div>

              <div className="flex flex-1 flex-col gap-3">
                {categoryTalents.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-panel-raised p-6 text-center">
                    <p className="text-xs text-muted">该分支暂无天赋</p>
                  </div>
                ) : (
                  categoryTalents.map((talent) => {
                    const canUnlock = isUnlockable(talent, talentMap);
                    return (
                      <TalentNode
                        key={talent.id}
                        talent={talent}
                        canUnlock={canUnlock}
                        hasPoints={availablePoints > 0}
                        heroColor={heroColor}
                        onUpgrade={() => onUpgrade(talent.id)}
                        readOnly={readOnly}
                      />
                    );
                  })
                )}
              </div>
            </motion.section>
          );
        })}
      </div>

      {readOnly && (
        <div className="mt-6 rounded-xl border border-border bg-panel-raised p-3 text-center text-xs text-muted">
          当前为只读预览，实际点数在波次间隙商店中分配
        </div>
      )}
    </div>
  );
}
