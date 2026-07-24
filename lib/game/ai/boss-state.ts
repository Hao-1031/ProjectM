import type { Enemy, Player } from "../types";
import type { AIContext, AIParams, BossBehaviorNode, BossStateId, SteeringOutput } from "./types";
import { distance, normalize, clamp } from "../math";
import { getFlowDirection, hasLineOfSight } from "./pathfinding";
import { mapDifficultyToAIParams } from "./alpha-bridge";

/**
 * β-2 Boss 分层状态机
 *
 * 在现有 Boss 阶段切换基础上，增加行为状态选择：
 * - 顶层：由血量阈值驱动 phase 切换（复用 engine 中的 checkBossPhaseTransition）
 * - 中层：HFSM 选择当前行为（chase / keep_distance / summon / charge / enrage）
 * - 底层：向 engine 输出 steering + 技能触发信号
 *
 * 输出通过 SteeringOutput 的 shouldUseSkill / shouldUseUltimate 通知 engine。
 */

interface BossState {
  id: BossStateId;
  enteredAt: number;
  skillTimers: Record<string, number>;
}

const bossStates = new WeakMap<Enemy, BossState>();

export function runBossAI(ctx: AIContext): SteeringOutput {
  const params = mapDifficultyToAIParams(ctx.alphaSnapshot);
  const state = ensureBossState(ctx.enemy);
  const target = selectBossTarget(ctx);

  const nodes = buildBehaviorNodes(ctx, params);
  const eligible = nodes.filter((n) => n.condition(ctx));

  if (eligible.length === 0) {
    return buildChaseOutput(ctx, target, params);
  }

  // 选择权重最高且与当前状态不同的节点，避免频繁抖动
  eligible.sort((a, b) => b.weight - a.weight);
  const chosen = eligible[0]!;

  if (chosen.id !== state.id) {
    state.id = chosen.id;
    state.enteredAt = ctx.time;
  }

  const output = chosen.execute(ctx);
  return {
    ...output,
    speedMultiplier: clamp((output.speedMultiplier ?? 1) * params.speedMulCap, 0.7, params.speedMulCap),
    shouldUseSkill: shouldUseSkill(ctx, state, params),
    shouldUseUltimate: shouldUseUltimate(ctx, state, params),
  };
}

export function resetBossState(enemy: Enemy): void {
  bossStates.delete(enemy);
}

function ensureBossState(enemy: Enemy): BossState {
  let state = bossStates.get(enemy);
  if (!state) {
    state = {
      id: "phase1",
      enteredAt: 0,
      skillTimers: {},
    };
    bossStates.set(enemy, state);
  }
  return state;
}

function buildBehaviorNodes(ctx: AIContext, params: AIParams): BossBehaviorNode[] {
  const healthRatio = ctx.enemy.maxHealth > 0 ? ctx.enemy.health / ctx.enemy.maxHealth : 1;
  const distToTarget = distance(ctx.enemy, ctx.player);
  const aggression = params.aggression;

  return [
    {
      id: "enrage",
      weight: 100,
      condition: () => healthRatio < 0.25 && aggression > 0.5,
      execute: (c) => buildChargeOutput(c, ctx.player, params, 1.25),
    },
    {
      id: "summon",
      weight: 70,
      condition: () => healthRatio < 0.7 && ctx.enemy.phase >= 2 && hasLineOfSight(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y, ctx.obstacles, ctx.enemy.radius),
      execute: (c) => buildKeepDistanceOutput(c, ctx.player, params, 320),
    },
    {
      id: "retreat",
      weight: 60,
      condition: () => healthRatio < 0.35 && distToTarget < 180,
      execute: (c) => buildRetreatOutput(c, ctx.player, params),
    },
    {
      id: "keep_distance",
      weight: 50,
      condition: () => ctx.enemy.phase >= 2 && distToTarget < 220,
      execute: (c) => buildKeepDistanceOutput(c, ctx.player, params, 260),
    },
    {
      id: "charge",
      weight: 40,
      condition: () => distToTarget > 280 && aggression > 0.6,
      execute: (c) => buildChargeOutput(c, ctx.player, params, 1.15),
    },
    {
      id: "phase1",
      weight: 10,
      condition: () => true,
      execute: (c) => buildOrbitOutput(c, ctx.player, params, 240),
    },
  ];
}

