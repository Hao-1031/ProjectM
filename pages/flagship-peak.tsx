import Head from "next/head";
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
    accentHex: "#6366f1",
    accentBg: "bg-primary/10",
    borderGlow: "hover:border-primary/30",
    glowColor: "rgba(99, 102, 241, 0.15)",
    desc: "舰桥蓝紫色调，熟悉节奏。敌人稳步增强，占点激活补给，为后续阶段积累资源。",
    features: ["基础敌潮强度", "能量节点占点", "每3波特殊事件", "第10波首领战"],
  },
  {
    phase: "overclock",
    title: "超频增压",
    wave: "11-20 波",
    icon: Fire,
    accent: "text-danger",
    accentHex: "#ef4444",
    accentBg: "bg-danger/10",
    borderGlow: "hover:border-danger/30",
    glowColor: "rgba(239, 68, 68, 0.15)",
    desc: "红色警报！敌潮密度×1.5，精英怪大规模出现。动态任务激活，挑战你的极限。",
    features: ["1.5倍敌潮密度", "精英怪大规模侵入", "超频阶段动态任务", "第23波首领战"],
  },
  {
    phase: "hell",
    title: "地狱终局",
    wave: "21-25 波",
    icon: Skull,
    accent: "text-[#a855f7]",
    accentHex: "#a855f7",
    accentBg: "bg-[#a855f7]/10",
    borderGlow: "hover:border-[#a855f7]/30",
    glowColor: "rgba(168, 85, 247, 0.15)",
    desc: "黑色虚空吞噬一切。2倍难度，虚空粒子密度1.5倍，屏幕震动0.7。第25波恐惧级首领战。",
    features: ["2倍敌潮难度", "虚空粒子密度1.5倍", "屏幕震动0.7", "第25波恐惧级首领"],
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
  "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20spaceship%20bridge%20command%20center%2C%20three%20phase%20transformation%20from%20blue%20to%20red%20to%20void%20black%2C%20holographic%20tactical%20displays%2C%20massive%20mechanical%20dreadnought%20boss%2C%20dark%20industrial%20scifi%2C%20low%20saturation%2C%20epic%20scale%2C%20no%20text&image_size=landscape_16_9";

// 浮动粒子
function HeroParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      duration: 3 + Math.random() * 5,
      delay: Math.random() * 3,
      opacity: 0.1 + Math.random() * 0.3,
    })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/60"
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
      <Head>
        <title>Project M 旗舰版 - 旗舰巅峰</title>
        <meta name="description" content="Project M 旗舰巅峰：三阶段25波终极挑战。标准巡航→超频增压→地狱终局，双轨挑战+双维度评级+统一积分制。" />
      </Head>

      <div className="relative min-h-[100dvh]">
        <DimensionBackground intensity="high" />
        <div className="noise-overlay" />
        <div className="pointer-events-none fixed inset-0 z-0 bridge-grid opacity-40" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-3 md:py-4">
          {/* Hero */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative mb-3 md:mb-4"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Rocket size={12} weight="fill" className="status-pulse" />
              旗舰巅峰
            </span>
            <h1 className="mt-3 text-[clamp(2rem,5vw,3.5rem)] font-display font-bold leading-[0.95] tracking-tight">
              三阶段
              <br />
              <span className="text-gradient">25波终极挑战</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              旗舰与巅峰模式融合升级。标准巡航(1-10) → 超频增压(11-20) → 地狱终局(21-25)，双轨挑战系统 + 双维度评级 + 统一积分制，Project M 终极防守体验。
            </p>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative mb-4"
          >
            <div className="bridge-panel holo-scan bridge-glow relative overflow-hidden">
              <HeroParticles />
              <img
                src={HERO_IMAGE}
                alt="旗舰巅峰"
                className="h-[200px] w-full object-cover md:h-[320px]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-panel via-panel/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2">
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary backdrop-blur-sm"
                >
                  <Shield size={10} />
                  25 波
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 }}
                  className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-danger backdrop-blur-sm"
                >
                  <Fire size={10} />
                  三阶段
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4 }}
                  className="inline-flex items-center gap-1 rounded-full border border-[#a855f7]/30 bg-[#a855f7]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#a855f7] backdrop-blur-sm"
                >
                  <Skull size={10} />
                  地狱终局
                </motion.span>
              </div>
            </div>
          </motion.div>

          {/* Three Phases */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <h2 className="mb-3 font-display text-lg font-bold tracking-tight">
              三阶段递进
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
                    className={`bridge-panel holo-scan group relative p-4 transition-all duration-300 ${phase.borderGlow}`}
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
                    className="bridge-panel holo-scan group p-4 transition-all duration-300 hover:border-primary/20 hover:shadow-[0_0_30px_rgba(99,102,241,0.08)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
                    className="bridge-panel holo-scan group p-4 transition-all duration-300 hover:border-primary/20"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
                            className="inline-flex items-center rounded-full border border-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all"
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
            <div className="bridge-panel holo-scan bridge-glow p-4">
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
            className="relative bridge-panel holo-scan bridge-glow overflow-hidden p-4"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-[#a855f7]/5 blur-3xl" />
            <div className="relative grid gap-4 lg:grid-cols-2">
              <div>
                <h2 className="text-lg font-display font-bold tracking-tight">准备就绪，舰长</h2>
                <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">
                  选择难度预设，进入旗舰巅峰。标准巡航积累资源，超频增压突破极限，地狱终局征服终极首领。
                </p>
              </div>
              <div className="flex flex-col justify-center gap-2 sm:flex-row lg:justify-end">
                <Link
                  href="/game?mode=flagship-peak"
                  className="group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-6 text-sm font-bold text-background shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 focus-ring active:scale-95"
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