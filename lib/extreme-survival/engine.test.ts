import { describe, it, expect } from "vitest";
import {
  calculateWaveConfig,
  shouldTriggerBranchChoice,
  calculatePerformanceScore,
  BRANCH_WAVE,
} from "./engine";
import type { PerformanceSnapshot } from "./types";

const baseSnapshot: PerformanceSnapshot = {
  killsLastWave: 10,
  damageTakenLastWave: 50,
  coreHealthPercent: 0.8,
  elapsedWaveSec: 30,
};

describe("extreme-survival engine", () => {
  it("calculates normal phase wave config", () => {
    const result = calculateWaveConfig(10, "normal", baseSnapshot, 50);
    expect(result.waveConfig.phase).toBe("normal");
    expect(result.waveConfig.enemyConfig.healthMultiplier).toBeGreaterThan(1);
    expect(result.waveConfig.enemyConfig.spawnCount).toBeGreaterThan(0);
    expect(result.performanceScoreDelta).toBe(0);
  });

  it("calculates overclock phase wave config", () => {
    const result = calculateWaveConfig(26, "overclock", baseSnapshot, 50);
    expect(result.waveConfig.phase).toBe("overclock");
    expect(result.waveConfig.enemyConfig.healthMultiplier).toBeGreaterThan(
      result.waveConfig.enemyConfig.damageMultiplier
    );
    expect(result.waveConfig.enemyConfig.eliteRatio).toBeGreaterThan(0);
    expect(result.performanceScoreDelta).not.toBe(0);
  });

  it("triggers branch choice at wave 25 in normal phase", () => {
    expect(shouldTriggerBranchChoice(25, "normal")).toBe(true);
    expect(shouldTriggerBranchChoice(24, "normal")).toBe(false);
    expect(shouldTriggerBranchChoice(25, "overclock")).toBe(false);
  });

  it("calculates performance score within bounds", () => {
    const score = calculatePerformanceScore(baseSnapshot);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(200);
  });

  it("overclock scaling grows with wave offset", () => {
    const early = calculateWaveConfig(BRANCH_WAVE + 1, "overclock", baseSnapshot, 50);
    const late = calculateWaveConfig(BRANCH_WAVE + 20, "overclock", baseSnapshot, 50);
    expect(late.waveConfig.enemyConfig.healthMultiplier).toBeGreaterThan(
      early.waveConfig.enemyConfig.healthMultiplier
    );
  });
});
