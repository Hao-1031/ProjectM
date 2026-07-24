import type { Obstacle, Vec2 } from "../types";
import type { FlowFieldOptions } from "./types";
import { distance, normalize } from "../math";

/**
 * β-1 寻路与避障算法
 *
 * 提供轻量、可预测的导航系统：
 * 1. 障碍物感知：采样周围 8 个方向，选择碰撞代价最低的方向
 * 2. 动态避障：预测与障碍物的最近接近点，施加侧向力
 * 3. 流场查询：以目标为中心的 Dijkstra 势场，缓存复用
 */

interface DirectionCandidate extends Vec2 {
  score: number;
}

const DEFAULT_CELL_SIZE = 80;
const MAX_CACHE_ENTRIES = 8;

interface CachedFlowField {
  width: number;
  height: number;
  cellSize: number;
  cols: number;
  rows: number;
  targetCol: number;
  targetRow: number;
  directions: Float64Array;
  costs: Float64Array;
  obstacleMap: Uint8Array;
}

const flowFieldCache = new Map<string, CachedFlowField>();

function buildCacheKey(options: FlowFieldOptions): string {
  const cellSize = options.cellSize || DEFAULT_CELL_SIZE;
  const targetX = options.targetX ?? options.width / 2;
  const targetY = options.targetY ?? options.height / 2;
  const obstacleSig = options.obstacles
    .filter((o) => o.health > 0)
    .map((o) => `${Math.round(o.x)},${Math.round(o.y)},${Math.round(o.width)},${Math.round(o.height)}`)
    .join("|");
  return `${Math.round(targetX / cellSize)},${Math.round(targetY / cellSize)}@${options.width}x${options.height}@${cellSize}#${obstacleSig}`;
}

