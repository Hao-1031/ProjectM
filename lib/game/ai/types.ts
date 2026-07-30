import type { Enemy, Player, Obstacle, EnergyNode, DefenseCore, BossId, Projectile, HeroId } from "../types";
import type { AlphaDifficultySnapshot } from "../alpha/types";

/**
 * β 智能行为算法 - 共享类型
 *
 * 三块算法共用同一套上下文与输出接口：
 * - 敌人寻路/群体战术
 * - Boss 分层状态机
 * - PVP Bot 战术 AI
 *
 * 创世版升级：新增预判瞄准、弹幕躲避、武器对策、地形利用、
 * 群体协作、学习适应等能力类型
 */

export type AIBehavior =
  | "chase"
  | "keep_distance"
  | "flank"
  | "swarm"
  | "retreat"
  | "seek_cover"
  | "strafe"
  | "charge"
  | "orbit"
  | "ambush"
  | "surround"
  | "attack_core"
  | "capture_node"
  | "dodge"
  | "predictive_aim"
  | "cover_ally"
  | "focus_fire"
  | "form_up";

export type BotRole = "assault" | "sniper" | "controller" | "roamer";

export type BotState = "idle" | "chase" | "strafe" | "flee" | "seek_cover" | "reposition";

export type BossStateId =
  | "phase1"
  | "phase2"
  | "enrage"
  | "retreat"
  | "summon"
  | "charge"
  | "keep_distance"
  | "predictive_aim"
  | "cover_ally"
  | "focus_fire";

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
  /** 预判瞄准偏移（引擎用于调整弹道方向） */
  aimOffsetX?: number;
  aimOffsetY?: number;
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
  /** 确定性随机数生成器，用于多人同步 */
  rng: () => number;
  /** 当前波次（用于能力门控） */
  wave?: number;
  /** 玩家弹体列表（用于弹幕躲避） */
  playerProjectiles?: Projectile[];
  /** 全局学习记忆（跨敌人共享） */
  learningMemory?: LearningMemory;
  /** 预判瞄准参数（由门控系统计算） */
  predictiveAim?: PredictiveAimConfig;
  /** 弹幕躲避参数 */
  dodgeConfig?: DodgeConfig;
  /** 英雄对策参数 */
  heroCounter?: HeroCounterConfig;
  /** 群体协作上下文 */
  coordination?: CoordinationContext;
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
  /** 目标点 X，用于构建以目标为中心的势场 */
  targetX?: number;
  /** 目标点 Y，用于构建以目标为中心的势场 */
  targetY?: number;
  /** 移动实体半径，用于障碍避让 */
  radius?: number;
}

export interface FlowDirection {
  x: number;
  y: number;
  cost: number;
}

// ========================================================================
// 创世版 AI 升级 - 新增类型
// ========================================================================

/** 能力门控 - 按波次解锁的AI能力 */
export interface AbilityGate {
  /** 预判瞄准：计算玩家移动轨迹提前量 */
  predictiveAim: boolean;
  /** 弹幕躲避：检测飞来的弹体并躲避 */
  projectileDodge: boolean;
  /** 武器对策：识别玩家武器类型并调整走位 */
  weaponCounter: boolean;
  /** 地形利用：主动利用障碍物卡视野、绕后 */
  terrainUtilization: boolean;
  /** 角色分工：坦克保护脆皮 */
  roleDivision: boolean;
  /** 集火指令：多敌人锁定同一目标 */
  focusFire: boolean;
  /** 掩护撤退：满血队友掩护残血撤退 */
  coverRetreat: boolean;
  /** 编队协同：同类型保持编队 */
  formationCoordination: boolean;
  /** 防守习惯识别：记住玩家常驻位置 */
  habitRecognition: boolean;
  /** 英雄对策：识别英雄类型针对性反击 */
  heroCounter: boolean;
}

