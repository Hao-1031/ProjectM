import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const sizes = {
  sm: { width: 32, height: 18, dot: 12, translate: 14 },
  md: { width: 44, height: 24, dot: 18, translate: 20 },
};

export default function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = "md",
  className,
}: SwitchProps) {
  const reducedMotion = useReducedMotion();
  const dims = sizes[size];

  return (
    <label
      className={cn(
        "group relative inline-flex items-center gap-3",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) onChange(!checked);
          }
        }}
        className={cn(
          "relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          checked ? "bg-primary" : "bg-border"
        )}
        style={{ width: dims.width, height: dims.height }}
      >
        <motion.span
          className="inline-block rounded-full bg-white shadow-sm"
          animate={{
            x: checked ? dims.translate : 2,
          }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 500, damping: 30 }
          }
          style={{ width: dims.dot, height: dims.dot }}
        />
      </button>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className={cn("font-medium", size === "sm" ? "text-xs" : "text-sm")}>
              {label}
            </span>
          )}
          {description && (
            <span className="text-[10px] text-muted">{description}</span>
          )}
        </div>
      )}
    </label>
  );
}