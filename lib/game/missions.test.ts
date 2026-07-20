import { describe, it, expect } from "vitest";
import {
  generateMissions,
  generateDefenseMissions,
  getCurrentMission,
  updateMissions,
  advanceMission,
  createExtractionPoint,
  addKill,
  addResource,
  addNodeCapture,
  calculateMissionReward,
  calculateDefenseCompletionRewards,
  grantMissionReward,
} from "./missions";
import type { GameState, DefenseState } from "./types";

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
      heroId: null,
      activeSkill: null,
      skillTimer: 0,
      ultimateSkill: null,
      ultimateTimer: 0,
      deployableUpgrades: {},
      talentLevels: {},
      leopardFrenzyTimer: 0,
      leopardBloodlustStacks: 0,
      leopardBloodlustTimer: 0,
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
    killCombo: { count: 0, timer: 0, best: 0 },
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

  describe("generateDefenseMissions", () => {
    it("generates three defense missions", () => {
      const missions = generateDefenseMissions();
      expect(missions).toHaveLength(3);
      expect(missions.map((m) => m.type)).toContain("defendCore");
      expect(missions.map((m) => m.type)).toContain("captureNodes");
      expect(missions.map((m) => m.type)).toContain("surviveTimer");
    });

    it("shuffles missions with a seed", () => {
      const a = generateDefenseMissions(12345);
      const b = generateDefenseMissions(12345);
      const c = generateDefenseMissions(99999);
      expect(a.map((m) => m.type)).toEqual(b.map((m) => m.type));
      expect(a.map((m) => m.type)).not.toEqual(c.map((m) => m.type));
    });
  });

  describe("defendCore mission", () => {
    it("tracks progress based on completed waves with healthy core", () => {
      const state = createMockState();
      state.missions = [
        {
          id: "m1",
          type: "defendCore",
          title: "核心防线",
          description: "核心生命值保持在 60% 以上完成第 3 波",
          target: 3,
          progress: 0,
          completed: false,
          elapsed: 0,
        },
      ];
      state.defenseState = createMockDefenseState();
      state.defenseState.currentWave = 2;
      state.defenseState.waveInProgress = false;
      updateMissions(state, 0.1);
      expect(state.missions[0].progress).toBe(2);
    });

    it("resets progress when core health drops below threshold", () => {
      const state = createMockState();
      state.missions = [
        {
          id: "m1",
          type: "defendCore",
          title: "核心防线",
          description: "核心生命值保持在 60% 以上完成第 3 波",
          target: 3,
          progress: 2,
          completed: false,
          elapsed: 5,
        },
      ];
      state.defenseState = createMockDefenseState();
      state.defenseState.core.health = state.defenseState.core.maxHealth * 0.5;
      updateMissions(state, 0.1);
      expect(state.missions[0].progress).toBe(0);
    });
  });

  describe("captureNodes mission", () => {
    it("tracks captured node count", () => {
      const state = createMockState();
      state.missions = [
        {
          id: "m1",
          type: "captureNodes",
          title: "节点扩张",
          description: "占领 3 个能量节点",
          target: 3,
          progress: 0,
          completed: false,
          elapsed: 0,
        },
      ];
      state.defenseState = createMockDefenseState();
      state.defenseState.nodes[0].captured = true;
      state.defenseState.nodes[1].captured = true;
      updateMissions(state, 0.1);
      expect(state.missions[0].progress).toBe(2);
    });

    it("increments progress via addNodeCapture", () => {
      const state = createMockState();
      state.missions = [
        {
          id: "m1",
          type: "captureNodes",
          title: "节点扩张",
          description: "占领 3 个能量节点",
          target: 3,
          progress: 0,
          completed: false,
          elapsed: 0,
        },
      ];
      addNodeCapture(state, 2);
      expect(state.missions[0].progress).toBe(2);
    });
  });

  describe("mission rewards", () => {
    it("calculates eliminate reward", () => {
      const reward = calculateMissionReward(
        {
          id: "m1",
          type: "eliminate",
          title: "",
          description: "",
          target: 10,
          progress: 0,
          completed: false,
          elapsed: 0,
        },
        1
      );
      expect(reward.xp).toBeGreaterThan(0);
      expect(reward.score).toBeGreaterThan(0);
    });

    it("calculates defense completion rewards", () => {
      const state = createMockState();
      state.defenseState = createMockDefenseState();
      state.defenseState.core.health = state.defenseState.core.maxHealth * 0.8;
      state.defenseState.nodes[0].captured = true;
      state.defenseState.nodes[1].captured = true;
      state.defenseState.currentWave = 4;
      const reward = calculateDefenseCompletionRewards(state);
      expect(reward.xp).toBeGreaterThan(0);
      expect(reward.score).toBeGreaterThan(0);
      expect(reward.energy).toBe(state.defenseState.energy);
    });

    it("grants mission reward to player", () => {
      const state = createMockState();
      const beforeXp = state.player.xp;
      grantMissionReward(state, { xp: 100, resources: 5, energy: 0, score: 200 });
      expect(state.player.xp).toBe(beforeXp + 100);
      expect(state.stats.xpCollected).toBe(100);
      expect(state.stats.score).toBe(200);
    });
  });
});

function createMockDefenseState(): DefenseState {
  return {
    core: { x: 1100, y: 800, radius: 60, health: 5000, maxHealth: 5000, color: "#22d3ee" },
    nodes: [
      {
        id: "n1",
        x: 800,
        y: 800,
        radius: 45,
        active: true,
        captured: false,
        captureProgress: 0,
        captureTime: 4,
        energyValue: 150,
        waveIndex: 0,
        color: "#f59e0b",
      },
      {
        id: "n2",
        x: 1400,
        y: 800,
        radius: 45,
        active: true,
        captured: false,
        captureProgress: 0,
        captureTime: 4,
        energyValue: 180,
        waveIndex: 1,
        color: "#f59e0b",
      },
      {
        id: "n3",
        x: 1100,
        y: 1100,
        radius: 45,
        active: true,
        captured: false,
        captureProgress: 0,
        captureTime: 4,
        energyValue: 210,
        waveIndex: 2,
        color: "#f59e0b",
      },
    ],
    energy: 0,
    targetEnergy: 1200,
    currentWave: 0,
    totalWaves: 8,
    waveTimer: 0,
    breakTimer: 0,
    waveInProgress: false,
    waves: [],
    deployables: [],
    selectedHeroes: {},
  };
}
