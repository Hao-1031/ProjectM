import type { Enemy, Player, Obstacle, EnergyNode, DefenseCore, BossId } from "../types";
import type { AlphaDifficultySnapshot } from "../alpha/types";

/**
 * β 智能行为算法 - 共享类型
 *
 * 三块算法共用同一套上下文与输出接口：
 * - 敌人寻路/群体战术
 * - Boss 分层状态机
 * - PVP Bot 战术 AI
 */

export type AIBehavior =
  | "chase"
  | "keep_distance"
  | "flank"
  | "swarm"
  | "retreat"
  | "charge"
  | "orbit"
  | "ambush"
  | "surround"
  | "attack_core"
  | "capture_node";

export type BotRole = "assault" | "sniper" | "controller" | "roamer";

export type BotState = "idle" | "chase" | "strafe" | "flee" | "seek_cover" | "reposition";

export type BossStateId =
  | "phase1"
  | "phase2"
  | "enrage"
  | "retreat"
  | "summon"
  | "charge"
  | "keep_distance";

export interface Vec2 {
  x: number;
  y: number;
}

export interface SteeringOutput {
  vx: number;
  vy: number;
  /** 期望与目标的距离，用于 keep_distance 等行为 */
  desiredDistance?: number;
  /** 是否满足攻击条件 */
  shouldAttack: boolean;
  /** 是否使用技能（Boss/Bot） */
  shouldUseSkill?: boolean;
  /** 是否使用终极技（Boss/Bot） */
  shouldUseUltimate?: boolean;
  /** 移动速度倍率 */
  speedMultiplier?: number;
  /** 目标位置（可选，用于调试或可视化） */
  targetX?: number;
  targetY?: number;
}

export interface AIContext {
  enemy: Enemy;
  player: Player;
  /** 同阵营敌人/友军 */
  allies: Enemy[];
  /** 当前所有玩家（含 Bot） */
  players: Player[];
  dt: number;
  mapWidth: number;
  mapHeight: number;
  difficulty: number;
  time: number;
  /** 地图障碍物，用于寻路避障 */
  obstacles: Obstacle[];
  /** 据点模式专用 */
  core?: DefenseCore;
  nodes?: EnergyNode[];
  /** α 算法难度快照，驱动 AI 侵略性 */
  alphaSnapshot?: AlphaDifficultySnapshot;
}

export interface BotContext {
  bot: import("../types").DeathmatchBot;
  player: Player;
  state: import("../types").GameState;
  dt: number;
  rng: () => number;
  alphaSnapshot?: AlphaDifficultySnapshot;
}

export interface BotOutput {
  move: Vec2;
  aim: Vec2;
  fire: boolean;
  useSkill: boolean;
  useUltimate: boolean;
}

export interface AIParams {
  /** 0~1，越高越激进 */
  aggression: number;
  /** 群体分离权重 */
  separationWeight: number;
  /** 群体对齐权重 */
  alignmentWeight: number;
  /** 群体凝聚权重 */
  cohesionWeight: number;
  /** 障碍物避让权重 */
  obstacleWeight: number;
  /**  preferred distance 缩放 */
  preferredDistanceMul: number;
  /** 移动速度倍率上限 */
  speedMulCap: number;
  /** 攻击欲望倍率 */
  attackDesireMul: number;
  /** Bot 瞄准精度（0~1） */
  botAccuracy: number;
  /** Bot 反应延迟秒数 */
  botReactionDelay: number;
}

export interface BossBehaviorNode {
  id: BossStateId;
  weight: number;
  condition: (ctx: AIContext) => boolean;
  execute: (ctx: AIContext) => SteeringOutput;
}

export interface BossSkillCandidate {
  id: string;
  name: string;
  cooldown: number;
  timer: number;
  score: number;
  range: number;
}

export interface FlowFieldOptions {
  width: number;
  height: number;
  cellSize?: number;
  obstacles: Obstacle[];
}

export interface FlowDirection {
  x: number;
  y: number;
  cost: number;
}
