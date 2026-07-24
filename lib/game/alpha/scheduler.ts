import { clamp } from "../math";
import type { EnemyVariant, BossId, Player, GameState } from "../types";
import type {
  AlphaParams,
  AlphaDifficultySnapshot,
  AlphaEnemyStats,
  AlphaBossStats,
  AlphaTelemetryEvent,
  AlphaKillWindow,
  AlphaRhythmMetrics,
  HeroBuildSnapshot,
} from "./types";
import {
  DEFAULT_ALPHA_PARAMS,
  computeDifficulty,
  createHeroBuildSnapshot,
  sigmoidDifficulty,
} from "./core";
import { generateEnemyWave, generateBossStats, applyPlayerCountScaling } from "./generator";

/**
 * α 动态节律算法 - 运行时调度层
 *
 * 负责：
 * 1. 采集战斗事件（spawn / kill / damage_dealt / damage_taken / node_captured / boss_phase）
 * 2. 维护击杀效率滑动窗口
 * 3. 每帧/每秒计算当前难度快照
 * 4. 输出下一波敌人配置与 Boss 配置
 * 5. 暴露节奏指标供 UI/调试使用
 *
 * 与引擎的耦合点仅为事件上报和玩家 Build 快照读取。
 */

export interface AlphaSchedulerOptions {
  totalWaves: number;
  bossWaves: number[];
  params?: AlphaParams;
  playerCount?: number;
  difficultySeed?: number;
}

export interface AlphaWavePlan {
  waveIndex: number;
  enemyStats: AlphaEnemyStats;
  bossStats?: AlphaBossStats;
  snapshot: AlphaDifficultySnapshot;
  isBossWave: boolean;
}

interface TelemetryWindow {
  spawned: number;
  killed: number;
  damageDealt: number;
  damageTaken: number;
  startTime: number;
  endTime: number;
}

export class AlphaTelemetryBuffer {
  private events: AlphaTelemetryEvent[] = [];
  private readonly windowSeconds: number;

  constructor(windowSeconds = DEFAULT_ALPHA_PARAMS.efficiency.windowSeconds) {
    this.windowSeconds = windowSeconds;
  }

  record(event: AlphaTelemetryEvent): void {
    this.events.push(event);
    this.prune(event.timestamp);
  }

  recordSpawn(waveIndex: number, variant: EnemyVariant | BossId, timestamp = Date.now()): void {
    this.record({ timestamp, waveIndex, enemyVariant: variant, event: "spawn", value: 1 });
  }

  recordKill(waveIndex: number, variant: EnemyVariant | BossId, timestamp = Date.now()): void {
    this.record({ timestamp, waveIndex, enemyVariant: variant, event: "kill", value: 1 });
  }

  recordDamageDealt(
    waveIndex: number,
    variant: EnemyVariant | BossId,
    amount: number,
    timestamp = Date.now()
  ): void {
    this.record({ timestamp, waveIndex, enemyVariant: variant, event: "damage_dealt", value: amount });
  }

  recordDamageTaken(
    waveIndex: number,
    variant: EnemyVariant | BossId,
    amount: number,
    timestamp = Date.now()
  ): void {
    this.record({ timestamp, waveIndex, enemyVariant: variant, event: "damage_taken", value: amount });
  }

  recordNodeCaptured(waveIndex: number, timestamp = Date.now()): void {
    this.record({ timestamp, waveIndex, enemyVariant: "walker", event: "node_captured", value: 1 });
  }

  recordBossPhase(waveIndex: number, bossId: BossId, phase: number, timestamp = Date.now()): void {
    this.record({
      timestamp,
      waveIndex,
      enemyVariant: bossId,
      event: "boss_phase",
      value: phase,
    });
  }

  getWindow(now = Date.now()): TelemetryWindow {
    this.prune(now);
    const start = this.events.length > 0 ? this.events[0].timestamp : now;
    const end = now;

    let spawned = 0;
    let killed = 0;
    let damageDealt = 0;
    let damageTaken = 0;

    for (const ev of this.events) {
      switch (ev.event) {
        case "spawn":
          spawned += ev.value;
          break;
        case "kill":
          killed += ev.value;
          break;
        case "damage_dealt":
          damageDealt += ev.value;
          break;
        case "damage_taken":
          damageTaken += ev.value;
          break;
      }
    }

    return { spawned, killed, damageDealt, damageTaken, startTime: start, endTime: end };
  }

