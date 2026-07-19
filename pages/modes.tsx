import { motion, useReducedMotion } from "framer-motion";
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
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import { getModeList, getDailyModifiers } from "@/lib/game/modes";

const MODE_META: Record<
  string,
  { icon: typeof GameController; accent: string; bullets: string[] }
> = {
  campaign: {
    icon: Target,
    accent: "text-primary",
    bullets: ["完成 5-7 个连续任务", "抵达撤离点即可结算", "适合熟悉武器与地图"],
  },
  endless: {
    icon: Infinity,
    accent: "text-danger",
    bullets: ["敌人强度随波次指数增长", "没有撤离点，直到核心被摧毁", "考验极限生存与Build深度"],
  },
  daily: {
    icon: Calendar,
    accent: "text-warning",
    bullets: ["每日固定种子与地图", "全局统一词缀规则", "可与好友比拼当日分数"],
  },
  roguelike: {
    icon: TreeStructure,
    accent: "text-success",
    bullets: ["分支关卡树推进", "每关后选择强化", "击败最终首领通关"],
  },
  defense: {
    icon: Shield,
    accent: "text-primary",
    bullets: ["2-4 人合作防守核心", "占领能量节点获得补给", "抵御 8 波机械敌潮与巨像"],
  },
};

export default function ModesPage() {
  const reducedMotion = useReducedMotion();
  const modes = getModeList().filter((m) => m.type !== "daily" && m.type !== "roguelike");
  const dailyModifiers = getDailyModifiers();

  return (
    <Layout title="作战模式">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-20">
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-10 md:mb-16"
        >
          <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
            <GameController weight="duotone" size={14} />
            作战模式
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
            选择你的战场
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            三种模式覆盖单人任务、无尽生存与 PvE 合作。据点防守为 L3V100 创世版主打玩法。
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:grid-flow-dense">
          {modes.map((mode, index) => {
            const meta = MODE_META[mode.type];
            const Icon = meta.icon;
            const large = mode.type === "defense";
            return (
              <motion.article
                key={mode.type}
                initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className={`relative overflow-hidden rounded-2xl border border-border bg-panel p-5 transition-colors hover:bg-panel-raised md:p-6 ${
                  large ? "md:col-span-7 md:row-span-2" : "md:col-span-5"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`rounded-xl bg-panel-raised p-3 ${meta.accent}`}>
                    <Icon size={28} weight="duotone" />
                  </div>
                  {large && (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      主打
                    </span>
                  )}
                </div>
                <h2 className="mt-5 text-xl font-bold tracking-tight md:text-2xl">
                  {mode.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {mode.description}
                </p>
                <ul className="mt-4 space-y-2">
                  {meta.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted">
                      <CaretRight size={14} className="mt-0.5 shrink-0 text-primary" />
                      {bullet}
                    </li>
                  ))}
                </ul>
                {large && (
                  <div className="mt-6 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted">
                    <Users size={14} />
                    推荐 2-4 人合作
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>

        <motion.section
          initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="mt-16 rounded-2xl border border-border bg-panel p-6 md:p-8"
        >
          <div className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
            <Sparkle size={12} />
            每日挑战词缀
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dailyModifiers.map((mod, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-panel-raised p-4"
              >
                <p className="font-semibold">{mod.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {mod.description}
                </p>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </Layout>
  );
}
