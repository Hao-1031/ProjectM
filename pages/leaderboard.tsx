import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import StatCard from "@/components/StatCard";
import SectionHeader from "@/components/SectionHeader";
import { motion, useReducedMotion } from "framer-motion";
import {
  Trophy,
  Skull,
  Clock,
  Target,
  Sword,
  Shield,
  Crosshair,
  Play,
  Globe,
} from "@phosphor-icons/react";
import { loadSave, type SaveData } from "@/lib/game/save";
import { formatTime } from "@/lib/game/math";

const modeNames: Record<string, string> = {
  campaign: "战役模式",
  endless: "无尽生存",
  daily: "每日挑战",
  roguelike: "冒险模式",
  defense: "据点防守",
};

export default function LeaderboardPage() {
  const [save, setSave] = useState<SaveData | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const best = save?.bestRun;

  return (
    <Layout title="战绩">
      <div className="relative mx-auto max-w-6xl px-4 pt-10 md:pt-16">
        <div className="grid gap-10 md:grid-cols-12">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="md:col-span-5"
          >
            <span className="inline-block rounded bg-accent/10 px-2 py-1 font-mono text-xs uppercase tracking-widest text-accent">
              作战记录
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
              你的最佳撤离记录。
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted md:text-base">
              目前版本仅保存个人最佳战绩。全球排行榜将在后续版本以可选方式开放。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/game"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-background shadow-lg shadow-primary/15 transition-all hover:bg-primary/90 focus-ring active:scale-95"
              >
                <Play size={18} weight="fill" />
                <span className="whitespace-nowrap">再开一局</span>
              </Link>
              <Link
                href="/base"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-panel px-5 py-3 text-sm font-medium transition-all hover:border-primary/40 hover:bg-panel-raised focus-ring active:scale-95"
              >
                <Crosshair size={18} />
                <span className="whitespace-nowrap">查看基地</span>
              </Link>
            </div>
          </motion.div>

          <div className="md:col-span-7">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                value={save?.totalRuns ?? 0}
                label="总出战次数"
                icon={<Target size={20} />}
                variant="primary"
              />
              <StatCard
                value={save?.totalKills ?? 0}
                label="累计击杀"
                icon={<Skull size={20} />}
                variant="muted"
              />
              <StatCard
                value={best?.stats.kills ?? 0}
                label="最佳击杀"
                icon={<Trophy size={20} />}
                variant="accent"
              />
            </div>

            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-panel p-6"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-muted">最佳记录</p>
                  {best ? (
                    <>
                      <p className="mt-2 text-3xl font-bold">
                        {best.victory ? "撤离成功" : "任务失败"}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {modeNames[best.mode] ?? best.mode} · {formatTime(best.elapsed)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-lg font-medium">暂无记录</p>
                  )}
                </div>
                {best && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      best.victory ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    }`}
                  >
                    {best.victory ? (
                      <Shield size={14} weight="bold" />
                    ) : (
                      <Crosshair size={14} weight="bold" />
                    )}
                    {best.victory ? "胜利" : "失败"}
                  </span>
                )}
              </div>

              {best && (
                <dl className="relative mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <dt className="flex items-center gap-2 text-xs text-muted">
                      <Skull size={14} /> 击杀
                    </dt>
                    <dd className="mt-1 text-2xl font-bold">{best.stats.kills}</dd>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <dt className="flex items-center gap-2 text-xs text-muted">
                      <Sword size={14} /> 造成伤害
                    </dt>
                    <dd className="mt-1 text-2xl font-bold">
                      {Math.floor(best.stats.damageDealt)}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <dt className="flex items-center gap-2 text-xs text-muted">
                      <Clock size={14} /> 存活时间
                    </dt>
                    <dd className="mt-1 text-2xl font-bold">{formatTime(best.elapsed)}</dd>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <dt className="flex items-center gap-2 text-xs text-muted">
                      <Target size={14} /> 完成任务
                    </dt>
                    <dd className="mt-1 text-2xl font-bold">{best.completedMissions}</dd>
                  </div>
                </dl>
              )}
            </motion.div>
          </div>
        </div>

        <section className="relative z-10 mt-20">
          <SectionHeader title="全球榜单" align="center" />
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto mt-8 max-w-xl rounded-3xl border border-border bg-panel p-8 text-center md:p-12"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background">
              <Globe size={24} className="text-muted" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">全球排行榜尚未启用</h3>
            <p className="mt-2 text-sm text-muted">
              当前版本优先打磨本地战斗与联机合作体验。全球排行榜功能将在后续版本中作为可选功能开启。
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              开发中
            </div>
          </motion.div>
        </section>
      </div>
    </Layout>
  );
}
