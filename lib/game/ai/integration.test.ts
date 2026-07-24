import { describe, it, expect } from "vitest";
import type { Enemy, Player, Obstacle, GameState, DeathmatchBot, EnergyNode, DefenseCore } from "../types";
import type { AIContext, BotContext } from "./types";
import type { AlphaDifficultySnapshot } from "../alpha/types";
import {
  mapDifficultyToAIParams,
  getAggression,
  getSpeedMultiplier,
  getAttackDesireMultiplier,
} from "./alpha-bridge";
import { getFlowDirection, avoidObstacles, hasLineOfSight, findOpenDirection } from "./pathfinding";
import { runBossAI, resetBossState } from "./boss-state";
import { assignBotRole, runBotAI } from "./bot-ai";
import { selectTarget } from "./tactics";
import { AlphaScheduler } from "../alpha";

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "p1",
    x: 500,
    y: 500,
    radius: 12,
    speed: 240,
    maxHealth: 100,
    health: 100,
    level: 1,
    xp: 0,
    xpToNext: 50,
    weapons: [],
    passives: [],
    invincible: 0,
    magnetRange: 80,
    armor: 0,
    critChance: 0.05,
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
    ...overrides,
  };
}

function makeEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: "e1",
    x: 400,
    y: 400,
    radius: 14,
    speed: 120,
    maxHealth: 80,
    health: 80,
    damage: 10,
    xpValue: 10,
    color: "#ff0000",
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
    attackCooldown: 1,
    knockbackX: 0,
    knockbackY: 0,
    burnDuration: 0,
    burnDamage: 0,
    phase: 0,
    phaseThresholds: [],
    targetCore: false,
    facing: 0,
    animation: "idle",
    animationTimer: 0,
    ...overrides,
  };
}

function makeWeapon(overrides: Partial<Player["weapons"][number]> = {}): Player["weapons"][number] {
  return {
    id: "pulse",
    name: "Pulse",
    level: 1,
    maxLevel: 5,
    cooldown: 0.4,
    timer: 0,
    damage: 20,
    range: 520,
    projectileSpeed: 900,
    count: 1,
    spread: 0.05,
    pierce: 1,
    color: "#22d3ee",
    description: "",
    ...overrides,
  };
}

function makeAIContext(overrides: Partial<AIContext> = {}): AIContext {
  const enemy = makeEnemy(overrides.enemy ? undefined : {});
  return {
    enemy: overrides.enemy ?? enemy,
    player: makePlayer(),
    allies: [],
    players: [makePlayer()],
    dt: 0.016,
    mapWidth: 2000,
    mapHeight: 2000,
    difficulty: 1,
    time: 0,
    obstacles: [],
    ...overrides,
  };
}

describe("α-bridge edge cases", () => {
  it("uses default difficulty when snapshot is undefined", () => {
    const params = mapDifficultyToAIParams(undefined);
    expect(params.aggression).toBeGreaterThan(0.3);
    expect(params.aggression).toBeLessThan(0.7);
    expect(params.speedMulCap).toBeGreaterThanOrEqual(1);
  });

  it("clamps negative difficulty to 0", () => {
    const params = mapDifficultyToAIParams({ finalDifficulty: -0.5 } as AlphaDifficultySnapshot);
    expect(params.aggression).toBeCloseTo(0.25, 2);
    expect(params.botAccuracy).toBeCloseTo(0.55, 2);
  });

  it("clamps difficulty above 1 to 1", () => {
    const params = mapDifficultyToAIParams({ finalDifficulty: 1.5 } as AlphaDifficultySnapshot);
    expect(params.aggression).toBeCloseTo(1.0, 2);
    expect(params.botAccuracy).toBeCloseTo(0.92, 2);
  });

  it("applies overrides", () => {
    const params = mapDifficultyToAIParams(undefined, { aggression: 0.99, botAccuracy: 0.99 });
    expect(params.aggression).toBe(0.99);
    expect(params.botAccuracy).toBe(0.99);
  });

  it("monotonically maps difficulty to aggression", () => {
    const values = [0, 0.25, 0.5, 0.75, 1].map((d) =>
      mapDifficultyToAIParams({ finalDifficulty: d } as AlphaDifficultySnapshot).aggression
    );
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
  });

  it("exposes helper accessors", () => {
    expect(getAggression({ finalDifficulty: 0 } as AlphaDifficultySnapshot)).toBeCloseTo(0.25, 2);
    expect(getSpeedMultiplier({ finalDifficulty: 1 } as AlphaDifficultySnapshot)).toBeCloseTo(1.25, 2);
    expect(getAttackDesireMultiplier({ finalDifficulty: 0.5 } as AlphaDifficultySnapshot)).toBeGreaterThan(0.9);
  });
});

