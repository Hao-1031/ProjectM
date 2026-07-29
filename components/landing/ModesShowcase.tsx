"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Shield,
  Lightning,
  Brain,
  Trophy,
  CaretRight,
  ArrowRight,
} from "@phosphor-icons/react";
import GSAPScrollReveal from "@/components/effects/GSAPScrollReveal";

const SHOWCASE_MODES = [
  {
    id: "defense",
    title: "据点防守",
    tagline: "锚定维度核心",
    desc: "2-4人合作，分工明确。前线承伤、远程输出、治疗支援，Boss战需要精确配合。每一波都是对团队协作的考验。",
    icon: Shield,
    accent: "var(--success)",
    href: "/game?mode=defense&multiplayer=1",
  },
  {
    id: "extreme",
    title: "极限生存",
    tagline: "突破人类极限",
    desc: "满配开局，超频武器火力全开。面对5倍密度敌潮，只有最强者能撑过10分钟的维度风暴。",
    icon: Lightning,
    accent: "var(--danger)",
    href: "/game?mode=extreme-survival",
  },
  {
    id: "roguelike",
    title: "肉鸽构筑",
    tagline: "混沌中的秩序",
    desc: "诅咒与祝福双选，每次升级都是关键抉择。构建你的专属流派，探索无限可能的Build组合。",
    icon: Brain,
    accent: "var(--orbital)",
    href: "/game?mode=survival",
  },
];

export default function ModesShowcase() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 py-12 md:py-16">
      <GSAPScrollReveal direction="up">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              维度<span className="text-gradient">档案</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              深入了解每个维度的核心玩法、特色机制与策略深度。
            </p>
          </div>
          <Link
            href="/modes"
            className="hidden items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80 sm:inline-flex focus-ring rounded"
          >
            全部维度 <ArrowRight size={12} />
          </Link>
        </div>
      </GSAPScrollReveal>

      <div className="space-y-4">
        {SHOWCASE_MODES.map((mode, i) => {
          const Icon = mode.icon;
          const isEven = i % 2 === 0;
          return (
            <motion.div
              key={mode.id}
              initial={reducedMotion ? undefined : { opacity: 0, x: isEven ? -24 : 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={mode.href}
                className="group flex flex-col gap-4 rounded-2xl border border-border bg-panel/50 p-5 transition-all orbital-scan hover:border-primary/20 hover:bg-panel hover:shadow-lg hover:shadow-primary/5 focus-ring sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-4 sm:w-64 sm:shrink-0">
                  <span
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${mode.accent}10`, color: mode.accent }}
                  >
                    <Icon size={24} weight="bold" />
                  </span>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted">
                      {mode.tagline}
                    </p>
                    <h3 className="font-display text-lg font-bold tracking-tight">
                      {mode.title}
                    </h3>
                  </div>
                </div>
                <p className="flex-1 text-sm leading-relaxed text-muted">
                  {mode.desc}
                </p>
                <div className="flex shrink-0 items-center gap-2 text-xs font-semibold text-primary">
                  进入维度
                  <CaretRight size={14} weight="bold" className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}