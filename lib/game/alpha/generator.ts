import { clamp, weightedRandom } from "../math";
import type { EnemyVariant, BossId, Player } from "../types";
import { DEFAULT_BALANCE } from "../balance";
import type {
  AlphaDifficultySnapshot,
  AlphaEnemyStats,
  AlphaBossStats,
  HeroBuildSnapshot,
} from "./types";
import { getCounterWeights, DEFAULT_ALPHA_PARAMS } from "./core";

/**
 * α 动态节律算法 - 数值生成层
 *
 * 将 computeDifficulty 输出的综合难度转换为可运行的敌人/Boss 数值。
 * 所有数值以 DEFAULT_BALANCE 为基线，按 finalDifficulty 进行非线性缩放，
 * 保证前期有成长感、中后期不崩坏。
 */

/** 参与 α 算法的机械敌人类型（覆盖 core.ts 中所有 counter weights 引用） */
export const ALPHA_ENEMY_VARIANTS: EnemyVariant[] = [
  "walker",
  "runner",
  "drone",
  "sentinel",
  "tank",
  "crusher",
  "sniper",
  "stalker",
  "shielder",
  "harvester",
  "artillery",
  "disruptor",
  "scorcher",
  "bomber",
  "leech",
  "constructor",
  "raptor",
  "spitter",
];

/** 普通小怪模板，用于填充波次数量 */
export const ALPHA_FODDER_VARIANTS: EnemyVariant[] = [
  "walker",
  "runner",
  "drone",
  "sentinel",
];

interface ScalingParams {
  /** 生命缩放指数：难度低时更脆，难度高时更肉 */
  healthExponent: number;
  /** 伤害缩放指数 */
  damageExponent: number;
  /** 速度缩放上限 */
  speedMaxMul: number;
  /** 最小生成间隔 ms */
  minSpawnIntervalMs: number;
  /** 最大同屏数 */
  maxActiveCountCap: number;
}

export const DEFAULT_SCALING_PARAMS: ScalingParams = {
  healthExponent: 1.15,
  damageExponent: 1.08,
  speedMaxMul: 1.35,
  minSpawnIntervalMs: 220,
  maxActiveCountCap: 28,
};

/**
 * 计算波次基础敌人数
 * 前中期数量平滑增长，后期趋于上限
 */
export function waveEnemyCount(
  waveIndex: number,
  totalWaves: number,
  difficulty: number
): number {
  const progress = totalWaves <= 1 ? 0 : waveIndex / (totalWaves - 1);
  const baseCount = Math.round(6 + progress * 18);
  const difficultyBoost = Math.round(difficulty * 10);
  return clamp(baseCount + difficultyBoost, 4, 60);
}

/**
 * 计算精英敌人数
 */
export function eliteCount(
  waveIndex: number,
  totalWaves: number,
  difficulty: number,
  eliteChance: number
): number {
  const count = waveEnemyCount(waveIndex, totalWaves, difficulty);
  const expected = count * eliteChance;
  const guaranteed = Math.floor(expected);
  const remainder = expected - guaranteed;
  return guaranteed + (Math.random() < remainder ? 1 : 0);
}

/**
 * 生成单个敌人类型的数值
 */
export function generateVariantStats(
  variant: EnemyVariant,
  difficulty: number,
  isElite: boolean,
  scaling: ScalingParams = DEFAULT_SCALING_PARAMS
): Pick<AlphaEnemyStats, "maxHp" | "damage" | "speed"> {
  const balance = DEFAULT_BALANCE.enemies[variant] ?? DEFAULT_BALANCE.enemies.base;
  const baseHealth = 200 * balance.healthMul;
  const baseDamage = balance.damage;
  const baseSpeed = balance.speed;

  const healthMul = 1 + Math.pow(difficulty, scaling.healthExponent) * 4.5;
  const damageMul = 1 + Math.pow(difficulty, scaling.damageExponent) * 2.2;
  const speedMul = 1 + difficulty * (scaling.speedMaxMul - 1);

  let maxHp = Math.round(baseHealth * healthMul);
  let damage = Math.round(baseDamage * damageMul);
  let speed = Math.round(baseSpeed * speedMul);

  if (isElite) {
    const eliteHealthMul = balance.eliteHealthMul ?? 2.8;
    const eliteDamageMul = balance.eliteDamageMul ?? 1.5;
    const eliteSpeedMul = balance.eliteSpeedMul ?? 1.08;
    maxHp = Math.round(maxHp * eliteHealthMul);
    damage = Math.round(damage * eliteDamageMul);
    speed = Math.round(speed * eliteSpeedMul);
  }

  return { maxHp, damage, speed };
}

