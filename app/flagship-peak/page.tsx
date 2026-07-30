"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Rocket,
  Shield,
  Skull,
  Trophy,
  Lightning,
  Crown,
  Star,
  ArrowRight,
  Warning,
  Gauge,
  Fire,
  Hexagon,
  Pulse,
  Target,
  Sparkle,
  Circle,
  EyeSlash,
  Wrench,
  TreeStructure,
  Users,
  Sword,
  Atom,
  Planet,
  Broadcast,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import DimensionBackground from "@/components/effects/DimensionBackground";

const PHASES = [
  {
    phase: "standard",
    title: "标准巡航",
    wave: "1-10 波",
    icon: Shield,
    accent: "text-primary",
    accentHex: "var(--primary)",
    accentBg: "bg-primary/10",
    borderGlow: "hover:border-primary/30",
    glowColor: "rgba(11, 29, 58, 0.08)",
    desc: "深空蓝基调，熟悉节奏。敌人稳步增强，占点激活补给，为后续阶段积累资源。",
    features: ["基础敌潮强度", "能量节点占点", "每3波特殊事件", "第10波首领战"],
  },
  {
    phase: "overclock",
    title: "超频增压",
    wave: "11-20 波",
    icon: Fire,
    accent: "text-caution",
    accentHex: "var(--caution)",
    accentBg: "bg-caution/10",
    borderGlow: "hover:border-caution/30",
    glowColor: "rgba(196, 122, 106, 0.08)",
    desc: "珊瑚预警！敌潮密度x1.5，精英怪大规模出现。动态任务激活，挑战极限。",
    features: ["1.5倍敌潮密度", "精英怪大规模侵入", "超频阶段动态任务", "第23波首领战"],
  },
  {
    phase: "hell",
    title: "地狱终局",
    wave: "21-25 波",
    icon: Skull,
    accent: "text-orbital",
    accentHex: "var(--orbital)",
    accentBg: "bg-orbital/10",
    borderGlow: "hover:border-orbital/30",
    glowColor: "rgba(59, 125, 216, 0.08)",
    desc: "轨道蓝警报。2倍难度，虚空粒子密度1.5倍，屏幕震动0.7。第25波恐惧级首领战。",
    features: ["2倍敌潮难度", "虚空粒子密度1.5倍", "屏幕震动0.7", "第25波恐惧级首领"],
  },
  {
    phase: "abyss",
    title: "深渊",
    wave: "26-35 波",
    icon: EyeSlash,
    accent: "text-void",
    accentHex: "var(--void)",
    accentBg: "bg-void/10",
    borderGlow: "hover:border-void/30",
    glowColor: "rgba(11, 29, 58, 0.12)",
    desc: "墨黑深渊吞噬一切。3倍难度，地图视野缩小40%，敌潮密度x2。第35波深渊吞噬者首领战。",
    features: ["3倍敌潮难度", "视野缩小40%", "敌潮密度x2", "第35波深渊首领"],
  },
  {
    phase: "void",
    title: "虚空",
    wave: "36-45 波",
    icon: Circle,
    accent: "text-secondary",
    accentHex: "var(--secondary)",
    accentBg: "bg-secondary/10",
    borderGlow: "hover:border-secondary/30",
    glowColor: "rgba(74, 107, 138, 0.12)",
    desc: "钢蓝虚空湮灭一切。4倍难度，重力反转机制，时间流速不稳定。第45波虚空湮灭者首领战。",
    features: ["4倍敌潮难度", "重力反转机制", "时间流速不稳定", "第45波虚空首领"],
  },
  {
    phase: "genesis",
    title: "创世",
    wave: "46-50 波",
    icon: Sparkle,
    accent: "text-accent",
    accentHex: "var(--accent)",
    accentBg: "bg-accent/10",
    borderGlow: "hover:border-accent/30",
    glowColor: "rgba(200, 164, 92, 0.15)",
    desc: "航天金终结之战。5倍难度，全机制融合，终极觉醒技能解锁。第50波创世泰坦首领战。",
    features: ["5倍敌潮难度", "全机制融合", "创世觉醒技能", "第50波创世泰坦"],
  },
];

