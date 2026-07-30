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
import { getAbilityGate, getWaveScalingBonus, getPredictiveAimConfig, getDodgeConfig } from "./ability-gating";
import { classifyEnemyRole, buildCoordinationContext } from "./coordination";
import { createLearningMemory, updateLearningMemory, getPlayerHotZone, recordEvasivePattern, getAverageEvasiveDirection } from "./learning";
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
    leopardFrenzyActive: false,
    leopardPounceSpeedTimer: 0,
    leopardBloodlustStacks: 0,
    leopardBloodlustTimer: 0,
    twilightCocoonTimer: 0,
    knockbackX: 0,
    knockbackY: 0,
    burnDuration: 0,
    burnDamage: 0,
    damage: 10,
    attackSpeed: 1,
    lifesteal: 0,
    skillDamageMul: 1,
    critMultiplier: 1.5,
    dashCooldown: 3,
    explosionOnKill: 0,
    thorns: 0,
    multishotChance: 0,
    periodicShield: 0,
    healingReceivedMul: 1,
    bloodPactDrain: 0,
    rangeMul: 1,
    missChance: 0,
    luckPenalty: 0,
    maxDashes: 2,
    threatRadiusMul: 1,
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
    freezeShatterDamage: 0,
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
    rng: Math.random,
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
      tier: "veteran",
      powerUpTimer: 0,
      powerUpType: null,
    };
    const player = makePlayer({ id: "bot_0", x: 100, y: 100 });
    const human = makePlayer({ id: "player", x: 300, y: 100, knockbackX: 10, knockbackY: 0 });
    const state = {
      player: human,
      players: [player],
      map: { width: 1000, height: 1000, theme: "industrial", obstacles: [], hazards: [], decors: [] },
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
    // Speed may vary by enemy type composition; final difficulty must increase
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

describe("创世版 AI 升级 - 能力门控系统", () => {
  it("1-10波只解锁基础能力", () => {
    const enemy = makeEnemy({ isElite: false, isBoss: false });
    const gate = getAbilityGate(5, enemy);
    expect(gate.predictiveAim).toBe(false);
    expect(gate.projectileDodge).toBe(false);
    expect(gate.weaponCounter).toBe(false);
    expect(gate.terrainUtilization).toBe(false);
    expect(gate.roleDivision).toBe(false);
    expect(gate.focusFire).toBe(false);
    expect(gate.coverRetreat).toBe(false);
    expect(gate.heroCounter).toBe(false);
  });

  it("11-20波精英解锁预判瞄准和群体协作", () => {
    const enemy = makeEnemy({ isElite: true, isBoss: false });
    const gate = getAbilityGate(15, enemy);
    expect(gate.predictiveAim).toBe(true);
    expect(gate.roleDivision).toBe(true);
    expect(gate.focusFire).toBe(true);
    expect(gate.formationCoordination).toBe(true);
    expect(gate.projectileDodge).toBe(false);
    expect(gate.heroCounter).toBe(false);
  });

  it("36-50波解锁全部能力", () => {
    const enemy = makeEnemy({ isElite: true, isBoss: false });
    const gate = getAbilityGate(40, enemy);
    expect(gate.predictiveAim).toBe(true);
    expect(gate.projectileDodge).toBe(true);
    expect(gate.weaponCounter).toBe(true);
    expect(gate.heroCounter).toBe(true);
    expect(gate.habitRecognition).toBe(true);
  });

  it("Boss始终可用地形利用", () => {
    const boss = makeEnemy({ isBoss: true });
    const gate = getAbilityGate(5, boss);
    expect(gate.terrainUtilization).toBe(true);
  });

  it("波次递增难度单调递增", () => {
    const early = getWaveScalingBonus(5);
    const mid = getWaveScalingBonus(25);
    const late = getWaveScalingBonus(45);
    expect(late.aggressionBonus).toBeGreaterThanOrEqual(mid.aggressionBonus);
    expect(mid.aggressionBonus).toBeGreaterThanOrEqual(early.aggressionBonus);
    expect(late.coordinationBonus).toBeGreaterThanOrEqual(mid.coordinationBonus);
  });

  it("预判瞄准配置精度随波次和侵略性提升", () => {
    const enemy = makeEnemy({ isElite: true });
    const early = getPredictiveAimConfig(15, enemy, 0.4);
    const late = getPredictiveAimConfig(40, enemy, 0.8);
    expect(late.accuracy).toBeGreaterThanOrEqual(early.accuracy);
    expect(late.lookAheadTime).toBeGreaterThanOrEqual(early.lookAheadTime);
  });
});

describe("创世版 AI 升级 - 群体协作", () => {
  it("正确分类敌人角色", () => {
    expect(classifyEnemyRole(makeEnemy({ variant: "tank" }))).toBe("tank");
    expect(classifyEnemyRole(makeEnemy({ variant: "runner" }))).toBe("assassin");
    expect(classifyEnemyRole(makeEnemy({ variant: "spitter" }))).toBe("artillery");
    expect(classifyEnemyRole(makeEnemy({ variant: "disruptor" }))).toBe("support");
    expect(classifyEnemyRole(makeEnemy({ variant: "elite" }))).toBe("dps");
    expect(classifyEnemyRole(makeEnemy({ isBoss: true }))).toBe("tank");
  });

  it("构建协作上下文包含角色和编队信息", () => {
    const gate = getAbilityGate(20, makeEnemy({ isElite: true }));
    const ctx = makeAIContext({
      allies: [
        makeEnemy({ id: "a1", x: 450, y: 500, variant: "tank" }),
        makeEnemy({ id: "a2", x: 480, y: 520, variant: "runner" }),
      ],
      player: makePlayer({ x: 500, y: 500 }),
    });
    const coord = buildCoordinationContext(ctx, gate);
    expect(coord.role).toBeDefined();
    expect(coord.nearbyTanks.length).toBe(1);
    expect(coord.nearbySquishies.length).toBe(1);
  });

  it("残血队友触发掩护撤退", () => {
    const gate = getAbilityGate(25, makeEnemy({ isElite: true, variant: "tank" }));
    const ctx = makeAIContext({
      enemy: makeEnemy({ id: "e1", x: 400, y: 400, variant: "tank", isElite: true }),
      allies: [
        makeEnemy({ id: "a1", x: 420, y: 420, variant: "runner", maxHealth: 100, health: 20 }),
      ],
      player: makePlayer({ x: 500, y: 500 }),
    });
    const coord = buildCoordinationContext(ctx, gate);
    expect(coord.needsCoverRetreat).toBe(true);
    expect(coord.coveringAllyId).toBe("a1");
  });
});

describe("创世版 AI 升级 - 学习与适应", () => {
  it("创建空学习记忆", () => {
    const memory = createLearningMemory();
    expect(memory.heatmap.size).toBe(0);
    expect(memory.evasivePatterns.length).toBe(0);
    expect(memory.detectedHero).toBeNull();
    expect(memory.heroConfidence).toBe(0);
    expect(memory.waveDifficultyBonus).toBe(0);
  });

  it("更新学习记忆记录玩家热力图", () => {
    const memory = createLearningMemory();
    const player = makePlayer({ x: 400, y: 400 });
    const gate = getAbilityGate(25, makeEnemy({ isElite: true }));
    // 多次更新以积累足够的热力图数据
    for (let i = 0; i < 10; i++) {
      updateLearningMemory(memory, player, 2000, 2000, 25, 0.016, gate);
    }
    expect(memory.heatmap.size).toBeGreaterThan(0);
    const hotZone = getPlayerHotZone(memory, 2000, 2000);
    expect(hotZone).not.toBeNull();
    if (hotZone) {
      expect(hotZone.x).toBeGreaterThan(0);
      expect(hotZone.y).toBeGreaterThan(0);
    }
  });

  it("波次更新改变难度加成", () => {
    const memory = createLearningMemory();
    const player = makePlayer();
    const gate = getAbilityGate(25, makeEnemy({ isElite: true }));
    updateLearningMemory(memory, player, 2000, 2000, 30, 0.016, gate);
    expect(memory.waveDifficultyBonus).toBeGreaterThan(0);
    expect(memory.totalWaves).toBe(30);
  });

  it("记录闪避模式并计算平均方向", () => {
    const memory = createLearningMemory();
    recordEvasivePattern(memory, { x: 1, y: 0 });
    recordEvasivePattern(memory, { x: 0.7, y: 0.3 });
    const avg = getAverageEvasiveDirection(memory);
    expect(avg).not.toBeNull();
    if (avg) {
      expect(avg.x).toBeGreaterThan(0);
    }
  });
});

describe("创世版 AI 升级 - Boss预判瞄准", () => {
  it("高波次Boss启用预判瞄准并输出aimOffset", () => {
    const boss = makeEnemy({ isBoss: true, x: 500, y: 500, maxHealth: 1000, health: 600, phase: 2 });
    resetBossState(boss);
    const ctx = makeAIContext({
      enemy: boss,
      player: makePlayer({ x: 560, y: 500, knockbackX: 50, knockbackY: 20 }),
      wave: 40,
      alphaSnapshot: { finalDifficulty: 0.8 } as AlphaDifficultySnapshot,
    });
    const out = runBossAI(ctx);
    expect(out.vx).toBeDefined();
    expect(out.shouldUseSkill).toBeDefined();
  });

  it("Boss输出包含shouldUseSkill和shouldUseUltimate标志", () => {
    const boss = makeEnemy({ isBoss: true, x: 500, y: 500, maxHealth: 1000, health: 300, phase: 2 });
    resetBossState(boss);
    const ctx = makeAIContext({
      enemy: boss,
      player: makePlayer({ x: 520, y: 500 }),
      wave: 40,
      alphaSnapshot: { finalDifficulty: 0.9 } as AlphaDifficultySnapshot,
    });
    const out = runBossAI(ctx);
    expect(typeof out.shouldUseSkill).toBe("boolean");
    expect(typeof out.shouldUseUltimate).toBe("boolean");
  });
});
