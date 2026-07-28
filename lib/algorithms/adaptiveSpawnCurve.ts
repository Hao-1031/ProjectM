/**
 * β-7 自适应刷怪曲线 (Adaptive Spawn Curve)
 *
 * 将波次渐进曲线与实时玩家表现结合，动态调整每一波的具体刷怪参数。
 * 基于弹性窗口机制：在标准刷怪曲线基础上，根据玩家的实时表现
 * 动态拉伸或压缩刷怪间隔、调整敌人类型混合比例、触发特殊事件。
 *
 * 核心设计：
 * - 弹性窗口：每波刷怪计划包含3个弹性区间（预热/心流/收尾）
 * - 表现追踪：追踪玩家伤害输出、受伤频率、技能使用效率
 * - 类型混合：根据玩家当前构筑自适应调整敌人类型混合
 * - 难度粘连：难度调整具有粘性，避免剧烈波动
 */

import type { WaveNode } from "./progression";
import type { EnemyVariant, GamePressure, SpawnCandidate, SpawnPlan, SpawnOptimizationReport } from "./spawnOptimizer";
import { optimizeSpawns } from "./spawnOptimizer";

export type AdaptivePhase = "warmup" | "flow" | "climax" | "cooldown";

export interface AdaptiveSpawnConfig {
  /** 弹性窗口策略 */
  phaseStrategy: "balanced" | "aggressive" | "defensive";
  /** 难度粘连系数（0~1，越大越不容易剧烈变化） */
  stickiness: number;
  /** 玩家表现感知窗口（秒） */
  performanceWindowSec: number;
  /** 最小刷怪间隔 */
  minSpawnInterval: number;
  /** 最大刷怪间隔 */
  maxSpawnInterval: number;
  /** 爆发窗口触发阈值（压力指数） */
  burstThreshold: number;
  /** 救援窗口触发阈值（玩家血量百分比） */
  rescueThreshold: number;
  /** 敌人类型混合变化最大步长 */
  mixChangeStep: number;
}

export interface PlayerPerformance {
  /** 每秒伤害输出 */
  dps: number;
  /** 每秒受伤 */
  damageTakenPerSec: number;
  /** 技能命中率 */
  skillAccuracy: number;
  /** 当前血量百分比 */
  healthPercent: number;
  /** 击杀效率（击杀/秒） */
  killRate: number;
  /** 移动活跃度 */
  mobilityScore: number;
}

export interface AdaptiveWavePlan {
  /** 波次索引 */
  waveIndex: number;
  /** 当前阶段 */
  phase: AdaptivePhase;
  /** 刷怪计划 */
  spawnPlan: SpawnOptimizationReport;
  /** 调整后的刷怪间隔 */
  adjustedInterval: number;
  /** 敌人类型混合权重 */
  variantMix: Record<EnemyVariant, number>;
  /** 是否触发爆发窗口 */
  burstActive: boolean;
  /** 是否触发救援窗口 */
  rescueActive: boolean;
  /** 适应的理由 */
  adaptationReason: string;
  /** 当前难度粘连值 */
  stickinessFactor: number;
}

export interface AdaptiveSpawnReport {
  /** 逐波计划 */
  waves: AdaptiveWavePlan[];
  /** 总体适应度 */
  overallAdaptationScore: number;
  /** 爆发窗口次数 */
  burstWindowCount: number;
  /** 救援窗口次数 */
  rescueWindowCount: number;
  /** 平均刷怪间隔 */
  averageSpawnInterval: number;
  /** 适应性评价 */
  adaptationVerdict: string;
}

const DEFAULT_CONFIG: AdaptiveSpawnConfig = {
  phaseStrategy: "balanced",
  stickiness: 0.7,
  performanceWindowSec: 15,
  minSpawnInterval: 0.6,
  maxSpawnInterval: 3.0,
  burstThreshold: 0.7,
  rescueThreshold: 0.25,
  mixChangeStep: 0.15,
};