  toKillWindow(expectedKillRate = 0.75): AlphaKillWindow {
    const w = this.getWindow();
    return {
      spawned: w.spawned,
      killed: w.killed,
      killRate: w.spawned > 0 ? clamp(w.killed / w.spawned, 0, 1) : 0,
      expectedKillRate,
    };
  }

  private prune(now: number): void {
    const cutoff = now - this.windowSeconds * 1000;
    let i = 0;
    while (i < this.events.length && this.events[i].timestamp < cutoff) {
      i++;
    }
    if (i > 0) {
      this.events = this.events.slice(i);
    }
  }

  snapshot(): AlphaTelemetryEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}

export class AlphaScheduler {
  readonly params: AlphaParams;
  readonly totalWaves: number;
  readonly bossWaves: number[];
  readonly playerCount: number;
  readonly telemetry: AlphaTelemetryBuffer;

  private currentWaveIndex = 0;
  private playerBuilds: HeroBuildSnapshot[] = [];
  private currentSnapshot: AlphaDifficultySnapshot;
  private currentPlan: AlphaWavePlan | null = null;
  private lastTickAt = 0;
  private expectedKillRate = 0.75;

  constructor(options: AlphaSchedulerOptions) {
    this.totalWaves = options.totalWaves;
    this.bossWaves = [...options.bossWaves].sort((a, b) => a - b);
    this.params = options.params ?? DEFAULT_ALPHA_PARAMS;
    this.playerCount = clamp(options.playerCount ?? 1, 1, 8);
    this.telemetry = new AlphaTelemetryBuffer(this.params.efficiency.windowSeconds);

    this.currentSnapshot = this.computeSnapshotForWave(0);
  }

  /**
   * 从 GameState 同步玩家 Build 快照
   */
  syncPlayers(players: Player[]): void {
    this.playerBuilds = players.map((p) => createHeroBuildSnapshot(p));
  }

  /**
   * 手动设置玩家 Build（测试/服务端用）
   */
  setPlayerBuilds(builds: HeroBuildSnapshot[]): void {
    this.playerBuilds = builds;
  }

  /**
   * 每帧/每秒调用，刷新难度快照
   */
  tick(now = Date.now()): AlphaDifficultySnapshot {
    this.lastTickAt = now;
    this.currentSnapshot = this.computeSnapshotForWave(this.currentWaveIndex);
    return this.currentSnapshot;
  }

  private computeSnapshotForWave(waveIndex: number): AlphaDifficultySnapshot {
    const killWindow = this.telemetry.toKillWindow(this.expectedKillRate);
    return computeDifficulty(
      waveIndex,
      this.totalWaves,
      killWindow,
      this.averageBuild(),
      this.bossWaves,
      this.params
    );
  }

  /**
   * 推进到下一波，返回下一波计划
   */
  nextWave(): AlphaWavePlan {
    this.currentWaveIndex = clamp(this.currentWaveIndex + 1, 0, this.totalWaves - 1);
    this.telemetry.clear();
    return this.planWave(this.currentWaveIndex);
  }

  /**
   * 直接设置当前波次（用于加载存档/调试）
   */
  setWave(waveIndex: number): AlphaWavePlan {
    this.currentWaveIndex = clamp(waveIndex, 0, this.totalWaves - 1);
    return this.planWave(this.currentWaveIndex);
  }

  /**
   * 获取当前波次计划（不推进）
   */
  getCurrentPlan(): AlphaWavePlan {
    if (!this.currentPlan) {
      this.currentPlan = this.planWave(this.currentWaveIndex);
    }
    return this.currentPlan;
  }

  /**
   * 生成指定波次的完整计划
   */
  planWave(waveIndex: number): AlphaWavePlan {
    const snapshot = this.computeSnapshotForWave(waveIndex);
    const heroBuild = this.averageBuild();

    let enemyStats = generateEnemyWave(snapshot, heroBuild);
    enemyStats = applyPlayerCountScaling(enemyStats, this.playerCount);

    const isBossWave = this.bossWaves.includes(waveIndex);
    let bossStats: AlphaBossStats | undefined;

    if (isBossWave) {
      // Boss 波次降低小怪数量，避免场面混乱
      enemyStats = {
        ...enemyStats,
        waveEnemyCount: Math.round(enemyStats.waveEnemyCount * 0.55),
        eliteChance: enemyStats.eliteChance * 0.3,
      };

      // 默认使用 colossus，调用方可以覆盖
      bossStats = generateBossStats("colossus", snapshot, this.playerBuilds);
    }

    const plan: AlphaWavePlan = {
      waveIndex,
      enemyStats,
      bossStats,
      snapshot,
      isBossWave,
    };

    this.currentPlan = plan;
    return plan;
  }

