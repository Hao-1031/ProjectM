"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Crown,
  Star,
  Coin,
  Lightning,
  Lock,
  LockOpen,
  CheckCircle,
  ArrowLeft,
  TShirt,
  Smiley,
  Medal,
  Sword,
  Gift,
  CaretRight,
  Sparkle,
  Timer,
  Shield,
  Fire,
  Users,
  type Icon,
} from "@phosphor-icons/react";
import BrandLogo from "@/components/BrandLogo";
import DimensionBackground from "@/components/effects/DimensionBackground";
import { BATTLE_PASS_SEASON, getBattlePassProgress, getClaimableRewards, claimReward, addBattlePassXP, unlockPremiumPass, getTotalCoinRewards, getTotalSeasonCurrencyRewards, type BattlePassState, type BattlePassReward } from "@/lib/game/battle-pass";

const REWARD_ICONS: Record<string, Icon> = {
  coin: Coin,
  star: Star,
  lightning: Lightning,
  skin: TShirt,
  emote: Smiley,
  badge: Medal,
  hero: Sword,
  xpBoost: Lightning,
  medal: Medal,
};

const REWARD_COLORS: Record<string, string> = {
  coin: "text-accent",
  star: "text-primary",
  lightning: "text-warning",
  skin: "text-danger",
  emote: "text-success",
  badge: "text-primary",
  hero: "text-accent",
  xpBoost: "text-warning",
  medal: "text-primary",
};

