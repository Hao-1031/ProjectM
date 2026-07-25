import type { Player, DeathmatchBot } from "../types";
import type { BotContext, BotOutput, BotRole, BotState, AIParams } from "./types";
import { mapDifficultyToAIParams } from "./alpha-bridge";
import {
  calculateBotAI,
  assignBotRole as assignBotRoleFromLibrary,
  type BotAIEntity,
  type BotAIObstacle,
  type BotAIDifficulty,
  type BotAIConfig,
  type BotAIState,
} from "@/lib/algorithms/botAI";

/**
 * β-3 PVP Bot 战术 AI
 *
 * 为死亡竞赛 Bot 提供角色定位、目标选择、走位、开火决策。
 * 与 α 算法联动：高难度时 Bot 更准、反应更快、更愿意追击残血。
 *
 * 实现上调用 lib/algorithms/botAI 公开算法库，将游戏运行时状态转换为
 * 纯函数请求对象，并把算法输出写回 Bot 状态。
 */

const roleCache = new WeakMap<Player, BotRole>();

export function assignBotRole(player: Player): BotRole {
  let role = roleCache.get(player);
  if (role) return role;

  const weapon = player.weapons[0];
  if (!weapon) {
    role = "assault";
  } else {
    role = assignBotRoleFromLibrary({
      id: weapon.id,
      range: weapon.range,
      damage: weapon.damage,
      projectileSpeed: weapon.projectileSpeed,
      areaRadius: weapon.areaRadius,
      cooldown: weapon.cooldown,
    });
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

  const request = buildBotAIRequest(ctx, role, params);
  const output = calculateBotAI(request);

  // 将算法库输出同步回 Bot 运行时状态
  bot.targetId = output.targetId ?? null;
  bot.state = mapAIStateToDeathmatchState(output.state);

  return {
    move: output.move,
    aim: output.aim,
    fire: output.fire,
    useSkill: false,
    useUltimate: false,
  };
}

function buildBotAIRequest(
  ctx: BotContext,
  role: BotRole,
  params: AIParams
): import("@/lib/algorithms/botAI").BotAIRequest {
  const player = ctx.player;
  const state = ctx.state;

  const self: BotAIEntity = {
    id: player.id,
    x: player.x,
    y: player.y,
    radius: player.radius,
    speed: player.speed,
    maxHealth: player.maxHealth,
    health: player.health,
    teamId: player.id, // 死亡竞赛为 FFA，每名玩家独立成队
    weapon: buildWeaponInfo(player.weapons[0]),
    velocity: { x: player.knockbackX, y: player.knockbackY },
  };

  const targets: BotAIEntity[] = [state.player, ...state.players]
    .filter((p) => p.id !== player.id && p.health > 0)
    .map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      radius: p.radius,
      speed: p.speed,
      maxHealth: p.maxHealth,
      health: p.health,
      teamId: p.id,
      weapon: buildWeaponInfo(p.weapons[0]),
      velocity: { x: p.knockbackX, y: p.knockbackY },
    }));

  const obstacles: BotAIObstacle[] = state.map.obstacles.map((o) => ({
    id: o.id,
    x: o.x,
    y: o.y,
    width: o.width,
    height: o.height,
    health: o.health,
  }));

  const difficulty: BotAIDifficulty = {
    aggression: params.aggression,
    botAccuracy: params.botAccuracy,
    botReactionDelay: params.botReactionDelay,
  };

  const config: BotAIConfig = {
    role,
    difficulty,
    currentTargetId: ctx.bot.targetId,
    fireCooldown: ctx.bot.fireTimer,
  };

  return {
    self,
    targets,
    allies: [], // FFA 无友军；需要组队模式时可传入队友
    obstacles,
    bounds: { width: state.map.width, height: state.map.height },
    time: state.time,
    dt: ctx.dt,
    rngSeed: Math.floor(ctx.rng() * 2147483647),
    config,
  };
}

function buildWeaponInfo(weapon?: Player["weapons"][number]): BotAIEntity["weapon"] {
  if (!weapon) {
    return { id: "unarmed", range: 180, damage: 12, cooldown: 0.6 };
  }
  return {
    id: weapon.id,
    range: weapon.range,
    damage: weapon.damage,
    projectileSpeed: weapon.projectileSpeed,
    areaRadius: weapon.areaRadius,
    cooldown: weapon.cooldown,
    count: weapon.count,
    spread: weapon.spread,
  };
}

function mapAIStateToDeathmatchState(state: BotAIState): DeathmatchBot["state"] {
  switch (state) {
    case "idle":
      return "idle";
    case "chase":
      return "chase";
    case "strafe":
      return "strafe";
    case "flee":
      return "flee";
    case "seek_cover":
      return "flee";
    case "reposition":
      return "strafe";
    default:
      return "idle";
  }
}
