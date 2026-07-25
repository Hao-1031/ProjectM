import type { PerformanceSnapshot } from "./types";

export interface BaseBehaviorConfig {
  eliteRatio: number;
  rangedRatio: number;
  specialChance: number;
}

export function calculateBaseBehaviorMix(
  wave: number,
  _snapshot: PerformanceSnapshot
): BaseBehaviorConfig {
  const clampedWave = Math.max(1, wave);

  return {
    eliteRatio: Math.min(0.12, 0.03 + clampedWave * 0.005),
    rangedRatio: Math.min(0.15, 0.05 + clampedWave * 0.004),
    specialChance: Math.min(0.05, 0 + clampedWave * 0.006),
  };
}
