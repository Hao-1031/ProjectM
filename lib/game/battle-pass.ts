import type { Player } from "./types";

export type BattlePassTier = "free" | "premium";

export interface BattlePassReward {
  id: string;
  name: string;
  description: string;
  tier: BattlePassTier;
  level: number;
  type: "coins" | "seasonCurrency" | "skin" | "emote" | "badge" | "hero" | "xpBoost";
  amount?: number;
  itemId?: string;
  icon: string;
  claimed: boolean;
}

export interface BattlePassState {
  seasonId: string;
  seasonName: string;
  level: number;
  xp: number;
  xpToNext: number;
  premiumUnlocked: boolean;
  rewards: BattlePassReward[];
  totalLevels: number;
}

export const BATTLE_PASS_SEASON: BattlePassState = {
  seasonId: "bp_s1_ascension",
  seasonName: "飞升纪元",
  level: 1,
  xp: 0,
  xpToNext: 1000,
  premiumUnlocked: false,
  totalLevels: 50,
  rewards: [
    // Free tier rewards (every 5 levels)
    { id: "bp_f_1", name: "100 金币", description: "通用货币", tier: "free", level: 1, type: "coins", amount: 100, icon: "coin", claimed: false },
    { id: "bp_f_5", name: "200 赛季货币", description: "赛季限定货币", tier: "free", level: 5, type: "seasonCurrency", amount: 200, icon: "star", claimed: false },
    { id: "bp_f_10", name: "XP 加成 24h", description: "经验获取 +50%", tier: "free", level: 10, type: "xpBoost", amount: 50, icon: "lightning", claimed: false },
    { id: "bp_f_15", name: "300 金币", description: "通用货币", tier: "free", level: 15, type: "coins", amount: 300, icon: "coin", claimed: false },
    { id: "bp_f_20", name: "400 赛季货币", description: "赛季限定货币", tier: "free", level: 20, type: "seasonCurrency", amount: 400, icon: "star", claimed: false },
    { id: "bp_f_25", name: "XP 加成 24h", description: "经验获取 +50%", tier: "free", level: 25, type: "xpBoost", amount: 50, icon: "lightning", claimed: false },
    { id: "bp_f_30", name: "500 金币", description: "通用货币", tier: "free", level: 30, type: "coins", amount: 500, icon: "coin", claimed: false },
    { id: "bp_f_35", name: "600 赛季货币", description: "赛季限定货币", tier: "free", level: 35, type: "seasonCurrency", amount: 600, icon: "star", claimed: false },
    { id: "bp_f_40", name: "XP 加成 48h", description: "经验获取 +100%", tier: "free", level: 40, type: "xpBoost", amount: 100, icon: "lightning", claimed: false },
    { id: "bp_f_45", name: "800 金币", description: "通用货币", tier: "free", level: 45, type: "coins", amount: 800, icon: "coin", claimed: false },
    { id: "bp_f_50", name: "飞升纪念徽章", description: "赛季限定荣誉徽章", tier: "free", level: 50, type: "badge", itemId: "badge_ascension", icon: "medal", claimed: false },

    // Premium tier rewards (every level)
    { id: "bp_p_1", name: "虚空行者皮肤", description: "猎鹰限定外观", tier: "premium", level: 1, type: "skin", itemId: "skin_falcon_void", icon: "skin", claimed: false },
    { id: "bp_p_2", name: "200 赛季货币", description: "赛季限定货币", tier: "premium", level: 2, type: "seasonCurrency", amount: 200, icon: "star", claimed: false },
    { id: "bp_p_3", name: "150 金币", description: "通用货币", tier: "premium", level: 3, type: "coins", amount: 150, icon: "coin", claimed: false },
    { id: "bp_p_4", name: "维度裂隙表情", description: "战斗表情", tier: "premium", level: 4, type: "emote", itemId: "emote_rift", icon: "emote", claimed: false },
    { id: "bp_p_5", name: "300 赛季货币", description: "赛季限定货币", tier: "premium", level: 5, type: "seasonCurrency", amount: 300, icon: "star", claimed: false },
    { id: "bp_p_6", name: "200 金币", description: "通用货币", tier: "premium", level: 6, type: "coins", amount: 200, icon: "coin", claimed: false },
    { id: "bp_p_7", name: "XP 加成 24h", description: "经验获取 +50%", tier: "premium", level: 7, type: "xpBoost", amount: 50, icon: "lightning", claimed: false },
    { id: "bp_p_8", name: "250 赛季货币", description: "赛季限定货币", tier: "premium", level: 8, type: "seasonCurrency", amount: 250, icon: "star", claimed: false },
    { id: "bp_p_9", name: "200 金币", description: "通用货币", tier: "premium", level: 9, type: "coins", amount: 200, icon: "coin", claimed: false },
    { id: "bp_p_10", name: "创世者徽章", description: "赛季限定荣誉徽章", tier: "premium", level: 10, type: "badge", itemId: "badge_creator", icon: "medal", claimed: false },
    { id: "bp_p_11", name: "300 金币", description: "通用货币", tier: "premium", level: 11, type: "coins", amount: 300, icon: "coin", claimed: false },
    { id: "bp_p_12", name: "350 赛季货币", description: "赛季限定货币", tier: "premium", level: 12, type: "seasonCurrency", amount: 350, icon: "star", claimed: false },
    { id: "bp_p_13", name: "200 金币", description: "通用货币", tier: "premium", level: 13, type: "coins", amount: 200, icon: "coin", claimed: false },
    { id: "bp_p_14", name: "XP 加成 24h", description: "经验获取 +50%", tier: "premium", level: 14, type: "xpBoost", amount: 50, icon: "lightning", claimed: false },
    { id: "bp_p_15", name: "暗影斥候皮肤", description: "侦察兵限定外观", tier: "premium", level: 15, type: "skin", itemId: "skin_recon_shadow", icon: "skin", claimed: false },
    { id: "bp_p_16", name: "400 赛季货币", description: "赛季限定货币", tier: "premium", level: 16, type: "seasonCurrency", amount: 400, icon: "star", claimed: false },
    { id: "bp_p_17", name: "300 金币", description: "通用货币", tier: "premium", level: 17, type: "coins", amount: 300, icon: "coin", claimed: false },
    { id: "bp_p_18", name: "量子跃迁表情", description: "战斗表情", tier: "premium", level: 18, type: "emote", itemId: "emote_quantum", icon: "emote", claimed: false },
    { id: "bp_p_19", name: "500 赛季货币", description: "赛季限定货币", tier: "premium", level: 19, type: "seasonCurrency", amount: 500, icon: "star", claimed: false },
    { id: "bp_p_20", name: "飞升者徽章", description: "赛季限定荣誉徽章", tier: "premium", level: 20, type: "badge", itemId: "badge_ascendant", icon: "medal", claimed: false },
    { id: "bp_p_21", name: "400 金币", description: "通用货币", tier: "premium", level: 21, type: "coins", amount: 400, icon: "coin", claimed: false },
    { id: "bp_p_22", name: "500 赛季货币", description: "赛季限定货币", tier: "premium", level: 22, type: "seasonCurrency", amount: 500, icon: "star", claimed: false },
    { id: "bp_p_23", name: "XP 加成 48h", description: "经验获取 +100%", tier: "premium", level: 23, type: "xpBoost", amount: 100, icon: "lightning", claimed: false },
    { id: "bp_p_24", name: "500 金币", description: "通用货币", tier: "premium", level: 24, type: "coins", amount: 500, icon: "coin", claimed: false },
    { id: "bp_p_25", name: "炎狱领主皮肤", description: "堡垒限定外观", tier: "premium", level: 25, type: "skin", itemId: "skin_bastion_inferno", icon: "skin", claimed: false },
    { id: "bp_p_26", name: "600 赛季货币", description: "赛季限定货币", tier: "premium", level: 26, type: "seasonCurrency", amount: 600, icon: "star", claimed: false },
    { id: "bp_p_27", name: "500 金币", description: "通用货币", tier: "premium", level: 27, type: "coins", amount: 500, icon: "coin", claimed: false },
    { id: "bp_p_28", name: "空间折叠表情", description: "战斗表情", tier: "premium", level: 28, type: "emote", itemId: "emote_fold", icon: "emote", claimed: false },
    { id: "bp_p_29", name: "700 赛季货币", description: "赛季限定货币", tier: "premium", level: 29, type: "seasonCurrency", amount: 700, icon: "star", claimed: false },
    { id: "bp_p_30", name: "维度英雄解锁", description: "解锁新英雄", tier: "premium", level: 30, type: "hero", itemId: "hero_viper", icon: "hero", claimed: false },
    { id: "bp_p_31", name: "600 金币", description: "通用货币", tier: "premium", level: 31, type: "coins", amount: 600, icon: "coin", claimed: false },
    { id: "bp_p_32", name: "800 赛季货币", description: "赛季限定货币", tier: "premium", level: 32, type: "seasonCurrency", amount: 800, icon: "star", claimed: false },
    { id: "bp_p_33", name: "XP 加成 48h", description: "经验获取 +100%", tier: "premium", level: 33, type: "xpBoost", amount: 100, icon: "lightning", claimed: false },
    { id: "bp_p_34", name: "700 金币", description: "通用货币", tier: "premium", level: 34, type: "coins", amount: 700, icon: "coin", claimed: false },
    { id: "bp_p_35", name: "星尘之翼皮肤", description: "猎鹰限定外观", tier: "premium", level: 35, type: "skin", itemId: "skin_falcon_stardust", icon: "skin", claimed: false },
    { id: "bp_p_36", name: "900 赛季货币", description: "赛季限定货币", tier: "premium", level: 36, type: "seasonCurrency", amount: 900, icon: "star", claimed: false },
    { id: "bp_p_37", name: "800 金币", description: "通用货币", tier: "premium", level: 37, type: "coins", amount: 800, icon: "coin", claimed: false },
    { id: "bp_p_38", name: "超越者表情", description: "战斗表情", tier: "premium", level: 38, type: "emote", itemId: "emote_transcend", icon: "emote", claimed: false },
    { id: "bp_p_39", name: "1000 赛季货币", description: "赛季限定货币", tier: "premium", level: 39, type: "seasonCurrency", amount: 1000, icon: "star", claimed: false },
    { id: "bp_p_40", name: "创世徽章", description: "赛季限定荣誉徽章", tier: "premium", level: 40, type: "badge", itemId: "badge_genesis", icon: "medal", claimed: false },
    { id: "bp_p_41", name: "1000 金币", description: "通用货币", tier: "premium", level: 41, type: "coins", amount: 1000, icon: "coin", claimed: false },
    { id: "bp_p_42", name: "1200 赛季货币", description: "赛季限定货币", tier: "premium", level: 42, type: "seasonCurrency", amount: 1200, icon: "star", claimed: false },
    { id: "bp_p_43", name: "XP 加成 72h", description: "经验获取 +150%", tier: "premium", level: 43, type: "xpBoost", amount: 150, icon: "lightning", claimed: false },
    { id: "bp_p_44", name: "1200 金币", description: "通用货币", tier: "premium", level: 44, type: "coins", amount: 1200, icon: "coin", claimed: false },
    { id: "bp_p_45", name: "维度英雄解锁", description: "解锁新英雄", tier: "premium", level: 45, type: "hero", itemId: "hero_falcon", icon: "hero", claimed: false },
    { id: "bp_p_46", name: "1500 赛季货币", description: "赛季限定货币", tier: "premium", level: 46, type: "seasonCurrency", amount: 1500, icon: "star", claimed: false },
    { id: "bp_p_47", name: "1500 金币", description: "通用货币", tier: "premium", level: 47, type: "coins", amount: 1500, icon: "coin", claimed: false },
    { id: "bp_p_48", name: "维度裂隙表情", description: "战斗表情", tier: "premium", level: 48, type: "emote", itemId: "emote_void", icon: "emote", claimed: false },
    { id: "bp_p_49", name: "2000 赛季货币", description: "赛季限定货币", tier: "premium", level: 49, type: "seasonCurrency", amount: 2000, icon: "star", claimed: false },
    { id: "bp_p_50", name: "飞升之主皮肤", description: "全英雄通用终极外观", tier: "premium", level: 50, type: "skin", itemId: "skin_ascension_lord", icon: "skin", claimed: false },
  ],
};

