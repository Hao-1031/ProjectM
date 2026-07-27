// Curse-Blessing Dual Selection System for Roguelike Mode
// After each stage, the player chooses from 3 pairs of (blessing + curse).
// Each blessing grants a permanent buff; each curse imposes a permanent debuff.

import { randomChoice, clamp } from "./math";
import type { Player } from "./types";

export type BlessingId =
  | "berserkersRage"
  | "ironSkin"
  | "swiftStrikes"
  | "vampiricTouch"
  | "arcaneAmplifier"
  | "criticalMass"
  | "regenerativeCells"
  | "shadowStep"
  | "explosiveRounds"
  | "thornsAura"
  | "doubleShot"
  | "energyShield";

export type CurseId =
  | "glassCannon"
  | "sluggishMovement"
  | "reducedHealing"
  | "weakenedAttacks"
  | "vulnerableArmor"
  | "energyDrain"
  | "bloodPact"
  | "diminishedRange"
  | "unstableAmmo"
  | "cursedLuck"
  | "heavyBurden"
  | "attractEnemies";

export interface BlessingDef {
  id: BlessingId;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  apply: (player: Player) => void;
}

export interface CurseDef {
  id: CurseId;
  name: string;
  description: string;
  icon: string;
  severity: "mild" | "moderate" | "severe";
  apply: (player: Player) => void;
}

export interface CurseBlessingPair {
  id: string;
  blessing: BlessingDef;
  curse: CurseDef;
}

export interface CurseBlessingState {
  activeBlessings: BlessingId[];
  activeCurses: CurseId[];
  pendingPairs: CurseBlessingPair[] | null;
  pairsChosen: number;
}

const BLESSING_DEFS: Record<BlessingId, BlessingDef> = {
  berserkersRage: {
    id: "berserkersRage",
    name: "狂战士之怒",
    icon: "🔥",
    rarity: "rare",
    description: "攻击力+25%，但每击杀一个敌人会短暂降低移速",
    apply: (p) => { p.damage = Math.round(p.damage * 1.25); },
  },
  ironSkin: {
    id: "ironSkin",
    name: "铁皮术",
    icon: "🛡",
    rarity: "common",
    description: "最大生命值+30%，护甲+10%",
    apply: (p) => {
      p.maxHealth = Math.round(p.maxHealth * 1.3);
      p.health = p.maxHealth;
      p.armor = (p.armor ?? 0) + 0.1;
    },
  },
  swiftStrikes: {
    id: "swiftStrikes",
    name: "迅捷打击",
    icon: "⚡",
    rarity: "rare",
    description: "攻击速度+35%，移速+8%",
    apply: (p) => {
      p.attackSpeed = (p.attackSpeed ?? 1) * 1.35;
      p.speed = Math.round(p.speed * 1.08);
    },
  },
  vampiricTouch: {
    id: "vampiricTouch",
    name: "吸血之触",
    icon: "🩸",
    rarity: "epic",
    description: "击杀敌人回复最大生命值5%，攻击附带3%吸血",
    apply: (p) => { p.lifesteal = (p.lifesteal ?? 0) + 0.03; },
  },
  arcaneAmplifier: {
    id: "arcaneAmplifier",
    name: "奥术增幅",
    icon: "✨",
    rarity: "epic",
    description: "技能冷却缩减+25%，技能伤害+20%",
    apply: (p) => {
      p.cooldownReduction = (p.cooldownReduction ?? 0) + 0.25;
      p.skillDamageMul = (p.skillDamageMul ?? 1) * 1.2;
    },
  },
  criticalMass: {
    id: "criticalMass",
    name: "暴击质量",
    icon: "💥",
    rarity: "legendary",
    description: "暴击率+20%，暴击伤害+50%",
    apply: (p) => {
      p.critChance = (p.critChance ?? 0.05) + 0.2;
      p.critMultiplier = (p.critMultiplier ?? 1.5) + 0.5;
    },
  },
  regenerativeCells: {
    id: "regenerativeCells",
    name: "再生细胞",
    icon: "💚",
    rarity: "common",
    description: "每秒回复2%最大生命值",
    apply: (p) => { p.regen = (p.regen ?? 0) + 2; },
  },
  shadowStep: {
    id: "shadowStep",
    name: "暗影步",
    icon: "👤",
    rarity: "rare",
    description: "闪避冷却-40%，闪避后短暂隐身",
    apply: (p) => { p.dashCooldown = (p.dashCooldown ?? 3) * 0.6; },
  },
  explosiveRounds: {
    id: "explosiveRounds",
    name: "爆裂弹",
    icon: "💣",
    rarity: "epic",
    description: "击杀敌人时产生范围爆炸，伤害为攻击力的60%",
    apply: (p) => { p.explosionOnKill = (p.explosionOnKill ?? 0) + 0.6; },
  },
  thornsAura: {
    id: "thornsAura",
    name: "荆棘光环",
    icon: "🌿",
    rarity: "common",
    description: "受到伤害时反弹25%给攻击者",
    apply: (p) => { p.thorns = (p.thorns ?? 0) + 0.25; },
  },
  doubleShot: {
    id: "doubleShot",
    name: "双发",
    icon: "🎯",
    rarity: "legendary",
    description: "每次攻击有45%概率发射额外弹幕",
    apply: (p) => { p.multishotChance = (p.multishotChance ?? 0) + 0.45; },
  },
  energyShield: {
    id: "energyShield",
    name: "能量护盾",
    icon: "🔮",
    rarity: "rare",
    description: "每10秒获得一个吸收15%最大生命值的护盾",
    apply: (p) => { p.periodicShield = (p.periodicShield ?? 0) + 0.15; },
  },
};

