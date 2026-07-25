/**
 * 敌人移动走位算法
 *
 * 为 PvE 敌人提供可配置、可审计的移动决策：
 * - 追击 / 拦截
 * - 障碍避让与拥挤疏散
 * - 风筝（保持安全距离）
 * - 侧翼包抄
 * - 撤退
 *
 * 同时支持 2D 连续向量坐标（world units）与网格瓦片坐标（cell units），
 * 两种模式内部均直接使用传入单位，无需额外 tileSize 转换。
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface GridCoord {
  col: number;
  row: number;
}

export type CoordinateMode = "vector" | "grid";

export interface MovementObstacle {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MovementEntity {
  id: string;
  position: Vec2 | GridCoord;
  radius: number;
  speed: number;
  variant: string;
  health: number;
  maxHealth: number;
  targetCore?: boolean;
  isElite?: boolean;
  isBoss?: boolean;
}

export interface MovementTarget {
  position: Vec2 | GridCoord;
  velocity?: Vec2;
  type: "player" | "core" | "node";
}

export interface MovementAlly {
  id: string;
  position: Vec2 | GridCoord;
  radius: number;
}

export interface MovementBounds {
  width: number;
  height: number;
}

export type MovementBehavior =
  | "pursue"
  | "intercept"
  | "kite"
  | "flank"
  | "surround"
  | "avoid_crowd"
  | "retreat"
  | "strafe"
  | "seek_cover";

export interface MovementConfig {
  /** 指定行为；不指定时根据 entity 状态自动选择 */
  behavior?: MovementBehavior;
  /** 群体分离权重 */
  separationWeight?: number;
  /** 障碍避让权重 */
  obstacleWeight?: number;
  /** 边界避让权重 */
  boundaryWeight?: number;
  /** 风筝/环绕时的目标距离 */
  preferredDistance?: number;
  /** 侧翼偏移角度（弧度） */
  flankAngle?: number;
  /** 拦截提前量（秒） */
  interceptLead?: number;
  /** 攻击判定距离 */
  attackRange?: number;
  /** 0~1，越高越激进 */
  aggression?: number;
  /** 移动速度倍率上限 */
  maxSpeedMultiplier?: number;
  /** 拥挤检测半径 */
  crowdRadius?: number;
  /** 障碍避让缓冲距离 */
  obstacleBuffer?: number;
  /** 当前时间（秒），用于时间相关扰动；未提供时使用 Date.now */
  time?: number;
  /** 侧向移动频率，默认 2.0 */
  strafeFrequency?: number;
  /** 掩体探测距离，默认 120 */
  coverLookAhead?: number;
}

export interface MovementRequest {
  entity: MovementEntity;
  target: MovementTarget;
  allies: MovementAlly[];
  obstacles: MovementObstacle[];
  bounds: MovementBounds;
  coordinateMode: CoordinateMode;
  config?: MovementConfig;
}

export interface MovementForceDebug {
  pursue: Vec2;
  separation: Vec2;
  obstacle: Vec2;
  boundary: Vec2;
}

export interface EnemyMovementOutput {
  behavior: MovementBehavior;
  velocity: Vec2;
  speedMultiplier: number;
  targetPosition: Vec2;
  shouldAttack: boolean;
  forces: MovementForceDebug;
}

const DEFAULT_CONFIG: Required<MovementConfig> = {
  behavior: "pursue",
  separationWeight: 1.2,
  obstacleWeight: 2.0,
  boundaryWeight: 1.5,
  preferredDistance: 180,
  flankAngle: Math.PI / 5,
  interceptLead: 0.35,
  attackRange: 80,
  aggression: 0.5,
  maxSpeedMultiplier: 1.2,
  crowdRadius: 120,
  obstacleBuffer: 8,
  time: Date.now() / 1000,
  strafeFrequency: 2,
  coverLookAhead: 120,
};

function isGridCoord(v: Vec2 | GridCoord): v is GridCoord {
  return "col" in v && "row" in v;
}

