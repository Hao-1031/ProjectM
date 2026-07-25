import type { Enemy, Player } from "../types";
import type { AIBehavior, AIContext, AIParams, SteeringOutput } from "./types";
import { distance, normalize, clamp } from "../math";
import { getFlowDirection, hasLineOfSight, findOpenDirection } from "./pathfinding";
import { mapDifficultyToAIParams } from "./alpha-bridge";
import { calculateEnemyMovement, type MovementBehavior } from "@/lib/algorithms";

/**
 * β-1 群体战术与行为决策
 *
 * 为每种敌人类型选择合适行为，并输出包含避障的 steering。
 * 核心逻辑：
 * - 选择目标（玩家 / 核心 / 节点）
 * - 根据 variant + 难度 + 血量选择行为
 * - 叠加 flocking、避障、难度映射
 */

export function runEnemyAI(ctx: AIContext): SteeringOutput {
  const params = mapDifficultyToAIParams(ctx.alphaSnapshot);
  const target = selectTarget(ctx);
  const behavior = selectBehavior(ctx, params);

  const movementBehavior = toMovementBehavior(behavior);
  if (!movementBehavior) {
    const output = executeBehavior(ctx, behavior, target, params);
    return applyFlockingAndObstacles(ctx, output, params);
  }

  const output = calculateEnemyMovement({
    entity: {
      id: ctx.enemy.id,
      position: { x: ctx.enemy.x, y: ctx.enemy.y },
      radius: ctx.enemy.radius,
      speed: ctx.enemy.speed,
      variant: ctx.enemy.variant,
      health: ctx.enemy.health,
      maxHealth: ctx.enemy.maxHealth,
      targetCore: ctx.enemy.targetCore,
      isElite: ctx.enemy.isElite,
      isBoss: ctx.enemy.isBoss,
    },
    target: {
      position: { x: target.x, y: target.y },
      type: target.isCore ? "core" : target.isNode ? "node" : "player",
    },
    allies: ctx.allies.map((a) => ({
      id: a.id,
      position: { x: a.x, y: a.y },
      radius: a.radius,
    })),
    obstacles: ctx.obstacles.map((o) => ({
      id: o.id,
      x: o.x,
      y: o.y,
      width: o.width,
      height: o.height,
    })),
    bounds: { width: ctx.mapWidth, height: ctx.mapHeight },
    coordinateMode: "vector",
    config: {
      behavior: movementBehavior,
      aggression: params.aggression,
      separationWeight: params.separationWeight,
      obstacleWeight: params.obstacleWeight,
      boundaryWeight: 1.0,
      preferredDistance: 220 * params.preferredDistanceMul,
      attackRange: getAttackRange(ctx.enemy),
      maxSpeedMultiplier: params.speedMulCap,
      time: ctx.time,
    },
  });

  const vlen = Math.hypot(output.velocity.x, output.velocity.y);
  return {
    vx: vlen > 0.001 ? output.velocity.x / vlen : 0,
    vy: vlen > 0.001 ? output.velocity.y / vlen : 0,
    speedMultiplier: clamp(output.speedMultiplier, 0.6, params.speedMulCap),
    shouldAttack: output.shouldAttack,
  };
}

function toMovementBehavior(behavior: AIBehavior): MovementBehavior | null {
  switch (behavior) {
    case "chase":
    case "attack_core":
    case "capture_node":
      return "pursue";
    case "keep_distance":
      return "kite";
    case "flank":
    case "ambush":
      return "flank";
    case "retreat":
      return "retreat";
    case "seek_cover":
      return "seek_cover";
    case "strafe":
      return "strafe";
    case "charge":
      return "intercept";
    case "surround":
    case "swarm":
      return "surround";
    case "orbit":
    default:
      return null;
  }
}

function getAttackRange(enemy: Enemy): number {
  if (
    enemy.variant === "spitter" ||
    enemy.variant === "sniper" ||
    enemy.variant === "artillery"
  ) {
    return 280;
  }
  if (enemy.isBoss) return 220;
  return 80;
}

