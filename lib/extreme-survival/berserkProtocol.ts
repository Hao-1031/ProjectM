import type { WaveEnemyConfig, PerformanceSnapshot } from "./types";

const BASE_COUNT = 12;
const BRANCH_WAVE = 25;

export function calculateBerserkConfig(
  wave: number,
  snapshot: PerformanceSnapshot,
  performanceScore: number
): WaveEnemyConfig {
  const x = Math.max(0, wave - BRANCH_WAVE);
  const pressureFactor = Math.max(0, 1 - snapshot.coreHealthPercent);
  const performanceFactor = Math.max(0, performanceScore) / 100;

  const healthMul = (1 + x * 0.1) * (1 + performanceFactor * 0.15);
  const damageMul = (1 + x * 0.08) * (1 + pressureFactor * 0.25);
  const speedMul = 1 + x * 0.05;
  const spawnCount = BASE_COUNT + Math.floor(x * 2.2) + Math.floor(x / 5) * 3;

  return {
    healthMultiplier: parseFloat(healthMul.toFixed(4)),
    damageMultiplier: parseFloat(damageMul.toFixed(4)),
    speedMultiplier: parseFloat(speedMul.toFixed(4)),
    spawnCount,
    eliteRatio: 0,
    rangedRatio: 0,
    specialChance: 0,
  };
}
