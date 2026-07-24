import { useEffect, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import Layout from "@/components/Layout";
import StatCard from "@/components/StatCard";
import SectionHeader from "@/components/SectionHeader";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
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
  ArrowClockwise,
  Funnel,
} from "@phosphor-icons/react";
import { loadSave, type SaveData } from "@/lib/game/save";
import { formatTime } from "@/lib/game/math";
import { useLeaderboard, submitLeaderboardEntry } from "@/hooks/useLeaderboard";

const modeNames: Record<string, string> = {
  campaign: "战役模式",
  endless: "无尽生存",
  daily: "每日挑战",
  roguelike: "冒险模式",
  defense: "据点防守",
  deathmatch: "个人死斗",
  survival: "生存模式",
};

const MODE_OPTIONS = [
  { value: "", label: "全部模式" },
  { value: "survival", label: "生存模式" },
  { value: "defense", label: "据点防守" },
  { value: "deathmatch", label: "个人死斗" },
  { value: "campaign", label: "战役模式" },
  { value: "endless", label: "无尽生存" },
  { value: "daily", label: "每日挑战" },
  { value: "roguelike", label: "冒险模式" },
];

function GlobalLeaderboard({ modeFilter }: { modeFilter: string }) {
  const { entries, loading, error, refetch } = useLeaderboard({ mode: modeFilter || undefined, limit: 10 });
  const reducedMotion = useReducedMotion();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button variant="secondary" size="sm" leftIcon={<ArrowClockwise size={14} weight="bold" />} onClick={refetch}>
          刷新
        </Button>
      </div>

      {loading && <Skeleton count={5} className="h-11" />}
      {error && <ErrorState error={error} onRetry={refetch} />}
      {!loading && !error && entries.length === 0 && (
        <EmptyState
          title="暂无全球记录"
          description="成为第一个上榜的幸存者，去生存模式挑战高分吧"
          action={
            <Link href="/game?mode=survival">
              <Button size="sm" leftIcon={<Play size={14} weight="fill" />}>
                开始挑战
              </Button>
            </Link>
          }
        />
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel-raised text-[10px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-3 py-2">排名</th>
                <th className="px-3 py-2">玩家</th>
                <th className="px-3 py-2">模式</th>
                <th className="px-3 py-2 text-right">击杀</th>
                <th className="px-3 py-2 text-right">波次</th>
                <th className="px-3 py-2 text-right">分数</th>
                <th className="px-3 py-2 text-right">时长</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <AnimatePresence>
                {entries.map((entry, index) => (
                  <motion.tr
                    key={entry.id}
                    initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="bg-panel hover:bg-panel-raised/50"
                  >
                    <td className="px-3 py-2">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                          index === 0
                            ? "bg-warning/15 text-warning"
                            : index === 1
                              ? "bg-muted/15 text-muted"
                              : index === 2
                                ? "bg-accent/15 text-accent"
                                : "bg-border text-muted"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium">{entry.player_name}</td>
                    <td className="px-3 py-2 text-muted">{modeNames[entry.mode] ?? entry.mode}</td>
                    <td className="px-3 py-2 text-right font-mono">{entry.kills}</td>
                    <td className="px-3 py-2 text-right font-mono">{entry.waves}</td>
                    <td className="px-3 py-2 text-right font-mono text-primary">{entry.score.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-mono text-[10px] text-muted">{entry.duration}s</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const [save, setSave] = useState<SaveData | null>(null);
  const [modeFilter, setModeFilter] = useState("survival");
  const [playerName, setPlayerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const best = save?.bestRun;

  const handleSubmit = async () => {
    if (!best) return;
    const name = playerName.trim() || "匿名幸存者";
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      await submitLeaderboardEntry({
        player_name: name,
        mode: best.mode,
        kills: best.stats.kills,
        waves: best.stats.wavesCleared ?? 0,
        score: best.stats.score ?? best.stats.kills * 10 + (best.stats.wavesCleared ?? 0) * 50,
        duration: best.elapsed,
      });
      setSubmitSuccess(true);
      setPlayerName("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="战绩">
      <Head>
        <title>战绩 - Project M</title>
      </Head>
      <div className="relative mx-auto max-w-6xl px-4 py-4 md:py-6">
        <div className="grid gap-4 md:grid-cols-12 md:gap-6">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="md:col-span-5"
          >
            <span className="inline-block rounded bg-accent/10 px-2 py-1 font-mono text-xs uppercase tracking-widest text-accent">
              作战记录
            </span>
            <h1 className="mt-2 text-2xl font-bold leading-[1.1] tracking-tight md:text-4xl">
              你的最佳撤离记录。
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              本地保存历史最佳，也可提交到全球排行榜。
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/game"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-background shadow-lg shadow-primary/15 transition-all hover:bg-primary/90 focus-ring active:scale-95"
              >
                <Play size={16} weight="fill" />
                <span className="whitespace-nowrap">再开一局</span>
              </Link>
              <Link
                href="/base"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-panel px-4 py-2.5 text-sm font-medium transition-all hover:border-primary/40 hover:bg-panel-raised focus-ring active:scale-95"
              >
                <Crosshair size={16} />
                <span className="whitespace-nowrap">查看基地</span>
              </Link>
            </div>
          </motion.div>

          <div className="md:col-span-7">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
              className="relative mt-3 overflow-hidden rounded-2xl border border-border bg-panel p-4"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-muted">最佳记录</p>
                  {best ? (
                    <>
                      <p className="mt-1 text-2xl font-bold">
                        {best.victory ? "撤离成功" : "任务失败"}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">
                        {modeNames[best.mode] ?? best.mode} · {formatTime(best.elapsed)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-base font-medium">暂无记录</p>
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
                <dl className="relative mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-background p-3">
                    <dt className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted">
                      <Skull size={12} /> 击杀
                    </dt>
                    <dd className="mt-0.5 text-xl font-bold">{best.stats.kills}</dd>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <dt className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted">
                      <Sword size={12} /> 造成伤害
                    </dt>
                    <dd className="mt-0.5 text-xl font-bold">{Math.floor(best.stats.damageDealt)}</dd>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <dt className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted">
                      <Clock size={12} /> 存活时间
                    </dt>
                    <dd className="mt-0.5 text-xl font-bold">{formatTime(best.elapsed)}</dd>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3">
                    <dt className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted">
                      <Target size={12} /> 完成任务
                    </dt>
                    <dd className="mt-0.5 text-xl font-bold">{best.completedMissions}</dd>
                  </div>
                </dl>
              )}

              {best && (
                <div className="relative mt-4 rounded-2xl border border-border bg-background/50 p-3">
                  <p className="text-xs font-medium text-muted">提交到全球排行榜</p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="输入玩家名称"
                      maxLength={32}
                      className="sm:max-w-[200px]"
                    />
                    <Button
                      loading={submitting}
                      leftIcon={<Globe size={14} />}
                      onClick={handleSubmit}
                      className="sm:w-auto"
                    >
                      提交成绩
                    </Button>
                  </div>
                  {submitError && <p className="mt-1 text-xs text-danger">{submitError}</p>}
                  {submitSuccess && <p className="mt-1 text-xs text-success">提交成功！</p>}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        <section className="relative z-10 mt-6 md:mt-8">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">全球榜单</h2>
            <div className="flex items-center gap-2">
              <Funnel size={14} className="text-muted" />
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="h-9 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {MODE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <GlobalLeaderboard modeFilter={modeFilter} />
        </section>
      </div>
    </Layout>
  );
}
