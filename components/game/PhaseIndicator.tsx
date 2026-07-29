import { motion, useReducedMotion } from "framer-motion";
import { Shield, Fire, Skull, EyeSlash, Circle, Sparkle } from "@phosphor-icons/react";
import type { FlagshipPeakPhase } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export interface PhaseIndicatorProps {
  phase: FlagshipPeakPhase;
  className?: string;
}

const PHASE_CONFIG: Record<
  string,
  { icon: typeof Shield; label: string; accent: string; bg: string; border: string; pulse: boolean }
> = {
  standard: {
    icon: Shield,
    label: "标准巡航",
    accent: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    pulse: false,
  },
  overclock: {
    icon: Fire,
    label: "超频增压",
    accent: "text-danger",
    bg: "bg-danger/10",
    border: "border-danger/40",
    pulse: true,
  },
  hell: {
    icon: Skull,
    label: "地狱终局",
    accent: "text-[#a855f7]",
    bg: "bg-[#a855f7]/10",
    border: "border-[#a855f7]/40",
    pulse: true,
  },
  abyss: {
    icon: EyeSlash,
    label: "深渊",
    accent: "text-[#1a1a1a]",
    bg: "bg-[#1a1a1a]/10",
    border: "border-[#1a1a1a]/40",
    pulse: true,
  },
  void: {
    icon: Circle,
    label: "虚空",
    accent: "text-[#e2e8f0]",
    bg: "bg-[#e2e8f0]/10",
    border: "border-[#e2e8f0]/40",
    pulse: true,
  },
  genesis: {
    icon: Sparkle,
    label: "创世",
    accent: "text-[#00ffcc]",
    bg: "bg-[#00ffcc]/10",
    border: "border-[#00ffcc]/40",
    pulse: true,
  },
  victory: {
    icon: Shield,
    label: "胜利",
    accent: "text-success",
    bg: "bg-success/10",
    border: "border-success/30",
    pulse: false,
  },
  defeat: {
    icon: Skull,
    label: "失败",
    accent: "text-danger",
    bg: "bg-danger/10",
    border: "border-danger/30",
    pulse: false,
  },
};

export default function PhaseIndicator({ phase, className }: PhaseIndicatorProps) {
  const reducedMotion = useReducedMotion();
  const config = PHASE_CONFIG[phase] ?? PHASE_CONFIG.standard;
  const Icon = config.icon;

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "pointer-events-auto flex items-center gap-2 rounded-xl border bg-panel/85 px-3 py-2 shadow-lg backdrop-blur-xl",
        config.border,
        className
      )}
    >
      <div
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg",
          config.bg,
          config.accent
        )}
      >
        {config.pulse ? (
          <motion.span
            animate={reducedMotion ? undefined : { scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon size={16} weight="fill" />
          </motion.span>
        ) : (
          <Icon size={16} weight="fill" />
        )}
      </div>
      <div>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-muted">
          阶段
        </p>
        <p className={cn("text-xs font-bold", config.accent)}>{config.label}</p>
      </div>
    </motion.div>
  );
}

export interface FlagshipPeakHudPanelProps {
  phase: FlagshipPeakPhase;
  score: number;
  combos: number;
  maxCombo: number;
  challengesCompleted: number;
  totalChallenges: number;
  className?: string;
}

export function FlagshipPeakHudPanel({
  phase,
  score,
  combos,
  maxCombo,
  challengesCompleted,
  totalChallenges,
  className,
}: FlagshipPeakHudPanelProps) {
  const reducedMotion = useReducedMotion();
  const config = PHASE_CONFIG[phase] ?? PHASE_CONFIG.standard;

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "pointer-events-auto flex flex-col gap-2 rounded-2xl border bg-panel/85 p-3 shadow-xl backdrop-blur-xl min-w-[160px]",
        config.border,
        className
      )}
    >
      <PhaseIndicator phase={phase} className="border-0 bg-transparent p-0 shadow-none backdrop-blur-none" />

      <div className="h-px bg-border/50" />

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted">积分</span>
          <span className="font-mono font-bold tabular-nums text-primary">
            {score.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted">连击</span>
          <span className="font-mono font-bold tabular-nums">
            <motion.span
              key={combos}
              initial={reducedMotion ? undefined : { scale: 1.2 }}
              animate={{ scale: 1 }}
              className="inline-block"
            >
              {combos}
            </motion.span>
            {" / "}
            <span className="text-muted">最佳 {maxCombo}</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted">挑战</span>
          <span className="font-mono font-bold tabular-nums text-success">
            {challengesCompleted}/{totalChallenges}
          </span>
        </div>
      </div>
    </motion.div>
  );
}