// Beta Engine: Unified enemy-side pipeline
// Combines Bot AI, spawn optimization, enemy movement, pathfinding, team coordination,
// and adaptive spawn curve into a single enemy orchestration engine.

import { calculateBotAI, assignBotRole, selectBotTarget, chooseBotState, computeBotMove, computeBotAim, shouldBotFire, findCoverDirection } from "@/lib/algorithms/botAI";
import type { BotAIRequest, BotAIOutput, BotAIRole, BotAIEntity, BotAIDifficulty } from "@/lib/algorithms/botAI";
import { optimizeSpawns } from "@/lib/algorithms/spawnOptimizer";
import type { SpawnCandidate, GamePressure, SpawnOptimizationReport } from "@/lib/algorithms/spawnOptimizer";
import { calculateEnemyMovement } from "@/lib/algorithms/enemyMovement";
import type { MovementRequest, EnemyMovementOutput } from "@/lib/algorithms/enemyMovement";
import { findPath, batchFindPath } from "@/lib/algorithms/pathfinding";
import type { PathNode, PathObstacle, PathfindingConfig, PathfindingResult } from "@/lib/algorithms/pathfinding";
import { assignTeamRoles, generateFormation, coordinateTargets, evaluateCoordinationEfficiency } from "@/lib/algorithms/teamCoordination";
import type { TeamRole, TeamMember, TeamTarget, TeamFormation, CoordinationConfig, CoordinationResult } from "@/lib/algorithms/teamCoordination";
import { generateAdaptiveSpawnCurve, evaluatePerformance, calculatePerformanceDeviation, adjustVariantMix, determinePhase, calculateAdaptiveInterval, quickAdaptiveDecision } from "@/lib/algorithms/adaptiveSpawnCurve";
import type { AdaptivePhase, AdaptiveSpawnConfig, PlayerPerformance, AdaptiveWavePlan, AdaptiveSpawnReport } from "@/lib/algorithms/adaptiveSpawnCurve";
import type { WaveNode } from "@/lib/algorithms/progression";
import type { BetaEngineInput, BetaEngineOutput } from "./types";

export class BetaEngine {
  static decideBotAI(request: BotAIRequest): BotAIOutput {
    return calculateBotAI(request);
  }

  static planSpawns(
    candidates: SpawnCandidate[],
    pressure: GamePressure
  ): SpawnOptimizationReport {
    return optimizeSpawns(candidates, pressure);
  }

  static calculateMovement(request: MovementRequest): EnemyMovementOutput {
    return calculateEnemyMovement(request);
  }

  static findPath(
    start: PathNode,
    end: PathNode,
    bounds: { width: number; height: number },
    obstacles: PathObstacle[],
    entityRadius?: number,
    config?: Partial<PathfindingConfig>
  ): PathfindingResult {
    return findPath(start, end, bounds, obstacles, entityRadius, config);
  }

  static batchFindPath(
    requests: { start: PathNode; end: PathNode; entityRadius?: number }[],
    bounds: { width: number; height: number },
    obstacles: PathObstacle[],
    config?: Partial<PathfindingConfig>
  ): { results: PathfindingResult[]; totalTimeMs: number; successRate: number } {
    return batchFindPath(requests, bounds, obstacles, config);
  }

  static coordinateTeam(
    members: TeamMember[],
    targets: TeamTarget[],
    config?: Partial<CoordinationConfig>
  ): CoordinationResult {
    return coordinateTargets(members, targets, config);
  }

  static generateAdaptiveCurve(
    waves: WaveNode[],
    performances: (PlayerPerformance | null)[],
    pressure: GamePressure,
    config?: Partial<AdaptiveSpawnConfig>
  ): AdaptiveSpawnReport {
    return generateAdaptiveSpawnCurve(waves, performances, pressure, config);
  }

  static quickAdaptiveDecision(
    wave: WaveNode,
    performance: PlayerPerformance,
    pressure: GamePressure,
    config?: Partial<AdaptiveSpawnConfig>
  ) {
    return quickAdaptiveDecision(wave, performance, pressure, config);
  }

  static evaluateFull(input: BetaEngineInput): BetaEngineOutput {
    return {
      botDecision: calculateBotAI(input.botRequest),
      spawnPlan: optimizeSpawns(input.spawnCandidates, input.spawnPressure),
      movement: calculateEnemyMovement(input.movementRequest),
    };
  }
}

export { calculateBotAI, assignBotRole, selectBotTarget, chooseBotState, computeBotMove, computeBotAim, shouldBotFire, findCoverDirection } from "@/lib/algorithms/botAI";
export { optimizeSpawns } from "@/lib/algorithms/spawnOptimizer";
export { calculateEnemyMovement } from "@/lib/algorithms/enemyMovement";
export { findPath, batchFindPath } from "@/lib/algorithms/pathfinding";
export { assignTeamRoles, generateFormation, coordinateTargets, evaluateCoordinationEfficiency } from "@/lib/algorithms/teamCoordination";
export { generateAdaptiveSpawnCurve, evaluatePerformance, calculatePerformanceDeviation, adjustVariantMix, determinePhase, calculateAdaptiveInterval, quickAdaptiveDecision } from "@/lib/algorithms/adaptiveSpawnCurve";