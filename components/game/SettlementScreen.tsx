import { useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Trophy,
  Skull,
  Clock,
  Target,
  Coins,
  TrendUp,
  ArrowCounterClockwise,
  House,
  GameController,
  Star,
  Shield,
} from "@phosphor-icons/react";

export interface SettlementStat {
  label: string;
  value: number;
  suffix?: string;
  best?: number;
}

export interface SettlementReward {
  id: string;
  name: string;
  amount: number;
  type: "credit" | "token" | "unlock" | "title";
}

export interface SettlementScreenProps {
  result: "victory" | "defeat";
  modeName: string;
  durationSeconds: number;
  kills: number;
  waves: number;
  stats: SettlementStat[];
  rewards?: SettlementReward[];
  newRecord?: boolean;
  onRestart: () => void;
  onExit: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function RewardIcon({ type }: { type: SettlementReward["type"] }) {
  switch (type) {
    case "credit":
      return <Coins size={18} weight="bold" className="text-accent" />;
    case "token":
      return <Star size={18} weight="bold" className="text-warning" />;
    case "unlock":
      return <GameController size={18} weight="bold" className="text-primary" />;
    case "title":
      return <Trophy size={18} weight="bold" className="text-success" />;
    default:
      return <Coins size={18} weight="bold" className="text-accent" />;
  }
}

export default function SettlementScreen({
  result,
  modeName,
  durationSeconds,
  kills,
  waves,
  stats,
  rewards = [],
  newRecord = false,
  onRestart,
  onExit,
}: SettlementScreenProps) {
  const reducedMotion = useReducedMotion();
  const isVictory = result === "victory";

  const headerGradient = useMemo(
    () =>
      isVictory
        ? "from-primary/20 via-transparent to-transparent"
        : "from-danger/20 via-transparent to-transparent",
    [isVictory]
  );

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/95 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settlement-title"
    >
      <motion.div
        variants={reducedMotion ? undefined : containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-panel shadow-2xl"
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b ${headerGradient}`}
        />

        <header className="relative p-6 text-center md:p-10">
          <motion.div
            variants={reducedMotion ? undefined : itemVariants}
            className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl border bg-panel-raised shadow-lg"
          >
            {isVictory ? (
              <Trophy size={32} weight="bold" className="text-primary" />
            ) : (
              <Skull size={32} weight="bold" className="text-danger" />
            )}
          </motion.div>

          <motion.h1
            id="settlement-title"
            variants={reducedMotion ? undefined : itemVariants}
            className={`mt-5 text-3xl font-bold tracking-tight md:text-5xl ${
              isVictory ? "text-primary" : "text-danger"
            }`}
          >
            {isVictory ? "任务完成" : "任务失败"}
          </motion.h1>

          <motion.p
            variants={reducedMotion ? undefined : itemVariants}
            className="mx-auto mt-2 max-w-md text-sm text-muted"
          >
            {modeName}
            {newRecord && (
              <span className="ml-2 inline-flex items-center gap-1 rounded bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
                <Star size={12} weight="fill" />
                新纪录
              </span>
            )}
          </motion.p>
        </header>

        <motion.section
          variants={reducedMotion ? undefined : itemVariants}
          className="relative grid grid-cols-3 gap-px overflow-hidden border-y border-border bg-border"
        >
          <div className="bg-panel p-4 text-center">
            <Clock size={20} className="mx-auto text-muted" />
            <p className="mt-2 font-mono text-xl font-bold md:text-2xl">
              {formatDuration(durationSeconds)}
            </p>
            <p className="text-xs text-muted">用时</p>
          </div>
          <div className="bg-panel p-4 text-center">
            <Target size={20} className="mx-auto text-muted" />
            <p className="mt-2 font-mono text-xl font-bold md:text-2xl">{kills}</p>
            <p className="text-xs text-muted">击杀</p>
          </div>
          <div className="bg-panel p-4 text-center">
            <Shield size={20} className="mx-auto text-muted" />
            <p className="mt-2 font-mono text-xl font-bold md:text-2xl">{waves}</p>
            <p className="text-xs text-muted">波次</p>
          </div>
        </motion.section>

        <div className="relative grid gap-6 p-6 md:grid-cols-2 md:p-10">
          <motion.section variants={reducedMotion ? undefined : itemVariants}>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
              <TrendUp size={16} weight="bold" />
              详细数据
            </h2>
            <div className="mt-4 space-y-3">
              {stats.map((stat) => {
                const isNewBest = stat.best !== undefined && stat.value >= stat.best;
                return (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between rounded-xl border border-border bg-panel-raised px-4 py-3"
                  >
                    <span className="text-sm text-muted">{stat.label}</span>
                    <div className="flex items-center gap-2">
                      {isNewBest && <Star size={12} weight="fill" className="text-warning" />}
                      <span className="font-mono text-base font-bold md:text-lg">
                        {stat.value}
                        {stat.suffix ?? ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>

          <motion.section variants={reducedMotion ? undefined : itemVariants}>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
              <Coins size={16} weight="bold" />
              获得奖励
            </h2>
            <AnimatePresence mode="popLayout">
              {rewards.length === 0 ? (
                <motion.div
                  initial={reducedMotion ? undefined : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 rounded-xl border border-dashed border-border bg-panel-raised p-6 text-center"
                >
                  <p className="text-sm text-muted">本次没有额外奖励</p>
                </motion.div>
              ) : (
                <div className="mt-4 space-y-2">
                  {rewards.map((reward, index) => (
                    <motion.div
                      key={reward.id}
                      layout={!reducedMotion}
                      initial={reducedMotion ? undefined : { opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between rounded-xl border border-border bg-panel-raised px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-background">
                          <RewardIcon type={reward.type} />
                        </div>
                        <span className="text-sm font-medium">{reward.name}</span>
                      </div>
                      <span className="font-mono text-sm font-bold text-foreground">
                        +{reward.amount}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </motion.section>
        </div>

        <motion.footer
          variants={reducedMotion ? undefined : itemVariants}
          className="relative flex flex-col gap-3 border-t border-border bg-panel-raised p-6 md:flex-row md:items-center md:justify-between md:p-8"
        >
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground transition-all hover:bg-panel focus-ring active:scale-95"
          >
            <House size={18} />
            <span className="whitespace-nowrap">返回主页</span>
          </button>

          <div className="flex flex-col gap-3 md:flex-row">
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground transition-all hover:bg-panel focus-ring active:scale-95"
            >
              <ArrowCounterClockwise size={18} />
              <span className="whitespace-nowrap">再次部署</span>
            </button>
            <button
              type="button"
              onClick={onRestart}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-lg transition-all focus-ring active:scale-95 ${
                isVictory
                  ? "bg-primary text-background shadow-primary/20 hover:bg-primary/90"
                  : "bg-danger text-white shadow-danger/20 hover:bg-danger/90"
              }`}
            >
              <GameController size={18} weight="fill" />
              <span className="whitespace-nowrap">{isVictory ? "继续推进" : "重整旗鼓"}</span>
            </button>
          </div>
        </motion.footer>
      </motion.div>
    </motion.div>
  );
}
