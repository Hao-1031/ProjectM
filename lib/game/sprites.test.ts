import { describe, it, expect, beforeEach } from "vitest";
import {
  createPlayerSpriteSheet,
  createEnemySpriteSheet,
  createBossSpriteSheet,
  createDecorSprite,
  createParticleSprite,
  createWeaponProjectileSprite,
  createPickupSprite,
  getPlayerSprite,
  getEnemySprite,
  getBossSprite,
  getDecorSprite,
  getParticleSprite,
  clearSpriteCache,
} from "./sprites";
import type { SpriteAnimationState, BossId } from "./types";

describe("sprites", () => {
  beforeEach(() => {
    clearSpriteCache();
  });

  describe("createPlayerSpriteSheet", () => {
    it("creates sprite sheet with all animations", () => {
      const sheet = createPlayerSpriteSheet("#22d3ee", "#f0abfc");
      const states: SpriteAnimationState[] = ["idle", "move", "attack", "hit", "death"];
      for (const state of states) {
        expect(sheet.animations[state]).toBeDefined();
        expect(sheet.animations[state].length).toBeGreaterThan(0);
      }
    });

    it("sets frame dimensions", () => {
      const sheet = createPlayerSpriteSheet("#22d3ee", "#f0abfc");
      expect(sheet.frameWidth).toBe(64);
      expect(sheet.frameHeight).toBe(64);
    });

    it("generates data uri", () => {
      const sheet = createPlayerSpriteSheet("#22d3ee", "#f0abfc");
      expect(sheet.dataUri).toMatch(/^data:image\/png;base64,/);
    });

    it("includes color in sprite id", () => {
      const sheet = createPlayerSpriteSheet("#22d3ee", "#f0abfc");
      expect(sheet.id).toContain("22d3ee");
    });
  });

  describe("createEnemySpriteSheet", () => {
    it("creates sprite sheet for each variant", () => {
      const variants = ["walker", "runner", "tank", "spitter", "boss"];
      for (const variant of variants) {
        const sheet = createEnemySpriteSheet(variant, "#fb923c", "#fde047");
        const states: SpriteAnimationState[] = ["idle", "move", "attack", "hit", "death"];
        for (const state of states) {
          expect(sheet.animations[state]).toBeDefined();
          expect(sheet.animations[state].length).toBeGreaterThan(0);
        }
      }
    });

    it("generates data uri", () => {
      const sheet = createEnemySpriteSheet("walker", "#fb923c", "#fde047");
      expect(sheet.dataUri).toMatch(/^data:image\/png;base64,/);
    });

    it("includes variant and color in id", () => {
      const sheet = createEnemySpriteSheet("tank", "#fb923c", "#fde047");
      expect(sheet.id).toContain("tank");
      expect(sheet.id).toContain("fb923c");
    });
  });

  describe("createWeaponProjectileSprite", () => {
    it("returns data uri", () => {
      const uri = createWeaponProjectileSprite("#22d3ee");
      expect(uri).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe("createPickupSprite", () => {
    it("returns data uri for chest", () => {
      const uri = createPickupSprite("chest", "#e879f9");
      expect(uri).toMatch(/^data:image\/png;base64,/);
    });

    it("returns data uri for health", () => {
      const uri = createPickupSprite("health", "#f43f5e");
      expect(uri).toMatch(/^data:image\/png;base64,/);
    });

    it("returns data uri for resource", () => {
      const uri = createPickupSprite("resource", "#fbbf24");
      expect(uri).toMatch(/^data:image\/png;base64,/);
    });

    it("returns data uri for xp", () => {
      const uri = createPickupSprite("xp", "#22d3ee");
      expect(uri).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe("createBossSpriteSheet", () => {
    it("creates sprite sheet for each boss", () => {
      const bosses: BossId[] = ["overlord", "plaguebringer", "titan", "ravager", "siren"];
      for (const id of bosses) {
        const sheet = createBossSpriteSheet(id, "#e879f9", "#f0abfc");
        const states: SpriteAnimationState[] = ["idle", "move", "attack", "hit", "death"];
        for (const state of states) {
          expect(sheet.animations[state]).toBeDefined();
          expect(sheet.animations[state].length).toBeGreaterThan(0);
        }
        expect(sheet.id).toContain(id);
      }
    });

    it("generates data uri", () => {
      const sheet = createBossSpriteSheet("titan", "#f43f5e", "#fda4af");
      expect(sheet.dataUri).toMatch(/^data:image\/png;base64,/);
    });

    it("produces different ids for different bosses", () => {
      const a = createBossSpriteSheet("overlord", "#e879f9", "#f0abfc");
      const b = createBossSpriteSheet("titan", "#e879f9", "#f0abfc");
      expect(a.id).not.toBe(b.id);
    });
  });

  describe("createDecorSprite", () => {
    it("returns data uri for each decor type", () => {
      const types = ["crate", "barrel", "rock", "plant", "column", "debris"] as const;
      for (const type of types) {
        const uri = createDecorSprite(type, "industrial");
        expect(uri).toMatch(/^data:image\/png;base64,/);
      }
    });

    it("supports each theme palette", () => {
      for (const theme of ["industrial", "frozen", "biohazard"] as const) {
        const uri = createDecorSprite("crate", theme);
        expect(uri).toMatch(/^data:image\/png;base64,/);
      }
    });
  });

  describe("createParticleSprite", () => {
    it("returns data uri for each particle type", () => {
      const types = ["explosion", "spark", "smoke", "flash", "ember", "shockwave"] as const;
      for (const type of types) {
        const uri = createParticleSprite(type, "#f59e0b");
        expect(uri).toMatch(/^data:image\/png;base64,/);
      }
    });
  });

  describe("sprite cache", () => {
    it("returns same sheet for same player colors", () => {
      const a = getPlayerSprite("#22d3ee", "#f0abfc");
      const b = getPlayerSprite("#22d3ee", "#f0abfc");
      expect(a).toBe(b);
    });

    it("returns different sheet for different player colors", () => {
      const a = getPlayerSprite("#22d3ee", "#f0abfc");
      const b = getPlayerSprite("#fb923c", "#fde047");
      expect(a).not.toBe(b);
    });

    it("returns same sheet for same enemy params", () => {
      const a = getEnemySprite("walker", "#fb923c", "#fde047");
      const b = getEnemySprite("walker", "#fb923c", "#fde047");
      expect(a).toBe(b);
    });

    it("returns same sheet for same boss params", () => {
      const a = getBossSprite("overlord", "#e879f9", "#f0abfc");
      const b = getBossSprite("overlord", "#e879f9", "#f0abfc");
      expect(a).toBe(b);
    });

    it("returns same decor sprite for same params", () => {
      const a = getDecorSprite("crate", "industrial");
      const b = getDecorSprite("crate", "industrial");
      expect(a).toBe(b);
    });

    it("returns same particle sprite for same params", () => {
      const a = getParticleSprite("spark", "#f59e0b");
      const b = getParticleSprite("spark", "#f59e0b");
      expect(a).toBe(b);
    });

    it("clears sprite sheet cache", () => {
      const a = getPlayerSprite("#22d3ee", "#f0abfc");
      clearSpriteCache();
      const b = getPlayerSprite("#22d3ee", "#f0abfc");
      expect(a).not.toBe(b);
    });

    it("returns cached decor and particle sprites", () => {
      const decor = getDecorSprite("crate", "industrial");
      const particle = getParticleSprite("spark", "#f59e0b");
      expect(decor).toMatch(/^data:image\/png;base64,/);
      expect(particle).toMatch(/^data:image\/png;base64,/);
    });
  });
});
