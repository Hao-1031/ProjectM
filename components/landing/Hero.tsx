"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  Play,
  CaretRight,
  Globe,
  Crosshair,
} from "@phosphor-icons/react";
import BrandLogo from "@/components/BrandLogo";

export default function Hero() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100dvh] items-center overflow-hidden"
    >
      {/* Parallax background */}
      <motion.div
        style={{ y: reducedMotion ? 0 : y, opacity: reducedMotion ? 1 : opacity }}
        className="absolute inset-0"
      >
        <div className="absolute -right-[15%] top-[10%] h-[80vh] w-[80vh] rounded-full bg-primary/5 blur-[150px]" />
        <div className="absolute -bottom-[10%] -left-[10%] h-[60vh] w-[60vh] rounded-full bg-anchor/4 blur-[120px]" />
        <div className="absolute left-[40%] top-[30%] h-[40vh] w-[40vh] rounded-full bg-quantum/4 blur-[100px]" />

        {/* Dimension grid */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="heroGrid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="var(--primary)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#heroGrid)" />
          </svg>
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left: Brand + Title */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            {/* Brand mark */}
            <div className="mb-6">
              <BrandLogo size={48} variant="icon" animated className="text-primary" />
            </div>

            {/* Eyebrow */}
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Globe size={12} weight="bold" />
              梦想家
            </span>

            {/* Title */}
            <h1 className="mt-6 font-display text-[clamp(2.5rem,7vw,5rem)] font-extrabold leading-[0.9] tracking-tight">
              多元宇宙
              <br />
              <span className="text-gradient">在此交汇</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted">
              维度交汇·守住锚点。旗舰版多模式融合：据点防守、极限生存、肉鸽构筑与赛季挑战。
              动态天气系统与诅咒祝福双选，每一局都是独一无二的维度穿越。
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
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
                <Crosshair size={18} />
                <span className="whitespace-nowrap">了解旗舰版</span>
              </Link>
            </div>

            {/* Quick stats */}
            <div className="mt-10 flex gap-6">
              {[
                { value: "7", label: "维度" },
                { value: "8", label: "英雄" },
                { value: "12", label: "武器" },
                { value: "∞", label: "构筑" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-2xl font-bold tracking-tight text-primary">
                    {stat.value}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Dimension visual */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <div className="relative">
              {/* Outer ring */}
              <div className="absolute inset-0 animate-anchor-rotate opacity-20">
                <svg viewBox="0 0 400 400" className="h-full w-full">
                  <circle
                    cx="200"
                    cy="200"
                    r="180"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="0.5"
                    strokeDasharray="4 8"
                  />
                  <circle
                    cx="200"
                    cy="200"
                    r="140"
                    fill="none"
                    stroke="var(--anchor)"
                    strokeWidth="0.5"
                    strokeDasharray="2 6"
                  />
                </svg>
              </div>

              {/* Center anchor */}
              <div className="flex aspect-square items-center justify-center">
                <div className="relative">
                  <div className="quantum-glow rounded-full p-8">
                    <BrandLogo size={120} variant="icon" className="text-primary" />
                  </div>
                  {/* Rift particles */}
                  <div className="absolute -inset-8 animate-quantum-pulse rounded-full" />
                </div>
              </div>

              {/* Dimension labels */}
              {[
                { label: "据点防守", angle: 0, x: "50%", y: "0%" },
                { label: "极限生存", angle: 120, x: "90%", y: "30%" },
                { label: "肉鸽构筑", angle: 240, x: "10%", y: "30%" },
              ].map((dim) => (
                <div
                  key={dim.label}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: dim.x, top: dim.y }}
                >
                  <Link
                    href={`/game?mode=${dim.label === "据点防守" ? "defense" : dim.label === "极限生存" ? "extreme-survival" : "survival"}`}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/80 px-3 py-1.5 text-[11px] font-semibold text-primary backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {dim.label}
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}