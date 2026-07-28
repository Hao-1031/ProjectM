import { useRouter } from "next/router";
import { useCallback, useEffect, useState, Suspense, lazy } from "react";
import Head from "next/head";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Warning, Hexagon, Pulse, Gauge } from "@phosphor-icons/react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Skeleton from "@/components/ui/Skeleton";
import BrandLogo from "@/components/BrandLogo";
import DimensionBackground from "@/components/effects/DimensionBackground";
import type { GameModeType } from "@/lib/game/types";

const GameCanvas = lazy(() => import("@/components/GameCanvas"));

const MODE_META: Record<string, { name: string; threat: string; accent: string; desc: string }> = {
  campaign: { name: "战役模式", threat: "低", accent: "var(--accent)", desc: "完成连续任务，抵达撤离点" },
  endless: { name: "无尽生存", threat: "极高", accent: "var(--entropy)", desc: "敌人强度随波次指数增长" },
  daily: { name: "每日挑战", threat: "中", accent: "var(--warning, #f59e0b)", desc: "固定种子，全员统一词缀" },
  roguelike: { name: "冒险模式", threat: "高", accent: "var(--success, #22c55e)", desc: "分支关卡树，诅咒与祝福" },
  defense: { name: "据点防守", threat: "高", accent: "var(--primary)", desc: "守护锚点，抵御维度入侵" },
  deathmatch: { name: "个人死斗", threat: "高", accent: "var(--entropy)", desc: "自由混战，最后存活者胜" },
  survival: { name: "生存模式", threat: "高", accent: "var(--danger, #ef4444)", desc: "15分钟限时生存" },
  "extreme-survival": { name: "极限生存", threat: "极高", accent: "var(--entropy)", desc: "极境脉冲，过载护盾" },
  "peak-challenge": { name: "巅峰挑战", threat: "极高", accent: "var(--accent)", desc: "旗舰级极限挑战" },
  flagship: { name: "旗舰模式", threat: "极高", accent: "var(--anchor)", desc: "旗舰版综合体验" },
};

function WarpLoading({ mode }: { mode: string }) {
  const reducedMotion = useReducedMotion();
  const meta = MODE_META[mode] ?? { name: mode, threat: "中", accent: "var(--primary)", desc: "" };

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4">
      <DimensionBackground intensity="high" />
      <div className="noise-overlay pointer-events-none fixed inset-0" />
      <div className="pointer-events-none absolute inset-0 bridge-grid opacity-20" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo with bridge ring */}
        <motion.div
          initial={reducedMotion ? undefined : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-3"
        >
          <span className="holo-ring inline-flex h-14 w-14 items-center justify-center">
            <BrandLogo size={56} variant="icon" className="text-primary" animated />
          </span>
          <BrandLogo size={56} variant="wordmark" />
        </motion.div>

        {/* Mode Data Panel */}
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="bridge-panel holo-scan w-full max-w-sm p-4"
        >
          <div className="bridge-panel-header -mx-4 -mt-4 mb-3">
            <div className="flex items-center gap-2 px-4 pt-4">
              <Pulse size={14} weight="bold" className="text-primary status-pulse" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                舰桥作战数据
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">任务代号</span>
              <span className="font-mono text-sm font-bold tabular-nums">{meta.name}</span>
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

        {/* Loading Progress */}
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-full max-w-xs space-y-2.5">
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-1.5 w-4/5 rounded-full" />
            <Skeleton className="h-1.5 w-3/5 rounded-full" />
          </div>
          <p className="animate-bridge-pulse font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
            维度裂痕稳定中
          </p>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute left-1/4 top-1/3 h-[30vh] w-[30vh] rounded-full bg-quantum/5 blur-[80px]" />
        <div className="absolute right-1/4 bottom-1/3 h-[30vh] w-[30vh] rounded-full bg-anchor/5 blur-[80px]" />
      </div>
    </div>
  );
}

export default function GamePage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const multiplayer = router.query.multiplayer === "1" || router.query.room !== undefined;

  const mode = (router.query.mode as GameModeType) || "campaign";

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleExit = useCallback(() => {
    if (router.pathname === "/") return;
    void router.push("/");
  }, [router]);

  const meta = MODE_META[mode] ?? { name: mode, threat: "中", accent: "var(--primary)", desc: "" };

  return (
    <>
      <Head>
        <title>{multiplayer ? "多人对战" : meta.name} - 多重宇宙</title>
        <meta name="description" content={`进入 Project M 战场 - ${meta.desc}`} />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="theme-color" content="#0c0a14" />
      </Head>

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
              <WarpLoading mode={mode} />
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
              <Suspense fallback={<WarpLoading mode={mode} />}>
                <GameCanvas onExit={handleExit} multiplayer={multiplayer} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </ErrorBoundary>
    </>
  );
}