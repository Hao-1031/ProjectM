import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Star,
  Pause,
  Play,
  Warning,
  Crosshair,
  Target,
  Clock,
  Coin,
  Skull,
  Shield,
  BatteryCharging,
  Flag,
  Lightning,
  Fire,
  FlagCheckered,
  Sword,
  Sparkle,
  CaretRight,
  Plus,
  Trophy,
} from "@phosphor-icons/react";
import type { GameState } from "@/lib/game/types";
import { formatTime } from "@/lib/game/math";
import { getCurrentMission } from "@/lib/game/missions";
import { getBossTemplate } from "@/lib/game/bosses";
import type { BossId } from "@/lib/game/types";
import WaveIndicator from "./WaveIndicator";
import CoreHealthBar from "./CoreHealthBar";
import NodeStatus from "./NodeStatus";
import HeroSkillButton from "./HeroSkillButton";
import BossHealthBar from "./BossHealthBar";
import KillFeed, { type KillFeedEntry } from "./KillFeed";
import PhaseIndicator, { FlagshipPeakHudPanel } from "./PhaseIndicator";

interface HudDesktopProps {
  state: GameState;
  paused: boolean;
  onPauseToggle: () => void;
  extractionTimer: number;
  onUseSkill?: () => void;
  onUseUltimate?: () => void;
  onSurrender?: () => void;
  killFeed?: KillFeedEntry[];
}

