import type { ReactNode } from "react";
import { useState, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
  className?: string;
  disabled?: boolean;
}

const placementClasses: Record<TooltipPlacement, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowClasses: Record<TooltipPlacement, string> = {
  top: "top-full left-1/2 -translate-x-1/2 -mt-1 border-l-transparent border-r-transparent border-b-0 border-t-panel-raised",
  bottom:
    "bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l-transparent border-r-transparent border-t-0 border-b-panel-raised",
  left: "left-full top-1/2 -translate-y-1/2 -ml-1 border-t-transparent border-b-transparent border-r-0 border-l-panel-raised",
  right:
    "right-full top-1/2 -translate-y-1/2 -mr-1 border-t-transparent border-b-transparent border-l-0 border-r-panel-raised",
};

export default function Tooltip({
  content,
  children,
  placement = "top",
  delay = 150,
  className,
  disabled = false,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();

  const handleEnter = () => {
    if (disabled) return;
    timer.current = setTimeout(() => setOpen(true), delay);
  };

  const handleLeave = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      {children}
      <AnimatePresence>
        {open && !disabled && (
          <motion.span
            initial={reducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "pointer-events-none absolute z-50 w-max max-w-[200px] rounded-lg border border-border bg-panel-raised px-2 py-1 text-xs font-medium text-foreground shadow-lg",
              placementClasses[placement],
              className
            )}
            role="tooltip"
          >
            {content}
            <span
              className={cn(
                "absolute h-0 w-0 border-4 border-transparent",
                arrowClasses[placement]
              )}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
