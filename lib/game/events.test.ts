import { describe, it, expect } from "vitest";
import {
  createGameEvent,
  startGameEvent,
  tickGameEvent,
  endActiveEvent,
  getEligibleEventTypes,
  pickRandomEventType,
  calculateEventCompletionReward,
  grantEventReward,
  EVENT_DEFINITIONS,
} from "./events";
import type { GameState } from "./types";

function createMockState(mode: GameState["mode"] = "campaign", hasDefense = false): GameState {
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
    missions: [],
    currentMissionIndex: 0,
    extraction: null,
    extractionTimer: 0,
    spawnTimer: 0,
    eventTimer: 25,
    mode,
    modeConfig: {
      type: mode,
      name: "测试模式",
      description: "",
      allowMissions: false,
      endless: mode === "endless" || mode === "daily",
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
    defenseState: hasDefense
      ? {
          core: { x: 1200, y: 900, radius: 60, health: 5000, maxHealth: 5000, color: "#22d3ee" },
          nodes: [],
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
        }
      : undefined,
  };
}

describe("events", () => {
  describe("EVENT_DEFINITIONS", () => {
    it("defines all event types", () => {
      expect(Object.keys(EVENT_DEFINITIONS)).toHaveLength(7);
      expect(EVENT_DEFINITIONS.airdrop).toBeDefined();
      expect(EVENT_DEFINITIONS.horde).toBeDefined();
      expect(EVENT_DEFINITIONS.eliteHunt).toBeDefined();
      expect(EVENT_DEFINITIONS.supply).toBeDefined();
      expect(EVENT_DEFINITIONS.empPulse).toBeDefined();
      expect(EVENT_DEFINITIONS.mechReinforcement).toBeDefined();
      expect(EVENT_DEFINITIONS.coreOverload).toBeDefined();
    });
  });

  describe("createGameEvent", () => {
    it("creates an event with timer and duration", () => {
      const state = createMockState();
      const event = createGameEvent("horde", state);
      expect(event.type).toBe("horde");
      expect(event.timer).toBeGreaterThan(0);
      expect(event.duration).toBeGreaterThan(0);
      expect(event.active).toBe(true);
    });

    it("sets position for airdrop events", () => {
      const state = createMockState();
      const event = createGameEvent("airdrop", state);
      expect(event.x).toBeDefined();
      expect(event.y).toBeDefined();
    });
  });

  describe("getEligibleEventTypes", () => {
    it("includes coreOverload only in defense mode", () => {
      const campaign = createMockState("campaign");
      const defense = createMockState("defense", true);
      expect(getEligibleEventTypes(campaign)).not.toContain("coreOverload");
      expect(getEligibleEventTypes(defense)).toContain("coreOverload");
    });
  });

  describe("pickRandomEventType", () => {
    it("returns a valid event type", () => {
      const state = createMockState();
      const rng = () => 0.5;
      const type = pickRandomEventType(state, rng);
      expect(Object.keys(EVENT_DEFINITIONS)).toContain(type);
    });
  });

  describe("startGameEvent", () => {
    it("spawns airdrop pickup", () => {
      const state = createMockState();
      startGameEvent("airdrop", state);
      expect(state.pickups.some((p) => p.type === "chest")).toBe(true);
    });

    it("boosts magnet range for supply event", () => {
      const state = createMockState();
      const baseRange = state.player.magnetRange;
      startGameEvent("supply", state);
      expect(state.player.magnetRange).toBeGreaterThan(baseRange);
    });

    it("slows mechanical enemies for empPulse event", () => {
      const state = createMockState();
      state.enemies.push({
        id: "e1",
        x: 1200,
        y: 900,
        radius: 14,
        speed: 100,
        health: 100,
        maxHealth: 100,
        damage: 10,
        xpValue: 5,
        color: "#94a3b8",
        variant: "drone",
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
        attackCooldown: 1,
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
      });
      const baseSpeed = state.enemies[0].speed;
      startGameEvent("empPulse", state);
      expect(state.enemies[0].speed).toBeLessThan(baseSpeed);
    });
  });

  describe("tickGameEvent", () => {
    it("ticks timer and clears event when expired", () => {
      const state = createMockState();
      startGameEvent("horde", state);
      const event = tickGameEvent(state, 100);
      expect(event).toBeNull();
      expect(state.activeEvent).toBeNull();
    });

    it("restores magnet range after supply event ends", () => {
      const state = createMockState();
      const baseRange = state.player.magnetRange;
      startGameEvent("supply", state);
      expect(state.player.magnetRange).toBeGreaterThan(baseRange);
      tickGameEvent(state, EVENT_DEFINITIONS.supply.duration + 0.1);
      expect(state.player.magnetRange).toBe(baseRange);
    });
  });

  describe("endActiveEvent", () => {
    it("cleans up active event", () => {
      const state = createMockState();
      startGameEvent("supply", state);
      endActiveEvent(state);
      expect(state.activeEvent).toBeNull();
    });
  });

  describe("calculateEventCompletionReward", () => {
    it("returns reward for each event type", () => {
      const reward = calculateEventCompletionReward("eliteHunt");
      expect(reward.xp).toBeGreaterThan(0);
      expect(reward.resources).toBeGreaterThanOrEqual(0);
    });
  });

  describe("grantEventReward", () => {
    it("adds xp and resources to player", () => {
      const state = createMockState();
      grantEventReward(state, { xp: 50, resources: 3, energy: 0 });
      expect(state.player.xp).toBe(50);
      expect(state.stats.xpCollected).toBe(50);
      expect(state.stats.resourcesCollected).toBe(3);
    });

    it("adds energy in defense mode", () => {
      const state = createMockState("defense", true);
      grantEventReward(state, { xp: 0, resources: 0, energy: 100 });
      expect(state.defenseState!.energy).toBe(100);
    });
  });
});
