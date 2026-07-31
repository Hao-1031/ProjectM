"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Trophy,
  Sword,
  Shield,
  Fire,
  Lightning,
  ClockCounterClockwise,
  Trash,
  ChartBar,
  Star,
  Planet,
  Smiley,
  Warning,
  ChartLineUp,
} from "@phosphor-icons/react";
import Link from "next/link";
import { DESIGN_SYSTEM } from "@/lib/version";
import {
  getBattleHistory,
  getPlayerStats,
  clearBattleHistory,
  getRankFromRating,
  getRankColor,
  formatBattleRecordForDisplay,
} from "@/lib/game/pvp/battle-history";
import type { PvPBattleRecord, PvPPlayerStats } from "@/lib/game/pvp/types";

const pvpColors = DESIGN_SYSTEM.colors;

export default function PvPHistory() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [records, setRecords] = useState<PvPBattleRecord[]>([]);
  const [stats, setStats] = useState<PvPPlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  function loadData() {
    setLoading(true);
    setRecords(getBattleHistory());
    setStats(getPlayerStats());
    setLoading(false);
  }

  function handleClearHistory() {
    clearBattleHistory();
    setRecords([]);
    setStats(getPlayerStats());
    setShowClearConfirm(false);
  }

  if (!mounted) return null;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, ${pvpColors.primary}15 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 lg:px-8">
          <Link href="/pvp" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">竞技大厅</span>
          </Link>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/30">战绩</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 lg:px-8 lg:py-16">
        {loading ? (
          <div className="space-y-4">
            <div className="pvp-skeleton h-48 w-full" />
            <div className="pvp-skeleton h-16 w-full" />
            <div className="pvp-skeleton h-16 w-full" />
            <div className="pvp-skeleton h-16 w-full" />
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            {stats && stats.totalMatches > 0 && (
              <motion.div
                initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8"
              >
                {/* Rank Badge */}
                <div className="mb-6 flex flex-col items-center gap-4 rounded-xl border p-6 sm:flex-row sm:justify-between"
                  style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full"
                      style={{ background: `${getRankColor(stats.rating)}15`, border: `2px solid ${getRankColor(stats.rating)}` }}
                    >
                      <Trophy size={28} weight="fill" style={{ color: getRankColor(stats.rating) }} />
                    </div>
                    <div>
                      <p className="text-xs text-white/40">当前段位</p>
                      <p className="text-2xl font-bold" style={{ color: getRankColor(stats.rating) }}>{stats.seasonRank}</p>
                      <p className="font-mono text-sm text-white/40">{stats.rating} 分</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChartLineUp size={16} style={{ color: stats.rating >= stats.highestRating ? "#22C55E" : "#EF4444" }} />
                    <span className="text-xs text-white/40">最高 {stats.highestRating} 分</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                    <Sword size={16} weight="bold" style={{ color: pvpColors.primary }} />
                    <p className="mt-2 font-mono text-xl font-bold" style={{ color: pvpColors.foreground }}>{stats.totalMatches}</p>
                    <p className="text-xs text-white/40">总对局</p>
                  </div>
                  <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                    <Trophy size={16} weight="bold" style={{ color: "#22C55E" }} />
                    <p className="mt-2 font-mono text-xl font-bold" style={{ color: "#22C55E" }}>{stats.wins}</p>
                    <p className="text-xs text-white/40">胜利</p>
                  </div>
                  <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                    <Fire size={16} weight="bold" style={{ color: pvpColors.accent }} />
                    <p className="mt-2 font-mono text-xl font-bold" style={{ color: pvpColors.accent }}>{Math.round(stats.winRate * 100)}%</p>
                    <p className="text-xs text-white/40">胜率</p>
                  </div>
                  <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                    <Lightning size={16} weight="bold" style={{ color: "#8B5CF6" }} />
                    <p className="mt-2 font-mono text-xl font-bold" style={{ color: "#8B5CF6" }}>{stats.longestStreak}</p>
                    <p className="text-xs text-white/40">最长连胜</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Battle Records */}
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-[0.15em] text-white/40">
                  <ClockCounterClockwise size={16} weight="bold" style={{ color: pvpColors.primary }} />
                  对局记录
                </h2>
                {records.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-1 text-xs text-white/20 hover:text-red-400 transition-colors"
                  >
                    <Trash size={12} />
                    清除
                  </button>
                )}
              </div>

              {showClearConfirm && (
                <div className="mb-4 flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Warning size={16} style={{ color: "#EF4444" }} />
                    <span className="text-sm text-red-400">确认清除所有对局记录？此操作不可撤销。</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/60 hover:text-white transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleClearHistory}
                      className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      确认清除
                    </button>
                  </div>
                </div>
              )}

              {records.length === 0 ? (
                <div className="pvp-empty-state">
                  <ClockCounterClockwise size={48} />
                  <p className="mt-4 text-sm font-medium">暂无对局记录</p>
                  <p className="mt-1 text-xs">去竞技大厅开始你的第一场对决</p>
                  <Link
                    href="/pvp/matchmaking"
                    className="pvp-btn pvp-btn-primary mt-6"
                  >
                    <Sword size={16} weight="bold" />
                    开始匹配
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {records.map((record, index) => {
                    const display = formatBattleRecordForDisplay(record);
                    return (
                      <motion.div
                        key={record.id}
                        initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
                        className="rounded-xl border p-4 transition-all hover:scale-[1.005]"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          borderColor: "rgba(255,255,255,0.06)",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Result indicator */}
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg"
                              style={{
                                background: record.result === "win" ? "rgba(34,197,94,0.1)" : record.result === "loss" ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
                              }}
                            >
                              {record.result === "win" ? (
                                <Trophy size={18} weight="fill" style={{ color: "#22C55E" }} />
                              ) : record.result === "loss" ? (
                                <Warning size={18} weight="bold" style={{ color: "#EF4444" }} />
                              ) : (
                                <Smiley size={18} style={{ color: "rgba(255,255,255,0.3)" }} />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold" style={{ color: display.resultColor }}>{display.result}</span>
                                <span className="text-xs text-white/40">{display.heroName} · {display.weaponName}</span>
                              </div>
                              <p className="mt-0.5 text-xs text-white/30">
                                vs {display.opponentHeroName} · {display.mapName} · {display.date}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-mono text-sm font-bold" style={{ color: pvpColors.foreground }}>{display.scoreDisplay}</p>
                            <p className="text-xs" style={{ color: record.ratingChange >= 0 ? "#22C55E" : "#EF4444" }}>{display.ratingChangeDisplay}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}