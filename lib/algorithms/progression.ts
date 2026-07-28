/**
 * α-7 波次渐进曲线 (Progression Curve)
 *
 * 将 DDA 难度调整扩展为全波次可预测的渐进曲线。
 * 计算每一波的目标参数，确保难度平滑递增而非陡峭跳跃。
 * 输出完整的波次计划表，支持可视化曲线与逐波审计。
 */

export interface WaveNode {
  /** 波次编号 (0-based) */
  index: number;
  /** 目标难度系数 (0~1) */
  targetDifficulty: number;
  /** 预计敌人数 */
  estimatedEnemyCount: number;
  /** 预计精英数 */
  estimatedEliteCount: number;
  /** 预计血量倍率 */
  healthMultiplier: number;
  /** 预计伤害倍率 */
  damageMultiplier: number;
  /** 预计刷新间隔(秒) */
  spawnInterval: number;
  /** 是否包含特殊事件 */
  hasSpecialEvent: boolean;
  /** 是否包含 Boss 波次 */
  isBossWave: boolean;
  /** 本波建议奖励倍率 */
  rewardMultiplier: number;
}

export interface ProgressionConfig {
  totalWaves: number;
  /** 起始难度 0~1 */
  startDifficulty: number;
  /** 峰值难度 0~1 */
  peakDifficulty: number;
  /** 曲线类型 */
  curveType: "linear" | "exponential" | "sigmoid" | "staircase";
  /** Boss 波次间隔（每 N 波一次 Boss） */
  bossWaveInterval: number;
  /** 特殊事件波次索引 */
  specialEventWaves: number[];
  /** 玩家技能分 0~1 */
  playerSkillScore: number;
  /** 队伍规模 */
  teamSize: number;
}

export interface ProgressionReport {
  waves: WaveNode[];
  curveLabel: string;
  /** 整体难度曲线数据点（用于可视化） */
  difficultyPoints: number[];
  /** 平均难度 */
  averageDifficulty: number;
  /** 难度方差 */
  difficultyVariance: number;
  /** 预测通关率 */
  predictedClearRate: number;
  /** 总预计敌人 */
  totalEnemies: number;
  /** 总预计精英 */
  totalElites: number;
  /** 心流区间命中率：波次难度落在 0.3~0.75 的比例 */
  flowZoneRatio: number;
}

const BASE_ENEMY_COUNT = 12;
const BASE_ELITE_COUNT = 0;
const BASE_SPAWN_INTERVAL = 1.5;
const BASE_HEALTH = 1.0;
const BASE_DAMAGE = 1.0;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function curveValue(t: number, type: ProgressionConfig["curveType"]): number {
  switch (type) {
    case "linear":
      return t;
    case "exponential":
      return t * t;
    case "sigmoid":
      return 1 / (1 + Math.exp(-(t - 0.5) * 8));
    case "staircase":
      return Math.floor(t * 4) / 4;
    default:
      return t;
  }
}

export function calculateProgressionCurve(config: ProgressionConfig): ProgressionReport {
  const { totalWaves, startDifficulty, peakDifficulty, curveType, bossWaveInterval, specialEventWaves, playerSkillScore, teamSize } = config;

  const waves: WaveNode[] = [];
  const difficultyPoints: number[] = [];
  const difficultyRange = peakDifficulty - startDifficulty;

  let totalEnemies = 0;
  let totalElites = 0;
  let flowZoneCount = 0;

  for (let i = 0; i < totalWaves; i++) {
    const t = totalWaves > 1 ? i / (totalWaves - 1) : 0;
    const curveT = curveValue(t, curveType);
    const rawDifficulty = startDifficulty + difficultyRange * curveT;

    const isBossWave = bossWaveInterval > 0 && (i + 1) % bossWaveInterval === 0;
    const hasSpecialEvent = specialEventWaves.includes(i);

    let targetDifficulty = rawDifficulty;
    if (isBossWave) targetDifficulty = clamp(rawDifficulty * 1.4, startDifficulty, peakDifficulty);
    if (hasSpecialEvent) targetDifficulty = clamp(rawDifficulty * 1.25, startDifficulty, peakDifficulty);

    const skillAdjustment = (playerSkillScore - 0.5) * 0.3;
    const teamAdjustment = (teamSize - 2) * 0.08;
    targetDifficulty = clamp(targetDifficulty + skillAdjustment + teamAdjustment, 0.05, 0.95);

    const enemyCount = Math.round(BASE_ENEMY_COUNT * (1 + targetDifficulty * 1.8 + teamSize * 0.3));
    const eliteCount = Math.round(BASE_ELITE_COUNT + targetDifficulty * 4 + (isBossWave ? 1 : 0));
    const healthMultiplier = round2(BASE_HEALTH + targetDifficulty * 0.6);
    const damageMultiplier = round2(BASE_DAMAGE + targetDifficulty * 0.45);
    const spawnInterval = round2(Math.max(0.5, BASE_SPAWN_INTERVAL * (1 - targetDifficulty * 0.4)));
    const rewardMultiplier = round2(1 + targetDifficulty * 1.5 + (isBossWave ? 0.5 : 0) + (hasSpecialEvent ? 0.3 : 0));

    totalEnemies += enemyCount;
    totalElites += eliteCount;

    if (targetDifficulty >= 0.3 && targetDifficulty <= 0.75) flowZoneCount++;

    waves.push({
      index: i,
      targetDifficulty: round2(targetDifficulty),
      estimatedEnemyCount: enemyCount,
      estimatedEliteCount: eliteCount,
      healthMultiplier,
      damageMultiplier,
      spawnInterval,
      hasSpecialEvent,
      isBossWave,
      rewardMultiplier,
    });

    difficultyPoints.push(round2(targetDifficulty));
  }

  const avgDifficulty = difficultyPoints.reduce((a, b) => a + b, 0) / difficultyPoints.length;
  const difficultyVariance = round2(
    difficultyPoints.reduce((sum, d) => sum + (d - avgDifficulty) ** 2, 0) / difficultyPoints.length
  );

  const predictedClearRate = clamp(1 - avgDifficulty * 0.85 + playerSkillScore * 0.4, 0.05, 0.95);
  const flowZoneRatio = round2(totalWaves > 0 ? flowZoneCount / totalWaves : 0);

  const curveLabels: Record<string, string> = {
    linear: "线性渐进",
    exponential: "指数加速",
    sigmoid: "S 型过渡",
    staircase: "阶梯爬升",
  };

  return {
    waves,
    curveLabel: curveLabels[curveType] ?? curveType,
    difficultyPoints,
    averageDifficulty: round2(avgDifficulty),
    difficultyVariance,
    predictedClearRate: round2(predictedClearRate),
    totalEnemies,
    totalElites,
    flowZoneRatio,
  };
}

/**
 * 对比两种曲线类型，输出推荐结果
 */
export function compareCurves(
  config: Omit<ProgressionConfig, "curveType">,
  types: ProgressionConfig["curveType"][]
): { type: string; flowZoneRatio: number; predictedClearRate: number; averageDifficulty: number }[] {
  return types.map((type) => {
    const report = calculateProgressionCurve({ ...config, curveType: type });
    return {
      type: report.curveLabel,
      flowZoneRatio: report.flowZoneRatio,
      predictedClearRate: report.predictedClearRate,
      averageDifficulty: report.averageDifficulty,
    };
  });
}