import type { ReactNode } from "react";
import { useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type SheetSide = "left" | "right" | "top" | "bottom";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  side?: SheetSide;
  className?: string;
  hideCloseButton?: boolean;
}

const sideVariants: Record<SheetSide, Variants> = {
  left: {
    initial: { x: "-100%" },
    animate: { x: 0 },
    exit: { x: "-100%" },
  },
  right: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
  },
  top: {
    initial: { y: "-100%" },
    animate: { y: 0 },
    exit: { y: "-100%" },
  },
  bottom: {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" },
  },
};

const sideClasses: Record<SheetSide, string> = {
  left: "inset-y-0 left-0 h-full w-full max-w-sm rounded-r-2xl",
  right: "inset-y-0 right-0 h-full w-full max-w-sm rounded-l-2xl",
  top: "inset-x-0 top-0 w-full max-h-[80vh] rounded-b-2xl",
  bottom: "inset-x-0 bottom-0 w-full max-h-[80vh] rounded-t-2xl",
};

export default function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  side = "right",
  className,
  hideCloseButton = false,
}: SheetProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const variants = sideVariants[side];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
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
            aria-labelledby={title ? "sheet-title" : undefined}
            aria-describedby={description ? "sheet-description" : undefined}
            variants={variants}
            initial={reducedMotion ? undefined : "initial"}
            animate="animate"
            exit="exit"
            transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "absolute overflow-hidden border border-border bg-panel shadow-2xl",
              sideClasses[side],
              className
            )}
          >
            <div className="flex h-full flex-col p-6">
              <div
                className={cn("flex items-start justify-between", (title || description) && "mb-5")}
              >
                <div className="pr-6">
                  {title && (
                    <h2 id="sheet-title" className="text-lg font-bold text-foreground">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="sheet-description" className="mt-1 text-sm text-muted">
                      {description}
                    </p>
                  )}
                </div>
                {!hideCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1 text-muted transition-colors hover:bg-panel-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="关闭"
                  >
                    <X size={18} weight="bold" />
                  </button>
                )}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
