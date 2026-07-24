import type { Enemy, Player } from "../types";
import type { AIBehavior, AIContext, AIParams, SteeringOutput } from "./types";
import { distance, normalize, clamp } from "../math";
import { getFlowDirection, hasLineOfSight, findOpenDirection } from "./pathfinding";
import { mapDifficultyToAIParams } from "./alpha-bridge";

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

  const output = executeBehavior(ctx, behavior, target, params);
  return applyFlockingAndObstacles(ctx, output, params);
}

export function selectTarget(ctx: AIContext): { x: number; y: number; isCore?: boolean; isNode?: boolean } {
  const { player, core, nodes } = ctx;

  // 据点模式：core 存在时按概率选择 core 或最近节点
  if (core && ctx.enemy.targetCore) {
    return { x: core.x, y: core.y, isCore: true };
  }

  // 据点模式：有可占领节点时，部分敌人优先去节点
  if (nodes && nodes.length > 0 && !ctx.enemy.isElite && !ctx.enemy.isBoss) {
    const activeNodes = nodes.filter((n) => n.active && !n.captured);
    if (activeNodes.length > 0 && Math.random() < 0.25) {
      const nearest = activeNodes.reduce((best, n) =>
        distance(ctx.enemy, n) < distance(ctx.enemy, best) ? n : best
      );
      return { x: nearest.x, y: nearest.y, isNode: true };
    }
  }

  // 默认追击玩家
  return { x: player.x, y: player.y };
}

export function selectBehavior(ctx: AIContext, params: AIParams): AIBehavior {
  const { enemy } = ctx;
  const healthRatio = enemy.maxHealth > 0 ? enemy.health / enemy.maxHealth : 1;
  const aggression = params.aggression;

  if (enemy.isBoss) return "orbit";
  if (enemy.variant === "spitter") return healthRatio < 0.3 ? "retreat" : "keep_distance";
  if (enemy.variant === "sniper" || enemy.variant === "artillery") return "keep_distance";
  if (enemy.variant === "runner" || enemy.variant === "raptor") return "flank";
  if (enemy.variant === "stalker") return "ambush";
  if (enemy.variant === "tank" || enemy.variant === "crusher") return "charge";
  if (enemy.variant === "disruptor" || enemy.variant === "shielder") return "surround";

  if (healthRatio < 0.25 && aggression < 0.6) return "retreat";
  if (ctx.allies.length >= 4) return "surround";
  if (aggression > 0.7 && ctx.allies.length >= 2) return "flank";

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
    { width: ctx.mapWidth, height: ctx.mapHeight }
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
  if (dist > preferredDistance + 40) {
    dir = getFlowDirection(ctx.enemy.x, ctx.enemy.y, target.x, target.y, ctx.obstacles, {
      width: ctx.mapWidth,
      height: ctx.mapHeight,
    });
  } else if (dist < preferredDistance - 40) {
    dir = normalize({ x: -dx / dist, y: -dy / dist });
  } else {
    // 横向游斗
    const strafe = Math.sin(ctx.time * 2 + ctx.enemy.x * 0.01) > 0 ? 1 : -1;
    dir = normalize({ x: (-dy / dist) * strafe, y: (dx / dist) * strafe });
  }

  return {
    vx: dir.x,
    vy: dir.y,
    desiredDistance: preferredDistance,
    shouldAttack: dist < preferredDistance * 1.4,
  };
}

export function aiFlank(ctx: AIContext, target: { x: number; y: number }): SteeringOutput {
  const dx = target.x - ctx.enemy.x;
  const dy = target.y - ctx.enemy.y;
  const dist = Math.hypot(dx, dy);

  // 根据敌人索引选择侧翼方向，保持稳定
  const side = (ctx.enemy.id.charCodeAt(ctx.enemy.id.length - 1) % 2 === 0 ? 1 : -1) * (ctx.time * 0.3);
  const angle = Math.atan2(dy, dx) + Math.PI / 3 * side;

  const flankTarget = {
    x: target.x - Math.cos(angle) * 160,
    y: target.y - Math.sin(angle) * 160,
  };

  const dir = getFlowDirection(ctx.enemy.x, ctx.enemy.y, flankTarget.x, flankTarget.y, ctx.obstacles, {
    width: ctx.mapWidth,
    height: ctx.mapHeight,
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

  // 有 line of sight 时侧向移动，准备切入
  const strafe = Math.sin(ctx.time * 1.5) > 0 ? 1 : -1;
  const dir = normalize({
    x: (-dy / dist) * strafe + (dx / dist) * 0.2,
    y: (dx / dist) * strafe + (dy / dist) * 0.2,
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

  // 根据盟友数量决定包围角度
  const index = ctx.allies.findIndex((a) => a.id === ctx.enemy.id);
  const count = Math.max(1, ctx.allies.length);
  const angleOffset = (index / count) * Math.PI * 2;

  const surroundAngle = Math.atan2(dy, dx) + angleOffset;
  const radius = 160;
  const surroundTarget = {
    x: target.x - Math.cos(surroundAngle) * radius,
    y: target.y - Math.sin(surroundAngle) * radius,
  };

  const dir = getFlowDirection(ctx.enemy.x, ctx.enemy.y, surroundTarget.x, surroundTarget.y, ctx.obstacles, {
    width: ctx.mapWidth,
    height: ctx.mapHeight,
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

  const final = normalize({
    x:
      base.vx +
      sepNorm.x * params.separationWeight +
      aliNorm.x * params.alignmentWeight +
      cohNorm.x * params.cohesionWeight,
    y:
      base.vy +
      sepNorm.y * params.separationWeight +
      aliNorm.y * params.alignmentWeight +
      cohNorm.y * params.cohesionWeight,
  });

  return {
    ...base,
    vx: final.x,
    vy: final.y,
    speedMultiplier: clamp((base.speedMultiplier ?? 1) * params.speedMulCap, 0.6, params.speedMulCap),
  };
}
