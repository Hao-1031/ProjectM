import { motion, useReducedMotion } from "framer-motion";
import { Shield, Bomb, Crosshair, Broadcast, Robot, Heart } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { Deployable } from "@/lib/game/types";

const deployableMeta: Record<
  Deployable["type"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  shield: { label: "护盾塔", icon: <Shield size={16} weight="bold" />, color: "text-primary" },
  mine: { label: "地雷", icon: <Bomb size={16} weight="bold" />, color: "text-danger" },
  turret: { label: "自动炮塔", icon: <Crosshair size={16} weight="bold" />, color: "text-accent" },
  beacon: { label: "信标", icon: <Broadcast size={16} weight="bold" />, color: "text-warning" },
  drone: { label: "无人机", icon: <Robot size={16} weight="bold" />, color: "text-success" },
  healAura: { label: "治疗光环", icon: <Heart size={16} weight="bold" />, color: "text-success" },
};

export interface DeployableCardProps {
  deployable: Deployable;
  className?: string;
}

export default function DeployableCard({ deployable, className }: DeployableCardProps) {
  const reducedMotion = useReducedMotion();
  const meta = deployableMeta[deployable.type];
  const healthPct = Math.max(0, Math.min(100, (deployable.health / deployable.maxHealth) * 100));
  const timerPct = Math.max(0, Math.min(100, (deployable.timer / deployable.maxTimer) * 100));

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "pointer-events-auto flex w-[170px] flex-col gap-2 rounded-2xl border border-border bg-panel/90 p-3 shadow-lg backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("flex items-center gap-1.5 text-xs font-bold", meta.color)}>
          {meta.icon}
          {meta.label}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted">
          <span>耐久</span>
          <span className="font-mono">{Math.ceil(healthPct)}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-border">
          <motion.div
            className={cn("h-full rounded-full", healthPct > 30 ? "bg-success" : "bg-danger")}
            initial={false}
            animate={{ width: `${healthPct}%` }}
            transition={
              reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 20 }
            }
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted">
          <span>剩余时间</span>
          <span className="font-mono">{Math.ceil(deployable.timer)}s</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-muted"
            initial={false}
            animate={{ width: `${timerPct}%` }}
            transition={
              reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 20 }
            }
          />
        </div>
      </div>
    </motion.div>
  );
}
