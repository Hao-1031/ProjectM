import type { Player, DeathmatchBot } from "../types";
import type { BotContext, BotOutput, BotRole, BotState, AIParams } from "./types";
import { distance, normalize, clamp } from "../math";
import { hasLineOfSight } from "./pathfinding";
import { mapDifficultyToAIParams } from "./alpha-bridge";

/**
 * β-3 PVP Bot 战术 AI
 *
 * 为死亡竞赛 Bot 提供角色定位、目标选择、走位、开火决策。
 * 与 α 算法联动：高难度时 Bot 更准、反应更快、更愿意追击残血。
 */

const roleCache = new WeakMap<Player, BotRole>();
const stateCache = new WeakMap<DeathmatchBot, BotState>();

export function assignBotRole(player: Player): BotRole {
  let role = roleCache.get(player);
  if (role) return role;

  const weapon = player.weapons[0];
  if (!weapon) {
    role = "assault";
  } else if (weapon.range > 500 && weapon.damage > 40) {
    role = "sniper";
  } else if (weapon.areaRadius && weapon.areaRadius > 60) {
    role = "controller";
  } else if (weapon.projectileSpeed && weapon.projectileSpeed > 400) {
    role = "roamer";
  } else {
    role = "assault";
  }

  roleCache.set(player, role);
  return role;
}

export function runBotAI(ctx: BotContext): BotOutput {
  const params = mapDifficultyToAIParams(ctx.alphaSnapshot);
  const player = ctx.player;
  const bot = ctx.bot;

  if (player.health <= 0) {
    return { move: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, fire: false, useSkill: false, useUltimate: false };
  }

  const role = assignBotRole(player);
  const target = selectBotTarget(ctx, params, role);

  if (!target) {
    return patrol(ctx);
  }

  const state = chooseBotState(ctx, target, params, role);
  stateCache.set(bot, state);

  const move = computeBotMove(ctx, target, state, role, params);
  const aim = computeBotAim(ctx, target, params);
  const fire = shouldBotFire(ctx, target, aim, params);

  return { move, aim, fire, useSkill: false, useUltimate: false };
}

