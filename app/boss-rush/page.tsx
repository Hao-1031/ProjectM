"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Skull, Play, Lock, Check, CaretRight, Star, Crown,
  Crosshair, Shield, Sparkle, Sword, Trophy,
  Clock, Fire, Lightning, Coins, Timer, ArrowsClockwise,
  NumberCircleOne, NumberCircleTwo, NumberCircleThree,
  NumberCircleFour, NumberCircleFive, NumberCircleSix,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import DimensionBackground from "@/components/effects/DimensionBackground";
import {
  BOSS_RUSH_TIERS,
  getBossRushTier,
  isTierUnlocked,
  getTierProgress,
  getBossRushDisplay,
  type BossRushProgress,
  type BossRushBossDisplay,
  DEFAULT_BOSS_RUSH_PROGRESS,
} from "@/lib/game/boss-rush";
import { loadSave, type SaveData } from "@/lib/game/save";

const DIFFICULTY_COLORS: Record<string, string> = {
  normal: "var(--primary)",
  hard: "var(--warning, #f59e0b)",
  extreme: "var(--entropy)",
  nightmare: "var(--danger, #ef4444)",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  normal: "普通",
  hard: "困难",
  extreme: "极限",
  nightmare: "噩梦",
};

const BOSS_NUMBERS: Record<number, typeof NumberCircleOne> = {
  0: NumberCircleOne, 1: NumberCircleTwo, 2: NumberCircleThree,
  3: NumberCircleFour, 4: NumberCircleFive, 5: NumberCircleSix,
};

