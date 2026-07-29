"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Play, Anchor, Info, CaretRight } from "@phosphor-icons/react";
import BrandLogo from "@/components/BrandLogo";

export default function FooterCTA() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 py-12 md:py-20">
      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden bridge-panel holo-scan bridge-glow p-8 shadow-2xl shadow-black/30 md:p-14"
      >
        {/* Background effects */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-anchor/4 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.02]">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="footerGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--primary)" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#footerGrid)" />
          </svg>
        </div>

        <div className="relative flex flex-col items-center text-center">
          {/* Brand */}
          <BrandLogo size={40} variant="icon" className="text-primary" />

          {/* Eyebrow */}
          <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            <Anchor size={12} weight="bold" />
            绑定锚点
          </span>

          {/* Title */}
          <h2 className="mt-4 font-display text-2xl font-bold tracking-tight md:text-4xl">
            绑定你的<span className="text-gradient">维度锚点</span>
          </h2>

          {/* Description */}
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
            公平竞技，无付费加成。浏览器打开即玩，你的战绩与解锁进度将通过锚点同步至多元宇宙网络。
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/game?mode=defense&multiplayer=1"
              className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-8 text-sm font-bold text-background shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 focus-ring active:scale-[0.97]"
            >
              <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/12 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
              <Play size={20} weight="fill" />
              <span className="whitespace-nowrap">穿越维度</span>
              <CaretRight size={16} weight="bold" />
            </Link>
            <Link
              href="/about"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-border bg-panel/80 px-6 text-sm font-semibold backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-panel focus-ring active:scale-[0.97]"
            >
              <Info size={18} />
              <span className="whitespace-nowrap">了解更多</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border pt-5 text-xs text-muted sm:flex-row">
        <div className="flex items-center gap-2">
          <BrandLogo size={16} variant="icon" />
          <span>公平竞技 · 无付费加成 · 多重宇宙 · 梦想家</span>
        </div>
        <div className="flex gap-4">
          <Link href="/about" className="transition-colors hover:text-foreground focus-ring rounded">
            关于
          </Link>
          <Link href="/settings" className="transition-colors hover:text-foreground focus-ring rounded">
            设置
          </Link>
          <Link href="/help" className="transition-colors hover:text-foreground focus-ring rounded">
            指南
          </Link>
          <Link href="/leaderboard" className="transition-colors hover:text-foreground focus-ring rounded">
            排行榜
          </Link>
        </div>
      </footer>
    </section>
  );
}