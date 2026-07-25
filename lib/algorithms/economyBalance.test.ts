import { describe, it, expect } from "vitest";
import { adjustDropRates } from "./economyBalance";

describe("经济/掉落平衡", () => {
  const table = [
    { id: "common", baseWeight: 50, value: 5 },
    { id: "rare", baseWeight: 15, value: 50 },
    { id: "legendary", baseWeight: 2, value: 200 },
  ];

  it("低保玩家会获得整体权重提升", () => {
    const state = {
      playerPlaytimeMinutes: 60,
      playerRecentDrops: ["common", "common"],
      globalDropCounts: { common: 100, rare: 20, legendary: 2 },
    };
    const report = adjustDropRates(table, state, { targetValuePerHour: 200 });
    expect(report.expectedValuePerHour).toBeGreaterThan(0);
  });

  it("稀有道具触发保底后权重上升", () => {
    const state = {
      playerPlaytimeMinutes: 60,
      playerRecentDrops: Array(12).fill("common"),
      globalDropCounts: { common: 100, rare: 20, legendary: 2 },
    };
    const report = adjustDropRates(table, state);
    const rare = report.items.find((i) => i.id === "rare");
    expect(rare?.triggeredPity).toBe(true);
    expect(rare?.adjustedWeight).toBeGreaterThan(table[1].baseWeight);
  });

  it("全局掉落过多会抑制该道具权重", () => {
    const state = {
      playerPlaytimeMinutes: 60,
      playerRecentDrops: [],
      globalDropCounts: { common: 900, rare: 50, legendary: 2 },
    };
    const report = adjustDropRates(table, state);
    const common = report.items.find((i) => i.id === "common");
    expect(common?.adjustedWeight).toBeLessThan(table[0].baseWeight);
  });
});
