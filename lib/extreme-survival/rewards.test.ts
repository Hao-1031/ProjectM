import { describe, it, expect } from "vitest";
import { calculateRewards, DAILY_REWARD_CAP, OVERCLOCK_MULTIPLIER } from "./rewards";

describe("rewards", () => {
  it("calculates normal phase rewards", () => {
    const result = calculateRewards({
      wave: 20,
      isOverclock: false,
      performanceScore: 60,
      elapsedTime: 300,
      todayClaimed: 0,
    });
    expect(result.tokens).toBeGreaterThan(0);
    expect(result.capReached).toBe(false);
  });

  it("applies overclock multiplier", () => {
    const normal = calculateRewards({
      wave: 30,
      isOverclock: false,
      performanceScore: 60,
      elapsedTime: 400,
      todayClaimed: 0,
    });
    const overclock = calculateRewards({
      wave: 30,
      isOverclock: true,
      performanceScore: 60,
      elapsedTime: 400,
      todayClaimed: 0,
    });
    expect(overclock.totalTokens).toBe(Math.ceil(normal.totalTokens * OVERCLOCK_MULTIPLIER));
  });

  it("enforces daily cap", () => {
    const result = calculateRewards({
      wave: 100,
      isOverclock: true,
      performanceScore: 150,
      elapsedTime: 600,
      todayClaimed: DAILY_REWARD_CAP - 10,
    });
    expect(result.tokens).toBe(10);
    expect(result.capReached).toBe(true);
  });
});