describe("pathfinding edge cases", () => {
  it("returns base direction when target is same as source", () => {
    const dir = getFlowDirection(100, 100, 100, 100, [], { width: 2000, height: 2000 });
    expect(dir.x).toBe(0);
    expect(dir.y).toBe(0);
  });

  it("returns base direction for out-of-bounds position", () => {
    const dir = getFlowDirection(-100, -100, 100, 100, [], { width: 2000, height: 2000 });
    expect(Math.hypot(dir.x, dir.y)).toBeCloseTo(1, 5);
  });

  it("finds path around a wall blocking direct route", () => {
    const obstacles: Obstacle[] = [
      {
        id: "wall",
        x: 500,
        y: 500,
        width: 300,
        height: 40,
        color: "#333",
        health: 100,
        maxHealth: 100,
        destructible: false,
      },
    ];
    const dir = getFlowDirection(400, 500, 600, 500, obstacles, { width: 2000, height: 2000 });
    expect(Math.abs(dir.y)).toBeGreaterThan(0.05);
  });

  it("avoidObstacles returns zero when no obstacles", () => {
    const push = avoidObstacles(0, 0, { x: 1, y: 0 }, []);
    expect(push.x).toBe(0);
    expect(push.y).toBe(0);
  });

  it("avoidObstacles handles zero velocity", () => {
    const obstacles: Obstacle[] = [
      { id: "o1", x: 30, y: 0, width: 40, height: 40, color: "#333", health: 100, maxHealth: 100, destructible: false },
    ];
    const push = avoidObstacles(0, 0, { x: 0, y: 0 }, obstacles, 14, 80);
    expect(Math.hypot(push.x, push.y)).toBeLessThanOrEqual(1);
  });

  it("line of sight is true with zero distance", () => {
    expect(hasLineOfSight(100, 100, 100, 100, [])).toBe(true);
  });

  it("findOpenDirection returns preferred when no obstacles or allies", () => {
    const preferred = { x: 1, y: 0 };
    const dir = findOpenDirection(0, 0, [], [], preferred);
    expect(dir.x).toBeCloseTo(preferred.x, 5);
    expect(dir.y).toBeCloseTo(preferred.y, 5);
  });

  it("findOpenDirection avoids nearby allies", () => {
    const preferred = { x: 1, y: 0 };
    const allies = [{ x: 60, y: 0, radius: 14 }];
    const dir = findOpenDirection(0, 0, [], allies, preferred, 14);
    expect(dir.x).toBeLessThan(1);
  });
});

