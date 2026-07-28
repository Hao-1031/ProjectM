// Beta Engine: Enemy-side algorithms
// Bot AI + Spawn Optimizer + Enemy Movement + Pathfinding + Team Coordination + Adaptive Spawn Curve

export type { BotAIRole, BotAIState, BotAIWeapon, BotAIEntity, BotAIObstacle, BotAIBounds, BotAIDifficulty, BotAIConfig, BotAIRequest, BotAIOutput } from "@/lib/algorithms/botAI";
export type { EnemyVariant, SpawnCandidate, GamePressure, SpawnPlan, SpawnOptimizationReport } from "@/lib/algorithms/spawnOptimizer";
export type { Vec2, GridCoord, CoordinateMode, MovementObstacle, MovementEntity, MovementTarget, MovementAlly, MovementBounds, MovementBehavior, MovementConfig, MovementRequest, MovementForceDebug, EnemyMovementOutput } from "@/lib/algorithms/enemyMovement";
export type { PathNode, PathObstacle, PathfindingConfig, PathfindingResult } from "@/lib/algorithms/pathfinding";
export type { TeamRole, TeamMember, TeamTarget, TeamFormation, CoordinationConfig, CoordinationResult } from "@/lib/algorithms/teamCoordination";
export type { AdaptivePhase, AdaptiveSpawnConfig, PlayerPerformance, AdaptiveWavePlan, AdaptiveSpawnReport } from "@/lib/algorithms/adaptiveSpawnCurve";

export interface BetaEngineInput {
  botRequest: import("@/lib/algorithms/botAI").BotAIRequest;
  spawnCandidates: import("@/lib/algorithms/spawnOptimizer").SpawnCandidate[];
  spawnPressure: import("@/lib/algorithms/spawnOptimizer").GamePressure;
  movementRequest: import("@/lib/algorithms/enemyMovement").MovementRequest;
}

export interface BetaEngineOutput {
  botDecision: import("@/lib/algorithms/botAI").BotAIOutput;
  spawnPlan: import("@/lib/algorithms/spawnOptimizer").SpawnOptimizationReport;
  movement: import("@/lib/algorithms/enemyMovement").EnemyMovementOutput;
}