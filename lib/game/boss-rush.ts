import type { BossId } from "./types";
import { BOSS_METADATA, getBossMetadata, type BossFaction } from "./bosses";

export interface BossRushTier {
  id: string;
  name: string;
  description: string;
  /** Bosses in this tier, in order */
  bosses: BossId[];
  /** Time limit per boss in seconds (0 = no limit) */
  timeLimitPerBoss: number;
  /** Healing between bosses (percentage of max HP) */
  healBetweenBosses: number;
  /** Tier completion reward */
  reward: {
    coins: number;
    seasonCurrency: number;
  };
  /** Unlock requirement: previous tier must be completed */
  requiresTierId?: string;
  /** Tier theme color */
  accentColor: string;
  /** Difficulty label */
  difficulty: "normal" | "hard" | "extreme" | "nightmare";
}

export interface BossRushProgress {
  completedTiers: string[];
  bestTimePerTier: Record<string, number>;
  totalBossesDefeated: number;
  highestTierCleared: string | null;
  fastestClear: number;
}

export const BOSS_RUSH_TIERS: BossRushTier[] = [
  {
    id: "tier-1",
    name: "试炼之门",
    description: "基础维度首领的试炼。击败三位初级维度守护者，证明你的实力。",
    bosses: ["lancer", "charger", "summoner"],
    timeLimitPerBoss: 180,
    healBetweenBosses: 30,
    reward: { coins: 1500, seasonCurrency: 150 },
    difficulty: "normal",
    accentColor: "var(--primary)",
  },
  {
    id: "tier-2",
    name: "熵增试炼",
    description: "熵增维度的四位守护者。你的抑制器能否承受连续的熵能冲击？",
    bosses: ["splitter", "titan", "overlord", "corruptor"],
    timeLimitPerBoss: 150,
    healBetweenBosses: 20,
    reward: { coins: 3000, seasonCurrency: 300 },
    requiresTierId: "tier-1",
    difficulty: "hard",
    accentColor: "var(--entropy)",
  },
  {
    id: "tier-3",
    name: "量子深渊",
    description: "量子维度的五位远古守护者。只有最强大的战士才能跨越量子深渊。",
    bosses: ["phantom", "behemoth", "juggernaut", "devourer", "annihilator"],
    timeLimitPerBoss: 120,
    healBetweenBosses: 15,
    reward: { coins: 5000, seasonCurrency: 500 },
    requiresTierId: "tier-2",
    difficulty: "extreme",
    accentColor: "var(--quantum)",
  },
  {
    id: "tier-4",
    name: "最终试炼",
    description: "所有维度主宰者的终极试炼。连续击败六位首领，无可匹敌者将获得「维度征服者」称号。",
    bosses: ["lancer", "titan", "overlord", "phantom", "behemoth", "annihilator"],
    timeLimitPerBoss: 90,
    healBetweenBosses: 10,
    reward: { coins: 10000, seasonCurrency: 1000 },
    requiresTierId: "tier-3",
    difficulty: "nightmare",
    accentColor: "var(--anchor)",
  },
];

export function getBossRushTier(id: string): BossRushTier | undefined {
  return BOSS_RUSH_TIERS.find((t) => t.id === id);
}

export function isTierUnlocked(tier: BossRushTier, progress: BossRushProgress): boolean {
  if (!tier.requiresTierId) return true;
  return progress.completedTiers.includes(tier.requiresTierId);
}

export function getTierProgress(tier: BossRushTier, progress: BossRushProgress): {
  defeated: number;
  total: number;
  percentage: number;
} {
  const defeated = tier.bosses.filter((_, i) => {
    const key = `${tier.id}-${i}`;
    return progress.completedTiers.includes(key);
  }).length;
  return {
    defeated,
    total: tier.bosses.length,
    percentage: Math.round((defeated / tier.bosses.length) * 100),
  };
}

export function getBossFactionColor(faction: BossFaction): string {
  switch (faction) {
    case "entropy": return "var(--entropy)";
    case "quantum": return "var(--quantum)";
    case "void": return "var(--void)";
    case "bio": return "var(--success, #22c55e)";
    case "mech": return "var(--warning, #f59e0b)";
    default: return "var(--primary)";
  }
}

export interface BossRushBossDisplay {
  id: BossId;
  name: string;
  description: string;
  faction: BossFaction;
  factionColor: string;
  phases: number;
  tierIndex: number;
}

export function getBossRushDisplay(tier: BossRushTier): BossRushBossDisplay[] {
  return tier.bosses.map((bossId, index) => {
    const meta = getBossMetadata(bossId);
    return {
      id: bossId,
      name: meta.name,
      description: meta.description,
      faction: meta.faction,
      factionColor: getBossFactionColor(meta.faction),
      phases: meta.phases,
      tierIndex: index,
    };
  });
}

export const DEFAULT_BOSS_RUSH_PROGRESS: BossRushProgress = {
  completedTiers: [],
  bestTimePerTier: {},
  totalBossesDefeated: 0,
  highestTierCleared: null,
  fastestClear: 0,
};