  /**
   * 获取当前节奏指标
   */
  getRhythmMetrics(coreHealthPercent = 1, playerHealthPercent = 1): AlphaRhythmMetrics {
    const snapshot = this.currentSnapshot;
    const window = this.telemetry.getWindow();
    const totalSpawned = Math.max(1, window.spawned);

    return {
      intensity: snapshot.finalDifficulty,
      pressure: clamp(1 - Math.min(coreHealthPercent, playerHealthPercent), 0, 1),
      killEfficiency: clamp(window.killed / totalSpawned, 0, 1),
      isRelief: this.isReliefWave(this.currentWaveIndex),
    };
  }

  /**
   * 判断是否为释放波次（Boss 后或波次呼吸下降段）
   */
  isReliefWave(waveIndex: number): boolean {
    if (this.bossWaves.length === 0) return false;
    for (const bossWave of this.bossWaves) {
      if (waveIndex === bossWave + 1) return true;
    }
    const base = sigmoidDifficulty(waveIndex, this.totalWaves, this.params.curve);
    const withBreathing = this.params.curve.breathingStrength;
    // 如果呼吸后的难度明显低于基础难度，视为释放
    return base > 0.3 && base - withBreathing > 0;
  }

  /**
   * 生成全部波次计划（用于预览/服务端校验）
   */
  generateAllPlans(): AlphaWavePlan[] {
    const plans: AlphaWavePlan[] = [];
    for (let i = 0; i < this.totalWaves; i++) {
      plans.push(this.planWave(i));
    }
    return plans;
  }

  /**
   * 从 GameState 快速创建调度器
   */
  static fromGameState(state: GameState, options?: Partial<AlphaSchedulerOptions>): AlphaScheduler {
    const defense = state.defenseState;
    const totalWaves = defense?.totalWaves ?? 10;
    const currentWave = defense?.currentWave ?? 0;

    const bossWaves: number[] =
      defense?.waves
        ?.map((w, i): { w: import("../types").DefenseWave; i: number } => ({ w, i }))
        .filter(({ w }) => !!w.bossVariant)
        .map(({ i }) => i) ?? [];

    const scheduler = new AlphaScheduler({
      totalWaves,
      bossWaves,
      playerCount: state.players.length,
      ...options,
    });

    scheduler.syncPlayers(state.players);
    scheduler.setWave(currentWave);
    return scheduler;
  }

  private averageBuild(): HeroBuildSnapshot {
    if (this.playerBuilds.length === 0) {
      return {
        heroId: null,
        totalDps: 180,
        averageRange: 420,
        hasCrowdControl: false,
        hasAreaDamage: false,
        hasBurstDamage: false,
        survivability: 250,
      };
    }

    const builds = this.playerBuilds;
    return {
      heroId: builds[0]?.heroId ?? null,
      totalDps: builds.reduce((sum, b) => sum + b.totalDps, 0) / builds.length,
      averageRange: builds.reduce((sum, b) => sum + b.averageRange, 0) / builds.length,
      hasCrowdControl: builds.some((b) => b.hasCrowdControl),
      hasAreaDamage: builds.some((b) => b.hasAreaDamage),
      hasBurstDamage: builds.some((b) => b.hasBurstDamage),
      survivability: builds.reduce((sum, b) => sum + b.survivability, 0) / builds.length,
    };
  }
}

/**
 * 单局游戏运行时上下文封装
 */
export interface AlphaRuntimeContext {
  scheduler: AlphaScheduler;
  startTime: number;
  events: AlphaTelemetryEvent[];
}

export function createAlphaRuntime(options: AlphaSchedulerOptions): AlphaRuntimeContext {
  return {
    scheduler: new AlphaScheduler(options),
    startTime: Date.now(),
    events: [],
  };
}
