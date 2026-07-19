import { useRouter } from "next/router";
import { motion } from "framer-motion";
import type { RunResult } from "@/lib/game/types";
import { formatTime } from "@/lib/game/math";
import {
  Trophy,
  Skull,
  Clock,
  Sword,
  Target,
  ChartBar,
  House,
  ArrowClockwise,
} from "@phosphor-icons/react";

interface RunEndModalProps {
  result: RunResult;
  onRestart: () => void;
  onExit?: () => void;
}

export default function RunEndModal({ result, onRestart, onExit }: RunEndModalProps) {
  const router = useRouter();

  const victory = result.victory;
  const accentColor = victory ? "text-success" : "text-danger";
  const accentBorder = victory ? "border-success/30" : "border-danger/30";
  const accentBg = victory ? "bg-success/10" : "bg-danger/10";
  const TitleIcon = victory ? Trophy : Skull;

  const stats = [
    { label: "击杀", value: result.stats.kills, icon: Sword },
    { label: "存活时间", value: formatTime(result.elapsed), icon: Clock },
    { label: "造成伤害", value: Math.floor(result.stats.damageDealt), icon: Target },
    { label: "完成任务", value: result.completedMissions, icon: ChartBar },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl"
      >
        <div
          className={`absolute inset-x-0 top-0 h-1 ${
            victory
              ? "bg-gradient-to-r from-success/0 via-success/60 to-success/0"
              : "bg-gradient-to-r from-danger/0 via-danger/60 to-danger/0"
          }`}
        />

        <div className="p-6 text-center md:p-8">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${accentBorder} ${accentBg}`}
          >
            <TitleIcon size={32} weight="bold" className={accentColor} />
          </div>
          <h2 className={`mt-5 text-3xl font-bold tracking-tight ${accentColor}`}>
            {victory ? "撤离成功" : "任务失败"}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            {victory
              ? "你已完成全部任务并安全撤离。数据已保存到本地战绩。"
              : "信号中断，等待下一次部署。总结经验后再次尝试。"}
          </p>
        </div>

        <div className="px-6 md:px-8">
          <div className="grid grid-flow-dense grid-cols-2 gap-3">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const isWide = index === 0 && stats.length > 1;

              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className={`rounded-2xl border border-border bg-[var(--panel-raised)] p-4 ${
                    isWide ? "col-span-2 sm:col-span-1" : "col-span-1"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <Icon size={12} weight="bold" />
                    {stat.label}
                  </div>
                  <p className="mt-2 font-mono text-2xl font-bold">{stat.value}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 p-6 md:flex-row md:justify-center md:p-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onExit ?? (() => router.push("/"))}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-[var(--panel-raised)] focus-ring"
          >
            <House size={16} weight="bold" />
            返回指挥部
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRestart}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-background transition-shadow hover:shadow-lg focus-ring ${
              victory ? "bg-success hover:shadow-success/20" : "bg-primary hover:shadow-primary/20"
            }`}
          >
            <ArrowClockwise size={16} weight="bold" />
            再次部署
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
