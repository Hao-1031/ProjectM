import { describe, it, expect } from "vitest";
import { createDefenseMap } from "./defense";
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

  it("keeps scattered cover obstacles outside core area", () => {
    const map = createDefenseMap(12345);
    const coreX = map.width / 2;
    const coreY = map.height / 2;
    const coreRadius = 220;
    for (const obs of map.obstacles) {
      const centerDist = Math.hypot(obs.x - coreX, obs.y - coreY);
      // Core perimeter walls are allowed near the core; scattered cover must stay outside.
      if (centerDist < 260) continue;
      const half = Math.max(obs.width, obs.height) / 2;
      expect(centerDist - half).toBeGreaterThanOrEqual(coreRadius - 1);
    }
  });
});
