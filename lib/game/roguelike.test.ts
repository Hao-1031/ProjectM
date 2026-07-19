import { describe, it, expect, beforeEach } from "vitest";
import type { Player } from "./types";
import {
  createRoguelikeRun,
  getCurrentStage,
  isStageComplete,
  markCurrentStageComplete,
  advanceStage,
  isFinalStage,
  getRunProgress,
  generateRewardOptions,
  applyReward,
  shouldOfferReward,
  getSelectedRewardSummary,
  resetRoguelikeRun,
} from "./roguelike";

const SEED = 12345;

function makePlayer(): Player {
  return {
    id: "p1",
    x: 0,
    y: 0,
    radius: 14,
    speed: 260,
    maxHealth: 100,
    health: 100,
    level: 1,
    xp: 0,
    xpToNext: 50,
    weapons: [],
    passives: [],
    invincible: 0,
    magnetRange: 120,
    armor: 0,
    critChance: 0,
    cooldownReduction: 0,
    areaMultiplier: 1,
    regen: 0,
    heroId: null,
    activeSkill: null,
    skillTimer: 0,
    knockbackX: 0,
    knockbackY: 0,
    burnDuration: 0,
    burnDamage: 0,
    facing: 0,
    animation: "idle",
    animationTimer: 0,
  };
}

describe("roguelike", () => {
  it("creates a run with stages", () => {
    const run = createRoguelikeRun(SEED);
    expect(run.stages.length).toBeGreaterThan(0);
    expect(run.currentIndex).toBe(0);
    expect(run.completed).toBe(false);
    expect(run.victory).toBe(false);
  });

  it("returns the current stage", () => {
    const run = createRoguelikeRun(SEED);
    const stage = getCurrentStage(run);
    expect(stage).toBeTruthy();
    expect(stage?.id).toBe(run.stages[0].id);
  });

  it("determines stage completion", () => {
    const run = createRoguelikeRun(SEED);
    const stage = getCurrentStage(run)!;
    expect(isStageComplete(stage)).toBe(false);
    markCurrentStageComplete(run);
    expect(isStageComplete(stage)).toBe(true);
  });

  it("advances to the next stage after completion", () => {
    const run = createRoguelikeRun(SEED);
    markCurrentStageComplete(run);
    const advanced = advanceStage(run);
    expect(advanced).toBe(true);
    expect(run.currentIndex).toBe(1);
  });

  it("does not advance before completion", () => {
    const run = createRoguelikeRun(SEED);
    const advanced = advanceStage(run);
    expect(advanced).toBe(false);
    expect(run.currentIndex).toBe(0);
  });

  it("does not advance after run is completed", () => {
    const run = createRoguelikeRun(SEED);
    run.completed = true;
    const advanced = advanceStage(run);
    expect(advanced).toBe(false);
  });

  it("completes run on final stage advance", () => {
    const run = createRoguelikeRun(SEED);
    run.currentIndex = run.stages.length - 1;
    markCurrentStageComplete(run);
    expect(isFinalStage(run)).toBe(true);
    const advanced = advanceStage(run);
    expect(advanced).toBe(true);
    expect(run.completed).toBe(true);
    expect(run.victory).toBe(true);
  });

  it("calculates run progress", () => {
    const run = createRoguelikeRun(SEED);
    expect(getRunProgress(run)).toBe(0);
    markCurrentStageComplete(run);
    expect(getRunProgress(run)).toBeCloseTo(1 / run.stages.length);
  });

  it("generates reward options", () => {
    const run = createRoguelikeRun(SEED);
    const player = makePlayer();
    const options = generateRewardOptions(run, player, 3);
    expect(options.length).toBe(3);
    expect(run.pendingRewards).toBe(options);
  });

  it("returns cached reward options", () => {
    const run = createRoguelikeRun(SEED);
    const player = makePlayer();
    const a = generateRewardOptions(run, player, 3);
    const b = generateRewardOptions(run, player, 3);
    expect(a).toBe(b);
  });

  it("applies a reward to the player", () => {
    const run = createRoguelikeRun(SEED);
    const player = makePlayer();
    const options = generateRewardOptions(run, player, 3);
    const beforeHealth = player.maxHealth;
    const healthOption = options.find((o) => o.id === "health_boost");
    const target = healthOption ?? options[0];
    const success = applyReward(run, player, target.id);
    expect(success).toBe(true);
    if (target.id === "health_boost") {
      expect(player.maxHealth).toBeGreaterThan(beforeHealth);
    }
    expect(run.selectedRewards).toContain(target.id);
    expect(run.pendingRewards).toBeNull();
  });

  it("fails to apply unknown reward", () => {
    const run = createRoguelikeRun(SEED);
    const player = makePlayer();
    const success = applyReward(run, player, "unknown");
    expect(success).toBe(false);
  });

  it("offers rewards on reward stages", () => {
    const run = createRoguelikeRun(SEED);
    const player = makePlayer();
    const rewardStageIndex = run.stages.findIndex((s) => s.type === "reward");
    if (rewardStageIndex >= 0) {
      run.currentIndex = rewardStageIndex;
      expect(shouldOfferReward(run)).toBe(false);
      markCurrentStageComplete(run);
      expect(shouldOfferReward(run)).toBe(true);
      generateRewardOptions(run, player, 3);
      expect(shouldOfferReward(run)).toBe(false);
    }
  });

  it("summarizes selected rewards", () => {
    const run = createRoguelikeRun(SEED);
    const player = makePlayer();
    const options = generateRewardOptions(run, player, 3);
    applyReward(run, player, options[0].id);
    expect(getSelectedRewardSummary(run)).toEqual([options[0].id]);
  });

  it("resets the run", () => {
    const run = createRoguelikeRun(SEED);
    markCurrentStageComplete(run);
    advanceStage(run);
    resetRoguelikeRun(run, 54321);
    expect(run.currentIndex).toBe(0);
    expect(run.completed).toBe(false);
    expect(run.victory).toBe(false);
    expect(run.selectedRewards).toHaveLength(0);
    expect(run.pendingRewards).toBeNull();
  });
});
