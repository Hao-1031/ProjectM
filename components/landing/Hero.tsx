"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  Play,
  CaretRight,
  Crosshair,
  Planet,
  Rocket,
  Star,
} from "@phosphor-icons/react";
import BrandLogo from "@/components/BrandLogo";
import { BRAND_TAGLINE } from "@/lib/version";

export default function Hero() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100dvh] items-center overflow-hidden"
    >
      {/* Parallax background layer */}
      <motion.div
        style={{ y: reducedMotion ? 0 : y, opacity: reducedMotion ? 1 : opacity }}
        className="absolute inset-0"
      >
        {/* Deep space blue glow — top right */}
        <div className="absolute -right-[10%] top-[5%] h-[70vh] w-[70vh] rounded-full bg-primary/[0.04] blur-[140px]" />
        {/* Astro gold glow — bottom left */}
        <div className="absolute -bottom-[8%] -left-[8%] h-[55vh] w-[55vh] rounded-full bg-accent/[0.05] blur-[110px]" />
        {/* Orbital blue — center */}
        <div className="absolute left-[35%] top-[25%] h-[40vh] w-[40vh] rounded-full bg-orbital/[0.04] blur-[100px]" />

        {/* Station grid overlay */}
        <div className="absolute inset-0 station-grid opacity-[0.06]" />

        {/* Orbital path lines */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.04]" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <ellipse cx="600" cy="400" rx="500" ry="300" fill="none" stroke="var(--primary)" strokeWidth="0.5" strokeDasharray="1 12" />
          <ellipse cx="600" cy="400" rx="380" ry="230" fill="none" stroke="var(--orbital)" strokeWidth="0.5" strokeDasharray="2 8" />
          <ellipse cx="600" cy="400" rx="260" ry="160" fill="none" stroke="var(--accent)" strokeWidth="0.3" strokeDasharray="1 10" />
        </svg>
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
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/12 bg-primary/4 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Planet size={12} weight="bold" />
              深空门户站
            </span>

            {/* Title */}
            <h1 className="mt-6 font-display text-[clamp(2.5rem,7vw,5rem)] font-extrabold leading-[0.9] tracking-tight">
              多元宇宙
              <br />
              <span className="text-gradient">在此交汇</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted">
              旗舰版多模式融合：据点防守、极限生存、旗舰巅峰与赛季挑战。
              动态维度天气与诅咒祝福双选，每一局都是独一无二的深空穿越。
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/game?mode=defense&multiplayer=1"
                className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-8 text-sm font-bold text-background shadow-lg shadow-primary/12 transition-all hover:bg-primary/90 hover:shadow-primary/20 focus-ring active:scale-[0.97]"
              >
                <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
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
            <div className="mt-10 flex gap-8">
              {[
                { value: "7", label: "维度", icon: Planet },
                { value: "8", label: "英雄", icon: Star },
                { value: "12", label: "武器", icon: Crosshair },
                { value: "∞", label: "构筑", icon: Rocket },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center gap-2">
                    <Icon size={14} weight="bold" className="text-primary/40" />
                    <div>
                      <p className="font-display text-2xl font-bold tracking-tight text-primary">
                        {stat.value}
                      </p>
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Right: Orbital visual */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <div className="relative">
              {/* Outer orbital rings */}
              <motion.div
                className="absolute inset-0 opacity-25"
                animate={reducedMotion ? {} : { rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              >
                <svg viewBox="0 0 400 400" className="h-full w-full">
                  <circle cx="200" cy="200" r="175" fill="none" stroke="var(--primary)" strokeWidth="0.4" strokeDasharray="3 10" />
                  <circle cx="200" cy="200" r="135" fill="none" stroke="var(--orbital)" strokeWidth="0.4" strokeDasharray="2 8" />
                  <circle cx="200" cy="200" r="95" fill="none" stroke="var(--accent)" strokeWidth="0.3" strokeDasharray="1 6" />
                </svg>
              </motion.div>

              {/* Center anchor */}
              <div className="flex aspect-square items-center justify-center">
                <div className="relative">
                  <div className="station-glow rounded-full p-8">
                    <BrandLogo size={120} variant="icon" className="text-primary" />
                  </div>
                  <div className="absolute -inset-8 rounded-full animate-station-pulse" />
                </div>
              </div>

              {/* Orbital dimension labels */}
              {[
                { label: "据点防守", angle: 0, x: "50%", y: "0%" },
                { label: "极限生存", angle: 120, x: "92%", y: "28%" },
                { label: "旗舰巅峰", angle: 240, x: "8%", y: "28%" },
              ].map((dim) => (
                <div
                  key={dim.label}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: dim.x, top: dim.y }}
                >
                  <Link
                    href={`/game?mode=${dim.label === "据点防守" ? "defense" : dim.label === "极限生存" ? "extreme-survival" : "flagship-peak"}`}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1.5 text-[11px] font-semibold text-primary backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-primary-subtle"
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