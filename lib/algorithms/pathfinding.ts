/**
 * β-5 A* 寻路算法 (Pathfinding A*)
 *
 * 为敌人和 Bot 提供基于网格的最优路径规划。
 * 支持障碍物避让、动态权重、路径平滑与可审计的成本计算。
 * 输出完整路径节点、成本分解与是否可到达判定。
 */

export interface PathNode {
  x: number;
  y: number;
}

export interface PathObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PathfindingConfig {
  /** 网格单元大小 */
  cellSize: number;
  /** 是否允许对角线移动 */
  allowDiagonal: boolean;
  /** 对角线移动成本倍率 */
  diagonalCostMultiplier: number;
  /** 启发式权重（>1 加速搜索，但可能非最优） */
  heuristicWeight: number;
  /** 最大搜索节点数 */
  maxNodes: number;
  /** 是否返回平滑路径 */
  smoothPath: boolean;
  /** 平滑迭代次数 */
  smoothIterations: number;
}

export interface PathfindingResult {
  /** 从起点到终点的路径节点列表 */
  path: PathNode[];
  /** 路径总成本 */
  totalCost: number;
  /** 搜索花费的时间(ms) */
  searchTimeMs: number;
  /** 搜索过的节点数 */
  nodesExplored: number;
  /** 是否找到路径 */
  found: boolean;
  /** 失败原因 */
  failureReason?: string;
  /** 路径长度 */
  pathLength: number;
  /** 是否经过平滑处理 */
  smoothed: boolean;
}

const DEFAULT_CONFIG: PathfindingConfig = {
  cellSize: 32,
  allowDiagonal: true,
  diagonalCostMultiplier: 1.414,
  heuristicWeight: 1.0,
  maxNodes: 5000,
  smoothPath: true,
  smoothIterations: 3,
};

interface AStarNode {
  col: number;
  row: number;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function heuristic(a: PathNode, b: PathNode, diagonal: boolean): number {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  if (diagonal) {
    return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy);
  }
  return dx + dy;
}

function isCellBlocked(
  col: number,
  row: number,
  cellSize: number,
  obstacles: PathObstacle[],
  entityRadius: number
): boolean {
  const cx = col * cellSize + cellSize / 2;
  const cy = row * cellSize + cellSize / 2;
  const halfCell = cellSize / 2;

  for (const obs of obstacles) {
    const obsLeft = obs.x - entityRadius;
    const obsRight = obs.x + obs.width + entityRadius;
    const obsTop = obs.y - entityRadius;
    const obsBottom = obs.y + obs.height + entityRadius;

    const cellLeft = cx - halfCell;
    const cellRight = cx + halfCell;
    const cellTop = cy - halfCell;
    const cellBottom = cy + halfCell;

    if (
      cellLeft < obsRight &&
      cellRight > obsLeft &&
      cellTop < obsBottom &&
      cellBottom > obsTop
    ) {
      return true;
    }
  }
  return false;
}

function worldToGrid(x: number, y: number, cellSize: number): { col: number; row: number } {
  return {
    col: Math.floor(x / cellSize),
    row: Math.floor(y / cellSize),
  };
}

function gridToWorld(col: number, row: number, cellSize: number): PathNode {
  return {
    x: col * cellSize + cellSize / 2,
    y: row * cellSize + cellSize / 2,
  };
}