export function selectTarget(
  ctx: AIContext
): { x: number; y: number; isCore?: boolean; isNode?: boolean; targetId?: string } {
  const { player, players, core, nodes } = ctx;
  const enemy = ctx.enemy;

  // 据点模式：被标记为直冲核心的敌人优先选择核心
  if (core && enemy.targetCore && !enemy.isBoss) {
    return { x: core.x, y: core.y, isCore: true, targetId: "core" };
  }

  // 据点模式：非精英敌人可能去占领节点
  if (nodes && nodes.length > 0 && !enemy.isElite && !enemy.isBoss) {
    const activeNodes = nodes.filter((n) => n.active && !n.captured);
    if (activeNodes.length > 0 && Math.random() < 0.25) {
      const nearest = activeNodes.reduce((best, n) =>
        distance(enemy, n) < distance(enemy, best) ? n : best
      );
      return { x: nearest.x, y: nearest.y, isNode: true, targetId: nearest.id };
    }
  }

  // Bot AI 式目标选择：在多个玩家中按威胁与易伤程度评分
  const candidates = [player, ...players].filter((p) => p.id !== enemy.id && p.health > 0);
  if (candidates.length === 0) {
    return { x: player.x, y: player.y, targetId: player.id };
  }

  let best: Player | null = null;
  let bestScore = -Infinity;

  for (const candidate of candidates) {
    const dist = distance(enemy, candidate);
    const healthRatio = candidate.maxHealth > 0 ? candidate.health / candidate.maxHealth : 1;
    const isCurrentTarget = candidate.id === enemy.id; // 敌人本身无 targetId 状态，此处用占位

    let score = -dist * 0.35 + (1 - healthRatio) * 250;

    // 威胁修正：残血玩家更容易被集火
    if (healthRatio < 0.4) score += 150;

    // 距离偏好：远程敌人喜欢保持一定距离，但不完全放弃近处残血
    if (
      enemy.variant === "spitter" ||
      enemy.variant === "sniper" ||
      enemy.variant === "artillery"
    ) {
      score += Math.max(0, dist - 300) * 0.15;
    }

    // 障碍物遮挡扣分
    if (!hasLineOfSight(enemy.x, enemy.y, candidate.x, candidate.y, ctx.obstacles, enemy.radius)) {
      score -= 120;
    }

    // 玩家当前武器射程越远威胁越高，优先处理
    const playerWeaponRange = candidate.weapons[0]?.range ?? 200;
    score += Math.min(playerWeaponRange, 600) * 0.05;

    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  const chosen = best ?? player;
  return { x: chosen.x, y: chosen.y, targetId: chosen.id };
}

export function selectBehavior(ctx: AIContext, params: AIParams): AIBehavior {
  const { enemy, obstacles } = ctx;
  const target = selectTarget(ctx);
  const dist = distance(enemy, target);
  const attackRange = getAttackRange(enemy);
  const healthRatio = enemy.maxHealth > 0 ? enemy.health / enemy.maxHealth : 1;
  const aggression = params.aggression;

  // 低血量且附近有障碍物时优先找掩体，否则撤退
  if (healthRatio < 0.25) {
    if (obstacles.length > 0 && aggression < 0.5) return "seek_cover";
    return "retreat";
  }

  // 据点模式下敌人以直冲核心为主，避免过多横向乱跑
  if (enemy.targetCore) {
    if (enemy.isBoss) return "orbit";
    if (enemy.variant === "spitter" || enemy.variant === "sniper" || enemy.variant === "artillery") {
      return dist < attackRange * 1.2 ? "strafe" : "chase";
    }
    if (enemy.variant === "tank" || enemy.variant === "crusher") return "charge";
    if (healthRatio < 0.2 && aggression < 0.5) return "retreat";
    return "chase";
  }

  if (enemy.isBoss) return "orbit";

  if (enemy.variant === "spitter") {
    return dist < attackRange * 1.1 ? "strafe" : "chase";
  }
  if (enemy.variant === "sniper" || enemy.variant === "artillery") {
    return dist < attackRange * 1.3 ? "strafe" : "chase";
  }
  if (enemy.variant === "runner" || enemy.variant === "raptor") return "flank";
  if (enemy.variant === "stalker") return "ambush";
  if (enemy.variant === "tank" || enemy.variant === "crusher") return "charge";
  if (enemy.variant === "disruptor" || enemy.variant === "shielder") return "surround";

  // 通用敌人：进入攻击范围后采用侧向走位降低被命中概率
  if (dist < attackRange * 1.1 && healthRatio > 0.5) return "strafe";
  if (ctx.allies.length >= 5) return "surround";
  if (aggression > 0.75 && ctx.allies.length >= 3) return "flank";

  return "chase";
}

export function executeBehavior(
  ctx: AIContext,
  behavior: AIBehavior,
  target: { x: number; y: number },
  params: AIParams
): SteeringOutput {
  switch (behavior) {
    case "keep_distance":
      return aiKeepDistance(ctx, target, 220 * params.preferredDistanceMul);
    case "flank":
      return aiFlank(ctx, target);
    case "charge":
      return aiCharge(ctx, target);
    case "retreat":
      return aiRetreat(ctx, target);
    case "orbit":
      return aiOrbit(ctx, target, 260 * params.preferredDistanceMul);
    case "ambush":
      return aiAmbush(ctx, target);
    case "surround":
      return aiSurround(ctx, target);
    case "attack_core":
    case "capture_node":
    case "swarm":
    case "chase":
    default:
      return aiChase(ctx, target);
  }
}

export function aiChase(ctx: AIContext, target: { x: number; y: number }): SteeringOutput {
  const dir = getFlowDirection(
    ctx.enemy.x,
    ctx.enemy.y,
    target.x,
    target.y,
    ctx.obstacles,
    { width: ctx.mapWidth, height: ctx.mapHeight, radius: ctx.enemy.radius }
  );
  return {
    vx: dir.x,
    vy: dir.y,
    shouldAttack: true,
  };
}

export function aiKeepDistance(
  ctx: AIContext,
  target: { x: number; y: number },
  preferredDistance: number
): SteeringOutput {
  const dx = target.x - ctx.enemy.x;
  const dy = target.y - ctx.enemy.y;
  const dist = Math.hypot(dx, dy);

  let dir = { x: 0, y: 0 };
  if (dist > preferredDistance + 50) {
    dir = getFlowDirection(ctx.enemy.x, ctx.enemy.y, target.x, target.y, ctx.obstacles, {
      width: ctx.mapWidth,
      height: ctx.mapHeight,
      radius: ctx.enemy.radius,
    });
  } else if (dist < preferredDistance - 50) {
    dir = normalize({ x: -dx / dist, y: -dy / dist });
  } else {
    // 小幅度横向游斗，降低“躲子弹”既视感
    const strafe = Math.sin(ctx.time * 1.2 + ctx.enemy.x * 0.01) > 0 ? 1 : -1;
    dir = normalize({
      x: (-dy / dist) * strafe * 0.35 + (dx / dist) * 0.1,
      y: (dx / dist) * strafe * 0.35 + (dy / dist) * 0.1,
    });
  }

  return {
    vx: dir.x,
    vy: dir.y,
    desiredDistance: preferredDistance,
    shouldAttack: dist < preferredDistance * 1.5,
  };
}

export function aiFlank(ctx: AIContext, target: { x: number; y: number }): SteeringOutput {
  const dx = target.x - ctx.enemy.x;
  const dy = target.y - ctx.enemy.y;
  const dist = Math.hypot(dx, dy);

  // 小幅度侧翼偏移，避免看起来像在刻意躲子弹
  const side = ctx.enemy.id.charCodeAt(ctx.enemy.id.length - 1) % 2 === 0 ? 1 : -1;
  const angle = Math.atan2(dy, dx) + Math.PI / 6 * side;

  const flankTarget = {
    x: target.x - Math.cos(angle) * 120,
    y: target.y - Math.sin(angle) * 120,
  };

  const dir = getFlowDirection(ctx.enemy.x, ctx.enemy.y, flankTarget.x, flankTarget.y, ctx.obstacles, {
    width: ctx.mapWidth,
    height: ctx.mapHeight,
    radius: ctx.enemy.radius,
  });

  return {
    vx: dir.x,
    vy: dir.y,
    shouldAttack: dist < 180,
  };
}

export function aiCharge(ctx: AIContext, target: { x: number; y: number }): SteeringOutput {
  const dir = getFlowDirection(ctx.enemy.x, ctx.enemy.y, target.x, target.y, ctx.obstacles, {
    width: ctx.mapWidth,
    height: ctx.mapHeight,
    radius: ctx.enemy.radius,
  });
  return {
    vx: dir.x,
    vy: dir.y,
    speedMultiplier: 1.15,
    shouldAttack: true,
  };
}

export function aiRetreat(ctx: AIContext, target: { x: number; y: number }): SteeringOutput {
  const dx = target.x - ctx.enemy.x;
  const dy = target.y - ctx.enemy.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return { vx: 0, vy: 0, shouldAttack: false };

  const dir = normalize({ x: -dx / dist, y: -dy / dist });
  const open = findOpenDirection(ctx.enemy.x, ctx.enemy.y, ctx.obstacles, ctx.allies, dir, ctx.enemy.radius);

  return {
    vx: open.x,
    vy: open.y,
    speedMultiplier: 1.1,
    shouldAttack: false,
  };
}

export function aiOrbit(ctx: AIContext, target: { x: number; y: number }, radius: number): SteeringOutput {
  const dx = target.x - ctx.enemy.x;
  const dy = target.y - ctx.enemy.y;
  const dist = Math.hypot(dx, dy);

  let dir = { x: 0, y: 0 };
  if (dist > radius + 60) {
    dir = normalize({ x: dx / dist, y: dy / dist });
  } else {
    const cw = ctx.time * 0.4 + ctx.enemy.x * 0.01 > 0 ? 1 : -1;
    const tangentX = (-dy / dist) * cw;
    const tangentY = (dx / dist) * cw;
    const outward = dist < radius ? -0.3 : 0.1;
    dir = normalize({
      x: tangentX + (dx / dist) * outward,
      y: tangentY + (dy / dist) * outward,
    });
  }

  return {
    vx: dir.x,
    vy: dir.y,
    desiredDistance: radius,
    shouldAttack: dist < radius * 1.3,
  };
}

export function aiAmbush(ctx: AIContext, target: { x: number; y: number }): SteeringOutput {
  const dx = target.x - ctx.enemy.x;
  const dy = target.y - ctx.enemy.y;
  const dist = Math.hypot(dx, dy);

  // 在玩家附近游荡，保持视线但保持距离，偶尔冲锋
  const ambushRange = 280;
  if (dist > ambushRange || !hasLineOfSight(ctx.enemy.x, ctx.enemy.y, target.x, target.y, ctx.obstacles, ctx.enemy.radius)) {
    return aiFlank(ctx, target);
  }

  // 有 line of sight 时小幅度侧向移动，准备切入
  const strafe = Math.sin(ctx.time * 1.0) > 0 ? 1 : -1;
  const dir = normalize({
    x: (-dy / dist) * strafe * 0.3 + (dx / dist) * 0.15,
    y: (dx / dist) * strafe * 0.3 + (dy / dist) * 0.15,
  });

  return {
    vx: dir.x,
    vy: dir.y,
    shouldAttack: dist < 160,
  };
}

export function aiSwarm(ctx: AIContext, target: { x: number; y: number }): SteeringOutput {
  return aiSurround(ctx, target);
}

export function aiSurround(ctx: AIContext, target: { x: number; y: number }): SteeringOutput {
  const dx = target.x - ctx.enemy.x;
  const dy = target.y - ctx.enemy.y;
  const dist = Math.hypot(dx, dy);

  // 根据盟友数量决定包围角度，降低角度分散度，避免乱跑
  const index = ctx.allies.findIndex((a) => a.id === ctx.enemy.id);
  const count = Math.max(1, ctx.allies.length);
  const angleOffset = (index / count) * Math.PI * 1.2;

  const surroundAngle = Math.atan2(dy, dx) + angleOffset;
  const radius = 130;
  const surroundTarget = {
    x: target.x - Math.cos(surroundAngle) * radius,
    y: target.y - Math.sin(surroundAngle) * radius,
  };

  const dir = getFlowDirection(ctx.enemy.x, ctx.enemy.y, surroundTarget.x, surroundTarget.y, ctx.obstacles, {
    width: ctx.mapWidth,
    height: ctx.mapHeight,
    radius: ctx.enemy.radius,
  });

  return {
    vx: dir.x,
    vy: dir.y,
    shouldAttack: dist < 200,
  };
}

function applyFlockingAndObstacles(ctx: AIContext, base: SteeringOutput, params: AIParams): SteeringOutput {
  const separation = { x: 0, y: 0 };
  const alignment = { x: 0, y: 0 };
  const cohesion = { x: 0, y: 0 };

  let neighborCount = 0;
  const perceptionRadius = 120;

  for (const ally of ctx.allies) {
    if (ally.id === ctx.enemy.id) continue;
    const d = distance(ctx.enemy, ally);
    if (d > perceptionRadius || d < 1) continue;

    const dx = ctx.enemy.x - ally.x;
    const dy = ctx.enemy.y - ally.y;
    separation.x += (dx / d) * (perceptionRadius - d);
    separation.y += (dy / d) * (perceptionRadius - d);

    alignment.x += base.vx;
    alignment.y += base.vy;

    cohesion.x += ally.x;
    cohesion.y += ally.y;
    neighborCount++;
  }

  if (neighborCount > 0) {
    separation.x /= neighborCount;
    separation.y /= neighborCount;
    alignment.x /= neighborCount;
    alignment.y /= neighborCount;
    cohesion.x = (cohesion.x / neighborCount - ctx.enemy.x) / perceptionRadius;
    cohesion.y = (cohesion.y / neighborCount - ctx.enemy.y) / perceptionRadius;
  }

  const sepNorm = normalize(separation);
  const aliNorm = normalize(alignment);
  const cohNorm = normalize(cohesion);

  // 群体行为权重降低，避免敌人因 flocking 过度横向散开，看起来像躲子弹
  const sepWeight = params.separationWeight * 0.5;
  const aliWeight = params.alignmentWeight * 0.4;
  const cohWeight = params.cohesionWeight * 0.3;

  const final = normalize({
    x: base.vx + sepNorm.x * sepWeight + aliNorm.x * aliWeight + cohNorm.x * cohWeight,
    y: base.vy + sepNorm.y * sepWeight + aliNorm.y * aliWeight + cohNorm.y * cohWeight,
  });

  return {
    ...base,
    vx: final.x,
    vy: final.y,
    speedMultiplier: clamp((base.speedMultiplier ?? 1) * params.speedMulCap, 0.6, params.speedMulCap),
  };
}
