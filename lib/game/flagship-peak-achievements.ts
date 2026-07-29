import type {
  FlagshipPeakState,
  FlagshipPeakPhase,
  FlagshipPeakAchievement,
  FlagshipPeakAchievementId,
  FlagshipPeakMilestone,
  FlagshipPeakPhaseReward,
  FlagshipPeakRadarScore,
  FlagshipPeakRadarDimension,
  FlagshipPeakSettlement,
  FlagshipSpeedRank,
} from "./types";
import {
  FLAGSHIP_PEAK_STANDARD_END,
  FLAGSHIP_PEAK_OVERCLOCK_END,
  FLAGSHIP_PEAK_TOTAL_WAVES,
} from "./flagship-peak";

// ========================================================================
// 隐藏成就定义 — 5核心 + 1稀有 + 1终极
// ========================================================================

export const FLAGSHIP_PEAK_ACHIEVEMENTS: FlagshipPeakAchievement[] = [
  {
    id: "no_damage_10",
    title: "钢铁防线",
    description: "前10波核心不受任何伤害",
    rarity: "common",
    icon: "shield",
    unlocked: false,
  },
  {
    id: "speedrun_flagship",
    title: "闪电突袭",
    description: "平均每波通关时间低于30秒",
    rarity: "common",
    icon: "lightning",
    unlocked: false,
  },
  {
    id: "all_challenges",
    title: "挑战征服者",
    description: "完成全部固定挑战（至少三轮）",
    rarity: "common",
    icon: "target",
    unlocked: false,
  },
  {
    id: "hell_survivor",
    title: "地狱幸存者",
    description: "在地狱终局阶段存活至少3波",
    rarity: "rare",
    icon: "skull",
    unlocked: false,
  },
  {
    id: "zero_death_25",
    title: "不朽传奇",
    description: "25波全程零死亡通关",
    rarity: "rare",
    icon: "crown",
    unlocked: false,
  },
  {
    id: "triple_s_rank",
    title: "三阶全S",
    description: "标准/超频/地狱三阶段均获得速度评级S及以上",
    rarity: "rare",
    icon: "star",
    unlocked: false,
  },
  {
    id: "void_lord",
    title: "虚空之主",
    description: "同时达成「不朽传奇」+「三阶全S」+「挑战征服者」",
    rarity: "legendary",
    icon: "hexagon",
    unlocked: false,
  },
];

// ========================================================================
// 波次里程碑
// ========================================================================

export const FLAGSHIP_PEAK_MILESTONES: FlagshipPeakMilestone[] = [
  { wave: 5, xpReward: 50, currencyReward: 10, label: "初露锋芒", reached: false },
  { wave: 10, xpReward: 150, currencyReward: 30, label: "标准巡航完成", reached: false },
  { wave: 15, xpReward: 300, currencyReward: 60, label: "超频中段", reached: false },
  { wave: 20, xpReward: 500, currencyReward: 100, label: "超频增压完成", reached: false },
  { wave: 25, xpReward: 1000, currencyReward: 200, label: "地狱终局征服", reached: false },
];

// ========================================================================
// 阶段奖励
// ========================================================================

export const FLAGSHIP_PEAK_PHASE_REWARDS: Record<string, FlagshipPeakPhaseReward> = {
  standard: {
    phase: "standard",
    xpReward: 200,
    currencyReward: 40,
    title: "巡航完成",
    description: "标准巡航阶段完成，补给资源已解锁",
    unlocked: false,
  },
  overclock: {
    phase: "overclock",
    xpReward: 500,
    currencyReward: 100,
    title: "超频征服",
    description: "超频增压阶段完成，赛季经验加成已激活",
    unlocked: false,
  },
  hell: {
    phase: "hell",
    xpReward: 1500,
    currencyReward: 300,
    title: "地狱终局",
    description: "地狱终局阶段完成，获得「地狱行者」称号",
    unlocked: false,
  },
};

// ========================================================================
// 雷达图权重配置
// 速度(20%) 完美波次(20%) 连击(18%) 首领击杀(18%) 击杀(12%) 精英击杀(12%)
// ========================================================================

