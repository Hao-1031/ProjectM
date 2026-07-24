import { describe, it, expect, vi } from "vitest";
import {
  AFFIXES,
  applyAffixes,
  getRandomAffixes,
  getEliteAffixCount,
  shouldSplitOnDeath,
  shouldExplodeOnDeath,
  getRegenRate,
} from "./affixes";
import type { Enemy } from "./types";

function createBaseEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: "enemy_1",
    x: 100,
    y: 100,
    radius: 14,
    speed: 110,
    health: 100,
    maxHealth: 100,
    damage: 12,
    xpValue: 6,
    color: "#fb923c",
    variant: "walker",
    slow: 0,
    slowTimer: 0,
      freezeTimer: 0,
      frostStacks: 0,
      frostTimer: 0,
      venomStacks: 0,
      venomTimer: 0,
      vulnerabilityStacks: 0,
    droneMarkTimer: 0,
    isElite: false,
    isBoss: false,
    affixes: [],
    attackTimer: 0,
    attackCooldown: 0,
    knockbackX: 0,
    knockbackY: 0,
    burnDuration: 0,
    burnDamage: 0,
    phase: 0,
    phaseThresholds: [],
    targetCore: false,
    facing: 0,
    animation: "move",
    animationTimer: 0,
    ...overrides,
  };
}

describe("affixes", () => {
  describe("AFFIXES registry", () => {
    it("contains eight affixes", () => {
      expect(Object.keys(AFFIXES)).toHaveLength(8);
    });

    it("every affix has id, name, description and color", () => {
      for (const affix of Object.values(AFFIXES)) {
        expect(affix.id).toBeTruthy();
        expect(affix.name).toBeTruthy();
        expect(affix.description.length).toBeGreaterThan(0);
        expect(affix.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });
  });

  describe("shielded", () => {
    it("increases max health and sets current health to max", () => {
      const enemy = createBaseEnemy();
      enemy.affixes = ["shielded"];
      applyAffixes(enemy);
      expect(enemy.maxHealth).toBe(140);
      expect(enemy.health).toBe(enemy.maxHealth);
    });
  });

  describe("splitting", () => {
    it("reduces xp value", () => {
      const enemy = createBaseEnemy({ xpValue: 10 });
      enemy.affixes = ["splitting"];
      applyAffixes(enemy);
      expect(enemy.xpValue).toBe(6);
    });
  });

  describe("explosive", () => {
    it("increases radius and changes color", () => {
      const enemy = createBaseEnemy();
      enemy.affixes = ["explosive"];
      applyAffixes(enemy);
      expect(enemy.radius).toBe(18);
      expect(enemy.color).toBe("#f97316");
    });
  });

  describe("swift", () => {
    it("boosts speed by 50%", () => {
      const enemy = createBaseEnemy({ speed: 100 });
      enemy.affixes = ["swift"];
      applyAffixes(enemy);
      expect(enemy.speed).toBe(150);
    });
  });

  describe("corrosive", () => {
    it("reduces damage and slightly grows", () => {
      const enemy = createBaseEnemy({ damage: 20 });
      enemy.affixes = ["corrosive"];
      applyAffixes(enemy);
      expect(enemy.damage).toBe(16);
      expect(enemy.radius).toBe(16);
    });
  });

  describe("regenerating", () => {
    it("raises max health and sets current health", () => {
      const enemy = createBaseEnemy();
      enemy.affixes = ["regenerating"];
      applyAffixes(enemy);
      expect(enemy.maxHealth).toBe(125);
      expect(enemy.health).toBe(125);
    });

    it("returns 2% max health per second as regen rate", () => {
      const enemy = createBaseEnemy({ maxHealth: 200, affixes: ["regenerating"] });
      expect(getRegenRate(enemy)).toBe(4);
    });
  });

  describe("freezing", () => {
    it("reduces damage and increases speed", () => {
      const enemy = createBaseEnemy({ damage: 20, speed: 100 });
      enemy.affixes = ["freezing"];
      applyAffixes(enemy);
      expect(enemy.damage).toBe(18);
      expect(enemy.speed).toBe(120);
    });
  });

  describe("taunting", () => {
    it("grows, raises max health and sets current health", () => {
      const enemy = createBaseEnemy();
      enemy.affixes = ["taunting"];
      applyAffixes(enemy);
      expect(enemy.radius).toBe(20);
      expect(enemy.maxHealth).toBe(160);
      expect(enemy.health).toBe(160);
    });
  });

  describe("predicate helpers", () => {
    it("detects splitting affix", () => {
      const splitting = createBaseEnemy({ affixes: ["splitting"] });
      expect(shouldSplitOnDeath(splitting)).toBe(true);
      const other = createBaseEnemy({ affixes: ["explosive"] });
      expect(shouldSplitOnDeath(other)).toBe(false);
    });

    it("detects explosive affix", () => {
      const explosive = createBaseEnemy({ affixes: ["explosive"] });
      expect(shouldExplodeOnDeath(explosive)).toBe(true);
      const other = createBaseEnemy({ affixes: ["swift"] });
      expect(shouldExplodeOnDeath(other)).toBe(false);
    });
  });

  describe("getRandomAffixes", () => {
    it("returns requested count", () => {
      const affixes = getRandomAffixes(3);
      expect(affixes).toHaveLength(3);
    });

    it("never exceeds available affixes", () => {
      const affixes = getRandomAffixes(20);
      expect(affixes.length).toBeLessThanOrEqual(8);
    });

    it("excludes provided affixes", () => {
      const affixes = getRandomAffixes(7, ["shielded"]);
      expect(affixes).not.toContain("shielded");
    });

    it("returns unique affixes", () => {
      const affixes = getRandomAffixes(5);
      expect(new Set(affixes).size).toBe(affixes.length);
    });
  });

  describe("applyAffixes", () => {
    it("applies multiple affixes in order", () => {
      const enemy = createBaseEnemy();
      enemy.affixes = ["swift", "taunting"];
      applyAffixes(enemy);
      expect(enemy.speed).toBe(165);
      expect(enemy.maxHealth).toBe(160);
    });

    it("ignores unknown affix ids", () => {
      const enemy = createBaseEnemy();
      // Cast to satisfy type while simulating future affix
      enemy.affixes = ["unknown" as "shielded"];
      expect(() => applyAffixes(enemy)).not.toThrow();
    });
  });

  describe("getEliteAffixCount", () => {
    it("returns 1 for low difficulty", () => {
      expect(getEliteAffixCount(1)).toBe(1);
      expect(getEliteAffixCount(2)).toBe(1);
    });

    it("returns 2 for medium difficulty", () => {
      expect(getEliteAffixCount(3)).toBe(2);
      expect(getEliteAffixCount(5)).toBe(2);
    });

    it("returns 3 for high difficulty", () => {
      expect(getEliteAffixCount(6)).toBe(3);
      expect(getEliteAffixCount(9)).toBe(3);
    });

    it("caps at 4 for extreme difficulty", () => {
      expect(getEliteAffixCount(10)).toBe(4);
      expect(getEliteAffixCount(20)).toBe(4);
    });
  });
});
