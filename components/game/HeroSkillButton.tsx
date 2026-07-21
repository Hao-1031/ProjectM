import { motion, useReducedMotion } from "framer-motion";
import { Lightning, Prohibit } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface HeroSkillButtonProps {
  name: string;
  icon?: React.ReactNode;
  cooldown: number;
  remaining: number;
  onClick?: () => void;
  onPointerDown?: () => void;
  disabled?: boolean;
  className?: string;
  shortcut?: string;
  size?: "sm" | "md" | "lg";
}

export default function HeroSkillButton({
  name,
  icon,
  cooldown,
  remaining,
  onClick,
  onPointerDown,
  disabled = false,
  className,
  shortcut,
  size = "md",
}: HeroSkillButtonProps) {
  const reducedMotion = useReducedMotion();
  const ready = remaining <= 0;
  const pct = Math.max(0, Math.min(100, ((cooldown - remaining) / cooldown) * 100));

  const sizeClasses = {
    sm: "h-14 w-14 min-h-[56px] min-w-[56px]",
    md: "h-16 w-16 min-h-[64px] min-w-[64px] sm:h-[72px] sm:w-[72px]",
    lg: "h-[72px] w-[72px] min-h-[72px] min-w-[72px] sm:h-20 sm:w-20",
  };

  return (
    <motion.button
      type="button"
      data-touch-target="true"
      onClick={onClick}
      onPointerDown={onPointerDown}
      disabled={!ready || disabled}
      whileTap={reducedMotion || !ready ? undefined : { scale: 0.92 }}
      whileHover={reducedMotion || !ready ? undefined : { scale: 1.04 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "pointer-events-auto relative flex items-center justify-center overflow-hidden rounded-2xl border-2 bg-panel/90 shadow-lg backdrop-blur-md touch-manipulation select-none",
        sizeClasses[size],
        ready && !disabled
          ? "border-primary text-primary hover:bg-primary/10 active:bg-primary/15"
          : "border-border text-muted",
        className
      )}
      aria-label={`${name}${ready ? " 已就绪" : ` 冷却中 ${remaining.toFixed(1)} 秒`}`}
    >
      {!ready && (
        <div
          className="absolute inset-0 bg-border/60 origin-bottom"
          style={{ transform: `scaleY(${1 - pct / 100})` }}
        />
      )}
      <span className="relative z-10">
        {icon ??
          (ready ? <Lightning size={size === "lg" ? 28 : 24} weight="bold" /> : <Prohibit size={size === "lg" ? 28 : 24} weight="bold" />)}
      </span>
      {!ready && (
        <span className="absolute bottom-1 z-10 font-mono text-[10px] font-bold text-foreground">
          {remaining.toFixed(1)}
        </span>
      )}
      {shortcut && (
        <span className="absolute left-1 top-1 z-10 rounded bg-background/80 px-1 font-mono text-[9px] font-bold text-muted">
          {shortcut}
        </span>
      )}
      {ready && !disabled && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-primary opacity-0"
          animate={{ opacity: [0, 0.5, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.button>
  );
}
