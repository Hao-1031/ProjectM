import { describe, it, expect } from "vitest";
import {
  createDefenseMap,
  createDefenseCore,
  generateDefenseNodes,
  generateDefenseWaves,
  createDefenseState,
  activateNodeForWave,
  updateNodeCapture,
  damageCore,
  isDefenseVictory,
  isDefenseDefeat,
  generateDefenseShopOptions,
  getActiveNode,
  getCapturedNodeCount,
} from "./defense";
import { rectOverlap } from "./math";

describe("defense map", () => {
  it("does not generate overlapping obstacles", () => {
    for (let seed = 0; seed < 20; seed++) {
      const map = createDefenseMap(seed);
      for (let i = 0; i < map.obstacles.length; i++) {
        for (let j = i + 1; j < map.obstacles.length; j++) {
          expect(rectOverlap(map.obstacles[i], map.obstacles[j])).toBe(false);
        }
      }
    }
  });

  it("only keeps core ring obstacles and removes scattered cover", () => {
    const map = createDefenseMap(12345);
    const coreX = map.width / 2;
    const coreY = map.height / 2;
    expect(map.obstacles.length).toBeLessThanOrEqual(8);
    for (const obs of map.obstacles) {
      const centerDist = Math.hypot(obs.x - coreX, obs.y - coreY);
      expect(centerDist).toBeLessThan(260);
    }
  });
});

describe("defense state", () => {
  it("createDefenseState creates valid defense state", () => {
    const state = createDefenseState(42);
    expect(state.core).toBeDefined();
    expect(state.nodes).toHaveLength(8);
    expect(state.energy).toBe(0);
    expect(state.targetEnergy).toBe(1200);
    expect(state.currentWave).toBe(0);
    expect(state.totalWaves).toBe(8);
    expect(state.waves).toHaveLength(8);
    expect(state.deployables).toEqual([]);
    expect(state.waveInProgress).toBe(false);
  });

  it("createDefenseCore places core at map center", () => {
    const core = createDefenseCore();
    expect(core.x).toBe(2200 / 2);
    expect(core.y).toBe(1600 / 2);
    expect(core.radius).toBeGreaterThan(0);
    expect(core.health).toBe(core.maxHealth);
  });

  it("generateDefenseNodes creates one node per wave", () => {
    const nodes = generateDefenseNodes(42);
    expect(nodes).toHaveLength(8);
    expect(nodes.every((n) => n.waveIndex >= 0 && n.waveIndex < 8)).toBe(true);
    expect(new Set(nodes.map((n) => n.waveIndex)).size).toBe(8);
  });

  it("generateDefenseWaves escalates enemy counts and elites", () => {
    const waves = generateDefenseWaves(42);
    expect(waves).toHaveLength(8);
    for (let i = 1; i < waves.length; i++) {
      expect(waves[i].enemyCount).toBeGreaterThan(waves[i - 1].enemyCount);
      expect(waves[i].duration).toBeGreaterThan(waves[i - 1].duration);
    }
    expect(waves[waves.length - 1].bossVariant).toBe("colossus");
    expect(waves[0].eliteCount).toBe(0);
    expect(waves[waves.length - 1].eliteCount).toBeGreaterThan(0);
  });
});

describe("defense node capture", () => {
  it("activateNodeForWave activates correct node", () => {
    const state = createDefenseState(7);
    activateNodeForWave(state, 3);
    const active = state.nodes.filter((n) => n.active);
    expect(active).toHaveLength(1);
    expect(active[0].waveIndex).toBe(3);
    expect(active[0].captured).toBe(false);
    expect(active[0].captureProgress).toBe(0);
  });

  it("getActiveNode returns active uncaptured node", () => {
    const state = createDefenseState(7);
    activateNodeForWave(state, 0);
    const node = getActiveNode(state);
    expect(node).not.toBeNull();
    expect(node!.active).toBe(true);
    expect(node!.captured).toBe(false);
  });

  it("updateNodeCapture progresses capture when player is in range", () => {
    const state = createDefenseState(7);
    activateNodeForWave(state, 0);
    const node = getActiveNode(state)!;
    const player = { x: node.x, y: node.y, radius: 20 };

    updateNodeCapture(state, player, 2);
    expect(node.captureProgress).toBeCloseTo(0.5);
    expect(node.captured).toBe(false);

    updateNodeCapture(state, player, 2.5);
    expect(node.captureProgress).toBe(1);
    expect(node.captured).toBe(true);
    expect(state.energy).toBe(node.energyValue);
    expect(getCapturedNodeCount(state)).toBe(1);
  });

  it("updateNodeCapture does nothing when player is out of range", () => {
    const state = createDefenseState(7);
    activateNodeForWave(state, 0);
    const node = getActiveNode(state)!;
    const farPlayer = { x: node.x + 1000, y: node.y + 1000, radius: 20 };

    updateNodeCapture(state, farPlayer, 10);
    expect(node.captureProgress).toBe(0);
    expect(node.captured).toBe(false);
  });
});

describe("defense core and victory", () => {
  it("damageCore reduces core health and clamps to zero", () => {
    const state = createDefenseState(1);
    const maxHealth = state.core.health;
    damageCore(state, 500);
    expect(state.core.health).toBe(maxHealth - 500);
    damageCore(state, maxHealth);
    expect(state.core.health).toBe(0);
  });

  it("isDefenseDefeat returns true when core health is zero", () => {
    const state = createDefenseState(1);
    expect(isDefenseDefeat(state)).toBe(false);
    state.core.health = 0;
    expect(isDefenseDefeat(state)).toBe(true);
  });

  it("isDefenseVictory returns true when target energy is reached", () => {
    const state = createDefenseState(1);
    expect(isDefenseVictory(state)).toBe(false);
    state.energy = state.targetEnergy;
    expect(isDefenseVictory(state)).toBe(true);
  });
});

describe("defense shop", () => {
  it("generateDefenseShopOptions returns valid items", () => {
    const items = generateDefenseShopOptions();
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.id).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(item.cost).toBeGreaterThan(0);
      expect(["repair", "speed", "energy"]).toContain(item.type);
    }
  });
});
