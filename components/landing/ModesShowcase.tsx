import { useRef } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import {
  Shield,
  Skull,
  Crosshair,
  Calendar,
  Lightning,
  Users,
  Clock,
  Target,
  CaretRight,
} from "@phosphor-icons/react";

const MODES = [
  {
    id: "defense",
    title: "据点防守",
    desc: "2-4 人守护能量核心，波次越往后敌人越狡猾。α 节律会读取团队表现，实时生成压迫感。",
    icon: Shield,
    accent: "primary",
    size: "large",
    tags: ["合作", "PVE", "核心守卫"],
    image:
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Dark%20tactical%20stronghold%20defense%20scene%2C%20massive%20enemy%20horde%20approaching%20a%20glowing%20energy%20core%2C%20wasteland%20military%20style%2C%20muted%20teal%20and%20amber%20lights%2C%20deep%20charcoal%20background%2C%20low%20saturation%2C%20cinematic%20atmosphere%2C%20no%20text&image_size=landscape_16_9",
    meta: [
      { Icon: Users, label: "1-4 人" },
      { Icon: Clock, label: "12 波" },
    ],
  },
  {
    id: "survival",
    title: "极限生存",
    desc: "15 分钟限时高压。击杀效率决定敌潮强度，节奏越快，奖励越丰厚。",
    icon: Skull,
    accent: "accent",
    size: "large",
    tags: ["单人", "限时", "排行榜"],
    meta: [
      { Icon: Clock, label: "15 分钟" },
      { Icon: Target, label: "全球榜" },
    ],
  },
  {
    id: "deathmatch",
    title: "个人死斗",
    desc: "PVP 或 PVP Bot，β AI 会模仿真人走位与集火。",
    icon: Crosshair,
    accent: "danger",
    size: "small",
    tags: ["PVP", "Bot"],
  },
  {
    id: "daily",
    title: "每日挑战",
    desc: "同一套随机种子，公平竞技，凭实力上榜。",
    icon: Calendar,
    accent: "success",
    size: "small",
    tags: ["每日", "固定种子"],
  },
  {
    id: "roguelike",
    title: "肉鸽构建",
    desc: "武器升级、被动叠加、天赋树，每局 build 都不相同。",
    icon: Lightning,
    accent: "warning",
    size: "small",
    tags: ["Build", "随机奖励"],
  },
];

const BUILD_HIGHLIGHTS = [
  "自动攻击 + 走位",
  "武器分支升级",
  "被动叠加",
  "英雄天赋",
];

function ModeCard({
  mode,
  index,
}: {
  mode: (typeof MODES)[number];
  index: number;
}) {
  const reducedMotion = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const Icon = mode.icon;
  const isLarge = mode.size === "large";

  const accentClass =
    mode.accent === "primary"
      ? "text-primary bg-primary/10 border-primary/20"
      : mode.accent === "accent"
        ? "text-accent bg-accent/10 border-accent/20"
        : mode.accent === "danger"
          ? "text-danger bg-danger/10 border-danger/20"
          : mode.accent === "success"
            ? "text-success bg-success/10 border-success/20"
            : "text-warning bg-warning/10 border-warning/20";

  const sizeClass = isLarge
    ? "md:col-span-2 md:row-span-2 min-h-[200px] md:min-h-[260px]"
    : "md:col-span-1 md:row-span-1";

  return (
    <motion.div
      ref={ref}
      initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
      animate={isInView || reducedMotion ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-panel transition-all hover:border-primary/20 hover:bg-panel-raised ${sizeClass}`}
    >
      {mode.image && (
        <>
          <img
            src={mode.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/80 to-panel/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-panel/60 via-transparent to-transparent" />
        </>
      )}

      <div className="relative flex h-full flex-col p-3 md:p-4">
        <div
          className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border ${accentClass}`}
        >
          <Icon size={16} weight="bold" />
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {mode.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-background/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted backdrop-blur-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        <h3 className="mt-2 text-sm font-bold tracking-tight md:text-base">
          {mode.title}
        </h3>
        <p className="mt-1 flex-1 text-xs leading-relaxed text-muted">
          {mode.desc}
        </p>

        {mode.meta && (
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted">
            {mode.meta.map((m) => (
              <span key={m.label} className="flex items-center gap-1">
                <m.Icon size={12} />
                {m.label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          进入模式 <CaretRight size={12} />
        </div>
      </div>
    </motion.div>
  );
}

function BuildCard({ index }: { index: number }) {
  const reducedMotion = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
      animate={isInView || reducedMotion ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-panel p-3 transition-all hover:border-primary/20 hover:bg-panel-raised md:col-span-2"
    >
      <div className="dot-grid absolute inset-0 opacity-20" />
      <div className="relative flex h-full flex-col md:flex-row md:items-center md:gap-5">
        <div className="flex-1">
          <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-warning/20 bg-warning/10 text-warning">
            <Lightning size={16} weight="bold" />
          </div>
          <h3 className="mt-2 text-sm font-bold tracking-tight">流派构建</h3>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
            每局通过升级与奖励搭建独特 build。没有固定最优解，只有更适合当前节奏的打法。
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {BUILD_HIGHLIGHTS.map((h) => (
              <span
                key={h}
                className="rounded-lg border border-border bg-background/50 px-2 py-1 text-[11px] text-muted"
              >
                {h}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-3 flex-1 md:mt-0">
          <div className="space-y-1.5 rounded-2xl border border-border bg-background/50 p-2.5">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>武器分支</span>
              <span className="font-mono text-foreground">Lv.7</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div className="h-full w-3/4 rounded-full bg-primary" />
            </div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>被动叠加</span>
              <span className="font-mono text-foreground">9</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div className="h-full w-2/3 rounded-full bg-accent" />
            </div>
            <div className="flex items-center justify-between text-xs text-muted">
              <span>天赋选择</span>
              <span className="font-mono text-foreground">3 / 5</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div className="h-full w-1/2 rounded-full bg-warning" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ModesShowcase() {
  const reducedMotion = useReducedMotion();
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });

  return (
    <section className="mx-auto max-w-7xl px-4 py-4 md:py-6">
      <motion.div
        ref={headerRef}
        initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
        animate={headerInView || reducedMotion ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-3 max-w-2xl md:mb-4"
      >
        <h2 className="text-xl font-bold tracking-tight md:text-2xl">
          据点、生存、死斗
          <br />
          <span className="text-gradient">每种节奏都不相同</span>
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          从合作防守到个人竞技，每个模式都有独立的节律曲线与 AI 策略。
        </p>
      </motion.div>

      <div className="grid grid-flow-dense grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {MODES.map((mode, i) => (
          <ModeCard key={mode.id} mode={mode} index={i} />
        ))}
        <BuildCard index={MODES.length} />
      </div>
    </section>
  );
}
