import { motion, useReducedMotion } from "framer-motion";
import { Skull, Crown, Lightning } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface BossHealthBarProps {
  name: string;
  health: number;
  maxHealth: number;
  phase: number;
  phaseThresholds: number[];
  className?: string;
}

export default function BossHealthBar({
  name,
  health,
  maxHealth,
  phase,
  phaseThresholds,
  className,
}: BossHealthBarProps) {
  const reducedMotion = useReducedMotion();
  const pct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const currentPhase = Math.min(phase, phaseThresholds.length);
  const totalPhases = phaseThresholds.length + 1;
  const isFinalPhase = currentPhase >= totalPhases - 1;

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-[520px] rounded-2xl border border-border bg-panel/90 p-4 shadow-2xl backdrop-blur-md",
        isFinalPhase && "border-danger/40"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isFinalPhase ? (
            <Lightning size={18} weight="bold" className="text-danger" />
          ) : (
            <Crown size={18} weight="bold" className="text-warning" />
          )}
          <h3 className="text-sm font-bold text-foreground">{name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Skull size={14} weight="bold" className="text-muted" />
          <span className="font-mono text-xs text-muted">
            阶段 {currentPhase + 1} / {totalPhases}
          </span>
        </div>
      </div>

      <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-border">
        <motion.div
          className={cn("h-full rounded-full", isFinalPhase ? "bg-danger" : "bg-warning")}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={
            reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 16 }
          }
        />

        {/* Phase markers */}
        <div className="absolute inset-0 flex">
          {phaseThresholds.map((threshold, index) => (
            <div
              key={index}
              className="absolute top-0 h-full w-px bg-background/60"
              style={{ left: `${threshold * 100}%` }}
            />
          ))}
        </div>

        {isFinalPhase && (
          <motion.div
            className="absolute inset-0 rounded-full bg-danger/20"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-mono text-muted">
          {Math.ceil(health)} / {maxHealth}
        </span>
        <span className={cn("font-bold", isFinalPhase ? "text-danger" : "text-warning")}>
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}
