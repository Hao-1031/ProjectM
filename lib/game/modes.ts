import type { GameModeConfig, GameModeType, Mission, RoguelikeStage } from "./types";
import {
  generateCampaignMissionsFromBalance,
  generateEndlessMissionsFromBalance,
  generateRoguelikeStagesFromBalance,
  getDailyModifiersFromBalance,
  generateDailySeed as generateBalanceDailySeed,
} from "./balance";

export interface ModeDefinition {
  type: GameModeType;
  name: string;
  description: string;
  allowMissions: boolean;
  endless: boolean;
}

const MODE_DEFS: Record<GameModeType, ModeDefinition> = {
  campaign: {
    type: "campaign",
    name: "战役模式",
    description: "完成全部任务并抵达撤离点",
    allowMissions: true,
    endless: false,
  },
  endless: {
    type: "endless",
    name: "无尽生存",
    description: "在无限增强的感染者潮中存活尽可能久",
    allowMissions: false,
    endless: true,
  },
  daily: {
    type: "daily",
    name: "每日挑战",
    description: "每日固定规则和地图，挑战全球排行榜",
    allowMissions: false,
    endless: true,
  },
  roguelike: {
    type: "roguelike",
    name: "冒险模式",
    description: "关卡树推进，每关后选择强化，击败最终首领",
    allowMissions: true,
    endless: false,
  },
  defense: {
    type: "defense",
    name: "据点防守",
    description: "2-4 人合作防守核心，占领能量节点取得胜利",
    allowMissions: false,
    endless: false,
  },
  deathmatch: {
    type: "deathmatch",
    name: "个人死斗",
    description: "PVP 自由混战，率先达到击杀目标或限时最高击杀获胜",
    allowMissions: false,
    endless: false,
  },
  survival: {
    type: "survival",
    name: "生存模式",
    description: "在 15 分钟限时内抵御无尽敌潮，构建武器流派挑战最高击杀",
    allowMissions: false,
    endless: true,
  },
};

export function getModeDefinition(type: GameModeType): ModeDefinition {
  return MODE_DEFS[type];
}

export function generateCampaignMissions(): Mission[] {
  return generateCampaignMissionsFromBalance();
}

export function generateEndlessMissions(wave: number): Mission[] {
  return generateEndlessMissionsFromBalance(wave);
}

export function createGameModeConfig(type: GameModeType, seed?: number): GameModeConfig {
  return {
    ...MODE_DEFS[type],
    dailySeed: type === "daily" ? generateDailySeed() : undefined,
    roguelikeStages: type === "roguelike" ? generateRoguelikeStages(seed ?? Date.now()) : undefined,
  };
}

export function getDefaultMode(): GameModeType {
  return "campaign";
}

export function getModeList(): { type: GameModeType; name: string; description: string }[] {
  return [
    { type: "survival", name: "生存模式", description: MODE_DEFS.survival.description },
    { type: "campaign", name: "战役模式", description: MODE_DEFS.campaign.description },
    { type: "endless", name: "无尽生存", description: MODE_DEFS.endless.description },
    { type: "daily", name: "每日挑战", description: MODE_DEFS.daily.description },
    { type: "roguelike", name: "冒险模式", description: MODE_DEFS.roguelike.description },
    { type: "defense", name: "据点防守", description: MODE_DEFS.defense.description },
    { type: "deathmatch", name: "个人死斗", description: MODE_DEFS.deathmatch.description },
  ];
}

export function generateDailySeed(): string {
  return generateBalanceDailySeed();
}

export function generateRoguelikeStages(seed: number): RoguelikeStage[] {
  return generateRoguelikeStagesFromBalance(seed);
}

export function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function getDailyModifiers(): { title: string; description: string }[] {
  return getDailyModifiersFromBalance().map((mod) => ({
    title: mod.title,
    description: mod.description,
  }));
}
