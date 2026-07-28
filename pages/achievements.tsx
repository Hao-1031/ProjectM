"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Crosshair,
  Sword,
  Skull,
  Fire,
  Bomb,
  Medal,
  ShieldCheck,
  Lightning,
  Crown,
  UsersThree,
  Users,
  Knife,
  Target,
  PaintBrush,
  Star,
  Compass,
  Globe,
  Atom,
  Door,
  Trophy,
  GameController,
  StarFour,
  Wrench,
  FlagBanner,
  InfinityIcon,
  DiamondsFour,
  Clock,
  Buildings,
  HandCoins,
  HandHeart,
  Handshake,
  DropHalf,
  Eye,
  Ear,
  Sparkle,
  Coin,
  Check,
  WarningCircle,
  Question,
  Gauge,
  Timer,
  CodesandboxLogo,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import { loadSave, type SaveData } from "@/lib/game/save";
import {
  getAllAchievementProgress,
  getPlayerGrowth,
  getCollection,
  ACHIEVEMENTS,
  getAchievementTierColor,
  getAchievementTierLabel,
  getAchievementsByCategory,
  getClaimableAchievements,
  type Achievement,
  type AchievementProgress,
  type AchievementCategory,
  type AchievementTier,
  type PlayerGrowth,
  type Collection,
} from "@/lib/game/achievements";
import { formatTime } from "@/lib/game/math";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number | string; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"; className?: string; style?: React.CSSProperties }>> = {
  Crosshair, Sword, Skull, Fire, Bomb, Medal, ShieldCheck, Lightning, Crown,
  UsersThree, Users, Knife, Target, PaintBrush, Star,
  Compass, Globe, Atom, Door, Trophy, GameController,
  StarFour, Wrench, FlagBanner, Clock,
  Infinity: InfinityIcon, Diamond: DiamondsFour,
  Buildings, HandCoins, HandHeart, Handshake,
  DropHalf, Eye, Ear,
};

const CATEGORIES: { id: AchievementCategory | "all"; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "combat", label: "战斗" },
  { id: "collection", label: "收集" },
  { id: "exploration", label: "探索" },
  { id: "mastery", label: "精通" },
  { id: "social", label: "社交" },
  { id: "secret", label: "隐藏" },
];

const TIER_BORDER: Record<AchievementTier, string> = {
  bronze: "border-[#cd7f32]/30",
  silver: "border-[#c0c0c0]/30",
  gold: "border-[#ffd700]/30",
  platinum: "border-[#e5e4e2]/30",
  diamond: "border-[#b9f2ff]/30",
};

const TIER_BORDER_ACTIVE: Record<AchievementTier, string> = {
  bronze: "border-[#cd7f32]/60",
  silver: "border-[#c0c0c0]/60",
  gold: "border-[#ffd700]/60",
  platinum: "border-[#e5e4e2]/60",
  diamond: "border-[#b9f2ff]/60",
};

// ── Sub-components ──

