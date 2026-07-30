import type { Enemy, Player, Projectile, Obstacle } from "../types";
import type { AIBehavior, AIContext, AIParams, SteeringOutput, DodgeDecision, WeaponCounterDecision, Vec2 } from "./types";
import { distance, normalize, clamp, angleBetween } from "../math";
import { getFlowDirection, hasLineOfSight, findOpenDirection } from "./pathfinding";
import { mapDifficultyToAIParams } from "./alpha-bridge";
import { calculateEnemyMovement, type MovementBehavior } from "@/lib/algorithms";
import { getAbilityGate, getPredictiveAimConfig, getDodgeConfig, getWaveScalingBonus, applyHeroCounterBehavior } from "./ability-gating";
import { buildCoordinationContext, applyCoordination, clampRetreatDistance } from "./coordination";
import { getAvoidHotZoneDirection } from "./learning";

/**
 * β-1 群体战术与行为决策 (创世版升级)
 *
 * 新增能力：
 * - 预判瞄准：计算玩家移动轨迹提前量
 * - 弹幕躲避：检测飞来的弹体并横向躲避
 * - 武器对策：识别玩家武器类型并调整走位策略
 * - 地形利用：利用障碍物卡视野、绕后
 * - 群体协作：角色分工+集火+掩护撤退+编队
 * - 学习适应：防守习惯识别+英雄对策+波次递增
 */

export function runEnemyAI(ctx: AIContext): SteeringOutput {
  const params = mapDifficultyToAIParams(ctx.alphaSnapshot);
  const wave = ctx.wave ?? 1;
  const gate = getAbilityGate(wave, ctx.enemy);

  // 应用波次递增难度
  const scaling = getWaveScalingBonus(wave);
  params.aggression = clamp(params.aggression + scaling.aggressionBonus, 0, 1);
  params.speedMulCap = clamp(params.speedMulCap + scaling.coordinationBonus * 0.3, 0.8, 1.5);

  // 构建群体协作上下文
  const coord = buildCoordinationContext(ctx, gate);

  // 注入到上下文
  ctx.coordination = coord;
  ctx.predictiveAim = getPredictiveAimConfig(wave, ctx.enemy, params.aggression);
  ctx.dodgeConfig = getDodgeConfig(wave, ctx.enemy, params.aggression);

  // 防守习惯识别：攻击方向避开玩家热区
  const target = selectTarget(ctx);
  const hotZoneDir = getAvoidHotZoneDirection(
    ctx.learningMemory ?? { heatmap: new Map(), evasivePatterns: [], detectedHero: null, heroConfidence: 0, totalWaves: 0, weaponUsage: new Map(), waveDifficultyBonus: 0, lastWaveUpdate: 0 },
    ctx.enemy.x, ctx.enemy.y, target.x, target.y, ctx.mapWidth, ctx.mapHeight
  );

  // 选择行为
  const behavior = selectBehavior(ctx, params, gate);

  // 英雄对策覆盖
  let finalBehavior = behavior;
  let preferredDistanceOverride: number | undefined;
  if (gate.heroCounter && ctx.heroCounter?.enabled) {
    const dist = distance(ctx.enemy, target);
    const attackRange = getAttackRange(ctx.enemy);
    const heroOverride = applyHeroCounterBehavior(
      ctx.heroCounter.strategy,
      behavior,
      dist,
      attackRange
    );
    finalBehavior = heroOverride.behavior as AIBehavior;
    preferredDistanceOverride = heroOverride.preferredDistance;
  }

  const movementBehavior = toMovementBehavior(finalBehavior);
  if (!movementBehavior) {
    const output = executeBehavior(ctx, finalBehavior, target, params, gate);
    const flocked = applyFlockingAndObstacles(ctx, output, params);
    const coordinated = applyCoordination(ctx, gate, flocked, coord);
    const clamped = applyRetreatClamp(ctx, coordinated, finalBehavior);
    return clamped;
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
      preferredDistance: preferredDistanceOverride ?? 220 * params.preferredDistanceMul,
      attackRange: getAttackRange(ctx.enemy),
      maxSpeedMultiplier: params.speedMulCap,
      time: ctx.time,
    },
  });

  const vlen = Math.hypot(output.velocity.x, output.velocity.y);
  let steering: SteeringOutput = {
    vx: vlen > 0.001 ? output.velocity.x / vlen : 0,
    vy: vlen > 0.001 ? output.velocity.y / vlen : 0,
    speedMultiplier: clamp(output.speedMultiplier, 0.6, params.speedMulCap),
    shouldAttack: output.shouldAttack,
  };

  // 弹幕躲避
  if (gate.projectileDodge && ctx.playerProjectiles && ctx.playerProjectiles.length > 0) {
    const dodge = applyDodge(ctx, steering);
    if (dodge.shouldDodge) {
      steering = {
        ...steering,
        vx: dodge.dodgeX,
        vy: dodge.dodgeY,
        speedMultiplier: (steering.speedMultiplier ?? 1) * 1.1,
      };
    }
  }

  // 预判瞄准偏移
  if (gate.predictiveAim && ctx.predictiveAim?.enabled) {
    const predicted = predictPlayerPosition(ctx, ctx.predictiveAim);
    steering.aimOffsetX = predicted.x - ctx.player.x;
    steering.aimOffsetY = predicted.y - ctx.player.y;
  }

  // 群体协作
  steering = applyCoordination(ctx, gate, steering, coord);

  // 撤退距离限制
  steering = applyRetreatClamp(ctx, steering, finalBehavior);

  return steering;
}