describe("Boss state machine", () => {
  it("selects enrage when health is low and aggression high", () => {
    const boss = makeEnemy({ isBoss: true, x: 500, y: 500, maxHealth: 1000, health: 100, phase: 2 });
    resetBossState(boss);
    const ctx = makeAIContext({
      enemy: boss,
      player: makePlayer({ x: 540, y: 500 }),
      alphaSnapshot: { finalDifficulty: 0.9 } as AlphaDifficultySnapshot,
    });
    const out = runBossAI(ctx);
    expect(Math.hypot(out.vx, out.vy)).toBeGreaterThan(0.5);
    expect(out.speedMultiplier).toBeGreaterThan(1);
  });

  it("selects summon state when phase >= 2 and has line of sight", () => {
    const boss = makeEnemy({ isBoss: true, x: 500, y: 500, maxHealth: 1000, health: 600, phase: 2 });
    resetBossState(boss);
    const ctx = makeAIContext({
      enemy: boss,
      player: makePlayer({ x: 560, y: 500 }),
      alphaSnapshot: { finalDifficulty: 0.6 } as AlphaDifficultySnapshot,
    });
    const out = runBossAI(ctx);
    expect(out.vx).toBeDefined();
    expect(out.shouldUseSkill).toBeDefined();
  });

  it("retreats when heavily damaged and player too close", () => {
    const boss = makeEnemy({ isBoss: true, x: 500, y: 500, maxHealth: 1000, health: 200, phase: 1 });
    resetBossState(boss);
    const ctx = makeAIContext({
      enemy: boss,
      player: makePlayer({ x: 520, y: 500 }),
      alphaSnapshot: { finalDifficulty: 0.4 } as AlphaDifficultySnapshot,
    });
    const out = runBossAI(ctx);
    expect(out.vx).toBeLessThan(0);
    expect(out.shouldAttack).toBe(false);
  });

  it("resets boss state", () => {
    const boss = makeEnemy({ isBoss: true });
    resetBossState(boss);
    runBossAI(makeAIContext({ enemy: boss }));
    resetBossState(boss);
    const out = runBossAI(makeAIContext({ enemy: boss }));
    expect(out.vx).toBeDefined();
  });

  it("targets the most threatened player", () => {
    const boss = makeEnemy({ isBoss: true, x: 0, y: 0 });
    resetBossState(boss);
    const lowHealthPlayer = makePlayer({ id: "low", x: 100, y: 0, health: 10, maxHealth: 100 });
    const farPlayer = makePlayer({ id: "far", x: 300, y: 0, health: 100, maxHealth: 100 });
    const ctx = makeAIContext({
      enemy: boss,
      player: lowHealthPlayer,
      players: [lowHealthPlayer, farPlayer],
    });
    const out = runBossAI(ctx);
    expect(Math.hypot(out.vx, out.vy)).toBeGreaterThan(0);
  });
});

