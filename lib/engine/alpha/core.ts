// Alpha Engine: Unified player-side pipeline
// Combines DDA, economy, matchmaking, reward recommendation, content recommendation, and anti-cheat
// into a single player experience engine.

import { calculateTeamSkillScore, adjustDefenseWave } from "@/lib/algorithms/dda";
import type { PlayerProfile, WaveParameters, DefenseWaveBase } from "@/lib/algorithms/dda";
import { adjustDropRates } from "@/lib/algorithms/economyBalance";
import type { DropTableItem, EconomyState, EconomyAdjustmentReport } from "@/lib/algorithms/economyBalance";
import { buildBalancedSquad } from "@/lib/algorithms/matchmaking";
import type { QueuedPlayer, Squad } from "@/lib/algorithms/matchmaking";
import { recommendRewards } from "@/lib/algorithms/rewardRecommendation";
import type { RewardOption, PlayerBuild, EnemyComposition, RewardScore } from "@/lib/algorithms/rewardRecommendation";
import { rankContent } from "@/lib/algorithms/contentRecommendation";
import type { ContentItem, UserInterest, RankedContent } from "@/lib/algorithms/contentRecommendation";
import { combineRisk } from "@/lib/algorithms/ace";
import type { ClientFeatureSnapshot, ServerBehaviorEvent, RiskReport } from "@/lib/algorithms/ace";
import type { AlphaEngineInput, AlphaEngineOutput } from "./types";

export interface AlphaPlaySession {
  playerProfiles: PlayerProfile[];
  averageLatencyMs?: number;
  defenseWaveBase: DefenseWaveBase;
  previousWaveResult?: { cleared: boolean; coreHealthPercent: number };
}

export class AlphaEngine {
  static evaluateDifficulty(input: AlphaPlaySession): WaveParameters {
    const team = {
      players: input.playerProfiles,
      averageLatencyMs: input.averageLatencyMs,
    };
    return adjustDefenseWave(input.defenseWaveBase, team, input.previousWaveResult);
  }

  static evaluateEconomy(dropTable: DropTableItem[], state: EconomyState): EconomyAdjustmentReport {
    return adjustDropRates(dropTable, state);
  }

  static evaluateMatchmaking(queue: QueuedPlayer[], maxSize = 4): Squad {
    return buildBalancedSquad(queue, { maxSize });
  }

  static evaluateRewards(
    options: RewardOption[],
    build: PlayerBuild,
    enemies: EnemyComposition
  ): RewardScore[] {
    return recommendRewards(options, build, enemies);
  }

  static evaluateContent(items: ContentItem[], interests: UserInterest[]): RankedContent[] {
    return rankContent(items, interests);
  }

  static evaluateSecurity(
    clientSnapshot: ClientFeatureSnapshot,
    serverEvents: ServerBehaviorEvent[]
  ): RiskReport {
    return combineRisk(clientSnapshot, serverEvents);
  }

  static evaluateFull(input: AlphaEngineInput): AlphaEngineOutput {
    const team = {
      players: input.playerProfiles,
      averageLatencyMs: input.averageLatencyMs,
    };
    return {
      waveAdjustment: adjustDefenseWave(input.defenseWaveBase, team, input.previousWaveResult),
      economyReport: adjustDropRates(input.dropTable, input.economyState),
      squad: buildBalancedSquad(input.queue),
      rewards: recommendRewards(input.rewardOptions, input.playerBuild, input.enemyComposition),
      rankedContent: rankContent(input.contentItems, input.userInterests),
      riskReport: combineRisk(input.clientSnapshot, input.serverEvents),
    };
  }
}

export { calculateTeamSkillScore, adjustDefenseWave };
export { adjustDropRates, detectBotPattern } from "@/lib/algorithms/economyBalance";
export { buildBalancedSquad } from "@/lib/algorithms/matchmaking";
export { recommendRewards } from "@/lib/algorithms/rewardRecommendation";
export { rankContent } from "@/lib/algorithms/contentRecommendation";
export { combineRisk, evaluateClientRisk, evaluateServerRisk } from "@/lib/algorithms/ace";