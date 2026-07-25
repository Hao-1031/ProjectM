import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Crosshair, Warning, ArrowRight } from "@phosphor-icons/react";

export default function LoginPage() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      <div className="noise-overlay" />
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-30" />

      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-2xl border border-border bg-panel p-6 shadow-2xl shadow-black/20 md:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-warning via-primary to-accent opacity-60" />

          <div className="mb-6 flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <Warning size={20} weight="bold" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">登录入口临时关闭</h1>
              <p className="mt-1 text-xs text-muted">
                注册、登录与第三方授权功能正在进行升级，恢复时间请关注公告。
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background/50 p-4 text-sm leading-relaxed text-foreground/90">
            <p>
              当前版本为 L3V100「创世版」公开演示阶段，所有游戏模式与算法页面均可直接访问，无需登录。
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/algorithms"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-background transition-all hover:bg-primary/90 focus-ring active:scale-[0.98]"
            >
              浏览公开算法
              <ArrowRight size={16} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-panel px-5 text-sm font-semibold transition-all hover:bg-panel-raised focus-ring active:scale-[0.98]"
            >
              返回指挥终端
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
            <Crosshair size={14} weight="bold" className="text-primary" />
            <span>Project M · 公平竞技 · 无付费加成</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
