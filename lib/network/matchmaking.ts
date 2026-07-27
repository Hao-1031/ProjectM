// Matchmaking queue system
// Skill-based and latency-based matchmaking for multiplayer sessions

import type { GameModeType } from "@/lib/game/types";

export interface MatchmakingPlayer {
  id: string;
  name: string;
  skillRating: number;
  latency: number;
  preferredModes: GameModeType[];
  queuedAt: number;
}

export interface MatchmakingConfig {
  maxQueueTime: number;
  skillRangeExpandRate: number;
  maxSkillRange: number;
  minSkillRange: number;
  latencyWeight: number;
  skillWeight: number;
  maxPartySize: number;
}

export interface MatchResult {
  players: MatchmakingPlayer[];
  mode: GameModeType;
  averageSkill: number;
  skillRange: number;
  averageLatency: number;
  matchQuality: number;
}

const DEFAULT_MATCHMAKING_CONFIG: MatchmakingConfig = {
  maxQueueTime: 120000,
  skillRangeExpandRate: 50,
  maxSkillRange: 500,
  minSkillRange: 100,
  latencyWeight: 0.4,
  skillWeight: 0.6,
  maxPartySize: 4,
};

export class MatchmakingQueue {
  private config: MatchmakingConfig;
  private queue: MatchmakingPlayer[] = [];
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private onMatchFound?: (match: MatchResult) => void;

  constructor(
    config: Partial<MatchmakingConfig> = {},
    onMatchFound?: (match: MatchResult) => void
  ) {
    this.config = { ...DEFAULT_MATCHMAKING_CONFIG, ...config };
    this.onMatchFound = onMatchFound;
  }

  start(): void {
    if (this.tickInterval) return;
    this.tickInterval = setInterval(() => this.tick(), 1000);
  }

  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  join(player: MatchmakingPlayer): void {
    if (this.queue.find((p) => p.id === player.id)) return;
    this.queue.push({ ...player, queuedAt: Date.now() });
  }

  leave(playerId: string): void {
    this.queue = this.queue.filter((p) => p.id !== playerId);
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getQueuePosition(playerId: string): number {
    return this.queue.findIndex((p) => p.id === playerId) + 1;
  }

  private tick(): void {
    if (this.queue.length < 2) return;

    const now = Date.now();
    this.queue.sort((a, b) => a.queuedAt - b.queuedAt);

    for (const mode of this.getCommonModes()) {
      const eligible = this.queue.filter((p) => p.preferredModes.includes(mode));
      if (eligible.length < 2) continue;

      const match = this.tryMatch(eligible, mode, now);
      if (match) {
        for (const player of match.players) {
          this.queue = this.queue.filter((p) => p.id !== player.id);
        }
        this.onMatchFound?.(match);
        return;
      }
    }
  }

  private getCommonModes(): GameModeType[] {
    const modeCounts = new Map<GameModeType, number>();
    for (const player of this.queue) {
      for (const mode of player.preferredModes) {
        modeCounts.set(mode, (modeCounts.get(mode) ?? 0) + 1);
      }
    }
    return [...modeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([mode]) => mode);
  }

  private tryMatch(
    eligible: MatchmakingPlayer[],
    mode: GameModeType,
    now: number
  ): MatchResult | null {
    for (let i = 0; i < eligible.length; i++) {
      const anchor = eligible[i];
      const waitTime = now - anchor.queuedAt;
      const skillRange = Math.min(
        this.config.maxSkillRange,
        this.config.minSkillRange + waitTime * (this.config.skillRangeExpandRate / 1000)
      );

      const candidates = eligible.filter((p) => {
        if (p.id === anchor.id) return false;
        const skillDiff = Math.abs(p.skillRating - anchor.skillRating);
        return skillDiff <= skillRange;
      });

      if (candidates.length < 1) continue;

      candidates.sort((a, b) => {
        const skillDiffA = Math.abs(a.skillRating - anchor.skillRating);
        const skillDiffB = Math.abs(b.skillRating - anchor.skillRating);
        const skillScore =
          (skillDiffB - skillDiffA) * this.config.skillWeight;
        const latencyScore =
          (b.latency - a.latency) * this.config.latencyWeight;
        return skillScore + latencyScore;
      });

      const party = [anchor, ...candidates.slice(0, this.config.maxPartySize - 1)];
      const skills = party.map((p) => p.skillRating);
      const latencies = party.map((p) => p.latency);

      const averageSkill = skills.reduce((a, b) => a + b, 0) / skills.length;
      const skillRangeActual = Math.max(...skills) - Math.min(...skills);
      const averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const matchQuality = this.calculateMatchQuality(
        skillRangeActual,
        averageLatency,
        skillRange
      );

      return {
        players: party,
        mode,
        averageSkill,
        skillRange: skillRangeActual,
        averageLatency,
        matchQuality,
      };
    }

    return null;
  }

  private calculateMatchQuality(
    skillRange: number,
    averageLatency: number,
    maxSkillRange: number
  ): number {
    const skillQuality = 1 - Math.min(1, skillRange / maxSkillRange);
    const latencyQuality = 1 - Math.min(1, averageLatency / 300);
    return skillQuality * this.config.skillWeight + latencyQuality * this.config.latencyWeight;
  }

  clear(): void {
    this.queue = [];
  }
}