const DUAL_SYSTEM = [
  {
    title: "固定挑战",
    desc: "每5波刷新6个挑战：旗舰火力、精英清扫、核心护卫、连击大师、极速通关、完美防线。全部完成方可刷新下一轮。",
    icon: Target,
  },
  {
    title: "动态任务",
    desc: "超频/地狱阶段专属任务。超频极限、首领猎杀、地狱行者、终极猎杀、虚空不屈。阶段越高，奖励越丰厚。",
    icon: Lightning,
  },
];

const RATINGS = [
  {
    dimension: "speed",
    title: "速度评级",
    icon: Gauge,
    ranks: ["未评级", "青铜", "白银", "黄金", "铂金", "钻石"],
    desc: "基于时间攻击分数计算，通关越快评级越高，最终结算积分倍率1.0-1.75倍。",
  },
  {
    dimension: "season",
    title: "赛季段位",
    icon: Crown,
    ranks: ["青铜", "白银", "黄金", "铂金", "钻石", "大师", "宗师"],
    desc: "累积赛季经验升级，不受单局结算影响。赛季经验通过击杀、波次、首领击杀获取。",
  },
];

const SCORE_FORMULA = [
  { label: "击杀", value: "10 + 连击数" },
  { label: "精英击杀", value: "+50" },
  { label: "首领击杀", value: "+200" },
  { label: "波次清除", value: "+50" },
  { label: "完美波次", value: "+200" },
  { label: "时间奖励", value: "max(0, (60-通关时间)×2)" },
  { label: "连击倍数", value: "maxCombo × 20" },
  { label: "速度评级倍率", value: "1.0 - 1.75" },
];

const HERO_IMAGE =
  "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20bright%20clean%20space%20station%20flagship%20bridge%2C%20off-white%20aesthetic%2C%20deep%20blue%20accents%2C%20gold%20trim%20details%2C%20massive%20holographic%20tactical%20displays%2C%20chinese%20space%20station%20interior%20design%2C%20minimalist%20scifi%2C%20bright%20lighting%2C%20clean%20lines%2C%20no%20text%20no%20labels&image_size=landscape_16_9";

function HeroParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      duration: 3 + Math.random() * 5,
      delay: Math.random() * 3,
      opacity: 0.08 + Math.random() * 0.2,
    })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/40"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            y: ["-5%", "105%"],
            opacity: [p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

export default function FlagshipPeakPage() {
  const reducedMotion = useReducedMotion();

  return (
    <Layout title="旗舰巅峰">
      <div className="relative min-h-[100dvh]">
        <DimensionBackground intensity="high" />
        <div className="noise-overlay" />
        <div className="pointer-events-none fixed inset-0 z-0 starfield opacity-30" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-3 md:py-4">
          {/* Hero */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative mb-3 md:mb-4"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Broadcast size={12} weight="fill" className="status-pulse" />
              旗舰舰桥 · 旗舰巅峰 MAX
            </span>
            <h1 className="mt-3 text-[clamp(2rem,5vw,3.5rem)] font-display font-bold leading-[0.95] tracking-tight">
              六阶段
              <br />
              <span className="text-gradient">50波终极挑战</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              标准巡航(1-10) - 超频增压(11-20) - 地狱终局(21-25) - 深渊(26-35) - 虚空(36-45) - 创世(46-50)。Boss变异系统 + 英雄技能树 + 武器改装锻造 + 2人联机协作，多重宇宙终局防守体验。
            </p>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative mb-4"
          >
            <div className="station-panel orbital-scan station-glow relative overflow-hidden">
              <HeroParticles />
              <img
                src={HERO_IMAGE}
                alt="旗舰舰桥"
                className="h-[200px] w-full object-cover md:h-[320px]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-panel via-panel/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2">
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary-subtle px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-primary backdrop-blur-sm"
                >
                  <Shield size={10} />
                  50 波
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 }}
                  className="inline-flex items-center gap-1 rounded-full border border-caution/30 bg-caution/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-caution backdrop-blur-sm"
                >
                  <Fire size={10} />
                  六阶段
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4 }}
                  className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-subtle px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-accent backdrop-blur-sm"
                >
                  <Sparkle size={10} />
                  创世终局
                </motion.span>
              </div>
            </div>
          </motion.div>

          {/* Six Phases */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <h2 className="mb-3 font-display text-lg font-bold tracking-tight">
              六阶段递进
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              {PHASES.map((phase, i) => {
                const Pi = phase.icon;
                return (
                  <motion.div
                    key={phase.phase}
                    initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={`station-panel orbital-scan group relative p-4 transition-all duration-300 ${phase.borderGlow}`}
                    style={{
                      boxShadow: `0 0 40px ${phase.glowColor}`,
                    }}
                  >
                    <div
                      className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{ backgroundColor: phase.glowColor }}
                    />
                    <div className="flex items-start justify-between">
                      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${phase.accentBg} ${phase.accent}`}>
                        <Pi size={22} weight="bold" />
                      </div>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
                        {phase.wave}
                      </span>
                    </div>
                    <h3 className={`mt-3 text-sm font-bold tracking-tight ${phase.accent}`}>
                      {phase.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">
                      {phase.desc}
                    </p>
                    <ul className="mt-3 space-y-1">
                      {phase.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-[11px] text-muted">
                          <span className={`mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-current ${phase.accent}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Dual Challenge System */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <h2 className="mb-3 font-display text-lg font-bold tracking-tight">
              双轨挑战系统
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {DUAL_SYSTEM.map((item, i) => {
                const Di = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="station-panel orbital-scan group p-4 transition-all duration-300 hover:border-primary/20 station-glow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary">
                        <Di size={18} weight="bold" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold tracking-tight">{item.title}</h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted">{item.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Dual Ratings */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <h2 className="mb-3 font-display text-lg font-bold tracking-tight">
              双维度评级
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {RATINGS.map((rating, i) => {
                const Ri = rating.icon;
                return (
                  <motion.div
                    key={rating.dimension}
                    initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="station-panel orbital-scan group p-4 transition-all duration-300 hover:border-primary/20 station-glow"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                        <Ri size={16} weight="bold" />
                      </div>
                      <h3 className="text-sm font-bold tracking-tight">{rating.title}</h3>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-1">
                      {rating.ranks.map((rank, j) => {
                        const isMax = j === rating.ranks.length - 1;
                        return (
                          <span
                            key={rank}
                            className="inline-flex items-center rounded-full border border-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-all"
                            style={{
                              opacity: 0.5 + j * 0.1,
                              color: isMax ? "var(--primary)" : undefined,
                              borderColor: isMax ? "var(--primary)40" : undefined,
                              backgroundColor: isMax ? "var(--primary)08" : undefined,
                            }}
                          >
                            {isMax && <Star size={8} weight="fill" className="mr-1" />}
                            {rank}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-xs leading-relaxed text-muted">{rating.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Score Formula */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <div className="station-panel orbital-scan station-glow p-4">
              <div className="flex items-center gap-2 mb-3">
                <Hexagon size={18} weight="fill" className="text-primary" />
                <h2 className="font-display text-lg font-bold tracking-tight">统一积分制</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SCORE_FORMULA.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="group rounded-xl border border-primary/10 bg-panel/60 p-3 transition-all hover:border-primary/20 hover:bg-panel"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">{item.label}</p>
                    <p className="mt-1 font-mono text-sm font-bold tabular-nums text-primary">{item.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative station-panel orbital-scan station-glow overflow-hidden p-4"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-orbital/5 blur-3xl" />
            <div className="relative grid gap-4 lg:grid-cols-2">
              <div>
                <h2 className="text-lg font-display font-bold tracking-tight">准备就绪，舰长</h2>
                <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">
                  选择难度预设，进入旗舰巅峰。标准巡航积累资源，超频增压突破极限，深渊虚空创世征服终极首领。
                </p>
              </div>
              <div className="flex flex-col justify-center gap-2 sm:flex-row lg:justify-end">
                <Link
                  href="/game?mode=flagship-peak"
                  className="group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-6 text-sm font-bold text-background shadow-lg shadow-primary/10 transition-all hover:bg-primary/90 focus-ring active:scale-95"
                >
                  <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
                  <Rocket size={18} weight="fill" />
                  <span className="whitespace-nowrap">进入旗舰巅峰</span>
                </Link>
                <Link
                  href="/leaderboard?mode=flagship-peak"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-primary/10 bg-panel/60 px-5 text-sm font-semibold transition-all hover:border-primary/30 hover:bg-panel focus-ring active:scale-95"
                >
                  <Trophy size={16} />
                  查看排行榜
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}