function getNeighbors(
  node: AStarNode,
  gridW: number,
  gridH: number,
  allowDiagonal: boolean
): { col: number; row: number; cost: number }[] {
  const neighbors: { col: number; row: number; cost: number }[] = [];
  const { col, row } = node;

  // 正交方向
  const ortho = [
    { dc: 0, dr: -1 },
    { dc: 1, dr: 0 },
    { dc: 0, dr: 1 },
    { dc: -1, dr: 0 },
  ];

  for (const { dc, dr } of ortho) {
    const nc = col + dc;
    const nr = row + dr;
    if (nc >= 0 && nc < gridW && nr >= 0 && nr < gridH) {
      neighbors.push({ col: nc, row: nr, cost: 1 });
    }
  }

  if (allowDiagonal) {
    const diag = [
      { dc: -1, dr: -1 },
      { dc: 1, dr: -1 },
      { dc: -1, dr: 1 },
      { dc: 1, dr: 1 },
    ];
    for (const { dc, dr } of diag) {
      const nc = col + dc;
      const nr = row + dr;
      if (nc >= 0 && nc < gridW && nr >= 0 && nr < gridH) {
        neighbors.push({ col: nc, row: nr, cost: Math.SQRT2 });
      }
    }
  }

  return neighbors;
}

function smoothPath(
  path: PathNode[],
  obstacles: PathObstacle[],
  entityRadius: number,
  iterations: number
): PathNode[] {
  if (path.length <= 2) return path;

  let smoothed = [...path];

  for (let iter = 0; iter < iterations; iter++) {
    const newPath = [smoothed[0]];

    for (let i = 1; i < smoothed.length - 1; i++) {
      const prev = newPath[newPath.length - 1];
      const next = smoothed[i + 1];
      const current = smoothed[i];

      // 检查是否可以直接从 prev 到 next（跳过 current）
      const midX = (prev.x + next.x) / 2;
      const midY = (prev.y + next.y) / 2;
      let blocked = false;

      for (const obs of obstacles) {
        const obsLeft = obs.x - entityRadius;
        const obsRight = obs.x + obs.width + entityRadius;
        const obsTop = obs.y - entityRadius;
        const obsBottom = obs.y + obs.height + entityRadius;

        if (
          midX < obsRight &&
          midX > obsLeft &&
          midY < obsBottom &&
          midY > obsTop
        ) {
          blocked = true;
          break;
        }
      }

      if (!blocked) {
        // 可以直接跳过，用中点
        newPath.push({ x: midX, y: midY });
      } else {
        // 保留当前点
        newPath.push(current);
      }
    }

    newPath.push(smoothed[smoothed.length - 1]);
    smoothed = newPath;
  }

  return smoothed;
}

function calculatePathCost(path: PathNode[]): number {
  let cost = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    cost += Math.hypot(dx, dy);
  }
  return round2(cost);
}

