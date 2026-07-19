import type { GameState } from "@/lib/game/types";
import { formatTime } from "@/lib/game/math";
import { getCurrentMission } from "@/lib/game/missions";

interface HudProps {
  state: GameState;
  paused: boolean;
  onPauseToggle: () => void;
  extractionTimer: number;
}

export default function Hud({ state, onPauseToggle, extractionTimer }: HudProps) {
  const player = state.player;
  const mission = getCurrentMission(state);
  const isFinal = state.currentMissionIndex >= state.missions.length;
  const event = state.activeEvent;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2 sm:p-3 md:p-5">
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="pointer-events-auto min-w-[150px] max-w-[240px] rounded-xl border border-border bg-panel/90 p-2.5 backdrop-blur-sm sm:min-w-[170px] sm:max-w-[280px] sm:p-3">
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <span className="text-muted">生命</span>
            <span className="font-mono text-foreground">
              {Math.ceil(player.health)} / {player.maxHealth}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded bg-border">
            <div
              className="h-full rounded bg-danger transition-all"
              style={{ width: `${Math.max(0, (player.health / player.maxHealth) * 100)}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] sm:text-xs">
            <span className="text-muted">经验 Lv.{player.level}</span>
            <span className="font-mono text-foreground">
              {player.xp} / {player.xpToNext}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded bg-border">
            <div
              className="h-full rounded bg-primary transition-all"
              style={{ width: `${Math.max(0, (player.xp / player.xpToNext) * 100)}%` }}
            />
          </div>

          {player.passives.length > 0 && (
            <div className="mt-2 hidden flex-wrap gap-1 sm:flex">
              {player.passives.map((p) => (
                <span
                  key={p.id}
                  className="rounded bg-background px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ color: p.color }}
                >
                  {p.name} Lv.{p.level}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-1.5 sm:gap-2">
          <button
            onClick={onPauseToggle}
            className="rounded-lg border border-border bg-panel/90 px-2.5 py-1.5 text-xs backdrop-blur-sm transition-colors hover:bg-panel focus-ring pointer-events-auto sm:px-3 sm:py-2 sm:text-sm"
          >
            暂停
          </button>

          {event && (
            <div className="max-w-[180px] rounded-xl border border-danger/50 bg-panel/90 p-2.5 text-right backdrop-blur-sm sm:max-w-[240px] sm:p-3">
              <p className="font-mono text-[10px] text-danger sm:text-xs">事件</p>
              <p className="text-xs font-bold sm:text-sm">{event.title}</p>
              <p className="hidden text-xs text-muted sm:block">{event.description}</p>
              <p className="mt-1 font-mono text-[10px] text-danger sm:text-xs">
                {formatTime(Math.max(0, event.timer))}
              </p>
            </div>
          )}

          {mission && !isFinal && (
            <div className="max-w-[180px] rounded-xl border border-border bg-panel/90 p-2.5 text-right backdrop-blur-sm sm:max-w-[240px] sm:p-3">
              <p className="font-mono text-[10px] text-primary sm:text-xs">当前任务</p>
              <p className="text-xs font-bold sm:text-sm">{mission.title}</p>
              <p className="hidden text-xs text-muted sm:block">{mission.description}</p>
              <p className="mt-1 font-mono text-[10px] sm:text-xs">
                {Math.floor(mission.progress)} / {mission.target}
              </p>
              <div className="mt-1 h-1.5 w-28 overflow-hidden rounded bg-border sm:w-32">
                <div
                  className="h-full rounded bg-accent transition-all"
                  style={{ width: `${Math.max(0, (mission.progress / mission.target) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {isFinal && state.extraction && (
            <div className="rounded-xl border border-border bg-panel/90 p-2.5 text-right backdrop-blur-sm sm:p-3">
              <p className="font-mono text-[10px] text-primary sm:text-xs">撤离倒计时</p>
              <p className="text-xl font-bold text-danger sm:text-2xl">
                {formatTime(extractionTimer)}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-auto flex items-end justify-between gap-2 sm:gap-3">
        <div className="flex gap-1.5 sm:gap-2">
          <div className="rounded-lg border border-border bg-panel/90 px-2 py-1.5 text-center backdrop-blur-sm sm:px-3 sm:py-2">
            <p className="font-mono text-[10px] text-muted sm:text-xs">击杀</p>
            <p className="font-mono text-base font-bold sm:text-lg">{state.stats.kills}</p>
          </div>
          <div className="rounded-lg border border-border bg-panel/90 px-2 py-1.5 text-center backdrop-blur-sm sm:px-3 sm:py-2">
            <p className="font-mono text-[10px] text-muted sm:text-xs">时间</p>
            <p className="font-mono text-base font-bold sm:text-lg">
              {formatTime(state.stats.timeSurvived)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-panel/90 px-2 py-1.5 text-center backdrop-blur-sm sm:px-3 sm:py-2">
            <p className="font-mono text-[10px] text-muted sm:text-xs">资源</p>
            <p className="font-mono text-base font-bold sm:text-lg">
              {state.stats.resourcesCollected}
            </p>
          </div>
        </div>

        <div className="hidden max-w-[220px] rounded-lg border border-border bg-panel/90 px-3 py-2 text-right backdrop-blur-sm md:block">
          <p className="font-mono text-xs text-muted">武器</p>
          <div className="flex flex-wrap justify-end gap-2">
            {player.weapons.map((w) => (
              <span key={w.id} className="text-xs font-bold" style={{ color: w.color }}>
                {w.name} Lv.{w.level}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
