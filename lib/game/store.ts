import { COSMETICS } from "./cosmetics";
import { HERO_UNLOCK_COST, isDefaultHero } from "./cosmetics";
import type { HeroId } from "./types";

export type StoreCategory = "skins" | "emotes" | "badges" | "heroes";

export type CosmeticType = "skin" | "emote" | "badge";

export interface StoreSection {
  category: StoreCategory;
  label: string;
  description: string;
  items: StoreItem[];
}

export interface StoreItem {
  id: string;
  name: string;
  type: CosmeticType | "hero";
  category: StoreCategory;
  cost: number;
  currency: "coins" | "seasonCurrency";
  color: string;
  description: string;
  heroId?: HeroId;
  owned: boolean;
  equipped: boolean;
}

export interface PlayerWallet {
  coins: number;
  seasonCurrency: number;
}

export interface PurchaseResult {
  success: boolean;
  error?: string;
  newWallet?: PlayerWallet;
}

export function buildStoreSections(
  ownedSkins: string[],
  ownedEmotes: string[],
  unlockedHeroes: HeroId[],
  equippedSkin: string | null
): StoreSection[] {
  const skinItems: StoreItem[] = COSMETICS.filter((c) => c.type === "skin").map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    category: "skins",
    cost: c.cost,
    currency: "coins",
    color: c.color,
    description: c.description,
    heroId: c.heroId,
    owned: ownedSkins.includes(c.id),
    equipped: equippedSkin === c.id,
  }));

  const emoteItems: StoreItem[] = COSMETICS.filter((c) => c.type === "emote").map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    category: "emotes",
    cost: c.cost,
    currency: "coins",
    color: c.color,
    description: c.description,
    owned: ownedEmotes.includes(c.id),
    equipped: false,
  }));

  const badgeItems: StoreItem[] = COSMETICS.filter((c) => c.type === "badge").map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    category: "badges",
    cost: c.cost,
    currency: "coins",
    color: c.color,
    description: c.description,
    owned: ownedEmotes.includes(c.id),
    equipped: false,
  }));

  const heroItems: StoreItem[] = (Object.keys(HERO_UNLOCK_COST) as HeroId[])
    .filter((heroId) => !isDefaultHero(heroId))
    .map((heroId) => ({
      id: `hero-${heroId}`,
      name: HERO_NAMES[heroId] || heroId,
      type: "hero" as const,
      category: "heroes" as const,
      cost: HERO_UNLOCK_COST[heroId],
      currency: "seasonCurrency" as const,
      color: "#c4a574",
      description: `解锁英雄：${HERO_NAMES[heroId] || heroId}`,
      heroId,
      owned: unlockedHeroes.includes(heroId),
      equipped: false,
    }));

  return [
    {
      category: "heroes",
      label: "英雄解锁",
      description: "使用赛季货币解锁新英雄",
      items: heroItems,
    },
    {
      category: "skins",
      label: "外观涂装",
      description: "为你的英雄更换独特外观",
      items: skinItems,
    },
    {
      category: "emotes",
      label: "动作表情",
      description: "在战斗中表达你的态度",
      items: emoteItems,
    },
    {
      category: "badges",
      label: "荣誉徽章",
      description: "展示你的成就与资历",
      items: badgeItems,
    },
  ];
}

export function canPurchase(
  item: StoreItem,
  wallet: PlayerWallet,
  ownedSkins: string[],
  ownedEmotes: string[],
  unlockedHeroes: HeroId[]
): { canBuy: boolean; reason?: string } {
  if (item.owned) {
    return { canBuy: false, reason: "已拥有" };
  }

  const balance = item.currency === "coins" ? wallet.coins : wallet.seasonCurrency;
  if (balance < item.cost) {
    return { canBuy: false, reason: `${item.currency === "coins" ? "金币" : "赛季货币"}不足` };
  }

  return { canBuy: true };
}

export function calculatePurchase(
  item: StoreItem,
  wallet: PlayerWallet
): { newWallet: PlayerWallet; newOwnedSkins: string[]; newOwnedEmotes: string[]; newUnlockedHeroes: HeroId[] } | null {
  if (item.currency === "coins") {
    if (wallet.coins < item.cost) return null;
    return {
      newWallet: { ...wallet, coins: wallet.coins - item.cost },
      newOwnedSkins: item.type === "skin" ? [item.id] : [],
      newOwnedEmotes: item.type === "emote" || item.type === "badge" ? [item.id] : [],
      newUnlockedHeroes: item.type === "hero" && item.heroId ? [item.heroId] : [],
    };
  }

  if (wallet.seasonCurrency < item.cost) return null;
  return {
    newWallet: { ...wallet, seasonCurrency: wallet.seasonCurrency - item.cost },
    newOwnedSkins: item.type === "skin" ? [item.id] : [],
    newOwnedEmotes: item.type === "emote" || item.type === "badge" ? [item.id] : [],
    newUnlockedHeroes: item.type === "hero" && item.heroId ? [item.heroId] : [],
  };
}

const HERO_NAMES: Partial<Record<HeroId, string>> = {
  nitrogen: "液氮",
  twilight: "暮光",
  leopard: "猎豹",
  viper: "蝰蛇",
  falcon: "猎鹰",
  bastion: "堡垒",
};