const STANDARD_CANDIDATES: SpawnCandidate[] = [
  { variant: "walker", baseWeight: 0.35, baseIntervalSec: 1.2 },
  { variant: "runner", baseWeight: 0.25, baseIntervalSec: 1.0 },
  { variant: "tank", baseWeight: 0.15, baseIntervalSec: 2.0 },
  { variant: "spitter", baseWeight: 0.15, baseIntervalSec: 1.5 },
  { variant: "elite", baseWeight: 0.07, baseIntervalSec: 3.0 },
  { variant: "boss", baseWeight: 0.03, baseIntervalSec: 5.0 },
];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * 计算玩家表现评分
 */
export function evaluatePerformance(
  currentDps: number,
  damageTaken: number,
  healthPercent: number,
  killRate: number,
  skillAccuracy: number,
  previousPerformance?: PlayerPerformance
): PlayerPerformance {
  const mobilityScore = round2(clamp(killRate * 2 + (1 - healthPercent) * 0.3, 0, 1));

  return {
    dps: round2(currentDps),
    damageTakenPerSec: round2(damageTaken),
    skillAccuracy: round2(clamp(skillAccuracy, 0, 1)),
    healthPercent: round2(clamp(healthPercent, 0, 1)),
    killRate: round2(killRate),
    mobilityScore,
  };
}

/**
 * 计算表现偏差：当前表现相对于预期表现的偏差值
 * 正值表示玩家表现超出预期（需要增加难度）
 * 负值表示玩家表现低于预期（需要降低难度）
 */
export function calculatePerformanceDeviation(
  performance: PlayerPerformance,
  targetDifficulty: number
): number {
  const expectedDps = 50 + targetDifficulty * 150;
  const dpsDeviation = (performance.dps - expectedDps) / Math.max(1, expectedDps);

  const expectedKillRate = 0.3 + targetDifficulty * 0.5;
  const killDeviation = (performance.killRate - expectedKillRate) / Math.max(0.1, expectedKillRate);

  const healthDeviation = (performance.healthPercent - 0.5) * 0.5;

  const accuracyBonus = (performance.skillAccuracy - 0.6) * 0.3;

  return round2(clamp(dpsDeviation * 0.4 + killDeviation * 0.3 + healthDeviation * 0.2 + accuracyBonus * 0.1, -1, 1));
}

/**
 * 根据表现偏差调整敌人类型混合
 */
export function adjustVariantMix(
  baseMix: Record<EnemyVariant, number>,
  performanceDeviation: number,
  config: AdaptiveSpawnConfig
): Record<EnemyVariant, number> {
  const mix = { ...baseMix };
  const step = config.mixChangeStep;

  if (performanceDeviation > 0.3) {
    // 玩家表现过强：增加精英和坦克
    mix.tank = clamp(mix.tank + step, 0.05, 0.35);
    mix.elite = clamp(mix.elite + step * 0.7, 0.02, 0.2);
    mix.walker = clamp(mix.walker - step * 0.5, 0.1, 0.5);
    mix.runner = clamp(mix.runner - step * 0.3, 0.1, 0.4);
  } else if (performanceDeviation < -0.3) {
    // 玩家表现过弱：增加基础单位，减少高威胁单位
    mix.walker = clamp(mix.walker + step, 0.1, 0.5);
    mix.runner = clamp(mix.runner + step * 0.5, 0.1, 0.4);
    mix.tank = clamp(mix.tank - step * 0.5, 0.05, 0.35);
    mix.elite = clamp(mix.elite - step * 0.7, 0.02, 0.2);
  }

  // 归一化
  const total = Object.values(mix).reduce((a, b) => a + b, 0);
  if (total > 0) {
    for (const key of Object.keys(mix) as EnemyVariant[]) {
      mix[key] = round2(mix[key] / total);
    }
  }

  return mix;
}

/**
 * 确定当前波次的弹性阶段
 */