const CURSE_DEFS: Record<CurseId, CurseDef> = {
  glassCannon: {
    id: "glassCannon",
    name: "玻璃大炮",
    icon: "💔",
    severity: "severe",
    description: "最大生命值-20%",
    apply: (p) => {
      p.maxHealth = Math.round(p.maxHealth * 0.8);
      p.health = Math.min(p.health, p.maxHealth);
    },
  },
  sluggishMovement: {
    id: "sluggishMovement",
    name: "步履蹒跚",
    icon: "🐌",
    severity: "moderate",
    description: "移动速度-15%",
    apply: (p) => { p.speed = Math.round(p.speed * 0.85); },
  },
  reducedHealing: {
    id: "reducedHealing",
    name: "治疗抑制",
    icon: "🚫",
    severity: "moderate",
    description: "受到的治疗效果-40%",
    apply: (p) => { p.healingReceivedMul = (p.healingReceivedMul ?? 1) * 0.6; },
  },
  weakenedAttacks: {
    id: "weakenedAttacks",
    name: "虚弱攻击",
    icon: "🔻",
    severity: "mild",
    description: "攻击力-10%",
    apply: (p) => { p.damage = Math.round(p.damage * 0.9); },
  },
  vulnerableArmor: {
    id: "vulnerableArmor",
    name: "脆弱护甲",
    icon: "🛡",
    severity: "mild",
    description: "护甲-8%",
    apply: (p) => { p.armor = Math.max(0, (p.armor ?? 0) - 0.08); },
  },
  energyDrain: {
    id: "energyDrain",
    name: "能量流失",
    icon: "🔋",
    severity: "moderate",
    description: "技能冷却+25%",
    apply: (p) => { p.cooldownReduction = Math.max(-0.5, (p.cooldownReduction ?? 0) - 0.25); },
  },
  bloodPact: {
    id: "bloodPact",
    name: "血之契约",
    icon: "📜",
    severity: "severe",
    description: "每秒失去1%当前生命值，但击杀回复翻倍",
    apply: (p) => { p.bloodPactDrain = (p.bloodPactDrain ?? 0) + 1; },
  },
  diminishedRange: {
    id: "diminishedRange",
    name: "短视",
    icon: "👁",
    severity: "mild",
    description: "攻击范围-15%",
    apply: (p) => { p.rangeMul = (p.rangeMul ?? 1) * 0.85; },
  },
  unstableAmmo: {
    id: "unstableAmmo",
    name: "不稳定弹药",
    icon: "💥",
    severity: "moderate",
    description: "攻击有10%概率MISS",
    apply: (p) => { p.missChance = (p.missChance ?? 0) + 0.1; },
  },
  cursedLuck: {
    id: "cursedLuck",
    name: "厄运缠身",
    icon: "🍀",
    severity: "mild",
    description: "掉落品质降低一级",
    apply: (p) => { p.luckPenalty = (p.luckPenalty ?? 0) + 1; },
  },
  heavyBurden: {
    id: "heavyBurden",
    name: "沉重负担",
    icon: "🏋",
    severity: "moderate",
    description: "闪避次数-1",
    apply: (p) => { p.maxDashes = Math.max(1, (p.maxDashes ?? 2) - 1); },
  },
  attractEnemies: {
    id: "attractEnemies",
    name: "敌意吸引",
    icon: "🎯",
    severity: "severe",
    description: "敌人仇恨范围+50%，移动速度+10%",
    apply: (p) => { p.threatRadiusMul = (p.threatRadiusMul ?? 1) * 1.5; },
  },
};

