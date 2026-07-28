// Algorithm library — re-organized into three engines
// Alpha Engine: Player-side (DDA, economy, matchmaking, reward, content, anti-cheat, progression)
// Beta Engine: Enemy-side (Bot AI, spawn optimization, enemy movement, pathfinding, team coordination, adaptive spawn curve)
// Infra Engine: Infrastructure (map balance, network prediction)

export * from "./types";
export * from "./registry";

// Alpha Engine (player-side)
export {
  AlphaEngine,
  calculateTeamSkillScore,
  adjustDefenseWave,
  adjustDropRates,
  detectBotPattern,
  buildBalancedSquad,
  recommendRewards,
  rankContent,
  combineRisk,
  evaluateClientRisk,
  evaluateServerRisk,
} from "@/lib/engine/alpha";
export type {
  AlphaEngineInput,
  AlphaEngineOutput,
  AlphaPlaySession,
  PlayerProfile,
  TeamProfile,
  WaveParameters,
  DefenseWaveBase,
  DropTableItem,
  EconomyState,
  AdjustedDropItem,
  EconomyAdjustmentReport,
  QueuedPlayer,
  PlayerRole,
  Squad,
  RewardOption,
  RewardType,
  PlayerBuild,
  EnemyComposition,
  RewardScore,
  ContentItem,
  UserInterest,
  RankedContent,
  ClientFeatureSnapshot,
  ServerBehaviorEvent,
  RiskLevel,
  RiskReport,
} from "@/lib/engine/alpha";

// Beta Engine (enemy-side)
export {
  BetaEngine,
  calculateBotAI,
  assignBotRole,
  selectBotTarget,
  chooseBotState,
  computeBotMove,
  computeBotAim,
  shouldBotFire,
  findCoverDirection,
  optimizeSpawns,
  calculateEnemyMovement,
  findPath,
  batchFindPath,
  assignTeamRoles,
  generateFormation,
  coordinateTargets,
  evaluateCoordinationEfficiency,
  generateAdaptiveSpawnCurve,
  evaluatePerformance,
  calculatePerformanceDeviation,
  adjustVariantMix,
  determinePhase,
  calculateAdaptiveInterval,
  quickAdaptiveDecision,
} from "@/lib/engine/beta";
export type {
  BetaEngineInput,
  BetaEngineOutput,
  BotAIRole,
  BotAIState,
  BotAIWeapon,
  BotAIEntity,
  BotAIObstacle,
  BotAIBounds,
  BotAIDifficulty,
  BotAIConfig,
  BotAIRequest,
  BotAIOutput,
  EnemyVariant,
  SpawnCandidate,
  GamePressure,
  SpawnPlan,
  SpawnOptimizationReport,
  Vec2,
  GridCoord,
  CoordinateMode,
  MovementObstacle,
  MovementEntity,
  MovementTarget,
  MovementAlly,
  MovementBounds,
  MovementBehavior,
  MovementConfig,
  MovementRequest,
  MovementForceDebug,
  EnemyMovementOutput,
  PathNode,
  PathObstacle,
  PathfindingConfig,
  PathfindingResult,
  TeamRole,
  TeamMember,
  TeamTarget,
  TeamFormation,
  CoordinationConfig,
  CoordinationResult,
  AdaptivePhase,
  AdaptiveSpawnConfig,
  PlayerPerformance,
  AdaptiveWavePlan,
  AdaptiveSpawnReport,
} from "@/lib/engine/beta";

// Infra Engine (infrastructure)
export { analyzeMapBalance, evaluateNetwork, predictEntityState } from "@/lib/engine/infra";
export type {
  MapVariantStat,
  MapVariantReport,
  MapBalanceReport,
  NetworkSnapshot,
  EntityState,
  PredictedState,
  NetworkReport,
} from "@/lib/engine/infra";

// Legacy exports for backward compatibility
export * from "./dda";
export * from "./ace";
export * from "./matchmaking";
export * from "./mapBalance";
export * from "./contentRecommendation";
export * from "./economyBalance";
export * from "./rewardRecommendation";
export * from "./spawnOptimizer";
export * from "./networkPrediction";
export * from "./enemyMovement";
export * from "./botAI";
export * from "./progression";
export * from "./pathfinding";
export * from "./teamCoordination";
export * from "./adaptiveSpawnCurve";