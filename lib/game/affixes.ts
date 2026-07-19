import type { Affix, AffixId, Enemy } from "./types";
import { getEliteAffixCountFromBalance } from "./balance";

export const AFFIXES: Record<AffixId, Affix> = {
  shielded: {
    id: "shielded",
    name: "护盾",
    description: "获得相当于最大生命值 30% 的护盾，首次受击时抵消伤害",
    color: "#60a5fa",
    apply: (enemy) => {
      enemy.maxHealth = Math.floor(enemy.maxHealth * 1.4);
      enemy.health = enemy.maxHealth;
    },
  },
  splitting: {
    id: "splitting",
    name: "分裂",
    description: "死亡时分裂为 2 个更小体型的同类敌人",
    color: "#a3e635",
    apply: (enemy) => {
      enemy.xpValue = Math.floor(enemy.xpValue * 0.6);
    },
  },
  explosive: {
    id: "explosive",
    name: "爆裂",
    description: "死亡时引发爆炸，对附近玩家造成伤害",
    color: "#f97316",
    apply: (enemy) => {
      enemy.radius += 4;
      enemy.color = "#f97316";
    },
  },
  swift: {
    id: "swift",
    name: "疾速",
    description: "移动速度提升 50%",
    color: "#22d3ee",
    apply: (enemy) => {
      enemy.speed *= 1.5;
    },
  },
  corrosive: {
    id: "corrosive",
    name: "腐蚀",
    description: "攻击附加腐蚀，降低玩家护甲并造成持续伤害",
    color: "#84cc16",
    apply: (enemy) => {
      enemy.damage *= 0.8;
      enemy.radius += 2;
    },
  },
  regenerating: {
    id: "regenerating",
    name: "再生",
    description: "每秒恢复最大生命值 2%",
    color: "#f472b6",
    apply: (enemy) => {
      enemy.maxHealth = Math.floor(enemy.maxHealth * 1.25);
      enemy.health = enemy.maxHealth;
    },
  },
  freezing: {
    id: "freezing",
    name: "冰冻",
    description: "攻击命中时减缓玩家移动速度",
    color: "#67e8f9",
    apply: (enemy) => {
      enemy.damage *= 0.9;
      enemy.speed *= 1.2;
    },
  },
  taunting: {
    id: "taunting",
    name: "嘲讽",
    description: "体型更大，生命值提升，吸引附近其他敌人协同攻击",
    color: "#fbbf24",
    apply: (enemy) => {
      enemy.radius += 6;
      enemy.maxHealth = Math.floor(enemy.maxHealth * 1.6);
      enemy.health = enemy.maxHealth;
    },
  },
};

export function getRandomAffixes(count: number, exclude: AffixId[] = []): AffixId[] {
  const available = Object.keys(AFFIXES).filter(
    (id) => !exclude.includes(id as AffixId)
  ) as AffixId[];
  const result: AffixId[] = [];
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    result.push(available[idx]);
    available.splice(idx, 1);
  }
  return result;
}

export function applyAffixes(enemy: Enemy): void {
  for (const affixId of enemy.affixes) {
    const affix = AFFIXES[affixId];
    if (affix) affix.apply(enemy);
  }
}

export function shouldSplitOnDeath(enemy: Enemy): boolean {
  return enemy.affixes.includes("splitting");
}

export function shouldExplodeOnDeath(enemy: Enemy): boolean {
  return enemy.affixes.includes("explosive");
}

export function getRegenRate(enemy: Enemy): number {
  return enemy.affixes.includes("regenerating") ? enemy.maxHealth * 0.02 : 0;
}

export function getEliteAffixCount(difficulty: number): number {
  return getEliteAffixCountFromBalance(difficulty);
}
