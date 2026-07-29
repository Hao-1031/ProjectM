"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Shield,
  Users,
  Lightning,
  Heartbeat,
  Anchor,
} from "@phosphor-icons/react";
import GSAPScrollReveal from "@/components/effects/GSAPScrollReveal";

const RHYTHM_ITEMS = [
  {
    step: "01",
    title: "选择维度",
    desc: "从七大维度中选择你的战场，每个维度拥有独特的规则与环境。",
    icon: Shield,
    accent: "var(--primary)",
  },
  {
    step: "02",
    title: "组建小队",
    desc: "邀请好友或匹配队友，分工明确的团队是守住锚点的关键。",
    icon: Users,
    accent: "var(--orbital)",
  },
  {
    step: "03",
    title: "部署防御",
    desc: "在波次间隙部署防御工事、升级武器、选择诅咒与祝福。",
    icon: Anchor,
    accent: "var(--accent)",
  },
  {
    step: "04",
    title: "守住锚点",
    desc: "抵御敌潮，守护核心锚点。每一次成功防守都是一次维度锚定。",
    icon: Heartbeat,
    accent: "var(--success)",
  },
];

export default function RhythmSection() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative z-10 border-y border-border bg-panel/30">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <GSAPScrollReveal direction="up">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              维度穿越<span className="text-gradient">四步成局</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              从选择维度到守住锚点，四步完成一次完整的维度穿越体验。
            </p>
          </div>
        </GSAPScrollReveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RHYTHM_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-panel/60 p-5 transition-all orbital-scan hover:border-primary/20 hover:bg-panel hover:shadow-lg hover:shadow-primary/5"
              >
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-20"
                  style={{ backgroundColor: item.accent }}
                />
                <span
                  className="font-display text-3xl font-extrabold tracking-tight"
                  style={{ color: item.accent, opacity: 0.25 }}
                >
                  {item.step}
                </span>
                <span
                  className="mt-3 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${item.accent}10`, color: item.accent }}
                >
                  <Icon size={20} weight="bold" />
                </span>
                <h3 className="mt-3 font-display text-base font-bold tracking-tight">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}