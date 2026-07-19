import type { RoguelikeStage, Player } from "./types";
import type { RoguelikeRewardBalance } from "./balance";
import {
  generateRoguelikeStagesFromBalance,
  getRoguelikeRewards,
  applyRoguelikeReward,
} from "./balance";

export interface RoguelikeRunState {
  seed: number;
  stages: RoguelikeStage[];
  currentIndex: number;
  selectedRewards: string[];
  pendingRewards: RoguelikeRewardBalance[] | null;
  completed: boolean;
  victory: boolean;
}

export function createRoguelikeRun(seed: number): RoguelikeRunState {
  return {
    seed,
    stages: generateRoguelikeStagesFromBalance(seed),
    currentIndex: 0,
    selectedRewards: [],
    pendingRewards: null,
    completed: false,
    victory: false,
  };
}

export function getCurrentStage(state: RoguelikeRunState): RoguelikeStage | null {
  if (state.currentIndex < 0 || state.currentIndex >= state.stages.length) return null;
  return state.stages[state.currentIndex];
}

export function isStageComplete(stage: RoguelikeStage): boolean {
  return stage.cleared || stage.mission.completed;
}

export function markCurrentStageComplete(state: RoguelikeRunState): void {
  const stage = getCurrentStage(state);
  if (!stage) return;
  stage.cleared = true;
  stage.mission.completed = true;
  stage.mission.progress = stage.mission.target;
}

export function isFinalStage(state: RoguelikeRunState): boolean {
  return state.currentIndex >= state.stages.length - 1;
}

export function getRunProgress(state: RoguelikeRunState): number {
  const cleared = state.stages.filter((s) => s.cleared).length;
  return cleared / state.stages.length;
}

export function advanceStage(state: RoguelikeRunState): boolean {
  if (state.completed) return false;

  const current = getCurrentStage(state);
  if (!current || !isStageComplete(current)) return false;

  if (isFinalStage(state)) {
    state.completed = true;
    state.victory = true;
    return true;
  }

  state.currentIndex += 1;
  state.pendingRewards = null;
  return true;
}

export function generateRewardOptions(
  state: RoguelikeRunState,
  player: Player,
  count = 3
): RoguelikeRewardBalance[] {
  if (state.pendingRewards) return state.pendingRewards;

  const options = getRoguelikeRewards(count, player);
  state.pendingRewards = options;
  return options;
}

export function applyReward(state: RoguelikeRunState, player: Player, rewardId: string): boolean {
  const success = applyRoguelikeReward(player, rewardId);
  if (!success) return false;

  state.selectedRewards.push(rewardId);
  state.pendingRewards = null;
  return true;
}

export function shouldOfferReward(state: RoguelikeRunState): boolean {
  const stage = getCurrentStage(state);
  if (!stage) return false;
  return stage.type === "reward" && isStageComplete(stage) && state.pendingRewards === null;
}

export function getSelectedRewardSummary(state: RoguelikeRunState): string[] {
  return [...state.selectedRewards];
}

export function resetRoguelikeRun(state: RoguelikeRunState, seed: number): void {
  state.seed = seed;
  state.stages = generateRoguelikeStagesFromBalance(seed);
  state.currentIndex = 0;
  state.selectedRewards = [];
  state.pendingRewards = null;
  state.completed = false;
  state.victory = false;
}
