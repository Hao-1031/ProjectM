import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getModeDefinition,
  generateCampaignMissions,
  generateEndlessMissions,
  createGameModeConfig,
  getDefaultMode,
  getModeList,
  generateDailySeed,
  generateRoguelikeStages,
  seededRandom,
  getDailyModifiers,
} from "./modes";
import type { GameModeType } from "./types";

describe("modes", () => {
  describe("getModeDefinition", () => {
    it("returns definitions for all modes", () => {
      const modes: GameModeType[] = ["campaign", "endless", "daily", "roguelike"];
      for (const mode of modes) {
        const def = getModeDefinition(mode);
        expect(def.type).toBe(mode);
        expect(def.name).toBeTruthy();
        expect(def.description).toBeTruthy();
      }
    });
  });

  describe("generateCampaignMissions", () => {
    it("generates four missions", () => {
      const missions = generateCampaignMissions();
      expect(missions).toHaveLength(4);
    });

    it("missions are ordered eliminate, collect, rescue, extract", () => {
      const missions = generateCampaignMissions();
      expect(missions[0].type).toBe("eliminate");
      expect(missions[1].type).toBe("collect");
      expect(missions[2].type).toBe("rescue");
      expect(missions[3].type).toBe("extract");
    });

    it("missions start uncompleted", () => {
      const missions = generateCampaignMissions();
      expect(missions.every((m) => !m.completed)).toBe(true);
    });
  });

  describe("generateEndlessMissions", () => {
    it("generates survive mission scaled by wave", () => {
      const mission = generateEndlessMissions(1)[0];
      expect(mission.type).toBe("survive");
      expect(mission.target).toBe(150);
    });

    it("increases target with higher waves", () => {
      const mission = generateEndlessMissions(5)[0];
      expect(mission.target).toBe(270);
    });
  });

  describe("createGameModeConfig", () => {
    it("creates campaign config without extra fields", () => {
      const config = createGameModeConfig("campaign", 12345);
      expect(config.type).toBe("campaign");
      expect(config.dailySeed).toBeUndefined();
      expect(config.roguelikeStages).toBeUndefined();
    });

    it("creates daily config with dailySeed", () => {
      const config = createGameModeConfig("daily");
      expect(config.type).toBe("daily");
      expect(config.dailySeed).toBeTruthy();
      expect(config.roguelikeStages).toBeUndefined();
    });

    it("creates roguelike config with stages", () => {
      const config = createGameModeConfig("roguelike", 12345);
      expect(config.type).toBe("roguelike");
      expect(config.roguelikeStages).toBeDefined();
      expect(config.roguelikeStages!.length).toBeGreaterThan(0);
    });

    it("creates endless config", () => {
      const config = createGameModeConfig("endless", 12345);
      expect(config.type).toBe("endless");
      expect(config.endless).toBe(true);
      expect(config.allowMissions).toBe(false);
    });
  });

  describe("getDefaultMode", () => {
    it("returns campaign", () => {
      expect(getDefaultMode()).toBe("campaign");
    });
  });

  describe("getModeList", () => {
    it("lists all six modes", () => {
      const list = getModeList();
      expect(list).toHaveLength(6);
      expect(list.map((m) => m.type)).toContain("campaign");
      expect(list.map((m) => m.type)).toContain("endless");
      expect(list.map((m) => m.type)).toContain("daily");
      expect(list.map((m) => m.type)).toContain("roguelike");
      expect(list.map((m) => m.type)).toContain("defense");
      expect(list.map((m) => m.type)).toContain("deathmatch");
    });
  });

  describe("generateDailySeed", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 6, 18));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("generates date based seed", () => {
      const seed = generateDailySeed();
      expect(seed).toBe("20260718");
    });

    it("changes with date", () => {
      vi.setSystemTime(new Date(2026, 6, 19));
      expect(generateDailySeed()).toBe("20260719");
    });
  });

  describe("generateRoguelikeStages", () => {
    it("generates stages with combat, elite, reward and boss", () => {
      const stages = generateRoguelikeStages(12345);
      const types = stages.map((s) => s.type);
      expect(types).toContain("combat");
      expect(types).toContain("elite");
      expect(types).toContain("reward");
      expect(types).toContain("boss");
    });

    it("generates deterministic stages for same seed", () => {
      const a = generateRoguelikeStages(12345);
      const b = generateRoguelikeStages(12345);
      expect(a).toEqual(b);
    });

    it("reward stage has rewardOptions", () => {
      const stages = generateRoguelikeStages(12345);
      const reward = stages.find((s) => s.type === "reward");
      expect(reward?.rewardOptions).toBe(3);
    });

    it("boss stage has larger target", () => {
      const stages = generateRoguelikeStages(12345);
      const boss = stages.find((s) => s.type === "boss");
      expect(boss?.mission.target).toBe(1);
    });

    it("stages start uncleared", () => {
      const stages = generateRoguelikeStages(12345);
      expect(stages.every((s) => !s.cleared)).toBe(true);
    });
  });

  describe("seededRandom", () => {
    it("produces deterministic sequence for same seed", () => {
      const rngA = seededRandom(42);
      const rngB = seededRandom(42);
      for (let i = 0; i < 10; i++) {
        expect(rngA()).toBe(rngB());
      }
    });

    it("produces values between 0 and 1", () => {
      const rng = seededRandom(123);
      for (let i = 0; i < 20; i++) {
        const value = rng();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it("produces different sequences for different seeds", () => {
      const rngA = seededRandom(1);
      const rngB = seededRandom(2);
      expect(rngA()).not.toBe(rngB());
    });
  });

  describe("getDailyModifiers", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 6, 18));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns at least one modifier", () => {
      const modifiers = getDailyModifiers();
      expect(modifiers.length).toBeGreaterThanOrEqual(1);
    });

    it("returns deterministic modifiers for same day", () => {
      const a = getDailyModifiers();
      const b = getDailyModifiers();
      expect(a).toEqual(b);
    });

    it("modifiers have title and description", () => {
      const modifiers = getDailyModifiers();
      for (const modifier of modifiers) {
        expect(modifier.title).toBeTruthy();
        expect(modifier.description).toBeTruthy();
      }
    });
  });
});
