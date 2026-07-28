import type {
  FlagshipPeakState,
  FlagshipPeakPhase,
  FlagshipPeakChallenge,
  FlagshipPeakTask,
  GameState,
  DefenseState,
  FlagshipSpeedRank,
  PeakSeasonRank,
} from "./types";
import { uid } from "./math";

// ========================================================================
// 旗舰巅峰统一模式 — 三阶段25波据点防守
// 标准巡航(1-10) → 超频增压(11-20) → 地狱终局(21-25)
// 双轨挑战(固定+动态) + 双维度评级(速度+赛季) + 统一积分制
// ========================================================================

export const FLAGSHIP_PEAK_TOTAL_WAVES = 25;
export const FLAGSHIP_PEAK_STANDARD_END = 10;
export const FLAGSHIP_PEAK_OVERCLOCK_END = 20;
export const FLAGSHIP_PEAK_BOSS_WAVE_1 = 10;
export const FLAGSHIP_PEAK_BOSS_WAVE_2 = 23;
export const FLAGSHIP_PEAK_FINAL_BOSS_WAVE = 25;
export const FLAGSHIP_PEAK_CHALLENGE_INTERVAL = 5;
export const FLAGSHIP_PEAK_REWARD_INTERVAL = 5;

// ========================================================================
// 状态初始化
// ========================================================================

export function createFlagshipPeakState(): FlagshipPeakState {
  return {
    phase: "standard",
    wave: 0,
    totalWaves: FLAGSHIP_PEAK_TOTAL_WAVES,
    challenges: generateFlagshipPeakChallenges(1),
    tasks: [],
    score: 0,
    combos: 0,
    maxCombo: 0,
    bossKills: 0,
    eliteKills: 0,
    coreHealth: 100,
    coreMaxHealth: 100,
    timeAttackScore: 0,
    perfectWaves: 0,
    speedRank: "none",
    seasonRank: "bronze",
    seasonXp: 0,
    waveClearTimes: [],
    comboBreakerCount: 0,
    challengeStreak: 0,
    seasonCurrency: 0,
  };
}

// ========================================================================
// 阶段判定
// ========================================================================

export function getFlagshipPeakPhase(wave: number): FlagshipPeakPhase {
  if (wave <= FLAGSHIP_PEAK_STANDARD_END) return "standard";
  if (wave <= FLAGSHIP_PEAK_OVERCLOCK_END) return "overclock";
  return "hell";
}

export function getPhaseDisplayName(phase: FlagshipPeakPhase): string {
  switch (phase) {
    case "standard": return "标准巡航";
    case "overclock": return "超频增压";
    case "hell": return "地狱终局";
    case "victory": return "胜利";
    case "defeat": return "失败";
  }
}

export function getPhaseOverlayColor(phase: FlagshipPeakPhase): string {
  switch (phase) {
    case "standard": return "rgba(12, 10, 20, 0.15)";
    case "overclock": return "rgba(180, 30, 30, 0.12)";
    case "hell": return "rgba(0, 0, 0, 0.35)";
    case "victory": return "rgba(20, 80, 40, 0.15)";
    case "defeat": return "rgba(80, 10, 10, 0.25)";
  }
}

export function getPhaseAccentColor(phase: FlagshipPeakPhase): string {
  switch (phase) {
    case "standard": return "#6366f1";
    case "overclock": return "#ef4444";
    case "hell": return "#a855f7";
    case "victory": return "#22c55e";
    case "defeat": return "#ef4444";
  }
}

export function getPhaseDifficultyMultiplier(phase: FlagshipPeakPhase): number {
  switch (phase) {
    case "standard": return 1.0;
    case "overclock": return 1.5;
    case "hell": return 2.0;
    default: return 1.0;
  }
}

// ========================================================================
// 双轨挑战生成
// ========================================================================

