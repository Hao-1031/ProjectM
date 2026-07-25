/**
 * β-4 PVP Bot 战术 AI 算法库
 *
 * 将 PVP Bot 的完整决策链路抽象为可公开审计的纯函数：
 * 角色定位 → 目标选择 → 状态机 → 走位（追击 / 侧向 / 找掩体 / 撤退 / 重定位） →
 * 预判瞄准 → 开火决策。
 *
 * 输入输出均为普通对象，不依赖游戏运行时状态，便于在算法实验室、后台服务与
 * 单元测试中独立运行。
 */

export type BotAIRole = "assault" | "sniper" | "controller" | "roamer";

export type BotAIState =
  | "idle"
  | "chase"
  | "strafe"
  | "flee"
  | "seek_cover"
  | "reposition";

export interface BotAIWeapon {
  id: string;
  range: number;
  damage: number;
  projectileSpeed?: number;
  areaRadius?: number;
  cooldown: number;
  count?: number;
  spread?: number;
}

export interface BotAIEntity {
  id: string;
  x: number;
  y: number;
  radius: number;
  speed: number;
  maxHealth: number;
  health: number;
  teamId: string;
  weapon: BotAIWeapon;
  velocity?: { x: number; y: number };
}

export interface BotAIObstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health?: number;
}

export interface BotAIBounds {
  width: number;
  height: number;
}

export interface BotAIDifficulty {
  /** 0~1，越高越激进 */
  aggression: number;
  /** 0~1，越高越准 */
  botAccuracy: number;
  /** 反应延迟秒数 */
  botReactionDelay: number;
}

export interface BotAIConfig {
  role?: BotAIRole;
  difficulty?: BotAIDifficulty;
  /** 相对武器射程的最优距离比例，默认 0.6 */
  preferredRangeScale?: number;
  /** 盟友分离权重 */
  separationWeight?: number;
  /** 障碍物避让权重 */
  obstacleWeight?: number;
  /** 边界避让权重 */
  boundaryWeight?: number;
  /** 侧向移动频率，默认 2 */
  strafeFrequency?: number;
  /** 找掩体探测距离，默认 120 */
  coverLookAhead?: number;
  /** 当前开火冷却秒数 */
  fireCooldown?: number;
  /** 当前目标 ID，用于目标黏性 */
  currentTargetId?: string | null;
}

export interface BotAIRequest {
  self: BotAIEntity;
  /** 敌方目标列表 */
  targets: BotAIEntity[];
  /** 友方 Bot / 玩家 */
  allies: BotAIEntity[];
  /** 地图障碍物 */
  obstacles: BotAIObstacle[];
  /** 地图边界 */
  bounds: BotAIBounds;
  /** 当前游戏时间（秒） */
  time: number;
  /** 本帧时间步（秒） */
  dt: number;
  /** 随机种子，保证结果可复现 */
  rngSeed?: number;
  config?: BotAIConfig;
}

export interface BotAIOutput {
  move: { x: number; y: number };
  aim: { x: number; y: number };
  fire: boolean;
  state: BotAIState;
  role: BotAIRole;
  targetId: string | null;
  /** 0~1，对当前决策的置信度 */
  confidence: number;
  debug: {
    distance: number;
    healthRatio: number;
    optimalRange: number;
    lineOfSight: boolean;
    aimError: number;
  };
}

const DEFAULT_DIFFICULTY: BotAIDifficulty = {
  aggression: 0.55,
  botAccuracy: 0.75,
  botReactionDelay: 0.18,
};

const DEFAULT_CONFIG: Required<Omit<BotAIConfig, "role" | "currentTargetId"> & { currentTargetId: string | null }> =
  {
    difficulty: DEFAULT_DIFFICULTY,
    preferredRangeScale: 0.6,
    separationWeight: 0.6,
    obstacleWeight: 1.2,
    boundaryWeight: 1.0,
    strafeFrequency: 2,
    coverLookAhead: 120,
    fireCooldown: 0,
    currentTargetId: null,
  };