/** 预判瞄准配置 */
export interface PredictiveAimConfig {
  /** 是否启用 */
  enabled: boolean;
  /** 预判精度（0~1，越高越准） */
  accuracy: number;
  /** 预判时间窗口（秒），预测该时间后的位置 */
  lookAheadTime: number;
}

/** 弹幕躲避配置 */
export interface DodgeConfig {
  /** 是否启用 */
  enabled: boolean;
  /** 检测半径（像素），检测范围内的弹体 */
  detectionRadius: number;
  /** 反应速度（0~1，越高反应越快） */
  reactionSpeed: number;
  /** 最小躲避角度（弧度），避免微调导致抖动 */
  minDodgeAngle: number;
}

/** 英雄对策配置 */
export interface HeroCounterConfig {
  /** 是否启用 */
  enabled: boolean;
  /** 当前检测到的英雄ID */
  detectedHeroId: HeroId | null;
  /** 对策策略 */
  strategy: HeroCounterStrategy;
}

export type HeroCounterStrategy =
  | "default"
  | "destroy_deployables"     // 工程师：优先拆炮台
  | "avoid_melee"              // 近战英雄：保持距离
  | "anti_sniper"              // 哨兵：减少正面冲锋，绕侧
  | "anti_recon"               // Recon：反隐巡逻
  | "rush_down"                // 脆皮英雄：全速冲锋
  | "spread_out"               // AOE英雄：散开站位
  | "anti_controller";         // 控制型英雄：保持中距离

/** 敌人角色分类（用于角色分工） */
export type EnemyRole = "tank" | "dps" | "support" | "artillery" | "assassin" | "default";

/** 群体协作上下文 */
export interface CoordinationContext {
  /** 当前敌人角色 */
  role: EnemyRole;
  /** 附近坦克型队友 */
  nearbyTanks: Enemy[];
  /** 附近脆皮队友 */
  nearbySquishies: Enemy[];
  /** 当前集火目标ID */
  focusTargetId: string | null;
  /** 编队中心点 */
  formationCenter: Vec2 | null;
  /** 编队方向 */
  formationDirection: Vec2 | null;
  /** 是否需要掩护撤退 */
  needsCoverRetreat: boolean;
  /** 被掩护的撤退队友ID */
  coveringAllyId: string | null;
}

/** 学习记忆 - 跨波次持久状态 */
export interface LearningMemory {
  /** 玩家高频驻守区域（格子坐标） */
  heatmap: Map<string, number>;
  /** 玩家最近N次被攻击时的移动方向 */
  evasivePatterns: Vec2[];
  /** 检测到的英雄ID */
  detectedHero: HeroId | null;
  /** 英雄检测置信度（0~1） */
  heroConfidence: number;
  /** 累计波次 */
  totalWaves: number;
  /** 玩家偏好武器统计 */
  weaponUsage: Map<string, number>;
  /** 当前波次AI难度增量 */
  waveDifficultyBonus: number;
  /** 上次更新波次 */
  lastWaveUpdate: number;
}

/** 预判瞄准结果 */
export interface PredictiveAimResult {
  /** 预测位置 */
  x: number;
  y: number;
  /** 预测置信度 */
  confidence: number;
}

/** 弹幕躲避决策 */
export interface DodgeDecision {
  /** 是否决定躲避 */
  shouldDodge: boolean;
  /** 躲避方向 */
  dodgeX: number;
  dodgeY: number;
  /** 威胁最高的弹体 */
  threatProjectile: Projectile | null;
  /** 威胁等级（0~1） */
  threatLevel: number;
}

/** 武器对策决策 */
export interface WeaponCounterDecision {
  /** 建议的走位距离 */
  preferredDistance: number;
  /** 是否应该散开（对AOE武器） */
  shouldSpreadOut: boolean;
  /** 是否应该绕侧（对远程武器） */
  shouldFlank: boolean;
  /** 是否应该冲锋（对近战武器保持距离的反面） */
  shouldRush: boolean;
}