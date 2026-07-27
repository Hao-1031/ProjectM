// Beta Engine: Unified enemy-side pipeline
// Combines Bot AI, spawn optimization, and enemy movement into a single enemy orchestration engine.

import { calculateBotAI, assignBotRole, selectBotTarget, chooseBotState, computeBotMove, computeBotAim, shouldBotFire, findCoverDirection } from "@/lib/algorithms/botAI";
import type { BotAIRequest, BotAIOutput, BotAIRole, BotAIEntity, BotAIDifficulty } from "@/lib/algorithms/botAI";
import { optimizeSpawns } from "@/lib/algorithms/spawnOptimizer";
import type { SpawnCandidate, GamePressure, SpawnOptimizationReport } from "@/lib/algorithms/spawnOptimizer";
import { calculateEnemyMovement } from "@/lib/algorithms/enemyMovement";
import type { MovementRequest, EnemyMovementOutput } from "@/lib/algorithms/enemyMovement";
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