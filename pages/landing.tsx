import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  Crosshair,
  Play,
  Trophy,
  GameController,
  Skull,
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
import FeatureBento from "@/components/landing/FeatureBento";
import RhythmSection from "@/components/landing/RhythmSection";
import ModesShowcase from "@/components/landing/ModesShowcase";
import FooterCTA from "@/components/landing/FooterCTA";

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
    <div className="rounded-3xl border border-border bg-panel p-3 shadow-2xl shadow-black/20 md:p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-bold">
          <Trophy size={16} weight="bold" className="text-warning" />
          全球榜前十
        </h3>
        <Link href="/leaderboard" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
          查看全部 <ArrowRight size={11} />
        </Link>
      </div>
      {loading && <Skeleton count={5} className="h-8" />}
      {error && <ErrorState error={error} onRetry={refetch} className="py-3" />}
      {!loading && !error && entries.length === 0 && (
        <EmptyState title="榜单待启" description="2.0 上线后首批幸存者将在这里留名" className="py-3" />
      )}
      {!loading && !error && entries.length > 0 && (
        <div className="space-y-1">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-2.5 py-1.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
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
                <span className="text-xs font-medium">{entry.player_name}</span>
              </div>
              <span className="font-mono text-xs font-bold text-primary">{entry.score.toLocaleString()}</span>
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
    <section className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">常见问题</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            如果还有其他疑问，欢迎通过关于页面或游戏内反馈联系我们。
          </p>
        </div>
        <div className="space-y-1.5 lg:col-span-8">
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
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                >
                  <span className="text-xs font-semibold">{faq.q}</span>
                  <CaretRight size={12} className={`shrink-0 text-muted transition-transform ${open ? "rotate-90" : ""}`} />
                </button>
                {open && (
                  <div className="px-3 pb-2.5">
                    <p className="text-xs leading-relaxed text-muted">{faq.a}</p>
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
    <div className="relative overflow-x-hidden bg-background text-foreground">
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
        <section className="mx-auto max-w-7xl px-4 pb-6 pt-4 md:pt-6">
          <div className="grid items-center gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <motion.div
                initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <Radioactive size={10} weight="fill" />
                  2.0 正式上线
                </span>
                <h1 className="mt-4 text-[clamp(2rem,5vw,4rem)] font-bold leading-[0.95] tracking-tight">
                  一人一枪
                  <br />
                  <span className="text-primary">杀穿辐射区</span>
                </h1>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
                  Project M 2.0 将横屏双摇杆操作与生存割草节奏融合。15 分钟限时、自动攻击、自由 build，在无尽敌潮中挑战你的极限。
                </p>
              </motion.div>

              <motion.div
                initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="mt-4 flex flex-col gap-2 sm:flex-row"
              >
                <Link
                  href="/game?mode=survival"
                  className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-6 text-base font-bold text-background shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 focus-ring active:scale-95"
                >
                  <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
                  <Play size={22} weight="fill" />
                  <span className="whitespace-nowrap">立即开战</span>
                </Link>
                <Link
                  href="/modes"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-panel px-5 text-sm font-semibold transition-all hover:border-primary/40 hover:bg-panel-raised focus-ring active:scale-95"
                >
                  <GameController size={18} />
                  <span className="whitespace-nowrap">选择模式</span>
                </Link>
              </motion.div>

              <motion.div
                initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-muted"
              >
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-success" />
                  无付费加成
                </span>
                <span className="flex items-center gap-1">
                  <Star size={12} className="text-warning" />
                  全球排行榜
                </span>
                <span className="flex items-center gap-1">
                  <Skull size={12} className="text-danger" />
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
                    <Crosshair size={64} weight="bold" className="relative text-primary" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-border bg-background/80 p-3 backdrop-blur-md">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">生存模式</span>
                    <span className="font-mono text-danger">14:32</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
                    <div className="h-full w-3/4 rounded-full bg-primary" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <FeatureBento />
        <RhythmSection />
        <ModesShowcase />

        <section className="border-y border-border bg-panel/30">
          <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
            <div className="grid items-center gap-4 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <LeaderboardPreview />
              </div>
              <div className="lg:col-span-6 lg:col-start-7">
                <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                  全球排行榜
                  <br />
                  <span className="text-primary">记录每一次撤离</span>
                </h2>
                <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">
                  生存模式、据点防守、个人死斗的成绩都会进入全球榜单。每一局结束后自动提交最高分，与所有幸存者一较高下。
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link
                    href="/leaderboard"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-background transition-colors hover:bg-primary/90 focus-ring"
                  >
                    <Trophy size={16} weight="bold" />
                    查看榜单
                  </Link>
                  <Link
                    href="/game?mode=survival"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-panel px-5 text-sm font-semibold transition-colors hover:bg-panel-raised focus-ring"
                  >
                    挑战生存模式
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FAQSection />

        <FooterCTA />
      </main>
    </div>
  );
}
