import { motion, useReducedMotion } from "framer-motion";
import { Flag, Skull, Timer } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface WaveIndicatorProps {
  currentWave: number;
  totalWaves: number;
  enemiesRemaining: number;
  waveTimer?: number;
  className?: string;
}

export default function WaveIndicator({
  currentWave,
  totalWaves,
  enemiesRemaining,
  waveTimer,
  className,
}: WaveIndicatorProps) {
  const reducedMotion = useReducedMotion();
  const isFinal = currentWave >= totalWaves - 1;

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-3 rounded-2xl border border-border bg-panel/90 px-4 py-3 shadow-lg backdrop-blur-md",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-panel-raised">
        <Flag size={20} weight="bold" className={isFinal ? "text-danger" : "text-primary"} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted">波次</p>
        <div className="flex items-baseline gap-1.5">
          <motion.span
            key={currentWave}
            initial={reducedMotion ? undefined : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-bold leading-none text-foreground"
          >
            {currentWave + 1}
          </motion.span>
          <span className="text-xs text-muted">/ {totalWaves}</span>
        </div>
      </div>

      <div className="mx-2 h-8 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Skull size={16} weight="bold" className="text-muted" />
        <div>
          <p className="text-[10px] font-bold text-muted">剩余敌人</p>
          <p className="font-mono text-sm font-bold text-foreground">{enemiesRemaining}</p>
        </div>
      </div>

      {waveTimer !== undefined && waveTimer > 0 && (
        <div className="flex items-center gap-2">
          <Timer size={16} weight="bold" className="text-accent" />
          <div>
            <p className="text-[10px] font-bold text-muted">下一波</p>
            <p className="font-mono text-sm font-bold text-accent">{waveTimer.toFixed(1)}s</p>
          </div>
        </div>
      )}
    </div>
  );
}
