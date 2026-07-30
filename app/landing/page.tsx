"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Trophy,
  GameController,
  ArrowRight,
  CaretRight,
  Planet,
  Rocket,
  Star,
} from "@phosphor-icons/react";
import DimensionBackground from "@/components/effects/DimensionBackground";
import BrandLogo from "@/components/BrandLogo";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Hero from "@/components/landing/Hero";
import FeatureBento from "@/components/landing/FeatureBento";
import RhythmSection from "@/components/landing/RhythmSection";
import ModesShowcase from "@/components/landing/ModesShowcase";
import FooterCTA from "@/components/landing/FooterCTA";

const FAQS = [
  {
    q: "多重宇宙是什么类型游戏？",
    a: "一款多元宇宙背景的横屏动作射击 Web 游戏。主打据点防守、极限生存与英雄技能构建，浏览器打开即玩。",
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
    a: "本地进度保存在浏览器本地存储中；全球排行榜、公告等在线功能通过云端同步。",
  },
  {
    q: "支持联机吗？",
    a: "支持。据点防守与个人死斗模式可通过 P2P 联机或本地同屏进行多人对战。",
  },
];

function LeaderboardPreview() {
  const { entries, loading, error, refetch } = useLeaderboard({ limit: 5 });

  return (
    <div className="game-card-raised rounded-3xl p-3 md:p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-bold">
          <Trophy size={16} weight="bold" className="text-accent" />
          维度行者榜
        </h3>
        <Link href="/leaderboard" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
          查看全部 <ArrowRight size={11} />
        </Link>
      </div>
      {loading && <Skeleton count={5} className="h-8" />}
      {error && <ErrorState error={error} onRetry={refetch} className="py-3" />}
      {!loading && !error && entries.length === 0 && (
        <EmptyState title="维度待启" description="涅槃版本上线后首批维度行者将在这里留名" className="py-3" />
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
                      ? "bg-accent/15 text-accent"
                      : i === 1
                        ? "bg-muted/15 text-muted"
                        : i === 2
                          ? "bg-orbital/15 text-orbital"
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
          <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">常见问题</h2>
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
                className={`rounded-2xl border transition-colors orbital-scan ${open ? "border-primary/20 bg-panel" : "border-border bg-panel/50"}`}
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

  return (
    <div className="relative overflow-x-hidden bg-background text-foreground">
      <DimensionBackground intensity="subtle" />

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="group flex items-center gap-2 focus-ring rounded-lg">
          <BrandLogo size={32} variant="icon" className="text-primary" />
          <BrandLogo size={32} variant="wordmark" />
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
        <Hero />
        <FeatureBento />
        <RhythmSection />
        <ModesShowcase />

        {/* Leaderboard section */}
        <section className="border-y border-border bg-panel/20">
          <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
            <div className="grid items-center gap-4 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <LeaderboardPreview />
              </div>
              <div className="lg:col-span-6 lg:col-start-7">
                <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                  维度行者榜
                  <br />
                  <span className="text-gradient">记录每一次锚定</span>
                </h2>
                <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">
                  所有维度的成绩都会进入全球榜单。每一局结束后自动提交最高分，与所有维度行者一较高下。
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
                    href="/game?mode=defense"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-panel px-5 text-sm font-semibold transition-colors hover:bg-panel-raised focus-ring"
                  >
                    挑战据点防守
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