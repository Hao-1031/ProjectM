import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Warning, ArrowClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import Button from "./Button";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error | null;
  icon?: ReactNode;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}

export default function ErrorState({
  title = "出错了",
  description = "加载内容时遇到问题，请重试。",
  error,
  icon,
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-danger/30 bg-danger/5 px-6 py-12 text-center",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-danger/30 bg-danger/10 text-danger">
        {icon ?? <Warning size={24} weight="bold" />}
      </div>
      <h3 className="mt-4 text-sm font-bold text-foreground">{title}</h3>
      <p className="mt-1 max-w-xs text-xs text-muted">{description}</p>
      {error && (
        <p className="mt-2 max-w-xs break-words font-mono text-[10px] text-danger/80">
          {error.message}
        </p>
      )}
      <div className="mt-5 flex items-center gap-3">
        {onRetry && (
          <Button
            variant="danger"
            size="sm"
            onClick={onRetry}
            leftIcon={<ArrowClockwise size={14} weight="bold" />}
          >
            重试
          </Button>
        )}
        {action}
      </div>
    </motion.div>
  );
}
