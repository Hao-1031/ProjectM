import { describe, it, expect } from "vitest";
import { optimizeSpawns, type SpawnCandidate, type GamePressure } from "./spawnOptimizer";

const candidates: SpawnCandidate[] = [
  { variant: "walker", baseWeight: 40, baseIntervalSec: 1.2 },
  { variant: "runner", baseWeight: 20, baseIntervalSec: 1.5 },
  { variant: "tank", baseWeight: 10, baseIntervalSec: 3 },
  { variant: "spitter", baseWeight: 12, baseIntervalSec: 2.5 },
  { variant: "elite", baseWeight: 6, baseIntervalSec: 5 },
  { variant: "boss", baseWeight: 1, baseIntervalSec: 12 },
];

const basePressure: GamePressure = {
  playerHealthPercent: 0.8,
  coreHealthPercent: 0.9,
  activeEnemyCount: 20,
  maxEnemyCount: 60,
  elapsedWaveSec: 30,
  waveDurationSec: 120,
  recentDamageTaken: 30,
};

describe("刷怪压力调度", () => {
  it("压力指数在 0-1 之间", () => {
    const report = optimizeSpawns(candidates, basePressure);
    expect(report.pressureIndex).toBeGreaterThanOrEqual(0);
    expect(report.pressureIndex).toBeLessThanOrEqual(1);
  });

  it("高压力时削减高威胁单位权重", () => {
    const highPressure = { ...basePressure, playerHealthPercent: 0.2, coreHealthPercent: 0.2 };
    const report = optimizeSpawns(candidates, highPressure);
    const boss = report.plans.find((p) => p.variant === "boss");
    expect(boss!.weight).toBeLessThanOrEqual(candidates.find((c) => c.variant === "boss")!.baseWeight);
  });

  it("场上单位饱和时 Boss 权重显著下降", () => {
    const saturated = { ...basePressure, activeEnemyCount: 55, maxEnemyCount: 60 };
    const report = optimizeSpawns(candidates, saturated);
    const boss = report.plans.find((p) => p.variant === "boss");
    expect(boss!.weight).toBeLessThan(candidates.find((c) => c.variant === "boss")!.baseWeight * 0.5);
  });

  it("爆发窗口触发时非 Boss 单位间隔缩短", () => {
    const burstPressure = {
      ...basePressure,
      playerHealthPercent: 0.55,
      coreHealthPercent: 0.7,
      activeEnemyCount: 20,
      recentDamageTaken: 300,
    };
    const report = optimizeSpawns(candidates, burstPressure);
    expect(report.burstWindowActive).toBe(true);
    const walker = report.plans.find((p) => p.variant === "walker");
    expect(walker!.intervalSec).toBeLessThanOrEqual(1.2);
  });

  it("核心血量低时整体权重下降", () => {
    const lowCore = { ...basePressure, coreHealthPercent: 0.15 };
    const report = optimizeSpawns(candidates, lowCore);
    const totalWeight = report.plans.reduce((sum, p) => sum + p.weight, 0);
    const baseTotal = candidates.reduce((sum, c) => sum + c.baseWeight, 0);
    expect(totalWeight).toBeLessThan(baseTotal);
  });
});
