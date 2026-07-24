import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Play, ArrowRight, WaveSine, Shield } from "@phosphor-icons/react";

const HERO_IMAGE =
  "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=A%20dark%20tactical%20command%20center%20interface%20glowing%20with%20cyan%20pulse%20waves%20and%20amber%20warning%20lights%2C%20holographic%20defense%20grid%20over%20a%20minimal%20black%20background%2C%20low%20saturation%20sci-fi%20military%20aesthetic%2C%20cinematic%20lighting%2C%20premium%20product%20photography&image_size=landscape_16_9";

export default function Hero() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-6 pt-4 md:pb-8 md:pt-6">
      <div className="grid items-center gap-6 lg:grid-cols-12 lg:gap-6">
        {/* Text block - asymmetric left-heavy */}
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="order-2 lg:order-1 lg:col-span-6 lg:pr-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
            <WaveSine size={12} weight="bold" />
            L3V100 创世版
          </div>

          <h1 className="mt-4 text-[clamp(2rem,6vw,4rem)] font-bold leading-[0.95] tracking-tight">
            每一次防守
            <br />
            <span className="text-gradient">都独一无二</span>
          </h1>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-300 md:text-base">
            α 动态节律算法与 β 智能行为 AI 深度联动，让每波敌潮都根据你的表现实时演化。
            没有两局相同的战斗。
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/game?mode=defense"
              className="group relative inline-flex h-11 items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-primary px-6 text-sm font-bold text-background shadow-lg shadow-primary/15 transition-all hover:bg-primary/90 hover:shadow-primary/25 focus-ring active:scale-[0.98]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Play size={20} weight="fill" />
              <span className="whitespace-nowrap">立即体验</span>
            </Link>
            <Link
              href="/about"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-panel px-5 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-panel-raised focus-ring active:scale-[0.98]"
            >
              <Shield size={18} weight="bold" />
              <span className="whitespace-nowrap">了解算法</span>
              <ArrowRight size={14} className="text-muted" />
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-2 w-2 rounded-full bg-success" />
              无付费加成
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
              浏览器即玩
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
              联机合作
            </span>
          </div>
        </motion.div>

        {/* Image block - breaks grid on right */}
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="order-1 lg:order-2 lg:col-span-6 lg:col-start-7"
        >
          <div className="relative">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-accent/10 blur-2xl" />
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-border bg-panel shadow-2xl shadow-black/30">
              <img
                src={HERO_IMAGE}
                alt="Project M 动态节律指挥界面"
                className="h-full w-full object-cover"
                loading="eager"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-border/60 bg-background/80 p-3 backdrop-blur-md">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">节律强度</span>
                  <span className="font-mono text-primary">87.4%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
                  <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-primary to-accent" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