const RADAR_WEIGHTS: Record<FlagshipPeakRadarDimension, number> = {
  speed: 0.20,
  perfectWaves: 0.20,
  combos: 0.18,
  bossKills: 0.18,
  kills: 0.12,
  eliteKills: 0.12,
};

const RADAR_LABELS: Record<FlagshipPeakRadarDimension, string> = {
  speed: "速度",
  kills: "击杀",
  combos: "连击",
  perfectWaves: "完美波次",
  eliteKills: "精英",
  bossKills: "首领",
};

// 各维度满分阈值
const RADAR_MAX_SCORES: Record<FlagshipPeakRadarDimension, number> = {
  speed: 100,
  kills: 200,
  combos: 50,
  perfectWaves: 25,
  eliteKills: 30,
  bossKills: 3,
};

// ========================================================================
// 六维雷达评分计算
// ========================================================================

export function calculateFlagshipPeakRadar(
  fp: FlagshipPeakState,
  totalKills: number
): FlagshipPeakRadarScore[] {
  const rawScores: Record<FlagshipPeakRadarDimension, number> = {
    speed: fp.timeAttackScore,
    kills: totalKills,
    combos: fp.maxCombo,
    perfectWaves: fp.perfectWaves,
    eliteKills: fp.eliteKills,
    bossKills: fp.bossKills,
  };

  const dimensions: FlagshipPeakRadarDimension[] = [
    "speed",
    "kills",
    "combos",
    "perfectWaves",
    "eliteKills",
    "bossKills",
  ];

  return dimensions.map((dim) => {
    const raw = rawScores[dim];
    const maxScore = RADAR_MAX_SCORES[dim];
    const normalized = Math.min(100, Math.round((raw / maxScore) * 100));
    const weight = RADAR_WEIGHTS[dim];
    const weightedScore = Math.round(normalized * weight * 100);

    return {
      dimension: dim,
      label: RADAR_LABELS[dim],
      score: normalized,
      maxScore: 100,
      weight,
      weightedScore,
    };
  });
}

// ========================================================================
// 成就检查
// ========================================================================

export function checkFlagshipPeakAchievements(
  fp: FlagshipPeakState,
  phaseStats: Record<string, FlagshipSpeedRank>,
  totalKills: number,
  playerDeaths: number
): FlagshipPeakAchievement[] {
  const results = FLAGSHIP_PEAK_ACHIEVEMENTS.map((a) => ({ ...a }));

  const avgClearTime =
    fp.waveClearTimes.length > 0
      ? fp.waveClearTimes.reduce((s, t) => s + t, 0) / fp.waveClearTimes.length
      : 999;

  for (const r of results) {
    switch (r.id) {
      case "no_damage_10":
        r.unlocked = fp.perfectWaves >= 10;
        break;
      case "speedrun_flagship":
        r.unlocked = avgClearTime < 30 && fp.waveClearTimes.length >= 10;
        break;
      case "all_challenges":
        r.unlocked = fp.challengeStreak >= 3;
        break;
      case "hell_survivor":
        r.unlocked = fp.wave > FLAGSHIP_PEAK_OVERCLOCK_END + 3;
        break;
      case "zero_death_25":
        r.unlocked = playerDeaths === 0 && fp.wave >= FLAGSHIP_PEAK_TOTAL_WAVES;
        break;
      case "triple_s_rank": {
        const standardRank = phaseStats.standard ?? "none";
        const overclockRank = phaseStats.overclock ?? "none";
        const hellRank = phaseStats.hell ?? "none";
        const isSOrAbove = (r: FlagshipSpeedRank) =>
          r === "gold" || r === "platinum" || r === "diamond";
        r.unlocked =
          isSOrAbove(standardRank) &&
          isSOrAbove(overclockRank) &&
          isSOrAbove(hellRank);
        break;
      }
      case "void_lord": {
        const zeroDeath = results.find((x) => x.id === "zero_death_25");
        const tripleS = results.find((x) => x.id === "triple_s_rank");
        const allChallenges = results.find((x) => x.id === "all_challenges");
        r.unlocked =
          (zeroDeath?.unlocked ?? false) &&
          (tripleS?.unlocked ?? false) &&
          (allChallenges?.unlocked ?? false);
        break;
      }
    }
  }

  return results;
}

