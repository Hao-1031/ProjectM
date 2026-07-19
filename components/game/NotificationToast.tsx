import { useEffect, useCallback, forwardRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Info,
  CheckCircle,
  Warning,
  XCircle,
  X,
  SpeakerHigh,
  Shield,
  Coins,
  Crosshair,
} from "@phosphor-icons/react";

export type ToastVariant = "info" | "success" | "warning" | "danger";

export interface GameNotification {
  id: string;
  title: string;
  message?: string;
  variant?: ToastVariant;
  durationMs?: number;
  icon?: "info" | "success" | "warning" | "danger" | "audio" | "shield" | "credit" | "kill";
}

export interface NotificationToastProps {
  notifications: GameNotification[];
  onDismiss: (id: string) => void;
  maxVisible?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

const VARIANT_META: Record<
  ToastVariant,
  { border: string; bg: string; icon: typeof Info; color: string }
> = {
  info: {
    border: "border-primary/30",
    bg: "bg-panel/95",
    icon: Info,
    color: "text-primary",
  },
  success: {
    border: "border-success/30",
    bg: "bg-panel/95",
    icon: CheckCircle,
    color: "text-success",
  },
  warning: {
    border: "border-warning/30",
    bg: "bg-panel/95",
    icon: Warning,
    color: "text-warning",
  },
  danger: {
    border: "border-danger/30",
    bg: "bg-panel/95",
    icon: XCircle,
    color: "text-danger",
  },
};

const ICON_MAP: Record<NonNullable<GameNotification["icon"]>, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: Warning,
  danger: XCircle,
  audio: SpeakerHigh,
  shield: Shield,
  credit: Coins,
  kill: Crosshair,
};

function positionClasses(position: NotificationToastProps["position"]): string {
  switch (position) {
    case "top-left":
      return "left-4 top-20 items-start";
    case "bottom-left":
      return "bottom-4 left-4 items-start";
    case "bottom-right":
      return "bottom-4 right-4 items-end";
    case "top-right":
    default:
      return "right-4 top-20 items-end";
  }
}

interface ToastItemProps {
  notification: GameNotification;
  onDismiss: (id: string) => void;
}

const ToastItem = forwardRef<HTMLDivElement, ToastItemProps>(({ notification, onDismiss }, ref) => {
  const reducedMotion = useReducedMotion();
  const variant = notification.variant ?? "info";
  const meta = VARIANT_META[variant];
  const Icon = notification.icon ? ICON_MAP[notification.icon] : meta.icon;
  const duration = notification.durationMs ?? 3600;

  const handleDismiss = useCallback(() => {
    onDismiss(notification.id);
  }, [notification.id, onDismiss]);

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(handleDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, handleDismiss]);

  return (
    <motion.div
      ref={ref}
      layout={!reducedMotion}
      initial={reducedMotion ? undefined : { opacity: 0, x: 28, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0, x: 16, scale: 0.96 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }}
      className={`pointer-events-auto flex w-full max-w-[320px] gap-3 overflow-hidden rounded-xl border ${meta.border} ${meta.bg} p-3 shadow-2xl backdrop-blur-md md:max-w-[380px] md:p-4`}
      role="alert"
    >
      <div className={`shrink-0 pt-0.5 ${meta.color}`}>
        <Icon size={20} weight="bold" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{notification.title}</p>
        {notification.message && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{notification.message}</p>
        )}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded p-1 text-muted transition-colors hover:bg-panel-raised hover:text-foreground focus-ring"
        aria-label="关闭通知"
      >
        <X size={14} weight="bold" />
      </button>
      {duration > 0 && !reducedMotion && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: "linear" }}
          className="absolute bottom-0 left-0 h-0.5 origin-left bg-current opacity-30"
          style={{ color: "var(--primary)" }}
        />
      )}
    </motion.div>
  );
});
ToastItem.displayName = "ToastItem";

export default function NotificationToast({
  notifications,
  onDismiss,
  maxVisible = 4,
  position = "top-right",
}: NotificationToastProps) {
  const reducedMotion = useReducedMotion();
  const visible = notifications.slice(0, maxVisible);
  const hiddenCount = notifications.length - visible.length;

  return (
    <div
      className={`pointer-events-none fixed z-40 flex flex-col gap-2 ${positionClasses(position)}`}
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence mode="popLayout">
        {visible.map((notification) => (
          <ToastItem key={notification.id} notification={notification} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
      {hiddenCount > 0 && (
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-auto rounded-full border border-border bg-panel/95 px-3 py-1 text-center text-xs text-muted shadow-lg backdrop-blur-md"
        >
          还有 {hiddenCount} 条通知
        </motion.div>
      )}
    </div>
  );
}
