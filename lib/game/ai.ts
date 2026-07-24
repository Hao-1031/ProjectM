/**
 * β 智能行为算法 - 兼容层
 *
 * 原有 ai.ts 的所有导出保留，内部实现已替换为 lib/game/ai/ 下的生产级算法：
 * - pathfinding: 流场寻路 + 动态避障
 * - tactics: 群体行为与目标选择
 * - boss-state: 分层状态机
 * - bot-ai: PVP Bot 战术 AI
 * - alpha-bridge: 与 α 难度算法联动
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

export { runEnemyAI as default } from "./ai/tactics";