export function generateFlagshipPeakChallenges(startWave: number): FlagshipPeakChallenge[] {
  const tier = Math.floor((startWave - 1) / FLAGSHIP_PEAK_CHALLENGE_INTERVAL) + 1;
  const phase = getFlagshipPeakPhase(startWave);

  const base: Omit<FlagshipPeakChallenge, "id">[] = [
    {
      title: "旗舰火力",
      description: `累计击杀 ${30 + tier * 15} 个敌人`,
      target: 30 + tier * 15,
      progress: 0,
      completed: false,
      rewardScore: 100 + tier * 50,
      category: "fixed",
    },
    {
      title: "精英清扫",
      description: `击杀 ${3 + tier} 个精英敌人`,
      target: 3 + tier,
      progress: 0,
      completed: false,
      rewardScore: 80 + tier * 40,
      category: "fixed",
    },
    {
      title: "核心护卫",
      description: `核心耐久保持在 70% 以上完成 1 波`,
      target: 1,
      progress: 0,
      completed: false,
      rewardScore: 120 + tier * 50,
      category: "fixed",
    },
    {
      title: "连击大师",
      description: `达成 ${5 + tier * 2} 连击`,
      target: 5 + tier * 2,
      progress: 0,
      completed: false,
      rewardScore: 90 + tier * 40,
      category: "fixed",
    },
    {
      title: "极速通关",
      description: `在 ${60 - tier * 3} 秒内完成一波`,
      target: 1,
      progress: 0,
      completed: false,
      rewardScore: 150 + tier * 50,
      category: "fixed",
    },
    {
      title: "完美防线",
      description: "核心不受任何伤害完成一波",
      target: 1,
      progress: 0,
      completed: false,
      rewardScore: 200 + tier * 60,
      category: "fixed",
    },
  ];

  return base.map((b) => ({ ...b, id: uid("fp-ch") }));
}

export function generateFlagshipPeakTasks(phase: FlagshipPeakPhase, wave: number): FlagshipPeakTask[] {
  if (phase === "standard") return [];

  const tier = Math.floor((wave - 1) / FLAGSHIP_PEAK_CHALLENGE_INTERVAL) + 1;

  const tasks: Omit<FlagshipPeakTask, "id">[] = [];

  if (phase === "overclock") {
    tasks.push({
      title: "超频极限",
      description: `在超频阶段存活 ${3 + tier} 波`,
      target: 3 + tier,
      progress: 0,
      completed: false,
      rewardScore: 200 + tier * 60,
      phase: "overclock",
    });
    tasks.push({
      title: "首领猎杀",
      description: `在超频阶段击杀 ${1 + Math.floor(tier / 3)} 个首领`,
      target: 1 + Math.floor(tier / 3),
      progress: 0,
      completed: false,
      rewardScore: 300 + tier * 50,
      phase: "overclock",
    });
    tasks.push({
      title: "无伤之波",
      description: "完成一波不受任何伤害",
      target: 1,
      progress: 0,
      completed: false,
      rewardScore: 250 + tier * 50,
      phase: "overclock",
    });
  }

  if (phase === "hell") {
    tasks.push({
      title: "地狱行者",
      description: `在地狱阶段存活 ${2 + tier} 波`,
      target: 2 + tier,
      progress: 0,
      completed: false,
      rewardScore: 400 + tier * 80,
      phase: "hell",
    });
    tasks.push({
      title: "终极猎杀",
      description: `在地狱阶段击杀 ${1 + Math.floor(tier / 2)} 个首领`,
      target: 1 + Math.floor(tier / 2),
      progress: 0,
      completed: false,
      rewardScore: 500 + tier * 60,
      phase: "hell",
    });
    tasks.push({
      title: "虚空不屈",
      description: "核心耐久保持 50% 以上完成地狱阶段一波",
      target: 1,
      progress: 0,
      completed: false,
      rewardScore: 350 + tier * 50,
      phase: "hell",
    });
  }

  return tasks.map((t) => ({ ...t, id: uid("fp-ts") }));
}

// ========================================================================
// 挑战更新
// ========================================================================

export function updateFlagshipPeakChallenges(state: GameState, ds: DefenseState): void {
  const fp = state.flagshipPeakState;
  if (!fp) return;

  const corePct = ds.core.health / ds.core.maxHealth;
  const waveClearTime = ds.waveTimer;

  for (const ch of fp.challenges) {
    if (ch.completed) continue;

    if (ch.title === "核心护卫" && corePct >= 0.7 && ds.waveInProgress) {
      ch.progress = 1;
    }
    if (ch.title === "极速通关") {
      const tier = Math.floor((fp.wave - 1) / FLAGSHIP_PEAK_CHALLENGE_INTERVAL) + 1;
      if (waveClearTime <= 60 - tier * 3 && ds.waveInProgress) {
        ch.progress = 1;
      }
    }
    if (ch.title === "完美防线" && corePct >= 1 && ds.waveInProgress) {
      ch.progress = 1;
    }

    if (ch.progress >= ch.target) {
      ch.completed = true;
      fp.score += ch.rewardScore;
    }
  }
}

