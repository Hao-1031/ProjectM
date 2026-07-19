import { motion, useReducedMotion } from "framer-motion";
import { Lightning, CheckCircle, Circle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface NodeStatusProps {
  captured: boolean;
  active: boolean;
  captureProgress: number;
  captureTime: number;
  energyValue: number;
  className?: string;
}

export default function NodeStatus({
  captured,
  active,
  captureProgress,
  captureTime,
  energyValue,
  className,
}: NodeStatusProps) {
  const reducedMotion = useReducedMotion();
  const pct = Math.max(0, Math.min(100, (captureProgress / captureTime) * 100));

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-[180px] flex-col gap-2 rounded-2xl border bg-panel/90 p-3 shadow-lg backdrop-blur-md",
        captured ? "border-success/40" : active ? "border-primary/40" : "border-border"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          {captured ? (
            <CheckCircle size={16} weight="bold" className="text-success" />
          ) : active ? (
            <Lightning size={16} weight="bold" className="text-primary animate-pulse" />
          ) : (
            <Circle size={16} weight="bold" className="text-muted" />
          )}
          能量节点
        </span>
        <span className="font-mono text-[10px] text-muted">+{energyValue}</span>
      </div>

      {!captured && active && (
        <div className="h-1.5 overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={
              reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 20 }
            }
          />
        </div>
      )}

      <p className="text-[10px] text-muted">
        {captured ? "已占领 - 能量产出中" : active ? `占领中 ${Math.round(pct)}%` : "未激活"}
      </p>
    </div>
  );
}