function RewardCard({ reward, claimed, claimable, onClaim }: { reward: BattlePassReward; claimed: boolean; claimable: boolean; onClaim: () => void }) {
  const Icon = REWARD_ICONS[reward.icon] || Gift;
  const iconColor = REWARD_COLORS[reward.icon] || "text-muted";

  return (
    <motion.div
      whileHover={!claimed ? { y: -2 } : undefined}
      className={`relative flex flex-col items-center rounded-xl border p-3 text-center transition-all ${
        claimed
          ? "border-border/50 bg-panel-raised/50 opacity-50"
          : claimable
            ? "border-primary/30 bg-primary/5 cursor-pointer hover:border-primary/50 hover:shadow-sm"
            : "border-border bg-panel-raised"
      }`}
    >
      {reward.tier === "premium" && !claimed && (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent">
          <Crown size={10} weight="fill" className="text-white" />
        </span>
      )}
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
        claimed ? "border-border bg-background" : claimable ? "border-primary/20 bg-primary/10" : "border-border bg-background"
      }`}>
        <span className={claimed ? "text-muted" : iconColor}><Icon size={20} weight={claimed ? "light" : "bold"} /></span>
      </div>
      <p className="mt-2 text-[11px] font-bold leading-tight">{reward.name}</p>
      {claimable && (
        <button
          onClick={onClaim}
          className="mt-2 flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[10px] font-bold text-white transition-all hover:bg-primary/90 active:scale-95"
        >
          <Gift size={12} weight="bold" />
          领取
        </button>
      )}
      {claimed && (
        <span className="mt-2 flex items-center gap-1 text-[10px] font-bold text-success">
          <CheckCircle size={12} weight="fill" />
          已领取
        </span>
      )}
      {!claimed && !claimable && (
        <span className="mt-2 flex items-center gap-1 text-[10px] text-muted">
          <Lock size={12} weight="bold" />
          Lv.{reward.level}
        </span>
      )}
    </motion.div>
  );
}

export default function BattlePassPage() {
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState<BattlePassState>({ ...BATTLE_PASS_SEASON, rewards: BATTLE_PASS_SEASON.rewards.map((r) => ({ ...r })) });
  const [activeTab, setActiveTab] = useState<"free" | "premium">("premium");

  const progress = useMemo(() => getBattlePassProgress(state), [state]);
  const claimableRewards = useMemo(() => getClaimableRewards(state), [state]);
  const totalCoins = useMemo(() => getTotalCoinRewards(state), [state]);
  const totalSeasonCurrency = useMemo(() => getTotalSeasonCurrencyRewards(state), [state]);

  const filteredRewards = useMemo(() => {
    return state.rewards.filter((r) => r.tier === activeTab);
  }, [state.rewards, activeTab]);

  const groupedByLevel = useMemo(() => {
    const groups: Record<number, BattlePassReward[]> = {};
    for (const reward of filteredRewards) {
      if (!groups[reward.level]) groups[reward.level] = [];
      groups[reward.level].push(reward);
    }
    return groups;
  }, [filteredRewards]);

  const handleClaim = useCallback((rewardId: string) => {
    const newState = { ...state, rewards: state.rewards.map((r) => ({ ...r })) };
    claimReward(newState, rewardId);
    setState(newState);
  }, [state]);

  const handleAddXP = useCallback(() => {
    const newState = { ...state, rewards: state.rewards.map((r) => ({ ...r })) };
    addBattlePassXP(newState, 500);
    setState(newState);
  }, [state]);

  const handleUnlockPremium = useCallback(() => {
    const newState = { ...state, rewards: state.rewards.map((r) => ({ ...r })) };
    unlockPremiumPass(newState);
    setState(newState);
  }, [state]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background text-foreground">
      <DimensionBackground intensity="subtle" />

      <header className="relative z-20 border-b border-border bg-panel/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 rounded-lg text-sm font-medium text-muted transition-colors hover:text-foreground">
            <ArrowLeft size={18} weight="bold" />
            返回指挥部
          </Link>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-mono text-xs text-muted">
              <Coin size={14} weight="fill" className="text-accent" />
              {totalCoins}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-xs text-muted">
              <Star size={14} weight="fill" className="text-primary" />
              {totalSeasonCurrency}
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 overflow-hidden rounded-2xl border border-border bg-panel shadow-lg"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="relative p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary uppercase">
                    {state.seasonId}
                  </span>
                  <span className="rounded-md bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-bold text-accent uppercase">
                    {state.premiumUnlocked ? "高级通行证" : "免费通行证"}
                  </span>
                </div>
                <h1 className="font-bold text-3xl tracking-tight">{state.seasonName}</h1>
                <p className="mt-2 text-sm text-muted max-w-md">
                  完成战斗获取经验值，解锁丰厚奖励。高级通行证包含独家皮肤、英雄解锁和更多货币。
                </p>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="font-mono text-4xl font-bold text-primary">{state.level}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted">等级</p>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div className="text-center">
                    <p className="font-mono text-4xl font-bold text-foreground">{state.totalLevels}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted">上限</p>
                  </div>
                </div>

                {/* XP Bar */}
                <div className="w-full max-w-[200px]">
                  <div className="flex items-center justify-between text-[10px] text-muted mb-1">
                    <span>XP</span>
                    <span className="font-mono">{state.xp}/{state.xpToNext}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-accent transition-all"
                      style={{ width: `${state.level >= state.totalLevels ? 100 : (state.xp / state.xpToNext) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddXP}
                    className="rounded-lg border border-border px-3 py-1.5 text-[10px] font-bold text-muted transition-all hover:border-primary/30 hover:text-primary"
                  >
                    +500 XP (测试)
                  </button>
                  {!state.premiumUnlocked && (
                    <button
                      onClick={handleUnlockPremium}
                      className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-[10px] font-bold text-white transition-all hover:bg-accent/90 active:scale-95"
                    >
                      <Crown size={12} weight="fill" />
                      解锁高级
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Claim All Banner */}
        {claimableRewards.length > 0 && (
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Gift size={20} weight="bold" className="text-primary" />
              <span className="text-sm font-bold text-primary">{claimableRewards.length} 个奖励可领取</span>
            </div>
            <button
              onClick={() => claimableRewards.forEach((r) => handleClaim(r.id))}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white transition-all hover:bg-primary/90 active:scale-95"
            >
              一键领取
            </button>
          </motion.div>
        )}

        {/* Tier Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("free")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              activeTab === "free"
                ? "bg-foreground/5 text-foreground border border-border"
                : "border border-border bg-panel text-muted hover:text-foreground"
            }`}
          >
            <Shield size={18} weight={activeTab === "free" ? "fill" : "bold"} />
            免费通行证
          </button>
          <button
            onClick={() => setActiveTab("premium")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              activeTab === "premium"
                ? "bg-accent/10 text-accent border border-accent/30"
                : "border border-border bg-panel text-muted hover:text-foreground"
            }`}
          >
            <Crown size={18} weight={activeTab === "premium" ? "fill" : "bold"} />
            高级通行证
          </button>
        </div>

        {/* Rewards Grid */}
        <div className="grid gap-3 grid-flow-dense" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
          {Object.entries(groupedByLevel).map(([levelStr, rewards]) => {
            const level = Number.parseInt(levelStr, 10);
            const isPast = level <= state.level;
            const isCurrent = level === state.level + 1;

            return (
              <motion.div
                key={levelStr}
                initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: level * 0.01, duration: 0.3 }}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-mono text-[10px] font-bold ${isPast ? "text-primary" : "text-muted"}`}>
                    Lv.{level}
                  </span>
                  {isPast && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success/10">
                      <CheckCircle size={10} weight="fill" className="text-success" />
                    </span>
                  )}
                  {isCurrent && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10">
                      <Fire size={10} weight="fill" className="text-primary" />
                    </span>
                  )}
                </div>
                {rewards.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    claimed={reward.claimed}
                    claimable={reward.level <= state.level && !reward.claimed && (reward.tier === "free" || state.premiumUnlocked)}
                    onClaim={() => handleClaim(reward.id)}
                  />
                ))}
              </motion.div>
            );
          })}
        </div>

        {filteredRewards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <Crown size={48} weight="thin" />
            <p className="mt-4 text-sm">该通行证暂无奖励</p>
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-border py-4 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          公平竞技 · 无付费加成 · 多重宇宙
        </p>
      </footer>
    </div>
  );
}