export function calculateBotAI(request: BotAIRequest): BotAIOutput {
  const { self, targets, allies, obstacles, bounds, time, rngSeed, config = {} } = request;
  const rng = createSeededRng(rngSeed ?? Math.floor(Math.random() * 2147483647));

  const cfg: Required<BotAIConfig> = {
    role: config.role ?? assignBotRole(self.weapon),
    difficulty: { ...DEFAULT_DIFFICULTY, ...config.difficulty },
    preferredRangeScale: config.preferredRangeScale ?? DEFAULT_CONFIG.preferredRangeScale,
    separationWeight: config.separationWeight ?? DEFAULT_CONFIG.separationWeight,
    obstacleWeight: config.obstacleWeight ?? DEFAULT_CONFIG.obstacleWeight,
    boundaryWeight: config.boundaryWeight ?? DEFAULT_CONFIG.boundaryWeight,
    strafeFrequency: config.strafeFrequency ?? DEFAULT_CONFIG.strafeFrequency,
    coverLookAhead: config.coverLookAhead ?? DEFAULT_CONFIG.coverLookAhead,
    fireCooldown: config.fireCooldown ?? DEFAULT_CONFIG.fireCooldown,
    currentTargetId: config.currentTargetId ?? DEFAULT_CONFIG.currentTargetId,
  };

  const params = cfg.difficulty;

  // 健康检查
  if (self.health <= 0 || self.maxHealth <= 0) {
    return buildOutput(self, { x: 0, y: 0 }, { x: 0, y: 0 }, false, "idle", cfg.role, null, params, 0, {
      distance: 0,
      healthRatio: 0,
      optimalRange: 0,
      lineOfSight: false,
      aimError: 0,
    });
  }

  const target = selectBotTarget(self, targets, cfg.role, params, cfg.currentTargetId, obstacles);

  if (!target) {
    return patrol(self, time, cfg.role, params);
  }

  const state = chooseBotState(self, target, cfg.role, params, rng);
  const move = computeBotMove(self, target, state, cfg.role, params, time, obstacles, bounds, cfg, allies);
  const aim = computeBotAim(self, target, params, rng);
  const fire = shouldBotFire(self, target, aim, params, cfg.fireCooldown);

  const dist = distance(self, target);
  const healthRatio = self.health / self.maxHealth;
  const optimalRange = getOptimalRange(self.weapon, cfg.preferredRangeScale);
  const lineOfSight = hasLineOfSight(self.x, self.y, target.x, target.y, obstacles, self.radius);
  const aimError = Math.hypot(aim.x - normalize({ x: target.x - self.x, y: target.y - self.y }).x, 0);

  const confidence = computeConfidence(dist, healthRatio, lineOfSight, aimError, params);

  return buildOutput(self, move, aim, fire, state, cfg.role, target.id, params, confidence, {
    distance: dist,
    healthRatio,
    optimalRange,
    lineOfSight,
    aimError,
  });
}

export function assignBotRole(weapon: BotAIWeapon): BotAIRole {
  if (weapon.range > 500 && weapon.damage > 40) return "sniper";
  if ((weapon.areaRadius ?? 0) > 60) return "controller";
  if ((weapon.projectileSpeed ?? 0) > 400) return "roamer";
  return "assault";
}

