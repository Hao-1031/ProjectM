import type { FlagshipState, FlagshipChallenge, Player, GameState, DefenseState, UpgradeOption } from "./types";
import { uid } from "./math";
import { generateUpgradeOptions } from "./weapons";
import { getRoguelikeRewards } from "./balance";

export const FLAGSHIP_BRANCH_WAVE = 25;
export const FLAGSHIP_REWARD_INTERVAL = 5;

export function createFlagshipState(): FlagshipState {
  return {
    phase: "normal",
    wave: 1,
    challenges: generateFlagshipChallenges(1),
    pendingRewards: null,
    rewardBranchOffered: false,
    seasonXp: 0,
    seasonCurrency: 0,
    overclockUnlocked: false,
  };
}

export function generateFlagshipChallenges(startWave: number): FlagshipChallenge[] {
  const tier = Math.floor((startWave - 1) / 5) + 1;
  const base: Omit<FlagshipChallenge, "id">[] = [
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

  return base.map((b) => ({ ...b, id: uid("fs-ch") }));
}

export function updateFlagshipChallenges(state: GameState, ds: DefenseState): void {
  const fs = state.flagshipState;
  if (!fs) return;

  const corePct = ds.core.health / ds.core.maxHealth;
  for (const ch of fs.challenges) {
    if (ch.completed) continue;

    if (ch.title === "据点坚守") {
      ch.progress = Math.max(ch.progress, ds.currentWave);
    } else if (ch.title === "核心保全" && corePct >= 0.6 && ds.waveInProgress) {
      ch.progress = 1;
    }

    if (ch.progress >= ch.target) {
      ch.completed = true;
      fs.seasonXp += ch.rewardXp;
      fs.seasonCurrency += ch.rewardCurrency;
    }
  }
}

export function recordFlagshipKill(state: GameState, enemyIsElite: boolean): void {
  const fs = state.flagshipState;
  if (!fs) return;

  fs.seasonXp += 1;
  fs.seasonCurrency += 1;
  if (enemyIsElite) {
    fs.seasonXp += 5;
    fs.seasonCurrency += 3;
  }

  for (const ch of fs.challenges) {
    if (ch.completed) continue;
    if (ch.title === "肃清敌潮") {
      ch.progress += 1;
      if (ch.progress >= ch.target) {
        ch.completed = true;
        fs.seasonXp += ch.rewardXp;
        fs.seasonCurrency += ch.rewardCurrency;
      }
    } else if (ch.title === "精英猎手" && enemyIsElite) {
      ch.progress += 1;
      if (ch.progress >= ch.target) {
        ch.completed = true;
        fs.seasonXp += ch.rewardXp;
        fs.seasonCurrency += ch.rewardCurrency;
      }
    }
  }
}

export function recordFlagshipBossKill(state: GameState): void {
  const fs = state.flagshipState;
  if (!fs) return;
  fs.seasonXp += 20;
  fs.seasonCurrency += 10;
}

export function recordFlagshipWaveCleared(state: GameState): void {
  const fs = state.flagshipState;
  if (!fs) return;
  fs.wave = Math.max(fs.wave, (state.defenseState?.currentWave ?? 0) + 1);
  fs.seasonXp += 10;
  fs.seasonCurrency += 4;

  const nextChallengeWave = Math.floor((fs.wave - 1) / 5) * 5 + 1;
  if (fs.wave >= nextChallengeWave + 5) {
    const allCompleted = fs.challenges.every((c) => c.completed);
    if (allCompleted) {
      fs.challenges = generateFlagshipChallenges(fs.wave);
    }
  }
}

export function shouldOfferFlagshipReward(fs: FlagshipState, clearedWave: number): boolean {
  if (clearedWave % FLAGSHIP_REWARD_INTERVAL !== 0) return false;
  if (fs.rewardBranchOffered && clearedWave === FLAGSHIP_BRANCH_WAVE) return false;
  return true;
}

export function generateFlagshipRewardOptions(player: Player): UpgradeOption[] {
  return generateUpgradeOptions(player).slice(0, 3);
}

export function generateFlagshipRoguelikeRewards(player: Player) {
  return getRoguelikeRewards(3, player);
}

export function applyFlagshipEndRewards(state: GameState): { xp: number; currency: number } {
  const fs = state.flagshipState;
  if (!fs) return { xp: 0, currency: 0 };

  const waveBonus = fs.wave * 3;
  const killBonus = Math.floor(state.stats.kills / 10);
  const finalCurrency = fs.seasonCurrency + waveBonus + killBonus;
  return { xp: fs.seasonXp, currency: finalCurrency };
}
