import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Spinner } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import Skeleton from "./Skeleton";

export interface LoadingStateProps {
  /** 变体: skeleton 骨架屏, spinner 旋转器, pulse 脉冲 */
  variant?: "skeleton" | "spinner" | "pulse";
  /** 标题文字 */
  title?: string;
  /** 描述文字 */
  description?: string;
  /** 骨架行数 (仅 variant="skeleton") */
  skeletonLines?: number;
  /** 自定义加载图标 */
  icon?: ReactNode;
  /** 全屏模式 */
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingState({
  variant = "skeleton",
  title,
  description,
  skeletonLines = 4,
  icon,
  fullScreen = false,
  className,
}: LoadingStateProps) {
  const reducedMotion = useReducedMotion();

  const content = (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullScreen && "min-h-[50dvh]",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {variant === "spinner" && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-panel">
            {icon ?? <Spinner size={28} weight="bold" className="animate-spin text-primary" />}
          </div>
          {title && (
            <p className="font-display text-sm font-bold text-foreground">{title}</p>
          )}
          {description && (
            <p className="max-w-xs text-center text-xs text-muted">{description}</p>
          )}
        </div>
      )}

      {variant === "pulse" && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-panel">
            {icon ?? (
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-2.5 w-2.5 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          {title && (
            <p className="font-display text-sm font-bold text-foreground">{title}</p>
          )}
          {description && (
            <p className="max-w-xs text-center text-xs text-muted">{description}</p>
          )}
        </div>
      )}

      {variant === "skeleton" && (
        <div className="w-full max-w-md space-y-3">
          {title && (
            <p className="font-display text-sm font-bold text-foreground">{title}</p>
          )}
          {description && (
            <p className="mb-1 text-xs text-muted">{description}</p>
          )}
          {Array.from({ length: skeletonLines }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                "h-4",
                i === skeletonLines - 1 ? "w-3/5" : i === 0 ? "w-full" : "w-4/5"
              )}
            />
          ))}
        </div>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center px-4">
        {content}
      </div>
    );
  }

  return content;
}