export function findPath(
  start: PathNode,
  end: PathNode,
  bounds: { width: number; height: number },
  obstacles: PathObstacle[],
  entityRadius = 16,
  config: Partial<PathfindingConfig> = {}
): PathfindingResult {
  const startTime = performance.now();
  const cfg: PathfindingConfig = { ...DEFAULT_CONFIG, ...config };

  const gridW = Math.ceil(bounds.width / cfg.cellSize);
  const gridH = Math.ceil(bounds.height / cfg.cellSize);

  const startGrid = worldToGrid(start.x, start.y, cfg.cellSize);
  const endGrid = worldToGrid(end.x, end.y, cfg.cellSize);

  // 边界检查
  if (
    startGrid.col < 0 || startGrid.col >= gridW ||
    startGrid.row < 0 || startGrid.row >= gridH ||
    endGrid.col < 0 || endGrid.col >= gridW ||
    endGrid.row < 0 || endGrid.row >= gridH
  ) {
    return {
      path: [start],
      totalCost: 0,
      searchTimeMs: round2(performance.now() - startTime),
      nodesExplored: 0,
      found: false,
      failureReason: "起点或终点超出地图边界",
      pathLength: 0,
      smoothed: false,
    };
  }

  if (isCellBlocked(endGrid.col, endGrid.row, cfg.cellSize, obstacles, entityRadius)) {
    return {
      path: [start],
      totalCost: 0,
      searchTimeMs: round2(performance.now() - startTime),
      nodesExplored: 0,
      found: false,
      failureReason: "终点被障碍物阻挡，无法到达",
      pathLength: 0,
      smoothed: false,
    };
  }

  const openSet: AStarNode[] = [];
  const closedSet = new Set<string>();

  const startNode: AStarNode = {
    col: startGrid.col,
    row: startGrid.row,
    g: 0,
    h: heuristic(gridToWorld(startGrid.col, startGrid.row, cfg.cellSize), end, cfg.allowDiagonal) * cfg.heuristicWeight,
    f: 0,
    parent: null,
  };
  startNode.f = startNode.g + startNode.h;

  openSet.push(startNode);
  let nodesExplored = 0;

  while (openSet.length > 0 && nodesExplored < cfg.maxNodes) {
    // 找到 f 最小的节点
    let bestIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[bestIdx].f) {
        bestIdx = i;
      }
    }

    const current = openSet[bestIdx];
    openSet.splice(bestIdx, 1);
    nodesExplored++;

    const key = `${current.col},${current.row}`;
    if (closedSet.has(key)) continue;
    closedSet.add(key);

    // 到达目标
    if (current.col === endGrid.col && current.row === endGrid.row) {
      // 重建路径
      const path: PathNode[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift(gridToWorld(node.col, node.row, cfg.cellSize));
        node = node.parent;
      }

      // 路径首尾使用精确坐标
      path[0] = { x: start.x, y: start.y };
      path[path.length - 1] = { x: end.x, y: end.y };

      let finalPath = path;
      if (cfg.smoothPath) {
        finalPath = smoothPath(path, obstacles, entityRadius, cfg.smoothIterations);
      }

      const totalCost = calculatePathCost(finalPath);

      return {
        path: finalPath,
        totalCost,
        searchTimeMs: round2(performance.now() - startTime),
        nodesExplored,
        found: true,
        pathLength: finalPath.length,
        smoothed: cfg.smoothPath,
      };
    }

    const neighbors = getNeighbors(current, gridW, gridH, cfg.allowDiagonal);

    for (const { col, row, cost } of neighbors) {
      const nKey = `${col},${row}`;
      if (closedSet.has(nKey)) continue;

      if (isCellBlocked(col, row, cfg.cellSize, obstacles, entityRadius)) {
        closedSet.add(nKey);
        continue;
      }

      const moveCost = cost * cfg.cellSize;
      const g = current.g + moveCost;
      const worldPos = gridToWorld(col, row, cfg.cellSize);
      const h = heuristic(worldPos, end, cfg.allowDiagonal) * cfg.heuristicWeight;
      const f = g + h;

      const existingIdx = openSet.findIndex((n) => n.col === col && n.row === row);
      if (existingIdx >= 0) {
        if (g < openSet[existingIdx].g) {
          openSet[existingIdx].g = g;
          openSet[existingIdx].f = f;
          openSet[existingIdx].parent = current;
        }
      } else {
        openSet.push({ col, row, g, h, f, parent: current });
      }
    }
  }

  const timeMs = round2(performance.now() - startTime);

  return {
    path: [start],
    totalCost: 0,
    searchTimeMs: timeMs,
    nodesExplored,
    found: false,
    failureReason: nodesExplored >= cfg.maxNodes ? "搜索节点数超限，路径可能非常长" : "无法找到可达路径",
    pathLength: 0,
    smoothed: false,
  };
}

/**
 * 批量寻路：为多个敌人同时计算路径，输出汇总报告
 */
export function batchFindPath(
  requests: {
    start: PathNode;
    end: PathNode;
    entityRadius?: number;
  }[],
  bounds: { width: number; height: number },
  obstacles: PathObstacle[],
  config: Partial<PathfindingConfig> = {}
): { results: PathfindingResult[]; totalTimeMs: number; successRate: number } {
  const startTime = performance.now();
  const results = requests.map((req) =>
    findPath(req.start, req.end, bounds, obstacles, req.entityRadius ?? 16, config)
  );
  const totalTimeMs = round2(performance.now() - startTime);
  const successCount = results.filter((r) => r.found).length;
  return {
    results,
    totalTimeMs,
    successRate: round2(requests.length > 0 ? successCount / requests.length : 0),
  };
}