function toMovementBehavior(behavior: AIBehavior): MovementBehavior | null {
  switch (behavior) {
    case "chase":
    case "attack_core":
    case "capture_node":
    case "focus_fire":
    case "form_up":
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
    case "dodge":
      return "strafe";
    case "charge":
      return "intercept";
    case "surround":
    case "swarm":
    case "cover_ally":
      return "surround";
    case "predictive_aim":
      return "pursue";
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
    if (activeNodes.length > 0 && ctx.rng() < 0.25) {
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

export function selectBehavior(ctx: AIContext, params: AIParams, gate: ReturnType<typeof getAbilityGate>): AIBehavior {
  const { enemy, obstacles } = ctx;
  const target = selectTarget(ctx);
  const dist = distance(enemy, target);
  const attackRange = getAttackRange(enemy);
  const healthRatio = enemy.maxHealth > 0 ? enemy.health / enemy.maxHealth : 1;
  const aggression = params.aggression;

  // 弹幕躲避：高威胁弹体飞来时优先躲避
  if (gate.projectileDodge && ctx.playerProjectiles && ctx.playerProjectiles.length > 0) {
    const dodgeThreat = evaluateDodgeThreat(ctx);
    if (dodgeThreat.threatLevel > 0.6) {
      return "dodge";
    }
  }

  // 低血量行为
  if (healthRatio < 0.25) {
    // 掩护撤退：有队友且门控允许时，不撤退而是请求掩护
    if (gate.coverRetreat && ctx.allies.length > 0 && !enemy.isBoss) {
      const hasNearbyTank = ctx.allies.some((a) => {
        const d = distance(enemy, a);
        return d < 300 && (a.variant === "tank" || a.variant === "crusher" || a.isBoss);
      });
      if (hasNearbyTank) {
        return "keep_distance";
      }
    }
    if (obstacles.length > 0 && aggression < 0.5) return "seek_cover";
    // 限制撤退：残血不跑太远，改为保持距离
    return "keep_distance";
  }

  // 据点模式下敌人以直冲核心为主
  if (enemy.targetCore) {
    if (enemy.isBoss) return "orbit";
    if (enemy.variant === "spitter" || enemy.variant === "sniper" || enemy.variant === "artillery") {
      return dist < attackRange * 1.2 ? "strafe" : "chase";
    }
    if (enemy.variant === "tank" || enemy.variant === "crusher") return "charge";
    return "chase";
  }

  if (enemy.isBoss) return "orbit";

  // 武器对策：根据玩家武器类型调整行为
  if (gate.weaponCounter && ctx.player.weapons.length > 0) {
    const weaponDecision = evaluateWeaponCounter(ctx);
    if (weaponDecision.shouldFlank) return "flank";
    if (weaponDecision.shouldRush) return "charge";
    if (weaponDecision.shouldSpreadOut) return "strafe";
  }

  // 地形利用：有掩体可用时考虑伏击
  if (gate.terrainUtilization && obstacles.length > 0 && !hasLineOfSight(enemy.x, enemy.y, target.x, target.y, obstacles, enemy.radius)) {
    if (enemy.variant === "stalker" || enemy.variant === "runner" || enemy.variant === "raptor") {
      return "ambush";
    }
  }

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

  // 通用敌人
  if (dist < attackRange * 1.1 && healthRatio > 0.5) return "strafe";
  if (ctx.allies.length >= 5) return "surround";
  if (aggression > 0.75 && ctx.allies.length >= 3) return "flank";

  return "chase";
}

export function executeBehavior(
  ctx: AIContext,
  behavior: AIBehavior,
  target: { x: number; y: number },
  params: AIParams,
  gate: ReturnType<typeof getAbilityGate>
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
    case "dodge":
      return aiDodge(ctx, target);
    case "predictive_aim":
      return aiPredictiveAim(ctx, target);
    case "cover_ally":
      return aiCoverAlly(ctx, target);
    case "focus_fire":
      return aiFocusFire(ctx, target);
    case "form_up":
      return aiFormUp(ctx, target);
    case "attack_core":
    case "capture_node":
    case "swarm":
    case "chase":
    default:
      return aiChase(ctx, target);
  }
}

// ========================================================================
// 原有行为实现
// ========================================================================

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

  const ambushRange = 280;
  if (dist > ambushRange || !hasLineOfSight(ctx.enemy.x, ctx.enemy.y, target.x, target.y, ctx.obstacles, ctx.enemy.radius)) {
    return aiFlank(ctx, target);
  }

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

// ========================================================================
// 创世版新增行为实现
// ========================================================================

/** 弹幕躲避：检测飞来的弹体并横向躲避 */
function aiDodge(ctx: AIContext, target: { x: number; y: number }): SteeringOutput {
  const dodgeThreat = evaluateDodgeThreat(ctx);
  if (!dodgeThreat.shouldDodge) {
    return aiChase(ctx, target);
  }

  return {
    vx: dodgeThreat.dodgeX,
    vy: dodgeThreat.dodgeY,
    speedMultiplier: 1.1,
    shouldAttack: distance(ctx.enemy, target) < getAttackRange(ctx.enemy),
  };
}

/** 预判瞄准：追踪行为但带预判偏移 */
function aiPredictiveAim(ctx: AIContext, target: { x: number; y: number }): SteeringOutput {
  const predicted = ctx.predictiveAim
    ? predictPlayerPosition(ctx, ctx.predictiveAim)
    : target;

  const dir = getFlowDirection(ctx.enemy.x, ctx.enemy.y, predicted.x, predicted.y, ctx.obstacles, {
    width: ctx.mapWidth,
    height: ctx.mapHeight,
    radius: ctx.enemy.radius,
  });

  return {
    vx: dir.x,
    vy: dir.y,
    shouldAttack: true,
    targetX: predicted.x,
    targetY: predicted.y,
    aimOffsetX: predicted.x - ctx.player.x,
    aimOffsetY: predicted.y - ctx.player.y,
  };
}

/** 掩护队友：满血坦克挡在残血队友和玩家之间 */
function aiCoverAlly(ctx: AIContext, target: { x: number; y: number }): SteeringOutput {
  const coord = ctx.coordination;
  if (!coord?.coveringAllyId) return aiChase(ctx, target);

  const coveringAlly = ctx.allies.find((a) => a.id === coord.coveringAllyId);
  if (!coveringAlly) return aiChase(ctx, target);

  const blockX = (coveringAlly.x + ctx.player.x) / 2;
  const blockY = (coveringAlly.y + ctx.player.y) / 2;

  const dir = getFlowDirection(ctx.enemy.x, ctx.enemy.y, blockX, blockY, ctx.obstacles, {
    width: ctx.mapWidth,
    height: ctx.mapHeight,
    radius: ctx.enemy.radius,
  });

  return {
    vx: dir.x,
    vy: dir.y,
    speedMultiplier: 1.05,
    shouldAttack: distance(ctx.enemy, ctx.player) < getAttackRange(ctx.enemy),
  };
}

/** 集火：冲向协调指定的集火目标 */
function aiFocusFire(ctx: AIContext, target: { x: number; y: number }): SteeringOutput {
  const coord = ctx.coordination;
  if (!coord?.focusTargetId) return aiChase(ctx, target);

  const focusTarget = [ctx.player, ...ctx.players].find((p) => p.id === coord.focusTargetId);
  if (!focusTarget || focusTarget.health <= 0) return aiChase(ctx, target);

  const dir = getFlowDirection(ctx.enemy.x, ctx.enemy.y, focusTarget.x, focusTarget.y, ctx.obstacles, {
    width: ctx.mapWidth,
    height: ctx.mapHeight,
    radius: ctx.enemy.radius,
  });

  return {
    vx: dir.x,
    vy: dir.y,
    speedMultiplier: 1.1,
    shouldAttack: true,
    targetX: focusTarget.x,
    targetY: focusTarget.y,
  };
}

/** 编队：向编队中心靠拢 */
function aiFormUp(ctx: AIContext, target: { x: number; y: number }): SteeringOutput {
  const coord = ctx.coordination;
  if (!coord?.formationCenter) return aiChase(ctx, target);

  const center = coord.formationCenter;
  const dir = getFlowDirection(ctx.enemy.x, ctx.enemy.y, center.x, center.y, ctx.obstacles, {
    width: ctx.mapWidth,
    height: ctx.mapHeight,
    radius: ctx.enemy.radius,
  });

  return {
    vx: dir.x,
    vy: dir.y,
    speedMultiplier: 0.9,
    shouldAttack: distance(ctx.enemy, target) < getAttackRange(ctx.enemy),
  };
}

// ========================================================================
// 辅助函数
// ========================================================================

/** 评估弹幕威胁并生成躲避决策 */
function evaluateDodgeThreat(ctx: AIContext): DodgeDecision {
  const projectiles = ctx.playerProjectiles ?? [];
  if (projectiles.length === 0) {
    return { shouldDodge: false, dodgeX: 0, dodgeY: 0, threatProjectile: null, threatLevel: 0 };
  }

  const config = ctx.dodgeConfig ?? { enabled: true, detectionRadius: 200, reactionSpeed: 0.5, minDodgeAngle: Math.PI / 12 };
  let closestThreat: Projectile | null = null;
  let closestDist = config.detectionRadius;
  let maxThreat = 0;

  for (const p of projectiles) {
    const dx = p.x - ctx.enemy.x;
    const dy = p.y - ctx.enemy.y;
    const d = Math.hypot(dx, dy);

    // 弹体在检测范围内
    if (d < config.detectionRadius) {
      // 弹体速度方向是否朝向敌人
      const toEnemyX = ctx.enemy.x - p.x;
      const toEnemyY = ctx.enemy.y - p.y;
      const toEnemyLen = Math.hypot(toEnemyX, toEnemyY) || 1;
      const dotProduct = (p.vx * toEnemyX + p.vy * toEnemyY) / (Math.hypot(p.vx, p.vy) * toEnemyLen || 1);

      // 弹体朝敌人飞来（dotProduct > 0）
      if (dotProduct > 0.3) {
        const threat = (1 - d / config.detectionRadius) * dotProduct * (p.damage / 50);
        if (threat > maxThreat) {
          maxThreat = threat;
          closestThreat = p;
          closestDist = d;
        }
      }
    }
  }

  if (!closestThreat || maxThreat < 0.15) {
    return { shouldDodge: false, dodgeX: 0, dodgeY: 0, threatProjectile: null, threatLevel: 0 };
  }

  // 计算躲避方向：垂直于弹体飞行方向
  const perpX = -closestThreat.vy;
  const perpY = closestThreat.vx;
  const perpLen = Math.hypot(perpX, perpY) || 1;

  // 选择远离弹体的垂直方向
  const toEnemyFromProjX = ctx.enemy.x - closestThreat.x;
  const toEnemyFromProjY = ctx.enemy.y - closestThreat.y;
  const side = (perpX * toEnemyFromProjX + perpY * toEnemyFromProjY) > 0 ? 1 : -1;

  return {
    shouldDodge: true,
    dodgeX: (perpX / perpLen) * side,
    dodgeY: (perpY / perpLen) * side,
    threatProjectile: closestThreat,
    threatLevel: maxThreat,
  };
}

/** 应用弹幕躲避 */
function applyDodge(ctx: AIContext, baseOutput: SteeringOutput): DodgeDecision {
  const dodge = evaluateDodgeThreat(ctx);
  if (!dodge.shouldDodge) return dodge;

  return dodge;
}

/** 预判玩家位置 */
export function predictPlayerPosition(
  ctx: AIContext,
  config: { accuracy: number; lookAheadTime: number }
): Vec2 {
  const player = ctx.player;
  // 简单线性预测：当前位置 + 速度方向 * 预判时间
  const playerVx = player.knockbackX || 0;
  const playerVy = player.knockbackY || 0;

  const predictedX = player.x + playerVx * config.lookAheadTime * 60;
  const predictedY = player.y + playerVy * config.lookAheadTime * 60;

  // 加入噪声模拟不完美预判
  const noise = (1 - config.accuracy) * 40;
  const noiseX = (ctx.rng() - 0.5) * noise * 2;
  const noiseY = (ctx.rng() - 0.5) * noise * 2;

  return {
    x: clamp(predictedX + noiseX, ctx.enemy.radius, ctx.mapWidth - ctx.enemy.radius),
    y: clamp(predictedY + noiseY, ctx.enemy.radius, ctx.mapHeight - ctx.enemy.radius),
  };
}

/** 评估武器对策 */
function evaluateWeaponCounter(ctx: AIContext): WeaponCounterDecision {
  const weapons = ctx.player.weapons;
  if (weapons.length === 0) {
    return { preferredDistance: 160, shouldSpreadOut: false, shouldFlank: false, shouldRush: false };
  }

  const primaryWeapon = weapons[0];
  const isMelee = primaryWeapon.isMelee ?? false;
  const isAOE = !!(primaryWeapon.areaRadius && primaryWeapon.areaRadius > 80);
  const isSniper = primaryWeapon.range > 400;
  const isShotgun = primaryWeapon.count > 3 && primaryWeapon.range < 200;

  return {
    preferredDistance: isMelee ? 240 : isShotgun ? 200 : 160,
    shouldSpreadOut: isAOE,
    shouldFlank: isSniper,
    shouldRush: isSniper && ctx.enemy.variant !== "tank",
  };
}

/** 限制撤退距离 */
function applyRetreatClamp(
  ctx: AIContext,
  output: SteeringOutput,
  behavior: AIBehavior
): SteeringOutput {
  if (behavior === "retreat" || behavior === "keep_distance") {
    return clampRetreatDistance(ctx, output, { x: ctx.enemy.x, y: ctx.enemy.y });
  }
  return output;
}

// ========================================================================
// Flocking
// ========================================================================

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