import type { WaveEnemyConfig, PerformanceSnapshot } from "./types";

const BASE_COUNT = 10;

export function calculateBaseAttributeConfig(
  wave: number,
  snapshot: PerformanceSnapshot
): WaveEnemyConfig {
  const clampedWave = Math.max(1, wave);
  const playerHealthFactor = Math.max(0.5, snapshot.coreHealthPercent);

  const healthMul = 1 + clampedWave * 0.035;
  const damageMul = 1 + clampedWave * 0.025 * (1 + (1 - playerHealthFactor) * 0.2);
  const speedMul = 1 + clampedWave * 0.015;
  const spawnCount = BASE_COUNT + Math.floor(clampedWave * 0.6);

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
