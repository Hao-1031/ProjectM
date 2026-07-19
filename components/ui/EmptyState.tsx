import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Info } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  title = "暂无数据",
  description = "当前列表为空，稍后再来看看。",
  icon,
  action,
  className,
}: EmptyStateProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-border bg-panel/50 px-6 py-12 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-panel-raised text-muted">
        {icon ?? <Info size={24} weight="bold" />}
      </div>
      <h3 className="mt-4 text-sm font-bold text-foreground">{title}</h3>
      <p className="mt-1 max-w-xs text-xs text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
