import type { HeroId } from "./types";

export type CosmeticType = "skin" | "emote" | "badge";

export interface CosmeticItem {
  id: string;
  name: string;
  type: CosmeticType;
  heroId?: HeroId;
  cost: number;
  color: string;
  description: string;
}

export const HERO_UNLOCK_COST: Record<HeroId, number> = {
  recon: 0,
  nitrogen: 300,
  twilight: 300,
  leopard: 400,
  viper: 500,
  falcon: 500,
  bastion: 600,
};

export const DEFAULT_HEROES: HeroId[] = ["recon"];

export const COSMETICS: CosmeticItem[] = [
  // Skins
  {
    id: "skin-wasteland",
    name: "废土行者",
    type: "skin",
    cost: 250,
    color: "#b87a3d",
    description: "在废土地带长期作战后留下的沙尘涂装",
  },
  {
    id: "skin-rust",
    name: "锈蚀核心",
    type: "skin",
    cost: 250,
    color: "#9ca3af",
    description: "工业锈迹风格外观，适合据点防守氛围",
  },
  {
    id: "skin-ghost",
    name: "轨道幽灵",
    type: "skin",
    cost: 350,
    color: "#818cf8",
    description: "低可见度 orbital 迷彩涂装",
  },
  {
    id: "skin-bio",
    name: "生化警戒",
    type: "skin",
    cost: 300,
    color: "#84cc16",
    description: "高可视生化 hazard 条纹",
  },
  {
    id: "skin-nitrogen-deep-freeze",
    name: "深寒",
    type: "skin",
    heroId: "nitrogen",
    cost: 400,
    color: "#0ea5e9",
    description: "液氮专属极寒涂装",
  },
  {
    id: "skin-viper-neurotoxin",
    name: "神经毒素",
    type: "skin",
    heroId: "viper",
    cost: 400,
    color: "#65a30d",
    description: "蝰蛇专属毒腺纹理涂装",
  },
  {
    id: "skin-falcon-afterburner",
    name: "加力燃烧",
    type: "skin",
    heroId: "falcon",
    cost: 400,
    color: "#ea580c",
    description: "猎鹰专属推进尾焰涂装",
  },
  {
    id: "skin-bastion-fortress",
    name: "移动堡垒",
    type: "skin",
    heroId: "bastion",
    cost: 400,
    color: "#b45309",
    description: "堡垒专属重装甲涂装",
  },
  // Emotes
  {
    id: "emote-salute",
    name: "敬礼",
    type: "emote",
    cost: 120,
    color: "#f59e0b",
    description: "标准军礼动作",
  },
  {
    id: "emote-wave",
    name: "挥手",
    type: "emote",
    cost: 100,
    color: "#38bdf8",
    description: "友好示意动作",
  },
  {
    id: "emote-taunt",
    name: "挑衅",
    type: "emote",
    cost: 150,
    color: "#f43f5e",
    description: "向敌人发出挑战信号",
  },
  // Badges
  {
    id: "badge-rookie",
    name: "前线新兵",
    type: "badge",
    cost: 80,
    color: "#94a3b8",
    description: "完成首次据点防守即可获得",
  },
  {
    id: "badge-defender",
    name: "据点守卫",
    type: "badge",
    cost: 200,
    color: "#22d3ee",
    description: "累计完成 10 次防守任务的纪念徽章",
  },
  {
    id: "badge-veteran",
    name: "废土老兵",
    type: "badge",
    cost: 350,
    color: "#d97706",
    description: "累计击杀 1000 名敌人的荣誉徽章",
  },
];

export function getCosmetic(id: string): CosmeticItem | undefined {
  return COSMETICS.find((c) => c.id === id);
}

export function getHeroCost(heroId: HeroId): number {
  return HERO_UNLOCK_COST[heroId] ?? 0;
}

export function isDefaultHero(heroId: HeroId): boolean {
  return DEFAULT_HEROES.includes(heroId);
}

export function getSkinsForHero(heroId?: HeroId): CosmeticItem[] {
  return COSMETICS.filter((c) => c.type === "skin" && (c.heroId === undefined || c.heroId === heroId));
}

export function getCosmeticsByType(type: CosmeticType): CosmeticItem[] {
  return COSMETICS.filter((c) => c.type === type);
}
