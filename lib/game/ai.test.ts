import { describe, it, expect } from "vitest";
import type { Enemy, Player } from "./types";
import {
  getPreferredBehavior,
  computeSeparation,
  computeAlignment,
  computeCohesion,
  aiChase,
  aiKeepDistance,
  aiFlank,
  aiCharge,
  aiRetreat,
  aiOrbit,
  aiAmbush,
  aiSwarm,
  aiSurround,
  selectBestPlayer,
  createBossBehaviorTree,
  runBossAI,
  predictPlayerPosition,
  findWeakestPlayer,
  computeGroupCentroid,
  avoidObstacles,
  updateEnemyFacing,
  setAnimationFromMovement,
} from "./ai";

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
    isElite: false,
    isBoss: false,
    affixes: [],
    attackTimer: 0,
    attackCooldown: 1,
    knockbackX: 0,
    knockbackY: 0,
    burnDuration: 0,
    phase: 0,
    phaseThresholds: [],
    facing: 0,
    animation: "idle",
    animationTimer: 0,
    ...overrides,
  };
}

describe("ai behaviors", () => {
  it("selects chase for walkers", () => {
    expect(getPreferredBehavior(makeEnemy({ variant: "walker" }))).toBe("chase");
  });

  it("selects charge for runners", () => {
    expect(getPreferredBehavior(makeEnemy({ variant: "runner" }))).toBe("charge");
  });

  it("selects keep_distance for spitters", () => {
    expect(getPreferredBehavior(makeEnemy({ variant: "spitter" }))).toBe("keep_distance");
  });

  it("selects swarm for tanks", () => {
    expect(getPreferredBehavior(makeEnemy({ variant: "tank" }))).toBe("swarm");
  });

  it("selects orbit for boss phase 2", () => {
    expect(getPreferredBehavior(makeEnemy({ variant: "overlord", isBoss: true, phase: 2 }))).toBe(
      "orbit"
    );
  });
});