export function determinePhase(
  waveIndex: number,
  totalWaves: number,
  healthPercent: number,
  performanceDeviation: number
): AdaptivePhase {
  if (totalWaves <= 1) return "flow";

  const progress = waveIndex / (totalWaves - 1);

  if (progress < 0.2) {
    return performanceDeviation > 0.4 ? "flow" : "warmup";
  }

  if (progress > 0.85) {
    return performanceDeviation < -0.4 ? "cooldown" : "climax";
  }

  // 根据玩家血量调整
  if (healthPercent < 0.2 && performanceDeviation < -0.2) {
    return "cooldown";
  }

  if (performanceDeviation > 0.5 && healthPercent > 0.7) {
    return "climax";
  }

  return "flow";
}

/**
 * 计算弹性刷怪间隔
 */
export function calculateAdaptiveInterval(
  baseInterval: number,
  phase: AdaptivePhase,
  performanceDeviation: number,
  config: AdaptiveSpawnConfig
): number {
  let multiplier = 1.0;

  switch (phase) {
    case "warmup":
      multiplier = 1.3;
      break;
    case "flow":
      multiplier = 1.0;
      break;
    case "climax":
      multiplier = 0.7;
      break;
    case "cooldown":
      multiplier = 1.5;
      break;
  }

  // 表现偏差微调
  const deviationAdjust = -performanceDeviation * 0.3;
  multiplier += deviationAdjust;

  return round2(clamp(baseInterval * multiplier, config.minSpawnInterval, config.maxSpawnInterval));
}

/**
 * 核心：生成自适应刷怪曲线
 * 输入波次渐进曲线和实时玩家表现，输出逐波自适应刷怪计划
 */
export function generateAdaptiveSpawnCurve(
  waves: WaveNode[],
  performances: (PlayerPerformance | null)[],
  pressure: GamePressure,
  config: Partial<AdaptiveSpawnConfig> = {}
): AdaptiveSpawnReport {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const adaptiveWaves: AdaptiveWavePlan[] = [];
  let burstCount = 0;
  let rescueCount = 0;
  let totalInterval = 0;
  let previousDeviation = 0;
  const totalWaves = waves.length;

  // 初始敌人混合
  let currentMix: Record<EnemyVariant, number> = {
    walker: 0.35,
    runner: 0.25,
    tank: 0.15,
    spitter: 0.15,
    elite: 0.07,
    boss: 0.03,
  };

  for (let i = 0; i < totalWaves; i++) {
    const wave = waves[i];
    const perf = performances[i] ?? null;

    // 计算表现偏差
    let deviation = 0;
    if (perf) {
      deviation = calculatePerformanceDeviation(perf, wave.targetDifficulty);
    } else if (i > 0) {
      deviation = previousDeviation * 0.8; // 衰减
    }

    // 应用难度粘连
    const stickinessFactor = cfg.stickiness;
    deviation = round2(lerp(deviation, previousDeviation, stickinessFactor * 0.5));
    previousDeviation = deviation;

    // 确定阶段
    const healthPercent = perf?.healthPercent ?? 0.5;
    const phase = determinePhase(i, totalWaves, healthPercent, deviation);

    // 调整敌人类型混合
    currentMix = adjustVariantMix(currentMix, deviation, cfg);

    // 构建自定义刷怪候选
    const candidates: SpawnCandidate[] = STANDARD_CANDIDATES.map((c) => ({
      ...c,
      baseWeight: currentMix[c.variant] ?? c.baseWeight,
    }));

    // 计算压力（注入波次信息）
    const wavePressure: GamePressure = {
      ...pressure,
      elapsedWaveSec: 0,
      waveDurationSec: wave.spawnInterval * 15,
    };

    // 运行刷怪优化器
    const spawnPlan = optimizeSpawns(candidates, wavePressure, {
      burstThreshold: cfg.burstThreshold,
    });

    // 计算弹性间隔
    const adjustedInterval = calculateAdaptiveInterval(
      wave.spawnInterval,
      phase,
      deviation,
      cfg
    );

    const burstActive = spawnPlan.burstWindowActive;
    const rescueActive = healthPercent < cfg.rescueThreshold && deviation < -0.3;

    if (burstActive) burstCount++;
    if (rescueActive) rescueCount++;

    // 生成适应理由
    const reasons: string[] = [];
    if (phase !== "flow") reasons.push(`阶段: ${phase}`);
    if (Math.abs(deviation) > 0.2) {
      reasons.push(deviation > 0 ? "玩家强势，加大压力" : "玩家弱势，降低压力");
    }
    if (burstActive) reasons.push("爆发窗口激活");
    if (rescueActive) reasons.push("救援窗口激活");
    if (wave.isBossWave) reasons.push("Boss波次");
    if (wave.hasSpecialEvent) reasons.push("特殊事件波次");

    const adaptationReason = reasons.length > 0 ? reasons.join(" | ") : "标准节奏";

    adaptiveWaves.push({
      waveIndex: i,
      phase,
      spawnPlan,
      adjustedInterval,
      variantMix: { ...currentMix },
      burstActive,
      rescueActive,
      adaptationReason,
      stickinessFactor: round2(stickinessFactor),
    });

    totalInterval += adjustedInterval;
  }

  const avgInterval = totalWaves > 0 ? round2(totalInterval / totalWaves) : 0;
  const burstRatio = totalWaves > 0 ? round2(burstCount / totalWaves) : 0;
  const adaptationScore = round2(clamp(
    0.5 + (burstRatio * 0.3) - (rescueCount / Math.max(1, totalWaves) * 0.2),
    0, 1
  ));

  let adaptationVerdict = "平衡";
  if (adaptationScore > 0.7) adaptationVerdict = "高度动态 - 玩家体验紧张刺激";
  else if (adaptationScore < 0.3) adaptationVerdict = "保守 - 保护性适应为主";
  else if (burstCount > rescueCount * 2) adaptationVerdict = "激进 - 爆发窗口主导";
  else if (rescueCount > burstCount) adaptationVerdict = "救援 - 玩家压力较大";

  return {
    waves: adaptiveWaves,
    overallAdaptationScore: adaptationScore,
    burstWindowCount: burstCount,
    rescueWindowCount: rescueCount,
    averageSpawnInterval: avgInterval,
    adaptationVerdict,
  };
}

