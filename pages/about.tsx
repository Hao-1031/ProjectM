import Layout from "@/components/Layout";
import FeatureCard from "@/components/FeatureCard";
import { motion, useReducedMotion } from "framer-motion";
import {
  Target,
  Shield,
  Eye,
  Lock,
  Code,
  Cpu,
  Globe,
  Monitor,
  DeviceMobile,
  Bug,
  MusicNotes,
  Pulse,
} from "@phosphor-icons/react";

const techStack = [
  { name: "Next.js", role: "路由与渲染", icon: Globe },
  { name: "React + TS", role: "组件与类型", icon: Code },
  { name: "HTML5 Canvas", role: "游戏渲染", icon: Monitor },
  { name: "Zustand", role: "状态管理", icon: Cpu },
  { name: "Howler.js", role: "程序化音效", icon: MusicNotes },
  { name: "next-pwa", role: "离线支持", icon: DeviceMobile },
  { name: "Sentry", role: "错误监控", icon: Bug },
  { name: "Framer Motion", role: "界面动效", icon: Pulse },
];

const values = [
  {
    icon: <Target size={26} weight="bold" className="text-primary" />,
    title: "目标明确",
    description: "不为复杂而复杂。移动、射击、撤离，每个系统都围绕这一核心循环展开。",
  },
  {
    icon: <Shield size={26} weight="bold" className="text-success" />,
    title: "公平竞技",
    description: "无氪金、无付费加成。所有英雄、武器与属性成长均通过局内战斗获取。",
  },
  {
    icon: <Eye size={26} weight="bold" className="text-accent" />,
    title: "透明可见",
    description: "平衡数值、武器参数、敌人属性都写在代码里，任何人都能读懂规则。",
  },
  {
    icon: <Lock size={26} weight="bold" className="text-danger" />,
    title: "即开即玩",
    description: "无需账户、无需登录。打开浏览器即可进入战场，随时暂停与继续。",
  },
];

export default function AboutPage() {
  const reducedMotion = useReducedMotion();

  return (
    <Layout title="关于">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute right-[10%] top-0 h-[600px] w-px bg-gradient-to-b from-transparent via-accent/20 to-transparent" />
          <div className="absolute left-[20%] top-[20%] h-px w-[40%] bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <section className="relative mx-auto max-w-7xl px-4 py-4 md:py-6">
          <div className="grid gap-4 md:grid-cols-12 md:gap-6">
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="md:col-span-7"
            >
              <span className="inline-block rounded bg-primary/10 px-2 py-1 font-mono text-xs uppercase tracking-widest text-primary">
                关于 Project M
              </span>
              <h1 className="mt-2 text-2xl font-bold leading-[1.1] tracking-tight md:text-4xl">
                为喜欢自己掌控数据的玩家设计。
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                Project M 是一款冷色调科技末日风格的 Rogue-lite
                幸存者游戏。你只需控制移动，武器会自动索敌射击。在有限时间内完成清剿、坚守、回收与营救任务，最终抵达撤离点。
              </p>
            </motion.div>

            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="md:col-span-5"
            >
              <div className="relative overflow-hidden rounded-2xl border border-border bg-panel p-4">
                <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
                <p className="relative font-mono text-xs uppercase tracking-widest text-muted">
                  设计信条
                </p>
                <blockquote className="relative mt-2 text-sm font-medium leading-relaxed">
                  “不要让界面替玩家思考。给出清晰的信息、真实的反馈、可预知的规则，然后把战场交还给他们。”
                </blockquote>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-4 md:py-6">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">我们相信什么</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {values.map((value, index) => (
              <FeatureCard
                key={value.title}
                icon={value.icon}
                title={value.title}
                description={value.description}
                variant={index % 2 === 0 ? "muted" : "primary"}
                className="h-full"
              />
            ))}
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-4 md:py-6">
          <div className="grid gap-4 md:grid-cols-12 md:gap-6">
            <div className="md:col-span-5">
              <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                一座可以重复进入的废墟
              </h2>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
                <p>
                  我们希望每次开局都能带来新的压力与选择：是优先提升射程在远处风筝，还是堆叠护甲冲入敌群？是单人潜行完成回收，还是和朋友分工守住据点？
                </p>
                <p>
                  Project M
                  不设体力、抽卡或每日签到，也不出售影响战局的属性。它更像一张放在桌角的街机卡带：想玩的时候打开，用技术和策略取胜。
                </p>
              </div>
            </div>
            <div className="md:col-span-7">
              <div className="grid grid-flow-dense grid-cols-2 overflow-hidden rounded-3xl border border-border bg-panel">
                {techStack.map((tech, index) => {
                  const Icon = tech.icon;
                  const isWide = index === 0 || index === 5;
                  return (
                    <motion.div
                      key={tech.name}
                      initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className={`border-b border-r border-border/50 p-3 transition-colors hover:bg-panel-raised ${
                        isWide ? "col-span-2" : ""
                      }`}
                    >
                      <Icon size={18} weight="bold" className="text-primary" />
                      <p className="mt-2 text-sm font-semibold">{tech.name}</p>
                      <p className="text-[10px] text-muted">{tech.role}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-4 md:pb-6">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-panel p-4 md:p-5">
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative grid gap-4 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="text-lg font-bold tracking-tight md:text-xl">
                  公平竞技，无付费加成
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                  Project M
                  的核心设计信条是公平。商店、通行证与外观系统仅提供装饰与便利，不出售任何影响战局的英雄、武器或属性。所有成长均来自局内升级与战斗表现。
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <div className="inline-flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-1.5 text-xs text-success">
                  <Shield size={14} weight="bold" />
                  无属性售卖
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-panel-raised px-3 py-1.5 text-xs text-muted">
                  <Eye size={14} />
                  透明规则
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
