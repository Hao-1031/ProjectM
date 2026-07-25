export interface MapVariantStat {
  variantId: string;
  matches: number;
  wins: number;
  avgDurationSec: number;
}

export interface MapVariantReport {
  variantId: string;
  winRate: number;
  sampleSize: number;
  avgDurationSec: number;
  balanceScore: number;
  deviation: number;
  durationDeviation: number;
  outlier: boolean;
}

export interface MapBalanceReport {
  averageWinRate: number;
  averageDurationSec: number;
  variants: MapVariantReport[];
  recommendations: string[];
}

const TARGET_DURATION_SEC = 600;
const OUTLIER_STD_THRESHOLD = 1.5;

export function analyzeMapBalance(stats: MapVariantStat[]): MapBalanceReport {
  if (!stats.length) {
    return { averageWinRate: 0, averageDurationSec: 0, variants: [], recommendations: [] };
  }

  const variants = stats.map((s) => ({
    variantId: s.variantId,
    winRate: s.matches > 0 ? s.wins / s.matches : 0,
    sampleSize: s.matches,
    avgDurationSec: s.avgDurationSec,
  }));

  const totalMatches = variants.reduce((sum, v) => sum + v.sampleSize, 0);
  const averageWinRate =
    variants.reduce((sum, v) => sum + v.winRate * v.sampleSize, 0) / Math.max(1, totalMatches);
  const averageDurationSec =
    variants.reduce((sum, v) => sum + v.avgDurationSec * v.sampleSize, 0) / Math.max(1, totalMatches);

  const maxSample = Math.max(...variants.map((v) => v.sampleSize));

  // 计算胜率和时长的标准差，用于标记异常值
  const winRateStd = calculateStd(variants.map((v) => v.winRate));
  const durationStd = calculateStd(variants.map((v) => v.avgDurationSec));

  const scoredVariants = variants.map((v) => {
    const sampleWeight = clamp(v.sampleSize / Math.max(1, maxSample), 0.1, 1);
    const deviation = v.winRate - averageWinRate;
    const rawDeviation = deviation * sampleWeight;

    // 平衡分：越接近平均胜率分越高，50% 为满分基准
    const winBalance = clamp(
      100 - Math.abs(rawDeviation) * 200 - (1 - sampleWeight) * 10,
      0,
      100
    );

    // 时长偏离：过长或过短都扣分
    const durationDeviation = v.avgDurationSec - averageDurationSec;
    const durationRatio = v.avgDurationSec / Math.max(1, TARGET_DURATION_SEC);
    const durationBalance = clamp(
      100 - Math.abs(durationRatio - 1) * 100 * sampleWeight,
      0,
      100
    );

    const balanceScore = clamp(winBalance * 0.7 + durationBalance * 0.3, 0, 100);

    const isWinOutlier = Math.abs(deviation) > winRateStd * OUTLIER_STD_THRESHOLD;
    const isDurationOutlier =
      Math.abs(durationDeviation) > durationStd * OUTLIER_STD_THRESHOLD;

    return {
      variantId: v.variantId,
      winRate: round2(v.winRate),
      sampleSize: v.sampleSize,
      avgDurationSec: v.avgDurationSec,
      balanceScore: round2(balanceScore),
      deviation: round2(rawDeviation),
      durationDeviation: round2(durationDeviation),
      outlier: isWinOutlier || isDurationOutlier,
    };
  });

  scoredVariants.sort((a, b) => b.balanceScore - a.balanceScore);

  const recommendations: string[] = [];
  const worst = scoredVariants[scoredVariants.length - 1];
  const best = scoredVariants[0];
  const outliers = scoredVariants.filter((v) => v.outlier);

  if (worst && worst.balanceScore < 60) {
    const direction = worst.deviation > 0
      ? "降低敌人强度或出生点压力"
      : "降低玩家初始劣势或增加资源";
    recommendations.push(
      `${worst.variantId} 胜率偏离 ${(worst.deviation * 100).toFixed(1)}%，建议：${direction}`
    );
  }

  if (worst && Math.abs(worst.durationDeviation) > 120) {
    const durationDirection = worst.durationDeviation > 0
      ? "缩短对局时长"
      : "增加波次或敌人密度";
    recommendations.push(
      `${worst.variantId} 时长偏离均值 ${worst.durationDeviation.toFixed(0)}s，建议：${durationDirection}`
    );
  }

  if (outliers.length > 0) {
    recommendations.push(
      `异常变体：${outliers.map((v) => v.variantId).join(", ")}，建议优先复核数据或人工测试。`
    );
  }

  const lowSampleVariants = scoredVariants.filter((v) => v.sampleSize < 30);
  if (lowSampleVariants.length > 0) {
    recommendations.push(
      `${lowSampleVariants.map((v) => v.variantId).join(", ")} 样本不足（<30），请继续收集数据后再下结论。`
    );
  }

  if (best && best.balanceScore >= 75) {
    recommendations.push(`${best.variantId} 平衡表现优秀，可作为后续地图设计基准。`);
  }

  return {
    averageWinRate: round2(averageWinRate),
    averageDurationSec: round2(averageDurationSec),
    variants: scoredVariants,
    recommendations,
  };
}

function calculateStd(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
