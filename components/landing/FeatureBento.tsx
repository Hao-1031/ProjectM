"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Shield,
  Lightning,
  Skull,
  Trophy,
  Sword,
  Target,
  Sparkle,
  CaretRight,
  Planet,
  Atom,
  Brain,
  Cloud,
  Heartbeat,
  Anchor,
} from "@phosphor-icons/react";
import GSAPScrollReveal from "@/components/effects/GSAPScrollReveal";

const DIMENSIONS = [
  {
    id: "defense",
    title: "据点防守",
    subtitle: "锚点维度",
    desc: "2-4人合作守卫核心锚点。分工明确的团队协作，每波敌人强度递增，Boss战需要精确配合。",
    icon: Shield,
    accent: "success",
    size: "lg:col-span-4 lg:row-span-2",
    href: "/game?mode=defense&multiplayer=1",
    featured: true,
  },
  {
    id: "extreme",
    title: "极限生存",
    subtitle: "压力维度",
    desc: "满配超频，火力全开。面对5倍密度敌潮，每一秒都是生存考验。",
    icon: Lightning,
    accent: "danger",
    size: "lg:col-span-2",
    href: "/game?mode=extreme-survival",
    featured: true,
  },
  {
    id: "roguelike",
    title: "肉鸽构筑",
    subtitle: "混沌维度",
    desc: "诅咒与祝福双选，每次升级都是关键抉择。",
    icon: Brain,
    accent: "orbital",
    size: "lg:col-span-2",
    href: "/game?mode=survival",
    featured: false,
  },
  {
    id: "peak",
    title: "巅峰挑战",
    subtitle: "竞技维度",
    desc: "全球排行榜竞速，与所有维度行者一较高下。",
    icon: Trophy,
    accent: "accent",
    size: "lg:col-span-2",
    href: "/game?mode=peak-challenge",
    featured: false,
  },
  {
    id: "campaign",
    title: "战役模式",
    subtitle: "叙事维度",
    desc: "连续任务推进，解锁维度档案。",
    icon: Target,
    accent: "secondary",
    size: "lg:col-span-2",
    href: "/game?mode=campaign",
    featured: false,
  },
  {
    id: "deathmatch",
    title: "个人死斗",
    subtitle: "冲突维度",
    desc: "PvP竞技对抗，维度行者之间的较量。",
    icon: Sword,
    accent: "caution",
    size: "lg:col-span-2",
    href: "/game?mode=deathmatch",
    featured: false,
  },
  {
    id: "weather",
    title: "动态天气",
    subtitle: "环境维度",
    desc: "辐射风暴、酸雨、沙尘暴实时影响战场。",
    icon: Cloud,
    accent: "secondary",
    size: "lg:col-span-2",
    href: "/about",
    featured: false,
  },
  {
    id: "anchor",
    title: "锚点科技",
    subtitle: "升级维度",
    desc: "跨局永久升级，维度科技树解锁新能力。",
    icon: Anchor,
    accent: "primary",
    size: "lg:col-span-2",
    href: "/base",
    featured: false,
  },
];

export default function FeatureBento() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 py-12 md:py-16">
      <GSAPScrollReveal direction="up">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Planet size={12} weight="bold" />
              维度网络
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold tracking-tight md:text-3xl">
            七大维度，<span className="text-gradient">无限可能</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            每个维度拥有独特的规则、敌人和奖励。选择你的维度，穿越锚点，开始战斗。
          </p>
        </div>
      </GSAPScrollReveal>

      <div className="grid grid-flow-dense grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {DIMENSIONS.map((dim, i) => {
          const Icon = dim.icon;
          return (
            <motion.div
              key={dim.id}
              initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={dim.size}
            >
              <Link
                href={dim.href}
                className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border bg-panel/60 p-5 transition-all orbital-scan hover:border-primary/30 hover:bg-panel hover:shadow-lg hover:shadow-primary/5 focus-ring ${
                  dim.featured ? "border-primary/15 station-glow" : "border-border"
                }`}
              >
                {/* Accent glow */}
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-25"
                  style={{ backgroundColor: `var(--${dim.accent})` }}
                />

                {/* Featured badge */}
                {dim.featured && (
                  <div className="pointer-events-none absolute inset-0 opacity-[0.01] bg-[radial-gradient(circle_at_70%_30%,rgba(11,29,58,0.5),transparent_70%)]" />
                )}

                <div className="relative">
                  <div className="flex items-start justify-between">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: `var(--${dim.accent})10`,
                        color: `var(--${dim.accent})`,
                      }}
                    >
                      <Icon size={20} weight="bold" />
                    </span>
                    {dim.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        <Sparkle size={10} weight="fill" />
                        主打
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted">
                      {dim.subtitle}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold tracking-tight">
                      {dim.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">{dim.desc}</p>
                  </div>
                </div>

                <div className="relative mt-4 flex items-center gap-2 text-xs text-muted">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-panel-raised">
                    <CaretRight
                      size={10}
                      weight="bold"
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                  <span className="opacity-0 transition-opacity group-hover:opacity-100">
                    穿越维度
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}