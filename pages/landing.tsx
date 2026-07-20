import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  Crosshair,
  Play,
  Trophy,
  GameController,
  Users,
  Skull,
  Clock,
  Lightning,
  ShieldCheck,
  ArrowRight,
  CaretRight,
  Star,
  Radioactive,
} from "@phosphor-icons/react";
import NuclearBackground from "@/components/effects/NuclearBackground";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";

const FEATURES = [
  {
    icon: Clock,
    title: "15 分钟生存挑战",
    desc: "限时高压环境，每局都是完整的割草爽感体验。",
    accent: "#b84a55",
  },
  {
    icon: Crosshair,
    title: "自动攻击 + 自由走位",
    desc: "左手移动，右手闪避，武器自动索敌，专注策略与走位。",
    accent: "#7a8f3e",
  },
  {
    icon: Lightning,
    title: "构建你的流派",
    desc: "升级武器、叠加被动、选择天赋，每局 build 都不相同。",
    accent: "#b87a3d",
  },
  {
    icon: Users,
    title: "据点合作防守",
    desc: "2-4 人联机守护能量核心，配合英雄技能击退敌潮。",
    accent: "#5e8c6a",
  },
  {
    icon: GameController,
    title: "横屏双摇杆",
    desc: "为移动端优化的虚拟摇杆，PC 端同样支持键鼠与手柄。",
    accent: "#818cf8",
  },
  {
    icon: ShieldCheck,
    title: "无付费加成",
    desc: "皮肤与便利道具可购，战力永远只靠操作与策略。",
    accent: "#c9a34e",
  },
];

const FAQS = [
  {
    q: "Project M 2.0 是什么类型游戏？",
    a: "一款核污染废土背景的横屏动作射击 Web 游戏。主打生存割草、据点合作与英雄技能构建，浏览器打开即玩。",
  },
  {
    q: "需要下载客户端吗？",
    a: "不需要。基于 Next.js 与 PWA 技术，浏览器访问即可游玩，也支持添加到主屏幕离线启动。",
  },
  {
    q: "游戏收费吗？",
    a: "完全免费游玩。商店只出售外观皮肤、特效与便利功能，不提供任何影响数值的付费道具。",
  },
  {
    q: "数据会保存在哪里？",
    a: "本地进度保存在浏览器本地存储中；全球排行榜、公告等在线功能通过 Supabase 云端同步。",
  },
  {
    q: "支持联机吗？",
    a: "支持。据点防守与个人死斗模式可通过 P2P 联机或本地同屏进行多人对战。",
  },
];