export function updateFlagshipPeakTasks(state: GameState, ds: DefenseState): void {
  const fp = state.flagshipPeakState;
  if (!fp) return;

  const corePct = ds.core.health / ds.core.maxHealth;

  for (const task of fp.tasks) {
    if (task.completed) continue;
    if (task.phase && task.phase !== fp.phase) continue;

    if (task.title === "虚空不屈" && corePct >= 0.5 && ds.waveInProgress) {
      task.progress = 1;
    }
    if (task.title === "无伤之波" && corePct >= 1 && ds.waveInProgress && fp.phase === "overclock") {
      task.progress = 1;
    }
    if (task.title === "超频极限" && fp.phase === "overclock") {
      task.progress = Math.max(task.progress, fp.wave - FLAGSHIP_PEAK_STANDARD_END);
    }
    if (task.title === "地狱行者" && fp.phase === "hell") {
      task.progress = Math.max(task.progress, fp.wave - FLAGSHIP_PEAK_OVERCLOCK_END);
    }

    if (task.progress >= task.target) {
      task.completed = true;
      fp.score += task.rewardScore;
    }
  }
}

// ========================================================================
// 击杀与波次结算
// ========================================================================

export function recordFlagshipPeakKill(state: GameState, enemyIsElite: boolean): void {
  const fp = state.flagshipPeakState;
  if (!fp) return;

  fp.combos += 1;
  if (fp.combos > fp.maxCombo) {
    fp.maxCombo = fp.combos;
  }
  fp.score += 10 + fp.combos;
  fp.seasonXp += 1;
  fp.seasonCurrency += 1;

  if (enemyIsElite) {
    fp.eliteKills += 1;
    fp.score += 50;
    fp.seasonXp += 5;
    fp.seasonCurrency += 3;
  }

  for (const ch of fp.challenges) {
    if (ch.completed) continue;
    if (ch.title === "旗舰火力") {
      ch.progress += 1;
      if (ch.progress >= ch.target) {
        ch.completed = true;
        fp.score += ch.rewardScore;
      }
    } else if (ch.title === "精英清扫" && enemyIsElite) {
      ch.progress += 1;
      if (ch.progress >= ch.target) {
        ch.completed = true;
        fp.score += ch.rewardScore;
      }
    } else if (ch.title === "连击大师" && fp.combos >= ch.target) {
      ch.progress = ch.target;
      if (ch.progress >= ch.target) {
        ch.completed = true;
        fp.score += ch.rewardScore;
      }
    }
  }

  for (const task of fp.tasks) {
    if (task.completed) continue;
    if (task.title === "首领猎杀" && enemyIsElite && fp.phase === "overclock") {
      task.progress += 1;
      if (task.progress >= task.target) {
        task.completed = true;
        fp.score += task.rewardScore;
      }
    }
    if (task.title === "终极猎杀" && enemyIsElite && fp.phase === "hell") {
      task.progress += 1;
      if (task.progress >= task.target) {
        task.completed = true;
        fp.score += task.rewardScore;
      }
    }
  }
}

export function recordFlagshipPeakBossKill(state: GameState): void {
  const fp = state.flagshipPeakState;
  if (!fp) return;
  fp.bossKills += 1;
  fp.score += 200;
  fp.seasonXp += 20;
  fp.seasonCurrency += 10;
}

