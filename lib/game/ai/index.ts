/**
 * β 智能行为算法 - 统一入口 (创世版升级)
 */

export * from "./types";
export * from "./pathfinding";
export * from "./tactics";
export * from "./boss-state";
export * from "./bot-ai";
export * from "./alpha-bridge";
export * from "./ability-gating";
export * from "./coordination";
export * from "./learning";

export { runEnemyAI as default } from "./tactics";