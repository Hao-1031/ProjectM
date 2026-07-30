"use client";

import { useRouter } from "next/router";
import { useCallback, useEffect, useState, Suspense, lazy } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Warning,
  Hexagon,
  Pulse,
  Gauge,
  Rocket,
  Planet,
  Crosshair,
  ShieldChevron,
  Broadcast,
} from "@phosphor-icons/react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Skeleton from "@/components/ui/Skeleton";
import BrandLogo from "@/components/BrandLogo";
import DimensionBackground from "@/components/effects/DimensionBackground";
import DifficultySelector from "@/components/game/DifficultySelector";
import type { GameModeType, DifficultyPreset } from "@/lib/game/types";
import { BRAND_TAGLINE } from "@/lib/version";

const GameCanvas = lazy(() => import("@/components/GameCanvas"));

const MODE_META: Record<string, { name: string; threat: string; accent: string; desc: string; callsign: string }> = {
  campaign: { name: "战役模式", threat: "低", accent: "var(--success)", desc: "完成连续任务，抵达撤离点", callsign: "远征舰队" },
  endless: { name: "无尽生存", threat: "极高", accent: "var(--danger)", desc: "敌人强度随波次指数增长", callsign: "深渊哨站" },
  daily: { name: "每日挑战", threat: "中", accent: "var(--warning)", desc: "固定种子，全员统一词缀", callsign: "轨道巡逻" },
  roguelike: { name: "冒险模式", threat: "高", accent: "var(--success)", desc: "分支关卡树，诅咒与祝福", callsign: "深空探索" },
  defense: { name: "据点防守", threat: "高", accent: "var(--primary)", desc: "守护锚点，抵御维度入侵", callsign: "前线要塞" },
  deathmatch: { name: "个人死斗", threat: "高", accent: "var(--danger)", desc: "自由混战，最后存活者胜", callsign: "竞技场域" },
  survival: { name: "生存模式", threat: "高", accent: "var(--danger)", desc: "15分钟限时生存", callsign: "极限哨站" },
  "extreme-survival": { name: "极限生存", threat: "极高", accent: "var(--danger)", desc: "极境脉冲，过载护盾", callsign: "极境空间站" },
  "peak-challenge": { name: "巅峰挑战", threat: "极高", accent: "var(--accent)", desc: "旗舰级极限挑战", callsign: "旗舰编队" },
  flagship: { name: "旗舰模式", threat: "极高", accent: "var(--anchor)", desc: "旗舰版综合体验", callsign: "旗舰编队" },
  "flagship-peak": { name: "旗舰巅峰", threat: "极高", accent: "var(--primary)", desc: "三阶段25波终极挑战", callsign: "旗舰巅峰" },
};

function FleetLoading({ mode }: { mode: string }) {
  const reducedMotion = useReducedMotion();
  const meta = MODE_META[mode] ?? { name: mode, threat: "中", accent: "var(--primary)", desc: "", callsign: "待命" };

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4">
      <DimensionBackground intensity="high" />
      <div className="noise-overlay pointer-events-none fixed inset-0" />
      <div className="pointer-events-none absolute inset-0 starfield opacity-30" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <motion.div
          initial={reducedMotion ? undefined : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-3"
        >
          <span className="orbital-ring inline-flex h-14 w-14 items-center justify-center">
            <BrandLogo size={56} variant="icon" className="text-primary" animated />
          </span>
          <BrandLogo size={56} variant="wordmark" />
        </motion.div>

        {/* Fleet Assembly Data Panel */}
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="station-panel orbital-scan w-full max-w-sm p-4 station-glow"
        >
          <div className="station-panel-header -mx-4 -mt-4 mb-3">
            <div className="flex items-center gap-2 px-4 pt-4">
              <Broadcast size={14} weight="bold" className="text-primary status-pulse" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                舰队集结港 · 任务简报
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">任务代号</span>
              <span className="font-mono text-sm font-bold tabular-nums">{meta.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">舰队呼号</span>
              <span className="font-mono text-sm font-bold tabular-nums">{meta.callsign}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">威胁等级</span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]"
                style={{ borderColor: `${meta.accent}40`, color: meta.accent, backgroundColor: `${meta.accent}10` }}
              >
                <Warning size={10} weight="bold" />
                {meta.threat}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">任务描述</span>
              <span className="text-xs text-muted">{meta.desc}</span>
            </div>
          </div>
        </motion.div>

        {/* Fleet Docking Status */}
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-panel px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-success status-pulse" />
              <span className="font-mono text-[10px] text-muted">引擎预热</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-panel px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-orbital status-pulse" style={{ animationDelay: "0.5s" }} />
              <span className="font-mono text-[10px] text-muted">导航校准</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-panel px-3 py-1.5">
              <Skeleton className="h-2 w-2 rounded-full" />
              <span className="font-mono text-[10px] text-muted">武器充能</span>
            </div>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
            舰队集结中 · 准备出航
          </p>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute left-1/4 top-1/3 h-[30vh] w-[30vh] rounded-full bg-orbital/5 blur-[80px]" />
        <div className="absolute right-1/4 bottom-1/3 h-[30vh] w-[30vh] rounded-full bg-anchor/5 blur-[80px]" />
      </div>
    </div>
  );
}

export default function GamePage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [showDifficulty, setShowDifficulty] = useState(true);
  const [difficultyPreset, setDifficultyPreset] = useState<DifficultyPreset | null>(null);
  const multiplayer = router.query.multiplayer === "1" || router.query.room !== undefined;

  const mode = (router.query.mode as GameModeType) || "campaign";

  const handleDifficultySelect = useCallback((preset: DifficultyPreset) => {
    setDifficultyPreset(preset);
    setShowDifficulty(false);
  }, []);

  useEffect(() => {
    if (showDifficulty) return;
    const timer = setTimeout(() => setReady(true), 1800);
    return () => clearTimeout(timer);
  }, [showDifficulty]);

  const handleExit = useCallback(() => {
    if (router.pathname === "/") return;
    void router.push("/");
  }, [router]);

  const meta = MODE_META[mode] ?? { name: mode, threat: "中", accent: "var(--primary)", desc: "", callsign: "待命" };

  return (
    <>
      <DifficultySelector
        open={showDifficulty}
        onSelect={handleDifficultySelect}
        modeName={meta.name}
      />

      {!showDifficulty && (
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            {!ready ? (
              <motion.div
                key="warp"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="min-h-[100dvh] w-screen"
              >
                <FleetLoading mode={mode} />
              </motion.div>
            ) : (
              <motion.div
                key="game"
                initial={reducedMotion ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="min-h-[100dvh] w-screen overflow-hidden bg-background"
              >
                <Suspense fallback={<FleetLoading mode={mode} />}>
                  <GameCanvas onExit={handleExit} multiplayer={multiplayer} difficultyPreset={difficultyPreset ?? undefined} />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </ErrorBoundary>
      )}
    </>
  );
}