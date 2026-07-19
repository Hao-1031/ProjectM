import type { Enemy, Player } from "./types";

export type AIBehavior =
  "chase" | "keep_distance" | "flank" | "swarm" | "retreat" | "charge" | "orbit" | "ambush";

function distanceXY(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

function normalizeXY(x: number, y: number): { x: number; y: number } {
  const len = Math.hypot(x, y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

export interface AIContext {
  enemy: Enemy;
  player: Player;
  allies: Enemy[];
  enemies: Enemy[];
  dt: number;
  mapWidth: number;
  mapHeight: number;
  difficulty: number;
  time: number;
}

export interface SteeringOutput {
  vx: number;
  vy: number;
  desiredDistance?: number;
  shouldAttack: boolean;
}

const TOUCH_DISTANCE = 12;

export function getPreferredBehavior(enemy: Enemy): AIBehavior {
  if (enemy.isBoss) {
    const phase = enemy.phase ?? 0;
    if (phase >= 2) return "orbit";
    if (phase === 1) return "keep_distance";
    return "chase";
  }

  switch (enemy.variant) {
    case "runner":
      return "charge";
    case "spitter":
      return "keep_distance";
    case "tank":
      return "swarm";
    case "elite":
      return enemy.affixes.includes("swift") ? "flank" : "swarm";
    default:
      return "chase";
  }
}

export function computeSeparation(enemy: Enemy, neighbors: Enemy[]): { x: number; y: number } {
  let dx = 0;
  let dy = 0;
  let count = 0;
  const desiredSeparation = enemy.radius * 2.5;

  for (const other of neighbors) {
    if (other.id === enemy.id) continue;
    const dist = distanceXY(enemy.x, enemy.y, other.x, other.y);
    if (dist > 0 && dist < desiredSeparation) {
      const diffX = enemy.x - other.x;
      const diffY = enemy.y - other.y;
      const nd = normalizeXY(diffX, diffY);
      dx += nd.x / dist;
      dy += nd.y / dist;
      count++;
    }
  }

  if (count === 0) return { x: 0, y: 0 };
  return normalizeXY(dx, dy);
}

export function computeAlignment(enemy: Enemy, neighbors: Enemy[]): { x: number; y: number } {
  let vx = 0;
  let vy = 0;
  let count = 0;

  for (const other of neighbors) {
    if (other.id === enemy.id) continue;
    if (distanceXY(enemy.x, enemy.y, other.x, other.y) < enemy.radius * 6) {
      vx += Math.cos(other.facing);
      vy += Math.sin(other.facing);
      count++;
    }
  }

  if (count === 0) return { x: 0, y: 0 };
  return normalizeXY(vx, vy);
}

export function computeCohesion(enemy: Enemy, neighbors: Enemy[]): { x: number; y: number } {
  let cx = 0;
  let cy = 0;
  let count = 0;

  for (const other of neighbors) {
    if (other.id === enemy.id) continue;
    if (distanceXY(enemy.x, enemy.y, other.x, other.y) < enemy.radius * 8) {
      cx += other.x;
      cy += other.y;
      count++;
    }
  }

  if (count === 0) return { x: 0, y: 0 };
  return normalizeXY(cx / count - enemy.x, cy / count - enemy.y);
}

export function computeFlockingSteer(
  enemy: Enemy,
  neighbors: Enemy[],
  weights: { separation: number; alignment: number; cohesion: number }
): { x: number; y: number } {
  const sep = computeSeparation(enemy, neighbors);
  const ali = computeAlignment(enemy, neighbors);
  const coh = computeCohesion(enemy, neighbors);

  return {
    x: sep.x * weights.separation + ali.x * weights.alignment + coh.x * weights.cohesion,
    y: sep.y * weights.separation + ali.y * weights.alignment + coh.y * weights.cohesion,
  };
}

function steerTowards(ex: number, ey: number, tx: number, ty: number): { x: number; y: number } {
  return normalizeXY(tx - ex, ty - ey);
}

function steerAway(ex: number, ey: number, tx: number, ty: number): { x: number; y: number } {
  const dir = normalizeXY(ex - tx, ey - ty);
  return { x: dir.x, y: dir.y };
}

function clampToMap(
  x: number,
  y: number,
  radius: number,
  width: number,
  height: number
): { x: number; y: number } {
  return {
    x: Math.max(radius, Math.min(width - radius, x)),
    y: Math.max(radius, Math.min(height - radius, y)),
  };
}

function applySteering(
  enemy: Enemy,
  steering: { x: number; y: number },
  dt: number,
  mapWidth: number,
  mapHeight: number
): void {
  const moveSpeed = enemy.speed * (1 - enemy.slow) * dt;
  if (moveSpeed <= 0) return;

  const nextX = enemy.x + steering.x * moveSpeed;
  const nextY = enemy.y + steering.y * moveSpeed;
  const clamped = clampToMap(nextX, nextY, enemy.radius, mapWidth, mapHeight);

  enemy.x = clamped.x;
  enemy.y = clamped.y;
  enemy.facing = Math.atan2(steering.y, steering.x);
}

function shouldAttackPlayer(enemy: Enemy, player: Player): boolean {
  const dist = distanceXY(enemy.x, enemy.y, player.x, player.y);
  const attackRange = enemy.radius + player.radius + TOUCH_DISTANCE;
  return dist <= attackRange;
}

export function aiChase(ctx: AIContext): SteeringOutput {
  const dir = steerTowards(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y);
  const neighbors = ctx.allies.filter(
    (e) =>
      e.id !== ctx.enemy.id && distanceXY(ctx.enemy.x, ctx.enemy.y, e.x, e.y) < ctx.enemy.radius * 8
  );
  const flock = computeFlockingSteer(ctx.enemy, neighbors, {
    separation: 1.2,
    alignment: 0.3,
    cohesion: 0.4,
  });

  const combined = normalizeXY(dir.x + flock.x, dir.y + flock.y);
  applySteering(ctx.enemy, combined, ctx.dt, ctx.mapWidth, ctx.mapHeight);

  return {
    vx: combined.x,
    vy: combined.y,
    shouldAttack: shouldAttackPlayer(ctx.enemy, ctx.player),
  };
}

export function aiKeepDistance(ctx: AIContext, preferredDistance = 220): SteeringOutput {
  const dist = distanceXY(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y);
  const toPlayer = steerTowards(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y);

  let desired: { x: number; y: number };
  if (dist < preferredDistance - 40) {
    desired = steerAway(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y);
  } else if (dist > preferredDistance + 40) {
    desired = toPlayer;
  } else {
    const lateral = { x: -toPlayer.y, y: toPlayer.x };
    desired = lateral;
  }

  const neighbors = ctx.allies.filter(
    (e) =>
      e.id !== ctx.enemy.id && distanceXY(ctx.enemy.x, ctx.enemy.y, e.x, e.y) < ctx.enemy.radius * 8
  );
  const sep = computeSeparation(ctx.enemy, neighbors);
  const combined = normalizeXY(desired.x + sep.x * 1.5, desired.y + sep.y * 1.5);

  applySteering(ctx.enemy, combined, ctx.dt, ctx.mapWidth, ctx.mapHeight);

  return {
    vx: combined.x,
    vy: combined.y,
    desiredDistance: dist,
    shouldAttack: dist <= preferredDistance + 40 && dist >= preferredDistance - 80,
  };
}

export function aiFlank(ctx: AIContext): SteeringOutput {
  const toPlayer = steerTowards(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y);
  const lateral = { x: -toPlayer.y, y: toPlayer.x };
  const offset = Math.sin(ctx.time * 0.003 + ctx.enemy.id.charCodeAt(0)) > 0 ? 1 : -1;

  const targetX = ctx.player.x + lateral.x * 160 * offset;
  const targetY = ctx.player.y + lateral.y * 160 * offset;

  const dir = steerTowards(ctx.enemy.x, ctx.enemy.y, targetX, targetY);
  const neighbors = ctx.allies.filter(
    (e) =>
      e.id !== ctx.enemy.id && distanceXY(ctx.enemy.x, ctx.enemy.y, e.x, e.y) < ctx.enemy.radius * 8
  );
  const sep = computeSeparation(ctx.enemy, neighbors);
  const combined = normalizeXY(dir.x + sep.x, dir.y + sep.y);

  applySteering(ctx.enemy, combined, ctx.dt, ctx.mapWidth, ctx.mapHeight);

  return {
    vx: combined.x,
    vy: combined.y,
    shouldAttack: shouldAttackPlayer(ctx.enemy, ctx.player),
  };
}

export function aiCharge(ctx: AIContext): SteeringOutput {
  const dist = distanceXY(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y);
  const chargeRange = 320;

  let dir: { x: number; y: number };
  if (dist < chargeRange) {
    dir = steerTowards(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y);
    const speedBoost = 1.6;
    applySteering(ctx.enemy, dir, ctx.dt * speedBoost, ctx.mapWidth, ctx.mapHeight);
  } else {
    dir = steerTowards(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y);
    applySteering(ctx.enemy, dir, ctx.dt, ctx.mapWidth, ctx.mapHeight);
  }

  return {
    vx: dir.x,
    vy: dir.y,
    shouldAttack: shouldAttackPlayer(ctx.enemy, ctx.player),
  };
}

export function aiRetreat(ctx: AIContext, healthThreshold = 0.35): SteeringOutput {
  const dist = distanceXY(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y);
  const healthRatio = ctx.enemy.health / ctx.enemy.maxHealth;

  if (healthRatio > healthThreshold && dist > 180) {
    return aiKeepDistance(ctx, 220);
  }

  const away = steerAway(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y);
  applySteering(ctx.enemy, away, ctx.dt, ctx.mapWidth, ctx.mapHeight);

  return {
    vx: away.x,
    vy: away.y,
    shouldAttack: false,
  };
}

export function aiOrbit(ctx: AIContext, radius = 200): SteeringOutput {
  const toPlayer = steerTowards(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y);
  const lateral = { x: -toPlayer.y, y: toPlayer.x };
  const dist = distanceXY(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y);

  const tangent = lateral;
  const correction = dist < radius ? -0.5 : dist > radius + 60 ? 0.3 : 0;
  const desired = normalizeXY(
    tangent.x + toPlayer.x * correction,
    tangent.y + toPlayer.y * correction
  );

  applySteering(ctx.enemy, desired, ctx.dt, ctx.mapWidth, ctx.mapHeight);

  return {
    vx: desired.x,
    vy: desired.y,
    shouldAttack: dist <= radius + 80,
  };
}

export function aiAmbush(ctx: AIContext): SteeringOutput {
  const dist = distanceXY(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y);
  const ambushRange = 140;

  if (dist > ambushRange) {
    const dir = steerTowards(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y);
    applySteering(ctx.enemy, dir, ctx.dt * 0.6, ctx.mapWidth, ctx.mapHeight);
    return { vx: dir.x, vy: dir.y, shouldAttack: false };
  }

  const dir = steerTowards(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y);
  applySteering(ctx.enemy, dir, ctx.dt * 2.2, ctx.mapWidth, ctx.mapHeight);
  return { vx: dir.x, vy: dir.y, shouldAttack: shouldAttackPlayer(ctx.enemy, ctx.player) };
}

export function aiSwarm(ctx: AIContext): SteeringOutput {
  const neighbors = ctx.allies.filter(
    (e) =>
      e.id !== ctx.enemy.id &&
      distanceXY(ctx.enemy.x, ctx.enemy.y, e.x, e.y) < ctx.enemy.radius * 10
  );
  const flock = computeFlockingSteer(ctx.enemy, neighbors, {
    separation: 0.8,
    alignment: 0.8,
    cohesion: 1.2,
  });
  const toPlayer = steerTowards(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y);

  const combined = normalizeXY(toPlayer.x * 0.8 + flock.x, toPlayer.y * 0.8 + flock.y);
  applySteering(ctx.enemy, combined, ctx.dt, ctx.mapWidth, ctx.mapHeight);

  return {
    vx: combined.x,
    vy: combined.y,
    shouldAttack: shouldAttackPlayer(ctx.enemy, ctx.player),
  };
}

export function selectBestPlayer(enemy: Enemy, players: Player[]): Player | null {
  if (players.length === 0) return null;

  let best: Player | null = null;
  let bestScore = Infinity;

  for (const player of players) {
    if (player.health <= 0) continue;
    const dist = distanceXY(enemy.x, enemy.y, player.x, player.y);
    const healthPenalty = (1 - player.health / player.maxHealth) * 100;
    const score = dist - healthPenalty;
    if (score < bestScore) {
      bestScore = score;
      best = player;
    }
  }

  return best ?? players[0] ?? null;
}

export function runEnemyAI(ctx: AIContext): SteeringOutput {
  const behavior = getPreferredBehavior(ctx.enemy);

  switch (behavior) {
    case "keep_distance":
      return aiKeepDistance(ctx, ctx.enemy.isElite ? 260 : 220);
    case "flank":
      return aiFlank(ctx);
    case "charge":
      return aiCharge(ctx);
    case "retreat":
      return aiRetreat(ctx);
    case "orbit":
      return aiOrbit(ctx, ctx.enemy.isBoss ? 280 : 200);
    case "ambush":
      return aiAmbush(ctx);
    case "swarm":
      return aiSwarm(ctx);
    case "chase":
    default:
      return aiChase(ctx);
  }
}

export interface BossBehaviorNode {
  id: string;
  weight: number;
  condition: (ctx: AIContext) => boolean;
  execute: (ctx: AIContext) => SteeringOutput;
}

export function createBossBehaviorTree(boss: Enemy): BossBehaviorNode[] {
  const nodes: BossBehaviorNode[] = [
    {
      id: "retreat",
      weight: 1,
      condition: (ctx) => ctx.enemy.health / ctx.enemy.maxHealth < 0.25 && ctx.enemy.phase < 2,
      execute: (ctx) => aiRetreat(ctx, 0.4),
    },
    {
      id: "orbit_attack",
      weight: 3,
      condition: (ctx) => ctx.enemy.phase >= 1 && ctx.enemy.isBoss,
      execute: (ctx) => aiOrbit(ctx, 240),
    },
    {
      id: "keep_distance",
      weight: 2,
      condition: (ctx) => ctx.enemy.phase === 1,
      execute: (ctx) => aiKeepDistance(ctx, 260),
    },
    {
      id: "chase",
      weight: 4,
      condition: () => true,
      execute: (ctx) => aiChase(ctx),
    },
  ];

  return nodes;
}

export function runBossAI(ctx: AIContext, nodes: BossBehaviorNode[]): SteeringOutput {
  const eligible = nodes.filter((n) => n.condition(ctx));
  if (eligible.length === 0) return aiChase(ctx);

  let selected = eligible[0];
  let totalWeight = 0;
  for (const node of eligible) {
    totalWeight += node.weight;
  }

  let randomWeight =
    (Math.sin(ctx.time * 0.001 + ctx.enemy.id.charCodeAt(0)) * 0.5 + 0.5) * totalWeight;
  for (const node of eligible) {
    randomWeight -= node.weight;
    if (randomWeight <= 0) {
      selected = node;
      break;
    }
  }

  return selected.execute(ctx);
}

export function predictPlayerPosition(player: Player, time: number): { x: number; y: number } {
  const vx = Math.cos(player.facing) * player.speed * 1.5;
  const vy = Math.sin(player.facing) * player.speed * 1.5;
  return {
    x: player.x + vx * time,
    y: player.y + vy * time,
  };
}

export function findWeakestPlayer(players: Player[]): Player | null {
  if (players.length === 0) return null;
  let weakest = players[0];
  for (const p of players) {
    if (p.health > 0 && p.health < weakest.health) {
      weakest = p;
    }
  }
  return weakest;
}

export function computeGroupCentroid(enemies: Enemy[]): { x: number; y: number } {
  if (enemies.length === 0) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const e of enemies) {
    x += e.x;
    y += e.y;
  }
  return { x: x / enemies.length, y: y / enemies.length };
}

export function computeSurroundSlot(
  enemy: Enemy,
  player: Player,
  allies: Enemy[],
  slotRadius: number
): { x: number; y: number } {
  const index = allies.findIndex((e) => e.id === enemy.id);
  const count = Math.max(allies.length, 1);
  const angle = (index / count) * Math.PI * 2;
  return {
    x: player.x + Math.cos(angle) * slotRadius,
    y: player.y + Math.sin(angle) * slotRadius,
  };
}

export function aiSurround(ctx: AIContext, slotRadius = 160): SteeringOutput {
  const slot = computeSurroundSlot(ctx.enemy, ctx.player, ctx.allies, slotRadius);
  const dir = steerTowards(ctx.enemy.x, ctx.enemy.y, slot.x, slot.y);
  const sep = computeSeparation(ctx.enemy, ctx.allies);
  const combined = normalizeXY(dir.x + sep.x * 1.5, dir.y + sep.y * 1.5);

  applySteering(ctx.enemy, combined, ctx.dt, ctx.mapWidth, ctx.mapHeight);

  return {
    vx: combined.x,
    vy: combined.y,
    shouldAttack: shouldAttackPlayer(ctx.enemy, ctx.player),
  };
}

export function avoidObstacles(
  enemy: Enemy,
  obstacles: { x: number; y: number; radius: number }[],
  steer: { x: number; y: number }
): { x: number; y: number } {
  let dx = steer.x;
  let dy = steer.y;

  for (const obs of obstacles) {
    const dist = distanceXY(enemy.x, enemy.y, obs.x, obs.y);
    const threshold = enemy.radius + obs.radius + 10;
    if (dist < threshold && dist > 0) {
      const away = normalizeXY(enemy.x - obs.x, enemy.y - obs.y);
      const force = (threshold - dist) / threshold;
      dx += away.x * force * 2;
      dy += away.y * force * 2;
    }
  }

  return normalizeXY(dx, dy);
}

export function updateEnemyFacing(enemy: Enemy, vx: number, vy: number): void {
  if (Math.abs(vx) > 0.001 || Math.abs(vy) > 0.001) {
    enemy.facing = Math.atan2(vy, vx);
  }
}

export function setAnimationFromMovement(enemy: Enemy, moving: boolean, attacking: boolean): void {
  if (enemy.animation === "death") return;
  if (attacking) {
    enemy.animation = "attack";
    enemy.animationTimer = 0;
  } else if (moving) {
    enemy.animation = "move";
  } else {
    enemy.animation = "idle";
  }
}