export function selectBotTarget(
  self: BotAIEntity,
  targets: BotAIEntity[],
  role: BotAIRole,
  params: BotAIDifficulty,
  currentTargetId: string | null,
  obstacles: BotAIObstacle[]
): BotAIEntity | null {
  const alive = targets.filter((t) => t.health > 0 && t.id !== self.id && t.teamId !== self.teamId);
  if (alive.length === 0) return null;

  let best: BotAIEntity | null = null;
  let bestScore = -Infinity;

  for (const candidate of alive) {
    const dist = distance(self, candidate);
    const healthRatio = candidate.maxHealth > 0 ? candidate.health / candidate.maxHealth : 1;
    const isCurrentTarget = candidate.id === currentTargetId;

    let score = -dist * 0.4 + (1 - healthRatio) * 300;

    if (role === "sniper") score += dist * 0.25;
    if (role === "assault") score -= dist * 0.2;
    if (role === "roamer") score += isCurrentTarget ? 80 : 0;

    if (params.aggression > 0.7) score += (1 - healthRatio) * 200;
    if (isCurrentTarget) score += 120;

    if (!hasLineOfSight(self.x, self.y, candidate.x, candidate.y, obstacles, self.radius)) {
      score -= 150;
    }

    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

export function chooseBotState(
  self: BotAIEntity,
  target: BotAIEntity,
  role: BotAIRole,
  params: BotAIDifficulty,
  rng: () => number
): BotAIState {
  const dist = distance(self, target);
  const healthRatio = self.maxHealth > 0 ? self.health / self.maxHealth : 1;
  const optimalRange = getOptimalRange(self.weapon, 0.55);

  if (healthRatio < 0.3) {
    return rng() < 0.7 ? "flee" : "seek_cover";
  }

  if (role === "sniper") {
    if (dist < optimalRange * 0.55) return "reposition";
    if (dist < optimalRange * 1.15) return "strafe";
    return "chase";
  }

  if (role === "controller") {
    if (dist < optimalRange * 0.75) return "reposition";
    return "chase";
  }

  if (role === "roamer") {
    if (dist < optimalRange * 0.65) return "strafe";
    return "chase";
  }

  // assault
  if (dist < optimalRange * 0.65) return "strafe";
  if (dist > optimalRange * 1.35) return "chase";
  return "strafe";
}

export function computeBotMove(
  self: BotAIEntity,
  target: BotAIEntity,
  state: BotAIState,
  role: BotAIRole,
  params: BotAIDifficulty,
  time: number,
  obstacles: BotAIObstacle[],
  bounds: BotAIBounds,
  config: Required<BotAIConfig>,
  allies: BotAIEntity[]
): { x: number; y: number } {
  const dx = target.x - self.x;
  const dy = target.y - self.y;
  const dist = Math.hypot(dx, dy) || 1;

  let behaviorDir: { x: number; y: number };

  switch (state) {
    case "flee":
      behaviorDir = normalize({ x: -dx / dist, y: -dy / dist });
      break;
    case "seek_cover": {
      const away = normalize({ x: -dx / dist, y: -dy / dist });
      behaviorDir = findCoverDirection(self, obstacles, away, config.coverLookAhead);
      break;
    }
    case "reposition": {
      const optimalRange = getOptimalRange(self.weapon, config.preferredRangeScale);
      const scale = dist > optimalRange ? 1 : -1;
      behaviorDir = normalize({ x: (dx / dist) * scale, y: (dy / dist) * scale });
      break;
    }
    case "chase":
      behaviorDir = normalize({ x: dx / dist, y: dy / dist });
      break;
    default: {
      // strafe
      const strafeDir = Math.sin(time * config.strafeFrequency + self.x * 0.01) > 0 ? 1 : -1;
      const tangentX = (-dy / dist) * strafeDir;
      const tangentY = (dx / dist) * strafeDir;
      const forwardBias = params.aggression > 0.6 ? 0.3 : 0.1;
      behaviorDir = normalize({
        x: tangentX + (dx / dist) * forwardBias,
        y: tangentY + (dy / dist) * forwardBias,
      });
      break;
    }
  }

  const separation = computeSeparationForce(self, allies, config.separationWeight);
  const obstacle = computeObstacleForce(self, obstacles, config.obstacleWeight);
  const boundary = computeBoundaryForce(self, bounds, config.boundaryWeight);

  const combined = normalize({
    x: behaviorDir.x + separation.x + obstacle.x + boundary.x,
    y: behaviorDir.y + separation.y + obstacle.y + boundary.y,
  });

  return combined;
}

export function findCoverDirection(
  self: BotAIEntity,
  obstacles: BotAIObstacle[],
  preferred: { x: number; y: number },
  lookAhead = 120
): { x: number; y: number } {
  let best = preferred;
  let bestScore = -Infinity;

  for (let angle = -Math.PI; angle < Math.PI; angle += Math.PI / 8) {
    const dir = { x: Math.cos(angle), y: Math.sin(angle) };
    const probeX = self.x + dir.x * lookAhead;
    const probeY = self.y + dir.y * lookAhead;

    let coverScore = 0;
    for (const obs of obstacles) {
      if ((obs.health ?? 1) <= 0) continue;
      const halfW = obs.width / 2 + self.radius;
      const halfH = obs.height / 2 + self.radius;
      const dx = Math.abs(probeX - obs.x) - halfW;
      const dy = Math.abs(probeY - obs.y) - halfH;
      const dist = Math.max(dx, dy);
      if (dist < 40) coverScore += 1;
    }

    const alignment = dir.x * preferred.x + dir.y * preferred.y;
    const score = coverScore * 2 + alignment;
    if (score > bestScore) {
      bestScore = score;
      best = dir;
    }
  }

  return best;
}

export function computeBotAim(
  self: BotAIEntity,
  target: BotAIEntity,
  params: BotAIDifficulty,
  rng: () => number
): { x: number; y: number } {
  const predictT = Math.min(params.botReactionDelay, 0.25);
  const velocity = target.velocity ?? { x: 0, y: 0 };
  const aimX = target.x + velocity.x * predictT;
  const aimY = target.y + velocity.y * predictT;

  const dx = aimX - self.x;
  const dy = aimY - self.y;
  const len = Math.hypot(dx, dy) || 1;

  const accuracy = params.botAccuracy;
  const maxSpread = (1 - accuracy) * 0.35;
  const spread = (rng() - 0.5) * 2 * maxSpread;
  const angle = Math.atan2(dy, dx) + spread;

  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export function shouldBotFire(
  self: BotAIEntity,
  target: BotAIEntity,
  aim: { x: number; y: number },
  params: BotAIDifficulty,
  fireCooldown = 0
): boolean {
  if (fireCooldown > 0) return false;

  const dist = distance(self, target);
  if (dist > self.weapon.range) return false;

  const dx = target.x - self.x;
  const dy = target.y - self.y;
  const len = Math.hypot(dx, dy) || 1;
  const dot = (aim.x * dx + aim.y * dy) / len;

  const threshold = 0.92 - params.aggression * 0.15;
  return dot > clamp(threshold, 0.75, 0.95);
}

function patrol(
  self: BotAIEntity,
  time: number,
  role: BotAIRole,
  params: BotAIDifficulty
): BotAIOutput {
  const angle = time * 0.5 + (self.id.charCodeAt(0) % 10);
  const move = { x: Math.cos(angle), y: Math.sin(angle) };
  const aim = { x: Math.cos(angle), y: Math.sin(angle) };

  return buildOutput(self, move, aim, false, "idle", role, null, params, 0.15, {
    distance: 0,
    healthRatio: self.maxHealth > 0 ? self.health / self.maxHealth : 1,
    optimalRange: getOptimalRange(self.weapon, 0.6),
    lineOfSight: false,
    aimError: 0,
  });
}

function computeSeparationForce(
  self: BotAIEntity,
  allies: BotAIEntity[],
  weight: number
): { x: number; y: number } {
  if (allies.length === 0 || weight <= 0) return { x: 0, y: 0 };

  let sx = 0;
  let sy = 0;
  for (const ally of allies) {
    if (ally.id === self.id || ally.teamId !== self.teamId) continue;
    const dx = self.x - ally.x;
    const dy = self.y - ally.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < self.radius * 4) {
      const strength = (self.radius * 4 - dist) / (self.radius * 4);
      sx += (dx / dist) * strength;
      sy += (dy / dist) * strength;
    }
  }

  return normalize({ x: sx * weight, y: sy * weight });
}

function computeObstacleForce(
  self: BotAIEntity,
  obstacles: BotAIObstacle[],
  weight: number
): { x: number; y: number } {
  if (obstacles.length === 0 || weight <= 0) return { x: 0, y: 0 };

  let ox = 0;
  let oy = 0;
  for (const obs of obstacles) {
    if ((obs.health ?? 1) <= 0) continue;
    const halfW = obs.width / 2;
    const halfH = obs.height / 2;
    const closestX = Math.max(obs.x - halfW, Math.min(self.x, obs.x + halfW));
    const closestY = Math.max(obs.y - halfH, Math.min(self.y, obs.y + halfH));
    const dx = self.x - closestX;
    const dy = self.y - closestY;
    const dist = Math.hypot(dx, dy) || 1;
    const threshold = self.radius * 8;

    if (dist < threshold) {
      const strength = ((threshold - dist) / threshold) * weight;
      ox += (dx / dist) * strength;
      oy += (dy / dist) * strength;
    }
  }

  return normalize({ x: ox, y: oy });
}

function computeBoundaryForce(
  self: BotAIEntity,
  bounds: BotAIBounds,
  weight: number
): { x: number; y: number } {
  if (weight <= 0) return { x: 0, y: 0 };

  const margin = self.radius * 4;
  let bx = 0;
  let by = 0;

  if (self.x < margin) bx += (margin - self.x) / margin;
  if (self.x > bounds.width - margin) bx -= (self.x - (bounds.width - margin)) / margin;
  if (self.y < margin) by += (margin - self.y) / margin;
  if (self.y > bounds.height - margin) by -= (self.y - (bounds.height - margin)) / margin;

  return normalize({ x: bx * weight, y: by * weight });
}

function buildOutput(
  self: BotAIEntity,
  move: { x: number; y: number },
  aim: { x: number; y: number },
  fire: boolean,
  state: BotAIState,
  role: BotAIRole,
  targetId: string | null,
  params: BotAIDifficulty,
  confidence: number,
  debug: BotAIOutput["debug"]
): BotAIOutput {
  return {
    move: normalize(move),
    aim: normalize(aim),
    fire,
    state,
    role,
    targetId,
    confidence: clamp(confidence, 0, 1),
    debug,
  };
}

function computeConfidence(
  distance: number,
  healthRatio: number,
  lineOfSight: boolean,
  aimError: number,
  params: BotAIDifficulty
): number {
  let score = 0.5;
  score += healthRatio * 0.25;
  if (lineOfSight) score += 0.15;
  score -= Math.min(distance / 1200, 0.25);
  score -= aimError * 0.3;
  score += params.aggression * 0.1;
  return clamp(score, 0, 1);
}

function getOptimalRange(weapon: BotAIWeapon, scale: number): number {
  return weapon.range * clamp(scale, 0.35, 0.85);
}

function hasLineOfSight(
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  obstacles: BotAIObstacle[],
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
      if ((obs.health ?? 1) <= 0) continue;
      const halfW = obs.width / 2 + radius;
      const halfH = obs.height / 2 + radius;
      if (
        px >= obs.x - halfW &&
        px <= obs.x + halfW &&
        py >= obs.y - halfH &&
        py <= obs.y + halfH
      ) {
        return false;
      }
    }
  }
  return true;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(v: { x: number; y: number }): { x: number; y: number } {
  const len = Math.hypot(v.x, v.y);
  if (len < 0.0001) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function createSeededRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