/**
 * 快速评估：仅基于当前波次和表现，给出实时建议
 * 用于游戏引擎中每帧或每波快速决策
 */
export function quickAdaptiveDecision(
  wave: WaveNode,
  performance: PlayerPerformance,
  pressure: GamePressure,
  config: Partial<AdaptiveSpawnConfig> = {}
): {
  suggestedInterval: number;
  suggestedPhase: AdaptivePhase;
  shouldTriggerBurst: boolean;
  shouldTriggerRescue: boolean;
  recommendedMix: Record<EnemyVariant, number>;
} {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const deviation = calculatePerformanceDeviation(performance, wave.targetDifficulty);
  const phase = determinePhase(wave.index, 20, performance.healthPercent, deviation);

  const currentMix: Record<EnemyVariant, number> = {
    walker: 0.35, runner: 0.25, tank: 0.15, spitter: 0.15, elite: 0.07, boss: 0.03,
  };

  const adjustedMix = adjustVariantMix(currentMix, deviation, cfg);
  const interval = calculateAdaptiveInterval(wave.spawnInterval, phase, deviation, cfg);

  const pressureIndex = clamp(
    (1 - performance.healthPercent) * 0.4 + (pressure.activeEnemyCount / Math.max(1, pressure.maxEnemyCount)) * 0.6,
    0, 1
  );

  return {
    suggestedInterval: interval,
    suggestedPhase: phase,
    shouldTriggerBurst: pressureIndex > cfg.burstThreshold && performance.healthPercent > 0.5,
    shouldTriggerRescue: performance.healthPercent < cfg.rescueThreshold,
    recommendedMix: adjustedMix,
  };
}