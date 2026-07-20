import type { GameState } from "@/lib/game/types";
import { formatTime } from "@/lib/game/math";
import { getCurrentMission } from "@/lib/game/missions";
import { motion } from "framer-motion";
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
} from "@phosphor-icons/react";
import { getBossTemplate } from "@/lib/game/bosses";
import type { BossId } from "@/lib/game/types";
import WaveIndicator from "./game/WaveIndicator";
import CoreHealthBar from "./game/CoreHealthBar";
import NodeStatus from "./game/NodeStatus";
import HeroSkillButton from "./game/HeroSkillButton";
import BossHealthBar from "./game/BossHealthBar";

interface HudProps {
  state: GameState;
  paused: boolean;
  onPauseToggle: () => void;
  extractionTimer: number;
  onUseSkill?: () => void;
  onUseUltimate?: () => void;
  onSurrender?: () => void;
}

function clampPct(value: number, max: number) {
  return `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
}

export default function Hud({
  state,
  paused,
  onPauseToggle,
  extractionTimer,
  onUseSkill,
  onUseUltimate,
  onSurrender,
}: HudProps) {
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
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2 sm:p-3 md:p-5">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="pointer-events-auto min-w-[170px] max-w-[260px] rounded-2xl border border-border bg-panel/90 p-3 shadow-lg backdrop-blur-md sm:min-w-[190px] sm:max-w-[300px] sm:p-4">
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <span className="flex items-center gap-1 text-muted">
              <Heart size={12} weight="bold" className="text-danger" />
              生命
            </span>
            <span className="font-mono text-foreground">
              {Math.ceil(player.health)} / {player.maxHealth}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-danger"
              initial={false}
              animate={{ width: clampPct(player.health, player.maxHealth) }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] sm:text-xs">
            <span className="flex items-center gap-1 text-muted">
              <Star size={12} weight="bold" className="text-primary" />
              经验 Lv.{player.level}
            </span>
            <span className="font-mono text-foreground">
              {player.xp} / {player.xpToNext}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: clampPct(player.xp, player.xpToNext) }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            />
          </div>

          {player.passives.length > 0 && (
            <div className="mt-3 hidden flex-wrap gap-1 sm:flex">
              {player.passives.map((p) => (
                <span
                  key={p.id}
                  className="rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ color: p.color }}
                >
                  {p.name} Lv.{p.level}
                </span>
              ))}
            </div>
          )}

          {defense && (
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              <CoreHealthBar
                health={defense.core.health}
                maxHealth={defense.core.maxHealth}
                label="核心耐久"
              />
              <div className="flex items-center justify-between text-[10px] sm:text-xs">
                <span className="flex items-center gap-1 text-muted">
                  <BatteryCharging size={12} weight="bold" className="text-primary" />
                  能量
                </span>
                <span className="font-mono">{Math.floor(defense.energy)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] sm:text-xs">
                <span className="flex items-center gap-1 text-muted">
                  <Flag size={12} weight="bold" className="text-accent" />
                  波次
                </span>
                <span className="font-mono">
                  {defense.currentWave + 1} / {defense.totalWaves}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-2 sm:gap-3">
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={onPauseToggle}
              className="inline-flex min-h-[40px] min-w-[64px] items-center gap-1.5 rounded-xl border border-border bg-panel/90 px-3 py-2 text-xs backdrop-blur-md transition-colors hover:bg-panel focus-ring pointer-events-auto touch-manipulation sm:text-sm"
            >
              {paused ? (
                <Play size={14} weight="bold" className="text-primary" />
              ) : (
                <Pause size={14} weight="bold" />
              )}
              {paused ? "继续" : "暂停"}
            </button>
            {onSurrender && (
              <button
                onClick={onSurrender}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger backdrop-blur-md transition-colors hover:bg-danger/15 focus-ring pointer-events-auto touch-manipulation"
                aria-label="放弃战斗"
              >
                <FlagCheckered size={14} weight="bold" />
                放弃
              </button>
            )}
          </div>

          {event && (
            <div className="max-w-[200px] rounded-2xl border border-danger/40 bg-panel/90 p-3 text-right shadow-lg backdrop-blur-md sm:max-w-[260px] sm:p-4">
              <p className="flex items-center justify-end gap-1 font-mono text-[10px] text-danger sm:text-xs">
                <Warning size={12} weight="bold" />
                事件
              </p>
              <p className="mt-1 text-xs font-bold sm:text-sm">{event.title}</p>
              <p className="hidden text-xs text-muted sm:block">{event.description}</p>
              <p className="mt-1 font-mono text-[10px] text-danger sm:text-xs">
                {formatTime(Math.max(0, event.timer))}
              </p>
            </div>
          )}

          {mission && !isFinal && (
            <div className="max-w-[200px] rounded-2xl border border-border bg-panel/90 p-3 text-right shadow-lg backdrop-blur-md sm:max-w-[260px] sm:p-4">
              <p className="flex items-center justify-end gap-1 font-mono text-[10px] text-primary sm:text-xs">
                <Target size={12} weight="bold" />
                当前任务
              </p>
              <p className="mt-1 text-xs font-bold sm:text-sm">{mission.title}</p>
              <p className="hidden text-xs text-muted sm:block">{mission.description}</p>
              <p className="mt-1 font-mono text-[10px] sm:text-xs">
                {Math.floor(mission.progress)} / {mission.target}
              </p>
              <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-border sm:w-36">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: clampPct(mission.progress, mission.target) }}
                />
              </div>
            </div>
          )}

          {isFinal && state.extraction && (
            <div className="rounded-2xl border border-border bg-panel/90 p-3 text-right shadow-lg backdrop-blur-md sm:p-4">
              <p className="flex items-center justify-end gap-1 font-mono text-[10px] text-primary sm:text-xs">
                <Clock size={12} weight="bold" />
                撤离倒计时
              </p>
              <p className="text-xl font-bold text-danger sm:text-2xl">
                {formatTime(extractionTimer)}
              </p>
            </div>
          )}

          {defense && (
            <WaveIndicator
              currentWave={defense.currentWave}
              totalWaves={defense.totalWaves}
              enemiesRemaining={state.enemies.length}
              waveTimer={defense.waveInProgress ? undefined : defense.breakTimer}
            />
          )}

          {defense && activeNode && (
            <NodeStatus
              captured={activeNode.captured}
              active={activeNode.active}
              captureProgress={activeNode.captureProgress}
              captureTime={activeNode.captureTime}
              energyValue={activeNode.energyValue}
            />
          )}
        </div>
      </div>

      {activeBoss && (
        <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
          <BossHealthBar
            name={activeBossTemplate?.name ?? activeBoss.variant}
            health={activeBoss.health}
            maxHealth={activeBoss.maxHealth}
            phase={activeBoss.phase}
            phaseThresholds={activeBoss.phaseThresholds}
          />
        </div>
      )}

      <div className="pointer-events-auto flex items-end justify-between gap-2 sm:gap-3">
        <div className="flex gap-2">
          <div className="rounded-xl border border-border bg-panel/90 px-2.5 py-2 text-center shadow-lg backdrop-blur-md sm:px-3 sm:py-2.5">
            <p className="flex items-center justify-center gap-1 font-mono text-[10px] text-muted sm:text-xs">
              <Skull size={12} weight="bold" />
              击杀
            </p>
            <p className="font-mono text-base font-bold sm:text-lg">{state.stats.kills}</p>
          </div>
          <div className="rounded-xl border border-border bg-panel/90 px-2.5 py-2 text-center shadow-lg backdrop-blur-md sm:px-3 sm:py-2.5">
            <p className="flex items-center justify-center gap-1 font-mono text-[10px] text-muted sm:text-xs">
              <Clock size={12} weight="bold" />
              时间
            </p>
            <p className="font-mono text-base font-bold sm:text-lg">
              {formatTime(state.stats.timeSurvived)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-panel/90 px-2.5 py-2 text-center shadow-lg backdrop-blur-md sm:px-3 sm:py-2.5">
            <p className="flex items-center justify-center gap-1 font-mono text-[10px] text-muted sm:text-xs">
              <Coin size={12} weight="bold" />
              资源
            </p>
            <p className="font-mono text-base font-bold sm:text-lg">
              {state.stats.resourcesCollected}
            </p>
          </div>
          {state.killCombo.count >= 2 && (
            <div className="relative overflow-hidden rounded-xl border border-warning/40 bg-panel/90 px-2.5 py-2 text-center shadow-lg shadow-warning/10 backdrop-blur-md sm:px-3 sm:py-2.5">
              <div
                className="absolute bottom-0 left-0 h-1 bg-warning/60 transition-all"
                style={{
                  width: `${Math.max(0, Math.min(100, (state.killCombo.timer / 2.5) * 100))}%`,
                }}
              />
              <p className="flex items-center justify-center gap-1 font-mono text-[10px] text-warning sm:text-xs">
                <Fire size={12} weight="bold" />
                连杀
              </p>
              <p className="font-mono text-base font-bold text-warning sm:text-lg">
                {state.killCombo.count}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-end gap-3 sm:gap-4">
          {skill && (
            <HeroSkillButton
              name={skill.name}
              icon={<Lightning size={24} weight="bold" />}
              cooldown={skill.cooldown}
              remaining={player.skillTimer}
              onClick={onUseSkill}
              disabled={!skillReady}
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
              className="border-danger/50 text-danger hover:bg-danger/10"
            />
          )}

          <div className="hidden max-w-[240px] rounded-xl border border-border bg-panel/90 px-3 py-2 shadow-lg backdrop-blur-md md:block">
            <p className="flex items-center justify-end gap-1 font-mono text-xs text-muted">
              <Crosshair size={12} weight="bold" />
              武器
            </p>
            <div className="mt-1 flex flex-wrap justify-end gap-2">
              {player.weapons.map((w) => (
                <span key={w.id} className="text-xs font-bold" style={{ color: w.color }}>
                  {w.name} Lv.{w.level}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
