export interface DropTableItem {
  id: string;
  baseWeight: number;
  value: number;
}

export interface EconomyState {
  playerPlaytimeMinutes: number;
  playerRecentDrops: string[];
  globalDropCounts: Record<string, number>;
}

export interface AdjustedDropItem extends DropTableItem {
  adjustedWeight: number;
  dropChance: number;
  triggeredPity: boolean;
}

export interface EconomyAdjustmentReport {
  items: AdjustedDropItem[];
  expectedValuePerHour: number;
  totalWeight: number;
  pityTriggered: string[];
  botSuspicionScore: number;
}

export function adjustDropRates(
  table: DropTableItem[],
  state: EconomyState,
  options: { targetValuePerHour?: number; pityWindow?: number; maxPityBoost?: number } = {}
): EconomyAdjustmentReport {
  const {
    targetValuePerHour = 120,
    pityWindow = 8,
    maxPityBoost = 3,
  } = options;

  const totalPlaytimeHours = Math.max(0.1, state.playerPlaytimeMinutes / 60);

  // 计算玩家近期获得价值与全服分布
  const recentValue = state.playerRecentDrops.reduce((sum, dropId) => {
    const item = table.find((i) => i.id === dropId);
    return sum + (item?.value ?? 0);
  }, 0);

  const recentValuePerHour = recentValue / totalPlaytimeHours;

  // 产出缺口：如果玩家近期产出低于目标，略微提升整体权重；高于目标则降低
  const globalModifier = clamp(targetValuePerHour / Math.max(1, recentValuePerHour), 0.7, 1.3);

  // 全服稀缺度：掉落越多的道具权重越低，抑制脚本刷取
  const totalGlobalDrops = Math.max(
    1,
    Object.values(state.globalDropCounts).reduce((a, b) => a + b, 0)
  );

  // 反脚本检测：掉落序列规律性越高，越像脚本
  const botSuspicionScore = detectBotPattern(state.playerRecentDrops);
  const botPenalty = clamp(botSuspicionScore * 0.3, 0, 0.5);

  const adjustedItems = table.map((item) => {
    const globalCount = state.globalDropCounts[item.id] ?? 0;
    const globalRatio = globalCount / totalGlobalDrops;
    const scarcityBoost = globalRatio > 0.3 ? 1 - (globalRatio - 0.3) * 1.5 : 1;

    // 保底机制：连续未获得某高价值道具时提升权重
    const lastIndex = state.playerRecentDrops.lastIndexOf(item.id);
    const dropsSinceLast =
      lastIndex === -1 ? state.playerRecentDrops.length : state.playerRecentDrops.length - 1 - lastIndex;
    const pityBoost = item.value >= 50 && dropsSinceLast >= pityWindow
      ? Math.min(maxPityBoost, 1 + (dropsSinceLast - pityWindow + 1) * 0.5)
      : 1;

    const adjustedWeight = clamp(
      item.baseWeight * globalModifier * scarcityBoost * pityBoost * (1 - botPenalty),
      0.01,
      item.baseWeight * 5
    );

    return {
      ...item,
      adjustedWeight: round2(adjustedWeight),
      dropChance: 0,
      triggeredPity: pityBoost > 1,
    };
  });

  const totalWeight = adjustedItems.reduce((sum, i) => sum + i.adjustedWeight, 0);
  for (const item of adjustedItems) {
    item.dropChance = round2(item.adjustedWeight / Math.max(0.001, totalWeight));
  }

  const expectedValuePerHour =
    adjustedItems.reduce((sum, i) => sum + i.value * i.dropChance, 0) *
    (60 / Math.max(1, state.playerPlaytimeMinutes > 0 ? state.playerPlaytimeMinutes : 60));

  return {
    items: adjustedItems,
    expectedValuePerHour: round2(expectedValuePerHour),
    totalWeight: round2(totalWeight),
    pityTriggered: adjustedItems.filter((i) => i.triggeredPity).map((i) => i.id),
    botSuspicionScore: round2(botSuspicionScore),
  };
}

/**
 * 检测掉落序列是否过于规律，常用于识别脚本/自动化刷取。
 * 返回 0-1 的怀疑分数：相同道具循环、短周期重复都会提高分数。
 */
export function detectBotPattern(drops: string[]): number {
  if (drops.length < 6) return 0;

  let score = 0;

  // 检查连续重复
  let repeatStreak = 0;
  let maxRepeatStreak = 0;
  for (let i = 1; i < drops.length; i++) {
    if (drops[i] === drops[i - 1]) {
      repeatStreak++;
      maxRepeatStreak = Math.max(maxRepeatStreak, repeatStreak);
    } else {
      repeatStreak = 0;
    }
  }
  if (maxRepeatStreak >= 2) score += 0.2;

  // 检查短周期循环（2-4 长度）
  for (let period = 2; period <= 4; period++) {
    const matches = drops.slice(period).filter((d, i) => d === drops[i]).length;
    const ratio = matches / Math.max(1, drops.length - period);
    if (ratio > 0.7) {
      score += 0.3 + (ratio - 0.7) * 0.5;
      break;
    }
  }

  // 检查唯一掉落种类过少
  const unique = new Set(drops).size;
  const uniqueRatio = unique / drops.length;
  if (uniqueRatio < 0.3) {
    score += (0.3 - uniqueRatio);
  }

  return clamp(score, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
