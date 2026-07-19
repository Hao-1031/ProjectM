import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type ProgressVariant = "default" | "primary" | "accent" | "danger" | "success";

export interface ProgressProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  size?: "sm" | "md" | "lg";
  label?: string;
  showValue?: boolean;
  animated?: boolean;
  className?: string;
}

const variantColors: Record<ProgressVariant, string> = {
  default: "bg-muted",
  primary: "bg-primary",
  accent: "bg-accent",
  danger: "bg-danger",
  success: "bg-success",
};

const sizes = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

export default function Progress({
  value,
  max = 100,
  variant = "primary",
  size = "md",
  label,
  showValue = false,
  animated = true,
  className,
}: ProgressProps) {
  const reducedMotion = useReducedMotion();
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          {label && <span className="font-medium text-muted">{label}</span>}
          {showValue && <span className="font-mono text-foreground">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className={cn("w-full overflow-hidden rounded-full bg-border", sizes[size])}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
        aria-label={label}
      >
        <motion.div
          className={cn("h-full rounded-full", variantColors[variant])}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={
            animated && !reducedMotion
              ? { type: "spring", stiffness: 200, damping: 20 }
              : { duration: 0 }
          }
        />
      </div>
    </div>
  );
}