// ========================================================================
// 里程碑检查
// ========================================================================

export function checkFlagshipPeakMilestones(
  reachedWave: number
): FlagshipPeakMilestone[] {
  return FLAGSHIP_PEAK_MILESTONES.map((m) => ({
    ...m,
    reached: reachedWave >= m.wave,
  }));
}

// ========================================================================
// 阶段奖励检查
// ========================================================================

export function checkFlagshipPeakPhaseRewards(
  reachedPhase: FlagshipPeakPhase,
  fp: FlagshipPeakState
): FlagshipPeakPhaseReward[] {
  const phases: FlagshipPeakPhase[] = ["standard", "overclock", "hell"];
  const phaseOrder: Record<string, number> = {
    standard: 0,
    overclock: 1,
    hell: 2,
    victory: 3,
    defeat: -1,
  };

  const reachedOrder = phaseOrder[reachedPhase] ?? -1;

  return phases
    .filter((p) => phaseOrder[p] <= reachedOrder)
    .map((p) => {
      const base = FLAGSHIP_PEAK_PHASE_REWARDS[p];
      return { ...base, unlocked: true };
    });
}

// ========================================================================
// 完整结算计算
// ========================================================================

export function calculateFlagshipPeakSettlement(
  fp: FlagshipPeakState,
  totalKills: number,
  playerDeaths: number,
  phaseStats: Record<string, FlagshipSpeedRank>,
  victory: boolean
): FlagshipPeakSettlement {
  const radarScores = calculateFlagshipPeakRadar(fp, totalKills);
  const totalRadarScore = radarScores.reduce((s, r) => s + r.weightedScore, 0);

  const allAchievements = checkFlagshipPeakAchievements(
    fp,
    phaseStats,
    totalKills,
    playerDeaths
  );
  const unlockedAchievements = allAchievements.filter((a) => a.unlocked);

  const milestonesReached = checkFlagshipPeakMilestones(fp.wave);
  const phaseRewards = checkFlagshipPeakPhaseRewards(fp.phase, fp);

  const achievementBonus = unlockedAchievements.reduce((s, a) => {
    if (a.rarity === "legendary") return s + 500;
    if (a.rarity === "rare") return s + 200;
    return s + 80;
  }, 0);

  const milestoneTotal = milestonesReached
    .filter((m) => m.reached)
    .reduce((s, m) => s + m.xpReward, 0);

  const phaseTotal = phaseRewards
    .filter((p) => p.unlocked)
    .reduce((s, p) => s + p.xpReward, 0);

  const victoryBonus = victory ? 500 : 0;
  const totalXp = fp.seasonXp + achievementBonus + milestoneTotal + phaseTotal + victoryBonus;
  const totalCurrency =
    fp.seasonCurrency +
    unlockedAchievements.reduce((s, a) => {
      if (a.rarity === "legendary") return s + 100;
      if (a.rarity === "rare") return s + 50;
      return s + 20;
    }, 0) +
    milestonesReached.filter((m) => m.reached).reduce((s, m) => s + m.currencyReward, 0) +
    phaseRewards.filter((p) => p.unlocked).reduce((s, p) => s + p.currencyReward, 0);

  return {
    victory,
    reachedPhase: fp.phase,
    totalScore: fp.score + achievementBonus + victoryBonus,
    radarScores,
    totalRadarScore,
    unlockedAchievements,
    milestonesReached,
    phaseRewards,
    finalSpeedRank: fp.speedRank,
    finalSeasonRank: fp.seasonRank,
    totalXp,
    totalCurrency,
    kills: totalKills,
    maxCombo: fp.maxCombo,
    bossKills: fp.bossKills,
    eliteKills: fp.eliteKills,
    perfectWaves: fp.perfectWaves,
    timeAttackScore: fp.timeAttackScore,
  };
}