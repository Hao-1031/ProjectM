import type { FlagshipState, FlagshipChallenge, GameState, DefenseState, FlagshipSpeedRank } from "./types";
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
    timeAttackScore: 0,
    perfectWaves: 0,
    teamComboMultiplier: 1,
    speedRank: "none",
    waveClearTimes: [],
    comboBreakerCount: 0,
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
    {
      title: "极速通关",
      description: `在 ${60 - tier * 3} 秒内完成一波`,
      target: 1,
      progress: 0,
      completed: false,
      rewardScore: 150 + tier * 50,
    },
    {
      title: "完美防线",
      description: "核心不受任何伤害完成一波",
      target: 1,
      progress: 0,
      completed: false,
      rewardScore: 200 + tier * 60,
    },
  ];

  return base.map((b) => ({ ...b, id: uid("fs-ch") }));
}

export function updateFlagshipChallenges(state: GameState, ds: DefenseState): void {
  const fs = state.flagshipState;
  if (!fs) return;

  const corePct = ds.core.health / ds.core.maxHealth;
  const waveClearTime = ds.waveTimer;
  for (const ch of fs.challenges) {
    if (ch.completed) continue;

    if (ch.title === "核心护卫" && corePct >= 0.7 && ds.waveInProgress) {
      ch.progress = 1;
    }
    if (ch.title === "极速通关" && waveClearTime <= 60 - (Math.floor((fs.wave - 1) / 5) + 1) * 3 && ds.waveInProgress) {
      ch.progress = 1;
    }
    if (ch.title === "完美防线" && corePct >= 1 && ds.waveInProgress) {
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

  const ds = state.defenseState;
  const waveClearTime = ds?.waveTimer ?? 60;
  fs.waveClearTimes.push(waveClearTime);

  const timeBonus = Math.max(0, Math.round((60 - waveClearTime) * 2));
  fs.timeAttackScore += timeBonus;
  fs.score += timeBonus;

  if (ds && ds.core.health >= ds.core.maxHealth) {
    fs.perfectWaves += 1;
    fs.score += 200;
  }

  fs.speedRank = calculateFlagshipSpeedRank(fs.timeAttackScore, fs.wave);

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
  const perfectBonus = fs.perfectWaves * 200;
  const speedMultiplier = getFlagshipSpeedRankMultiplier(fs.speedRank);
  const finalScore = Math.round((fs.score + waveBonus + bossBonus + comboBonus + perfectBonus) * speedMultiplier);
  return { score: finalScore, waveBonus };
}

export function calculateFlagshipSpeedRank(
  timeAttackScore: number,
  wave: number
): FlagshipSpeedRank {
  if (wave < 1) return "none";
  const avgScore = timeAttackScore / wave;
  if (avgScore >= 100) return "diamond";
  if (avgScore >= 75) return "platinum";
  if (avgScore >= 50) return "gold";
  if (avgScore >= 30) return "silver";
  if (avgScore >= 15) return "bronze";
  return "none";
}

export function getFlagshipSpeedRankName(rank: FlagshipSpeedRank): string {
  const names: Record<FlagshipSpeedRank, string> = {
    none: "未评级",
    bronze: "青铜",
    silver: "白银",
    gold: "黄金",
    platinum: "铂金",
    diamond: "钻石",
  };
  return names[rank];
}

export function getFlagshipSpeedRankMultiplier(rank: FlagshipSpeedRank): number {
  const multipliers: Record<FlagshipSpeedRank, number> = {
    none: 1,
    bronze: 1.1,
    silver: 1.2,
    gold: 1.35,
    platinum: 1.5,
    diamond: 1.75,
  };
  return multipliers[rank];
}