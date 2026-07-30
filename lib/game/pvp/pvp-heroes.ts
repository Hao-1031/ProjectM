import type { PvPHeroDef, PvPHeroId } from "./types";

export const PVP_HERO_DEFS: Record<PvPHeroId, PvPHeroDef> = {
  iron_fist: {
    id: "iron_fist",
    name: "铁拳格斗家",
    role: "近战 / 压制",
    tagline: "一拳破甲",
    description: "重型近战斗士，凭借铁拳套与合金装甲撕裂防线。近距离爆发力极强，适合正面硬碰硬。",
    color: "#E8652C",
    health: 1200,
    armor: 0.25,
    speed: 3.2,
    skills: [
      {
        id: "iron_punch",
        name: "碎甲重拳",
        description: "蓄力向前猛击，造成 180 伤害并击退敌人，短暂眩晕 0.5 秒。",
        cooldown: 4,
        damage: 180,
        range: 80,
        duration: 0.5,
        color: "#E8652C",
      },
      {
        id: "iron_slam",
        name: "地震猛击",
        description: "跳跃砸地，对半径 120 内敌人造成 120 伤害并减速 40%，持续 2 秒。",
        cooldown: 8,
        damage: 120,
        range: 120,
        duration: 2,
        color: "#CC5500",
      },
    ],
    ultimate: {
      id: "iron_rampage",
      name: "钢铁狂怒",
      description: "进入狂暴状态 5 秒，攻击速度 +60%，免疫控制，每次命中恢复 5% 最大生命。",
      cooldown: 30,
      damage: 0,
      range: 0,
      duration: 5,
      color: "#FF4400",
    },
    passive: {
      name: "合金装甲",
      description: "生命低于 30% 时获得 15% 伤害减免。",
      armorBonus: 0.15,
    },
  },

  shadow_assassin: {
    id: "shadow_assassin",
    name: "暗影刺客",
    role: "突进 / 刺杀",
    tagline: "一击脱离",
    description: "高机动性暗杀者，擅长瞬间切入战场完成击杀后迅速撤离。操作难度高，回报极大。",
    color: "#7C3AED",
    health: 800,
    armor: 0.08,
    speed: 5.5,
    skills: [
      {
        id: "shadow_strike",
        name: "暗影突刺",
        description: "瞬移至目标身后造成 200 伤害，若目标生命低于 30% 则伤害翻倍。",
        cooldown: 6,
        damage: 200,
        range: 200,
        duration: 0,
        color: "#7C3AED",
      },
      {
        id: "smoke_bomb",
        name: "烟雾弹",
        description: "原地释放烟雾 3 秒，隐身并加速 40%，攻击或技能打破隐身。",
        cooldown: 10,
        damage: 0,
        range: 100,
        duration: 3,
        color: "#5B21B6",
      },
    ],
    ultimate: {
      id: "death_mark",
      name: "死亡印记",
      description: "标记目标 4 秒，期间对其造成伤害 +30%，标记结束时造成累计伤害 50% 的额外真实伤害。",
      cooldown: 25,
      damage: 0,
      range: 180,
      duration: 4,
      color: "#8B5CF6",
    },
    passive: {
      name: "暗影步",
      description: "脱离战斗 3 秒后移速 +20%，下次攻击造成额外 40 伤害。",
      speedBonus: 0.2,
      damageBonus: 40,
    },
  },

  flame_knight: {
    id: "flame_knight",
    name: "烈焰骑士",
    role: "中距 / 灼烧",
    tagline: "焚尽一切",
    description: "操纵火焰的中距离战士，擅长持续灼烧和区域压制。火焰护盾提供额外生存能力。",
    color: "#F59E0B",
    health: 1000,
    armor: 0.15,
    speed: 3.8,
    skills: [
      {
        id: "fire_slash",
        name: "烈焰斩",
        description: "向前方扇形区域挥出火焰，造成 150 伤害并附加灼烧效果（每秒 20 伤害，持续 3 秒）。",
        cooldown: 5,
        damage: 150,
        range: 140,
        duration: 3,
        color: "#F59E0B",
      },
      {
        id: "fire_wall",
        name: "火墙",
        description: "在面前生成一道火墙（宽 200），持续 4 秒，穿越者受到 80 伤害并被灼烧。",
        cooldown: 10,
        damage: 80,
        range: 100,
        duration: 4,
        color: "#D97706",
      },
    ],
    ultimate: {
      id: "inferno",
      name: "炼狱风暴",
      description: "以自身为中心释放半径 200 的火焰风暴 4 秒，每 0.5 秒造成 60 伤害，范围内敌人灼烧层数翻倍。",
      cooldown: 28,
      damage: 60,
      range: 200,
      duration: 4,
      color: "#EF4444",
    },
    passive: {
      name: "火焰之心",
      description: "对灼烧目标伤害 +15%，击杀灼烧目标回复 8% 生命。",
      damageBonus: 0.15,
      healthRegen: 0.08,
    },
  },

  storm_ranger: {
    id: "storm_ranger",
    name: "风暴游侠",
    role: "远程 / 控场",
    tagline: "风雷齐鸣",
    description: "远程射手，利用风与雷电的力量在远处精准打击。高机动性配合风筝战术难以被近身。",
    color: "#06B6D4",
    health: 850,
    armor: 0.1,
    speed: 4.5,
    skills: [
      {
        id: "chain_lightning",
        name: "连锁闪电",
        description: "发射闪电链，命中目标后弹射至附近 2 个敌人，每次弹射伤害递减 30%。初始伤害 130。",
        cooldown: 5,
        damage: 130,
        range: 250,
        duration: 0,
        color: "#06B6D4",
      },
      {
        id: "wind_step",
        name: "疾风步",
        description: "向指定方向冲刺 150 距离，路径上留下持续 2 秒的旋风，减速敌人 50%。",
        cooldown: 7,
        damage: 0,
        range: 150,
        duration: 2,
        color: "#22D3EE",
      },
    ],
    ultimate: {
      id: "tempest",
      name: "暴风之眼",
      description: "在目标区域召唤风暴 5 秒，每 0.5 秒造成 50 伤害，中心区域敌人被拉向风暴中心。",
      cooldown: 26,
      damage: 50,
      range: 220,
      duration: 5,
      color: "#0891B2",
    },
    passive: {
      name: "风之轻语",
      description: "每 12 秒获得一次闪避充能，完全闪避下次攻击。最多存储 2 层。",
      speedBonus: 0.1,
    },
  },
};

export function getPvPHero(id: PvPHeroId): PvPHeroDef {
  return PVP_HERO_DEFS[id];
}

export function listPvPHeroIds(): PvPHeroId[] {
  return Object.keys(PVP_HERO_DEFS) as PvPHeroId[];
}

export function getPvPHeroName(id: PvPHeroId): string {
  return PVP_HERO_DEFS[id].name;
}

export function getPvPHeroRole(id: PvPHeroId): string {
  return PVP_HERO_DEFS[id].role;
}