function toVec2(v: Vec2 | GridCoord): Vec2 {
  return isGridCoord(v) ? { x: v.col, y: v.row } : { x: v.x, y: v.y };
}

function len(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

function normalize(v: Vec2): Vec2 {
  const magnitude = len(v);
  if (magnitude < 1e-6) return { x: 0, y: 0 };
  return { x: v.x / magnitude, y: v.y / magnitude };
}

function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hashSide(id: string): 1 | -1 {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return sum % 2 === 0 ? 1 : -1;
}

function rectClosestPoint(rect: MovementObstacle, point: Vec2): Vec2 {
  return {
    x: clamp(point.x, rect.x, rect.x + rect.width),
    y: clamp(point.y, rect.y, rect.y + rect.height),
  };
}

function selectBehavior(
  entity: MovementEntity,
  target: MovementTarget,
  targetPos: Vec2,
  fromPos: Vec2,
  allies: MovementAlly[],
  cfg: Required<MovementConfig>
): MovementBehavior {
  if (cfg.behavior !== "pursue") return cfg.behavior;

  const healthRatio = entity.maxHealth > 0 ? entity.health / entity.maxHealth : 1;
  const distToTarget = len(sub(targetPos, fromPos));

  if (healthRatio < 0.25 && cfg.aggression < 0.6) return "retreat";

  const variant = entity.variant;
  if (
    variant === "spitter" ||
    variant === "sniper" ||
    variant === "artillery"
  ) {
    return distToTarget < cfg.preferredDistance * 0.7 ? "kite" : "pursue";
  }

  if (variant === "runner" || variant === "raptor" || variant === "stalker") {
    return "flank";
  }
  if (variant === "tank" || variant === "crusher") return "intercept";

  if (allies.length >= 6) return "surround";
  if (allies.length >= 4) return "flank";
  if (target.velocity && len(target.velocity) > 20) return "intercept";

  return "pursue";
}

function computePursuitForce(
  from: Vec2,
  to: Vec2,
  targetVelocity?: Vec2,
  leadSeconds = 0
): Vec2 {
  let predicted = to;
  if (targetVelocity && leadSeconds > 0) {
    predicted = add(to, scale(targetVelocity, leadSeconds));
  }
  return normalize(sub(predicted, from));
}

function computeKiteForce(
  from: Vec2,
  to: Vec2,
  time: number,
  preferredDistance: number
): Vec2 {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return { x: 1, y: 0 };

  const toward = { x: dx / dist, y: dy / dist };
  if (dist > preferredDistance + 50) {
    return toward;
  }
  if (dist < preferredDistance - 50) {
    return { x: -toward.x, y: -toward.y };
  }

  const strafe = Math.sin(time * 2.4 + from.x * 0.01) > 0 ? 1 : -1;
  return normalize({
    x: -toward.y * strafe * 0.7 + toward.x * 0.15,
    y: toward.x * strafe * 0.7 + toward.y * 0.15,
  });
}

function computeFlankForce(
  from: Vec2,
  to: Vec2,
  entityId: string,
  flankAngle: number
): Vec2 {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const baseAngle = Math.atan2(dy, dx);
  const side = hashSide(entityId);
  const angle = baseAngle + flankAngle * side;
  const radius = clamp(dist * 0.6, 80, 260);

  const flankTarget = {
    x: to.x - Math.cos(angle) * radius,
    y: to.y - Math.sin(angle) * radius,
  };

  return normalize(sub(flankTarget, from));
}

function hashNumber(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h << 5) - h + id.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function computeSurroundForce(from: Vec2, to: Vec2, entityId: string): Vec2 {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const baseAngle = Math.atan2(dy, dx);

  const slice = (hashNumber(entityId) % 8) * (Math.PI / 4);
  const radius = clamp(dist * 0.5, 80, 220);

  const surroundTarget = {
    x: to.x - Math.cos(baseAngle + slice) * radius,
    y: to.y - Math.sin(baseAngle + slice) * radius,
  };

  return normalize(sub(surroundTarget, from));
}

function computeStrafeForce(
  from: Vec2,
  to: Vec2,
  time: number,
  frequency: number,
  aggression: number
): Vec2 {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return { x: 1, y: 0 };

  const toward = { x: dx / dist, y: dy / dist };
  const strafeDir = Math.sin(time * frequency + from.x * 0.01) > 0 ? 1 : -1;
  const forwardBias = aggression > 0.6 ? 0.3 : 0.1;

  return normalize({
    x: -toward.y * strafeDir + toward.x * forwardBias,
    y: toward.x * strafeDir + toward.y * forwardBias,
  });
}

function computeCoverForce(
  from: Vec2,
  to: Vec2,
  obstacles: MovementObstacle[],
  radius: number,
  lookAhead: number
): Vec2 {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  const away = { x: -dx / dist, y: -dy / dist };

  let best = away;
  let bestScore = -Infinity;

  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const dir = { x: Math.cos(angle), y: Math.sin(angle) };
    const projected = add(from, scale(dir, lookAhead));

    let coverScore = 0;
    for (const obs of obstacles) {
      const closest = rectClosestPoint(obs, projected);
      const d = Math.hypot(closest.x - projected.x, closest.y - projected.y);
      const threshold = radius + 40;
      if (d < threshold) coverScore += 1;
    }

    const alignment = dot(dir, away);
    const score = coverScore * 2 + alignment;
    if (score > bestScore) {
      bestScore = score;
      best = dir;
    }
  }

  return best;
}

