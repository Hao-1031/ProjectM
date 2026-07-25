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
      item.baseWeight * globalModifier * scarcityBoost * pityBoost,
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
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
