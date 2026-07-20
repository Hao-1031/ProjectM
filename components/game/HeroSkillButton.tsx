import { motion, useReducedMotion } from "framer-motion";
import { Lightning, Prohibit } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface HeroSkillButtonProps {
  name: string;
  icon?: React.ReactNode;
  cooldown: number;
  remaining: number;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function HeroSkillButton({
  name,
  icon,
  cooldown,
  remaining,
  onClick,
  disabled = false,
  className,
}: HeroSkillButtonProps) {
  const reducedMotion = useReducedMotion();
  const ready = remaining <= 0;
  const pct = Math.max(0, Math.min(100, ((cooldown - remaining) / cooldown) * 100));

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!ready || disabled}
      whileTap={reducedMotion || !ready ? undefined : { scale: 0.92 }}
      whileHover={reducedMotion || !ready ? undefined : { scale: 1.04 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "pointer-events-auto relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border-2 bg-panel/90 shadow-lg backdrop-blur-md touch-manipulation sm:h-16 sm:w-16",
        ready && !disabled
          ? "border-primary text-primary hover:bg-primary/10"
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
          (ready ? <Lightning size={24} weight="bold" /> : <Prohibit size={24} weight="bold" />)}
      </span>
      {!ready && (
        <span className="absolute bottom-1 z-10 font-mono text-[10px] font-bold text-foreground">
          {remaining.toFixed(1)}
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