/**
 * 生成整波敌人配置
 */
export function generateEnemyWave(
  snapshot: AlphaDifficultySnapshot,
  heroBuild: HeroBuildSnapshot,
  scaling: ScalingParams = DEFAULT_SCALING_PARAMS
): AlphaEnemyStats {
  const { waveIndex, totalWaves, finalDifficulty } = snapshot;

  const count = waveEnemyCount(waveIndex, totalWaves, finalDifficulty);

  // 精英概率：基础概率 + 难度加成，但波次前期不刷精英避免开局暴毙
  const earlyWaveCap = waveIndex <= 1 ? 0 : waveIndex <= 3 ? 0.08 : 1;
  const eliteChance = clamp(
    (DEFAULT_BALANCE.difficulty.eliteChanceBase +
      finalDifficulty * DEFAULT_BALANCE.difficulty.eliteChanceGrowth * 4) *
      earlyWaveCap,
    0,
    DEFAULT_BALANCE.difficulty.eliteChanceMax
  );

  const elites = eliteCount(waveIndex, totalWaves, finalDifficulty, eliteChance);

  // 生成间隔：难度越高越密集，但有下限
  const baseInterval = DEFAULT_BALANCE.difficulty.baseInterval * 1000;
  const intervalMs = clamp(
    baseInterval * (1 - finalDifficulty * 0.72),
    scaling.minSpawnIntervalMs,
    baseInterval
  );

  // 同屏上限：根据数量与难度动态调整
  const maxActiveCount = clamp(
    Math.round(6 + finalDifficulty * 18 + count * 0.12),
    6,
    scaling.maxActiveCountCap
  );

  // 敌人类型权重
  const weights = getCounterWeights(
    heroBuild,
    ALPHA_ENEMY_VARIANTS,
    DEFAULT_ALPHA_PARAMS.counter
  );

  // 用 fodder 填充剩余位置，保证每波都有足够数量
  const variantWeights: Record<EnemyVariant, number> = { ...weights };
  for (const fodder of ALPHA_FODDER_VARIANTS) {
    if (variantWeights[fodder] === undefined) {
      variantWeights[fodder] = 1;
    }
    // 低难度波次增加普通小怪权重，降低高压敌人压力
    if (finalDifficulty < 0.35) {
      variantWeights[fodder] *= 1.2;
    }
  }

  // 计算平均数值用于展示/校验
  const selectedVariants = resolveWaveVariants(count, variantWeights);
  const averaged = averageVariantStats(selectedVariants, finalDifficulty, elites, scaling);

  return {
    maxHp: averaged.maxHp,
    damage: averaged.damage,
    speed: averaged.speed,
    spawnIntervalMs: intervalMs,
    eliteChance,
    maxActiveCount,
    waveEnemyCount: count,
    eliteCount: elites,
    variantWeights,
  };
}

/**
 * 根据权重抽取一波实际出现的敌人类型
 */
export function resolveWaveVariants(
  count: number,
  weights: Record<EnemyVariant, number>
): EnemyVariant[] {
  const entries = Object.entries(weights).map(([variant, weight]) => ({
    item: variant as EnemyVariant,
    weight: Math.max(0.05, weight),
  }));

  const result: EnemyVariant[] = [];
  for (let i = 0; i < count; i++) {
    result.push(weightedRandom(entries));
  }
  return result;
}

/**
 * 对一波敌人做数值平均，用于返回统计口径
 */