export function getBattlePassProgress(state: BattlePassState): number {
  return state.level / state.totalLevels;
}

export function getRewardsForLevel(state: BattlePassState, level: number): BattlePassReward[] {
  return state.rewards.filter((r) => r.level === level);
}

export function getClaimableRewards(state: BattlePassState): BattlePassReward[] {
  return state.rewards.filter((r) => r.level <= state.level && !r.claimed);
}

export function claimReward(state: BattlePassState, rewardId: string): boolean {
  const reward = state.rewards.find((r) => r.id === rewardId);
  if (!reward || reward.claimed || reward.level > state.level) return false;
  if (reward.tier === "premium" && !state.premiumUnlocked) return false;
  reward.claimed = true;
  return true;
}

export function addBattlePassXP(state: BattlePassState, amount: number): void {
  if (state.level >= state.totalLevels) return;
  state.xp += amount;
  while (state.xp >= state.xpToNext && state.level < state.totalLevels) {
    state.xp -= state.xpToNext;
    state.level += 1;
    state.xpToNext = Math.floor(state.xpToNext * 1.08);
  }
  if (state.level >= state.totalLevels) {
    state.xp = 0;
    state.xpToNext = 0;
  }
}

export function unlockPremiumPass(state: BattlePassState): void {
  state.premiumUnlocked = true;
}

export function getTotalCoinRewards(state: BattlePassState): number {
  return state.rewards
    .filter((r) => r.type === "coins" && r.claimed)
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);
}

export function getTotalSeasonCurrencyRewards(state: BattlePassState): number {
  return state.rewards
    .filter((r) => r.type === "seasonCurrency" && r.claimed)
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);
}