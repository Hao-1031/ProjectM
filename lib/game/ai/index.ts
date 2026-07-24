/**
 * β 智能行为算法 - 统一入口
 */

export * from "./types";
export * from "./pathfinding";
export * from "./tactics";
export * from "./boss-state";
export * from "./bot-ai";
export * from "./alpha-bridge";

export { runEnemyAI as default } from "./tactics";
