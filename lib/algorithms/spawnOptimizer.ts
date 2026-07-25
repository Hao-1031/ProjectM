export type EnemyVariant = "walker" | "runner" | "tank" | "spitter" | "elite" | "boss";

export interface SpawnCandidate {
  variant: EnemyVariant;
  baseWeight: number;
  baseIntervalSec: number;
}

export interface GamePressure {
  playerHealthPercent: number;
  coreHealthPercent: number;
  activeEnemyCount: number;
  maxEnemyCount: number;
  elapsedWaveSec: number;
  waveDurationSec: number;
  recentDamageTaken: number;
}

export interface SpawnPlan {
  variant: EnemyVariant;
  intervalSec: number;
  weight: number;
  burst: boolean;
  reason: string;
}

export interface SpawnOptimizationReport {
  plans: SpawnPlan[];
  totalWeight: number;
  pressureIndex: number;
  burstWindowActive: boolean;
}

const VARIANT_RULES: Record<
  EnemyVariant,
  { minHealth: number; maxPressure: number; prefersLowPlayerHealth: boolean }
> = {
  walker: { minHealth: 0, maxPressure: 1, prefersLowPlayerHealth: false },
  runner: { minHealth: 0, maxPressure: 0.8, prefersLowPlayerHealth: true },
  tank: { minHealth: 0.3, maxPressure: 0.7, prefersLowPlayerHealth: false },
  spitter: { minHealth: 0.2, maxPressure: 0.9, prefersLowPlayerHealth: false },
  elite: { minHealth: 0.4, maxPressure: 0.6, prefersLowPlayerHealth: false },
  boss: { minHealth: 0.5, maxPressure: 0.4, prefersLowPlayerHealth: false },
};

/**
 * 根据当前战场压力动态调整下一波刷怪计划。
 * 低玩家/核心血量时降低高威胁单位比例；高压力时触发爆发窗口。
 */
export function optimizeSpawns(
  candidates: SpawnCandidate[],
  pressure: GamePressure,
  options: { burstThreshold?: number; maxBurstMultiplier?: number } = {}
): SpawnOptimizationReport {
  const { burstThreshold = 0.75, maxBurstMultiplier = 1.8 } = options;

  const pressureIndex = calculatePressureIndex(pressure);
  const burstWindowActive = pressureIndex > burstThreshold && pressure.activeEnemyCount < pressure.maxEnemyCount * 0.6;

  const plans: SpawnPlan[] = candidates.map((candidate) => {
    const rules = VARIANT_RULES[candidate.variant];
    let weight = candidate.baseWeight;
    let interval = candidate.baseIntervalSec;
    const reasons: string[] = [];

    // 高威胁单位在压力过大时权重下降
    if (pressureIndex > rules.maxPressure) {
      weight *= 0.5;
      reasons.push("压力过大，削减高威胁单位");
    }

    // 玩家血量低时，优先刷取可收割单位恢复节奏
    if (rules.prefersLowPlayerHealth && pressure.playerHealthPercent < 0.4) {
      weight *= 1.3;
      reasons.push("玩家低血量，增加机动单位");
    }

    // 核心血量低时减缓攻势
    if (pressure.coreHealthPercent < 0.25) {
      interval *= 1.2;
      weight *= 0.8;
      reasons.push("核心低血量，降低压力");
    }

    // 场上敌人接近上限时，暂停新增 Boss/Elite
    const saturation = pressure.activeEnemyCount / Math.max(1, pressure.maxEnemyCount);
    if (saturation > 0.8 && (candidate.variant === "boss" || candidate.variant === "elite")) {
      weight *= 0.2;
      reasons.push("场上单位饱和");
    }

    // 爆发窗口：缩短间隔并提高普通敌人数量
    if (burstWindowActive && candidate.variant !== "boss") {
      interval /= clamp(maxBurstMultiplier / 1.5, 1.1, 1.5);
      weight *= clamp(maxBurstMultiplier, 1, 1.8);
      reasons.push("压力爆发窗口");
    }

    return {
      variant: candidate.variant,
      intervalSec: round2(Math.max(0.5, interval)),
      weight: round2(clamp(weight, 0.01, candidate.baseWeight * 3)),
      burst: burstWindowActive,
      reason: reasons.length > 0 ? reasons[0] : "标准刷新",
    };
  });

  const totalWeight = round2(plans.reduce((sum, p) => sum + p.weight, 0));

  return {
    plans,
    totalWeight,
    pressureIndex: round2(pressureIndex),
    burstWindowActive,
  };
}

function calculatePressureIndex(pressure: GamePressure): number {
  const healthFactor = (1 - pressure.playerHealthPercent) * 0.35;
  const coreFactor = (1 - pressure.coreHealthPercent) * 0.35;
  const saturationFactor =
    (pressure.activeEnemyCount / Math.max(1, pressure.maxEnemyCount)) * 0.2;
  const damageFactor = clamp(pressure.recentDamageTaken / 300, 0, 0.5);
  return clamp(healthFactor + coreFactor + saturationFactor + damageFactor, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
