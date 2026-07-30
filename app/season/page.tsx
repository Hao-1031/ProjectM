"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Calendar,
  Trophy,
  Lightning,
  ShieldCheck,
  Target,
  ArrowRight,
  Star,
  Check,
  Lock,
  Crown,
  Spinner,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import DimensionBackground from "@/components/effects/DimensionBackground";
import Skeleton from "@/components/ui/Skeleton";
import { loadSave, claimSeasonReward } from "@/lib/game/save";
import type { SaveData } from "@/lib/game/save";
import { SEASON_REWARD_TYPES, generateSeasonRewards, generateSeasonMissions } from "@/lib/game/season";
import type { SeasonReward, SeasonMission } from "@/lib/game/types";

const HERO_IMAGE =
  "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Epic%20cinematic%20season%20banner%2C%20glowing%20teal%20season%20emblem%20floating%20over%20fortified%20outpost%2C%20ash%20sky%20with%20distant%20sunrise%20glow%2C%20embers%20and%20dust%20particles%2C%20muted%20teal%20and%20amber%20accent%20lights%2C%20low%20saturation%2C%20no%20text&image_size=landscape_16_9";

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function daysLeft(ts: number) {
  const diff = ts - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

function RewardIcon({ type }: { type: keyof typeof SEASON_REWARD_TYPES }) {
  switch (type) {
    case "skin":
      return <Target size={16} weight="bold" />;
    case "badge":
      return <ShieldCheck size={16} weight="bold" />;
    case "emote":
      return <Star size={16} weight="bold" />;
    case "heroUnlock":
      return <Crown size={16} weight="bold" />;
    case "convenience":
      return <Lightning size={16} weight="bold" />;
    default:
      return <Star size={16} weight="bold" />;
  }
}

export default function SeasonPage() {
  const reducedMotion = useReducedMotion();
  const [save, setSave] = useState<SaveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  useEffect(() => {
    setSave(loadSave());
    setLoading(false);
  }, []);

  const season = save?.seasonState;
  const allRewards = useMemo(() => generateSeasonRewards(), []);
  const allMissions = useMemo(() => generateSeasonMissions(), []);

  const handleClaim = async (reward: SeasonReward) => {
    if (!season || reward.claimed || !reward.unlocked) return;
    setClaiming(reward.id);
    setClaimMessage(null);
    try {
      const { success, reward: claimed } = claimSeasonReward(reward.id);
      if (success && claimed) {
        setClaimMessage(`已领取：${claimed.name}`);
      } else {
        setClaimMessage("领取失败，奖励未解锁或条件不足");
      }
      setSave(loadSave());
    } finally {
      setClaiming(null);
      setTimeout(() => setClaimMessage(null), 3000);
    }
  };

  const rewardsByLevel = useMemo(() => {
    const map = new Map<number, { free?: SeasonReward; premium?: SeasonReward }>();
    for (const r of allRewards) {
      const entry = map.get(r.level) ?? {};
      if (r.free) entry.free = r;
      if (r.premium) entry.premium = r;
      map.set(r.level, entry);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [allRewards]);

  const missionsByCategory = useMemo(() => {
    return {
      daily: allMissions.filter((m) => m.category === "daily"),
      weekly: allMissions.filter((m) => m.category === "weekly"),
      season: allMissions.filter((m) => m.category === "season"),
    };
  }, [allMissions]);

  const currentLevel = season?.currentLevel ?? 1;
  const currentXp = season?.currentXp ?? 0;
  const xpToNext = season?.xpToNext ?? 1000;
  const progressPct = xpToNext > 0 ? Math.min(100, (currentXp / xpToNext) * 100) : 100;

  return (
    <Layout title="任务日志">
      <div className="relative min-h-[100dvh]">
        <DimensionBackground intensity="medium" />
        <div className="noise-overlay" />
        <div className="pointer-events-none fixed inset-0 z-0 starfield opacity-40" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-3 md:py-4">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-3 md:mb-4"
          >
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
              <Calendar weight="duotone" size={14} />
              当前任务
            </span>
            <h1 className="mt-2 font-display text-xl font-bold tracking-tight md:text-3xl">
              第一赛季：{season?.name ?? "深空黎明"}
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">
              任务期间完成挑战、提升等级，解锁限定外观与徽章。所有奖励仅改变外观，不影响战斗数值。
            </p>
          </motion.div>

          {loading && (
            <div className="grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <Skeleton className="h-64 rounded-3xl" />
              </div>
              <div className="space-y-2 lg:col-span-5">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-40 rounded-2xl" />
              </div>
            </div>
          )}

          {!loading && season && (
            <>
              <div className="grid gap-3 lg:grid-cols-12">
                <motion.div
                  initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="lg:col-span-7"
                >
                  <div className="station-panel orbital-scan station-glow overflow-hidden">
                    <img
                      src={HERO_IMAGE}
                      alt="第一赛季：深空黎明"
                      className="h-full w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-panel via-panel/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                          {formatDate(season.startTime)} - {formatDate(season.endTime)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                          剩余 <span className="font-mono tabular-nums">{daysLeft(season.endTime)}</span> 天
                        </span>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-3 station-panel orbital-scan p-4"
                  >
                    <div className="station-panel-header -mx-4 -mt-4 mb-4">
                      <p className="font-mono text-xs uppercase tracking-widest text-muted">当前等级</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-2xl font-bold tabular-nums text-anchor">Lv.{currentLevel}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs uppercase tracking-widest text-muted">任务 XP</p>
                        <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-warning">
                          {currentXp} / {xpToNext}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-border">
                      <motion.div
                        className="h-full rounded-full bg-warning"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      每局巅峰挑战、极限生存和深空哨站防守都会积累任务 XP。
                    </p>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={reducedMotion ? undefined : { opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="space-y-2 lg:col-span-5"
                >
                  <div className="station-panel orbital-scan p-3">
                    <div className="station-panel-header -mx-3 -mt-3 mb-3">
                      <h2 className="text-sm font-bold tracking-tight">任务日志</h2>
                    </div>
                    <div className="space-y-3">
                      {(
                        [
                          ["每日", missionsByCategory.daily],
                          ["每周", missionsByCategory.weekly],
                          ["远征", missionsByCategory.season],
                        ] as const
                      ).map(([label, missions]) => (
                        <div key={label}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                            {label}
                          </p>
                          <ul className="mt-1 space-y-1">
                            {missions.slice(0, 3).map((mission: SeasonMission) => (
                              <li key={mission.id} className="flex items-start gap-2 text-xs text-muted">
                                <span
                                  className={`mt-0.5 inline-flex h-1.5 w-1.5 shrink-0 rounded-full ${
                                    mission.completed ? "bg-success" : "bg-primary"
                                  }`}
                                />
                                {mission.title} <span className="font-mono tabular-nums">· {mission.progress}/{mission.target}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="station-panel orbital-scan p-3">
                    <div className="station-panel-header -mx-3 -mt-3 mb-3">
                      <h2 className="text-sm font-bold tracking-tight">深空币</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Star size={20} weight="bold" />
                      </div>
                      <div>
                        <p className="font-mono text-lg font-bold tabular-nums">{save?.seasonCurrency ?? 0}</p>
                        <p className="text-[10px] text-muted">可用于深空商店兑换外观</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6 }}
                className="mt-4 station-panel orbital-scan p-4"
              >
                <div className="station-panel-header -mx-4 -mt-4 mb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold tracking-tight">等级奖励</h2>
                    {claimMessage && (
                      <span className="rounded-full bg-success/10 px-2 py-1 text-[10px] font-medium text-success">
                        {claimMessage}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {rewardsByLevel.map(([level, { free, premium }]) => {
                    const items = [free, premium].filter(Boolean) as SeasonReward[];
                    return (
                      <div
                        key={level}
                        className={`station-panel p-2 ${
                          level <= currentLevel ? "" : "opacity-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] tabular-nums text-muted">Lv.{level}</span>
                          {level <= currentLevel && (
                            <span className="rounded bg-success/10 px-1 py-0.5 text-[10px] text-success">
                              已解锁
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 space-y-1.5">
                          {items.map((reward) => {
                            const meta = SEASON_REWARD_TYPES[reward.type];
                            const canClaim = reward.unlocked && !reward.claimed && !reward.premium;
                            const isPremiumLocked = reward.premium && !season.premiumUnlocked;
                            return (
                              <div
                                key={reward.id}
                                className={`station-panel flex items-center gap-2 p-1.5 ${
                                  reward.claimed
                                    ? "border-success/20"
                                    : reward.unlocked && !isPremiumLocked
                                      ? "border-primary/20"
                                      : ""
                                }`}
                              >
                                <span
                                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px]"
                                  style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                                >
                                  <RewardIcon type={reward.type} />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[11px] font-semibold">{reward.name}</p>
                                  <p className="text-[9px] text-muted">{meta.label}</p>
                                </div>
                                {reward.claimed ? (
                                  <Check size={14} className="text-success" weight="bold" />
                                ) : canClaim ? (
                                  <button
                                    onClick={() => handleClaim(reward)}
                                    disabled={claiming === reward.id}
                                    className="inline-flex h-6 items-center rounded-md bg-primary px-2 text-[10px] font-bold text-background transition-colors hover:bg-primary/90 focus-ring active:scale-95 disabled:opacity-50"
                                  >
                                    {claiming === reward.id ? (
                                      <Spinner size={10} weight="bold" className="animate-spin" />
                                    ) : (
                                      "领取"
                                    )}
                                  </button>
                                ) : isPremiumLocked ? (
                                  <Lock size={12} className="text-muted" />
                                ) : (
                                  <Lock size={12} className="text-muted" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative mt-4 station-panel orbital-scan station-glow p-4"
              >
                <div className="relative grid items-center gap-4 md:grid-cols-2">
                  <div>
                    <h2 className="font-display text-lg font-bold tracking-tight">开始你的深空征程</h2>
                    <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">
                      每一局战斗都会积累任务进度。完成挑战、冲击排行榜，把限定奖励收入囊中。
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
                    <Link
                      href="/game?mode=peak-challenge"
                      className="group relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-5 text-sm font-bold text-background shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 focus-ring active:scale-95"
                    >
                      <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
                      <Crown size={16} weight="fill" />
                      <span className="whitespace-nowrap">巅峰挑战</span>
                    </Link>
                    <Link
                      href="/game?mode=extreme-survival"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-primary/10 bg-panel/60 px-5 text-sm font-semibold transition-all hover:border-primary/30 hover:bg-panel focus-ring active:scale-95"
                    >
                      <Lightning size={16} weight="fill" />
                      <span className="whitespace-nowrap">极限生存</span>
                    </Link>
                    <Link
                      href="/leaderboard"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-primary/10 bg-panel/60 px-5 text-sm font-semibold transition-all hover:border-primary/30 hover:bg-panel focus-ring active:scale-95"
                    >
                      <Trophy size={16} />
                      排行榜
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}