import type { Obstacle, Vec2 } from "../types";
import type { FlowFieldOptions } from "./types";
import { distance, normalize } from "../math";

/**
 * β-1 寻路与避障算法
 *
 * 提供轻量、可预测的导航系统：
 * 1. 障碍物感知：采样周围 8 个方向，选择碰撞代价最低的方向
 * 2. 动态避障：预测与障碍物的最近接近点，施加侧向力
 * 3. 流场查询：缓存式方向查询，支持大量敌人同时调用
 */

interface DirectionCandidate extends Vec2 {
  score: number;
}

const DEFAULT_CELL_SIZE = 80;

interface CachedFlowField {
  width: number;
  height: number;
  cellSize: number;
  cols: number;
  rows: number;
  directions: Float64Array;
  costs: Float64Array;
  obstacleMap: Uint8Array;
}

const flowFieldCache = new WeakMap<object, CachedFlowField>();

/**
 * 获取目标方向的流场导航方向
 */
export function getFlowDirection(
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  obstacles: Obstacle[],
  options?: Partial<FlowFieldOptions>
): Vec2 {
  const opts: FlowFieldOptions = {
    width: options?.width ?? 2400,
    height: options?.height ?? 1800,
    cellSize: options?.cellSize ?? DEFAULT_CELL_SIZE,
    obstacles,
  };

  const field = ensureFlowField(opts);
  const baseDir = normalize({ x: targetX - x, y: targetY - y });

  const ix = Math.floor(x / field.cellSize);
  const iy = Math.floor(y / field.cellSize);
  if (ix < 0 || ix >= field.cols || iy < 0 || iy >= field.rows) {
    return baseDir;
  }

  const idx = iy * field.cols + ix;
  const obstacleCost = field.costs[idx];

  // 如果当前单元无障碍或目标方向不碰撞，直接走
  if (obstacleCost < 0.5) {
    const obstaclePush = avoidObstacles(x, y, baseDir, obstacles);
    if (obstaclePush.x !== 0 || obstaclePush.y !== 0) {
      return normalize({
        x: baseDir.x + obstaclePush.x * 1.2,
        y: baseDir.y + obstaclePush.y * 1.2,
      });
    }
    return baseDir;
  }

  // 否则沿流场方向绕过障碍
  const fx = field.directions[idx * 2];
  const fy = field.directions[idx * 2 + 1];

  const blend = normalize({
    x: baseDir.x * 0.35 + fx * 0.65,
    y: baseDir.y * 0.35 + fy * 0.65,
  });

  const push = avoidObstacles(x, y, blend, obstacles);
  if (push.x === 0 && push.y === 0) return blend;

  return normalize({
    x: blend.x + push.x * 1.5,
    y: blend.y + push.y * 1.5,
  });
}

/**
 * 预测性障碍物避让：对前方扇形区域采样，返回垂直于障碍面的推力
 */
export function avoidObstacles(
  x: number,
  y: number,
  velocity: Vec2,
  obstacles: Obstacle[],
  radius = 16,
  lookAhead = 90
): Vec2 {
  if (obstacles.length === 0) return { x: 0, y: 0 };

  const vx = velocity.x || 0;
  const vy = velocity.y || 0;
  const speed = Math.hypot(vx, vy);
  const dirX = speed > 0.001 ? vx / speed : 0;
  const dirY = speed > 0.001 ? vy / speed : -1;

  let pushX = 0;
  let pushY = 0;
  let minPenetration = Infinity;

  for (const obs of obstacles) {
    const halfW = obs.width / 2;
    const halfH = obs.height / 2;

    // 最近点
    const closestX = Math.max(obs.x - halfW, Math.min(x, obs.x + halfW));
    const closestY = Math.max(obs.y - halfH, Math.min(y, obs.y + halfH));
    const d = distance({ x, y }, { x: closestX, y: closestY });

    if (d > lookAhead + radius + halfW + halfH) continue;

    // 前方投影
    const toObsX = closestX - x;
    const toObsY = closestY - y;
    const proj = toObsX * dirX + toObsY * dirY;

    if (proj < 0 || proj > lookAhead) continue;

    // 计算侧向躲避方向
    const perpX = -dirY;
    const perpY = dirX;
    const side = toObsX * perpX + toObsY * perpY;
    const sign = side >= 0 ? 1 : -1;

    const penetration = Math.max(0, radius + halfW + halfH - d);
    const strength = (1 - proj / lookAhead) * penetration;

    if (penetration < minPenetration) {
      minPenetration = penetration;
      pushX = perpX * sign * strength;
      pushY = perpY * sign * strength;
    }
  }

  return normalize({ x: pushX, y: pushY });
}

/**
 * 判断从 (x,y) 到目标是否直线可见（无大型障碍物遮挡）
 */
