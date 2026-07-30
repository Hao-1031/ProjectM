import type { PvPWeaponDef, PvPWeaponId } from "./types";

export const PVP_WEAPON_DEFS: Record<PvPWeaponId, PvPWeaponDef> = {
  brass_knuckles: {
    id: "brass_knuckles",
    name: "指虎",
    type: "melee",
    description: "近身搏击利器，快速连击积累 combo。每 3 次命中触发一次重击，伤害 +50%。",
    damage: 65,
    attackSpeed: 3.0,
    range: 50,
    knockback: 60,
    special: {
      name: "三连击",
      description: "每 3 次命中释放一次重击，伤害 +50% 并击退。",
      cooldown: 0,
      type: "combo",
    },
    color: "#E8652C",
  },

  crossbow: {
    id: "crossbow",
    name: "十字弩",
    type: "ranged",
    description: "高精度远程武器，蓄力后射出穿透箭矢。蓄力满 1.5 秒后伤害 +80%。",
    damage: 90,
    attackSpeed: 1.2,
    range: 350,
    knockback: 30,
    special: {
      name: "蓄力射击",
      description: "蓄力 1.5 秒后伤害 +80%，箭矢穿透目标。",
      cooldown: 0,
      type: "charge",
    },
    color: "#7C3AED",
  },

  combat_blade: {
    id: "combat_blade",
    name: "战术匕首",
    type: "melee",
    description: "轻便锋利的近战武器，攻击速度快且可格挡。完美格挡后反击伤害 +100%。",
    damage: 55,
    attackSpeed: 4.0,
    range: 40,
    knockback: 20,
    special: {
      name: "完美格挡",
      description: "在敌方攻击命中前 0.3 秒格挡，免疫伤害并反击造成 200% 伤害。",
      cooldown: 3,
      type: "parry",
    },
    color: "#6B7280",
  },

  shock_gauntlet: {
    id: "shock_gauntlet",
    name: "震击拳套",
    type: "hybrid",
    description: "带电的近中距离武器，普攻附带范围电击。特殊攻击可释放冲击波。",
    damage: 70,
    attackSpeed: 2.2,
    range: 100,
    knockback: 90,
    special: {
      name: "冲击波",
      description: "释放锥形冲击波（角度 60 度，范围 150），造成 100 伤害并麻痹 1 秒。",
      cooldown: 6,
      type: "burst",
    },
    color: "#06B6D4",
  },

  tactical_bow: {
    id: "tactical_bow",
    name: "战术弓",
    type: "ranged",
    description: "多功能远程武器，可速射和蓄力。后跳射击脱离近战。",
    damage: 75,
    attackSpeed: 1.8,
    range: 300,
    knockback: 25,
    special: {
      name: "后跳射击",
      description: "向后跳跃 120 距离并射出强力箭矢，伤害 +60% 并减速 40%。",
      cooldown: 5,
      type: "dash",
    },
    color: "#F59E0B",
  },

  phase_dagger: {
    id: "phase_dagger",
    name: "相位匕首",
    type: "hybrid",
    description: "可投掷的相位武器，命中后标记目标。再次激活可瞬移至标记位置。",
    damage: 60,
    attackSpeed: 2.5,
    range: 180,
    knockback: 35,
    special: {
      name: "相位转移",
      description: "瞬移至被标记目标身后，造成 80 伤害并获得 1 秒无敌。",
      cooldown: 8,
      type: "teleport",
    },
    color: "#8B5CF6",
  },
};

export function getPvPWeapon(id: PvPWeaponId): PvPWeaponDef {
  return PVP_WEAPON_DEFS[id];
}

export function listPvPWeaponIds(): PvPWeaponId[] {
  return Object.keys(PVP_WEAPON_DEFS) as PvPWeaponId[];
}

export function getPvPWeaponName(id: PvPWeaponId): string {
  return PVP_WEAPON_DEFS[id].name;
}

export function getPvPWeaponType(id: PvPWeaponId): string {
  return PVP_WEAPON_DEFS[id].type;
}