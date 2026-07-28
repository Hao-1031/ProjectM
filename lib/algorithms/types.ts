export type AlgorithmId =
  | "dda"
  | "ace"
  | "matchmaking"
  | "map-balance"
  | "content-recommendation"
  | "economy-balance"
  | "reward-recommendation"
  | "spawn-optimizer"
  | "network-prediction"
  | "enemy-movement"
  | "bot-ai"
  | "progression"
  | "pathfinding"
  | "team-coordination"
  | "adaptive-spawn";

export interface AlgorithmMeta {
  id: AlgorithmId;
  name: string;
  tagline: string;
  description: string;
  inputs: string[];
  outputs: string[];
  tags: string[];
}
