export type AlgorithmId =
  | "dda"
  | "ace"
  | "matchmaking"
  | "map-balance"
  | "content-recommendation"
  | "economy-balance"
  | "reward-recommendation"
  | "spawn-optimizer"
  | "network-prediction";

export interface AlgorithmMeta {
  id: AlgorithmId;
  name: string;
  tagline: string;
  description: string;
  inputs: string[];
  outputs: string[];
  tags: string[];
}