export function recordFlagshipPeakWaveCleared(state: GameState): void {
  const fp = state.flagshipPeakState;
  if (!fp) return;

  fp.wave = Math.max(fp.wave, (state.defenseState?.currentWave ?? 0) + 1);
  fp.score += 50;
  fp.seasonXp += 10;
  fp.seasonCurrency += 4;

  const ds = state.defenseState;
  const waveClearTime = ds?.waveTimer ?? 60;
  fp.waveClearTimes.push(waveClearTime);

  const timeBonus = Math.max(0, Math.round((60 - waveClearTime) * 2));
  fp.timeAttackScore += timeBonus;
  fp.score += timeBonus;

  if (ds && ds.core.health >= ds.core.maxHealth) {
    fp.perfectWaves += 1;
    fp.score += 200;
  }

  // 更新阶段
  fp.phase = getFlagshipPeakPhase(fp.wave);

  // 更新速度评级
  fp.speedRank = calculateFlagshipPeakSpeedRank(fp.timeAttackScore, fp.wave);

  // 更新赛季段位
  fp.seasonRank = calculateFlagshipPeakSeasonRank(fp.seasonXp);

  // 阶段切换时生成动态任务
  if (fp.wave === FLAGSHIP_PEAK_STANDARD_END + 1) {
    fp.tasks = generateFlagshipPeakTasks("overclock", fp.wave);
  }
  if (fp.wave === FLAGSHIP_PEAK_OVERCLOCK_END + 1) {
    fp.tasks = generateFlagshipPeakTasks("hell", fp.wave);
  }

  // 每5波刷新固定挑战
  const nextChallengeWave = Math.floor((fp.wave - 1) / FLAGSHIP_PEAK_CHALLENGE_INTERVAL) * FLAGSHIP_PEAK_CHALLENGE_INTERVAL + 1;
  if (fp.wave >= nextChallengeWave + FLAGSHIP_PEAK_CHALLENGE_INTERVAL) {
    const allCompleted = fp.challenges.every((c) => c.completed);
    if (allCompleted) {
      fp.challenges = generateFlagshipPeakChallenges(fp.wave);
      fp.challengeStreak += 1;
      fp.score += fp.challengeStreak * 50;
    } else {
      fp.challengeStreak = 0;
    }
  }
}

export function updateFlagshipPeakCoreHealth(state: GameState, ds: DefenseState): void {
  const fp = state.flagshipPeakState;
  if (!fp) return;
  fp.coreHealth = ds.core.health;
  fp.coreMaxHealth = ds.core.maxHealth;
}

// ========================================================================
// 通关结算
// ========================================================================

export function applyFlagshipPeakEndRewards(
  state: GameState,
  victory: boolean
): { score: number; xp: number; currency: number; speedRank: FlagshipSpeedRank; seasonRank: PeakSeasonRank } {
  const fp = state.flagshipPeakState;
  if (!fp) {
    return { score: 0, xp: 0, currency: 0, speedRank: "none", seasonRank: "bronze" };
  }

  const waveBonus = fp.wave * 30;
  const bossBonus = fp.bossKills * 100;
  const comboBonus = fp.maxCombo * 20;
  const perfectBonus = fp.perfectWaves * 200;
  const victoryBonus = victory ? 500 : 0;

  const speedMultiplier = getFlagshipPeakSpeedRankMultiplier(fp.speedRank);

  const finalScore = Math.round(
    (fp.score + waveBonus + bossBonus + comboBonus + perfectBonus + victoryBonus) * speedMultiplier
  );

  const finalXp = fp.seasonXp + Math.floor(finalScore / 10);
  const finalCurrency = fp.seasonCurrency + Math.floor(finalScore / 20);

  return {
    score: finalScore,
    xp: finalXp,
    currency: finalCurrency,
    speedRank: fp.speedRank,
    seasonRank: fp.seasonRank,
  };
}

// ========================================================================
// 评级计算
// ========================================================================