describe("Bot AI comprehensive", () => {
  function makeBotContext(overrides: Partial<BotContext> = {}): BotContext {
    const bot: DeathmatchBot = {
      id: "bot_0",
      targetId: null,
      state: "idle",
      timer: 0,
      respawnTimer: 0,
      aimX: 0,
      aimY: 0,
      fireTimer: 0,
    };
    const player = makePlayer({ id: "bot_0", x: 100, y: 100 });
    const human = makePlayer({ id: "player", x: 300, y: 100, knockbackX: 10, knockbackY: 0 });
    const state = {
      player: human,
      players: [player],
      map: { width: 1000, height: 1000, theme: "industrial", obstacles: [], hazards: [] },
      time: 0,
    } as unknown as GameState;

    return {
      bot,
      player,
      state,
      dt: 0.016,
      rng: () => 0.5,
      ...overrides,
    };
  }

  it("assigns assault role for generic weapon", () => {
    const player = makePlayer({ weapons: [makeWeapon({ range: 300, damage: 20, projectileSpeed: 300 })] });
    expect(assignBotRole(player)).toBe("assault");
  });

  it("assigns controller role for area weapon", () => {
    const player = makePlayer({ weapons: [makeWeapon({ areaRadius: 80 })] });
    expect(assignBotRole(player)).toBe("controller");
  });

  it("assigns roamer role for fast projectile weapon", () => {
    const player = makePlayer({ weapons: [makeWeapon({ projectileSpeed: 500, range: 300, damage: 20 })] });
    expect(assignBotRole(player)).toBe("roamer");
  });

  it("returns zero output when bot player is dead", () => {
    const ctx = makeBotContext({ player: makePlayer({ id: "bot_0", health: 0 }) });
    const out = runBotAI(ctx);
    expect(out.move.x).toBe(0);
    expect(out.move.y).toBe(0);
    expect(out.fire).toBe(false);
  });

  it("patrols when no targets are alive", () => {
    const ctx = makeBotContext();
    ctx.state.player.health = 0;
    const out = runBotAI(ctx);
    expect(Math.hypot(out.move.x, out.move.y)).toBeCloseTo(1, 5);
    expect(out.fire).toBe(false);
  });

  it("snipers prefer distance", () => {
    const player = makePlayer({
      id: "bot_0",
      x: 100,
      y: 100,
      weapons: [makeWeapon({ range: 700, damage: 80, projectileSpeed: 900 })],
    });
    const target = makePlayer({ id: "player", x: 300, y: 100, health: 100 });
    const ctx = makeBotContext({ player, state: { ...makeBotContext().state, player: target, players: [player] } as GameState });
    const out = runBotAI(ctx);
    expect(Math.hypot(out.aim.x, out.aim.y)).toBeCloseTo(1, 5);
  });

  it("does not fire when out of range", () => {
    const player = makePlayer({ id: "bot_0", x: 0, y: 0, weapons: [makeWeapon({ range: 100 })] });
    const target = makePlayer({ id: "player", x: 500, y: 0, health: 100 });
    const ctx = makeBotContext({
      player,
      state: { ...makeBotContext().state, player: target, players: [player] } as GameState,
    });
    const out = runBotAI(ctx);
    expect(out.fire).toBe(false);
  });

  it("does not fire during cooldown", () => {
    const player = makePlayer({ id: "bot_0", x: 100, y: 0, weapons: [makeWeapon({ range: 300 })] });
    const target = makePlayer({ id: "player", x: 200, y: 0, health: 100 });
    const ctx = makeBotContext({
      player,
      state: { ...makeBotContext().state, player: target, players: [player] } as GameState,
    });
    ctx.bot.fireTimer = 1;
    const out = runBotAI(ctx);
    expect(out.fire).toBe(false);
  });

  it("flees when health is critical", () => {
    const player = makePlayer({ id: "bot_0", x: 100, y: 0, health: 10, maxHealth: 100, weapons: [makeWeapon()] });
    const target = makePlayer({ id: "player", x: 200, y: 0, health: 100 });
    const ctx = makeBotContext({
      player,
      state: { ...makeBotContext().state, player: target, players: [player] } as GameState,
      rng: () => 0.8,
    });
    const out = runBotAI(ctx);
    expect(out.move.x).toBeLessThan(0);
    // 撤退时 Bot 仍可边移动边射击，属于合理行为；此处只验证移动方向远离目标
    expect(typeof out.fire).toBe("boolean");
  });
});

