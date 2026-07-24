import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import {
  Clock,
  Crosshair,
  Users,
  ShieldCheck,
  GameController,
  Lightning,
  CaretRight,
  Command,
  Pulse,
  ArrowsClockwise,
  Wrench,
  Trophy,
} from "@phosphor-icons/react";

const FEATURES = [
  {
    id: "rhythm",
    title: "α 动态节律",
    desc: "Sigmoid 难度曲线 + 实时击杀效率修正，Boss 波次自带呼吸节奏。",
    accent: "primary",
    icon: Pulse,
    size: "large",
  },
  {
    id: "behavior",
    title: "β 智能行为",
    desc: "流场寻路、群体行为、Boss 分层状态机、PVP Bot 战术 AI。",
    accent: "accent",
    icon: Crosshair,
    size: "medium",
  },
  {
    id: "coop",
    title: "据点合作",
    desc: "2-4 人守护能量核心，英雄技能配合决定胜负。",
    accent: "primary",
    icon: Users,
    size: "medium",
  },
  {
    id: "build",
    title: "流派构建",
    desc: "武器升级、被动叠加、天赋树，每局 build 都不相同。",
    accent: "accent",
    icon: Lightning,
    size: "small",
  },
  {
    id: "fair",
    title: "无付费加成",
    desc: "皮肤与便利道具可购，战力永远只靠操作与策略。",
    accent: "success",
    icon: ShieldCheck,
    size: "small",
  },
];

function SmartSortList() {
  const [items, setItems] = useState([
    { label: "击杀效率", value: 1.12 },
    { label: "承伤比率", value: 0.84 },
    { label: "资源收集", value: 0.97 },
    { label: "节点控制", value: 1.05 },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setItems((prev) => {
        const next = prev.map((i) => ({ ...i, value: Math.max(0.5, Math.min(1.5, i.value + (Math.random() - 0.5) * 0.1)) }));
        return [...next].sort((a, b) => b.value - a.value);
      });
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center justify-between rounded-lg bg-background/50 px-2 py-1 text-[11px]">
          <span className="flex items-center gap-1.5 text-foreground">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-panel-raised font-mono text-[9px] text-muted">
              {i + 1}
            </span>
            {item.label}
          </span>
          <span className={`font-mono font-bold ${item.value >= 1 ? "text-primary" : "text-muted"}`}>
            {item.value.toFixed(2)}x
          </span>
        </div>
      ))}
    </div>
  );
}

function CommandTyping() {
  const text = "/difficulty adapt";
  const [display, setDisplay] = useState("");
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplay(text.slice(0, i));
      i = (i + 1) % (text.length + 1);
    }, 140);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-lg border border-border bg-background/50 px-2 py-1 font-mono text-[11px]">
      <span className="text-primary">{display}</span>
      <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-primary" />
    </div>
  );
}

function BreathingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-primary-subtle">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        <Pulse size={14} weight="bold" className="relative text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-[11px] text-muted">
          <span>节律同步</span>
          <span>正常</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-border">
          <div className="h-full w-2/3 rounded-full bg-primary animate-pulseSlow" />
        </div>
      </div>
    </div>
  );
}

function DataCarousel() {
  const stats = [
    { label: "击杀", value: "12,847" },
    { label: "波次", value: "12/12" },
    { label: "难度", value: "0.97" },
    { label: "效率", value: "1.12x" },
  ];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % stats.length), 1600);
    return () => clearInterval(timer);
  }, [stats.length]);

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-2.5 py-1.5">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted">{stats[index].label}</p>
        <p className="font-mono text-base font-bold text-foreground">{stats[index].value}</p>
      </div>
      <ArrowsClockwise size={14} className="text-muted" />
    </div>
  );
}

function FloatingToolbar() {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background/80 p-1 backdrop-blur-sm">
      {[Command, Crosshair, Wrench, Trophy].map((Icon, i) => (
        <button
          key={i}
          type="button"
          className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-muted transition-colors hover:bg-panel-raised hover:text-foreground focus-ring"
        >
          <Icon size={12} weight="bold" />
        </button>
      ))}
    </div>
  );
}

function BentoCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[number];
  index: number;
}) {
  const reducedMotion = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const Icon = feature.icon;

  const accentClass =
    feature.accent === "primary"
      ? "text-primary bg-primary/10 border-primary/20"
      : feature.accent === "accent"
        ? "text-accent bg-accent/10 border-accent/20"
        : "text-success bg-success/10 border-success/20";

  const sizeClass =
    feature.size === "large"
      ? "md:col-span-2 md:row-span-2"
      : feature.size === "medium"
        ? "md:col-span-1 md:row-span-2"
        : "";

  return (
    <motion.div
      ref={ref}
      initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
      animate={isInView || reducedMotion ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-panel p-2.5 transition-all hover:border-primary/20 hover:bg-panel-raised ${sizeClass}`}
    >
      <div className="dot-grid absolute inset-0 opacity-30" />
      <div className="relative flex h-full flex-col">
        <div className={`inline-flex h-6 w-6 items-center justify-center rounded-lg border ${accentClass}`}>
          <Icon size={14} weight="bold" />
        </div>
        <h3 className="mt-1.5 text-sm font-bold tracking-tight">{feature.title}</h3>
        <p className="mt-0.5 flex-1 text-[11px] leading-relaxed text-muted">{feature.desc}</p>

        <div className="mt-1.5">
          {feature.id === "rhythm" && <SmartSortList />}
          {feature.id === "behavior" && <CommandTyping />}
          {feature.id === "coop" && <BreathingIndicator />}
          {feature.id === "build" && <DataCarousel />}
          {feature.id === "fair" && <FloatingToolbar />}
        </div>

        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          了解详情 <CaretRight size={12} />
        </div>
      </div>
    </motion.div>
  );
}

export default function FeatureBento() {
  const reducedMotion = useReducedMotion();
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });

  return (
    <section className="mx-auto max-w-7xl px-4 py-3 md:py-4">
      <motion.div
        ref={headerRef}
        initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
        animate={headerInView || reducedMotion ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-3 max-w-2xl md:mb-4"
      >
        <h2 className="text-lg font-bold tracking-tight md:text-xl">
          由算法驱动的
          <br />
          <span className="text-gradient">核心体验</span>
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          不是随机刷怪，不是固定数值。Project M 的每一波敌潮都是对你表现的实时回应。
        </p>
      </motion.div>

      <div className="grid grid-flow-dense grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature, i) => (
          <BentoCard key={feature.id} feature={feature} index={i} />
        ))}
      </div>
    </section>
  );
}