export function calculateFlagshipPeakSpeedRank(
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

export function calculateFlagshipPeakSeasonRank(seasonXp: number): PeakSeasonRank {
  if (seasonXp >= 100000) return "grandmaster";
  if (seasonXp >= 50000) return "master";
  if (seasonXp >= 25000) return "diamond";
  if (seasonXp >= 10000) return "platinum";
  if (seasonXp >= 5000) return "gold";
  if (seasonXp >= 2000) return "silver";
  return "bronze";
}

export function getFlagshipPeakSpeedRankMultiplier(rank: FlagshipSpeedRank): number {
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

export function getFlagshipPeakSpeedRankName(rank: FlagshipSpeedRank): string {
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

export function getFlagshipPeakSeasonRankName(rank: PeakSeasonRank): string {
  const names: Record<PeakSeasonRank, string> = {
    bronze: "青铜",
    silver: "白银",
    gold: "黄金",
    platinum: "铂金",
    diamond: "钻石",
    master: "大师",
    grandmaster: "宗师",
  };
  return names[rank];
}

// ========================================================================
// 阶段视觉叠加配置
// ========================================================================

export interface FlagshipPeakVisualConfig {
  overlayColor: string;
  overlayOpacity: number;
  accentColor: string;
  borderGlow: string;
  hudTheme: "bridge" | "alert" | "void";
  particleDensity: number;
  screenShakeIntensity: number;
}

export function getFlagshipPeakVisualConfig(phase: FlagshipPeakPhase): FlagshipPeakVisualConfig {
  switch (phase) {
    case "standard":
      return {
        overlayColor: "#0c0a14",
        overlayOpacity: 0.08,
        accentColor: "#6366f1",
        borderGlow: "0 0 20px rgba(99, 102, 241, 0.3)",
        hudTheme: "bridge",
        particleDensity: 0.3,
        screenShakeIntensity: 0,
      };
    case "overclock":
      return {
        overlayColor: "#b41e1e",
        overlayOpacity: 0.12,
        accentColor: "#ef4444",
        borderGlow: "0 0 30px rgba(239, 68, 68, 0.5)",
        hudTheme: "alert",
        particleDensity: 0.8,
        screenShakeIntensity: 0.4,
      };
    case "hell":
      return {
        overlayColor: "#000000",
        overlayOpacity: 0.35,
        accentColor: "#a855f7",
        borderGlow: "0 0 40px rgba(168, 85, 247, 0.6)",
        hudTheme: "void",
        particleDensity: 1.5,
        screenShakeIntensity: 0.7,
      };
    case "victory":
      return {
        overlayColor: "#145028",
        overlayOpacity: 0.12,
        accentColor: "#22c55e",
        borderGlow: "0 0 25px rgba(34, 197, 94, 0.4)",
        hudTheme: "bridge",
        particleDensity: 0.2,
        screenShakeIntensity: 0,
      };
    case "defeat":
      return {
        overlayColor: "#500a0a",
        overlayOpacity: 0.25,
        accentColor: "#ef4444",
        borderGlow: "0 0 20px rgba(239, 68, 68, 0.3)",
        hudTheme: "void",
        particleDensity: 0.4,
        screenShakeIntensity: 0,
      };
  }
}

// ========================================================================
// 波次配置生成
// ========================================================================

export function generateFlagshipPeakWaveConfig(
  waveIndex: number
): {
  enemyCount: number;
  eliteCount: number;
  bossVariant: string | null;
  nodeActivator: boolean;
  duration: number;
  healthMultiplier: number;
  damageMultiplier: number;
  spawnIntervalMultiplier: number;
  specialEventChance: number;
} {
  const phase = getFlagshipPeakPhase(waveIndex);
  const phaseMul = getPhaseDifficultyMultiplier(phase);

  const baseEnemyCount = 8 + waveIndex * 2;
  const baseEliteCount = waveIndex >= 5 ? Math.floor(waveIndex / 3) : 0;

  let bossVariant: string | null = null;
  if (waveIndex === FLAGSHIP_PEAK_BOSS_WAVE_1) bossVariant = "overlord";
  if (waveIndex === FLAGSHIP_PEAK_BOSS_WAVE_2) bossVariant = "annihilator";
  if (waveIndex === FLAGSHIP_PEAK_FINAL_BOSS_WAVE) bossVariant = "dreadnought";

  return {
    enemyCount: Math.floor(baseEnemyCount * phaseMul),
    eliteCount: Math.floor(baseEliteCount * phaseMul),
    bossVariant,
    nodeActivator: waveIndex % 3 === 0,
    duration: 60 + waveIndex * 5,
    healthMultiplier: 1 + waveIndex * 0.08 * phaseMul,
    damageMultiplier: 1 + waveIndex * 0.06 * phaseMul,
    spawnIntervalMultiplier: Math.max(0.3, 1 - waveIndex * 0.025 * phaseMul),
    specialEventChance: phase === "hell" ? 0.3 : phase === "overclock" ? 0.15 : 0.05,
  };
}