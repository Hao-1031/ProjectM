import { motion, useReducedMotion } from "framer-motion";
import {
  Heart,
  Star,
  Pause,
  Play,
  Warning,
  Clock,
  Skull,
  BatteryCharging,
  Flag,
  Lightning,
  Fire,
  FlagCheckered,
  Sword,
  Coins,
  Crosshair,
  Shield,
  Trophy,
} from "@phosphor-icons/react";
import type { GameState } from "@/lib/game/types";
import { formatTime } from "@/lib/game/math";
import { getBossTemplate } from "@/lib/game/bosses";
import type { BossId } from "@/lib/game/types";
import WaveIndicator from "./WaveIndicator";
import CoreHealthBar from "./CoreHealthBar";
import NodeStatus from "./NodeStatus";
import HeroSkillButton from "./HeroSkillButton";
import BossHealthBar from "./BossHealthBar";
import PhaseIndicator from "./PhaseIndicator";

interface HudMobileProps {
  state: GameState;
  paused: boolean;
  onPauseToggle: () => void;
  onUseSkill?: () => void;
  onUseUltimate?: () => void;
  onSurrender?: () => void;
}

function clampPct(value: number, max: number) {
  return `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
}

export default function HudMobile({
  state,
  paused,
  onPauseToggle,
  onUseSkill,
  onUseUltimate,
  onSurrender,
}: HudMobileProps) {
  const reducedMotion = useReducedMotion();
  const player = state.player;
  const defense = state.defenseState;
  const skill = player.activeSkill;
  const skillReady = skill ? player.skillTimer <= 0 : false;
  const ultimate = player.ultimateSkill;
  const ultimateReady = ultimate ? player.ultimateTimer <= 0 : false;
  const event = state.activeEvent;
  const activeNode = defense?.nodes.find((n) => n.active && !n.captured) ?? null;
  const activeBoss = state.enemies.find((e) => e.isBoss) ?? null;
  const activeBossTemplate = activeBoss ? getBossTemplate(activeBoss.variant as BossId) : null;

  const healthPct = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
  const isLowHealth = healthPct <= 30;
  const isCritical = healthPct <= 15;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-1.5">
      {/* === TOP BAR === */}
      <div className="flex items-start justify-between gap-1">
        {/* Top-left: Compact Status */}
        <div className="pointer-events-auto flex flex-col gap-1">
          <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-panel/85 px-2 py-1.5 shadow-lg backdrop-blur-xl">
            <div className="relative">
              <Heart size={16} weight="bold" className={isCritical ? "text-danger" : isLowHealth ? "text-warning" : "text-success"} />
              {isCritical && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-danger/20"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>
            <span className="font-mono text-xs font-bold text-foreground">
              {Math.ceil(player.health)}
            </span>
            <div className="h-4 w-px bg-border/50" />
            <Star size={14} weight="bold" className="text-primary" />
            <span className="font-mono text-xs font-bold text-foreground">Lv.{player.level}</span>
            {defense && (
              <>
                <div className="h-4 w-px bg-border/50" />
                <BatteryCharging size={14} weight="bold" className="text-primary" />
                <span className="font-mono text-xs font-bold text-foreground">
                  {Math.floor(defense.energy)}
                </span>
                <div className="h-4 w-px bg-border/50" />
                <Flag size={14} weight="bold" className="text-accent" />
                <span className="font-mono text-xs font-bold text-foreground">
                  {defense.currentWave + 1}/{defense.totalWaves}
                </span>
              </>
            )}
            {!defense && (
              <>
                <div className="h-4 w-px bg-border/50" />
                <Clock size={14} weight="bold" className="text-muted" />
                <span className="font-mono text-xs font-bold text-foreground">
                  {formatTime(state.stats.timeSurvived)}
                </span>
                <div className="h-4 w-px bg-border/50" />
                <Skull size={14} weight="bold" className="text-muted" />
                <span className="font-mono text-xs font-bold text-foreground">
                  {state.stats.kills}
                </span>
              </>
            )}
            {state.mode === "peak-challenge" && state.peakChallengeState && (
              <>
                <div className="h-4 w-px bg-border/50" />
                <Star size={14} weight="bold" className="text-warning" />
                <span className="font-mono text-xs font-bold text-warning">
                  {state.peakChallengeState.seasonXp}
                </span>
              </>
            )}
            {state.mode === "flagship-peak" && state.flagshipPeakState && (
              <>
                <div className="h-4 w-px bg-border/50" />
                <Trophy size={14} weight="bold" className="text-accent" />
                <span className="font-mono text-xs font-bold text-accent">
                  {state.flagshipPeakState.score.toLocaleString()}
                </span>
                <div className="h-4 w-px bg-border/50" />
                <Fire size={14} weight="bold" className="text-danger" />
                <span className="font-mono text-xs font-bold">
                  {state.flagshipPeakState.combos}
                </span>
              </>
            )}
          </div>

          {/* Health & XP bars */}
          <div className="flex flex-col gap-0.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/50">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: isCritical
                    ? "linear-gradient(90deg, #b84a55, #c45c4a)"
                    : isLowHealth
                      ? "linear-gradient(90deg, #b87a3d, #b84a55)"
                      : "linear-gradient(90deg, #5e8c6a, #7a8f3e)",
                }}
                initial={false}
                animate={{ width: `${healthPct}%` }}
                transition={
                  reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 20 }
                }
              />
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-border/50">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                initial={false}
                animate={{ width: clampPct(player.xp, player.xpToNext) }}
                transition={
                  reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 20 }
                }
              />
            </div>
          </div>

          {defense && (
            <CoreHealthBar
              health={defense.core.health}
              maxHealth={defense.core.maxHealth}
              label="核心"
            />
          )}
        </div>

        {/* Top-right: Controls */}
        <div className="pointer-events-auto flex items-center gap-1">
          {event && (
            <div className="rounded-lg border border-danger/30 bg-panel/85 px-2 py-1 shadow-lg backdrop-blur-xl">
              <p className="flex items-center gap-1 font-mono text-[10px] font-bold text-danger">
                <Warning size={10} weight="bold" />
                {event.title}
              </p>
              <p className="font-mono text-[10px] text-danger">
                {formatTime(Math.max(0, event.timer))}
              </p>
            </div>
          )}
          <button
            onClick={onPauseToggle}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-panel/85 backdrop-blur-xl transition-colors hover:bg-panel focus-ring touch-manipulation"
            aria-label={paused ? "继续" : "暂停"}
          >
            {paused ? (
              <Play size={16} weight="bold" className="text-primary" />
            ) : (
              <Pause size={16} weight="bold" />
            )}
          </button>
          {onSurrender && (
            <button
              onClick={onSurrender}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-danger/25 bg-danger/8 backdrop-blur-xl transition-colors hover:bg-danger/12 focus-ring touch-manipulation"
              aria-label="放弃战斗"
            >
              <FlagCheckered size={16} weight="bold" className="text-danger" />
            </button>
          )}
        </div>
      </div>

      {/* === CENTER: Boss Health Bar === */}
      {activeBoss && (
        <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center px-2">
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
      <div className="pointer-events-auto flex items-end justify-between">
        {/* Left: Joystick area - intentionally empty */}
        <div className="w-[30%]" />

        {/* Center: Weapon + Defense indicators */}
        <div className="flex flex-col items-center gap-1">
          {defense && activeNode && (
            <NodeStatus
              captured={activeNode.captured}
              active={activeNode.active}
              captureProgress={activeNode.captureProgress}
              captureTime={activeNode.captureTime}
              energyValue={activeNode.energyValue}
            />
          )}
          {defense && (
            <WaveIndicator
              currentWave={defense.currentWave}
              totalWaves={defense.totalWaves}
              enemiesRemaining={state.enemies.length}
              waveTimer={defense.waveInProgress ? undefined : defense.breakTimer}
            />
          )}
        </div>

        {/* Right: Skill Buttons + Stats */}
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 rounded-lg border border-border/40 bg-panel/80 px-1.5 py-0.5 shadow-lg backdrop-blur-md">
              <Skull size={10} weight="bold" className="text-danger" />
              <span className="font-mono text-[10px] font-bold">{state.stats.kills}</span>
            </div>
            {state.killCombo.count >= 2 && (
              <div className="flex items-center gap-1 rounded-lg border border-warning/30 bg-panel/80 px-1.5 py-0.5 shadow-lg backdrop-blur-md">
                <Fire size={10} weight="bold" className="text-warning" />
                <span className="font-mono text-[10px] font-bold text-warning">
                  {state.killCombo.count}
                </span>
              </div>
            )}
          </div>

          {skill && (
            <HeroSkillButton
              name={skill.name}
              icon={<Lightning size={24} weight="bold" />}
              cooldown={skill.cooldown}
              remaining={player.skillTimer}
              onPointerDown={onUseSkill}
              disabled={!skillReady}
              size="lg"
            />
          )}
          {ultimate && (
            <HeroSkillButton
              name={ultimate.name}
              icon={<Fire size={24} weight="bold" />}
              cooldown={ultimate.cooldown}
              remaining={player.ultimateTimer}
              onPointerDown={onUseUltimate}
              disabled={!ultimateReady}
              size="lg"
              className="border-danger/50 text-danger hover:bg-danger/10"
            />
          )}
        </div>
      </div>
    </div>
  );
}