function selectBotTarget(ctx: BotContext, params: AIParams, role: BotRole): Player | null {
  const self = ctx.player;
  const all = [ctx.state.player, ...ctx.state.players].filter(
    (p) => p.id !== self.id && p.health > 0
  );
  if (all.length === 0) return null;

  let best: Player | null = null;
  let bestScore = -Infinity;

  for (const candidate of all) {
    const dist = distance(self, candidate);
    const healthRatio = candidate.maxHealth > 0 ? candidate.health / candidate.maxHealth : 1;
    const isCurrentTarget = candidate.id === ctx.bot.targetId;

    // 基础分数：越近、越残血越好
    let score = -dist * 0.4 + (1 - healthRatio) * 300;

    // 角色偏好
    if (role === "sniper") score += dist * 0.3; // 狙击喜欢远处
    if (role === "assault") score -= dist * 0.2; // 突击喜欢近处
    if (role === "roamer") score += (isCurrentTarget ? 80 : 0); // 游击黏人

    // 难度越高越喜欢残血和连杀目标
    if (params.aggression > 0.7) score += (1 - healthRatio) * 200;

    // 保持当前目标少许黏性，避免频繁切换
    if (isCurrentTarget) score += 120;

    // 躲在障碍物后的目标扣分
    if (!hasLineOfSight(self.x, self.y, candidate.x, candidate.y, ctx.state.map.obstacles, self.radius)) {
      score -= 150;
    }

    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  if (best) ctx.bot.targetId = best.id;
  return best;
}

function chooseBotState(ctx: BotContext, target: Player, params: AIParams, role: BotRole): BotState {
  const self = ctx.player;
  const dist = distance(self, target);
  const healthRatio = self.maxHealth > 0 ? self.health / self.maxHealth : 1;
  const weapon = self.weapons[0];
  const optimalRange = weapon?.range ? weapon.range * 0.55 : 220;

  if (healthRatio < 0.3) {
    return ctx.rng() < 0.7 ? "flee" : "seek_cover";
  }

  if (role === "sniper") {
    if (dist < optimalRange * 0.6) return "reposition";
    if (dist < optimalRange * 1.2) return "strafe";
    return "chase";
  }

  if (role === "controller") {
    if (dist < optimalRange * 0.8) return "reposition";
    return "chase";
  }

  if (role === "roamer") {
    if (dist < optimalRange * 0.7) return "strafe";
    return "chase";
  }

  // assault
  if (dist < optimalRange * 0.7) return "strafe";
  if (dist > optimalRange * 1.4) return "chase";
  return "strafe";
}

function computeBotMove(
  ctx: BotContext,
  target: Player,
  state: BotState,
  role: BotRole,
  params: AIParams
): { x: number; y: number } {
  const self = ctx.player;
  const dx = target.x - self.x;
  const dy = target.y - self.y;
  const dist = Math.hypot(dx, dy) || 1;

  if (state === "flee") {
    return normalize({ x: -dx / dist, y: -dy / dist });
  }

  if (state === "seek_cover") {
    // 找远离目标且接近障碍物的方向
    const away = normalize({ x: -dx / dist, y: -dy / dist });
    return findCoverDirection(ctx, away);
  }

  if (state === "reposition") {
    const weapon = self.weapons[0];
    const optimalRange = weapon?.range ? weapon.range * 0.6 : 260;
    const scale = dist > optimalRange ? 1 : -1;
    return normalize({ x: (dx / dist) * scale, y: (dy / dist) * scale });
  }

  if (state === "chase") {
    return normalize({ x: dx / dist, y: dy / dist });
  }

  // strafe：沿目标切向移动，偶尔向目标靠近
  const strafeDir = Math.sin(ctx.state.time * 2 + self.x * 0.01) > 0 ? 1 : -1;
  const tangentX = (-dy / dist) * strafeDir;
  const tangentY = (dx / dist) * strafeDir;

  // 高难度时 strafe 更积极穿插
  const forwardBias = params.aggression > 0.6 ? 0.3 : 0.1;
  return normalize({
    x: tangentX + (dx / dist) * forwardBias,
    y: tangentY + (dy / dist) * forwardBias,
  });
}

function findCoverDirection(ctx: BotContext, preferred: { x: number; y: number }): { x: number; y: number } {
  const self = ctx.player;
  const obstacles = ctx.state.map.obstacles;
  let best = preferred;
  let bestScore = -Infinity;

  for (let angle = -Math.PI; angle < Math.PI; angle += Math.PI / 8) {
    const dir = { x: Math.cos(angle), y: Math.sin(angle) };
    const probeX = self.x + dir.x * 120;
    const probeY = self.y + dir.y * 120;

    let coverScore = 0;
    for (const obs of obstacles) {
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

function computeBotAim(ctx: BotContext, target: Player, params: AIParams): { x: number; y: number } {
  const self = ctx.player;
  const weapon = self.weapons[0];

  // 预判：根据目标速度预测下一帧位置
  const reactionDelay = params.botReactionDelay;
  const predictT = Math.min(reactionDelay, 0.25);
  const aimX = target.x + (target.knockbackX ?? 0) * predictT;
  const aimY = target.y + (target.knockbackY ?? 0) * predictT;

  const dx = aimX - self.x;
  const dy = aimY - self.y;
  const len = Math.hypot(dx, dy) || 1;

  // 根据 botAccuracy 加入随机散布
  const accuracy = params.botAccuracy;
  const maxSpread = (1 - accuracy) * 0.35; // 弧度
  const spread = (ctx.rng() - 0.5) * 2 * maxSpread;
  const angle = Math.atan2(dy, dx) + spread;

  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function shouldBotFire(
  ctx: BotContext,
  target: Player,
  aim: { x: number; y: number },
  params: AIParams
): boolean {
  const self = ctx.player;
  const weapon = self.weapons[0];
  if (!weapon) return false;

  const dist = distance(self, target);
  if (dist > weapon.range) return false;

  if (ctx.bot.fireTimer > 0) return false;

  // 瞄准精度检查：aim 向量与到目标的向量夹角
  const dx = target.x - self.x;
  const dy = target.y - self.y;
  const len = Math.hypot(dx, dy) || 1;
  const dot = (aim.x * dx + aim.y * dy) / len;

  // 高难度更容易开火
  const threshold = 0.92 - params.aggression * 0.15;
  return dot > clamp(threshold, 0.75, 0.95);
}

function patrol(ctx: BotContext): BotOutput {
  const self = ctx.player;
  const angle = ctx.state.time * 0.5 + (self.id.charCodeAt(0) % 10);
  return {
    move: { x: Math.cos(angle), y: Math.sin(angle) },
    aim: { x: Math.cos(angle), y: Math.sin(angle) },
    fire: false,
    useSkill: false,
    useUltimate: false,
  };
}