function PlayerGrowthOverview({
  growth,
  reducedMotion,
}: {
  growth: PlayerGrowth;
  reducedMotion: boolean | null;
}) {
  const xpPercent = growth.xpToNext > 0 ? Math.min((growth.xp / growth.xpToNext) * 100, 100) : 100;

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bridge-panel holo-scan p-4 md:p-5"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-20" style={{ backgroundColor: "var(--primary)" }} />

      <div className="relative">
        <div className="bridge-panel-header -mx-4 -mt-4 mb-4 px-4 md:-mx-5 md:-mt-5 md:px-5">
          <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
            <Sparkle size={14} weight="duotone" />
            幸存者档案
          </span>
          <span className="ml-2 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-bold text-primary">
            Lv.{growth.level}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                经验值
              </p>
              <p className="font-mono tabular-nums text-[10px] text-muted">
                {growth.xp.toLocaleString()} / {growth.xpToNext.toLocaleString()} XP
              </p>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-primary/10">
              <motion.div
                initial={reducedMotion ? undefined : { width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-primary via-quantum to-primary"
              />
            </div>
          </div>

          {[
            { label: "总击杀", value: growth.totalKills.toLocaleString(), icon: Skull, color: "#c84a4a" },
            { label: "总出战", value: growth.totalRuns.toLocaleString(), icon: Target, color: "#3dd1c8" },
            { label: "胜利", value: growth.totalWins.toLocaleString(), icon: Trophy, color: "#c8a45c" },
            { label: "游戏时长", value: formatTime(growth.totalPlayTime), icon: Clock, color: "#5b9cf5" },
            { label: "最高波次", value: growth.highestWave.toString(), icon: Gauge, color: "#c8a45c" },
            { label: "最长存活", value: formatTime(growth.longestSurvival), icon: Timer, color: "#5b9cf5" },
            { label: "最爱英雄", value: growth.favoriteHero ?? "-", icon: Users, color: "#3dd1c8" },
            { label: "最爱武器", value: growth.favoriteWeapon ?? "-", icon: Sword, color: "#c8a45c" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 + i * 0.04 }}
                className="group relative overflow-hidden rounded-xl border border-primary/10 bg-background/50 p-2.5 transition-all hover:border-primary/30 hover:bg-panel"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-3xl transition-opacity group-hover:opacity-25" style={{ backgroundColor: `${stat.color}18` }} />
                <div className="relative flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{stat.label}</p>
                  <Icon size={14} weight="bold" style={{ color: stat.color }} className="opacity-60" />
                </div>
                <p className="relative mt-1 font-mono tabular-nums text-lg font-bold truncate">{stat.value}</p>
              </motion.div>
            );
          })}
        </div>

        {growth.titles.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-primary/10 pt-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">称号</span>
            {growth.titles.slice(0, 8).map((title) => (
              <span
                key={title}
                className="rounded-full border border-anchor/20 bg-anchor/5 px-2 py-0.5 text-[10px] font-medium text-anchor"
              >
                {title}
              </span>
            ))}
            {growth.titles.length > 8 && (
              <span className="text-[10px] text-muted">+{growth.titles.length - 8}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CollectionProgress({
  collection,
  reducedMotion,
}: {
  collection: Collection;
  reducedMotion: boolean | null;
}) {
  const items = [
    {
      label: "英雄",
      unlocked: collection.heroesUnlocked,
      total: collection.heroesTotal,
      icon: Users,
      color: "#3dd1c8",
    },
    {
      label: "武器",
      unlocked: collection.weaponsUnlocked,
      total: collection.weaponsTotal,
      icon: Sword,
      color: "#c8a45c",
    },
    {
      label: "Boss",
      unlocked: collection.bossesDefeated.length,
      total: collection.bossesTotal,
      icon: Skull,
      color: "#c84a4a",
    },
    {
      label: "皮肤",
      unlocked: collection.skinsOwned,
      total: collection.skinsTotal,
      icon: PaintBrush,
      color: "#5b9cf5",
    },
  ];

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="bridge-panel holo-scan p-4 md:p-5"
    >
      <div className="bridge-panel-header -mx-4 -mt-4 mb-4 px-4 md:-mx-5 md:-mt-5 md:px-5">
        <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
          <CodesandboxLogo size={14} weight="duotone" />
          收藏进度
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item, i) => {
          const pct = item.total > 0 ? Math.round((item.unlocked / item.total) * 100) : 0;
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 + i * 0.05 }}
              className="group relative overflow-hidden rounded-xl border border-primary/10 bg-background/50 p-3 transition-all hover:border-primary/30"
            >
              <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl transition-opacity group-hover:opacity-30" style={{ backgroundColor: `${item.color}15` }} />
              <div className="relative flex items-center justify-between mb-2">
                <Icon size={18} weight="bold" style={{ color: item.color }} className="opacity-70" />
                <span className="font-mono tabular-nums text-lg font-bold" style={{ color: item.color }}>
                  {pct}%
                </span>
              </div>
              <p className="text-[11px] font-medium">{item.label}</p>
              <p className="font-mono tabular-nums text-[10px] text-muted">
                {item.unlocked} / {item.total}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/10">
                <motion.div
                  initial={reducedMotion ? undefined : { width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function AchievementCard({
  achievement,
  progress,
  index,
  reducedMotion,
  onClaim,
}: {
  achievement: Achievement;
  progress: AchievementProgress;
  index: number;
  reducedMotion: boolean | null;
  onClaim: (id: string) => void;
}) {
  const tierColor = getAchievementTierColor(achievement.tier);
  const tierLabel = getAchievementTierLabel(achievement.tier);
  const IconComponent = ICON_MAP[achievement.icon] ?? Star;
  const pct = achievement.target > 0 ? Math.min((progress.progress / achievement.target) * 100, 100) : 0;
  const isHidden = achievement.secret && !progress.completed && progress.progress === 0;
  const isClaimable = progress.completed && progress.claimedAt === null;
  const isClaimed = progress.claimedAt !== null;

  const staggerDelay = 0.3 + (index % 2 === 0 ? 0 : 0.08) + Math.floor(index / 2) * 0.06;

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: staggerDelay, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-2xl border bg-panel/60 transition-all hover:bg-panel ${
        progress.completed
          ? TIER_BORDER_ACTIVE[achievement.tier]
          : TIER_BORDER[achievement.tier]
      } ${
        isHidden ? "opacity-70" : ""
      }`}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-opacity group-hover:opacity-50"
        style={{ backgroundColor: `${tierColor}10`, opacity: progress.completed ? 0.25 : 0.08 }}
      />

      <div className="relative p-3">
        <div className="flex items-start gap-2.5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
              progress.completed ? "bg-success/10" : isHidden ? "bg-muted/10" : "bg-primary/10"
            }`}
            style={{
              border: `1px solid ${progress.completed ? "var(--success)" : isHidden ? "var(--muted)" : tierColor}30`,
            }}
          >
            {isHidden ? (
              <Question size={20} weight="bold" className="text-muted" />
            ) : progress.completed ? (
              <Check size={20} weight="bold" className="text-success" />
            ) : (
              <IconComponent size={20} weight="bold" style={{ color: tierColor }} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-bold">
                {isHidden ? "???" : achievement.name}
              </h3>
              {progress.completed && (
                <span className="shrink-0 rounded-full bg-success/10 px-1.5 py-0.5 text-[9px] font-bold text-success">
                  已完成
                </span>
              )}
              {isClaimable && (
                <span className="shrink-0 rounded-full bg-warning/10 px-1.5 py-0.5 text-[9px] font-bold text-warning">
                  可领取
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted line-clamp-2">
              {isHidden ? "持续探索以揭示此成就" : achievement.description}
            </p>

            <div className="mt-1.5 flex items-center gap-2">
              <span
                className="rounded-full border px-1.5 py-0.5 text-[9px] font-medium"
                style={{
                  borderColor: `${tierColor}30`,
                  color: tierColor,
                  backgroundColor: `${tierColor}10`,
                }}
              >
                {tierLabel}
              </span>
              {achievement.category === "secret" && !isHidden && (
                <span className="rounded-full border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                  隐藏
                </span>
              )}
            </div>

            {!isHidden && (
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono tabular-nums text-[9px] text-muted">
                    {progress.progress} / {achievement.target}
                  </span>
                  <span className="font-mono tabular-nums text-[9px] text-muted">{Math.round(pct)}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-primary/10">
                  <motion.div
                    initial={reducedMotion ? undefined : { width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, delay: staggerDelay + 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className={`h-full rounded-full ${
                      progress.completed
                        ? "bg-success"
                        : "bg-gradient-to-r from-primary to-quantum"
                    }`}
                  />
                </div>
              </div>
            )}

            {achievement.reward && (achievement.reward.coins || achievement.reward.seasonCurrency || achievement.reward.title) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-primary/10 pt-2">
                {achievement.reward.coins && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-warning/20 bg-warning/5 px-1.5 py-0.5 text-[9px] font-medium text-warning">
                    <Coin size={10} weight="bold" />
                    {achievement.reward.coins.toLocaleString()}
                  </span>
                )}
                {achievement.reward.seasonCurrency && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                    <Star size={10} weight="bold" />
                    {achievement.reward.seasonCurrency}
                  </span>
                )}
                {achievement.reward.title && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-anchor/20 bg-anchor/5 px-1.5 py-0.5 text-[9px] font-medium text-anchor">
                    <Crown size={10} weight="bold" />
                    {achievement.reward.title}
                  </span>
                )}
              </div>
            )}

            {isClaimable && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => onClaim(achievement.id)}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-warning px-3 py-2 text-xs font-bold text-background shadow-lg shadow-warning/10 transition-all hover:bg-warning/90 focus-ring active:scale-95"
                >
                  <Coin size={12} weight="bold" />
                  领取奖励
                </button>
              </div>
            )}

            {isClaimed && (
              <div className="mt-2">
                <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-success/20 bg-success/5 px-3 py-2 text-xs font-bold text-success">
                  <Check size={12} weight="bold" />
                  已领取
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ──

export default function AchievementsPage() {
  const reducedMotion = useReducedMotion();
  const [save, setSave] = useState<SaveData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | "all">("all");
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const data = loadSave();
      setSave(data);
    } catch {
      setLoadError(true);
    }
  }, []);

  const refresh = useCallback(() => {
    try {
      const data = loadSave();
      setSave(data);
    } catch {
      setLoadError(true);
    }
  }, []);

  const growth = useMemo(() => {
    if (!save) return null;
    try {
      return getPlayerGrowth(save);
    } catch {
      return null;
    }
  }, [save]);

  const collection = useMemo(() => {
    if (!save) return null;
    try {
      return getCollection(save);
    } catch {
      return null;
    }
  }, [save]);

  const allProgress = useMemo(() => {
    if (!save) return [];
    try {
      return getAllAchievementProgress(save);
    } catch {
      return [];
    }
  }, [save]);

  const progressMap = useMemo(() => {
    const map = new Map<string, AchievementProgress>();
    for (const p of allProgress) {
      map.set(p.achievementId, { ...p, claimedAt: claimedIds.has(p.achievementId) ? Date.now() : p.claimedAt });
    }
    return map;
  }, [allProgress, claimedIds]);

  const filteredAchievements = useMemo(() => {
    if (activeCategory === "all") return ACHIEVEMENTS;
    return getAchievementsByCategory(activeCategory);
  }, [activeCategory]);

  const completedCount = useMemo(() => {
    return allProgress.filter((p) => p.completed).length;
  }, [allProgress]);

  const claimableCount = useMemo(() => {
    return getClaimableAchievements(allProgress).length;
  }, [allProgress]);

  const handleClaim = useCallback((id: string) => {
    setClaimedIds((prev) => new Set(prev).add(id));
  }, []);

  // ── Error State ──
  if (loadError) {
    return (
      <Layout title="成就与收藏">
        <div className="mx-auto flex min-h-[60dvh] max-w-7xl flex-col items-center justify-center px-4 py-12">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bridge-panel p-8 text-center"
          >
            <WarningCircle size={40} weight="bold" className="mx-auto text-danger" />
            <h2 className="mt-3 font-display text-lg font-bold text-danger">数据加载失败</h2>
            <p className="mt-1 text-sm text-muted">
              无法读取存档数据，请检查存档是否损坏。
            </p>
            <button
              type="button"
              onClick={refresh}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition-all hover:bg-danger/20 focus-ring active:scale-95"
            >
              重试
            </button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // ── Empty State (no save at all) ──
  if (!save) {
    return (
      <Layout title="成就与收藏">
        <div className="mx-auto flex min-h-[60dvh] max-w-7xl flex-col items-center justify-center px-4 py-12">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bridge-panel p-8 text-center"
          >
            <Trophy size={40} weight="bold" className="mx-auto text-muted" />
            <h2 className="mt-3 font-display text-lg font-bold">暂无成就数据</h2>
            <p className="mt-1 text-sm text-muted">
              完成一次部署后，你的成就与收藏将在此展示。
            </p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="成就与收藏">
      <div className="mx-auto min-h-[100dvh] max-w-7xl px-4 py-6 md:py-8">
        {/* Header */}
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
                <Trophy size={14} weight="duotone" />
                成就与收藏
              </span>
              <h1 className="mt-2 font-display text-[clamp(1.5rem,3vw,2.25rem)] font-extrabold leading-[0.95] tracking-tight">
                成就、
                <span className="text-gradient">收藏</span>
              </h1>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">
                探索维度、击败强敌、收集装备。每个成就都是你在这个多元宇宙中的印记。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="bridge-panel rounded-xl px-3 py-1.5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">总成就</p>
                <p className="font-mono tabular-nums text-lg font-bold text-primary">
                  {completedCount}<span className="text-sm text-muted">/{ACHIEVEMENTS.length}</span>
                </p>
              </div>
              {claimableCount > 0 && (
                <div className="rounded-xl border border-warning/20 bg-warning/5 px-3 py-1.5">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-warning">可领取</p>
                  <p className="font-mono tabular-nums text-lg font-bold text-warning">{claimableCount}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Player Growth Overview */}
        <div className="mb-5">
          {growth && <PlayerGrowthOverview growth={growth} reducedMotion={reducedMotion} />}
        </div>

        {/* Collection Progress */}
        <div className="mb-5">
          {collection && <CollectionProgress collection={collection} reducedMotion={reducedMotion} />}
        </div>

        {/* Category Filter */}
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-4 flex gap-1 overflow-x-auto pb-1"
          role="tablist"
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold transition-all focus-ring active:scale-95 ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-primary/10 bg-panel/60 text-muted hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </motion.div>

        {/* Achievement Grid - 2 column staggered */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={reducedMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {filteredAchievements.length === 0 ? (
              <motion.div
                initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bridge-panel p-8 text-center"
              >
                <Trophy size={32} weight="bold" className="mx-auto text-muted" />
                <p className="mt-2 text-sm text-muted">该分类下暂无成就。</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:grid-flow-dense">
                {filteredAchievements.map((achievement, index) => {
                  const progress = progressMap.get(achievement.id) ?? {
                    achievementId: achievement.id,
                    progress: 0,
                    completed: false,
                    claimedAt: null,
                    unlockedAt: null,
                  };

                  return (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      progress={progress}
                      index={index}
                      reducedMotion={reducedMotion}
                      onClaim={handleClaim}
                    />
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
}