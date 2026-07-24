import type { AIParams } from "./types";
import type { AlphaDifficultySnapshot } from "../alpha/types";

/**
 * β-α 联动桥接层
 *
 * 将 α 动态节律算法输出的 finalDifficulty 映射为 AI 行为参数，
 * 使敌人/Boss/Bot 的难度感受与数值难度同步。
 */

export function mapDifficultyToAIParams(
  snapshot?: AlphaDifficultySnapshot,
  overrides?: Partial<AIParams>
): AIParams {
  const d = clampDifficulty(snapshot?.finalDifficulty ?? 0.5);

  // 基础侵略性：低难度 0.25，高难度 1.0
  const aggression = lerp(0.25, 1.0, easeInQuad(d));

  // 群体行为权重：低难度分散，高难度更有组织
  const separationWeight = lerp(0.8, 0.35, d);
  const alignmentWeight = lerp(0.1, 0.45, d);
  const cohesionWeight = lerp(0.1, 0.35, d);

  // 障碍物避让：高难度略降，让敌人更愿意穿缝
  const obstacleWeight = lerp(1.2, 0.85, d);

  // 保持距离缩放：高难度近战单位更敢贴脸，远程更敢拉开
  const preferredDistanceMul = lerp(1.15, 0.85, d);

  // 速度倍率：高难度上限更高
  const speedMulCap = lerp(1.0, 1.25, d);

  // 攻击欲望：高难度更频繁开火
  const attackDesireMul = lerp(0.7, 1.35, d);

  // Bot：高难度更准、反应更快
  const botAccuracy = lerp(0.55, 0.92, d);
  const botReactionDelay = lerp(0.35, 0.08, d);

  return {
    aggression,
    separationWeight,
    alignmentWeight,
    cohesionWeight,
    obstacleWeight,
    preferredDistanceMul,
    speedMulCap,
    attackDesireMul,
    botAccuracy,
    botReactionDelay,
    ...overrides,
  };
}

export function getAggression(snapshot?: AlphaDifficultySnapshot): number {
  return mapDifficultyToAIParams(snapshot).aggression;
}

export function getSpeedMultiplier(snapshot?: AlphaDifficultySnapshot): number {
  return mapDifficultyToAIParams(snapshot).speedMulCap;
}

export function getAttackDesireMultiplier(snapshot?: AlphaDifficultySnapshot): number {
  return mapDifficultyToAIParams(snapshot).attackDesireMul;
}

function clampDifficulty(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInQuad(t: number): number {
  return t * t;
}
