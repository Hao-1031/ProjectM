import { describe, it, expect } from "vitest";
import type { Enemy, Player, Obstacle } from "./types";
import {
  aiChase,
  aiKeepDistance,
  aiFlank,
  aiCharge,
  aiRetreat,
  aiOrbit,
  aiAmbush,
  aiSwarm,
  aiSurround,
  runEnemyAI,
  runBossAI,
  selectBehavior,
  selectTarget,
  avoidObstacles,
  getFlowDirection,
  hasLineOfSight,
  assignBotRole,
  runBotAI,
  mapDifficultyToAIParams,
} from "./ai";
import type { AIContext } from "./ai";

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

function makeContext(overrides: Partial<AIContext> = {}): AIContext {
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

describe("α-bridge", () => {
  it("maps low difficulty to low aggression", () => {
    const params = mapDifficultyToAIParams({
      waveIndex: 0,
      totalWaves: 12,
      baseDifficulty: 0.1,
      efficiencyFactor: 1,
      counterFactor: 1,
      finalDifficulty: 0.1,
    });
    expect(params.aggression).toBeLessThan(0.4);
    expect(params.botAccuracy).toBeLessThan(0.7);
  });

  it("maps high difficulty to high aggression", () => {
    const params = mapDifficultyToAIParams({
      waveIndex: 11,
      totalWaves: 12,
      baseDifficulty: 0.95,
      efficiencyFactor: 1,
      counterFactor: 1,
      finalDifficulty: 0.95,
    });
    expect(params.aggression).toBeGreaterThan(0.8);
    expect(params.botAccuracy).toBeGreaterThan(0.85);
  });
});

describe("pathfinding", () => {
  it("returns direction toward target when no obstacles", () => {
    const dir = getFlowDirection(0, 0, 100, 0, [], { width: 2000, height: 2000 });
    expect(dir.x).toBeGreaterThan(0.9);
    expect(Math.abs(dir.y)).toBeLessThan(0.1);
  });

  it("avoids obstacle blocking the direct path", () => {
    const obstacles: Obstacle[] = [{ id: "o1", x: 50, y: 0, width: 40, height: 40, color: "#333", health: 100, maxHealth: 100, destructible: false }];
    const dir = getFlowDirection(0, 0, 100, 0, obstacles, { width: 2000, height: 2000 });
    expect(Math.abs(dir.y)).toBeGreaterThan(0.1);
  });

  it("reports blocked line of sight", () => {
    const obstacles: Obstacle[] = [{ id: "o1", x: 50, y: 0, width: 20, height: 20, color: "#333", health: 100, maxHealth: 100, destructible: false }];
    expect(hasLineOfSight(0, 0, 100, 0, obstacles)).toBe(false);
  });

  it("reports clear line of sight", () => {
    expect(hasLineOfSight(0, 0, 100, 0, [])).toBe(true);
  });

  it("avoids obstacles with lateral push", () => {
    const obstacles: Obstacle[] = [{ id: "o1", x: 30, y: 0, width: 40, height: 40, color: "#333", health: 100, maxHealth: 100, destructible: false }];
    const push = avoidObstacles(0, 0, { x: 1, y: 0 }, obstacles, 14, 80);
    expect(Math.abs(push.y)).toBeGreaterThan(0);
  });
});

describe("behavior selection", () => {
  it("selects chase for walker", () => {
    const ctx = makeContext();
    const params = mapDifficultyToAIParams();
    expect(selectBehavior(ctx, params)).toBe("chase");
  });

  it("selects keep_distance for spitter", () => {
    const ctx = makeContext({ enemy: makeEnemy({ variant: "spitter" }) });
    const params = mapDifficultyToAIParams();
    expect(selectBehavior(ctx, params)).toBe("keep_distance");
  });

  it("selects charge for tank", () => {
    const ctx = makeContext({ enemy: makeEnemy({ variant: "tank" }) });
    const params = mapDifficultyToAIParams();
    expect(selectBehavior(ctx, params)).toBe("charge");
  });

  it("selects flank for runner", () => {
    const ctx = makeContext({ enemy: makeEnemy({ variant: "runner" }) });
    const params = mapDifficultyToAIParams();
    expect(selectBehavior(ctx, params)).toBe("flank");
  });

  it("selects orbit for boss", () => {
    const ctx = makeContext({ enemy: makeEnemy({ isBoss: true }) });
    const params = mapDifficultyToAIParams();
    expect(selectBehavior(ctx, params)).toBe("orbit");
  });

  it("selects retreat when heavily damaged and low aggression", () => {
    const ctx = makeContext({ enemy: makeEnemy({ health: 10, maxHealth: 100 }) });
    const params = mapDifficultyToAIParams({ finalDifficulty: 0.1 } as Parameters<typeof mapDifficultyToAIParams>[0]);
    expect(selectBehavior(ctx, params)).toBe("retreat");
  });
});

describe("target selection", () => {
  it("selects core when enemy targets core", () => {
    const core = { x: 100, y: 100, radius: 30, health: 1000, maxHealth: 1000, color: "#0ff" };
    const ctx = makeContext({
      enemy: makeEnemy({ targetCore: true }),
      player: makePlayer({ x: 500, y: 500 }),
      core,
    });
    const target = selectTarget(ctx);
    expect(target.x).toBe(core.x);
    expect(target.y).toBe(core.y);
  });

  it("selects player by default", () => {
    const ctx = makeContext({ player: makePlayer({ x: 600, y: 600 }) });
    const target = selectTarget(ctx);
    expect(target.x).toBe(600);
    expect(target.y).toBe(600);
  });
});

describe("steering outputs", () => {
  it("chase moves toward player", () => {
    const ctx = makeContext({ enemy: makeEnemy({ x: 400, y: 500 }), player: makePlayer({ x: 500, y: 500 }) });
    const result = aiChase(ctx, ctx.player);
    expect(result.vx).toBeGreaterThan(0.9);
  });

  it("keep_distance backs away when too close", () => {
    const enemy = makeEnemy({ x: 490, y: 500 });
    const ctx = makeContext({ enemy, player: makePlayer({ x: 500, y: 500 }) });
    const result = aiKeepDistance(ctx, ctx.player, 200);
    expect(result.vx).toBeLessThan(0);
  });

  it("flank produces non-zero lateral movement", () => {
    const ctx = makeContext({ enemy: makeEnemy({ x: 300, y: 500 }), player: makePlayer({ x: 500, y: 500 }) });
    const result = aiFlank(ctx, ctx.player);
    expect(Math.abs(result.vx) + Math.abs(result.vy)).toBeGreaterThan(0);
  });

  it("charge returns speed multiplier", () => {
    const ctx = makeContext({ enemy: makeEnemy({ x: 400, y: 500 }), player: makePlayer({ x: 500, y: 500 }) });
    const result = aiCharge(ctx, ctx.player);
    expect(result.speedMultiplier).toBeGreaterThan(1);
    expect(result.shouldAttack).toBe(true);
  });

  it("retreat moves away from target", () => {
    const ctx = makeContext({ enemy: makeEnemy({ x: 490, y: 500 }), player: makePlayer({ x: 500, y: 500 }) });
    const result = aiRetreat(ctx, ctx.player);
    expect(result.vx).toBeLessThan(0);
    expect(result.shouldAttack).toBe(false);
  });

  it("orbit returns tangent direction", () => {
    const ctx = makeContext({ enemy: makeEnemy({ x: 500, y: 300 }), player: makePlayer({ x: 500, y: 500 }) });
    const result = aiOrbit(ctx, ctx.player, 200);
    expect(Math.abs(result.vx) + Math.abs(result.vy)).toBeGreaterThan(0.5);
  });

  it("ambush returns movement when close", () => {
    const ctx = makeContext({ enemy: makeEnemy({ x: 490, y: 500 }), player: makePlayer({ x: 500, y: 500 }) });
    const result = aiAmbush(ctx, ctx.player);
    expect(Math.abs(result.vx) + Math.abs(result.vy)).toBeGreaterThan(0);
  });

  it("swarm delegates to surround", () => {
    const ctx = makeContext({ enemy: makeEnemy({ x: 400, y: 500 }), player: makePlayer({ x: 500, y: 500 }) });
    const result = aiSwarm(ctx, ctx.player);
    expect(Math.abs(result.vx) + Math.abs(result.vy)).toBeGreaterThan(0);
  });

  it("surround distributes around target", () => {
    const ctx = makeContext({ enemy: makeEnemy({ x: 400, y: 500 }), player: makePlayer({ x: 500, y: 500 }) });
    const result = aiSurround(ctx, ctx.player);
    expect(Math.abs(result.vx) + Math.abs(result.vy)).toBeGreaterThan(0);
  });
});

describe("runEnemyAI", () => {
  it("returns normalized velocity", () => {
    const ctx = makeContext({ enemy: makeEnemy({ x: 400, y: 400 }), player: makePlayer({ x: 500, y: 500 }) });
    const result = runEnemyAI(ctx);
    expect(Math.abs(result.vx) + Math.abs(result.vy)).toBeGreaterThan(0);
    expect(result.shouldAttack).toBe(true);
  });

  it("keeps spitters at range", () => {
    const ctx = makeContext({
      enemy: makeEnemy({ variant: "spitter", x: 490, y: 500 }),
      player: makePlayer({ x: 500, y: 500 }),
    });
    const result = runEnemyAI(ctx);
    expect(result.vx).toBeLessThan(0);
  });
});

describe("runBossAI", () => {
  it("returns steering for boss", () => {
    const boss = makeEnemy({ isBoss: true, variant: "overlord", x: 400, y: 400, maxHealth: 1000, health: 800 });
    const ctx = makeContext({ enemy: boss, player: makePlayer({ x: 500, y: 500 }) });
    const result = runBossAI(ctx);
    expect(result.vx).toBeDefined();
    expect(result.vy).toBeDefined();
  });

  it("triggers skill/ultimate flags", () => {
    const boss = makeEnemy({ isBoss: true, variant: "overlord", x: 500, y: 500, phase: 2 });
    const ctx = makeContext({ enemy: boss, player: makePlayer({ x: 500, y: 500 }), time: 100 });
    const result = runBossAI(ctx);
    expect(typeof result.shouldUseSkill).toBe("boolean");
    expect(typeof result.shouldUseUltimate).toBe("boolean");
  });
});

describe("bot-ai", () => {
  it("assigns sniper role for long range high damage weapon", () => {
    const player = makePlayer({
      weapons: [
        {
          id: "railgun",
          name: "Railgun",
          level: 1,
          maxLevel: 5,
          cooldown: 1.2,
          timer: 0,
          damage: 80,
          range: 700,
          projectileSpeed: 900,
          count: 1,
          spread: 0,
          pierce: 3,
          color: "#0ff",
          description: "",
        } as Player["weapons"][number],
      ],
    });
    expect(assignBotRole(player)).toBe("sniper");
  });

  it("runBotAI returns valid output", () => {
    const bot: import("./types").DeathmatchBot = {
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
    const human = makePlayer({ id: "player", x: 200, y: 100 });
    const state = {
      player: human,
      players: [player],
      map: { width: 1000, height: 1000, theme: "industrial", obstacles: [], hazards: [] },
      time: 0,
    } as unknown as import("./types").GameState;

    const output = runBotAI({ bot, player, state, dt: 0.016, rng: () => 0.5 });
    expect(Math.abs(output.move.x) + Math.abs(output.move.y)).toBeGreaterThan(0);
    expect(Math.abs(output.aim.x) + Math.abs(output.aim.y)).toBeGreaterThan(0);
  });
});