function computeRetreatForce(
  from: Vec2,
  to: Vec2,
  obstacles: MovementObstacle[],
  allies: MovementAlly[],
  buffer: number
): Vec2 {
  let away = normalize(sub(from, to));
  if (len(away) < 0.1) away = { x: 1, y: 0 };

  const candidates: Vec2[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    candidates.push({ x: Math.cos(angle), y: Math.sin(angle) });
  }

  let best = away;
  let bestScore = -Infinity;
  for (const dir of candidates) {
    const projected = add(from, scale(dir, 120));
    let score = dot(dir, away);

    for (const obs of obstacles) {
      const closest = rectClosestPoint(obs, projected);
      const d = Math.hypot(closest.x - projected.x, closest.y - projected.y);
      if (d < buffer + 40) score -= 3;
    }
    for (const ally of allies) {
      const ap = toVec2(ally.position);
      const d = Math.hypot(ap.x - projected.x, ap.y - projected.y);
      if (d < 80) score -= 1.5;
    }

    if (score > bestScore) {
      bestScore = score;
      best = dir;
    }
  }

  return best;
}

function computeSeparationForce(
  from: Vec2,
  allies: MovementAlly[],
  crowdRadius: number
): Vec2 {
  const force = { x: 0, y: 0 };
  let count = 0;

  for (const ally of allies) {
    const ap = toVec2(ally.position);
    const dx = from.x - ap.x;
    const dy = from.y - ap.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1 || dist > crowdRadius) continue;

    const strength = (crowdRadius - dist) / crowdRadius;
    force.x += (dx / dist) * strength;
    force.y += (dy / dist) * strength;
    count++;
  }

  if (count === 0) return { x: 0, y: 0 };
  return normalize(force);
}

function computeObstacleForce(
  from: Vec2,
  radius: number,
  obstacles: MovementObstacle[],
  buffer: number
): Vec2 {
  const force = { x: 0, y: 0 };
  const threshold = radius + buffer + 60;

  for (const obs of obstacles) {
    const closest = rectClosestPoint(obs, from);
    const dx = from.x - closest.x;
    const dy = from.y - closest.y;
    const dist = Math.hypot(dx, dy);
    if (dist > threshold || dist < 1) continue;

    const penetration = Math.max(0, threshold - dist);
    force.x += (dx / dist) * penetration;
    force.y += (dy / dist) * penetration;
  }

  return normalize(force);
}

function computeBoundaryForce(
  from: Vec2,
  bounds: MovementBounds,
  radius: number
): Vec2 {
  const margin = radius + 60;
  const force = { x: 0, y: 0 };

  if (from.x < margin) force.x += 1;
  if (from.x > bounds.width - margin) force.x -= 1;
  if (from.y < margin) force.y += 1;
  if (from.y > bounds.height - margin) force.y -= 1;

  return normalize(force);
}