describe("flocking", () => {
  it("computes separation away from neighbors", () => {
    const enemy = makeEnemy({ x: 100, y: 100 });
    const neighbor = makeEnemy({ id: "e2", x: 110, y: 100 });
    const result = computeSeparation(enemy, [neighbor]);
    expect(result.x).toBeLessThan(0);
  });

  it("returns zero separation when no neighbors", () => {
    const result = computeSeparation(makeEnemy(), []);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it("computes alignment based on neighbor facings", () => {
    const a = makeEnemy({ id: "a", x: 0, y: 0, facing: 0 });
    const b = makeEnemy({ id: "b", x: 10, y: 0, facing: Math.PI / 2 });
    const result = computeAlignment(a, [b]);
    expect(result.y).toBeCloseTo(1);
  });

  it("computes cohesion toward neighbor centroid", () => {
    const a = makeEnemy({ id: "a", x: 0, y: 0 });
    const b = makeEnemy({ id: "b", x: 100, y: 0 });
    const result = computeCohesion(a, [b]);
    expect(result.x).toBeGreaterThan(0);
  });
});

describe("steering outputs", () => {
  function ctx(overrides: Partial<Parameters<typeof aiChase>[0]> = {}) {
    const enemy = makeEnemy();
    return {
      enemy,
      player: makePlayer(),
      allies: [enemy],
      enemies: [enemy],
      dt: 0.016,
      mapWidth: 2000,
      mapHeight: 2000,
      difficulty: 1,
      time: 0,
      ...overrides,
    };
  }

  it("chase moves enemy toward player", () => {
    const c = ctx();
    const beforeX = c.enemy.x;
    aiChase(c);
    expect(c.enemy.x).toBeGreaterThan(beforeX);
  });

  it("keep_distance maintains preferred range", () => {
    const enemy = makeEnemy({ x: 490, y: 500 });
    const c = ctx({ enemy, allies: [enemy] });
    const result = aiKeepDistance(c, 200);
    expect(result.shouldAttack).toBe(false);
    expect(c.enemy.x).toBeLessThan(490);
  });

  it("flank produces lateral offset target", () => {
    const enemy = makeEnemy({ x: 300, y: 500 });
    const c = ctx({ enemy, allies: [enemy] });
    aiFlank(c);
    expect(c.enemy.x).not.toBe(300);
  });

  it("charge accelerates when within range", () => {
    const enemy = makeEnemy({ x: 480, y: 500 });
    const c = ctx({ enemy, allies: [enemy] });
    const result = aiCharge(c);
    expect(result.shouldAttack || result.vx !== 0).toBe(true);
  });

  it("retreat moves away when damaged", () => {
    const enemy = makeEnemy({ x: 490, y: 500, health: 10 });
    const c = ctx({ enemy, allies: [enemy] });
    const beforeX = c.enemy.x;
    aiRetreat(c);
    expect(c.enemy.x).toBeLessThan(beforeX);
  });

  it("orbit circles around player", () => {
    const enemy = makeEnemy({ x: 500, y: 300 });
    const c = ctx({ enemy, allies: [enemy] });
    aiOrbit(c, 200);
    expect(c.enemy.x).not.toBe(500);
  });

  it("ambush rushes when close", () => {
    const enemy = makeEnemy({ x: 490, y: 500 });
    const c = ctx({ enemy, allies: [enemy] });
    const result = aiAmbush(c);
    expect(result.shouldAttack || result.vx !== 0).toBe(true);
  });

  it("swarm keeps group cohesion", () => {
    const enemy = makeEnemy({ x: 400, y: 500 });
    const ally = makeEnemy({ id: "a2", x: 410, y: 500 });
    const c = ctx({ enemy, allies: [enemy, ally] });
    aiSwarm(c);
    expect(c.enemy.x).toBeGreaterThan(400);
  });

  it("surround occupies a slot around player", () => {
    const enemy = makeEnemy({ x: 400, y: 500 });
    const c = ctx({ enemy, allies: [enemy] });
    aiSurround(c, 160);
    expect(c.enemy.x).toBeGreaterThan(400);
  });
});

describe("target selection", () => {
  it("selects nearest living player", () => {
    const enemy = makeEnemy();
    const near = makePlayer({ id: "near", x: 405, y: 400 });
    const far = makePlayer({ id: "far", x: 800, y: 800 });
    expect(selectBestPlayer(enemy, [near, far])?.id).toBe("near");
  });

  it("ignores dead players", () => {
    const enemy = makeEnemy();
    const dead = makePlayer({ id: "dead", health: 0 });
    const alive = makePlayer({ id: "alive", x: 1000, y: 1000 });
    expect(selectBestPlayer(enemy, [dead, alive])?.id).toBe("alive");
  });

  it("predicts player position", () => {
    const player = makePlayer({ x: 0, y: 0, facing: 0, speed: 100 });
    const predicted = predictPlayerPosition(player, 1);
    expect(predicted.x).toBeGreaterThan(0);
  });

  it("finds weakest player", () => {
    const weak = makePlayer({ id: "weak", health: 20 });
    const strong = makePlayer({ id: "strong", health: 100 });
    expect(findWeakestPlayer([strong, weak])?.id).toBe("weak");
  });

  it("computes group centroid", () => {
    const a = makeEnemy({ id: "a", x: 0, y: 0 });
    const b = makeEnemy({ id: "b", x: 200, y: 0 });
    const centroid = computeGroupCentroid([a, b]);
    expect(centroid.x).toBe(100);
  });
});

describe("boss behavior tree", () => {
  it("creates default behavior nodes", () => {
    const boss = makeEnemy({ isBoss: true, variant: "overlord" });
    const nodes = createBossBehaviorTree(boss);
    expect(nodes.length).toBeGreaterThanOrEqual(3);
    expect(nodes.some((n) => n.id === "chase")).toBe(true);
  });

  it("runs boss ai and returns steering", () => {
    const boss = makeEnemy({ isBoss: true, variant: "overlord", x: 400, y: 400 });
    const nodes = createBossBehaviorTree(boss);
    const c = {
      enemy: boss,
      player: makePlayer(),
      allies: [boss],
      enemies: [boss],
      dt: 0.016,
      mapWidth: 2000,
      mapHeight: 2000,
      difficulty: 1,
      time: 0,
    };
    const result = runBossAI(c, nodes);
    expect(result.vx).toBeDefined();
    expect(result.vy).toBeDefined();
  });
});

describe("utilities", () => {
  it("avoids obstacles", () => {
    const enemy = makeEnemy({ x: 0, y: 0 });
    const obstacles = [{ x: 20, y: 0, radius: 20 }];
    const result = avoidObstacles(enemy, obstacles, { x: 1, y: 0 });
    expect(result.x).toBeLessThan(0);
  });

  it("updates enemy facing when moving", () => {
    const enemy = makeEnemy();
    updateEnemyFacing(enemy, 1, 0);
    expect(enemy.facing).toBe(0);
  });

  it("sets attack animation", () => {
    const enemy = makeEnemy();
    setAnimationFromMovement(enemy, false, true);
    expect(enemy.animation).toBe("attack");
  });

  it("preserves death animation", () => {
    const enemy = makeEnemy({ animation: "death" });
    setAnimationFromMovement(enemy, true, true);
    expect(enemy.animation).toBe("death");
  });
});
