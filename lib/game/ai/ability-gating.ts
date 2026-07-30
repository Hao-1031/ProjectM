import type { Enemy, EnemyVariant, BossId } from "../types";
import type {
  AbilityGate,
  PredictiveAimConfig,
  DodgeConfig,
  HeroCounterConfig,
  HeroCounterStrategy,
} from "./types";

/**
 * β 能力门控系统
 *
 * 双重控制机制：
 * 1. 波次分段解锁：按波次范围决定能力池
 * 2. 敌人类型分级：普通/精英/Boss 使用不同深度的能力
 *
 * 波次解锁表：
 *  1-10 波：基础AI（仅原有行为）
 * 11-20 波：预判瞄准（精英+），角色分工+集火+编队（全部）
 * 21-25 波：弹幕躲避（精英+），掩护撤退（全部），防守习惯识别（全部）
 * 26-35 波：武器对策（精英+），英雄对策（精英+）
 * 36-50 波：全部能力 + 地形利用（Boss+）
 */

/** 每5波递增参数 */
const WAVE_SCALING = {
  aggressionPer5Waves: 0.05,
  reactionSpeedPer5Waves: 0.03,
  coordinationPer5Waves: 0.05,
};

export function getAbilityGate(
  wave: number,
  enemy: Enemy
): AbilityGate {
  const isElite = enemy.isElite;
  const isBoss = enemy.isBoss;
  const isEliteOrBoss = isElite || isBoss;

  // 波次分段
  const tier = getWaveTier(wave);

  return {
    // 预判瞄准：11波起精英+可用，21波起全部可用
    predictiveAim: tier >= 2 && (isEliteOrBoss || tier >= 3),
    // 弹幕躲避：21波起精英+可用，26波起全部可用
    projectileDodge: tier >= 3 && (isEliteOrBoss || tier >= 4),
    // 武器对策：26波起精英+可用，36波起全部可用
    weaponCounter: tier >= 4 && (isEliteOrBoss || tier >= 5),
    // 地形利用：36波起Boss可用，Boss总是可用（覆盖所有波次Boss）
    terrainUtilization: (tier >= 5 && isBoss) || (isBoss && tier >= 1),
    // 角色分工：11波起全部可用
    roleDivision: tier >= 2,
    // 集火指令：11波起全部可用
    focusFire: tier >= 2,
    // 掩护撤退：21波起全部可用
    coverRetreat: tier >= 3,
    // 编队协同：基础（1波起），11波起增强
    formationCoordination: tier >= 2,
    // 防守习惯识别：21波起全部可用
    habitRecognition: tier >= 3,
    // 英雄对策：26波起精英+可用
    heroCounter: tier >= 4 && isEliteOrBoss,
  };
}

/** 获取波次等级（0-5） */
function getWaveTier(wave: number): number {
  if (wave <= 10) return 1;   // 标准巡航
  if (wave <= 20) return 2;   // 超频增压
  if (wave <= 25) return 3;   // 地狱终局
  if (wave <= 35) return 4;   // 深渊
  if (wave <= 45) return 5;   // 虚空
  return 6;                    // 创世（全能力）
}

/** 获取波次递增难度加成 */
export function getWaveScalingBonus(wave: number): {
  aggressionBonus: number;
  reactionBonus: number;
  coordinationBonus: number;
} {
  const increments = Math.floor((wave - 1) / 5);
  return {
    aggressionBonus: Math.min(increments * WAVE_SCALING.aggressionPer5Waves, 0.5),
    reactionBonus: Math.min(increments * WAVE_SCALING.reactionSpeedPer5Waves, 0.3),
    coordinationBonus: Math.min(increments * WAVE_SCALING.coordinationPer5Waves, 0.5),
  };
}

/** 获取预判瞄准配置 */
export function getPredictiveAimConfig(
  wave: number,
  enemy: Enemy,
  aggression: number
): PredictiveAimConfig {
  const gate = getAbilityGate(wave, enemy);
  const scaling = getWaveScalingBonus(wave);

  return {
    enabled: gate.predictiveAim,
    accuracy: clamp(0.35 + aggression * 0.4 + scaling.reactionBonus, 0.3, 0.9),
    lookAheadTime: 0.3 + aggression * 0.4,
  };
}

/** 获取弹幕躲避配置 */
export function getDodgeConfig(
  wave: number,
  enemy: Enemy,
  aggression: number
): DodgeConfig {
  const gate = getAbilityGate(wave, enemy);
  const scaling = getWaveScalingBonus(wave);

  return {
    enabled: gate.projectileDodge,
    detectionRadius: 180 + enemy.radius * 2,
    reactionSpeed: clamp(0.3 + aggression * 0.35 + scaling.reactionBonus, 0.25, 0.85),
    minDodgeAngle: Math.PI / 12,
  };
}

/** 获取英雄对策策略 */
export function getHeroCounterStrategy(
  heroId: string | null,
  enemy: Enemy
): HeroCounterStrategy {
  if (!heroId) return "default";

  switch (heroId) {
    case "bastion":
      return "destroy_deployables";
    case "leopard":
      return "avoid_melee";
    case "nitrogen":
      return "spread_out";
    case "twilight":
      return "anti_controller";
    case "recon":
      return "anti_recon";
    case "falcon":
      return "anti_sniper";
    case "viper":
      return "rush_down";
    default:
      return "default";
  }
}

/** 获取英雄对策配置 */
export function getHeroCounterConfig(
  wave: number,
  enemy: Enemy,
  detectedHeroId: string | null
): HeroCounterConfig {
  const gate = getAbilityGate(wave, enemy);

  return {
    enabled: gate.heroCounter,
    detectedHeroId: detectedHeroId as HeroCounterConfig["detectedHeroId"],
    strategy: getHeroCounterStrategy(detectedHeroId, enemy),
  };
}

/** 根据英雄对策策略调整行为参数 */
export function applyHeroCounterBehavior(
  strategy: HeroCounterStrategy,
  baseBehavior: string,
  dist: number,
  attackRange: number
): { behavior: string; preferredDistance: number; speedMul: number } {
  switch (strategy) {
    case "destroy_deployables":
      return { behavior: "chase", preferredDistance: 80, speedMul: 1.1 };
    case "avoid_melee":
      return { behavior: "keep_distance", preferredDistance: 240, speedMul: 1.05 };
    case "anti_sniper":
      return { behavior: dist < attackRange * 0.8 ? "flank" : "chase", preferredDistance: 160, speedMul: 1.0 };
    case "anti_recon":
      return { behavior: "ambush", preferredDistance: 180, speedMul: 1.15 };
    case "rush_down":
      return { behavior: "charge", preferredDistance: 60, speedMul: 1.2 };
    case "spread_out":
      return { behavior: dist < attackRange * 1.2 ? "strafe" : "chase", preferredDistance: 200, speedMul: 1.0 };
    case "anti_controller":
      return { behavior: "keep_distance", preferredDistance: 220, speedMul: 1.0 };
    default:
      return { behavior: baseBehavior, preferredDistance: 160, speedMul: 1.0 };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}