const PAIRING_RULES: Record<BlessingId, CurseId[]> = {
  berserkersRage: ["sluggishMovement", "heavyBurden", "weakenedAttacks"],
  ironSkin: ["sluggishMovement", "energyDrain", "reducedHealing"],
  swiftStrikes: ["glassCannon", "vulnerableArmor", "weakenedAttacks"],
  vampiricTouch: ["reducedHealing", "glassCannon", "bloodPact"],
  arcaneAmplifier: ["energyDrain", "reducedHealing", "unstableAmmo"],
  criticalMass: ["glassCannon", "unstableAmmo", "cursedLuck"],
  regenerativeCells: ["reducedHealing", "weakenedAttacks", "bloodPact"],
  shadowStep: ["heavyBurden", "sluggishMovement", "attractEnemies"],
  explosiveRounds: ["unstableAmmo", "diminishedRange", "vulnerableArmor"],
  thornsAura: ["glassCannon", "attractEnemies", "vulnerableArmor"],
  doubleShot: ["unstableAmmo", "energyDrain", "cursedLuck"],
  energyShield: ["reducedHealing", "bloodPact", "energyDrain"],
};

export function createCurseBlessingState(): CurseBlessingState {
  return {
    activeBlessings: [],
    activeCurses: [],
    pendingPairs: null,
    pairsChosen: 0,
  };
}

export function generateCurseBlessingPairs(
  stageIndex: number,
  seed: number
): CurseBlessingPair[] {
  const rng = createSeededRandom(seed + stageIndex * 9973);
  const blessingIds = Object.keys(BLESSING_DEFS) as BlessingId[];
  const selected = new Set<BlessingId>();

  const pairs: CurseBlessingPair[] = [];
  for (let i = 0; i < 3; i++) {
    let blessingId: BlessingId;
    let attempts = 0;
    do {
      blessingId = blessingIds[Math.floor(rng() * blessingIds.length)];
      attempts++;
    } while (selected.has(blessingId) && attempts < 20);

    selected.add(blessingId);
    const blessing = BLESSING_DEFS[blessingId];
    const curseOptions = PAIRING_RULES[blessingId];
    const curseId = curseOptions[Math.floor(rng() * curseOptions.length)];
    const curse = CURSE_DEFS[curseId];

    pairs.push({
      id: `cb_${blessingId}_${curseId}`,
      blessing,
      curse,
    });
  }

  return pairs;
}

export function applyCurseBlessingPair(
  state: CurseBlessingState,
  pair: CurseBlessingPair,
  player: Player
): void {
  pair.blessing.apply(player);
  pair.curse.apply(player);
  state.activeBlessings.push(pair.blessing.id);
  state.activeCurses.push(pair.curse.id);
  state.pairsChosen++;
  state.pendingPairs = null;
}

export function getActiveBlessingCount(state: CurseBlessingState): number {
  return state.activeBlessings.length;
}

export function getActiveCurseCount(state: CurseBlessingState): number {
  return state.activeCurses.length;
}

function createSeededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}