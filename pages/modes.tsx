import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  GameController,
  Infinity,
  Calendar,
  TreeStructure,
  Shield,
  Target,
  Users,
  CaretRight,
  Sparkle,
  Crosshair,
  Radioactive,
  Warning,
  Play,
  Skull,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import { getModeList, getDailyModifiers } from "@/lib/game/modes";
import NuclearBackground from "@/components/effects/NuclearBackground";

const MODE_META: Record<
  string,
  { icon: typeof GameController; accent: string; bullets: string[]; threat: string }
> = {
  survival: {
    icon: Skull,
    accent: "text-danger",
    bullets: ["15 分钟限时生存", "自动攻击 + 移动 + Build 流派", "全球排行榜记录最高击杀"],
    threat: "高",
  },
  campaign: {
    icon: Target,
    accent: "text-accent",
    bullets: ["完成 5-7 个连续任务", "抵达撤离点即可结算", "适合熟悉武器与地图"],
    threat: "低",
  },
  endless: {
    icon: Infinity,
    accent: "text-danger",
    bullets: ["敌人强度随波次指数增长", "没有撤离点，直到核心被摧毁", "考验极限生存与Build深度"],
    threat: "极高",
  },
  daily: {
    icon: Calendar,
    accent: "text-warning",
    bullets: ["每日固定种子与地图", "全局统一词缀规则", "可与好友比拼当日分数"],
    threat: "中",
  },
  roguelike: {
    icon: TreeStructure,
    accent: "text-success",
    bullets: ["分支关卡树推进", "每关后选择强化", "击败最终首领通关"],
    threat: "高",
  },
  defense: {
    icon: Shield,
    accent: "text-primary",
    bullets: ["2-4 人合作防守核心", "占领能量节点获得补给", "抵御 8 波机械敌潮与巨像"],
    threat: "高",
  },
  deathmatch: {
    icon: Crosshair,
    accent: "text-danger",
    bullets: ["PVP 自由混战 + Bot", "率先达到击杀目标获胜", "限时最高击杀决胜"],
    threat: "中",
  },
};

const THREAT_COLOR: Record<string, string> = {
  低: "#5e8c6a",
  中: "#c9a34e",
  高: "#b87a3d",
  极高: "#b84a55",
};

export default function ModesPage() {
  const reducedMotion = useReducedMotion();
  const modes = getModeList().filter(
    (m) => m.type === "survival" || m.type === "defense" || m.type === "campaign" || m.type === "endless"
  );
  const dailyModifiers = getDailyModifiers();

  return (
    <Layout title="作战模式">
      <div className="relative min-h-[100dvh]">
        <NuclearBackground />
        <div className="noise-overlay" />
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -right-[15%] top-[5%] h-[55vh] w-[55vh] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute -left-[10%] bottom-[10%] h-[45vh] w-[45vh] rounded-full bg-accent/4 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 md:py-20">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10 md:mb-16"
          >
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
              <Radioactive weight="duotone" size={14} />
              作战模式
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">选择辐射区任务</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
              三种模式覆盖单人任务、无尽生存与 PvE 合作。据点防守为 L3V100 创世版主打玩法。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:grid-flow-dense">
            {modes.map((mode, index) => {
              const meta = MODE_META[mode.type];
              const Icon = meta.icon;
              const large = mode.type === "survival";
              const href =
                mode.type === "defense"
                  ? "/game?mode=defense&multiplayer=1"
                  : `/game?mode=${mode.type}`;
              return (
                <motion.article
                  key={mode.type}
                  initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className={`group relative overflow-hidden rounded-2xl border border-border bg-panel p-5 transition-all hover:border-primary/30 hover:bg-panel-raised md:p-6 ${
                    large ? "md:col-span-7 md:row-span-2" : "md:col-span-5"
                  }`}
                >
                  {large && (
                    <div className="pointer-events-none absolute inset-0 hazard-stripes opacity-30" />
                  )}
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className={`rounded-xl bg-panel-raised p-3 ${meta.accent}`}>
                        <Icon size={28} weight="duotone" />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {large && (
                          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                            主打
                          </span>
                        )}
                        <span
                          className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            borderColor: `${THREAT_COLOR[meta.threat]}40`,
                            color: THREAT_COLOR[meta.threat],
                            backgroundColor: `${THREAT_COLOR[meta.threat]}10`,
                          }}
                        >
                          威胁 {meta.threat}
                        </span>
                      </div>
                    </div>
                    <h2 className="mt-5 text-xl font-bold tracking-tight md:text-2xl">
                      {mode.name}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{mode.description}</p>
                    <ul className="mt-4 space-y-2">
                      {meta.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted">
                          <CaretRight size={14} className="mt-0.5 shrink-0 text-primary" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                    {large && (
                      <div className="mt-4 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted">
                        <Users size={14} />
                        推荐 2-4 人合作
                      </div>
                    )}
                    <div className="mt-auto pt-5">
                      <Link
                        href={href}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-background focus-ring"
                      >
                        <Play size={16} weight="fill" />
                        进入任务
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <motion.section
            initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 grid gap-4 lg:grid-cols-3"
          >
            <div className="rounded-2xl border border-border bg-panel p-6 lg:col-span-2 lg:p-8">
              <div className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
                <Sparkle size={12} />
                环境词缀
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {dailyModifiers.map((mod, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-border bg-panel-raised p-4 transition-colors hover:border-warning/20"
                  >
                    <div className="flex items-center gap-2">
                      <Warning size={14} weight="bold" className="text-warning" />
                      <p className="font-semibold">{mod.title}</p>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{mod.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-danger/20 bg-danger/5 p-6">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-danger/10 blur-3xl" />
              <div className="relative">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
                  <Skull size={20} weight="bold" />
                </div>
                <h3 className="text-lg font-bold tracking-tight">威胁图鉴</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  查看机械敌人的行为模式、精英词缀与首领机制，提前制定防守策略。
                </p>
                <Link
                  href="/enemies"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-danger hover:underline focus-ring rounded"
                >
                  浏览图鉴 <CaretRight size={14} />
                </Link>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </Layout>
  );
}
