import { useCallback } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Skull,
  Lightning,
  Warning,
  Clock,
  Crosshair,
  Gauge,
  Heart,
  Drop,
  Star,
  ArrowRight,
} from "@phosphor-icons/react";
import type { DifficultyPreset, DifficultyPresetConfig } from "@/lib/game/types";
import { DIFFICULTY_PRESETS } from "@/lib/game/types";
import Button from "@/components/ui/Button";

export interface DifficultySelectorProps {
  open: boolean;
  onSelect: (preset: DifficultyPreset) => void;
  modeName?: string;
}

export default function DifficultySelector({ open, onSelect, modeName = "据点防守" }: DifficultySelectorProps) {
  const reducedMotion = useReducedMotion();

  const handleSelect = useCallback(
    (preset: DifficultyPreset) => {
      onSelect(preset);
    },
    [onSelect]
  );

  const transition = reducedMotion
    ? { duration: 0.01 }
    : { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          key="difficulty-selector"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reducedMotion ? { duration: 0.01 } : { duration: 0.3 }}
          className="fixed inset-0 z-[210] flex min-h-[100dvh] items-center justify-center bg-background/95 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="difficulty-title"
        >
          <div className="noise-overlay" />
          <div className="pointer-events-none absolute inset-0 dot-grid opacity-20" />
          <div className="pointer-events-none absolute inset-0 starfield opacity-30" />

          <motion.div
            className="relative z-10 w-full max-w-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={transition}
          >
            <div className="relative overflow-hidden rounded-3xl border border-border bg-panel/90 p-6 shadow-2xl shadow-primary/10 backdrop-blur-xl md:p-10">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary-subtle blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-anchor-subtle blur-3xl" />

              <div className="relative">
                <div className="mb-6 flex items-center gap-3">
                  <span className="orbital-ring inline-flex h-10 w-10 items-center justify-center text-primary">
                    <Crosshair size={20} weight="bold" />
                  </span>
                  <div>
                    <h2 id="difficulty-title" className="font-mono text-sm font-bold uppercase tracking-[0.15em]">
                      选择任务强度
                    </h2>
                    <p className="text-[10px] text-muted">
                      {modeName} · 强度决定敌人密度、伤害与奖励倍率
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {(["easy", "hell"] as DifficultyPreset[]).map((preset, idx) => {
                    const config = DIFFICULTY_PRESETS[preset];
                    const isHell = preset === "hell";

                    return (
                      <motion.button
                        key={preset}
                        type="button"
                        onClick={() => handleSelect(preset)}
                        initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...transition, delay: reducedMotion ? 0 : 0.1 + idx * 0.08 }}
                        className="group relative flex flex-col items-start gap-4 rounded-2xl border p-5 text-left transition-all hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-panel active:scale-[0.98]"
                        style={{
                          borderColor: isHell ? "var(--caution)30" : "var(--success)30",
                          backgroundColor: isHell ? "var(--caution)08" : "var(--success)06",
                        }}
                      >
                        <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100"
                          style={{
                            background: isHell
                              ? "radial-gradient(circle at 50% -20%, var(--caution)15, transparent 70%)"
                              : "radial-gradient(circle at 50% -20%, var(--success)10, transparent 70%)",
                          }}
                        />

                        <div className="relative flex items-center gap-3">
                          <span
                            className="inline-flex h-12 w-12 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: isHell ? "var(--caution)15" : "var(--success)15",
                              color: config.accentColor,
                            }}
                          >
                            {isHell ? <Skull size={24} weight="bold" /> : <Shield size={24} weight="bold" />}
                          </span>
                          <div>
                            <h3 className="text-base font-bold">{config.label}</h3>
                            <span
                              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase"
                              style={{
                                borderColor: `${config.accentColor}40`,
                                color: config.accentColor,
                                backgroundColor: `${config.accentColor}10`,
                              }}
                            >
                              <Warning size={10} weight="bold" />
                              {config.threatLabel}
                            </span>
                          </div>
                        </div>

                        <p className="relative text-xs leading-relaxed text-muted">
                          {config.description}
                        </p>

                        <div className="relative grid w-full grid-cols-2 gap-x-4 gap-y-2">
                          <StatRow
                            icon={Heart}
                            label="敌人血量"
                            value={`×${config.enemyHealthMultiplier}`}
                            isHell={isHell}
                          />
                          <StatRow
                            icon={Lightning}
                            label="敌人伤害"
                            value={`×${config.enemyDamageMultiplier}`}
                            isHell={isHell}
                          />
                          <StatRow
                            icon={Star}
                            label="经验倍率"
                            value={`×${config.xpMultiplier}`}
                            isHell={isHell}
                            positive
                          />
                          <StatRow
                            icon={Drop}
                            label="掉落倍率"
                            value={`×${config.dropRateMultiplier}`}
                            isHell={isHell}
                            positive
                          />
                          <StatRow
                            icon={Clock}
                            label="补给时间"
                            value={`${config.breakDuration}s`}
                            isHell={isHell}
                          />
                          <StatRow
                            icon={Gauge}
                            label="刷怪密度"
                            value={`×${(1 / config.spawnIntervalMultiplier).toFixed(1)}`}
                            isHell={isHell}
                          />
                        </div>

                        <div className="relative mt-2 w-full">
                          <Button
                            size="sm"
                            className="w-full"
                            rightIcon={<ArrowRight size={14} weight="bold" />}
                            style={{
                              background: isHell ? "var(--caution)" : "var(--success)",
                              color: "#fff",
                            }}
                          >
                            {isHell ? "突入地狱维度" : "开始标准巡航"}
                          </Button>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-muted">
                  <Shield size={12} weight="bold" />
                  选择后不可更改 · 公平竞技 · 无付费加成
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
  isHell,
  positive = false,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
  isHell: boolean;
  positive?: boolean;
}) {
  const valueColor = positive
    ? "var(--success)"
    : isHell
    ? "var(--caution)"
    : "var(--success)";

  return (
    <div className="flex items-center gap-1.5">
      <Icon size={11} weight="bold" className="text-muted shrink-0" />
      <span className="text-[10px] text-muted">{label}</span>
      <span className="ml-auto font-mono text-[10px] font-bold tabular-nums" style={{ color: valueColor }}>
        {value}
      </span>
    </div>
  );
}