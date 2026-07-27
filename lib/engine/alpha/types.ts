// Alpha Engine: Player-side algorithms
// DDA + Economy + Matchmaking + Reward + Content + Anti-cheat

export type { PlayerProfile, TeamProfile, WaveParameters, DefenseWaveBase } from "@/lib/algorithms/dda";
export type { DropTableItem, EconomyState, AdjustedDropItem, EconomyAdjustmentReport } from "@/lib/algorithms/economyBalance";
export type { QueuedPlayer, PlayerRole, Squad } from "@/lib/algorithms/matchmaking";
export type { RewardOption, RewardType, PlayerBuild, EnemyComposition, RewardScore } from "@/lib/algorithms/rewardRecommendation";
export type { ContentItem, UserInterest, RankedContent } from "@/lib/algorithms/contentRecommendation";
export type { ClientFeatureSnapshot, ServerBehaviorEvent, RiskLevel, RiskReport } from "@/lib/algorithms/ace";

export interface AlphaEngineInput {
  playerProfiles: import("@/lib/algorithms/dda").PlayerProfile[];
  averageLatencyMs?: number;
  economyState: import("@/lib/algorithms/economyBalance").EconomyState;
  dropTable: import("@/lib/algorithms/economyBalance").DropTableItem[];
  queue: import("@/lib/algorithms/matchmaking").QueuedPlayer[];
  rewardOptions: import("@/lib/algorithms/rewardRecommendation").RewardOption[];
  playerBuild: import("@/lib/algorithms/rewardRecommendation").PlayerBuild;
  enemyComposition: import("@/lib/algorithms/rewardRecommendation").EnemyComposition;
  contentItems: import("@/lib/algorithms/contentRecommendation").ContentItem[];
  userInterests: import("@/lib/algorithms/contentRecommendation").UserInterest[];
  clientSnapshot: import("@/lib/algorithms/ace").ClientFeatureSnapshot;
  serverEvents: import("@/lib/algorithms/ace").ServerBehaviorEvent[];
  defenseWaveBase: import("@/lib/algorithms/dda").DefenseWaveBase;
  previousWaveResult?: { cleared: boolean; coreHealthPercent: number };
}

export interface AlphaEngineOutput {
  waveAdjustment: import("@/lib/algorithms/dda").WaveParameters;
  economyReport: import("@/lib/algorithms/economyBalance").EconomyAdjustmentReport;
  squad: import("@/lib/algorithms/matchmaking").Squad;
  rewards: import("@/lib/algorithms/rewardRecommendation").RewardScore[];
  rankedContent: import("@/lib/algorithms/contentRecommendation").RankedContent[];
  riskReport: import("@/lib/algorithms/ace").RiskReport;
}