export function hasLineOfSight(
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  obstacles: Obstacle[],
  radius = 12
): boolean {
  const dx = targetX - x;
  const dy = targetY - y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return true;

  const steps = Math.ceil(len / 30);
  const stepX = dx / steps;
  const stepY = dy / steps;

  for (let i = 1; i < steps; i++) {
    const px = x + stepX * i;
    const py = y + stepY * i;
    for (const obs of obstacles) {
      const halfW = obs.width / 2 + radius;
      const halfH = obs.height / 2 + radius;
      if (px >= obs.x - halfW && px <= obs.x + halfW && py >= obs.y - halfH && py <= obs.y + halfH) {
        return false;
      }
    }
  }
  return true;
}

/**
 * 寻找最近的未占位置（用于群体散开）
 */
export function findOpenDirection(
  x: number,
  y: number,
  obstacles: Obstacle[],
  allies: { x: number; y: number; radius: number }[],
  preferredDir: Vec2,
  radius = 16
): Vec2 {
  const candidates: DirectionCandidate[] = [];
  for (let angle = -Math.PI; angle < Math.PI; angle += Math.PI / 8) {
    const dir = { x: Math.cos(angle), y: Math.sin(angle) };
    const testX = x + dir.x * (radius * 3);
    const testY = y + dir.y * (radius * 3);

    let blocked = false;
    for (const obs of obstacles) {
      const halfW = obs.width / 2 + radius;
      const halfH = obs.height / 2 + radius;
      if (testX >= obs.x - halfW && testX <= obs.x + halfW && testY >= obs.y - halfH && testY <= obs.y + halfH) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    let allyPenalty = 0;
    for (const ally of allies) {
      const d = distance({ x: testX, y: testY }, ally);
      if (d < radius * 4) allyPenalty += (radius * 4 - d) / (radius * 4);
    }

    const alignment = dir.x * preferredDir.x + dir.y * preferredDir.y;
    candidates.push({ x: dir.x, y: dir.y, score: alignment * 2 - allyPenalty });
  }

  if (candidates.length === 0) return preferredDir;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

function ensureFlowField(options: FlowFieldOptions): CachedFlowField {
  const cacheKey = options as object;
  const cached = flowFieldCache.get(cacheKey);
  if (cached && cached.width === options.width && cached.height === options.height) {
    return cached;
  }

  const cellSize = options.cellSize || DEFAULT_CELL_SIZE;
  const cols = Math.ceil(options.width / cellSize);
  const rows = Math.ceil(options.height / cellSize);
  const count = cols * rows;

  const field: CachedFlowField = {
    width: options.width,
    height: options.height,
    cellSize,
    cols,
    rows,
    directions: new Float64Array(count * 2),
    costs: new Float64Array(count),
    obstacleMap: new Uint8Array(count),
  };

  // 标记障碍单元
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cx = x * cellSize + cellSize / 2;
      const cy = y * cellSize + cellSize / 2;
      field.costs[y * cols + x] = cellObstacleCost(cx, cy, options.obstacles, cellSize);
      field.obstacleMap[y * cols + x] = field.costs[y * cols + x] > 0.5 ? 1 : 0;
    }
  }

  // 计算远离障碍的方向（梯度下降）
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      if (field.obstacleMap[idx]) {
        field.directions[idx * 2] = 0;
        field.directions[idx * 2 + 1] = 0;
        continue;
      }

      // 采样周围 8 格代价，指向代价最低方向
      let bestX = 0;
      let bestY = 0;
      let bestCost = field.costs[idx];

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
          const nidx = ny * cols + nx;
          if (field.costs[nidx] < bestCost) {
            bestCost = field.costs[nidx];
            bestX = dx;
            bestY = dy;
          }
        }
      }

      const len = Math.hypot(bestX, bestY);
      if (len > 0) {
        field.directions[idx * 2] = bestX / len;
        field.directions[idx * 2 + 1] = bestY / len;
      } else {
        field.directions[idx * 2] = 0;
        field.directions[idx * 2 + 1] = 0;
      }
    }
  }

  flowFieldCache.set(cacheKey, field);
  return field;
}

function cellObstacleCost(cx: number, cy: number, obstacles: Obstacle[], cellSize: number): number {
  let cost = 0;
  for (const obs of obstacles) {
    const halfW = obs.width / 2 + cellSize * 0.4;
    const halfH = obs.height / 2 + cellSize * 0.4;
    const dx = Math.abs(cx - obs.x) - halfW;
    const dy = Math.abs(cy - obs.y) - halfH;
    const dist = Math.max(dx, dy);
    if (dist < 0) {
      cost = Math.max(cost, 1 + Math.min(-dist / cellSize, 2));
    } else if (dist < cellSize) {
      cost = Math.max(cost, 1 - dist / cellSize);
    }
  }
  return Math.min(cost, 3);
}
