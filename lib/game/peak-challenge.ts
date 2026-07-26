import type { PeakChallengeState, PeakChallengeTask, Player, GameState, DefenseState, UpgradeOption } from "./types";
import { uid } from "./math";
import { generateUpgradeOptions } from "./weapons";
import { getRoguelikeRewards } from "./balance";

export const PEAK_CHALLENGE_BRANCH_WAVE = 25;
export const PEAK_CHALLENGE_REWARD_INTERVAL = 5;

export function createPeakChallengeState(): PeakChallengeState {
  return {
    phase: "normal",
    wave: 1,
    challenges: generatePeakChallengeTasks(1),
    pendingRewards: null,
    rewardBranchOffered: false,
    seasonXp: 0,
    seasonCurrency: 0,
    overclockUnlocked: false,
  };
}

export function generatePeakChallengeTasks(startWave: number): PeakChallengeTask[] {
  const tier = Math.floor((startWave - 1) / 5) + 1;
  const base: Omit<PeakChallengeTask, "id">[] = [
    {
      title: "肃清敌潮",
      description: `累计击杀 ${20 + tier * 10} 个敌人`,
      target: 20 + tier * 10,
      progress: 0,
      completed: false,
      rewardXp: 15 + tier * 5,
      rewardCurrency: 5 + tier * 2,
    },
    {
      title: "据点坚守",
      description: `成功防守 ${startWave + 4} 波`,
      target: startWave + 4,
      progress: startWave - 1,
      completed: false,
      rewardXp: 20 + tier * 5,
      rewardCurrency: 6 + tier * 2,
    },
    {
      title: "精英猎手",
      description: `击杀 ${2 + tier} 个精英敌人`,
      target: 2 + tier,
      progress: 0,
      completed: false,
      rewardXp: 12 + tier * 4,
      rewardCurrency: 4 + tier * 2,
    },
    {
      title: "核心保全",
      description: "任意时刻核心耐久保持 60% 以上完成 1 波",
      target: 1,
      progress: 0,
      completed: false,
      rewardXp: 18 + tier * 4,
      rewardCurrency: 5 + tier * 2,
    },
  ];

  return base.map((b) => ({ ...b, id: uid("pc-ts") }));
}

export function updatePeakChallengeTasks(state: GameState, ds: DefenseState): void {
  const pc = state.peakChallengeState;
  if (!pc) return;

  const corePct = ds.core.health / ds.core.maxHealth;
  for (const ch of pc.challenges) {
    if (ch.completed) continue;

    if (ch.title === "据点坚守") {
      ch.progress = Math.max(ch.progress, ds.currentWave);
    } else if (ch.title === "核心保全" && corePct >= 0.6 && ds.waveInProgress) {
      ch.progress = 1;
    }

    if (ch.progress >= ch.target) {
      ch.completed = true;
      pc.seasonXp += ch.rewardXp;
      pc.seasonCurrency += ch.rewardCurrency;
    }
  }
}

export function recordPeakChallengeKill(state: GameState, enemyIsElite: boolean): void {
  const pc = state.peakChallengeState;
  if (!pc) return;

  pc.seasonXp += 1;
  pc.seasonCurrency += 1;
  if (enemyIsElite) {
    pc.seasonXp += 5;
    pc.seasonCurrency += 3;
  }

  for (const ch of pc.challenges) {
    if (ch.completed) continue;
    if (ch.title === "肃清敌潮") {
      ch.progress += 1;
      if (ch.progress >= ch.target) {
        ch.completed = true;
        pc.seasonXp += ch.rewardXp;
        pc.seasonCurrency += ch.rewardCurrency;
      }
    } else if (ch.title === "精英猎手" && enemyIsElite) {
      ch.progress += 1;
      if (ch.progress >= ch.target) {
        ch.completed = true;
        pc.seasonXp += ch.rewardXp;
        pc.seasonCurrency += ch.rewardCurrency;
      }
    }
  }
}

export function recordPeakChallengeBossKill(state: GameState): void {
  const pc = state.peakChallengeState;
  if (!pc) return;
  pc.seasonXp += 20;
  pc.seasonCurrency += 10;
}

export function recordPeakChallengeWaveCleared(state: GameState): void {
  const pc = state.peakChallengeState;
  if (!pc) return;
  pc.wave = Math.max(pc.wave, (state.defenseState?.currentWave ?? 0) + 1);
  pc.seasonXp += 10;
  pc.seasonCurrency += 4;

  const nextChallengeWave = Math.floor((pc.wave - 1) / 5) * 5 + 1;
  if (pc.wave >= nextChallengeWave + 5) {
    const allCompleted = pc.challenges.every((c) => c.completed);
    if (allCompleted) {
      pc.challenges = generatePeakChallengeTasks(pc.wave);
    }
  }
}

export function shouldOfferPeakChallengeReward(pc: PeakChallengeState, clearedWave: number): boolean {
  if (clearedWave % PEAK_CHALLENGE_REWARD_INTERVAL !== 0) return false;
  if (pc.rewardBranchOffered && clearedWave === PEAK_CHALLENGE_BRANCH_WAVE) return false;
  return true;
}

export function generatePeakChallengeRewardOptions(player: Player): UpgradeOption[] {
  return generateUpgradeOptions(player).slice(0, 3);
}

export function generatePeakChallengeRoguelikeRewards(player: Player) {
  return getRoguelikeRewards(3, player);
}

export function applyPeakChallengeEndRewards(state: GameState): { xp: number; currency: number } {
  const pc = state.peakChallengeState;
  if (!pc) return { xp: 0, currency: 0 };

  const waveBonus = pc.wave * 3;
  const killBonus = Math.floor(state.stats.kills / 10);
  const finalCurrency = pc.seasonCurrency + waveBonus + killBonus;
  return { xp: pc.seasonXp, currency: finalCurrency };
}