function pruneCache() {
  while (flowFieldCache.size > MAX_CACHE_ENTRIES) {
    const firstKey = flowFieldCache.keys().next().value;
    if (firstKey !== undefined) {
      flowFieldCache.delete(firstKey);
    }
  }
}

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
    targetX,
    targetY,
    radius: options?.radius ?? 16,
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

  // 如果当前单元无障碍，优先直行，再叠加轻微避障推力
  if (obstacleCost < 0.6) {
    const obstaclePush = avoidObstacles(x, y, baseDir, obstacles, opts.radius, 120);
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
    x: baseDir.x * 0.25 + fx * 0.75,
    y: baseDir.y * 0.25 + fy * 0.75,
  });

  const push = avoidObstacles(x, y, blend, obstacles, opts.radius, 120);
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
  lookAhead = 120
): Vec2 {
  if (obstacles.length === 0) return { x: 0, y: 0 };

  const vx = velocity.x || 0;
  const vy = velocity.y || 0;
  const speed = Math.hypot(vx, vy);
  if (speed < 0.001) return { x: 0, y: 0 };
  const dirX = vx / speed;
  const dirY = vy / speed;

  let pushX = 0;
  let pushY = 0;
  let maxStrength = 0;

  for (const obs of obstacles) {
    if (obs.health <= 0) continue;
    const halfW = obs.width / 2;
    const halfH = obs.height / 2;

    // 最近点
    const closestX = Math.max(obs.x - halfW, Math.min(x, obs.x + halfW));
    const closestY = Math.max(obs.y - halfH, Math.min(y, obs.y + halfH));
    const d = distance({ x, y }, { x: closestX, y: closestY });

    const clearance = lookAhead + radius + Math.max(halfW, halfH);
    if (d > clearance) continue;

    // 前方投影
    const toObsX = closestX - x;
    const toObsY = closestY - y;
    const proj = toObsX * dirX + toObsY * dirY;

    if (proj < -radius || proj > lookAhead + radius) continue;

    // 计算侧向躲避方向：沿速度方向， obstacle 在左则向右推，反之向左
    const perpX = -dirY;
    const perpY = dirX;
    const side = toObsX * perpX + toObsY * perpY;
    const sign = side >= 0 ? 1 : -1;

    const penetration = Math.max(0, radius + Math.min(halfW, halfH) * 0.5 - d);
    const frontal = Math.max(0, 1 - proj / lookAhead);
    const strength = frontal * (penetration + 20);

    if (strength > maxStrength) {
      maxStrength = strength;
      pushX = perpX * sign * strength;
      pushY = perpY * sign * strength;
    }
  }

  if (maxStrength === 0) return { x: 0, y: 0 };
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
      if (obs.health <= 0) continue;
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
      if (obs.health <= 0) continue;
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
  const cacheKey = buildCacheKey(options);
  const cached = flowFieldCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const cellSize = options.cellSize || DEFAULT_CELL_SIZE;
  const cols = Math.ceil(options.width / cellSize);
  const rows = Math.ceil(options.height / cellSize);
  const count = cols * rows;

  const targetX = options.targetX ?? options.width / 2;
  const targetY = options.targetY ?? options.height / 2;
  const targetCol = clamp(Math.floor(targetX / cellSize), 0, cols - 1);
  const targetRow = clamp(Math.floor(targetY / cellSize), 0, rows - 1);

  const field: CachedFlowField = {
    width: options.width,
    height: options.height,
    cellSize,
    cols,
    rows,
    targetCol,
    targetRow,
    directions: new Float64Array(count * 2),
    costs: new Float64Array(count),
    obstacleMap: new Uint8Array(count),
  };

  // 标记障碍单元并初始化代价
  const obstacleCost = 1e6;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cx = x * cellSize + cellSize / 2;
      const cy = y * cellSize + cellSize / 2;
      const cost = cellObstacleCost(cx, cy, options.obstacles, cellSize, options.radius ?? 16);
      const idx = y * cols + x;
      field.costs[idx] = cost;
      field.obstacleMap[idx] = cost >= obstacleCost ? 1 : 0;
    }
  }

  // 从目标点向外传播最短路径代价（Dijkstra / 0-1 BFS）
  const frontier: Array<{ x: number; y: number }> = [];
  const startIdx = targetRow * cols + targetCol;
  if (field.obstacleMap[startIdx]) {
    // 目标在障碍内：找最近非障碍单元作为替代目标
    let best = { col: targetCol, row: targetRow, dist: Infinity };
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const idx = y * cols + x;
        if (field.obstacleMap[idx]) continue;
        const dx = x - targetCol;
        const dy = y - targetRow;
        const d = Math.hypot(dx, dy);
        if (d < best.dist) best = { col: x, row: y, dist: d };
      }
    }
    field.costs[best.row * cols + best.col] = 0;
    frontier.push({ x: best.col, y: best.row });
  } else {
    field.costs[startIdx] = 0;
    frontier.push({ x: targetCol, y: targetRow });
  }

  const INF = Number.POSITIVE_INFINITY;
  for (let i = 0; i < count; i++) {
    if (field.obstacleMap[i]) field.costs[i] = INF;
  }

  // 使用队列进行代价传播（无权图上的 BFS，对角线代价为 sqrt(2) 近似 1.41）
  let head = 0;
  while (head < frontier.length) {
    const { x: cx, y: cy } = frontier[head++];
    const cidx = cy * cols + cx;
    const currentCost = field.costs[cidx];

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        const nidx = ny * cols + nx;
        if (field.obstacleMap[nidx]) continue;

        const stepCost = dx !== 0 && dy !== 0 ? 1.414 : 1;
        const newCost = currentCost + stepCost;
        if (newCost < field.costs[nidx]) {
          field.costs[nidx] = newCost;
          frontier.push({ x: nx, y: ny });
        }
      }
    }
  }

  // 根据代价梯度计算每个格子的方向（指向代价更低的方向）
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      if (field.obstacleMap[idx]) {
        field.directions[idx * 2] = 0;
        field.directions[idx * 2 + 1] = 0;
        continue;
      }

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
          if (field.obstacleMap[nidx]) continue;
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

  pruneCache();
  flowFieldCache.set(cacheKey, field);
  return field;
}

function cellObstacleCost(
  cx: number,
  cy: number,
  obstacles: Obstacle[],
  cellSize: number,
  radius: number
): number {
  const obstacleCost = 1e6;
  const margin = radius + cellSize * 0.25;
  for (const obs of obstacles) {
    if (obs.health <= 0) continue;
    const halfW = obs.width / 2 + margin;
    const halfH = obs.height / 2 + margin;
    const dx = Math.abs(cx - obs.x) - halfW;
    const dy = Math.abs(cy - obs.y) - halfH;
    if (dx < 0 && dy < 0) {
      return obstacleCost;
    }
  }
  return 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
