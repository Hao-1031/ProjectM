import type { PvPMatchmakingPlayer, PvPMatchResult, PvPRoundFormat, PvPMapId } from "./types";
import { getRandomPvPMap } from "./pvp-maps";

export interface PvPMatchmakingConfig {
  maxQueueTime: number;
  ratingRangeExpandRate: number;
  maxRatingRange: number;
  minRatingRange: number;
  latencyWeight: number;
  ratingWeight: number;
}

const DEFAULT_CONFIG: PvPMatchmakingConfig = {
  maxQueueTime: 120000,
  ratingRangeExpandRate: 30,
  maxRatingRange: 600,
  minRatingRange: 150,
  latencyWeight: 0.35,
  ratingWeight: 0.65,
};

export class PvPMatchmakingQueue {
  private config: PvPMatchmakingConfig;
  private queue: PvPMatchmakingPlayer[] = [];
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private onMatchFound?: (match: PvPMatchResult) => void;

  constructor(
    config: Partial<PvPMatchmakingConfig> = {},
    onMatchFound?: (match: PvPMatchResult) => void
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.onMatchFound = onMatchFound;
  }

  start(): void {
    if (this.tickInterval) return;
    this.tickInterval = setInterval(() => this.tick(), 2000);
  }

  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  join(player: PvPMatchmakingPlayer): void {
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

  getEstimatedWait(playerId: string): number {
    const position = this.getQueuePosition(playerId);
    if (position <= 0) return 0;
    return Math.max(0, position * 15 - 5);
  }

  private tick(): void {
    if (this.queue.length < 2) return;

    const now = Date.now();
    this.queue.sort((a, b) => a.queuedAt - b.queuedAt);

    for (const format of this.getCommonFormats()) {
      const eligible = this.queue.filter(
        (p) => p.preferredFormat === format || p.preferredFormat === "BO5"
      );
      if (eligible.length < 2) continue;

      const match = this.tryMatch(eligible, format, now);
      if (match) {
        for (const player of match.players) {
          this.queue = this.queue.filter((p) => p.id !== player.id);
        }
        this.onMatchFound?.(match);
        return;
      }
    }

    for (let i = 0; i < this.queue.length - 1; i++) {
      const anchor = this.queue[i];
      const waitTime = now - anchor.queuedAt;
      if (waitTime < 5000) continue;

      for (let j = i + 1; j < this.queue.length; j++) {
        const candidate = this.queue[j];
        const format = anchor.preferredFormat === "BO5" || candidate.preferredFormat === "BO5"
          ? "BO5" as PvPRoundFormat
          : "BO3" as PvPRoundFormat;

        const ratingRange = Math.min(
          this.config.maxRatingRange,
          this.config.minRatingRange + waitTime * (this.config.ratingRangeExpandRate / 1000)
        );

        const ratingDiff = Math.abs(anchor.rating - candidate.rating);
        if (ratingDiff > ratingRange) continue;

        const format_2: PvPRoundFormat = format;
        const map = getRandomPvPMap();
        const matchQuality = this.calculateMatchQuality(ratingDiff, ratingRange, anchor.latency + candidate.latency);
        const estimatedLatency = Math.max(anchor.latency, candidate.latency);

        this.queue = this.queue.filter(
          (p) => p.id !== anchor.id && p.id !== candidate.id
        );

        const match: PvPMatchResult = {
          players: [anchor, candidate],
          format: format_2,
          mapId: map.id,
          matchQuality,
          estimatedLatency,
        };
        this.onMatchFound?.(match);
        return;
      }
    }
  }

  private getCommonFormats(): PvPRoundFormat[] {
    const counts = new Map<PvPRoundFormat, number>();
    for (const player of this.queue) {
      counts.set(player.preferredFormat, (counts.get(player.preferredFormat) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([format]) => format);
  }

  private tryMatch(
    eligible: PvPMatchmakingPlayer[],
    format: PvPRoundFormat,
    now: number
  ): PvPMatchResult | null {
    for (let i = 0; i < eligible.length; i++) {
      const anchor = eligible[i];
      const waitTime = now - anchor.queuedAt;
      const ratingRange = Math.min(
        this.config.maxRatingRange,
        this.config.minRatingRange + waitTime * (this.config.ratingRangeExpandRate / 1000)
      );

      for (let j = i + 1; j < eligible.length; j++) {
        const candidate = eligible[j];
        const ratingDiff = Math.abs(anchor.rating - candidate.rating);
        if (ratingDiff > ratingRange) continue;

        const map = getRandomPvPMap();
        const matchQuality = this.calculateMatchQuality(
          ratingDiff,
          ratingRange,
          anchor.latency + candidate.latency
        );

        return {
          players: [anchor, candidate],
          format,
          mapId: map.id,
          matchQuality,
          estimatedLatency: Math.max(anchor.latency, candidate.latency),
        };
      }
    }
    return null;
  }

  private calculateMatchQuality(
    ratingDiff: number,
    maxRatingRange: number,
    totalLatency: number
  ): number {
    const ratingQuality = 1 - Math.min(1, ratingDiff / maxRatingRange);
    const latencyQuality = 1 - Math.min(1, totalLatency / 400);
    return ratingQuality * this.config.ratingWeight + latencyQuality * this.config.latencyWeight;
  }

  clear(): void {
    this.queue = [];
  }
}