function clampPct(value: number, max: number) {
  return `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
}

function WeaponPanel({ state }: { state: GameState }) {
  const reducedMotion = useReducedMotion();
  const player = state.player;
  const weapons = player.weapons;

  if (weapons.length === 0) return null;

  return (
    <div className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-border/60 bg-panel/85 p-3 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
          <Crosshair size={12} weight="bold" className="text-primary" />
        </span>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
          武装
        </span>
      </div>

      <div className="flex gap-2">
        {weapons.map((w) => {
          const cooldownPct = w.cooldown > 0 ? Math.min(100, (w.timer / w.cooldown) * 100) : 100;
          const ready = w.timer <= 0;
          return (
            <div
              key={w.id}
              className="group relative flex flex-col items-center gap-1 rounded-xl border border-border/40 bg-background/60 p-2 transition-all hover:border-primary/30 hover:bg-background/80"
              style={{ borderColor: ready ? `${w.color}30` : undefined }}
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-panel-raised">
                <Sword size={18} weight="bold" style={{ color: w.color }} />
                {!ready && (
                  <svg
                    className="absolute inset-0 -rotate-90"
                    viewBox="0 0 40 40"
                    width={40}
                    height={40}
                  >
                    <circle
                      cx={20}
                      cy={20}
                      r={16}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeDasharray={`${cooldownPct * 1.005} ${100 - cooldownPct * 1.005}`}
                      className="text-muted/30"
                    />
                  </svg>
                )}
              </div>
              <span className="font-mono text-[10px] font-bold" style={{ color: w.color }}>
                Lv.{w.level}
              </span>
              <AnimatePresence>
                {!ready && (
                  <motion.span
                    initial={reducedMotion ? undefined : { opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -2 }}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-background/90 px-1.5 font-mono text-[9px] font-bold text-muted"
                  >
                    {w.timer.toFixed(1)}s
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusEffectBar({ state }: { state: GameState }) {
  const player = state.player;
  const effects: { label: string; color: string; icon: typeof Sparkle }[] = [];

  if (player.armor > 0) {
    effects.push({ label: `护甲 +${player.armor}`, color: "#5e8c6a", icon: Shield });
  }
  if (player.critChance > 0) {
    effects.push({ label: `暴击 ${Math.round(player.critChance * 100)}%`, color: "#b87a3d", icon: Fire });
  }
  if (player.regen > 0) {
    effects.push({ label: `回复 +${player.regen}/s`, color: "#7a8f3e", icon: Heart });
  }
  if (player.areaMultiplier > 1) {
    effects.push({
      label: `范围 x${player.areaMultiplier.toFixed(1)}`,
      color: "#c45c4a",
      icon: Sparkle,
    });
  }

  if (effects.length === 0) return null;

  return (
    <div className="pointer-events-none flex flex-wrap gap-1">
      {effects.map((eff) => {
        const Icon = eff.icon;
        return (
          <span
            key={eff.label}
            className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm"
            style={{
              borderColor: `${eff.color}30`,
              color: eff.color,
              backgroundColor: `${eff.color}10`,
            }}
          >
            <Icon size={10} weight="bold" />
            {eff.label}
          </span>
        );
      })}
    </div>
  );
}

function HealthBar({ health, maxHealth }: { health: number; maxHealth: number }) {
  const reducedMotion = useReducedMotion();
  const pct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const isLow = pct <= 30;
  const isCritical = pct <= 15;

  return (
    <div className="relative">
      <div className="h-2.5 overflow-hidden rounded-full bg-border/50">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: isCritical
              ? "linear-gradient(90deg, #b84a55, #c45c4a)"
              : isLow
                ? "linear-gradient(90deg, #b87a3d, #b84a55)"
                : "linear-gradient(90deg, #5e8c6a, #7a8f3e)",
          }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={
            reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 180, damping: 20 }
          }
        />
        {isCritical && (
          <motion.div
            className="absolute inset-0 rounded-full bg-danger/25"
            animate={{ opacity: [0.25, 0.5, 0.25] }}
            transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>

      <div className="mt-0.5 flex items-center justify-between">
        <span className="flex items-center gap-1 font-mono text-[10px]">
          <Heart size={10} weight="bold" className={isCritical ? "text-danger" : "text-muted"} />
          <span className={isCritical ? "font-bold text-danger" : "text-muted"}>
            {Math.ceil(health)}
          </span>
          <span className="text-muted/50">/ {maxHealth}</span>
        </span>
        <span
          className="font-mono text-[10px] font-bold"
          style={{ color: isCritical ? "#b84a55" : isLow ? "#b87a3d" : "#5e8c6a" }}
        >
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}

function XpBar({ xp, xpToNext, level }: { xp: number; xpToNext: number; level: number }) {
  const reducedMotion = useReducedMotion();
  const pct = Math.max(0, Math.min(100, (xp / xpToNext) * 100));

  return (
    <div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border/50">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={
            reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 150, damping: 18 }
          }
        />
      </div>
      <div className="mt-0.5 flex items-center justify-between">
        <span className="flex items-center gap-1 font-mono text-[10px] text-muted">
          <Star size={10} weight="bold" className="text-primary" />
          Lv.{level}
        </span>
        <span className="font-mono text-[10px] text-muted/60">
          {xp} / {xpToNext}
        </span>
      </div>
    </div>
  );
}

function StatsRow({ state }: { state: GameState }) {
  return (
    <div className="pointer-events-auto flex gap-1.5">
      <StatPill icon={Skull} value={state.stats.kills} label="击杀" accent="#b84a55" />
      <StatPill icon={Clock} value={formatTime(state.stats.timeSurvived)} label="时间" accent="#5e8c6a" />
      <StatPill icon={Coin} value={state.stats.resourcesCollected} label="资源" accent="#b87a3d" />
      {state.killCombo.count >= 2 && (
        <StatPill
          icon={Fire}
          value={state.killCombo.count}
          label="连杀"
          accent="#c45c4a"
          pulse={state.killCombo.timer < 1}
          comboProgress={Math.max(0, Math.min(100, (state.killCombo.timer / 2.5) * 100))}
        />
      )}
    </div>
  );
}

function StatPill({
  icon: Icon,
  value,
  label,
  accent,
  pulse,
  comboProgress,
}: {
  icon: typeof Skull;
  value: string | number;
  label: string;
  accent: string;
  pulse?: boolean;
  comboProgress?: number;
}) {
  return (
    <div
      className="relative flex items-center gap-2 overflow-hidden rounded-xl border border-border/40 bg-panel/80 px-2.5 py-2 shadow-lg backdrop-blur-md"
      style={{ borderColor: pulse ? `${accent}50` : undefined }}
    >
      {comboProgress !== undefined && (
        <div
          className="absolute bottom-0 left-0 h-0.5 transition-all duration-200"
          style={{ width: `${comboProgress}%`, backgroundColor: accent }}
        />
      )}
      <Icon size={14} weight="bold" style={{ color: accent }} />
      <div className="text-right">
        <p className="font-mono text-sm font-bold leading-none tabular-nums text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-[9px] uppercase tracking-wider text-muted">{label}</p>
      </div>
    </div>
  );
}

export default function HudDesktop({
  state,
  paused,
  onPauseToggle,
  extractionTimer,
  onUseSkill,
  onUseUltimate,
  onSurrender,
  killFeed,
}: HudDesktopProps) {
  const reducedMotion = useReducedMotion();
  const player = state.player;
  const mission = getCurrentMission(state);
  const isFinal = state.currentMissionIndex >= state.missions.length;
  const event = state.activeEvent;
  const defense = state.defenseState;
  const activeBoss = state.enemies.find((e) => e.isBoss) ?? null;
  const activeBossTemplate = activeBoss ? getBossTemplate(activeBoss.variant as BossId) : null;
  const activeNode = defense?.nodes.find((n) => n.active && !n.captured) ?? null;
  const skill = player.activeSkill;
  const skillReady = skill ? player.skillTimer <= 0 : false;
  const ultimate = player.ultimateSkill;
  const ultimateReady = ultimate ? player.ultimateTimer <= 0 : false;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2 sm:p-3 md:p-4">
      {/* === TOP BAR === */}
      <div className="flex items-start justify-between gap-2">
        {/* Top-left: Player Status Panel */}
        <div className="pointer-events-auto flex flex-col gap-2">
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-panel/85 p-3 shadow-2xl shadow-black/20 backdrop-blur-xl min-w-[200px] max-w-[280px]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-primary/4 blur-2xl" />

            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
                  指挥官状态
                </span>
                <span className="font-mono text-[10px] font-bold text-primary">
                  {player.heroId ? player.heroId.toUpperCase() : "OPERATOR"}
                </span>
              </div>

              <HealthBar health={player.health} maxHealth={player.maxHealth} />
              <div className="mt-2">
                <XpBar xp={player.xp} xpToNext={player.xpToNext} level={player.level} />
              </div>

              <StatusEffectBar state={state} />

              {defense && (
                <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                  <CoreHealthBar
                    health={defense.core.health}
                    maxHealth={defense.core.maxHealth}
                    label="核心耐久"
                  />
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1 text-muted">
                      <BatteryCharging size={10} weight="bold" className="text-primary" />
                      能量
                    </span>
                    <span className="font-mono font-bold">{Math.floor(defense.energy)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1 text-muted">
                      <Flag size={10} weight="bold" className="text-accent" />
                      波次
                    </span>
                    <span className="font-mono font-bold">
                      {defense.currentWave + 1} / {defense.totalWaves}
                    </span>
                  </div>
                  {state.mode === "peak-challenge" && state.peakChallengeState && (
                    <div className="space-y-1.5 border-t border-border/50 pt-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1 text-muted">
                          <Star size={10} weight="bold" className="text-warning" />
                          赛季 XP
                        </span>
                        <span className="font-mono font-bold text-warning">
                          {state.peakChallengeState.seasonXp}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1 text-muted">
                          <Coin size={10} weight="bold" className="text-primary" />
                          赛季货币
                        </span>
                        <span className="font-mono font-bold text-primary">
                          {state.peakChallengeState.seasonCurrency}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted">挑战完成</span>
                        <span className="font-mono font-bold text-success">
                          {state.peakChallengeState.challenges.filter((c) => c.completed).length}/
                          {state.peakChallengeState.challenges.length}
                        </span>
                      </div>
                    </div>
                  )}
                  {state.mode === "flagship-peak" && state.flagshipPeakState && (
                    <div className="space-y-1.5 border-t border-border/50 pt-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1 text-muted">
                          <Trophy size={10} weight="bold" className="text-accent" />
                          积分
                        </span>
                        <span className="font-mono font-bold tabular-nums text-accent">
                          {state.flagshipPeakState.score.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1 text-muted">
                          <Fire size={10} weight="bold" className="text-danger" />
                          连击
                        </span>
                        <span className="font-mono font-bold tabular-nums">
                          {state.flagshipPeakState.combos}
                          <span className="text-muted"> / 最佳 {state.flagshipPeakState.maxCombo}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1 text-muted">
                          <Target size={10} weight="bold" className="text-primary" />
                          挑战
                        </span>
                        <span className="font-mono font-bold tabular-nums text-success">
                          {state.flagshipPeakState.challenges.filter((c) => c.completed).length}/
                          {state.flagshipPeakState.challenges.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted">赛季XP</span>
                        <span className="font-mono font-bold text-warning">
                          {state.flagshipPeakState.seasonXp}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top-center: Wave Announcement area - rendered by parent */}
        <div className="flex-1" />

        {/* Top-right: Controls + Notifications + Kill Feed */}
        <div className="pointer-events-auto flex flex-col items-end gap-2 min-w-[180px]">
          {/* Pause / Surrender */}
          <div className="flex items-center gap-1.5">
            {onSurrender && (
              <button
                onClick={onSurrender}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-danger/25 bg-danger/8 px-3 text-xs font-medium text-danger backdrop-blur-md transition-all hover:bg-danger/12 focus-ring active:scale-95"
                aria-label="放弃战斗"
              >
                <FlagCheckered size={14} weight="bold" />
                放弃
              </button>
            )}
            <button
              onClick={onPauseToggle}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/60 bg-panel/85 px-3 text-xs backdrop-blur-xl transition-all hover:bg-panel focus-ring active:scale-95"
            >
              {paused ? (
                <Play size={14} weight="bold" className="text-primary" />
              ) : (
                <Pause size={14} weight="bold" />
              )}
              {paused ? "继续" : "暂停"}
            </button>
          </div>

          {/* Kill Feed */}
          {killFeed && killFeed.length > 0 && (
            <div className="max-h-[180px] overflow-hidden">
              <KillFeed entries={killFeed} maxVisible={4} />
            </div>
          )}

          {/* Survival Timer */}
          {state.mode === "survival" && (
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-danger/30 bg-panel/85 p-3 text-right shadow-xl shadow-danger/5 backdrop-blur-xl"
            >
              <p className="flex items-center justify-end gap-1 font-mono text-[10px] text-danger">
                <Clock size={12} weight="bold" />
                限时生存
              </p>
              <p className="text-xl font-bold text-danger tabular-nums">
                {formatTime(Math.max(0, 900 - state.time))}
              </p>
            </motion.div>
          )}

          {/* Active Event */}
          {event && (
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-[220px] rounded-2xl border border-danger/30 bg-panel/85 p-3 text-right shadow-xl backdrop-blur-xl"
            >
              <p className="flex items-center justify-end gap-1 font-mono text-[10px] text-danger">
                <Warning size={12} weight="bold" />
                事件
              </p>
              <p className="mt-0.5 text-xs font-bold">{event.title}</p>
              <p className="mt-0.5 text-xs text-muted hidden sm:block">{event.description}</p>
              <p className="mt-1 font-mono text-[10px] font-bold text-danger">
                {formatTime(Math.max(0, event.timer))}
              </p>
            </motion.div>
          )}

          {/* Mission */}
          {mission && !isFinal && (
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-[220px] rounded-2xl border border-border/60 bg-panel/85 p-3 text-right shadow-xl backdrop-blur-xl"
            >
              <p className="flex items-center justify-end gap-1 font-mono text-[10px] text-primary">
                <Target size={12} weight="bold" />
                当前任务
              </p>
              <p className="mt-0.5 text-xs font-bold">{mission.title}</p>
              <p className="hidden text-xs text-muted sm:block">{mission.description}</p>
              <p className="mt-1 font-mono text-[10px]">
                {Math.floor(mission.progress)} / {mission.target}
              </p>
              <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-border/50 sm:w-36">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  initial={false}
                  animate={{ width: clampPct(mission.progress, mission.target) }}
                  transition={
                    reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 150, damping: 18 }
                  }
                />
              </div>
            </motion.div>
          )}

          {/* Extraction Timer */}
          {isFinal && state.extraction && (
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-primary/30 bg-panel/85 p-3 text-right shadow-xl shadow-primary/5 backdrop-blur-xl"
            >
              <p className="flex items-center justify-end gap-1 font-mono text-[10px] text-primary">
                <Clock size={12} weight="bold" />
                撤离倒计时
              </p>
              <p className="text-xl font-bold text-danger tabular-nums">
                {formatTime(extractionTimer)}
              </p>
            </motion.div>
          )}

          {/* Defense mode indicators */}
          {defense && (
            <div className="flex flex-col items-end gap-2">
              <WaveIndicator
                currentWave={defense.currentWave}
                totalWaves={defense.totalWaves}
                enemiesRemaining={state.enemies.length}
                waveTimer={defense.waveInProgress ? undefined : defense.breakTimer}
              />
              {activeNode && (
                <NodeStatus
                  captured={activeNode.captured}
                  active={activeNode.active}
                  captureProgress={activeNode.captureProgress}
                  captureTime={activeNode.captureTime}
                  energyValue={activeNode.energyValue}
                />
              )}
            </div>
          )}

          {/* Flagship Peak Phase Indicator */}
          {state.mode === "flagship-peak" && state.flagshipPeakState && (
            <FlagshipPeakHudPanel
              phase={state.flagshipPeakState.phase}
              score={state.flagshipPeakState.score}
              combos={state.flagshipPeakState.combos}
              maxCombo={state.flagshipPeakState.maxCombo}
              challengesCompleted={state.flagshipPeakState.challenges.filter((c) => c.completed).length}
              totalChallenges={state.flagshipPeakState.challenges.length}
            />
          )}
        </div>
      </div>

      {/* === CENTER: Boss Health Bar === */}
      {activeBoss && (
        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center px-4">
          <BossHealthBar
            name={activeBossTemplate?.name ?? activeBoss.variant}
            health={activeBoss.health}
            maxHealth={activeBoss.maxHealth}
            phase={activeBoss.phase}
            phaseThresholds={activeBoss.phaseThresholds}
          />
        </div>
      )}

      {/* === BOTTOM BAR === */}
      <div className="pointer-events-auto flex items-end justify-between gap-2">
        {/* Bottom-left: Weapon Panel */}
        <WeaponPanel state={state} />

        {/* Bottom-center: Skill Buttons */}
        <div className="flex items-end gap-3 sm:gap-4">
          {skill && (
            <HeroSkillButton
              name={skill.name}
              icon={<Lightning size={24} weight="bold" />}
              cooldown={skill.cooldown}
              remaining={player.skillTimer}
              onClick={onUseSkill}
              disabled={!skillReady}
              shortcut="E"
            />
          )}
          {ultimate && (
            <HeroSkillButton
              name={ultimate.name}
              icon={<Fire size={24} weight="bold" />}
              cooldown={ultimate.cooldown}
              remaining={player.ultimateTimer}
              onClick={onUseUltimate}
              disabled={!ultimateReady}
              shortcut="Q"
              className="border-danger/50 text-danger hover:bg-danger/10"
            />
          )}
        </div>

        {/* Bottom-right: Stats */}
        <StatsRow state={state} />
      </div>
    </div>
  );
}