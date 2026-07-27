import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Head from "next/head";
import Layout from "@/components/Layout";
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
  Star,
  Crown,
  Medal,
  Lightning,
  UserCircle,
  Fire,
  Timer,
  WaveSquare,
  NumberCircleOne,
  NumberCircleTwo,
  NumberCircleThree,
  Rocket,
  CaretRight,
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
  "extreme-survival": "极限生存",
  "peak-challenge": "巅峰挑战",
  "flagship": "旗舰模式",
};

const MODE_OPTIONS = [
  { value: "", label: "全部模式", icon: Globe },
  { value: "peak-challenge", label: "巅峰挑战", icon: Crown },
  { value: "flagship", label: "旗舰模式", icon: Rocket },
  { value: "extreme-survival", label: "极限生存", icon: Fire },
  { value: "survival", label: "生存模式", icon: Target },
  { value: "defense", label: "据点防守", icon: Shield },
  { value: "deathmatch", label: "个人死斗", icon: Crosshair },
  { value: "campaign", label: "战役模式", icon: Sword },
  { value: "endless", label: "无尽生存", icon: Timer },
  { value: "daily", label: "每日挑战", icon: Star },
  { value: "roguelike", label: "冒险模式", icon: Lightning },
];

const PODIUM_COLORS: Record<number, { bg: string; border: string; text: string; glow: string; icon: typeof Trophy }> = {
  0: {
    bg: "bg-warning/10",
    border: "border-warning/30",
    text: "text-warning",
    glow: "bg-warning/10",
    icon: Crown,
  },
  1: {
    bg: "bg-muted/10",
    border: "border-muted/20",
    text: "text-muted",
    glow: "bg-muted/10",
    icon: Medal,
  },
  2: {
    bg: "bg-accent/10",
    border: "border-accent/20",
    text: "text-accent",
    glow: "bg-accent/10",
    icon: Trophy,
  },
};

const RANK_ICONS: Record<number, typeof NumberCircleOne> = {
  0: NumberCircleOne,
  1: NumberCircleTwo,
  2: NumberCircleThree,
};

