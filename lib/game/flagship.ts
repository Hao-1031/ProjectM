import type { FlagshipState, FlagshipChallenge, GameState, DefenseState } from "./types";
import { uid } from "./math";

export const FLAGSHIP_TOTAL_WAVES = 15;
export const FLAGSHIP_BOSS_WAVE = 10;

export function createFlagshipState(): FlagshipState {
  return {
    phase: "prep",
    wave: 0,
    totalWaves: FLAGSHIP_TOTAL_WAVES,
    challenges: generateFlagshipChallenges(1),
    score: 0,
    combos: 0,
    maxCombo: 0,
    bossKills: 0,
    eliteKills: 0,
    coreHealth: 100,
    coreMaxHealth: 100,
  };
}

export function generateFlagshipChallenges(startWave: number): FlagshipChallenge[] {
  const tier = Math.floor((startWave - 1) / 5) + 1;
  const base: Omit<FlagshipChallenge, "id">[] = [
    {
      title: "旗舰火力",
      description: `累计击杀 ${30 + tier * 15} 个敌人`,
      target: 30 + tier * 15,
      progress: 0,
      completed: false,
      rewardScore: 100 + tier * 50,
    },
    {
      title: "精英清扫",
      description: `击杀 ${3 + tier} 个精英敌人`,
      target: 3 + tier,
      progress: 0,
      completed: false,
      rewardScore: 80 + tier * 40,
    },
    {
      title: "核心护卫",
      description: `核心耐久保持在 70% 以上完成 1 波`,
      target: 1,
      progress: 0,
      completed: false,
      rewardScore: 120 + tier * 50,
    },
    {
      title: "连击大师",
      description: `达成 ${5 + tier * 2} 连击`,
      target: 5 + tier * 2,
      progress: 0,
      completed: false,
      rewardScore: 90 + tier * 40,
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

    if (ch.title === "核心护卫" && corePct >= 0.7 && ds.waveInProgress) {
      ch.progress = 1;
    }

    if (ch.progress >= ch.target) {
      ch.completed = true;
      fs.score += ch.rewardScore;
    }
  }
}

export function recordFlagshipKill(state: GameState, enemyIsElite: boolean): void {
  const fs = state.flagshipState;
  if (!fs) return;

  fs.combos += 1;
  if (fs.combos > fs.maxCombo) {
    fs.maxCombo = fs.combos;
  }
  fs.score += 10 + fs.combos;
  if (enemyIsElite) {
    fs.eliteKills += 1;
    fs.score += 50;
  }

  for (const ch of fs.challenges) {
    if (ch.completed) continue;
    if (ch.title === "旗舰火力") {
      ch.progress += 1;
      if (ch.progress >= ch.target) {
        ch.completed = true;
        fs.score += ch.rewardScore;
      }
    } else if (ch.title === "精英清扫" && enemyIsElite) {
      ch.progress += 1;
      if (ch.progress >= ch.target) {
        ch.completed = true;
        fs.score += ch.rewardScore;
      }
    } else if (ch.title === "连击大师" && fs.combos >= ch.target) {
      ch.progress = ch.target;
      if (ch.progress >= ch.target) {
        ch.completed = true;
        fs.score += ch.rewardScore;
      }
    }
  }
}

export function recordFlagshipBossKill(state: GameState): void {
  const fs = state.flagshipState;
  if (!fs) return;
  fs.bossKills += 1;
  fs.score += 200;
}

export function recordFlagshipWaveCleared(state: GameState): void {
  const fs = state.flagshipState;
  if (!fs) return;
  fs.wave = Math.max(fs.wave, (state.defenseState?.currentWave ?? 0) + 1);
  fs.score += 50;

  const nextChallengeWave = Math.floor((fs.wave - 1) / 5) * 5 + 1;
  if (fs.wave >= nextChallengeWave + 5) {
    const allCompleted = fs.challenges.every((c) => c.completed);
    if (allCompleted) {
      fs.challenges = generateFlagshipChallenges(fs.wave);
    }
  }
}

export function updateFlagshipCoreHealth(state: GameState, ds: DefenseState): void {
  const fs = state.flagshipState;
  if (!fs) return;
  fs.coreHealth = ds.core.health;
  fs.coreMaxHealth = ds.core.maxHealth;
}

export function applyFlagshipEndRewards(state: GameState): { score: number; waveBonus: number } {
  const fs = state.flagshipState;
  if (!fs) return { score: 0, waveBonus: 0 };

  const waveBonus = fs.wave * 30;
  const bossBonus = fs.bossKills * 100;
  const comboBonus = fs.maxCombo * 20;
  const finalScore = fs.score + waveBonus + bossBonus + comboBonus;
  return { score: finalScore, waveBonus };
}