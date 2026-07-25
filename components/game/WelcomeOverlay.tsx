import { useEffect, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
  useReducedMotion,
} from "framer-motion";
import { ArrowRight, Crosshair, Shield, Spinner } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

export interface WelcomeOverlayProps {
  open: boolean;
  onComplete: () => void;
  playerName?: string;
  modeName?: string;
  autoAdvanceDelay?: number;
  loading?: boolean;
  error?: string | null;
}

export default function WelcomeOverlay({
  open,
  onComplete,
  playerName,
  modeName = "据点防守",
  autoAdvanceDelay = 3800,
  loading = false,
  error = null,
}: WelcomeOverlayProps) {
  const completeRef = useRef(false);
  const progress = useMotionValue(0);
  const progressWidth = useTransform(progress, (v) => `${v}%`);
  const reducedMotion = useReducedMotion();

  const handleComplete = useCallback(() => {
    if (completeRef.current) return;
    completeRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = () => handleComplete();
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleComplete]);

  useEffect(() => {
    completeRef.current = false;
    progress.set(0);

    if (!open || loading || error) return;

    const controls = animate(progress, 100, {
      duration: autoAdvanceDelay / 1000,
      ease: "linear",
    });

    const timer = setTimeout(() => {
      if (!completeRef.current) {
        handleComplete();
      }
    }, autoAdvanceDelay);

    return () => {
      controls.stop();
      clearTimeout(timer);
    };
  }, [open, loading, error, autoAdvanceDelay, handleComplete, progress]);

  if (!open) return null;

  const transition = reducedMotion
    ? { duration: 0.01 }
    : { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          key="welcome-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reducedMotion ? { duration: 0.01 } : { duration: 0.3 }}
          className="fixed inset-0 z-[200] flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background/95 px-6 py-12"
          onClick={handleComplete}
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
          aria-describedby="welcome-desc"
        >
          <div className="noise-overlay" />
          <div className="pointer-events-none absolute inset-0 dot-grid opacity-20" />

          <motion.div
            className="relative z-10 w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={transition}
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-3xl border border-border bg-panel/90 p-8 shadow-2xl shadow-black/25 backdrop-blur-md md:p-12"
              )}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-60" />
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-accent/5 blur-3xl" />

              <div className="relative">
                <div className="mb-8 flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Crosshair size={18} weight="bold" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
                    指挥终端已连接
                  </span>
                </div>

                {loading ? (
                  <div className="flex flex-col items-start gap-4 py-8">
                    <div className="h-8 w-48 rounded-lg bg-shimmer" />
                    <div className="h-4 w-3/4 rounded bg-shimmer" />
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                      <Spinner size={16} weight="bold" className="animate-spin" />
                      正在同步作战数据 ...
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-start gap-3 py-6">
                    <div className="flex items-center gap-2 text-danger">
                      <Shield size={20} weight="bold" />
                      <span className="text-sm font-bold">连接异常</span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/80">{error}</p>
                    <Button variant="secondary" size="sm" onClick={handleComplete}>
                      跳过并继续
                    </Button>
                  </div>
                ) : (
                  <>
                    <motion.h1
                      id="welcome-title"
                      className="text-balance text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        ...transition,
                        delay: reducedMotion ? 0 : 0.1,
                      }}
                    >
                      欢迎来到，
                      <span className="text-gradient"> Project-M</span>
                    </motion.h1>

                    <motion.p
                      id="welcome-desc"
                      className="mt-5 max-w-md text-base leading-relaxed text-muted md:text-lg"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        ...transition,
                        delay: reducedMotion ? 0 : 0.18,
                      }}
                    >
                      {playerName ? `${playerName}，` : ""}
                      据点防线已部署完毕。进入 {modeName} 模式，与队友共同守卫核心据点。
                    </motion.p>

                    <motion.div
                      className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        ...transition,
                        delay: reducedMotion ? 0 : 0.26,
                      }}
                    >
                      <Button
                        size="lg"
                        rightIcon={<ArrowRight size={18} weight="bold" />}
                        onClick={handleComplete}
                        className="min-w-[10rem]"
                      >
                        进入指挥终端
                      </Button>
                      <button
                        type="button"
                        onClick={handleComplete}
                        className="text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
                      >
                        按任意键跳过
                      </button>
                    </motion.div>
                  </>
                )}

                <div className="mt-10 flex items-center gap-4 border-t border-border pt-6">
                  <div className="flex-1">
                    <div className="h-1 overflow-hidden rounded-full bg-border">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-accent"
                        style={{ width: progressWidth }}
                      />
                    </div>
                  </div>
                  <span className="text-xs tabular-nums text-muted">自动进入</span>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    服务器在线
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    匹配就绪
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Shield size={12} weight="bold" />
                    无付费加成
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