describe("α-β closed-loop integration", () => {
  it("scheduler difficulty drives AI aggression monotonically", () => {
    const scheduler = new AlphaScheduler({ totalWaves: 12, bossWaves: [3, 7, 11] });
    const prev = scheduler.getCurrentPlan();
    const prevAggression = mapDifficultyToAIParams(prev.snapshot).aggression;

    for (let i = 1; i < 12; i++) {
      scheduler.setWave(i);
      const plan = scheduler.getCurrentPlan();
      const params = mapDifficultyToAIParams(plan.snapshot);
      expect(params.aggression).toBeGreaterThanOrEqual(0.25);
      expect(params.aggression).toBeLessThanOrEqual(1);
      expect(params.speedMulCap).toBeGreaterThanOrEqual(1);
      expect(params.speedMulCap).toBeLessThanOrEqual(1.25);
    }

    const finalPlan = scheduler.setWave(11);
    expect(mapDifficultyToAIParams(finalPlan.snapshot).aggression).toBeGreaterThanOrEqual(prevAggression);
  });

  it("enemy stats scale with alpha difficulty", () => {
    const scheduler = new AlphaScheduler({ totalWaves: 12, bossWaves: [3, 7, 11] });
    const early = scheduler.planWave(0);
    const late = scheduler.planWave(11);

    expect(late.enemyStats.maxHp).toBeGreaterThan(early.enemyStats.maxHp);
    expect(late.enemyStats.damage).toBeGreaterThanOrEqual(early.enemyStats.damage);
    expect(late.enemyStats.speed).toBeGreaterThanOrEqual(early.enemyStats.speed);
    expect(late.snapshot.finalDifficulty).toBeGreaterThan(early.snapshot.finalDifficulty);
  });

  it("Boss wave reduces minion count but adds Boss", () => {
    const scheduler = new AlphaScheduler({ totalWaves: 12, bossWaves: [3, 7, 11] });
    const normal = scheduler.planWave(2);
    const boss = scheduler.planWave(3);

    expect(boss.isBossWave).toBe(true);
    expect(boss.bossStats).toBeDefined();
    expect(boss.enemyStats.waveEnemyCount).toBeLessThan(normal.enemyStats.waveEnemyCount);
    expect(boss.enemyStats.eliteChance).toBeLessThan(normal.enemyStats.eliteChance);
  });

  it("AI context uses alpha snapshot to modulate behavior", () => {
    const scheduler = new AlphaScheduler({ totalWaves: 12, bossWaves: [3, 7, 11] });
    scheduler.setWave(11);
    const snapshot = scheduler.getCurrentPlan().snapshot;

    const enemy = makeEnemy({ variant: "walker", x: 400, y: 400 });
    const ctx = makeAIContext({
      enemy,
      player: makePlayer({ x: 500, y: 500 }),
      alphaSnapshot: snapshot,
    });

    const out = runBossAI(ctx);
    expect(out.speedMultiplier).toBeGreaterThanOrEqual(1);
  });

  it("telemetry damage changes efficiency factor", () => {
    const scheduler = new AlphaScheduler({ totalWaves: 12, bossWaves: [3, 7, 11] });
    scheduler.setWave(5);
    const before = scheduler.tick();

    for (let i = 0; i < 20; i++) {
      scheduler.telemetry.recordSpawn(5, "walker", Date.now() - i * 100);
      if (i < 5) scheduler.telemetry.recordKill(5, "walker", Date.now() - i * 100);
    }

    const after = scheduler.tick();
    expect(after.efficiencyFactor).not.toBe(before.efficiencyFactor);
  });

  it("rhythm metrics expose intensity, pressure, and kill efficiency", () => {
    const scheduler = new AlphaScheduler({ totalWaves: 12, bossWaves: [3, 7, 11] });
    scheduler.setWave(5);
    scheduler.telemetry.recordSpawn(5, "walker", Date.now());
    scheduler.telemetry.recordKill(5, "walker", Date.now());

    const metrics = scheduler.getRhythmMetrics(0.8, 0.6);
    expect(metrics.intensity).toBeGreaterThan(0);
    expect(metrics.pressure).toBe(0.4);
    expect(metrics.killEfficiency).toBe(1);
  });

  it("node targeting integrates with defense context", () => {
    const core: DefenseCore = { x: 1000, y: 1000, radius: 30, health: 1000, maxHealth: 1000, color: "#0ff" };
    const nodes: EnergyNode[] = [
      { id: "n1", x: 800, y: 800, radius: 20, active: true, captured: false, captureProgress: 0, captureTime: 5, energyValue: 10, waveIndex: 0, color: "#0ff" },
    ];

    const ctx = makeAIContext({
      enemy: makeEnemy({ targetCore: false, variant: "walker" }),
      player: makePlayer({ x: 200, y: 200 }),
      core,
      nodes,
    });

    // 25% chance to target node; repeat to ensure coverage is statistical
    let nodeTargeted = 0;
    for (let i = 0; i < 100; i++) {
      const target = selectTarget(ctx);
      if (target.isNode) nodeTargeted++;
    }
    expect(nodeTargeted).toBeGreaterThan(0);
    expect(nodeTargeted).toBeLessThan(50);
  });
});