function selectBossTarget(ctx: AIContext): Player {
  // Boss 优先攻击伤害输出最高或最近的玩家
  const candidates = [ctx.player, ...ctx.players].filter((p) => p.health > 0);
  if (candidates.length === 0) return ctx.player;

  return candidates.reduce((best, p) => {
    const d1 = distance(ctx.enemy, best);
    const d2 = distance(ctx.enemy, p);
    const threatBias = (1 - p.health / p.maxHealth) * 120;
    return d2 + threatBias < d1 ? p : best;
  });
}

function buildChaseOutput(ctx: AIContext, target: { x: number; y: number }, params: AIParams): SteeringOutput {
  const dir = getFlowDirection(ctx.enemy.x, ctx.enemy.y, target.x, target.y, ctx.obstacles, {
    width: ctx.mapWidth,
    height: ctx.mapHeight,
  });
  return { vx: dir.x, vy: dir.y, shouldAttack: true };
}

function buildKeepDistanceOutput(
  ctx: AIContext,
  target: { x: number; y: number },
  params: AIParams,
  preferredDistance: number
): SteeringOutput {
  const dx = target.x - ctx.enemy.x;
  const dy = target.y - ctx.enemy.y;
  const dist = Math.hypot(dx, dy);

  let dir = { x: 0, y: 0 };
  if (dist > preferredDistance + 50) {
    dir = normalize({ x: dx / dist, y: dy / dist });
  } else if (dist < preferredDistance - 50) {
    dir = normalize({ x: -dx / dist, y: -dy / dist });
  } else {
    const strafe = Math.sin(ctx.time + ctx.enemy.x * 0.01) > 0 ? 1 : -1;
    dir = normalize({ x: (-dy / dist) * strafe, y: (dx / dist) * strafe });
  }

  return {
    vx: dir.x,
    vy: dir.y,
    desiredDistance: preferredDistance,
    shouldAttack: true,
  };
}

function buildChargeOutput(
  ctx: AIContext,
  target: { x: number; y: number },
  params: AIParams,
  speedMul: number
): SteeringOutput {
  const dir = normalize({ x: target.x - ctx.enemy.x, y: target.y - ctx.enemy.y });
  return { vx: dir.x, vy: dir.y, speedMultiplier: speedMul, shouldAttack: true };
}

function buildRetreatOutput(ctx: AIContext, target: { x: number; y: number }, params: AIParams): SteeringOutput {
  const dx = target.x - ctx.enemy.x;
  const dy = target.y - ctx.enemy.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return { vx: 0, vy: 0, shouldAttack: false };

  const dir = normalize({ x: -dx / dist, y: -dy / dist });
  return { vx: dir.x, vy: dir.y, speedMultiplier: 1.1, shouldAttack: false };
}

function buildOrbitOutput(ctx: AIContext, target: { x: number; y: number }, params: AIParams, radius: number): SteeringOutput {
  const dx = target.x - ctx.enemy.x;
  const dy = target.y - ctx.enemy.y;
  const dist = Math.hypot(dx, dy) || 1;

  const cw = ctx.time * 0.25 + ctx.enemy.x * 0.01 > 0 ? 1 : -1;
  const tangentX = (-dy / dist) * cw;
  const tangentY = (dx / dist) * cw;
  const outward = dist < radius ? -0.2 : 0.05;

  const dir = normalize({
    x: tangentX + (dx / dist) * outward,
    y: tangentY + (dy / dist) * outward,
  });

  return { vx: dir.x, vy: dir.y, desiredDistance: radius, shouldAttack: dist < radius * 1.4 };
}

function shouldUseSkill(ctx: AIContext, state: BossState, params: AIParams): boolean {
  const key = `skill-${state.id}`;
  const last = state.skillTimers[key] ?? 0;
  const cooldown = clamp(3 - params.aggression * 1.5, 0.8, 3);

  if (ctx.time - last < cooldown) return false;

  const dist = distance(ctx.enemy, ctx.player);
  if (dist > ctx.enemy.radius + 80) return false;

  state.skillTimers[key] = ctx.time;
  return true;
}

function shouldUseUltimate(ctx: AIContext, state: BossState, params: AIParams): boolean {
  const key = "ultimate";
  const last = state.skillTimers[key] ?? 0;
  const cooldown = clamp(12 - params.aggression * 6, 4, 12);

  if (ctx.time - last < cooldown) return false;

  const healthRatio = ctx.enemy.maxHealth > 0 ? ctx.enemy.health / ctx.enemy.maxHealth : 1;
  if (healthRatio > 0.6 && ctx.enemy.phase < 2) return false;

  state.skillTimers[key] = ctx.time;
  return true;
}