function averageVariantStats(
  variants: EnemyVariant[],
  difficulty: number,
  eliteCountValue: number,
  scaling: ScalingParams
): { maxHp: number; damage: number; speed: number } {
  if (variants.length === 0) return { maxHp: 0, damage: 0, speed: 0 };

  let totalHp = 0;
  let totalDamage = 0;
  let totalSpeed = 0;

  // 将精英均匀分布到抽取结果中
  const eliteIndices = new Set<number>();
  const elites = Math.min(eliteCountValue, variants.length);
  while (eliteIndices.size < elites) {
    eliteIndices.add(Math.floor(Math.random() * variants.length));
  }

  for (let i = 0; i < variants.length; i++) {
    const stats = generateVariantStats(variants[i], difficulty, eliteIndices.has(i), scaling);
    totalHp += stats.maxHp;
    totalDamage += stats.damage;
    totalSpeed += stats.speed;
  }

  return {
    maxHp: Math.round(totalHp / variants.length),
    damage: Math.round(totalDamage / variants.length),
    speed: Math.round(totalSpeed / variants.length),
  };
}

/**
 * 生成 Boss 数值配置
 */
export function generateBossStats(
  bossId: BossId,
  snapshot: AlphaDifficultySnapshot,
  playerBuilds: HeroBuildSnapshot[]
): AlphaBossStats {
  const { finalDifficulty, waveIndex, totalWaves } = snapshot;
  const progress = totalWaves <= 1 ? 0 : waveIndex / (totalWaves - 1);

  // Boss 血量按进度和难度做指数缩放
  const healthMultiplier = 1 + Math.pow(progress, 1.25) * 2.5 + finalDifficulty * 1.8;

  // Boss 伤害缩放更保守，防止秒杀
  const damageMultiplier = 1 + progress * 0.8 + finalDifficulty * 0.6;

  // 速度仅在中后期轻微提升
  const speedMultiplier = 1 + progress * 0.18;

  // 综合生存压力：根据玩家 Build 的生存能力微调 Boss 后释放强度
  const avgSurvivability =
    playerBuilds.length > 0
      ? playerBuilds.reduce((sum, b) => sum + b.survivability, 0) / playerBuilds.length
      : 300;
  const reliefScale = clamp(avgSurvivability / 400, 0.85, 1.15);

  return {
    bossId,
    healthMultiplier: clamp(healthMultiplier, 1, 6),
    damageMultiplier: clamp(damageMultiplier, 1, 3),
    speedMultiplier: clamp(speedMultiplier, 1, 1.35),
    preBossRelief: clamp(0.82 * reliefScale, 0.72, 0.92),
    postBossRelief: clamp(0.62 * reliefScale, 0.52, 0.78),
  };
}

/**
 * 根据玩家数量做数值补偿
 */
export function applyPlayerCountScaling(
  stats: AlphaEnemyStats,
  playerCount: number
): AlphaEnemyStats {
  const factor = clamp(1 + (playerCount - 1) * 0.35, 1, 2.5);
  return {
    ...stats,
    maxHp: Math.round(stats.maxHp * factor),
    waveEnemyCount: Math.round(stats.waveEnemyCount * (1 + (playerCount - 1) * 0.25)),
    maxActiveCount: Math.round(stats.maxActiveCount * (1 + (playerCount - 1) * 0.15)),
  };
}

/**
 * 快速生成一个用于调试的敌人配置
 */
export function generateDebugEnemyWave(
  waveIndex: number,
  totalWaves: number,
  player: Player
): AlphaEnemyStats {
  const { computeDifficulty, createHeroBuildSnapshot, DEFAULT_ALPHA_PARAMS } = require("./core");
  const snapshot = computeDifficulty(
    waveIndex,
    totalWaves,
    { spawned: 10, killed: 8, killRate: 0.8, expectedKillRate: 0.75 },
    createHeroBuildSnapshot(player),
    [],
    DEFAULT_ALPHA_PARAMS
  );
  return generateEnemyWave(snapshot, createHeroBuildSnapshot(player));
}
