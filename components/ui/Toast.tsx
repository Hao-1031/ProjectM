"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  CheckCircle,
  Warning,
  WarningCircle,
  Info,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: ReactNode;
  variant?: ToastVariant;
  duration?: number;
  action?: ReactNode;
}

export interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast-${++toastIdCounter}`;
      const duration = toast.duration ?? 4000;
      const newToast: Toast = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, duration);
        timers.current.set(id, timer);
      }

      return id;
    },
    [removeToast]
  );

  const clearToasts = useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
    setToasts([]);
  }, []);

  useEffect(() => {
    const currentTimers = timers.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

const variantIcon: Record<ToastVariant, typeof CheckCircle> = {
  default: Info,
  success: CheckCircle,
  error: WarningCircle,
  warning: Warning,
  info: Info,
};

const variantStyles: Record<ToastVariant, string> = {
  default: "border-border bg-panel-raised text-foreground",
  success: "border-success/30 bg-success/5 text-foreground",
  error: "border-danger/30 bg-danger/5 text-foreground",
  warning: "border-warning/30 bg-warning/5 text-foreground",
  info: "border-primary/30 bg-primary/5 text-foreground",
};

const variantIconColor: Record<ToastVariant, string> = {
  default: "text-muted",
  success: "text-success",
  error: "text-danger",
  warning: "text-warning",
  info: "text-primary",
};

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="fixed bottom-4 right-4 z-[200] flex flex-col-reverse gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="通知"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = variantIcon[toast.variant ?? "default"];
          return (
            <motion.div
              key={toast.id}
              layout={reducedMotion ? undefined : true}
              initial={reducedMotion ? undefined : { opacity: 0, x: 80, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={
                reducedMotion
                  ? undefined
                  : { opacity: 0, x: 80, scale: 0.96, transition: { duration: 0.2 } }
              }
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className={cn(
                "pointer-events-auto flex w-full max-w-[360px] items-start gap-3 rounded-xl border p-3 shadow-2xl",
                variantStyles[toast.variant ?? "default"]
              )}
              role="status"
            >
              <Icon
                size={18}
                weight="bold"
                className={cn("mt-0.5 shrink-0", variantIconColor[toast.variant ?? "default"])}
              />
              <div className="min-w-0 flex-1 self-center text-sm font-medium">{toast.message}</div>
              <div className="flex shrink-0 items-center gap-2">
                {toast.action}
                <button
                  type="button"
                  onClick={() => onRemove(toast.id)}
                  className="rounded-lg p-0.5 text-muted transition-colors hover:bg-panel-raised/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="关闭通知"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function useToast() {
  const { addToast, removeToast, clearToasts, toasts } = useToastContext();

  const toast = useCallback(
    (message: ReactNode, options?: Omit<Toast, "id" | "message">) => {
      return addToast({ message, ...options });
    },
    [addToast]
  );

  const success = useCallback(
    (message: ReactNode, options?: Omit<Toast, "id" | "message" | "variant">) => {
      return addToast({ message, variant: "success", ...options });
    },
    [addToast]
  );

  const error = useCallback(
    (message: ReactNode, options?: Omit<Toast, "id" | "message" | "variant">) => {
      return addToast({ message, variant: "error", ...options });
    },
    [addToast]
  );

  const warning = useCallback(
    (message: ReactNode, options?: Omit<Toast, "id" | "message" | "variant">) => {
      return addToast({ message, variant: "warning", ...options });
    },
    [addToast]
  );

  const info = useCallback(
    (message: ReactNode, options?: Omit<Toast, "id" | "message" | "variant">) => {
      return addToast({ message, variant: "info", ...options });
    },
    [addToast]
  );

  return { toast, success, error, warning, info, remove: removeToast, clear: clearToasts, toasts };
}