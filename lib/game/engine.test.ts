import { describe, it, expect, beforeEach, vi } from "vitest";
import { GameEngine } from "./engine";
import type { InputState } from "./types";
import { getCurrentStage } from "./roguelike";
import type { RoguelikeRewardBalance } from "./balance";

const idleInput: InputState = {
  move: { x: 0, y: 0 },
  aim: { x: 0, y: 0 },
  fire: false,
  pause: false,
};

const rightInput: InputState = {
  move: { x: 1, y: 0 },
  aim: { x: 1, y: 0 },
  fire: true,
  pause: false,
};

describe("GameEngine", () => {
  beforeEach(() => {
    vi.stubGlobal("performance", {
      now: vi.fn(() => 0),
    });
  });

  it("initializes in idle state", () => {
    const engine = new GameEngine();
    expect(engine.state.status).toBe("idle");
    expect(engine.state.player.health).toBe(200);
  });

  it("starts running", () => {
    const engine = new GameEngine();
    engine.start();
    expect(engine.state.status).toBe("running");
  });

  it("pauses and resumes", () => {
    const engine = new GameEngine();
    engine.start();
    engine.pause();
    expect(engine.state.status).toBe("paused");
    engine.pause();
    expect(engine.state.status).toBe("running");
  });

  it("moves player based on input", () => {
    const engine = new GameEngine();
    engine.resize(800, 600);
    engine.start();
    const startX = engine.state.player.x;
    engine.update(rightInput, 1000);
    expect(engine.state.player.x).toBeGreaterThan(startX);
  });

  it("clamps player inside map", () => {
    const engine = new GameEngine();
    engine.resize(800, 600);
    engine.start();
    engine.state.player.x = 0;
    engine.update(
      {
        move: { x: -1, y: 0 },
        aim: { x: -1, y: 0 },
        fire: false,
        pause: false,
      },
      1000
    );
    expect(engine.state.player.x).toBe(engine.state.player.radius);
  });

  it("spawns enemies over time", () => {
    const engine = new GameEngine();
    engine.resize(800, 600);
    engine.start();
    expect(engine.state.enemies.length).toBe(0);
    engine.update(idleInput, 5000);
    expect(engine.state.enemies.length).toBeGreaterThan(0);
  });

  it("levels up when collecting xp", () => {
    let options: import("./types").UpgradeOption[] | null = null;
    const engine = new GameEngine({
      onLevelUp: (opts) => {
        options = opts;
      },
    });
    engine.resize(800, 600);
    engine.start();
    engine.state.pickups.push({
      id: "xp_1",
      x: engine.state.player.x,
      y: engine.state.player.y,
      radius: 5,
      type: "xp",
      value: engine.state.player.xpToNext,
      color: "#22d3ee",
      magnetized: false,
    });
    engine.update(idleInput, 16);
    expect(engine.state.player.level).toBeGreaterThan(1);
    expect(options).not.toBeNull();
  });

  it("ends run when enemy kills player", () => {
    const engine = new GameEngine();
    engine.resize(800, 600);
    engine.start();
    engine.state.enemies.push({
      id: "enemy_1",
      x: engine.state.player.x,
      y: engine.state.player.y,
      radius: 20,
      speed: 0,
      health: 100,
      maxHealth: 100,
      damage: 200,
      xpValue: 0,
      color: "#f43f5e",
      variant: "tank",
      slow: 0,
      affixes: [],
      phase: 0,
      phaseThresholds: [],
      targetCore: false,
      facing: 0,
      animation: "move",
      animationTimer: 0,
      isElite: false,
      isBoss: false,
      attackTimer: 0,
      attackCooldown: 0,
      knockbackX: 0,
      knockbackY: 0,
      burnDuration: 0,
    });
    engine.update(idleInput, 16);
    expect(engine.state.status).toBe("defeat");
  });

  it("restarts to initial state", () => {
    const engine = new GameEngine();
    engine.resize(800, 600);
    engine.start();
    engine.state.status = "defeat";
    engine.restart();
    expect(engine.state.status).toBe("running");
    expect(engine.state.player.health).toBe(200);
    expect(engine.state.stats.kills).toBe(0);
  });

  describe("enemy variants", () => {
    it("spawns elite enemy with elite flag", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine.state.difficulty = 10;
      engine["spawnEnemy"]("elite", true);
      const elite = engine.state.enemies[engine.state.enemies.length - 1];
      expect(elite.variant).toBe("elite");
      expect(elite.isElite).toBe(true);
      expect(elite.maxHealth).toBeGreaterThan(100);
    });

    it("spawns boss enemy", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine["spawnEnemy"]("boss", true);
      const boss = engine.state.enemies[engine.state.enemies.length - 1];
      expect(boss.variant).toBe("boss");
      expect(boss.isBoss).toBe(true);
      expect(boss.radius).toBeGreaterThanOrEqual(40);
    });

    it("spitter keeps distance and fires projectile", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine.state.enemies.push({
        id: "spitter_1",
        x: engine.state.player.x + 100,
        y: engine.state.player.y,
        radius: 12,
        speed: 95,
        health: 50,
        maxHealth: 50,
        damage: 8,
        xpValue: 8,
        color: "#a3e635",
        variant: "spitter",
        slow: 0,
        affixes: [],
        phase: 0,
        phaseThresholds: [],
        facing: 0,
        animation: "move",
        animationTimer: 0,
        isElite: false,
        isBoss: false,
        attackTimer: 0,
        attackCooldown: 0.1,
        knockbackX: 0,
        knockbackY: 0,
        burnDuration: 0,
        targetCore: false,
      });
      engine.update(idleInput, 100);
      expect(engine.state.enemyProjectiles.length).toBeGreaterThan(0);
    });

    it("boss fires spread projectiles", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine.state.enemies.push({
        id: "boss_1",
        x: engine.state.player.x + 200,
        y: engine.state.player.y,
        radius: 40,
        speed: 70,
        health: 1000,
        maxHealth: 1000,
        damage: 40,
        xpValue: 200,
        color: "#e879f9",
        variant: "overlord",
        slow: 0,
        affixes: [],
        phase: 0,
        phaseThresholds: [0.65, 0.35],
        targetCore: false,
        facing: 0,
        animation: "move",
        animationTimer: 0,
        isElite: false,
        isBoss: true,
        attackTimer: 0,
        attackCooldown: 0.1,
        knockbackX: 0,
        knockbackY: 0,
        burnDuration: 0,
      });
      engine.update(idleInput, 100);
      expect(engine.state.enemyProjectiles.length).toBeGreaterThanOrEqual(3);
    });

    it("runner is faster than walker", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine["spawnEnemy"]("runner", false);
      engine["spawnEnemy"]("walker", false);
      const runner = engine.state.enemies.find((e) => e.variant === "runner")!;
      const walker = engine.state.enemies.find((e) => e.variant === "walker")!;
      expect(runner.speed).toBeGreaterThan(walker.speed);
    });

    it("tank is larger and healthier than walker", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine["spawnEnemy"]("tank", false);
      engine["spawnEnemy"]("walker", false);
      const tank = engine.state.enemies.find((e) => e.variant === "tank")!;
      const walker = engine.state.enemies.find((e) => e.variant === "walker")!;
      expect(tank.radius).toBeGreaterThan(walker.radius);
      expect(tank.maxHealth).toBeGreaterThan(walker.maxHealth);
      expect(tank.damage).toBeGreaterThan(walker.damage);
    });

    it("walker is melee and has no attack cooldown", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine["spawnEnemy"]("walker", false);
      const walker = engine.state.enemies.find((e) => e.variant === "walker")!;
      expect(walker.attackCooldown).toBe(0);
    });

    it("elite enemy receives affixes and increased stats", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine.state.difficulty = 10;
      engine["spawnEnemy"]("runner", true);
      const elite = engine.state.enemies[engine.state.enemies.length - 1];
      engine["spawnEnemy"]("runner", false);
      const normal = engine.state.enemies[engine.state.enemies.length - 1];
      expect(elite.isElite).toBe(true);
      expect(elite.affixes.length).toBeGreaterThan(0);
      expect(elite.maxHealth).toBeGreaterThan(normal.maxHealth);
    });
  });

  describe("environment", () => {
    it("creates obstacles and hazards on map", () => {
      const engine = new GameEngine();
      expect(engine.state.map.obstacles.length).toBeGreaterThan(0);
      expect(engine.state.map.hazards.length).toBeGreaterThan(0);
    });

    it("resolves player obstacle collision", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine.state.map.obstacles = [
        {
          id: "obs_test",
          x: 400,
          y: 300,
          width: 120,
          height: 120,
          color: "#1c2033",
          health: 120,
          maxHealth: 120,
          destructible: true,
        },
      ];
      const obstacle = engine.state.map.obstacles[0];
      engine.state.player.x = obstacle.x + obstacle.width / 2 + 5;
      engine.state.player.y = obstacle.y;
      engine.update(idleInput, 16);
      expect(engine.state.player.x).toBeGreaterThanOrEqual(
        obstacle.x + obstacle.width / 2 + engine.state.player.radius
      );
    });

    it("unsticks player when placed inside obstacle", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine.state.map.obstacles = [
        {
          id: "obs_test",
          x: 400,
          y: 300,
          width: 120,
          height: 120,
          color: "#1c2033",
          health: 120,
          maxHealth: 120,
          destructible: true,
        },
      ];
      const obstacle = engine.state.map.obstacles[0];
      // Place player center inside obstacle.
      engine.state.player.x = obstacle.x;
      engine.state.player.y = obstacle.y;
      engine.update(idleInput, 16);
      // After resolution the player should no longer collide with the obstacle.
      expect(
        engine.state.player.x < obstacle.x - obstacle.width / 2 - engine.state.player.radius ||
          engine.state.player.x > obstacle.x + obstacle.width / 2 + engine.state.player.radius ||
          engine.state.player.y < obstacle.y - obstacle.height / 2 - engine.state.player.radius ||
          engine.state.player.y > obstacle.y + obstacle.height / 2 + engine.state.player.radius
      ).toBe(true);
    });

    it("keeps player movable after repeated updates near obstacles", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine.state.map.obstacles = [
        {
          id: "obs_test",
          x: 400,
          y: 300,
          width: 120,
          height: 120,
          color: "#1c2033",
          health: 120,
          maxHealth: 120,
          destructible: true,
        },
      ];
      const obstacle = engine.state.map.obstacles[0];
      // Start just outside the right edge.
      engine.state.player.x = obstacle.x + obstacle.width / 2 + engine.state.player.radius + 2;
      engine.state.player.y = obstacle.y;

      let time = 16;
      for (let i = 0; i < 60; i++) {
        engine.update(
          {
            move: { x: -1, y: 0 },
            aim: { x: -1, y: 0 },
            fire: false,
            pause: false,
          },
          (time += 16)
        );
      }

      // Player should remain roughly outside the obstacle on the right side and be able to move.
      expect(engine.state.player.x).toBeGreaterThanOrEqual(obstacle.x + obstacle.width / 2 - 1);
      expect(engine.state.player.x).toBeLessThanOrEqual(
        obstacle.x + obstacle.width / 2 + engine.state.player.radius + 2
      );
    });

    it("hazard damages player over time", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      const hazard = engine.state.map.hazards[0];
      engine.state.player.x = hazard.x;
      engine.state.player.y = hazard.y;
      const healthBefore = engine.state.player.health;
      hazard.timer = hazard.interval;
      engine.update(idleInput, 100);
      expect(engine.state.player.health).toBeLessThan(healthBefore);
    });
  });

  describe("events", () => {
    it("starts random event when timer expires", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine.state.eventTimer = 0;
      engine.update(idleInput, 16);
      expect(engine.state.activeEvent).not.toBeNull();
    });

    it("airdrop spawns chest pickup", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine["startRandomEvent"]();
      while (engine.state.activeEvent?.type !== "airdrop") {
        engine.state.activeEvent = null;
        engine["startRandomEvent"]();
      }
      const chest = engine.state.pickups.find((p) => p.type === "chest");
      expect(chest).toBeDefined();
      expect(engine.state.activeEvent?.title).toBe("物资空投");
    });

    it("horde event increases spawn rate", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine.state.activeEvent = {
        id: "event_1",
        type: "horde",
        title: "感染者潮",
        description: "",
        active: true,
        timer: 5,
        duration: 5,
      };
      engine.state.spawnTimer = 0;
      const before = engine.state.enemies.length;
      let time = 0;
      for (let i = 0; i < 60; i++) {
        time += 50;
        engine.update(idleInput, time);
      }
      expect(engine.state.enemies.length).toBeGreaterThan(before + 5);
    });

    it("eliteHunt event spawns elite enemy", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine["startRandomEvent"]();
      while (engine.state.activeEvent?.type !== "eliteHunt") {
        engine.state.activeEvent = null;
        engine["startRandomEvent"]();
      }
      expect(engine.state.enemies.some((e) => e.variant === "elite")).toBe(true);
    });

    it("supply event boosts magnet range", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      const baseRange = engine.state.player.magnetRange;
      engine["startRandomEvent"]();
      while (engine.state.activeEvent?.type !== "supply") {
        engine.state.activeEvent = null;
        engine["startRandomEvent"]();
      }
      expect(engine.state.player.magnetRange).toBeGreaterThan(baseRange);
    });
  });

  describe("damage and defense", () => {
    it("armor reduces damage taken", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine.state.player.armor = 0.5;
      engine.state.enemies.push({
        id: "enemy_1",
        x: engine.state.player.x,
        y: engine.state.player.y,
        radius: 20,
        speed: 0,
        health: 100,
        maxHealth: 100,
        damage: 40,
        xpValue: 0,
        color: "#f43f5e",
        variant: "walker",
        slow: 0,
        affixes: [],
        phase: 0,
        phaseThresholds: [],
        facing: 0,
        animation: "move",
        animationTimer: 0,
        isElite: false,
        isBoss: false,
        attackTimer: 0,
        attackCooldown: 0,
        knockbackX: 0,
        knockbackY: 0,
        burnDuration: 0,
        targetCore: false,
      });
      engine.update(idleInput, 16);
      expect(engine.state.stats.damageTaken).toBe(20);
    });

    it("crit chance increases damage dealt", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine.state.player.critChance = 1;
      engine.state.player.weapons[0].cooldown = 0.01;
      engine.state.enemies.push({
        id: "enemy_1",
        x: engine.state.player.x + 50,
        y: engine.state.player.y,
        radius: 20,
        speed: 0,
        health: 1000,
        maxHealth: 1000,
        damage: 10,
        xpValue: 0,
        color: "#f43f5e",
        variant: "walker",
        slow: 0,
        affixes: [],
        phase: 0,
        phaseThresholds: [],
        facing: 0,
        animation: "move",
        animationTimer: 0,
        isElite: false,
        isBoss: false,
        attackTimer: 0,
        attackCooldown: 0,
        knockbackX: 0,
        knockbackY: 0,
        burnDuration: 0,
        targetCore: false,
      });
      engine.update(rightInput, performance.now() + 100);
      const critNumber = engine.state.damageNumbers.find((n) => n.isCritical);
      expect(critNumber).toBeDefined();
    });
  });

  describe("pickups", () => {
    it("chest drops multiple pickups when opened", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine.state.pickups.push({
        id: "chest_1",
        x: engine.state.player.x,
        y: engine.state.player.y,
        radius: 14,
        type: "chest",
        value: 0,
        color: "#e879f9",
        magnetized: false,
      });
      const before = engine.state.pickups.length;
      engine.update(idleInput, 16);
      expect(engine.state.pickups.length).toBeGreaterThan(before);
      expect(engine.state.stats.chestsOpened).toBe(1);
    });

    it("magnet pulls xp pickups toward player", () => {
      const engine = new GameEngine();
      engine.resize(800, 600);
      engine.start();
      engine.state.player.magnetRange = 300;
      engine.state.pickups.push({
        id: "xp_1",
        x: engine.state.player.x + 100,
        y: engine.state.player.y,
        radius: 5,
        type: "xp",
        value: 5,
        color: "#22d3ee",
        magnetized: false,
      });
      engine.update(idleInput, 100);
      const pickup = engine.state.pickups[0];
      expect(pickup.magnetized).toBe(true);
      expect(pickup.x).toBeLessThan(engine.state.player.x + 100);
    });
  });

  function forceCompleteCurrentStage(engine: GameEngine) {
    const run = engine.state.roguelikeRunState!;
    const stage = getCurrentStage(run)!;
    stage.mission.completed = true;
    stage.mission.progress = stage.mission.target;
    engine.update(idleInput, 16);
  }

  function skipRewardIfPresent(engine: GameEngine) {
    if (engine.state.status === "reward") {
      const run = engine.state.roguelikeRunState!;
      const options = run.pendingRewards!;
      engine.selectRoguelikeReward(options[0].id);
    }
  }

  describe("roguelike mode", () => {
    it("initializes roguelike run state and first stage mission", () => {
      const engine = new GameEngine({}, "roguelike", 12345);
      expect(engine.state.mode).toBe("roguelike");
      expect(engine.state.roguelikeRunState).toBeDefined();
      expect(engine.state.missions).toHaveLength(1);
      expect(engine.state.missions[0].completed).toBe(false);
    });

    it("advances stage when current mission completes", () => {
      const engine = new GameEngine({}, "roguelike", 12345);
      engine.resize(800, 600);
      engine.start();
      const run = engine.state.roguelikeRunState!;
      const initialIndex = run.currentIndex;
      const mission = engine.state.missions[0];
      mission.progress = mission.target;
      engine.update(idleInput, 16);
      expect(run.currentIndex).toBe(initialIndex + 1);
      expect(engine.state.missions[0].id).not.toBe(mission.id);
    });

    it("offers reward on reward stage", () => {
      let offered: RoguelikeRewardBalance[] | null = null;
      const engine = new GameEngine(
        {
          onRoguelikeRewardOffer: (opts) => {
            offered = opts;
          },
        },
        "roguelike",
        12345
      );
      engine.resize(800, 600);
      engine.start();
      const run = engine.state.roguelikeRunState!;
      while (getCurrentStage(run)?.type !== "reward" && run.currentIndex < run.stages.length - 1) {
        forceCompleteCurrentStage(engine);
        skipRewardIfPresent(engine);
      }
      expect(getCurrentStage(run)?.type).toBe("reward");
      const stage = getCurrentStage(run)!;
      stage.mission.completed = true;
      stage.mission.progress = stage.mission.target;
      engine.update(idleInput, 16);
      expect(engine.state.status).toBe("reward");
      expect(offered).not.toBeNull();
      expect(offered!.length).toBeGreaterThan(0);
    });

    it("applies selected reward and resumes", () => {
      const engine = new GameEngine({}, "roguelike", 12345);
      engine.resize(800, 600);
      engine.start();
      const run = engine.state.roguelikeRunState!;
      while (getCurrentStage(run)?.type !== "reward" && run.currentIndex < run.stages.length - 1) {
        forceCompleteCurrentStage(engine);
        skipRewardIfPresent(engine);
      }
      const stage = getCurrentStage(run)!;
      stage.mission.completed = true;
      stage.mission.progress = stage.mission.target;
      engine.update(idleInput, 16);
      const healthBefore = engine.state.player.maxHealth;
      engine.selectRoguelikeReward("health_boost");
      expect(engine.state.status).toBe("running");
      expect(engine.state.player.maxHealth).toBeGreaterThan(healthBefore);
    });

    it("spawns boss on boss stage", () => {
      const engine = new GameEngine({}, "roguelike", 12345);
      engine.resize(800, 600);
      engine.start();
      const run = engine.state.roguelikeRunState!;
      while (getCurrentStage(run)?.type !== "boss" && run.currentIndex < run.stages.length - 1) {
        forceCompleteCurrentStage(engine);
        skipRewardIfPresent(engine);
      }
      expect(engine.state.enemies.some((e) => e.isBoss)).toBe(true);
    });
  });
});
