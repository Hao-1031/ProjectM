import type { ReactNode } from "react";
import { useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  hideCloseButton?: boolean;
}

export default function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  hideCloseButton = false,
}: DialogProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "dialog-title" : undefined}
            aria-describedby={description ? "dialog-description" : undefined}
            initial={reducedMotion ? undefined : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: reducedMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-panel p-6 shadow-2xl",
              className
            )}
          >
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1 text-muted transition-colors hover:bg-panel-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="关闭"
              >
                <X size={18} weight="bold" />
              </button>
            )}
            {title && (
              <h2 id="dialog-title" className="pr-6 text-lg font-bold text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p id="dialog-description" className="mt-1 text-sm text-muted">
                {description}
              </p>
            )}
            <div className={cn((title || description) && "mt-5")}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
