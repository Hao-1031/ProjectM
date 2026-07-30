import type { Enemy, Player } from "../types";
import type { AIContext, AIParams, BossBehaviorNode, BossStateId, SteeringOutput, Vec2 } from "./types";
import { distance, normalize, clamp } from "../math";
import { getFlowDirection, hasLineOfSight } from "./pathfinding";
import { mapDifficultyToAIParams } from "./alpha-bridge";
import { getAbilityGate, getPredictiveAimConfig, getDodgeConfig, getWaveScalingBonus } from "./ability-gating";
import { buildCoordinationContext, applyCoordination } from "./coordination";
import { predictPlayerPosition } from "./tactics";

/**
 * β-2 Boss 分层状态机 (创世版升级)
 *
 * 新增能力：
 * - 预判瞄准：Boss 弹道预判玩家走位
 * - 掩护队友：满血Boss阻挡玩家追击残血小兵
 * - 集火指令：Boss 带头锁定残血玩家
 * - 能力门控：按波次+阶段解锁新行为
 * - 群体协作：角色分工+编队+掩护
 *
 * 输出通过 SteeringOutput 的 shouldUseSkill / shouldUseUltimate / aimOffset 通知 engine。
 */

interface BossState {
  id: BossStateId;
  enteredAt: number;
  skillTimers: Record<string, number>;
}

const bossStates = new WeakMap<Enemy, BossState>();

export function runBossAI(ctx: AIContext): SteeringOutput {
  const params = mapDifficultyToAIParams(ctx.alphaSnapshot);
  const wave = ctx.wave ?? 1;
  const gate = getAbilityGate(wave, ctx.enemy);
  const scaling = getWaveScalingBonus(wave);

  params.aggression = clamp(params.aggression + scaling.aggressionBonus, 0, 1);
  params.speedMulCap = clamp(params.speedMulCap + scaling.coordinationBonus * 0.3, 0.8, 1.5);

  // 注入配置到上下文
  ctx.predictiveAim = getPredictiveAimConfig(wave, ctx.enemy, params.aggression);
  ctx.dodgeConfig = getDodgeConfig(wave, ctx.enemy, params.aggression);
  ctx.coordination = buildCoordinationContext(ctx, gate);

  const state = ensureBossState(ctx.enemy);
  const target = selectBossTarget(ctx);

  const nodes = buildBehaviorNodes(ctx, params, gate);
  const eligible = nodes.filter((n) => n.condition(ctx));

  let output: SteeringOutput;
  if (eligible.length === 0) {
    output = buildChaseOutput(ctx, target, params);
  } else {
    eligible.sort((a, b) => b.weight - a.weight);
    const chosen = eligible[0]!;

    if (chosen.id !== state.id) {
      state.id = chosen.id;
      state.enteredAt = ctx.time;
    }

    output = chosen.execute(ctx);
  }

  // 预判瞄准偏移
  if (gate.predictiveAim && ctx.predictiveAim?.enabled) {
    const predicted = predictPlayerPosition(ctx, ctx.predictiveAim);
    output.aimOffsetX = predicted.x - ctx.player.x;
    output.aimOffsetY = predicted.y - ctx.player.y;
  }

  // 群体协作
  output = applyCoordination(ctx, gate, output, ctx.coordination);

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

function buildBehaviorNodes(
  ctx: AIContext,
  params: AIParams,
  gate: ReturnType<typeof getAbilityGate>
): BossBehaviorNode[] {
  const healthRatio = ctx.enemy.maxHealth > 0 ? ctx.enemy.health / ctx.enemy.maxHealth : 1;
  const distToTarget = distance(ctx.enemy, ctx.player);
  const aggression = params.aggression;

  const nodes: BossBehaviorNode[] = [
    {
      id: "enrage",
      weight: 100,
      condition: () => healthRatio < 0.25 && aggression > 0.5,
      execute: (c) => buildChargeOutput(c, ctx.player, params, 1.25),
    },
    {
      id: "summon",
      weight: 70,
      condition: () =>
        healthRatio < 0.7 &&
        ctx.enemy.phase >= 2 &&
        hasLineOfSight(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y, ctx.obstacles, ctx.enemy.radius),
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

  // 预判瞄准节点：phase2+ 且门控允许
  if (gate.predictiveAim) {
    nodes.push({
      id: "predictive_aim",
      weight: 55,
      condition: () =>
        ctx.enemy.phase >= 2 &&
        distToTarget > 200 &&
        hasLineOfSight(ctx.enemy.x, ctx.enemy.y, ctx.player.x, ctx.player.y, ctx.obstacles, ctx.enemy.radius),
      execute: (c) => buildPredictiveAimOutput(c, ctx.player, params),
    });
  }

  // 掩护队友节点：有多余小兵且门控允许
  if (gate.coverRetreat && ctx.allies.length > 0) {
    nodes.push({
      id: "cover_ally",
      weight: 45,
      condition: () => {
        const woundedAlly = ctx.allies.find(
          (a) =>
            a.maxHealth > 0 &&
            a.health / a.maxHealth < 0.3 &&
            distance(ctx.enemy, a) < 350
        );
        return ctx.enemy.phase >= 2 && !!woundedAlly;
      },
      execute: (c) => buildCoverAllyOutput(c, ctx.player, params),
    });
  }

  // 集火节点：玩家残血+盟友多
  if (gate.focusFire) {
    nodes.push({
      id: "focus_fire",
      weight: 50,
      condition: () => {
        const playerHealthRatio = ctx.player.maxHealth > 0 ? ctx.player.health / ctx.player.maxHealth : 1;
        return playerHealthRatio < 0.35 && ctx.allies.length >= 3;
      },
      execute: (c) => buildChargeOutput(c, ctx.player, params, 1.2),
    });
  }

  return nodes;
}

function selectBossTarget(ctx: AIContext): Player {
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

/** 预判瞄准输出：追踪行为但带预判偏移 */
function buildPredictiveAimOutput(
  ctx: AIContext,
  target: { x: number; y: number },
  params: AIParams
): SteeringOutput {
  const predicted = ctx.predictiveAim
    ? predictPlayerPosition(ctx, ctx.predictiveAim)
    : target;

  const dir = getFlowDirection(ctx.enemy.x, ctx.enemy.y, predicted.x, predicted.y, ctx.obstacles, {
    width: ctx.mapWidth,
    height: ctx.mapHeight,
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

/** 掩护队友：Boss 挡在残血队友和玩家之间 */
function buildCoverAllyOutput(
  ctx: AIContext,
  target: { x: number; y: number },
  params: AIParams
): SteeringOutput {
  const woundedAlly = ctx.allies.find(
    (a) => a.maxHealth > 0 && a.health / a.maxHealth < 0.3 && distance(ctx.enemy, a) < 350
  );
  if (!woundedAlly) return buildChaseOutput(ctx, target, params);

  const blockX = (woundedAlly.x + ctx.player.x) / 2;
  const blockY = (woundedAlly.y + ctx.player.y) / 2;

  const dir = getFlowDirection(ctx.enemy.x, ctx.enemy.y, blockX, blockY, ctx.obstacles, {
    width: ctx.mapWidth,
    height: ctx.mapHeight,
  });

  return {
    vx: dir.x,
    vy: dir.y,
    speedMultiplier: 1.05,
    shouldAttack: true,
  };
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