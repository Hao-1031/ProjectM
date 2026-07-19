import { describe, it, expect } from "vitest";
import {
  generateMissions,
  getCurrentMission,
  updateMissions,
  advanceMission,
  createExtractionPoint,
  addKill,
  addResource,
} from "./missions";
import type { GameState } from "./types";

function createMockState(): GameState {
  return {
    status: "running",
    lastTime: 0,
    time: 0,
    map: { width: 2400, height: 1800, theme: "industrial", obstacles: [], hazards: [] },
    camera: { x: 1200, y: 900, scale: 1 },
    player: {
      id: "player",
      x: 1200,
      y: 900,
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
      knockbackX: 0,
      knockbackY: 0,
      burnDuration: 0,
      burnDamage: 0,
      facing: 0,
      animation: "idle",
      animationTimer: 0,
    },
    enemies: [],
    projectiles: [],
    enemyProjectiles: [],
    pickups: [],
    particles: [],
    damageNumbers: [],
    missions: generateMissions(),
    currentMissionIndex: 0,
    extraction: null,
    extractionTimer: 0,
    spawnTimer: 0,
    eventTimer: 25,
    mode: "campaign",
    modeConfig: {
      type: "campaign",
      name: "战役模式",
      description: "完成全部任务并抵达撤离点",
      allowMissions: true,
      endless: false,
    },
    seed: 12345,
    players: [],
    wave: 1,
    waveTimer: 0,
    eliteKillStreak: 0,
    difficulty: 1,
    intensity: 0,
    stats: {
      kills: 0,
      damageDealt: 0,
      damageTaken: 0,
      xpCollected: 0,
      resourcesCollected: 0,
      timeSurvived: 0,
      chestsOpened: 0,
      elitesKilled: 0,
      bossesKilled: 0,
    },
    activeEvent: null,
  };
}

describe("missions", () => {
  describe("generateMissions", () => {
    it("generates four missions", () => {
      const missions = generateMissions();
      expect(missions).toHaveLength(4);
    });

    it("marks missions as not completed", () => {
      const missions = generateMissions();
      expect(missions.every((m) => !m.completed)).toBe(true);
    });
  });

  describe("getCurrentMission", () => {
    it("returns first mission initially", () => {
      const state = createMockState();
      const mission = getCurrentMission(state);
      expect(mission).not.toBeNull();
      expect(mission?.type).toBe("eliminate");
    });

    it("returns null when all missions completed", () => {
      const state = createMockState();
      state.currentMissionIndex = state.missions.length;
      expect(getCurrentMission(state)).toBeNull();
    });
  });

  describe("updateMissions", () => {
    it("updates survive mission progress", () => {
      const state = createMockState();
      state.missions = [
        {
          id: "m1",
          type: "survive",
          title: "坚守阵地",
          description: "存活 60 秒",
          target: 60,
          progress: 0,
          completed: false,
          timeLimit: 70,
          elapsed: 0,
        },
      ];
      updateMissions(state, 10);
      expect(state.missions[0].progress).toBe(10);
    });

    it("updates rescue mission progress when player at beacon", () => {
      const state = createMockState();
      state.missions = [
        {
          id: "m1",
          type: "rescue",
          title: "营救信号",
          description: "抵达信标并防守 30 秒",
          target: 30,
          progress: 0,
          completed: false,
          timeLimit: 45,
          elapsed: 0,
        },
      ];
      state.extraction = { x: 1200, y: 900, radius: 70, active: true };
      updateMissions(state, 5);
      expect(state.missions[0].progress).toBe(5);
    });

    it("marks mission completed when target reached", () => {
      const state = createMockState();
      state.missions = [
        {
          id: "m1",
          type: "eliminate",
          title: "清剿感染者",
          description: "消灭 30 个感染者",
          target: 30,
          progress: 29,
          completed: false,
          elapsed: 0,
        },
      ];
      addKill(state, 1);
      updateMissions(state, 0);
      expect(state.missions[0].completed).toBe(true);
      expect(state.missions[0].progress).toBe(30);
    });

    it("fails timed mission when time limit exceeded", () => {
      const state = createMockState();
      state.missions = [
        {
          id: "m1",
          type: "survive",
          title: "坚守阵地",
          description: "存活 60 秒",
          target: 60,
          progress: 0,
          completed: false,
          timeLimit: 10,
          elapsed: 0,
        },
      ];
      updateMissions(state, 15);
      expect(state.status).toBe("defeat");
    });
  });

  describe("advanceMission", () => {
    it("advances to next mission", () => {
      const state = createMockState();
      state.missions[0].completed = true;
      advanceMission(state);
      expect(state.currentMissionIndex).toBe(1);
    });

    it("creates extraction point after final mission", () => {
      const state = createMockState();
      state.currentMissionIndex = state.missions.length - 1;
      state.missions[state.missions.length - 1].completed = true;
      advanceMission(state);
      expect(state.extraction).not.toBeNull();
      expect(state.extractionTimer).toBe(30);
    });

    it("creates beacon for rescue mission", () => {
      const state = createMockState();
      state.missions[0].completed = true;
      state.missions[1].type = "rescue";
      advanceMission(state);
      expect(state.extraction).not.toBeNull();
    });
  });

  describe("createExtractionPoint", () => {
    it("creates point within map bounds", () => {
      const point = createExtractionPoint({
        width: 2400,
        height: 1800,
        theme: "industrial",
        obstacles: [],
        hazards: [],
      });
      expect(point.x).toBeGreaterThan(0);
      expect(point.x).toBeLessThan(2400);
      expect(point.y).toBeGreaterThan(0);
      expect(point.y).toBeLessThan(1800);
      expect(point.radius).toBe(70);
      expect(point.active).toBe(true);
    });

    it("keeps point away from player when requested", () => {
      const point = createExtractionPoint(
        { width: 2400, height: 1800, theme: "industrial", obstacles: [], hazards: [] },
        { x: 1200, y: 900 }
      );
      expect(Math.hypot(point.x - 1200, point.y - 900)).toBeGreaterThanOrEqual(400);
    });
  });

  describe("addKill", () => {
    it("increments eliminate progress", () => {
      const state = createMockState();
      addKill(state, 5);
      expect(state.missions[0].progress).toBe(5);
      expect(state.stats.kills).toBe(5);
    });
  });

  describe("addResource", () => {
    it("increments collect progress", () => {
      const state = createMockState();
      state.currentMissionIndex = 2;
      addResource(state, 3);
      expect(state.missions[2].progress).toBe(3);
      expect(state.stats.resourcesCollected).toBe(3);
    });
  });
});
