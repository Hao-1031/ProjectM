import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Lightning, Trophy, Clock, Target, Skull, ArrowRight, Warning } from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import DimensionBackground from "@/components/effects/DimensionBackground";

const FEATURES = [
  {
    icon: Lightning,
    title: "满配开局",
    desc: "无需从零积累，开局即拥有高等级武器与完整天赋，直接面对高压敌潮。",
  },
  {
    icon: Target,
    title: "击杀效率驱动",
    desc: "α 节律实时读取你的表现。杀得越快，敌潮越强，奖励也越丰厚。",
  },
  {
    icon: Clock,
    title: "15 分钟高压",
    desc: "固定限时挑战，每一秒都在考验你的走位、Build 与决策速度。",
  },
  {
    icon: Skull,
    title: "超频极限",
    desc: "第 25 波后可选择进入超频状态，难度指数级上升，积分倍率同步提高。",
  },
];

const SEASON_RULES = [
  "每赛季重置专属排行榜",
  "赛季词缀每日轮换",
  "前 100 名获得限定徽章",
  "积分 = 击杀数 × 超频倍率 × 生存时间系数",
];

const HERO_IMAGE =
  "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Epic%20cinematic%20extreme%20survival%20arena%2C%20lone%20commander%20surrounded%20by%20massive%20mechanical%20enemy%20horde%2C%20glowing%20teal%20energy%20weapons%2C%20ash%20storm%2C%20embers%20and%20sparks%2C%20hazard%20stripes%20on%20ground%2C%20muted%20teal%20and%20amber%20accent%20lights%2C%20low%20saturation%2C%20no%20text&image_size=landscape_16_9";

export default function PeakChallengePage() {
  const reducedMotion = useReducedMotion();

  return (
    <Layout title="巅峰挑战">
      <Head>
        <title>Project M 旗舰版 - 巅峰挑战</title>
        <meta name="description" content="Project M 旗舰版：巅峰挑战。满配开局、击杀效率驱动、15 分钟高压、超频极限与赛季排行榜。" />
      </Head>

      <div className="relative min-h-[100dvh]">
        <DimensionBackground intensity="medium" />
        <div className="noise-overlay" />
        <div className="pointer-events-none fixed inset-0 z-0 bridge-grid opacity-40" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-3 md:py-4">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-3 md:mb-4"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent">
              <Warning size={12} weight="fill" />
              巅峰挑战
            </span>
            <h1 className="mt-3 text-[clamp(2rem,5vw,3.5rem)] font-display font-bold leading-[0.95] tracking-tight">
              极限生存
              <br />
              <span className="text-gradient">挑战人类反应极限</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              奇迹版本核心模式。满配开局、15 分钟限时、击杀效率驱动敌潮强度，第 25 波后可进入超频极限冲击排行榜。
            </p>
          </motion.div>

          <div className="grid gap-3 lg:grid-cols-12">
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-7"
            >
              <div className="bridge-panel holo-scan bridge-glow overflow-hidden">
                <img
                  src={HERO_IMAGE}
                  alt="巅峰挑战"
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-panel via-panel/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                      <Clock size={10} />
                      15 分钟
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                      <Trophy size={10} />
                      赛季榜
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-2 lg:col-span-5"
            >
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="bridge-panel holo-scan p-3 transition-all hover:border-accent/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        <Icon size={16} weight="bold" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold tracking-tight">{feature.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted">{feature.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>

          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative mt-4 bridge-panel holo-scan bridge-glow p-4"
          >
            <div className="relative grid gap-4 lg:grid-cols-2">
              <div>
                <h2 className="text-lg font-display font-bold tracking-tight">赛季规则</h2>
                <ul className="mt-2 space-y-1.5">
                  {SEASON_RULES.map((rule) => (
                    <li key={rule} className="flex items-start gap-2 text-xs text-muted">
                      <span className="mt-0.5 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col justify-center gap-2 sm:flex-row lg:justify-end">
                <Link
                  href="/game?mode=extreme-survival"
                  className="group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-accent px-6 text-sm font-bold text-background shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 focus-ring active:scale-95"
                >
                  <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
                  <Lightning size={18} weight="fill" />
                  <span className="whitespace-nowrap">进入极限生存</span>
                </Link>
                <Link
                  href="/leaderboard"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-primary/10 bg-panel/60 px-5 text-sm font-semibold transition-all hover:border-accent/30 hover:bg-panel focus-ring active:scale-95"
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