function hasLineOfSight(
  from: Vec2,
  to: Vec2,
  obstacles: MovementObstacle[],
  radius: number
): boolean {
  const steps = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 16);
  for (let i = 0; i <= steps; i++) {
    const t = i / Math.max(1, steps);
    const point = {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    };
    for (const obs of obstacles) {
      const closest = rectClosestPoint(obs, point);
      if (Math.hypot(closest.x - point.x, closest.y - point.y) < radius) {
        return false;
      }
    }
  }
  return true;
}

function resolveBehaviorForce(
  behavior: MovementBehavior,
  from: Vec2,
  to: Vec2,
  entity: MovementEntity,
  target: MovementTarget,
  cfg: Required<MovementConfig>,
  obstacles: MovementObstacle[]
): Vec2 {
  switch (behavior) {
    case "intercept":
      return computePursuitForce(from, to, target.velocity, cfg.interceptLead);
    case "kite":
      return computeKiteForce(from, to, cfg.time, cfg.preferredDistance);
    case "flank":
      return computeFlankForce(from, to, entity.id, cfg.flankAngle);
    case "surround":
      return computeSurroundForce(from, to, entity.id);
    case "strafe":
      return computeStrafeForce(from, to, cfg.time, cfg.strafeFrequency, cfg.aggression);
    case "seek_cover":
      return computeCoverForce(from, to, obstacles, entity.radius, cfg.coverLookAhead);
    case "avoid_crowd":
      return { x: 0, y: 0 };
    case "retreat":
      return computeRetreatForce(from, to, obstacles, [], cfg.obstacleBuffer);
    case "pursue":
    default:
      return computePursuitForce(from, to);
  }
}

export function calculateEnemyMovement(
  request: MovementRequest
): EnemyMovementOutput {
  const {
    entity,
    target,
    allies,
    obstacles,
    bounds,
    coordinateMode,
    config = {},
  } = request;

  const cfg: Required<MovementConfig> = { ...DEFAULT_CONFIG, ...config };

  const fromPos = toVec2(entity.position);
  const targetPos = toVec2(target.position);

  const behavior = selectBehavior(entity, target, targetPos, fromPos, allies, cfg);

  const behaviorForce = resolveBehaviorForce(
    behavior,
    fromPos,
    targetPos,
    entity,
    target,
    cfg,
    obstacles
  );

  const separation = computeSeparationForce(fromPos, allies, cfg.crowdRadius);
  const obstacle = computeObstacleForce(
    fromPos,
    entity.radius,
    obstacles,
    cfg.obstacleBuffer
  );
  const boundary = computeBoundaryForce(fromPos, bounds, entity.radius);

  const combined = normalize({
    x:
      behaviorForce.x +
      separation.x * cfg.separationWeight +
      obstacle.x * cfg.obstacleWeight +
      boundary.x * cfg.boundaryWeight,
    y:
      behaviorForce.y +
      separation.y * cfg.separationWeight +
      obstacle.y * cfg.obstacleWeight +
      boundary.y * cfg.boundaryWeight,
  });

  const dist = len(sub(targetPos, fromPos));
  const shouldAttack =
    dist <= cfg.attackRange &&
    hasLineOfSight(fromPos, targetPos, obstacles, entity.radius);

  const speedMultiplier =
    behavior === "retreat"
      ? cfg.maxSpeedMultiplier
      : behavior === "intercept"
      ? clamp(cfg.maxSpeedMultiplier * 1.05, 1, cfg.maxSpeedMultiplier)
      : 1;

  const velocity = scale(combined, entity.speed * speedMultiplier);

  return {
    behavior,
    velocity,
    speedMultiplier,
    targetPosition: targetPos,
    shouldAttack,
    forces: {
      pursue: behaviorForce,
      separation,
      obstacle,
      boundary,
    },
  };
}
