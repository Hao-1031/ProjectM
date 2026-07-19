import { motion, useReducedMotion } from "framer-motion";
import { Shield, ShieldWarning, ShieldCheckered } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface CoreHealthBarProps {
  health: number;
  maxHealth: number;
  label?: string;
  className?: string;
}

export default function CoreHealthBar({
  health,
  maxHealth,
  label = "核心耐久",
  className,
}: CoreHealthBarProps) {
  const reducedMotion = useReducedMotion();
  const pct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const low = pct <= 30;
  const critical = pct <= 15;

  return (
    <div
      className={cn(
        "pointer-events-auto w-full min-w-[180px] max-w-[300px] rounded-2xl border border-border bg-panel/90 p-3 shadow-lg backdrop-blur-md",
        critical && "border-danger/50"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          {critical ? (
            <ShieldWarning size={16} weight="bold" className="text-danger" />
          ) : low ? (
            <ShieldCheckered size={16} weight="bold" className="text-warning" />
          ) : (
            <Shield size={16} weight="bold" className="text-success" />
          )}
          {label}
        </span>
        <span className="font-mono text-xs text-muted">
          {Math.ceil(health)} / {maxHealth}
        </span>
      </div>
      <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-border">
        <motion.div
          className={cn(
            "h-full rounded-full",
            critical ? "bg-danger" : low ? "bg-warning" : "bg-success"
          )}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={
            reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 18 }
          }
        />
        {critical && (
          <motion.div
            className="absolute inset-0 rounded-full bg-danger/30"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
    </div>
  );
}
