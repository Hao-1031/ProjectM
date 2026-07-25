import type { PerformanceSnapshot } from "./types";

export interface OverloadBehaviorConfig {
  eliteRatio: number;
  rangedRatio: number;
  specialChance: number;
  bossWave: boolean;
}

const BRANCH_WAVE = 25;

export function calculateOverloadField(
  wave: number,
  _snapshot: PerformanceSnapshot
): OverloadBehaviorConfig {
  const x = Math.max(0, wave - BRANCH_WAVE);

  return {
    eliteRatio: Math.min(0.45, 0.12 + x * 0.025),
    rangedRatio: Math.min(0.42, 0.18 + x * 0.018),
    specialChance: Math.min(0.32, 0.06 + x * 0.022),
    bossWave: x > 0 && x % 8 === 0,
  };
}