function PodiumCard({
  entry,
  rank,
  isCompact,
}: {
  entry: { player_name: string; mode: string; score: number; kills: number; waves: number; duration: number };
  rank: number;
  isCompact?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const colors = PODIUM_COLORS[rank] ?? { bg: "bg-panel", border: "border-border", text: "text-foreground", glow: "bg-primary/5", icon: Trophy };
  const RankIcon = RANK_ICONS[rank];

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: rank * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-2xl border ${colors.border} ${colors.bg} p-3 md:p-4`}
    >
      <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full ${colors.glow} blur-3xl transition-opacity duration-700 group-hover:opacity-80`} />
      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background/60">
          {RankIcon ? (
            <RankIcon size={28} weight="fill" className={colors.text} />
          ) : (
            <span className={`text-lg font-bold ${colors.text}`}>{rank + 1}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold">{entry.player_name}</p>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
              #{rank + 1}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted">{modeNames[entry.mode] ?? entry.mode}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-muted">
              <Skull size={11} weight="bold" className="text-danger/70" />
              <span className="font-mono">{entry.kills}</span>
            </span>
            <span className="flex items-center gap-1 text-muted">
              <WaveSquare size={11} weight="bold" className="text-primary/70" />
              <span className="font-mono">{entry.waves}</span>
            </span>
            <span className="flex items-center gap-1 text-muted">
              <Timer size={11} weight="bold" />
              <span className="font-mono">{entry.duration}s</span>
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-mono text-lg font-bold md:text-xl ${colors.text}`}>
            {entry.score.toLocaleString()}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted">分数</p>
        </div>
      </div>
    </motion.div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 0) {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-warning/15">
        <Crown size={14} weight="fill" className="text-warning" />
      </span>
    );
  }
  if (rank === 1) {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/10">
        <Medal size={14} weight="fill" className="text-muted" />
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15">
        <Trophy size={14} weight="fill" className="text-accent" />
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-border/30">
      <span className="text-[10px] font-bold text-muted">{rank + 1}</span>
    </span>
  );
}

function GlobalLeaderboard({ modeFilter }: { modeFilter: string }) {
  const { entries, loading, error, refetch } = useLeaderboard({ mode: modeFilter || undefined, limit: 20 });
  const reducedMotion = useReducedMotion();

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button variant="secondary" size="sm" leftIcon={<ArrowClockwise size={14} weight="bold" />} onClick={refetch}>
          刷新
        </Button>
      </div>

      {loading && (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton count={5} className="h-11" />
        </div>
      )}

      {error && <ErrorState error={error} onRetry={refetch} />}

      {!loading && !error && entries.length === 0 && (
        <EmptyState
          icon={<Trophy size={40} weight="duotone" />}
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
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            <AnimatePresence>
              {podium.map((entry, i) => (
                <PodiumCard key={entry.id} entry={entry} rank={i} />
              ))}
            </AnimatePresence>
          </div>

          {rest.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-panel-raised/95 backdrop-blur-sm">
                    <tr className="text-[10px] uppercase tracking-wider text-muted">
                      <th className="w-12 px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">玩家</th>
                      <th className="hidden px-3 py-2.5 sm:table-cell">模式</th>
                      <th className="hidden px-3 py-2.5 text-right md:table-cell">击杀</th>
                      <th className="hidden px-3 py-2.5 text-right md:table-cell">波次</th>
                      <th className="px-3 py-2.5 text-right">分数</th>
                      <th className="hidden px-3 py-2.5 text-right sm:table-cell">时长</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <AnimatePresence>
                      {rest.map((entry, i) => {
                        const rank = i + 3;
                        return (
                          <motion.tr
                            key={entry.id}
                            initial={reducedMotion ? undefined : { opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.3 }}
                            className="group bg-panel transition-colors hover:bg-panel-raised/50"
                          >
                            <td className="px-3 py-2.5">
                              <RankBadge rank={rank} />
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-background">
                                  <UserCircle size={14} weight="bold" className="text-muted" />
                                </div>
                                <span className="truncate text-sm font-medium">{entry.player_name}</span>
                              </div>
                            </td>
                            <td className="hidden px-3 py-2.5 text-[11px] text-muted sm:table-cell">
                              {modeNames[entry.mode] ?? entry.mode}
                            </td>
                            <td className="hidden px-3 py-2.5 text-right font-mono text-[11px] md:table-cell">
                              {entry.kills}
                            </td>
                            <td className="hidden px-3 py-2.5 text-right font-mono text-[11px] md:table-cell">
                              {entry.waves}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <span className="font-mono text-sm font-bold text-primary">
                                {entry.score.toLocaleString()}
                              </span>
                            </td>
                            <td className="hidden px-3 py-2.5 text-right font-mono text-[10px] text-muted sm:table-cell">
                              {entry.duration}s
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SeasonTier({ xp }: { xp: number }) {
  const tiers = useMemo(() => {
    const list = [
      { min: 0, name: "青铜", color: "#b85c3a", icon: Shield },
      { min: 500, name: "白银", color: "#a0a8b8", icon: Sword },
      { min: 1500, name: "黄金", color: "#d4a843", icon: Crown },
      { min: 4000, name: "铂金", color: "#6ec6d8", icon: Star },
      { min: 8000, name: "钻石", color: "#8b7cf0", icon: Lightning },
      { min: 15000, name: "大师", color: "#f05a7e", icon: Fire },
      { min: 25000, name: "宗师", color: "#f59e0b", icon: Trophy },
    ];
    let current = list[0];
    let next = list[1];
    for (let i = list.length - 1; i >= 0; i--) {
      if (xp >= list[i].min) {
        current = list[i];
        next = list[i + 1] ?? list[i];
        break;
      }
    }
    const progress = next.min > current.min
      ? Math.min(100, Math.round(((xp - current.min) / (next.min - current.min)) * 100))
      : 100;
    return { current, next, progress };
  }, [xp]);

  const { current, next, progress } = tiers;
  const Icon = current.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-panel p-3">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: current.color }} />
      <div className="relative flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${current.color}18`, border: `1px solid ${current.color}30` }}>
          <Icon size={24} weight="fill" style={{ color: current.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest text-muted">赛季段位</p>
          <p className="text-lg font-bold" style={{ color: current.color }}>{current.name}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ backgroundColor: current.color }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted">
              {xp.toLocaleString()} / {next.min.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalStatsPanel({ save }: { save: SaveData | null }) {
  const best = save?.bestRun;
  const reducedMotion = useReducedMotion();

  return (
    <div className="space-y-2">
      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-2"
      >
        <SeasonTier xp={save?.seasonXp ?? 0} />

        <div className="grid grid-cols-2 gap-2">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-panel p-2.5 transition-colors hover:bg-panel-raised"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 h-24 w-24 rounded-full bg-primary/5 blur-3xl transition-opacity group-hover:opacity-60" />
            <div className="relative flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">总出战</p>
              <Target size={16} weight="bold" className="text-muted transition-colors group-hover:text-foreground" />
            </div>
            <p className="relative mt-1 text-xl font-bold">{save?.totalRuns ?? 0}</p>
          </motion.div>

          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-panel p-2.5 transition-colors hover:bg-panel-raised"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-danger/5 blur-3xl transition-opacity group-hover:opacity-60" />
            <div className="relative flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">累计击杀</p>
              <Skull size={16} weight="bold" className="text-muted transition-colors group-hover:text-danger/70" />
            </div>
            <p className="relative mt-1 text-xl font-bold">{save?.totalKills ?? 0}</p>
          </motion.div>

          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-panel p-2.5 transition-colors hover:bg-panel-raised"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-warning/5 blur-3xl transition-opacity group-hover:opacity-60" />
            <div className="relative flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">最佳击杀</p>
              <Trophy size={16} weight="bold" className="text-muted transition-colors group-hover:text-warning" />
            </div>
            <p className="relative mt-1 text-xl font-bold">{best?.stats.kills ?? 0}</p>
          </motion.div>

          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-panel p-2.5 transition-colors hover:bg-panel-raised"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-success/5 blur-3xl transition-opacity group-hover:opacity-60" />
            <div className="relative flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">赛季 XP</p>
              <Star size={16} weight="bold" className="text-muted transition-colors group-hover:text-success" />
            </div>
            <p className="relative mt-1 text-xl font-bold">{(save?.seasonXp ?? 0).toLocaleString()}</p>
          </motion.div>
        </div>
      </motion.div>

      {best && (
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-panel p-3"
        >
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">最近最佳</p>
              <p className="mt-1 text-lg font-bold">
                {best.victory ? "撤离成功" : "任务失败"}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                {modeNames[best.mode] ?? best.mode} · {formatTime(best.elapsed)}
                {best.mode === "peak-challenge" && best.peakChallengePhase && (
                  <span className="ml-1.5">· {best.peakChallengePhase === "overclock" ? "超频" : "普通"}</span>
                )}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                best.victory ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
              }`}
            >
              {best.victory ? (
                <Shield size={12} weight="bold" />
              ) : (
                <Crosshair size={12} weight="bold" />
              )}
              {best.victory ? "胜利" : "失败"}
            </span>
          </div>

          <dl className="relative mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-background/60 p-2">
              <dt className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-muted">
                <Skull size={10} weight="bold" /> 击杀
              </dt>
              <dd className="mt-0.5 font-mono text-sm font-bold">{best.stats.kills}</dd>
            </div>
            <div className="rounded-xl border border-border bg-background/60 p-2">
              <dt className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-muted">
                <Sword size={10} weight="bold" /> 伤害
              </dt>
              <dd className="mt-0.5 font-mono text-sm font-bold">{Math.floor(best.stats.damageDealt).toLocaleString()}</dd>
            </div>
            <div className="rounded-xl border border-border bg-background/60 p-2">
              <dt className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-muted">
                <Clock size={10} weight="bold" /> 存活
              </dt>
              <dd className="mt-0.5 font-mono text-sm font-bold">{formatTime(best.elapsed)}</dd>
            </div>
            <div className="rounded-xl border border-border bg-background/60 p-2">
              <dt className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-muted">
                <Target size={10} weight="bold" /> 任务
              </dt>
              <dd className="mt-0.5 font-mono text-sm font-bold">{best.completedMissions}</dd>
            </div>
          </dl>
        </motion.div>
      )}
    </div>
  );
}

function SubmitPanel({
  best,
  playerName,
  setPlayerName,
  submitting,
  submitError,
  submitSuccess,
  onSubmit,
}: {
  best: SaveData["bestRun"] | null | undefined;
  playerName: string;
  setPlayerName: (v: string) => void;
  submitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  onSubmit: () => void;
}) {
  if (!best) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-panel p-3"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/5 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <Globe size={18} weight="bold" className="text-primary" />
          <p className="text-sm font-semibold">提交到全球排行榜</p>
        </div>
        <p className="mt-1 text-[11px] text-muted">将你的最佳成绩上传到全球服务器，与其他幸存者一较高下。</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="输入玩家名称"
            maxLength={32}
            className="sm:max-w-[200px]"
          />
          <Button
            loading={submitting}
            leftIcon={<Rocket size={14} weight="fill" />}
            onClick={onSubmit}
            className="sm:w-auto"
          >
            提交成绩
          </Button>
        </div>
        {submitError && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
            <CaretRight size={12} weight="bold" />
            {submitError}
          </p>
        )}
        {submitSuccess && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-success">
            <CaretRight size={12} weight="bold" />
            提交成功！刷新榜单查看你的排名。
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const [save, setSave] = useState<SaveData | null>(null);
  const [modeFilter, setModeFilter] = useState("");
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
    if (best.mode === "extreme-survival" && best.extremeSurvivalPhase !== "overclock") {
      setSubmitError("极限生存模式仅记录进入超频极限阶段的 run");
      return;
    }
    if (best.mode === "peak-challenge" && best.peakChallengePhase !== "overclock") {
      setSubmitError("巅峰挑战排行榜仅记录进入超频阶段的 run");
      return;
    }
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
      <div className="relative mx-auto max-w-7xl px-4 py-3 md:py-4">
        <div className="grid gap-3 lg:grid-cols-12 lg:gap-4">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-4"
          >
            <span className="inline-block rounded bg-primary/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-primary">
              作战记录
            </span>
            <h1 className="mt-2 text-xl font-bold leading-[1.1] tracking-tight md:text-3xl">
              你的最佳撤离记录。
            </h1>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">
              本地保存历史最佳，也可提交到全球排行榜。每次挑战都是新的攀登。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/game"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-background shadow-lg shadow-primary/15 transition-all hover:bg-primary/90 focus-ring active:scale-95"
              >
                <Play size={16} weight="fill" />
                <span className="whitespace-nowrap">再开一局</span>
              </Link>
              <Link
                href="/base"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-panel px-4 py-2 text-sm font-medium transition-all hover:border-primary/40 hover:bg-panel-raised focus-ring active:scale-95"
              >
                <Crosshair size={16} />
                <span className="whitespace-nowrap">查看基地</span>
              </Link>
            </div>

            <div className="mt-4">
              <PersonalStatsPanel save={save} />
            </div>
          </motion.div>

          <div className="lg:col-span-8">
            <section>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Globe size={20} weight="bold" className="text-primary" />
                  <h2 className="text-lg font-bold tracking-tight md:text-xl">全球榜单</h2>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {MODE_OPTIONS.map((opt) => {
                    const isActive = modeFilter === opt.value;
                    const OptIcon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setModeFilter(opt.value)}
                        className={`flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                          isActive
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border bg-panel text-muted hover:border-primary/20 hover:bg-panel-raised hover:text-foreground"
                        }`}
                      >
                        <OptIcon size={12} weight={isActive ? "fill" : "bold"} />
                        <span className="whitespace-nowrap">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <GlobalLeaderboard modeFilter={modeFilter} />
            </section>

            <div className="mt-4">
              <SubmitPanel
                best={best}
                playerName={playerName}
                setPlayerName={setPlayerName}
                submitting={submitting}
                submitError={submitError}
                submitSuccess={submitSuccess}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}