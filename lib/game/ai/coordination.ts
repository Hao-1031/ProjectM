import type { Enemy, EnemyVariant, Player } from "../types";
import type {
  AIContext,
  CoordinationContext,
  EnemyRole,
  SteeringOutput,
  AbilityGate,
  Vec2,
} from "./types";
import { distance, normalize, clamp } from "../math";

/**
 * β 群体协作系统
 *
 * 实现四个维度的协作能力：
 * 1. 角色分工：坦克挡前排、远程后排输出、支援型居中
 * 2. 集火指令：多个敌人同时锁定同一残血目标
 * 3. 掩护撤退：残血撤退时满血队友阻挡追击路线
 * 4. 编队协同：同类型敌人保持编队同步推进
 *
 * 硬约束：敌人不允许大幅度逃跑（最大撤退距离200px）
 */

const MAX_RETREAT_DISTANCE = 200;
const COORDINATION_RADIUS = 300;
const FORMATION_RADIUS = 180;

/** 根据敌人类型分类角色 */
export function classifyEnemyRole(enemy: Enemy): EnemyRole {
  if (enemy.isBoss) return "tank";

  switch (enemy.variant as EnemyVariant) {
    case "tank":
    case "crusher":
    case "shielder":
      return "tank";
    case "runner":
    case "raptor":
    case "stalker":
      return "assassin";
    case "spitter":
    case "sniper":
    case "artillery":
      return "artillery";
    case "disruptor":
    case "constructor":
    case "harvester":
      return "support";
    case "elite":
      return "dps";
    default:
      return "default";
  }
}

/** 构建群体协作上下文 */
export function buildCoordinationContext(
  ctx: AIContext,
  gate: AbilityGate
): CoordinationContext {
  const role = classifyEnemyRole(ctx.enemy);
  const allies = ctx.allies;

  // 查找附近队友
  const nearby: Enemy[] = [];
  const nearbyTanks: Enemy[] = [];
  const nearbySquishies: Enemy[] = [];

  for (const ally of allies) {
    const d = distance(ctx.enemy, ally);
    if (d > COORDINATION_RADIUS) continue;

    nearby.push(ally);
    const allyRole = classifyEnemyRole(ally);
    if (allyRole === "tank") nearbyTanks.push(ally);
    if (allyRole === "dps" || allyRole === "assassin" || allyRole === "support") {
      nearbySquishies.push(ally);
    }
  }

  // 集火目标选择
  let focusTargetId: string | null = null;
  if (gate.focusFire) {
    focusTargetId = selectFocusTarget(ctx, nearby);
  }

  // 编队中心
  let formationCenter: Vec2 | null = null;
  let formationDirection: Vec2 | null = null;
  if (gate.formationCoordination && nearby.length >= 2) {
    formationCenter = calculateFormationCenter(nearby);
    const dx = ctx.player.x - (formationCenter?.x ?? ctx.enemy.x);
    const dy = ctx.player.y - (formationCenter?.y ?? ctx.enemy.y);
    const len = Math.hypot(dx, dy) || 1;
    formationDirection = { x: dx / len, y: dy / len };
  }

  // 掩护撤退
  let needsCoverRetreat = false;
  let coveringAllyId: string | null = null;
  if (gate.coverRetreat && role === "tank") {
    const retreatingSquishy = nearbySquishies.find(
      (s) => s.maxHealth > 0 && s.health / s.maxHealth < 0.3
    );
    if (retreatingSquishy) {
      needsCoverRetreat = true;
      coveringAllyId = retreatingSquishy.id;
    }
  }

  return {
    role,
    nearbyTanks,
    nearbySquishies,
    focusTargetId,
    formationCenter,
    formationDirection,
    needsCoverRetreat,
    coveringAllyId,
  };
}

/** 选择集火目标 */
function selectFocusTarget(
  ctx: AIContext,
  nearbyAllies: Enemy[]
): string | null {
  const candidates = [ctx.player, ...ctx.players].filter((p) => p.health > 0);
  if (candidates.length === 0) return null;

  // 优先选择残血目标
  let best: Player | null = null;
  let bestScore = -Infinity;

  for (const candidate of candidates) {
    const healthRatio = candidate.maxHealth > 0 ? candidate.health / candidate.maxHealth : 1;
    const dist = distance(ctx.enemy, candidate);

    // 残血优先，近处优先
    const score = (1 - healthRatio) * 300 - dist * 0.1;

    // 已经有盟友在攻击该目标 → 加分
    const alliesOnTarget = nearbyAllies.filter(
      (a) => distance(a, candidate) < 200
    ).length;
    const bonus = alliesOnTarget * 80;

    if (score + bonus > bestScore) {
      bestScore = score + bonus;
      best = candidate;
    }
  }

  return best?.id ?? null;
}

/** 应用角色分工：坦克主动挡在脆皮队友和玩家之间 */
export function applyRoleDivision(
  ctx: AIContext,
  coord: CoordinationContext,
  baseOutput: SteeringOutput
): SteeringOutput {
  if (coord.role !== "tank" || coord.nearbySquishies.length === 0) {
    return baseOutput;
  }

  // 找到最近的脆皮队友
  let nearestSquishy: Enemy | null = null;
  let nearestDist = Infinity;
  for (const squishy of coord.nearbySquishies) {
    const d = distance(ctx.enemy, squishy);
    if (d < nearestDist) {
      nearestDist = d;
      nearestSquishy = squishy;
    }
  }

  if (!nearestSquishy) return baseOutput;

  // 坦克移动到脆皮队友和玩家之间
  const midX = (nearestSquishy.x + ctx.player.x) / 2;
  const midY = (nearestSquishy.y + ctx.player.y) / 2;

  const dx = midX - ctx.enemy.x;
  const dy = midY - ctx.enemy.y;
  const len = Math.hypot(dx, dy) || 1;

  return {
    ...baseOutput,
    vx: dx / len,
    vy: dy / len,
    speedMultiplier: 0.85,
    shouldAttack: baseOutput.shouldAttack,
  };
}

