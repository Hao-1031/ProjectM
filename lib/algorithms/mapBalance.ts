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
  balanceScore: number;
  deviation: number;
}

export interface MapBalanceReport {
  averageWinRate: number;
  variants: MapVariantReport[];
  recommendations: string[];
}

export function analyzeMapBalance(stats: MapVariantStat[]): MapBalanceReport {
  if (!stats.length) {
    return { averageWinRate: 0, variants: [], recommendations: [] };
  }

  const variants = stats.map((s) => {
    const winRate = s.matches > 0 ? s.wins / s.matches : 0;
    return {
      variantId: s.variantId,
      winRate,
      sampleSize: s.matches,
      avgDurationSec: s.avgDurationSec,
    };
  });

  const averageWinRate =
    variants.reduce((sum, v) => sum + v.winRate * v.sampleSize, 0) /
    Math.max(1, variants.reduce((sum, v) => sum + v.sampleSize, 0));

  const maxSample = Math.max(...variants.map((v) => v.sampleSize));

  const scoredVariants = variants.map((v) => {
    // 样本越大，偏差越可信；样本过小则平衡分向均值回归
    const sampleWeight = clamp(v.sampleSize / Math.max(1, maxSample), 0.1, 1);
    const deviation = v.winRate - averageWinRate;
    const rawDeviation = deviation * sampleWeight;

    // 平衡分：越接近平均胜率分越高，50% 为满分基准
    const balanceScore = clamp(
      100 - Math.abs(rawDeviation) * 200 - (1 - sampleWeight) * 10,
      0,
      100
    );

    return {
      variantId: v.variantId,
      winRate: round2(v.winRate),
      sampleSize: v.sampleSize,
      balanceScore: round2(balanceScore),
      deviation: round2(rawDeviation),
    };
  });

  scoredVariants.sort((a, b) => b.balanceScore - a.balanceScore);

  const recommendations: string[] = [];
  const worst = scoredVariants[scoredVariants.length - 1];
  const best = scoredVariants[0];

  if (worst && worst.balanceScore < 60) {
    const direction = worst.deviation > 0 ? "降低敌人强度或出生点压力" : "降低玩家初始劣势或增加资源";
    recommendations.push(`${worst.variantId} 胜率偏离 ${(worst.deviation * 100).toFixed(1)}%，建议：${direction}`);
  }

  const lowSampleVariants = scoredVariants.filter((v) => v.sampleSize < 30);
  if (lowSampleVariants.length > 0) {
    recommendations.push(
      `${lowSampleVariants.map((v) => v.variantId).join(", ")} 样本不足（<30），请继续收集数据后再下结论。`
    );
  }

  if (best && best.balanceScore >= 85) {
    recommendations.push(`${best.variantId} 平衡表现优秀，可作为后续地图设计基准。`);
  }

  return {
    averageWinRate: round2(averageWinRate),
    variants: scoredVariants,
    recommendations,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
