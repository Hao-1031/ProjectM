import { clamp } from "../math";
import type {
  AlphaCurveParams,
  AlphaEfficiencyParams,
  AlphaCounterParams,
  AlphaParams,
  AlphaDifficultySnapshot,
  HeroBuildSnapshot,
  AlphaKillWindow,
} from "./types";
import type { EnemyVariant, BossId, HeroId, Player } from "../types";

/**
 * α 动态节律算法 - 核心计算层
 *
 * 1. Sigmoid 基础曲线：控制难度平滑爬升，中后期不崩
 * 2. 击杀效率修正：根据玩家实际表现动态微调
 * 3. 英雄-敌人相克演化：根据英雄 Build 调整敌人类型权重
 */

export const DEFAULT_ALPHA_PARAMS: AlphaParams = {
  curve: {
    steepness: 8,
    midpoint: 0.55,
    maxDifficulty: 1,
    breathingStrength: 0.18,
  },
  efficiency: {
    responsiveness: 0.3,
    minFactor: 0.72,
    maxFactor: 1.36,
    windowSeconds: 30,
  },
  counter: {
    weightStrength: 0.35,
  },
  enabled: true,
  version: "alpha-1.0",
};

/**
 * Sigmoid 基础难度曲线
 */
export function sigmoidDifficulty(
  waveIndex: number,
  totalWaves: number,
  params: AlphaCurveParams = DEFAULT_ALPHA_PARAMS.curve
): number {
  const t = totalWaves <= 1 ? 0 : waveIndex / (totalWaves - 1);
  const exponent = -params.steepness * (t - params.midpoint);
  const sigmoid = 1 / (1 + Math.exp(exponent));
  return clamp(sigmoid * params.maxDifficulty, 0, params.maxDifficulty);
}

/**
 * 添加波次间呼吸感：Boss 前小幅下降，Boss 后明显下降
 */
export function applyBreathingFactor(
  baseDifficulty: number,
  waveIndex: number,
  totalWaves: number,
  bossWaves: number[],
  params: AlphaCurveParams = DEFAULT_ALPHA_PARAMS.curve
): number {
  if (bossWaves.length === 0 || params.breathingStrength <= 0) return baseDifficulty;

  let relief = 0;
  for (const bossWave of bossWaves) {
    const distance = waveIndex - bossWave;
    if (distance === -1) {
      // Boss 前 1 波：小幅缓解，给准备时间
      relief = Math.max(relief, params.breathingStrength * 0.5);
    } else if (distance === 1) {
      // Boss 后 1 波：明显释放
      relief = Math.max(relief, params.breathingStrength);
    }
  }

  // 避免早期 Boss 周期因基础难度过低而被呼吸缓解压到 0
  const minDifficulty = Math.min(0.05, baseDifficulty);
  relief = Math.min(relief, baseDifficulty - minDifficulty);

  return clamp(baseDifficulty - relief, minDifficulty, params.maxDifficulty);
}

/**
 * 玩家击杀效率修正因子
 */
export function efficiencyFactor(
  window: AlphaKillWindow,
  params: AlphaEfficiencyParams = DEFAULT_ALPHA_PARAMS.efficiency
): number {
  if (window.spawned <= 0 || window.expectedKillRate <= 0) return 1;

  const ratio = window.killRate / window.expectedKillRate;
  const factor = 1 + (ratio - 1) * params.responsiveness;
  return clamp(factor, params.minFactor, params.maxFactor);
}

/**
 * 根据玩家 Build 创建英雄快照
 */
export function createHeroBuildSnapshot(player: Player): HeroBuildSnapshot {
  const weapons = player.weapons ?? [];
  const totalDps = weapons.reduce((sum, w) => {
    const effectiveCooldown = Math.max(0.04, w.cooldown * (1 - player.cooldownReduction));
    return sum + (w.damage * w.count) / effectiveCooldown;
  }, 0);

  const averageRange =
    weapons.length > 0
      ? weapons.reduce((sum, w) => sum + w.range, 0) / weapons.length
      : 400;

  const weaponIds = weapons.map((w) => w.id);

  return {
    heroId: player.heroId,
    totalDps,
    averageRange,
    hasCrowdControl:
      player.heroId === "nitrogen" ||
      player.heroId === "viper" ||
      weaponIds.some((id) => id === "cryoLauncher" || id === "gravityWell"),
    hasAreaDamage:
      weaponIds.some(
        (id) =>
          id === "rocket" ||
          id === "flame" ||
          id === "plasma" ||
          id === "gravityWell" ||
          id === "vortexCannon"
      ) || player.heroId === "bastion",
    hasBurstDamage:
      weaponIds.some(
        (id) => id === "rocket" || id === "railgun" || id === "plasmaBlade" || id === "seekerRifle"
      ) || player.heroId === "recon",
    survivability: player.maxHealth * (1 + player.armor),
  };
}

