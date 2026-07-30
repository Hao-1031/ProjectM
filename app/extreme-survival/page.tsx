"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Lightning,
  Skull,
  ArrowRight,
  Trophy,
  Users,
  Warning,
  Clock,
  Target,
  CaretRight,
  Info,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import Button from "@/components/ui/Button";
import DimensionBackground from "@/components/effects/DimensionBackground";
import { loadSave, type SaveData } from "@/lib/game/save";

const FEATURES = [
  {
    icon: Lightning,
    title: "后半段超频极限",
    description: "第 25 波后选择进入超频状态，敌人属性、行为、环境事件三重加压",
  },
  {
    icon: Skull,
    title: "全程满配体验",
    description: "临时解锁全部干员、外观与武器，自由搭配最爽的 build",
  },
  {
    icon: Trophy,
    title: "仅超频榜",
    description: "只有进入后半段超频的玩家才进入排行榜，按最高波次排序",
  },
  {
    icon: Target,
    title: "一次性过载护盾",
    description: "据点血量首次归零时触发护盾，回血 1/3 并清除周围敌人",
  },
];

export default function ExtremeSurvivalPage() {
  const reducedMotion = useReducedMotion();
  const [save, setSave] = useState<SaveData | null>(null);

  useEffect(() => {
    setSave(loadSave());
  }, []);

  return (
    <Layout title="极限生存">
      <div className="relative min-h-[100dvh]">
        <DimensionBackground intensity="medium" />
        <div className="noise-overlay" />
        <div className="pointer-events-none fixed inset-0 z-0 starfield opacity-40" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:py-10">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 md:mb-8"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground focus-ring rounded"
            >
              <CaretRight size={12} className="rotate-180" />
              返回基地
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-danger">
                <Warning size={12} weight="fill" />
                极限模式
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-muted/20 bg-panel/60 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                <Users size={12} />
                单人
              </span>
            </div>
            <h1 className="mt-3 text-[clamp(2rem,6vw,4rem)] font-display font-bold leading-[0.95] tracking-tight">
              极限生存
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              全程满配干员与武器，前半段热身割草，第 25 波后进入后半段超频极限。
              敌人强度随波次指数增长，撑得越久，奖励越丰厚。
            </p>
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-12">
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-7"
            >
              <div className="station-panel orbital-scan station-glow p-5 md:p-6">
                <div className="station-panel-header -mx-5 -mt-5 mb-4 md:-mx-6 md:-mt-6">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
                    <Info size={12} />
                    模式机制
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {FEATURES.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={feature.title}
                        initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.4,
                          delay: 0.15 + index * 0.06,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="station-panel p-4 transition-colors hover:border-danger/20"
                      >
                        <Icon size={22} weight="duotone" className="text-danger" />
                        <h3 className="mt-2 text-sm font-bold">{feature.title}</h3>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted">
                          {feature.description}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-5"
            >
              <div className="station-panel orbital-scan station-glow p-5 md:p-6">
                <div className="station-panel-header -mx-5 -mt-5 mb-4 md:-mx-6 md:-mt-6">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
                    <Clock size={12} />
                    当前状态
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="station-panel flex items-center justify-between p-3">
                    <span className="text-xs text-muted">最高波次</span>
                    <span className="font-mono text-lg font-bold tabular-nums">{save?.bestRun?.stats.wavesCleared ?? 0}</span>
                  </div>
                  <div className="station-panel flex items-center justify-between p-3">
                    <span className="text-xs text-muted">总出战次数</span>
                    <span className="font-mono text-lg font-bold tabular-nums">{save?.totalRuns ?? 0}</span>
                  </div>
                  <div className="station-panel flex items-center justify-between p-3">
                    <span className="text-xs text-muted">游戏币</span>
                    <span className="font-mono text-lg font-bold tabular-nums">{save?.coins ?? 0}</span>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <Link href="/game?mode=extreme-survival" passHref legacyBehavior>
                    <Button
                      variant="danger"
                      size="lg"
                      className="w-full"
                      leftIcon={<Lightning size={20} weight="fill" />}
                      rightIcon={<ArrowRight size={16} weight="bold" />}
                    >
                      进入极限生存
                    </Button>
                  </Link>
                  <Link href="/leaderboard?mode=extreme-survival" passHref legacyBehavior>
                    <Button
                      variant="secondary"
                      size="md"
                      className="w-full"
                      leftIcon={<Trophy size={18} />}
                    >
                      查看排行榜
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}