function LeaderboardPreview() {
  const { entries, loading, error, refetch } = useLeaderboard({ limit: 5 });

  return (
    <div className="rounded-3xl border border-border bg-panel p-6 shadow-2xl shadow-black/20 md:p-8">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Trophy size={22} weight="bold" className="text-warning" />
          全球榜前十
        </h3>
        <Link href="/leaderboard" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          查看全部 <ArrowRight size={12} />
        </Link>
      </div>
      {loading && <Skeleton count={5} className="h-12" />}
      {error && <ErrorState error={error} onRetry={refetch} className="py-6" />}
      {!loading && !error && entries.length === 0 && (
        <EmptyState title="榜单待启" description="2.0 上线后首批幸存者将在这里留名" className="py-6" />
      )}
      {!loading && !error && entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    i === 0
                      ? "bg-warning/15 text-warning"
                      : i === 1
                        ? "bg-muted/15 text-muted"
                        : i === 2
                          ? "bg-accent/15 text-accent"
                          : "bg-border text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-medium">{entry.player_name}</span>
              </div>
              <span className="font-mono text-sm font-bold text-primary">{entry.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 md:py-32">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">常见问题</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            如果还有其他疑问，欢迎通过关于页面或游戏内反馈联系我们。
          </p>
        </div>
        <div className="space-y-3 lg:col-span-8">
          {FAQS.map((faq, i) => {
            const open = openIndex === i;
            return (
              <div
                key={i}
                className={`rounded-2xl border transition-colors ${open ? "border-primary/30 bg-panel" : "border-border bg-panel/50"}`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-semibold">{faq.q}</span>
                  <CaretRight size={16} className={`shrink-0 text-muted transition-transform ${open ? "rotate-90" : ""}`} />
                </button>
                {open && (
                  <div className="px-5 pb-4">
                    <p className="text-sm leading-relaxed text-muted">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.5], ["0%", "20%"]);

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
      <Head>
        <title>Project M 2.0 - 一人一枪，杀穿辐射区</title>
        <meta name="description" content="Project M 2.0 是核污染废土背景的横屏动作射击 Web 游戏。生存割草、据点合作、无付费加成。" />
      </Head>

      <NuclearBackground />
      <div className="noise-overlay" />

      <motion.div
        style={{ y: reducedMotion ? 0 : heroY }}
        className="pointer-events-none fixed inset-0 z-0"
      >
        <div className="absolute -right-[10%] -top-[10%] h-[60vh] w-[60vh] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] h-[50vh] w-[50vh] rounded-full bg-accent/5 blur-[100px]" />
      </motion.div>

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="group flex items-center gap-2 focus-ring rounded-lg">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
            <Crosshair size={18} weight="bold" />
          </span>
          <span className="font-mono text-sm font-bold uppercase tracking-widest">Project M</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/leaderboard"
            className="group flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted transition-all hover:bg-panel hover:text-foreground focus-ring"
          >
            <Trophy size={14} />
            <span className="hidden sm:inline">战绩</span>
          </Link>
          <Link
            href="/"
            className="group flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted transition-all hover:bg-panel hover:text-foreground focus-ring"
          >
            <GameController size={14} />
            <span className="hidden sm:inline">游戏</span>
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 md:pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <motion.div
                initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <Radioactive size={10} weight="fill" />
                  2.0 正式上线
                </span>
                <h1 className="mt-6 text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-tight">
                  一人一枪
                  <br />
                  <span className="text-primary">杀穿辐射区</span>
                </h1>
                <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted md:text-base">
                  Project M 2.0 将横屏双摇杆操作与生存割草节奏融合。15 分钟限时、自动攻击、自由 build，在无尽敌潮中挑战你的极限。
                </p>
              </motion.div>

              <motion.div
                initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="mt-8 flex flex-col gap-4 sm:flex-row"
              >
                <Link
                  href="/game?mode=survival"
                  className="group relative inline-flex h-16 items-center justify-center gap-3 overflow-hidden rounded-2xl bg-primary px-10 text-lg font-bold text-background shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 focus-ring active:scale-95"
                >
                  <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
                  <Play size={28} weight="fill" />
                  <span className="whitespace-nowrap">立即开战</span>
                </Link>
                <Link
                  href="/modes"
                  className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl border border-border bg-panel px-6 text-sm font-semibold transition-all hover:border-primary/40 hover:bg-panel-raised focus-ring active:scale-95"
                >
                  <GameController size={20} />
                  <span className="whitespace-nowrap">选择模式</span>
                </Link>
              </motion.div>

              <motion.div
                initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="mt-10 flex flex-wrap items-center gap-6 text-xs text-muted"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-success" />
                  无付费加成
                </span>
                <span className="flex items-center gap-1.5">
                  <Star size={14} className="text-warning" />
                  全球排行榜
                </span>
                <span className="flex items-center gap-1.5">
                  <Skull size={14} className="text-danger" />
                  15 分钟极限生存
                </span>
              </motion.div>
            </div>

            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative lg:col-span-5"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-panel shadow-2xl shadow-black/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(122,143,62,0.12),transparent_50%)]" />
                <div className="absolute inset-0 hazard-stripes opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
                    <Crosshair size={80} weight="bold" className="relative text-primary" />
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-border bg-background/80 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">生存模式</span>
                    <span className="font-mono text-danger">14:32</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                    <div className="h-full w-3/4 rounded-full bg-primary" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 md:py-32">
          <div className="mb-10 md:mb-14">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">为什么选择 Project M</h2>
            <p className="mt-3 max-w-xl text-sm text-muted">从核心循环到商业模型，每个设计都围绕「爽快的操作」与「公平的竞技」展开。</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="group rounded-2xl border border-border bg-panel p-6 transition-all hover:border-primary/30 hover:bg-panel-raised"
                >
                  <div
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${feature.accent}15`, color: feature.accent }}
                  >
                    <Icon size={24} weight="bold" />
                  </div>
                  <h3 className="mt-5 text-base font-bold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="border-y border-border bg-panel/30">
          <div className="mx-auto max-w-7xl px-4 py-20 md:py-32">
            <div className="grid items-center gap-12 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <LeaderboardPreview />
              </div>
              <div className="lg:col-span-6 lg:col-start-7">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  全球排行榜
                  <br />
                  <span className="text-primary">记录每一次撤离</span>
                </h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                  生存模式、据点防守、个人死斗的成绩都会进入全球榜单。每一局结束后自动提交最高分，与所有幸存者一较高下。
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/leaderboard"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary/90 focus-ring"
                  >
                    <Trophy size={18} weight="bold" />
                    查看榜单
                  </Link>
                  <Link
                    href="/game?mode=survival"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-panel px-6 text-sm font-semibold transition-colors hover:bg-panel-raised focus-ring"
                  >
                    挑战生存模式
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FAQSection />

        <section className="mx-auto max-w-5xl px-4 py-20 text-center md:py-32">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-panel p-10 md:p-16">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
            <h2 className="relative text-3xl font-bold tracking-tight md:text-4xl">准备好进入辐射区了吗？</h2>
            <p className="relative mx-auto mt-4 max-w-lg text-sm text-muted">
              无需下载，浏览器即玩。公平竞技，只拼操作与策略。
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/game?mode=survival"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-base font-bold text-background shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 focus-ring active:scale-95"
              >
                <Play size={22} weight="fill" />
                立即开战
              </Link>
              <Link
                href="/about"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-border px-8 text-sm font-semibold transition-colors hover:bg-panel-raised focus-ring"
              >
                了解更多
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted sm:flex-row">
          <p>Project M · 公平竞技 · 无付费加成</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground focus-ring rounded">
              游戏首页
            </Link>
            <Link href="/leaderboard" className="hover:text-foreground focus-ring rounded">
              战绩
            </Link>
            <Link href="/about" className="hover:text-foreground focus-ring rounded">
              关于
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