/**
 * 英雄-敌人相克权重表
 *
 * 规则：
 * - 高爆发远程 → 提升突进/高速敌人
 * - 高机动近战 → 提升重装/高护甲敌人
 * - 强控制 → 提升分散/远程敌人
 * - 高生存 → 提升高伤害敌人
 */
export function getCounterWeights(
  build: HeroBuildSnapshot,
  variants: EnemyVariant[],
  params: AlphaCounterParams = DEFAULT_ALPHA_PARAMS.counter
): Record<EnemyVariant, number> {
  const weights = Object.fromEntries(variants.map((v) => [v, 1])) as Record<EnemyVariant, number>;

  const boost = (variant: EnemyVariant, amount: number) => {
    if (weights[variant] !== undefined) {
      weights[variant] = clamp(weights[variant] + amount * params.weightStrength, 0.3, 2.5);
    }
  };

  if (build.hasBurstDamage && build.averageRange > 450) {
    // 远程爆发怕突脸
    boost("runner", 0.8);
    boost("stalker", 0.7);
    boost("raptor", 0.7);
    boost("drone", 0.5);
  }

  if (build.hasAreaDamage && build.totalDps > 300) {
    // 范围伤害强时，提升高血量单体检疫
    boost("tank", 0.7);
    boost("crusher", 0.6);
    boost("shielder", 0.5);
  }

  if (build.hasCrowdControl) {
    // 控制强时，提升分散远程敌人
    boost("spitter", 0.6);
    boost("sniper", 0.5);
    boost("artillery", 0.5);
  }

  if (build.survivability > 350) {
    // 高生存 → 提升高伤害敌人
    boost("bomber", 0.5);
    boost("disruptor", 0.4);
  }

  if (build.totalDps < 150) {
    // 低输出 → 降低重装权重，避免打不动
    boost("tank", -0.4);
    boost("crusher", -0.3);
    boost("shielder", -0.3);
  }

  return weights;
}

/**
 * 综合难度计算
 */
export function computeDifficulty(
  waveIndex: number,
  totalWaves: number,
  killWindow: AlphaKillWindow,
  heroBuild: HeroBuildSnapshot,
  bossWaves: number[],
  params: AlphaParams = DEFAULT_ALPHA_PARAMS
): AlphaDifficultySnapshot {
  if (!params.enabled) {
    return {
      waveIndex,
      totalWaves,
      baseDifficulty: waveIndex / Math.max(1, totalWaves - 1),
      efficiencyFactor: 1,
      counterFactor: 1,
      finalDifficulty: waveIndex / Math.max(1, totalWaves - 1),
    };
  }

  const baseDifficulty = sigmoidDifficulty(waveIndex, totalWaves, params.curve);
  const withBreathing = applyBreathingFactor(
    baseDifficulty,
    waveIndex,
    totalWaves,
    bossWaves,
    params.curve
  );

  const effFactor = efficiencyFactor(killWindow, params.efficiency);

  // 英雄相克因子：基于权重分布的变异系数
  const mechanicalVariants: EnemyVariant[] = [
    "drone",
    "sentinel",
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
  ];
  const weights = getCounterWeights(heroBuild, mechanicalVariants, params.counter);
  const values = Object.values(weights);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const counterFactor = clamp(avg, 0.85, 1.25);

  const finalDifficulty = clamp(
    withBreathing * effFactor * counterFactor,
    0,
    params.curve.maxDifficulty
  );

  return {
    waveIndex,
    totalWaves,
    baseDifficulty,
    efficiencyFactor: effFactor,
    counterFactor,
    finalDifficulty,
  };
}

/**
 * 判断某个英雄是否被某个敌人类型克制（用于日志/调试）
 */
export function isVariantCounteredByHero(variant: EnemyVariant, heroId: HeroId | null): boolean {
  if (!heroId) return false;

  const counterMap: Partial<Record<HeroId, EnemyVariant[]>> = {
    recon: ["drone", "stalker", "raptor"],
    leopard: ["tank", "crusher", "shielder"],
    nitrogen: ["runner", "stalker", "raptor"],
    viper: ["spitter", "sniper", "artillery"],
    falcon: ["bomber", "disruptor"],
    bastion: ["runner", "raptor"],
    twilight: ["leech", "constructor"],
  };

  return counterMap[heroId]?.includes(variant) ?? false;
}
