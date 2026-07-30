/**
 * β 智能行为算法 - 兼容层 (创世版升级)
 *
 * 原有 ai.ts 的所有导出保留，内部实现已替换为 lib/game/ai/ 下的生产级算法：
 * - pathfinding: 流场寻路 + 动态避障
 * - tactics: 群体行为与目标选择 + 预判瞄准 + 弹幕躲避 + 武器对策
 * - boss-state: 分层状态机 + 新Boss能力
 * - bot-ai: PVP Bot 战术 AI
 * - alpha-bridge: 与 α 难度算法联动
 * - ability-gating: 波次+敌人类型双重能力门控
 * - coordination: 群体协作（角色分工+集火+掩护撤退+编队）
 * - learning: 学习适应（防守习惯+英雄对策+波次递增）
 *
 * 本文件仅做 API 兼容与便捷导出。
 */

export type {
  AIBehavior,
  AIContext,
  AIParams,
  BotContext,
  BotOutput,
  BotRole,
  BotState,
  BossBehaviorNode,
  BossStateId,
  FlowDirection,
  FlowFieldOptions,
  SteeringOutput,
  AbilityGate,
  PredictiveAimConfig,
  DodgeConfig,
  HeroCounterConfig,
  HeroCounterStrategy,
  EnemyRole,
  CoordinationContext,
  LearningMemory,
  PredictiveAimResult,
  DodgeDecision,
  WeaponCounterDecision,
} from "./ai/types";

export {
  avoidObstacles,
  findOpenDirection,
  getFlowDirection,
  hasLineOfSight,
} from "./ai/pathfinding";

export {
  aiAmbush,
  aiCharge,
  aiChase,
  aiFlank,
  aiKeepDistance,
  aiOrbit,
  aiRetreat,
  aiSurround,
  aiSwarm,
  executeBehavior,
  runEnemyAI,
  selectBehavior,
  selectTarget,
} from "./ai/tactics";

export { resetBossState, runBossAI } from "./ai/boss-state";

export { assignBotRole, runBotAI } from "./ai/bot-ai";

export {
  getAggression,
  getAttackDesireMultiplier,
  getSpeedMultiplier,
  mapDifficultyToAIParams,
} from "./ai/alpha-bridge";

export {
  getAbilityGate,
  getWaveScalingBonus,
  getPredictiveAimConfig,
  getDodgeConfig,
  getHeroCounterConfig,
  getHeroCounterStrategy,
  applyHeroCounterBehavior,
} from "./ai/ability-gating";

export {
  classifyEnemyRole,
  buildCoordinationContext,
  applyRoleDivision,
  applyFocusFire,
  applyCoverRetreat,
  applyFormation,
  clampRetreatDistance,
  applyCoordination,
} from "./ai/coordination";

export {
  createLearningMemory,
  updateLearningMemory,
  getPlayerHotZone,
  getAvoidHotZoneDirection,
  getDetectedHero,
  getWaveDifficultyBonus,
  recordEvasivePattern,
  getAverageEvasiveDirection,
} from "./ai/learning";

export { runEnemyAI as default } from "./ai/tactics";