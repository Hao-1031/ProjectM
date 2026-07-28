import type { SaveData } from "./save";
import type { BossId, GameModeType, PeakSeasonRank } from "./types";

export type AchievementCategory =
  | "combat"
  | "collection"
  | "exploration"
  | "mastery"
  | "social"
  | "secret";

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface AchievementReward {
  coins?: number;
  seasonCurrency?: number;
  badge?: string;
  title?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  tier: AchievementTier;
  secret: boolean;
  target: number;
  reward: AchievementReward;
}

export interface AchievementProgress {
  achievementId: string;
  progress: number;
  completed: boolean;
  claimedAt: number | null;
  unlockedAt: number | null;
}

export interface PlayerGrowth {
  level: number;
  xp: number;
  xpToNext: number;
  totalKills: number;
  totalWins: number;
  totalRuns: number;
  totalPlayTime: number;
  favoriteHero: string | null;
  favoriteWeapon: string | null;
  highestWave: number;
  longestSurvival: number;
  titles: string[];
  equippedTitle: string | null;
}

export interface Collection {
  heroesUnlocked: number;
  heroesTotal: number;
  weaponsUnlocked: number;
  weaponsTotal: number;
  bossesDefeated: BossId[];
  bossesTotal: number;
  skinsOwned: number;
  skinsTotal: number;
  seasonHighestRank: PeakSeasonRank;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const TOTAL_HEROES = 7;
export const TOTAL_WEAPONS = 22;
export const ALL_BOSS_IDS: BossId[] = [
  "overlord", "plaguebringer", "titan", "ravager", "siren",
  "colossus", "dreadnought", "juggernaut", "annihilator", "hive",
  "lancer", "charger", "summoner", "splitter", "corruptor",
  "phantom", "behemoth", "devourer",
];
export const TOTAL_BOSSES = ALL_BOSS_IDS.length;
export const TOTAL_SKINS = 8;
export const ALL_GAME_MODES: GameModeType[] = [
  "campaign", "endless", "daily", "roguelike", "defense",
  "deathmatch", "survival", "extreme-survival", "peak-challenge", "flagship",
];

// ---------------------------------------------------------------------------
// Achievement definitions
// ---------------------------------------------------------------------------

export const ACHIEVEMENTS: Achievement[] = [
  // === Combat ===
  {
    id: "first_blood",
    name: "初战告捷",
    description: "累计击杀 1 名敌人",
    category: "combat",
    icon: "Crosshair",
    tier: "bronze",
    secret: false,
    target: 1,
    reward: { coins: 100, badge: "badge-first-blood", title: "新兵" },
  },
  {
    id: "centurion",
    name: "百人斩",
    description: "累计击杀 100 名敌人",
    category: "combat",
    icon: "Sword",
    tier: "silver",
    secret: false,
    target: 100,
    reward: { coins: 500, seasonCurrency: 50 },
  },
  {
    id: "slayer",
    name: "千人斩",
    description: "累计击杀 1000 名敌人",
    category: "combat",
    icon: "Skull",
    tier: "gold",
    secret: false,
    target: 1000,
    reward: { coins: 2000, seasonCurrency: 200, title: "屠戮者" },
  },
  {
    id: "annihilator",
    name: "万军取首",
    description: "累计击杀 10000 名敌人",
    category: "combat",
    icon: "Fire",
    tier: "platinum",
    secret: false,
    target: 10000,
    reward: { coins: 5000, seasonCurrency: 500, title: "湮灭者" },
  },
  {
    id: "massacre",
    name: "单局百杀",
    description: "单局击杀 100 名敌人",
    category: "combat",
    icon: "Bomb",
    tier: "gold",
    secret: false,
    target: 100,
    reward: { coins: 1500, seasonCurrency: 150 },
  },
  {
    id: "streak_master",
    name: "连胜将军",
    description: "连续取得 10 场胜利",
    category: "combat",
    icon: "Medal",
    tier: "gold",
    secret: false,
    target: 10,
    reward: { coins: 2000, seasonCurrency: 200, title: "不败将军" },
  },
  {
    id: "flawless",
    name: "无伤通关",
    description: "在任意模式下以零受伤通关",
    category: "combat",
    icon: "ShieldCheck",
    tier: "platinum",
    secret: false,
    target: 1,
    reward: { coins: 3000, seasonCurrency: 300, title: "完美主义者" },
  },
  {
    id: "speed_demon",
    name: "速通专家",
    description: "在 5 分钟内通关任意模式",
    category: "combat",
    icon: "Lightning",
    tier: "silver",
    secret: false,
    target: 300,
    reward: { coins: 800, seasonCurrency: 80, title: "疾风" },
  },
  {
    id: "untouchable",
    name: "天选之人",
    description: "单局击杀 100 名敌人且零受伤",
    category: "combat",
    icon: "Crown",
    tier: "diamond",
    secret: false,
    target: 100,
    reward: { coins: 5000, seasonCurrency: 500, title: "天选者" },
  },

  // === Collection ===
  {
    id: "squad_leader",
    name: "小队雏形",
    description: "解锁 3 名英雄",
    category: "collection",
    icon: "UsersThree",
    tier: "bronze",
    secret: false,
    target: 3,
    reward: { coins: 300, seasonCurrency: 30 },
  },
  {
    id: "hero_roster",
    name: "英雄集结",
    description: "解锁全部 7 名英雄",
    category: "collection",
    icon: "Users",
    tier: "gold",
    secret: false,
    target: 7,
    reward: { coins: 3000, seasonCurrency: 300, title: "指挥官" },
  },
  {
    id: "quartermaster",
    name: "军械学徒",
    description: "解锁 11 种武器",
    category: "collection",
    icon: "Knife",
    tier: "bronze",
    secret: false,
    target: 11,
    reward: { coins: 300, seasonCurrency: 30 },
  },
  {
    id: "arsenal",
    name: "全武器制霸",
    description: "解锁全部 22 种武器",
    category: "collection",
    icon: "Target",
    tier: "platinum",
    secret: false,
    target: 22,
    reward: { coins: 5000, seasonCurrency: 500, title: "军械大师" },
  },
  {
    id: "skin_collector",
    name: "外观收藏家",
    description: "收集 5 个皮肤",
    category: "collection",
    icon: "PaintBrush",
    tier: "silver",
    secret: false,
    target: 5,
    reward: { coins: 500, seasonCurrency: 50 },
  },
  {
    id: "boss_hunter",
    name: "Boss猎人",
    description: "击败全部 18 位 Boss",
    category: "collection",
    icon: "Star",
    tier: "platinum",
    secret: false,
    target: 18,
    reward: { coins: 4000, seasonCurrency: 400, title: "屠魔者" },
  },

  // === Exploration ===
  {
    id: "chapter_one",
    name: "锚点觉醒",
    description: "完成第一章",
    category: "exploration",
    icon: "Compass",
    tier: "bronze",
    secret: false,
    target: 1,
    reward: { coins: 500, seasonCurrency: 50 },
  },
  {
    id: "chapter_two",
    name: "熵增蔓延",
    description: "完成第二章",
    category: "exploration",
    icon: "Globe",
    tier: "silver",
    secret: false,
    target: 1,
    reward: { coins: 1000, seasonCurrency: 100 },
  },
  {
    id: "chapter_three",
    name: "量子深渊",
    description: "完成第三章",
    category: "exploration",
    icon: "Atom",
    tier: "gold",
    secret: false,
    target: 1,
    reward: { coins: 2000, seasonCurrency: 200, title: "维度行者" },
  },
  {
    id: "boss_rush_entry",
    name: "试炼之门",
    description: "首次进入 BossRush 模式",
    category: "exploration",
    icon: "Door",
    tier: "bronze",
    secret: false,
    target: 1,
    reward: { coins: 300, seasonCurrency: 30 },
  },
  {
    id: "boss_rush_conqueror",
    name: "试炼征服者",
    description: "通关全部 4 层 BossRush 试炼",
    category: "exploration",
    icon: "Trophy",
    tier: "platinum",
    secret: false,
    target: 4,
    reward: { coins: 5000, seasonCurrency: 500, title: "试炼之王" },
  },
  {
    id: "mode_veteran",
    name: "模式老兵",
    description: "体验过全部 10 种游戏模式",
    category: "exploration",
    icon: "GameController",
    tier: "gold",
    secret: false,
    target: 10,
    reward: { coins: 2000, seasonCurrency: 200, title: "全能战士" },
  },

  // === Mastery ===
  {
    id: "hero_maxed",
    name: "英雄之巅",
    description: "将任意英雄的天赋全部升至满级",
    category: "mastery",
    icon: "StarFour",
    tier: "gold",
    secret: false,
    target: 1,
    reward: { coins: 2000, seasonCurrency: 200, title: "英雄专家" },
  },
  {
    id: "weapon_maxed",
    name: "武器精通",
    description: "将任意武器升至满级",
    category: "mastery",
    icon: "Wrench",
    tier: "silver",
    secret: false,
    target: 1,
    reward: { coins: 800, seasonCurrency: 80 },
  },
  {
    id: "all_modes_clear",
    name: "全模式制霸",
    description: "在所有 10 种游戏模式中至少取得一次胜利",
    category: "mastery",
    icon: "FlagBanner",
    tier: "platinum",
    secret: false,
    target: 10,
    reward: { coins: 5000, seasonCurrency: 500, title: "全模式大师" },
  },
  {
    id: "endless_wave_30",
    name: "无尽征途",
    description: "无尽模式中存活至第 30 波",
    category: "mastery",
    icon: "Infinity",
    tier: "gold",
    secret: false,
    target: 30,
    reward: { coins: 2000, seasonCurrency: 200 },
  },
  {
    id: "peak_diamond",
    name: "巅峰之巅",
    description: "巅峰挑战赛季达到钻石段位",
    category: "mastery",
    icon: "Diamond",
    tier: "diamond",
    secret: false,
    target: 1,
    reward: { coins: 5000, seasonCurrency: 500, title: "巅峰传奇" },
  },
  {
    id: "survival_king",
    name: "生存之王",
    description: "在任意模式下单局存活超过 30 分钟",
    category: "mastery",
    icon: "Clock",
    tier: "gold",
    secret: false,
    target: 1800,
    reward: { coins: 2000, seasonCurrency: 200, title: "不朽者" },
  },

  // === Social ===
  {
    id: "guild_member",
    name: "公会新人",
    description: "加入一个公会",
    category: "social",
    icon: "Buildings",
    tier: "bronze",
    secret: false,
    target: 1,
    reward: { coins: 200, seasonCurrency: 20 },
  },
  {
    id: "guild_contributor",
    name: "公会骨干",
    description: "公会贡献达到 1000",
    category: "social",
    icon: "HandCoins",
    tier: "silver",
    secret: false,
    target: 1000,
    reward: { coins: 500, seasonCurrency: 50 },
  },
  {
    id: "guild_elite",
    name: "公会精英",
    description: "公会贡献达到 10000",
    category: "social",
    icon: "HandHeart",
    tier: "gold",
    secret: false,
    target: 10000,
    reward: { coins: 2000, seasonCurrency: 200, title: "公会支柱" },
  },
  {
    id: "party_play",
    name: "并肩作战",
    description: "与好友组队完成 10 局游戏",
    category: "social",
    icon: "Handshake",
    tier: "silver",
    secret: false,
    target: 10,
    reward: { coins: 500, seasonCurrency: 50 },
  },

  // === Secret ===
  {
    id: "secret_ritual",
    name: "血之仪式",
    description: "在单局中以低于 10% 生命值存活超过 5 分钟",
    category: "secret",
    icon: "DropHalf",
    tier: "platinum",
    secret: true,
    target: 1,
    reward: { coins: 3000, seasonCurrency: 300, title: "血誓者" },
  },
  {
    id: "secret_dimension",
    name: "维度裂隙",
    description: "在 BossRush 中连续无伤击败 3 位 Boss",
    category: "secret",
    icon: "Eye",
    tier: "diamond",
    secret: true,
    target: 3,
    reward: { coins: 5000, seasonCurrency: 500, title: "裂隙行者" },
  },
  {
    id: "secret_echo",
    name: "先驱回声",
    description: "在巅峰挑战中连续 10 波完美通关",
    category: "secret",
    icon: "Ear",
    tier: "diamond",
    secret: true,
    target: 10,
    reward: { coins: 8000, seasonCurrency: 800, title: "先驱者" },
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

const achievementMap = new Map<string, Achievement>();
for (const a of ACHIEVEMENTS) {
  achievementMap.set(a.id, a);
}

export function getAchievement(id: string): Achievement | undefined {
  return achievementMap.get(id);
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}

export function getClaimableAchievements(
  progress: AchievementProgress[],
): { achievement: Achievement; progress: AchievementProgress }[] {
  const result: { achievement: Achievement; progress: AchievementProgress }[] = [];
  for (const p of progress) {
    if (!p.completed || p.claimedAt !== null) continue;
    const a = achievementMap.get(p.achievementId);
    if (a) {
      result.push({ achievement: a, progress: p });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Progress calculation
// ---------------------------------------------------------------------------

function computeWinStreak(runHistory: SaveData["runHistory"]): number {
  let streak = 0;
  let maxStreak = 0;
  for (const entry of runHistory) {
    if (entry.victory) {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else {
      streak = 0;
    }
  }
  return maxStreak;
}

function computeModesCleared(runHistory: SaveData["runHistory"]): GameModeType[] {
  const modes = new Set<GameModeType>();
  for (const entry of runHistory) {
    if (entry.victory && entry.mode) {
      modes.add(entry.mode);
    }
  }
  return Array.from(modes);
}

function computeBestRunKills(save: SaveData): number {
  return save.bestRun?.stats.kills ?? 0;
}

function computeBestRunDamageTaken(save: SaveData): number {
  return save.bestRun?.stats.damageTaken ?? 0;
}

function computeBestRunElapsed(save: SaveData): number {
  return save.bestRun?.elapsed ?? 0;
}

function computeHighestWave(save: SaveData): number {
  return save.bestRun?.stats.wavesCleared ?? 0;
}

function computeLongestSurvival(save: SaveData): number {
  return save.bestRun?.stats.timeSurvived ?? 0;
}

function computeBossesDefeated(save: SaveData): BossId[] {
  const bosses = new Set<BossId>();
  // From campaign progress - completed boss nodes
  if (save.campaignProgress?.completedNodes) {
    for (const nodeId of save.campaignProgress.completedNodes) {
      if (nodeId.includes("boss")) {
        // Campaign boss nodes: ch1-boss-1, ch2-boss-1, ch3-boss-1
        if (nodeId === "ch1-boss-1") bosses.add("lancer");
        if (nodeId === "ch2-boss-1") bosses.add("titan");
        if (nodeId === "ch3-boss-1") bosses.add("phantom");
      }
    }
  }
  // From BossRush progress
  if (save.bossRushProgress?.completedTiers) {
    for (const tierKey of save.bossRushProgress.completedTiers) {
      // Tier keys look like "tier-1", "tier-2", etc.
      if (tierKey === "tier-1") {
        bosses.add("lancer");
        bosses.add("charger");
        bosses.add("summoner");
      }
      if (tierKey === "tier-2") {
        bosses.add("splitter");
        bosses.add("titan");
        bosses.add("overlord");
        bosses.add("corruptor");
      }
      if (tierKey === "tier-3") {
        bosses.add("phantom");
        bosses.add("behemoth");
        bosses.add("juggernaut");
        bosses.add("devourer");
        bosses.add("annihilator");
      }
      if (tierKey === "tier-4") {
        bosses.add("lancer");
        bosses.add("titan");
        bosses.add("overlord");
        bosses.add("phantom");
        bosses.add("behemoth");
        bosses.add("annihilator");
      }
    }
  }
  return Array.from(bosses);
}

function computeModesPlayed(runHistory: SaveData["runHistory"]): GameModeType[] {
  const modes = new Set<GameModeType>();
  for (const entry of runHistory) {
    if (entry.mode) modes.add(entry.mode);
  }
  return Array.from(modes);
}

export function getAchievementProgress(
  achievement: Achievement,
  save: SaveData,
): AchievementProgress {
  let progress = 0;
  let completed = false;

  switch (achievement.id) {
    // Combat
    case "first_blood":
      progress = Math.min(save.totalKills, achievement.target);
      break;
    case "centurion":
      progress = Math.min(save.totalKills, achievement.target);
      break;
    case "slayer":
      progress = Math.min(save.totalKills, achievement.target);
      break;
    case "annihilator":
      progress = Math.min(save.totalKills, achievement.target);
      break;
    case "massacre":
      progress = Math.min(computeBestRunKills(save), achievement.target);
      break;
    case "streak_master":
      progress = Math.min(computeWinStreak(save.runHistory), achievement.target);
      break;
    case "flawless":
      progress = computeBestRunDamageTaken(save) === 0 && save.bestRun?.victory ? 1 : 0;
      break;
    case "speed_demon":
      progress = save.bestRun?.victory && computeBestRunElapsed(save) <= achievement.target ? 1 : 0;
      break;
    case "untouchable":
      progress =
        computeBestRunKills(save) >= 100 && computeBestRunDamageTaken(save) === 0 ? 100 : 0;
      break;

    // Collection
    case "squad_leader":
      progress = Math.min(save.unlockedHeroes.length, achievement.target);
      break;
    case "hero_roster":
      progress = Math.min(save.unlockedHeroes.length, achievement.target);
      break;
    case "quartermaster":
      progress = Math.min(save.unlockedWeapons.length, achievement.target);
      break;
    case "arsenal":
      progress = Math.min(save.unlockedWeapons.length, achievement.target);
      break;
    case "skin_collector":
      progress = Math.min(save.ownedSkins.length, achievement.target);
      break;
    case "boss_hunter":
      progress = Math.min(computeBossesDefeated(save).length, achievement.target);
      break;

    // Exploration
    case "chapter_one":
      progress = save.campaignProgress?.chaptersCompleted?.includes("chapter-1") ? 1 : 0;
      break;
    case "chapter_two":
      progress = save.campaignProgress?.chaptersCompleted?.includes("chapter-2") ? 1 : 0;
      break;
    case "chapter_three":
      progress = save.campaignProgress?.chaptersCompleted?.includes("chapter-3") ? 1 : 0;
      break;
    case "boss_rush_entry":
      progress = save.bossRushProgress?.completedTiers?.length > 0 ? 1 : 0;
      break;
    case "boss_rush_conqueror":
      progress = Math.min(save.bossRushProgress?.completedTiers?.length ?? 0, achievement.target);
      break;
    case "mode_veteran":
      progress = Math.min(computeModesPlayed(save.runHistory).length, achievement.target);
      break;

    // Mastery
    case "hero_maxed":
      // Check if any hero has max talents - this requires runtime data, default to 0
      progress = 0;
      break;
    case "weapon_maxed":
      // Check if any weapon is maxed - requires runtime data, default to 0
      progress = 0;
      break;
    case "all_modes_clear":
      progress = Math.min(computeModesCleared(save.runHistory).length, achievement.target);
      break;
    case "endless_wave_30":
      progress = Math.min(computeHighestWave(save), achievement.target);
      break;
    case "peak_diamond": {
      const rank = save.seasonState?.rewards?.some(
        (r) => r.type === "badge" && r.unlocked,
      )
        ? 1
        : 0;
      progress = rank;
      break;
    }
    case "survival_king":
      progress = Math.min(computeLongestSurvival(save), achievement.target);
      break;

    // Social
    case "guild_member":
      progress = 0;
      break;
    case "guild_contributor":
      progress = 0;
      break;
    case "guild_elite":
      progress = 0;
      break;
    case "party_play":
      progress = 0;
      break;

    // Secret
    case "secret_ritual":
      progress = 0;
      break;
    case "secret_dimension":
      progress = 0;
      break;
    case "secret_echo":
      progress = 0;
      break;

    default:
      progress = 0;
  }

  completed = progress >= achievement.target;

  return {
    achievementId: achievement.id,
    progress,
    completed,
    claimedAt: null,
    unlockedAt: completed ? Date.now() : null,
  };
}

export function getAllAchievementProgress(save: SaveData): AchievementProgress[] {
  return ACHIEVEMENTS.map((a) => getAchievementProgress(a, save));
}

// ---------------------------------------------------------------------------
// Player level & growth
// ---------------------------------------------------------------------------

export function calculatePlayerLevel(xp: number): number {
  let level = 1;
  let xpNeeded = 100;
  let remaining = xp;

  while (remaining >= xpNeeded) {
    remaining -= xpNeeded;
    level++;
    xpNeeded = getXpToNextLevel(level);
  }

  return level;
}

export function getXpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.35));
}

export function getCurrentLevelXp(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) {
    total += getXpToNextLevel(l);
  }
  return total;
}

export function getPlayerGrowth(save: SaveData): PlayerGrowth {
  const totalXp = save.seasonXp;
  const level = calculatePlayerLevel(totalXp);
  const xpToNext = getXpToNextLevel(level);
  const levelStartXp = getCurrentLevelXp(level);
  const currentLevelXp = totalXp - levelStartXp;

  const totalWins = save.runHistory.filter((r) => r.victory).length;

  const modeCounts = new Map<string, number>();
  for (const entry of save.runHistory) {
    if (entry.mode) {
      modeCounts.set(entry.mode, (modeCounts.get(entry.mode) ?? 0) + 1);
    }
  }

  let favoriteHero: string | null = null;
  let favoriteWeapon: string | null = null;

  if (save.selectedHero) {
    favoriteHero = save.selectedHero;
  }

  if (save.equippedWeapons.length > 0) {
    favoriteWeapon = save.equippedWeapons[0];
  }

  const totalPlayTime = save.runHistory.reduce((sum, r) => sum + r.elapsed, 0);

  const titles: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (a.reward.title) {
      titles.push(a.reward.title);
    }
  }

  return {
    level,
    xp: currentLevelXp,
    xpToNext,
    totalKills: save.totalKills,
    totalWins,
    totalRuns: save.totalRuns,
    totalPlayTime,
    favoriteHero,
    favoriteWeapon,
    highestWave: computeHighestWave(save),
    longestSurvival: computeLongestSurvival(save),
    titles,
    equippedTitle: null,
  };
}

// ---------------------------------------------------------------------------
// Collection stats
// ---------------------------------------------------------------------------

export function getCollection(save: SaveData): Collection {
  const rankOrder: PeakSeasonRank[] = [
    "bronze", "silver", "gold", "platinum", "diamond", "master", "grandmaster",
  ];

  const currentRank: PeakSeasonRank = "bronze";
  let seasonHighestRank: PeakSeasonRank = "bronze";

  return {
    heroesUnlocked: save.unlockedHeroes.length,
    heroesTotal: TOTAL_HEROES,
    weaponsUnlocked: save.unlockedWeapons.length,
    weaponsTotal: TOTAL_WEAPONS,
    bossesDefeated: computeBossesDefeated(save),
    bossesTotal: TOTAL_BOSSES,
    skinsOwned: save.ownedSkins.length,
    skinsTotal: TOTAL_SKINS,
    seasonHighestRank,
  };
}

// ---------------------------------------------------------------------------
// Reward claiming
// ---------------------------------------------------------------------------

export function claimAchievementReward(
  achievementId: string,
  progress: AchievementProgress[],
  save: SaveData,
): { success: boolean; achievement: Achievement | null; progress: AchievementProgress | null } {
  const idx = progress.findIndex((p) => p.achievementId === achievementId);
  if (idx === -1) return { success: false, achievement: null, progress: null };

  const p = progress[idx];
  if (!p.completed || p.claimedAt !== null) {
    return { success: false, achievement: null, progress: null };
  }

  const achievement = achievementMap.get(achievementId);
  if (!achievement) return { success: false, achievement: null, progress: null };

  p.claimedAt = Date.now();
  progress[idx] = p;

  return { success: true, achievement, progress: p };
}

export function getAchievementTierColor(tier: AchievementTier): string {
  switch (tier) {
    case "bronze":
      return "#cd7f32";
    case "silver":
      return "#c0c0c0";
    case "gold":
      return "#ffd700";
    case "platinum":
      return "#e5e4e2";
    case "diamond":
      return "#b9f2ff";
  }
}

export function getAchievementTierLabel(tier: AchievementTier): string {
  switch (tier) {
    case "bronze":
      return "青铜";
    case "silver":
      return "白银";
    case "gold":
      return "黄金";
    case "platinum":
      return "白金";
    case "diamond":
      return "钻石";
  }
}