/** 应用集火指令：多个敌人锁定同一目标 */
export function applyFocusFire(
  ctx: AIContext,
  coord: CoordinationContext,
  baseOutput: SteeringOutput
): SteeringOutput {
  if (!coord.focusTargetId) return baseOutput;

  const focusTarget = [ctx.player, ...ctx.players].find(
    (p) => p.id === coord.focusTargetId
  );

  if (!focusTarget || focusTarget.health <= 0) return baseOutput;

  // 全速冲向集火目标
  const dx = focusTarget.x - ctx.enemy.x;
  const dy = focusTarget.y - ctx.enemy.y;
  const len = Math.hypot(dx, dy) || 1;

  return {
    ...baseOutput,
    vx: dx / len,
    vy: dy / len,
    speedMultiplier: 1.1,
    shouldAttack: true,
    targetX: focusTarget.x,
    targetY: focusTarget.y,
  };
}

/** 应用掩护撤退：满血坦克主动阻挡玩家追击残血队友的路线 */
export function applyCoverRetreat(
  ctx: AIContext,
  coord: CoordinationContext,
  baseOutput: SteeringOutput
): SteeringOutput {
  if (!coord.needsCoverRetreat || !coord.coveringAllyId) return baseOutput;

  const coveringAlly = ctx.allies.find((a) => a.id === coord.coveringAllyId);
  if (!coveringAlly) return baseOutput;

  // 坦克移动到残血队友和玩家之间
  const blockX = (coveringAlly.x + ctx.player.x) / 2;
  const blockY = (coveringAlly.y + ctx.player.y) / 2;

  const dx = blockX - ctx.enemy.x;
  const dy = blockY - ctx.enemy.y;
  const len = Math.hypot(dx, dy) || 1;

  return {
    ...baseOutput,
    vx: dx / len,
    vy: dy / len,
    speedMultiplier: 1.05,
    shouldAttack: true,
  };
}

/** 应用编队协同：同类型敌人保持编队 */
export function applyFormation(
  ctx: AIContext,
  coord: CoordinationContext,
  baseOutput: SteeringOutput
): SteeringOutput {
  if (!coord.formationCenter || !coord.formationDirection) return baseOutput;

  const center = coord.formationCenter;
  const dir = coord.formationDirection;

  // 向编队中心靠拢，同时沿编队方向移动
  const toCenterX = center.x - ctx.enemy.x;
  const toCenterY = center.y - ctx.enemy.y;
  const toCenterLen = Math.hypot(toCenterX, toCenterY) || 1;

  const formationPull = 0.6;
  const directionPull = 0.4;

  const combinedX = (toCenterX / toCenterLen) * formationPull + dir.x * directionPull;
  const combinedY = (toCenterY / toCenterLen) * formationPull + dir.y * directionPull;
  const combinedLen = Math.hypot(combinedX, combinedY) || 1;

  return {
    ...baseOutput,
    vx: combinedX / combinedLen,
    vy: combinedY / combinedLen,
    speedMultiplier: clamp((baseOutput.speedMultiplier ?? 1) * 0.95, 0.7, 1.1),
    shouldAttack: baseOutput.shouldAttack,
  };
}

/** 计算编队中心 */
function calculateFormationCenter(nearbyAllies: Enemy[]): Vec2 {
  let sumX = 0;
  let sumY = 0;
  for (const ally of nearbyAllies) {
    sumX += ally.x;
    sumY += ally.y;
  }
  return {
    x: sumX / nearbyAllies.length,
    y: sumY / nearbyAllies.length,
  };
}

/** 限制撤退距离（不允许大幅度逃跑） */
export function clampRetreatDistance(
  ctx: AIContext,
  output: SteeringOutput,
  originalPosition: Vec2
): SteeringOutput {
  // 检查是否在撤退
  const dx = ctx.enemy.x - originalPosition.x;
  const dy = ctx.enemy.y - originalPosition.y;
  const distFromOrigin = Math.hypot(dx, dy);

  if (distFromOrigin > MAX_RETREAT_DISTANCE) {
    // 超出最大撤退距离，强制转向
    const backX = -dx / distFromOrigin;
    const backY = -dy / distFromOrigin;

    return {
      ...output,
      vx: backX,
      vy: backY,
      speedMultiplier: 0.8,
      shouldAttack: false,
    };
  }

  return output;
}

/** 应用所有群体协作效果 */
export function applyCoordination(
  ctx: AIContext,
  gate: AbilityGate,
  baseOutput: SteeringOutput,
  coord: CoordinationContext
): SteeringOutput {
  let output = baseOutput;

  if (gate.roleDivision) {
    output = applyRoleDivision(ctx, coord, output);
  }

  if (gate.focusFire && coord.focusTargetId) {
    output = applyFocusFire(ctx, coord, output);
  }

  if (gate.coverRetreat && coord.needsCoverRetreat) {
    output = applyCoverRetreat(ctx, coord, output);
  }

  if (gate.formationCoordination && coord.formationCenter) {
    output = applyFormation(ctx, coord, output);
  }

  return output;
}