function BossCard({
  boss,
  tierIndex,
  defeated,
  isActive,
}: {
  boss: BossRushBossDisplay;
  tierIndex: number;
  defeated: boolean;
  isActive: boolean;
}) {
  const NumberIcon = BOSS_NUMBERS[tierIndex] ?? NumberCircleOne;

  return (
    <motion.div
      className={`group station-panel flex items-center gap-3 p-3 transition-all ${
        defeated
          ? "border-emerald-500/20"
          : isActive
            ? "border-primary/30"
            : ""
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${boss.factionColor}18` }}>
        {defeated ? (
          <Check size={18} weight="bold" className="text-emerald-400" />
        ) : (
          <Skull size={18} weight="bold" style={{ color: boss.factionColor }} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold">{boss.name}</span>
          <NumberIcon size={14} weight="fill" className="text-muted" />
        </div>
        <p className="text-[10px] text-muted line-clamp-1">{boss.description}</p>
      </div>
      <div className="text-right">
        <span className="text-[10px] font-mono tabular-nums text-muted">{boss.phases} 阶段</span>
        {defeated && (
          <span className="block text-[9px] font-bold text-emerald-400">已击败</span>
        )}
      </div>
    </motion.div>
  );
}

function TierCard({
  tier,
  progress,
  onStart,
}: {
  tier: typeof BOSS_RUSH_TIERS[number];
  progress: BossRushProgress;
  onStart: (tierId: string) => void;
}) {
  const reducedMotion = useReducedMotion();
  const unlocked = isTierUnlocked(tier, progress);
  const tierProgress = getTierProgress(tier, progress);
  const completed = progress.completedTiers.includes(tier.id);
  const bosses = getBossRushDisplay(tier);

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`station-panel orbital-scan station-glow p-5 transition-all ${
        completed
          ? "border-emerald-500/20"
          : unlocked
            ? "hover:border-primary/20"
            : "opacity-50"
      }`}
    >
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ borderColor: `${DIFFICULTY_COLORS[tier.difficulty]}30`, color: DIFFICULTY_COLORS[tier.difficulty] }}>
                <Fire size={10} weight="fill" />
                {DIFFICULTY_LABELS[tier.difficulty]}
              </span>
              {tier.timeLimitPerBoss > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/10 px-2 py-0.5 text-[10px] text-muted">
                  <Timer size={10} weight="bold" />
                  <span className="font-mono tabular-nums">{tier.timeLimitPerBoss}</span>s/首领
                </span>
              )}
            </div>
            <h3 className="mt-2 font-display text-lg font-bold">{tier.name}</h3>
            <p className="mt-1 text-[11px] text-muted">{tier.description}</p>
          </div>
          {completed && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-400">
              <Check size={12} weight="bold" />
              已通关
            </span>
          )}
        </div>

        <div className="mb-3 flex items-center gap-2">
          <div className="h-1 flex-1 rounded-full bg-primary/10">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${tierProgress.percentage}%` }} />
          </div>
          <span className="text-[10px] font-mono tabular-nums text-muted">{tierProgress.defeated}/{tierProgress.total}</span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {bosses.map((boss, i) => (
            <BossCard
              key={boss.id}
              boss={boss}
              tierIndex={i}
              defeated={progress.completedTiers.includes(`${tier.id}-${i}`)}
              isActive={!completed && unlocked}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-muted">
            <Coins size={12} weight="bold" className="text-amber-400" />
            <span className="font-mono tabular-nums">{tier.reward.coins.toLocaleString()}</span> 金币
            <Star size={12} weight="bold" className="text-primary" />
            <span className="font-mono tabular-nums">{tier.reward.seasonCurrency}</span> 赛季币
          </div>
          <button
            type="button"
            onClick={() => onStart(tier.id)}
            disabled={!unlocked}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all focus-ring ${
              unlocked
                ? "bg-primary text-background hover:bg-primary/90 shadow-lg shadow-primary/15 active:scale-95"
                : "cursor-not-allowed border border-primary/10 bg-panel/60 text-muted"
            }`}
          >
            {unlocked ? <Play size={12} weight="fill" /> : <Lock size={12} weight="bold" />}
            {unlocked ? "开始试炼" : "未解锁"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function BossRushPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [save, setSave] = useState<SaveData | null>(null);
  const [progress, setProgress] = useState<BossRushProgress>(DEFAULT_BOSS_RUSH_PROGRESS);

  useEffect(() => {
    const data = loadSave();
    setSave(data);
    if (data.bossRushProgress) {
      setProgress(data.bossRushProgress);
    }
  }, []);

  const handleStart = useCallback((tierId: string) => {
    const tier = getBossRushTier(tierId);
    if (!tier) return;
    void router.push(`/game?mode=defense&bossRush=${tierId}`);
  }, [router]);

  const totalBosses = BOSS_RUSH_TIERS.reduce((sum, t) => sum + t.bosses.length, 0);

  return (
    <Layout title="Boss Rush">
      <div className="relative min-h-[100dvh]">
        <DimensionBackground intensity="medium" />
        <div className="noise-overlay pointer-events-none fixed inset-0 z-0" />
        <div className="pointer-events-none fixed inset-0 z-0 starfield opacity-40" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:py-8">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-entropy/20 bg-entropy/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-entropy">
              <Skull size={10} weight="fill" />
              Boss Rush
            </span>
            <h1 className="mt-3 font-display text-[clamp(1.5rem,4vw,2.5rem)] font-extrabold leading-[0.95] tracking-tight">
              首领连战
              <br />
              <span className="text-gradient">维度征服者之路</span>
            </h1>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">
              连续挑战维度首领，在有限时间内证明你的实力。每层试炼难度递增，通关全部试炼获得「维度征服者」称号。
            </p>

            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {[
                { label: "已通关", value: progress.completedTiers.length, icon: Trophy, color: "text-amber-400" },
                { label: "首领击败", value: `${progress.totalBossesDefeated}/${totalBosses}`, icon: Skull, color: "text-red-400" },
                { label: "最高层级", value: progress.highestTierCleared ? BOSS_RUSH_TIERS.find((t) => t.id === progress.highestTierCleared)?.name ?? "-" : "-", icon: Crown, color: "text-primary" },
              ].map((stat) => (
                <div key={stat.label} className="station-panel p-3">
                  <stat.icon size={16} weight="bold" className={stat.color} />
                  <p className="mt-1 font-mono text-lg font-bold tabular-nums">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2">
            {BOSS_RUSH_TIERS.map((tier) => (
              <TierCard
                key={tier.id}
                tier={tier}
                progress={progress}
                onStart={handleStart}
              />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}