import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Skull, ShieldCheck, Siren, Crosshair, CaretDoubleRight } from "@phosphor-icons/react";

export type WavePhase = "incoming" | "active" | "cleared" | "boss";

export interface WaveAnnouncementProps {
  wave: number;
  totalWaves?: number;
  phase: WavePhase;
  enemyCount?: number;
  bossName?: string;
  visible: boolean;
  onComplete?: () => void;
  durationMs?: number;
}

const PHASE_META: Record<
  WavePhase,
  { label: string; sub: string; icon: typeof Skull; color: string; borderColor: string }
> = {
  incoming: {
    label: "敌潮逼近",
    sub: "准备接敌",
    icon: Siren,
    color: "text-warning",
    borderColor: "border-warning/30",
  },
  active: {
    label: "波次进行中",
    sub: "肃清威胁",
    icon: Crosshair,
    color: "text-danger",
    borderColor: "border-danger/30",
  },
  cleared: {
    label: "区域安全",
    sub: "补给窗口开启",
    icon: ShieldCheck,
    color: "text-success",
    borderColor: "border-success/30",
  },
  boss: {
    label: "首领出现",
    sub: "警告：高能量反应",
    icon: Skull,
    color: "text-danger",
    borderColor: "border-danger/40",
  },
};

export default function WaveAnnouncement({
  wave,
  totalWaves,
  phase,
  enemyCount = 0,
  bossName,
  visible,
  onComplete,
  durationMs = 2600,
}: WaveAnnouncementProps) {
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const meta = PHASE_META[phase];
  const Icon = meta.icon;

  useEffect(() => {
    if (!visible || reducedMotion) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(1, elapsed / durationMs);
      setProgress(pct);
      if (pct < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onComplete?.();
      }
    };

    raf = requestAnimationFrame(tick);
    const timer = setTimeout(() => onComplete?.(), durationMs);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [visible, phase, wave, durationMs, reducedMotion, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4"
          role="status"
          aria-live="polite"
        >
          <div
            className={`relative overflow-hidden rounded-2xl border bg-panel/95 px-6 py-4 shadow-2xl backdrop-blur-md md:px-10 md:py-5 ${meta.borderColor}`}
          >
            <motion.div
              initial={reducedMotion ? undefined : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: reducedMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-0 h-1 origin-left bg-gradient-to-r from-primary to-accent"
            />

            {!reducedMotion && (
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-current opacity-40"
                style={{ width: `${progress * 100}%`, color: "var(--primary)" }}
              />
            )}

            <div className="relative flex items-center gap-4 md:gap-6">
              <motion.div
                initial={reducedMotion ? undefined : { scale: 0.6, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className={`flex h-12 w-12 items-center justify-center rounded-xl border bg-background md:h-14 md:w-14 ${meta.borderColor}`}
              >
                <Icon size={28} weight="bold" className={meta.color} />
              </motion.div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase tracking-widest text-muted">
                    WAVE {wave.toString().padStart(2, "0")}
                    {totalWaves !== undefined && ` / ${totalWaves.toString().padStart(2, "0")}`}
                  </span>
                  <CaretDoubleRight size={12} weight="bold" className="text-muted" />
                  <span className={`text-xs font-bold uppercase tracking-widest ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>

                <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                  {phase === "boss" && bossName ? bossName : meta.sub}
                </h2>

                {phase === "active" && enemyCount > 0 && (
                  <p className="mt-1 text-xs text-muted md:text-sm">
                    剩余目标：
                    <span className="font-mono font-bold text-foreground">{enemyCount}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
