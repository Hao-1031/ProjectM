import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Play,
  Users,
  Crosshair,
  Target,
  Calendar,
  Shield,
  Shuffle,
  Clock,
  GameController,
  ArrowRight,
  Sword,
  Skull,
  Ghost,
} from "@phosphor-icons/react";
import { loadSave, type SaveData } from "@/lib/game/save";
import { getModeList } from "@/lib/game/modes";
import { HERO_DEFS } from "@/lib/game/heroes";
import { DEFAULT_BALANCE } from "@/lib/game/balance";
import FeatureCard from "@/components/FeatureCard";
import StatCard from "@/components/StatCard";
import Footer from "@/components/Footer";
import GSAPScrollReveal from "@/components/effects/GSAPScrollReveal";
import GSAPTextReveal from "@/components/effects/GSAPTextReveal";
import GSAPStagger from "@/components/effects/GSAPStagger";
import GSAPCounter from "@/components/effects/GSAPCounter";
import GSAPCardStack from "@/components/effects/GSAPCardStack";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function HomePage() {
  const [save, setSave] = useState<SaveData | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const modes = getModeList();
  const heroes = Object.values(HERO_DEFS);
  const weapons = Object.values(DEFAULT_BALANCE.weapons);
  const bossNames = Object.values(DEFAULT_BALANCE.bosses).map((b) => b.name);

  return (
    <div className="relative overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-40">
        <div className="absolute left-[12%] top-0 h-full w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
        <div className="absolute left-[64%] top-0 h-full w-px bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
        <div className="absolute left-0 top-[38%] h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <section className="relative z-10 mx-auto min-h-[100dvh] max-w-7xl px-4 pt-20 md:pt-24">
        <div className="grid items-end gap-8 pb-12 md:grid-cols-12 md:pb-16">
          <div className="md:col-span-7">
            <motion.span
              initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-block rounded bg-primary/10 px-2 py-1 font-mono text-xs uppercase tracking-widest text-primary"
            >
              末世幸存者指挥终端
            </motion.span>
            <motion.h1
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="mt-5 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl"
            >
              自动射击 <span className="text-primary">.</span>
              <br />
              手动生存 <span className="text-accent">.</span>
            </motion.h1>
            <motion.p
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mt-4 max-w-md text-sm leading-relaxed text-muted md:text-base"
            >
              在科技末日的废墟中移动、射击、撤离。完成 4 项任务，解锁武器与英雄，与队友死守据点。
            </motion.p>
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/game"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-background shadow-lg shadow-primary/15 transition-all hover:bg-primary/90 hover:shadow-primary/25 focus-ring active:scale-95"
              >
                <Play size={18} weight="fill" />
                <span className="whitespace-nowrap">立即部署</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/game?multiplayer=1"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-panel px-5 py-3 text-sm font-medium text-foreground transition-all hover:border-accent/40 hover:bg-panel-raised focus-ring active:scale-95"
              >
                <Users size={18} />
                <span className="whitespace-nowrap">组队生存</span>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative md:col-span-5"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-panel p-6">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(78,205,196,0.12),transparent_50%)]" />
              <div className="absolute right-6 top-6 flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs text-muted">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                系统在线
              </div>
              <div className="absolute bottom-6 left-6">
                <p className="font-mono text-xs uppercase tracking-widest text-muted">当前战绩</p>
                <div className="mt-2 flex gap-6">
                  <div>
                    <p className="text-2xl font-bold">{save?.totalRuns ?? 0}</p>
                    <p className="text-xs text-muted">出战</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{save?.totalKills ?? 0}</p>
                    <p className="text-xs text-muted">击杀</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{save?.bestRun?.stats.kills ?? 0}</p>
                    <p className="text-xs text-muted">最佳</p>
                  </div>
                </div>
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative h-32 w-32">
                  <div className="absolute inset-0 rounded-full border border-primary/30" />
                  <div className="absolute inset-3 rounded-full border border-accent/30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Crosshair size={40} className="text-primary/80" weight="bold" />
                  </div>
                  <motion.div
                    animate={reducedMotion ? undefined : { rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-b border-primary/50"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 md:py-24">
        <GSAPScrollReveal as="div" className="mb-8 flex items-end justify-between" direction="left">
          <GSAPTextReveal as="h2" className="text-2xl font-bold tracking-tight md:text-3xl">
            选择任务类型
          </GSAPTextReveal>
          <Link
            href="/help"
            className="hidden items-center gap-1 text-sm text-muted transition-colors hover:text-foreground md:flex"
          >
            查看规则 <ArrowRight size={14} />
          </Link>
        </GSAPScrollReveal>

        <motion.div
          variants={reducedMotion ? undefined : containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-flow-dense grid-cols-12 overflow-hidden rounded-3xl border border-border bg-panel"
        >
          {modes.map((mode, index) => {
            const spans = [
              "col-span-12 md:col-span-7 md:row-span-2",
              "col-span-12 md:col-span-5",
              "col-span-12 md:col-span-4",
              "col-span-12 md:col-span-4",
              "col-span-12 md:col-span-4",
            ];
            const icons = [Target, Clock, Calendar, Shuffle, Shield];
            const variants: Array<"primary" | "accent" | "muted"> = [
              "primary",
              "accent",
              "muted",
              "muted",
              "muted",
            ];
            const Icon = icons[index] ?? Target;
            return (
              <motion.div
                key={mode.type}
                variants={reducedMotion ? undefined : itemVariants}
                className={spans[index]}
              >
                <FeatureCard
                  as="link"
                  href={`/game?mode=${mode.type}`}
                  icon={<Icon size={28} weight="bold" className="text-primary" />}
                  title={mode.name}
                  description={mode.description}
                  variant={variants[index]}
                  className="h-full rounded-none border-0 border-b border-r border-border/50"
                />
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 md:py-24">
        <GSAPScrollReveal as="div" className="mb-8">
          <GSAPTextReveal as="h2" className="text-2xl font-bold tracking-tight md:text-3xl">
            构成撤离的要素
          </GSAPTextReveal>
        </GSAPScrollReveal>

        <GSAPStagger
          as="div"
          childClassName="contents"
          className="grid gap-4 md:grid-cols-12 md:gap-5"
          stagger={0.06}
        >
          <div className="md:col-span-7">
            <FeatureCard
              icon={<Users size={24} weight="bold" className="text-accent" />}
              title="英雄小队"
              description="每位英雄提供独特战术技能：侦察信标、冲锋护盾、治疗无人机、自动炮塔。"
              variant="accent"
              className="h-full"
            >
              <div className="mt-4 flex flex-wrap gap-2">
                {heroes.map((hero) => (
                  <span
                    key={hero.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: hero.color }}
                    />
                    {hero.name}
                  </span>
                ))}
              </div>
            </FeatureCard>
          </div>

          <div className="md:col-span-5">
            <FeatureCard
              icon={<Sword size={24} weight="bold" className="text-primary" />}
              title="武器库"
              description="脉冲步枪、霰弹爆破、贯穿激光、集束火箭、等离子喷火器与浮游无人机。"
              variant="primary"
              className="h-full"
            >
              <div className="mt-4 flex flex-wrap gap-2">
                {weapons.map((weapon) => (
                  <span
                    key={weapon.name}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted"
                  >
                    {weapon.name}
                  </span>
                ))}
              </div>
            </FeatureCard>
          </div>

          <div className="md:col-span-5">
            <FeatureCard
              icon={<Skull size={24} weight="bold" className="text-danger" />}
              title="威胁图鉴"
              description="游荡者、狂奔者、坦克、喷吐者、狙击者与精英变体，后期还会出现首领单位。"
              variant="muted"
              className="h-full"
            >
              <div className="mt-4 flex flex-wrap gap-2">
                {["游荡者", "狂奔者", "坦克", "喷吐者", "狙击者"].map((name) => (
                  <span
                    key={name}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </FeatureCard>
          </div>

          <div className="md:col-span-7">
            <FeatureCard
              icon={<Ghost size={24} weight="bold" className="text-success" />}
              title="首领威胁"
              description={`当前已配置 ${bossNames.length} 位首领：${bossNames.join("、")}。每位首领拥有 3 阶段攻击模式，需要团队配合或足够火力才能击退。`}
              variant="muted"
              className="h-full"
            />
          </div>
        </GSAPStagger>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 md:py-24">
        <GSAPScrollReveal as="div" className="mb-8 grid gap-6 md:grid-cols-2 md:items-end">
          <GSAPTextReveal as="h2" className="text-2xl font-bold tracking-tight md:text-3xl">
            你的部署记录
          </GSAPTextReveal>
          <p className="max-w-md text-sm text-muted">
            所有数据保存在浏览器本地。没有账户、没有云同步、没有数据挖掘。
          </p>
        </GSAPScrollReveal>

        <GSAPStagger
          as="div"
          childClassName="contents"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          stagger={0.08}
        >
          <StatCard
            value={<GSAPCounter value={save?.totalRuns ?? 0} />}
            label="总出战次数"
            icon={<GameController size={20} />}
            variant="primary"
          />
          <StatCard
            value={<GSAPCounter value={save?.totalKills ?? 0} />}
            label="累计击杀"
            icon={<Skull size={20} />}
            variant="muted"
          />
          <StatCard
            value={<GSAPCounter value={save?.bestRun?.stats.kills ?? 0} />}
            label="最佳击杀"
            icon={<Target size={20} />}
            variant="accent"
          />
          <StatCard
            value={<GSAPCounter value={save?.unlockedWeapons.length ?? 1} />}
            label="已解锁武器"
            icon={<Sword size={20} />}
            variant="success"
          />
        </GSAPStagger>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 md:py-24">
        <GSAPScrollReveal as="div" className="mb-8">
          <GSAPTextReveal as="h2" className="text-2xl font-bold tracking-tight md:text-3xl">
            战场节奏
          </GSAPTextReveal>
          <p className="mt-3 max-w-md text-sm text-muted">
            从部署到撤离，每个阶段都需要不同的决策与配合。
          </p>
        </GSAPScrollReveal>
        <GSAPCardStack
          cards={[
            {
              id: "deploy",
              title: "部署阶段",
              description:
                "选择任务模式、英雄与初始武器，进入随机生成的废墟战场。侦察技能可以提前暴露敌人分布，工程技能则能部署防御设施。",
              meta: "Phase 01",
              color: "primary",
            },
            {
              id: "defend",
              title: "据点防守",
              description:
                "占领能量节点以获取资源，保护核心不被机械敌人摧毁。波次之间进入补给站，购买升级或强化天赋。",
              meta: "Phase 02",
              color: "accent",
            },
            {
              id: "extract",
              title: "撤离行动",
              description:
                "完成目标后撤离点开启。在倒计时内抵达撤离区域即可获胜，失败则保留部分进度用于下一局。",
              meta: "Phase 03",
              color: "success",
            },
          ]}
        />
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 md:py-24">
        <GSAPScrollReveal
          as="div"
          className="relative overflow-hidden rounded-3xl border border-border bg-panel p-8 md:p-12"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <GSAPTextReveal as="h2" className="text-2xl font-bold tracking-tight md:text-3xl">
                准备进入废墟？
              </GSAPTextReveal>
              <p className="mt-3 max-w-md text-sm text-muted">
                每次部署都是新的战局。选择模式、英雄和武器，完成任务并抵达撤离点。
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link
                href="/game"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-background shadow-lg shadow-primary/15 transition-all hover:bg-primary/90 focus-ring active:scale-95"
              >
                <Play size={18} weight="fill" />
                <span className="whitespace-nowrap">单人战役</span>
              </Link>
              <Link
                href="/game?multiplayer=1"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-medium transition-all hover:border-accent/40 hover:bg-panel-raised focus-ring active:scale-95"
              >
                <Users size={18} />
                <span className="whitespace-nowrap">联机合作</span>
              </Link>
            </div>
          </div>
        </GSAPScrollReveal>
      </section>

      <Footer
        totalRuns={save?.totalRuns ?? 0}
        totalKills={save?.totalKills ?? 0}
        bestKills={save?.bestRun?.stats.kills ?? 0}
      />
    </div>
  );
}
