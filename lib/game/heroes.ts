import type { HeroId, HeroSkill, Player, GameState, Deployable, Enemy, HeroTalent } from "./types";
import { uid, distance, angleBetween, normalize, clamp } from "./math";

export interface HeroDef {
  id: HeroId;
  name: string;
  role: string;
  tagline: string;
  description: string;
  color: string;
  skill: HeroSkill;
  passive: {
    maxHealthMul?: number;
    speedMul?: number;
    armorAdd?: number;
    critAdd?: number;
    regenAdd?: number;
    cooldownReductionAdd?: number;
    areaMul?: number;
  };
  talents: HeroTalent[];
}

const BASE_SKILL_RANGE = 220;

export const HERO_DEFS: Record<HeroId, HeroDef> = {
  scout: {
    id: "scout",
    name: "侦察",
    role: "侦察",
    tagline: "情报侦察",
    description: "高机动游击单位，可部署侦察信标提升团队暴击与视野",
    color: "#22d3ee",
    skill: {
      id: "scout_beacon",
      name: "侦察信标",
      description: "部署信标，范围内友方暴击率 +15%",
      cooldown: 14,
      timer: 0,
      range: BASE_SKILL_RANGE,
      duration: 10,
      color: "#22d3ee",
    },
    passive: { speedMul: 1.1, critAdd: 0.08 },
    talents: [
      {
        id: "scout_pathfinder",
        name: "探路者",
        description: "移动速度 +4%",
        maxLevel: 5,
        category: "damage",
        modifiers: { speedMul: 1.04 },
      },
      {
        id: "scout_weakspot",
        name: "弱点扫描",
        description: "暴击率 +3%",
        maxLevel: 5,
        category: "damage",
        modifiers: { critAdd: 0.03 },
      },
      {
        id: "scout_relay",
        name: "信号中继",
        description: "技能持续时间 +10%",
        maxLevel: 5,
        category: "skill",
        modifiers: { skillDurationMul: 0.1 },
      },
      {
        id: "scout_beacon_range",
        name: "广域信标",
        description: "侦察信标作用范围 +12%",
        maxLevel: 5,
        category: "damage",
        modifiers: { areaMul: 1.12 },
      },
      {
        id: "scout_evasion",
        name: "闪避机动",
        description: "受到伤害后 2 秒内移动速度 +8%",
        maxLevel: 5,
        category: "damage",
        modifiers: { speedMul: 1.04 },
      },
      {
        id: "scout_precision",
        name: "精密射击",
        description: "武器射程 +5%",
        maxLevel: 5,
        category: "damage",
        modifiers: { rangeMul: 1.05 },
      },
      {
        id: "scout_targeting",
        name: "联合标定",
        description: "信标范围内敌人受到的伤害 +4%",
        maxLevel: 5,
        category: "damage",
        modifiers: { damageMul: 1.04 },
      },
      {
        id: "scout_sensor",
        name: "预警雷达",
        description: "拾取范围 +10%",
        maxLevel: 5,
        category: "damage",
        modifiers: { areaMul: 1.1 },
      },
    ],
  },
  assault: {
    id: "assault",
    name: "突击",
    role: "突击",
    tagline: "正面压制",
    description: "前线重火力，可展开护盾吸收伤害",
    color: "#f59e0b",
    skill: {
      id: "assault_shield",
      name: "冲锋护盾",
      description: "部署能量护盾，阻挡敌方子弹并减少通过伤害",
      cooldown: 16,
      timer: 0,
      range: BASE_SKILL_RANGE,
      duration: 8,
      color: "#f59e0b",
    },
    passive: { maxHealthMul: 1.2, armorAdd: 0.06 },
    talents: [
      {
        id: "assault_fortify",
        name: "加固装甲",
        description: "护甲 +3%",
        maxLevel: 5,
        category: "utility",
        modifiers: { armorAdd: 0.03 },
      },
      {
        id: "assault_vitality",
        name: "战斗体质",
        description: "最大生命值 +8%",
        maxLevel: 5,
        category: "utility",
        modifiers: { healthMul: 1.08 },
      },
      {
        id: "assault_bulwark",
        name: "壁垒扩展",
        description: "技能持续时间 +10%",
        maxLevel: 5,
        category: "skill",
        modifiers: { skillDurationMul: 0.1 },
      },
      {
        id: "assault_shield_health",
        name: "超密护盾",
        description: "护盾生命值 +15%",
        maxLevel: 5,
        category: "utility",
        modifiers: { healthMul: 1.05 },
      },
      {
        id: "assault_kinetic",
        name: "动能反馈",
        description: "武器伤害 +5%",
        maxLevel: 5,
        category: "damage",
        modifiers: { damageMul: 1.05 },
      },
      {
        id: "assault_adrenaline",
        name: "肾上腺素",
        description: "技能冷却 -5%",
        maxLevel: 5,
        category: "damage",
        modifiers: { cooldownMul: 0.95 },
      },
      {
        id: "assault_bastion",
        name: "不动要塞",
        description: "静止时受到伤害 -5%",
        maxLevel: 5,
        category: "utility",
        modifiers: { armorAdd: 0.02 },
      },
      {
        id: "assault_onslaught",
        name: "压制火力",
        description: "武器射速 +4%",
        maxLevel: 5,
        category: "damage",
        modifiers: { cooldownMul: 0.96 },
      },
    ],
  },
  medic: {
    id: "medic",
    name: "医疗",
    role: "医疗",
    tagline: "战地治疗",
    description: "团队续航核心，无人机持续治疗附近友军",
    color: "#34d399",
    skill: {
      id: "medic_drone",
      name: "治疗无人机",
      description: "部署无人机，持续恢复范围内友方生命",
      cooldown: 18,
      timer: 0,
      range: BASE_SKILL_RANGE,
      duration: 10,
      color: "#34d399",
    },
    passive: { regenAdd: 2, maxHealthMul: 0.95 },
    talents: [
      {
        id: "medic_regen",
        name: "纳米修复",
        description: "生命恢复 +0.5/秒",
        maxLevel: 5,
        category: "utility",
        modifiers: { regenAdd: 0.5 },
      },
      {
        id: "medic_efficiency",
        name: "冷却优化",
        description: "武器冷却 -4%",
        maxLevel: 5,
        category: "damage",
        modifiers: { cooldownMul: 0.96 },
      },
      {
        id: "medic_field",
        name: "治疗场",
        description: "技能持续时间 +10%",
        maxLevel: 5,
        category: "skill",
        modifiers: { skillDurationMul: 0.1 },
      },
      {
        id: "medic_drone_range",
        name: "广域治疗无人机",
        description: "治疗无人机作用范围 +12%",
        maxLevel: 5,
        category: "skill",
        modifiers: { deployableRangeMul: 1.12 },
      },
      {
        id: "medic_drone_output",
        name: "超导修复束",
        description: "治疗无人机恢复量 +8%",
        maxLevel: 5,
        category: "skill",
        modifiers: { deployableDamageMul: 1.08 },
      },
      {
        id: "medic_hygiene",
        name: "净化协议",
        description: "治疗无人机同时清除燃烧与腐蚀减益",
        maxLevel: 1,
        category: "skill",
        modifiers: { deployableDurationMul: 1.05 },
      },
      {
        id: "medic_vitality",
        name: "急救强化",
        description: "最大生命值 +6%",
        maxLevel: 5,
        category: "utility",
        modifiers: { healthMul: 1.06 },
      },
      {
        id: "medic_sympathy",
        name: "共感链接",
        description: "附近友军获得你 15% 生命恢复效果",
        maxLevel: 5,
        category: "utility",
        modifiers: { regenAdd: 0.2 },
      },
      {
        id: "medic_speed",
        name: "战地机动",
        description: "移动速度 +4%",
        maxLevel: 5,
        category: "damage",
        modifiers: { speedMul: 1.04 },
      },
      {
        id: "medic_resilience",
        name: "生物装甲",
        description: "护甲 +3%",
        maxLevel: 5,
        category: "utility",
        modifiers: { armorAdd: 0.03 },
      },
    ],
  },
  engineer: {
    id: "engineer",
    name: "工程",
    role: "工程",
    tagline: "阵地构筑",
    description: "防御专家，可部署自动炮塔并缓慢修复核心",
    color: "#a855f7",
    skill: {
      id: "engineer_turret",
      name: "自动炮塔",
      description: "部署炮塔自动攻击附近敌人",
      cooldown: 20,
      timer: 0,
      range: BASE_SKILL_RANGE,
      duration: 12,
      color: "#a855f7",
    },
    passive: { cooldownReductionAdd: 0.08, areaMul: 1.1 },
    talents: [
      {
        id: "engineer_overclock",
        name: "超频核心",
        description: "武器冷却 -4%",
        maxLevel: 5,
        category: "damage",
        modifiers: { cooldownMul: 0.96 },
      },
      {
        id: "engineer_optics",
        name: "炮塔光学",
        description: "伤害 +5%",
        maxLevel: 5,
        category: "damage",
        modifiers: { damageMul: 1.05 },
      },
      {
        id: "engineer_range",
        name: "射程增幅",
        description: "武器射程 +6%",
        maxLevel: 5,
        category: "damage",
        modifiers: { rangeMul: 1.06 },
      },
      {
        id: "engineer_turret_damage",
        name: "穿甲弹药",
        description: "自动炮塔伤害 +10%",
        maxLevel: 5,
        category: "skill",
        modifiers: { deployableDamageMul: 1.1 },
      },
      {
        id: "engineer_turret_rate",
        name: "双联供弹",
        description: "自动炮塔射速 +8%",
        maxLevel: 5,
        category: "skill",
        modifiers: { deployableCooldownMul: 0.92 },
      },
      {
        id: "engineer_turret_range",
        name: "遥控制导",
        description: "自动炮塔射程 +12%",
        maxLevel: 5,
        category: "skill",
        modifiers: { deployableRangeMul: 1.12 },
      },
      {
        id: "engineer_turret_armor",
        name: "合金装甲",
        description: "自动炮塔生命值 +15%",
        maxLevel: 5,
        category: "skill",
        modifiers: { deployableHealthMul: 1.15 },
      },
      {
        id: "engineer_repair",
        name: "战场维修",
        description: "炮塔持续缓慢自我修复，每秒 8 点",
        maxLevel: 3,
        category: "skill",
        modifiers: { deployableDurationMul: 1.05 },
      },
      {
        id: "engineer_core_repair",
        name: "核心稳压",
        description: "每波结束为核心恢复 2% 最大生命值",
        maxLevel: 5,
        category: "utility",
        modifiers: { regenAdd: 0.15 },
      },
      {
        id: "engineer_area",
        name: "连锁覆盖",
        description: "范围效果 +6%",
        maxLevel: 5,
        category: "damage",
        modifiers: { areaMul: 1.06 },
      },
    ],
  },
  vanguard: {
    id: "vanguard",
    name: "先锋",
    role: "先锋",
    tagline: "区域封锁",
    description: "突破专家，可布雷封锁通道并对重甲造成额外杀伤",
    color: "#f43f5e",
    skill: {
      id: "vanguard_mine",
      name: "爆破雷区",
      description: "部署感应地雷，敌人靠近时爆炸",
      cooldown: 17,
      timer: 0,
      range: BASE_SKILL_RANGE,
      duration: 14,
      color: "#f43f5e",
    },
    passive: { maxHealthMul: 1.15, armorAdd: 0.05 },
    talents: [
      {
        id: "vanguard_demolition",
        name: "爆破专家",
        description: "范围效果 +8%",
        maxLevel: 5,
        category: "damage",
        modifiers: { areaMul: 1.08 },
      },
      {
        id: "vanguard_fortress",
        name: "移动堡垒",
        description: "护甲 +3%",
        maxLevel: 5,
        category: "utility",
        modifiers: { armorAdd: 0.03 },
      },
      {
        id: "vanguard_payload",
        name: "重型装药",
        description: "伤害 +5%",
        maxLevel: 5,
        category: "damage",
        modifiers: { damageMul: 1.05 },
      },
      {
        id: "vanguard_mine_yield",
        name: "聚能装药",
        description: "感应地雷爆炸伤害 +12%",
        maxLevel: 5,
        category: "skill",
        modifiers: { deployableDamageMul: 1.12 },
      },
      {
        id: "vanguard_mine_radius",
        name: "破片扩散",
        description: "感应地雷爆炸半径 +10%",
        maxLevel: 5,
        category: "skill",
        modifiers: { deployableRangeMul: 1.1 },
      },
      {
        id: "vanguard_mine_arming",
        name: "速发引信",
        description: "感应地雷触发半径 +8%",
        maxLevel: 5,
        category: "skill",
        modifiers: { deployableRangeMul: 1.04 },
      },
      {
        id: "vanguard_mine_count",
        name: "布雷阵列",
        description: "技能额外同时部署 1 枚地雷",
        maxLevel: 3,
        category: "skill",
        modifiers: { deployableDamageMul: 1.06 },
      },
      {
        id: "vanguard_breach",
        name: "破甲弹头",
        description: "对精英与 Boss 伤害 +6%",
        maxLevel: 5,
        category: "damage",
        modifiers: { damageMul: 1.03 },
      },
      {
        id: "vanguard_impact",
        name: "震荡冲击",
        description: "地雷爆炸短暂眩晕命中敌人 0.4 秒",
        maxLevel: 3,
        category: "skill",
        modifiers: { deployableDurationMul: 1.05 },
      },
      {
        id: "vanguard_adrenaline",
        name: "冲锋激素",
        description: "移动速度 +4%",
        maxLevel: 5,
        category: "damage",
        modifiers: { speedMul: 1.04 },
      },
    ],
  },
};

export interface HeroSynergyBonus {
  id: string;
  name: string;
  description: string;
  required: HeroId[];
  bonus: {
    damageMul?: number;
    cooldownMul?: number;
    rangeMul?: number;
    areaMul?: number;
    critAdd?: number;
    armorAdd?: number;
    regenAdd?: number;
    speedMul?: number;
    healthMul?: number;
    deployableDamageMul?: number;
    deployableHealthMul?: number;
    deployableDurationMul?: number;
  };
}

export const HERO_SYNERGIES: HeroSynergyBonus[] = [
  {
    id: "synergy_frontline",
    name: "钢铁前线",
    description: "突击 + 先锋同队时，双方护甲 +5% 且最大生命值 +6%",
    required: ["assault", "vanguard"],
    bonus: { armorAdd: 0.05, healthMul: 1.06 },
  },
  {
    id: "synergy_recon_net",
    name: "侦察网络",
    description: "侦察 + 工程同队时，武器射程 +8% 且冷却 -5%",
    required: ["scout", "engineer"],
    bonus: { rangeMul: 1.08, cooldownMul: 0.95 },
  },
  {
    id: "synergy_field_hospital",
    name: "战地医院",
    description: "医疗 + 工程同队时，生命恢复 +1/秒 且可部署物生命值 +10%",
    required: ["medic", "engineer"],
    bonus: { regenAdd: 1, deployableHealthMul: 1.1 },
  },
  {
    id: "synergy_hunter_pack",
    name: "猎杀小队",
    description: "侦察 + 先锋同队时，暴击率 +4% 且对精英伤害 +8%",
    required: ["scout", "vanguard"],
    bonus: { critAdd: 0.04, damageMul: 1.04 },
  },
  {
    id: "synergy_overwatch",
    name: "火力掩护",
    description: "突击 + 医疗同队时，受到伤害 -4% 且治疗无人机效率 +10%",
    required: ["assault", "medic"],
    bonus: { armorAdd: 0.04, deployableDamageMul: 1.1 },
  },
  {
    id: "synergy_full_squad",
    name: "完整火力组",
    description: "四位英雄全部登场时，所有属性 +3% 且技能冷却 -5%",
    required: ["scout", "assault", "medic", "engineer", "vanguard"],
    bonus: { damageMul: 1.03, healthMul: 1.03, speedMul: 1.03, cooldownMul: 0.95 },
  },
];

export function getActiveSynergies(selectedHeroes: HeroId[]): HeroSynergyBonus[] {
  const unique = Array.from(new Set(selectedHeroes));
  return HERO_SYNERGIES.filter((synergy) => {
    if (synergy.required.length === 4) {
      return synergy.required.every((id) => unique.includes(id));
    }
    return synergy.required.every((id) => unique.includes(id));
  });
}

export function applyHeroSynergyBonus(player: Player, selectedHeroes: HeroId[]): Player {
  const synergies = getActiveSynergies(selectedHeroes);
  for (const synergy of synergies) {
    const b = synergy.bonus;
    if (b.damageMul) {
      for (const weapon of player.weapons) {
        weapon.damage = Math.round(weapon.damage * b.damageMul);
      }
    }
    if (b.cooldownMul) {
      for (const weapon of player.weapons) {
        weapon.cooldown *= b.cooldownMul;
      }
      if (player.activeSkill) {
        player.activeSkill.cooldown = Math.max(1, player.activeSkill.cooldown * b.cooldownMul);
      }
    }
    if (b.rangeMul) {
      for (const weapon of player.weapons) {
        weapon.range *= b.rangeMul;
      }
    }
    if (b.areaMul) player.areaMultiplier *= b.areaMul;
    if (b.critAdd) player.critChance += b.critAdd;
    if (b.armorAdd) player.armor += b.armorAdd;
    if (b.regenAdd) player.regen += b.regenAdd;
    if (b.speedMul) player.speed *= b.speedMul;
    if (b.healthMul) {
      player.maxHealth = Math.floor(player.maxHealth * b.healthMul);
      player.health = player.maxHealth;
    }
    if (b.deployableDamageMul) {
      player.deployableUpgrades["damage"] =
        (player.deployableUpgrades["damage"] ?? 0) + Math.round((b.deployableDamageMul - 1) * 100);
    }
    if (b.deployableHealthMul) {
      player.deployableUpgrades["health"] =
        (player.deployableUpgrades["health"] ?? 0) + Math.round((b.deployableHealthMul - 1) * 100);
    }
    if (b.deployableDurationMul) {
      player.deployableUpgrades["duration"] =
        (player.deployableUpgrades["duration"] ?? 0) +
        Math.round((b.deployableDurationMul - 1) * 100);
    }
  }
  return player;
}

export function upgradeDeployable(player: Player, upgradeId: string): Player {
  if (!player.deployableUpgrades) player.deployableUpgrades = {};
  player.deployableUpgrades[upgradeId] = (player.deployableUpgrades[upgradeId] ?? 0) + 1;
  return player;
}

export function getDeployableMultiplier(player: Player, upgradeId: string): number {
  const rank = player.deployableUpgrades?.[upgradeId] ?? 0;
  return 1 + rank * 0.01;
}

export function applyHeroToPlayer(player: Player, heroId: HeroId): Player {
  const def = HERO_DEFS[heroId];
  if (!def) return player;

  player.heroId = heroId;
  player.activeSkill = { ...def.skill, timer: 0 };
  player.skillTimer = 0;
  if (!player.deployableUpgrades) player.deployableUpgrades = {};

  if (def.passive.maxHealthMul) {
    player.maxHealth = Math.floor(player.maxHealth * def.passive.maxHealthMul);
    player.health = player.maxHealth;
  }
  if (def.passive.speedMul) player.speed *= def.passive.speedMul;
  if (def.passive.armorAdd) player.armor += def.passive.armorAdd;
  if (def.passive.critAdd) player.critChance += def.passive.critAdd;
  if (def.passive.regenAdd) player.regen += def.passive.regenAdd;
  if (def.passive.cooldownReductionAdd)
    player.cooldownReduction += def.passive.cooldownReductionAdd;
  if (def.passive.areaMul) player.areaMultiplier *= def.passive.areaMul;

  return player;
}

export function useHeroSkill(player: Player, state: GameState): void {
  if (!player.heroId || !player.activeSkill) return;
  if (player.skillTimer > 0) return;

  const def = HERO_DEFS[player.heroId];
  const skill = player.activeSkill;
  player.skillTimer = skill.cooldown;
  skill.timer = skill.duration;

  const aim = normalize({ x: Math.cos(player.facing), y: Math.sin(player.facing) });
  const deployX = player.x + aim.x * 40;
  const deployY = player.y + aim.y * 40;

  const ds = state.defenseState;
  if (!ds) return;

  const durationMul = getDeployableMultiplier(player, "duration");
  const rangeMul = getDeployableMultiplier(player, "range");
  const healthMul = getDeployableMultiplier(player, "health");
  const deployDuration = skill.duration * durationMul;

  switch (player.heroId) {
    case "scout": {
      ds.deployables.push({
        id: uid("deploy"),
        x: deployX,
        y: deployY,
        radius: 90 * rangeMul,
        type: "beacon",
        ownerId: player.id,
        health: 1,
        maxHealth: 1,
        timer: deployDuration,
        maxTimer: deployDuration,
        color: def.color,
      });
      break;
    }
    case "assault": {
      const shieldHealth = Math.round(400 * healthMul);
      ds.deployables.push({
        id: uid("deploy"),
        x: deployX,
        y: deployY,
        radius: 70 * rangeMul,
        type: "shield",
        ownerId: player.id,
        health: shieldHealth,
        maxHealth: shieldHealth,
        timer: deployDuration,
        maxTimer: deployDuration,
        color: def.color,
      });
      break;
    }
    case "medic": {
      ds.deployables.push({
        id: uid("deploy"),
        x: deployX,
        y: deployY,
        radius: 100 * rangeMul,
        type: "healAura",
        ownerId: player.id,
        health: 1,
        maxHealth: 1,
        timer: deployDuration,
        maxTimer: deployDuration,
        color: def.color,
      });
      break;
    }
    case "engineer": {
      const turretHealth = Math.round(350 * healthMul);
      ds.deployables.push({
        id: uid("deploy"),
        x: deployX,
        y: deployY,
        radius: 28,
        type: "turret",
        ownerId: player.id,
        health: turretHealth,
        maxHealth: turretHealth,
        timer: deployDuration,
        maxTimer: deployDuration,
        fireTimer: 0,
        fireCooldown: 0.45,
        color: def.color,
      });
      break;
    }
    case "vanguard": {
      const mineCount = 1 + Math.min(3, Math.max(0, player.deployableUpgrades?.["mineCount"] ?? 0));
      for (let i = 0; i < mineCount; i++) {
        const offsetAngle = player.facing + (i - (mineCount - 1) / 2) * 0.35;
        const offsetX = Math.cos(offsetAngle) * (i === 0 ? 0 : 28);
        const offsetY = Math.sin(offsetAngle) * (i === 0 ? 0 : 28);
        ds.deployables.push({
          id: uid("deploy"),
          x: deployX + offsetX,
          y: deployY + offsetY,
          radius: 35 * rangeMul,
          type: "mine",
          ownerId: player.id,
          health: 1,
          maxHealth: 1,
          timer: deployDuration,
          maxTimer: deployDuration,
          color: def.color,
        });
      }
      break;
    }
  }
}

export function updateHeroSkillsAndDeployables(state: GameState, dt: number): void {
  const ds = state.defenseState;
  if (!ds) return;

  const players = [state.player, ...state.players];
  for (const player of players) {
    if (player.skillTimer > 0) player.skillTimer -= dt;
    if (player.activeSkill && player.activeSkill.timer > 0) {
      player.activeSkill.timer -= dt;
    }
  }

  for (let i = ds.deployables.length - 1; i >= 0; i--) {
    const d = ds.deployables[i];
    d.timer -= dt;

    if (d.health <= 0 || d.timer <= 0) {
      ds.deployables.splice(i, 1);
      continue;
    }

    const owner = players.find((p) => p.id === d.ownerId) ?? state.player;

    if (d.type === "healAura") {
      const healMul = getDeployableMultiplier(owner, "damage");
      for (const player of players) {
        if (distance(player, d) <= d.radius + player.radius) {
          player.health = Math.min(player.maxHealth, player.health + 22 * dt * healMul);
        }
      }
    }

    if (d.type === "turret") {
      const fireRateMul = getDeployableMultiplier(owner, "cooldown");
      const rangeMul = getDeployableMultiplier(owner, "range");
      const effectiveRange = 420 * rangeMul;
      d.fireTimer = (d.fireTimer ?? 0) - dt;
      if (d.fireTimer <= 0) {
        const target = findNearestEnemy(state, d.x, d.y, effectiveRange);
        if (target) {
          fireTurretProjectile(state, d, target, owner);
          d.fireTimer = (d.fireCooldown ?? 0.45) * fireRateMul;
        }
      }
    }

    if (d.type === "shield") {
      // Shield absorbs enemy projectiles in handleEnemyProjectilePlayerCollisions equivalent
      // handled in engine via dedicated collision check
    }
  }
}

function findNearestEnemy(state: GameState, x: number, y: number, range: number): Enemy | null {
  let best: Enemy | null = null;
  let bestDist = range;
  for (const enemy of state.enemies) {
    const dist = distance({ x, y }, enemy);
    if (dist < bestDist) {
      bestDist = dist;
      best = enemy;
    }
  }
  return best;
}

function fireTurretProjectile(state: GameState, d: Deployable, target: Enemy, owner: Player): void {
  const angle = angleBetween(d, target);
  const speed = 760;
  const damageMul = getDeployableMultiplier(owner, "damage");
  state.projectiles.push({
    id: uid("proj"),
    x: d.x + Math.cos(angle) * 24,
    y: d.y + Math.sin(angle) * 24,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 4,
    damage: Math.round(28 * damageMul),
    speed,
    color: d.color,
    pierce: 0,
    weaponId: "turret",
    life: 480 / speed,
  });
}

export function handleDeployableShieldCollisions(state: GameState): void {
  const ds = state.defenseState;
  if (!ds) return;

  const shields = ds.deployables.filter((d) => d.type === "shield");
  if (shields.length === 0) return;

  for (let i = state.enemyProjectiles.length - 1; i >= 0; i--) {
    const p = state.enemyProjectiles[i];
    for (const shield of shields) {
      if (distance(p, shield) <= shield.radius) {
        shield.health -= p.damage * 0.5;
        state.enemyProjectiles.splice(i, 1);
        break;
      }
    }
  }
}

export function handleMineProximity(state: GameState): void {
  const ds = state.defenseState;
  if (!ds) return;

  const players = [state.player, ...state.players];

  for (let i = ds.deployables.length - 1; i >= 0; i--) {
    const d = ds.deployables[i];
    if (d.type !== "mine") continue;
    const owner = players.find((p) => p.id === d.ownerId) ?? state.player;
    const damageMul = getDeployableMultiplier(owner, "damage");
    const rangeMul = getDeployableMultiplier(owner, "range");
    for (const enemy of state.enemies) {
      if (distance(enemy, d) <= d.radius + enemy.radius) {
        // Explosion
        for (const other of state.enemies) {
          if (distance(other, d) <= 100 * rangeMul + other.radius) {
            other.health -= 120 * damageMul;
          }
        }
        ds.deployables.splice(i, 1);
        break;
      }
    }
  }
}

export function applyHeroTalent(player: Player, talentId: string): Player {
  if (!player.heroId || !player.activeSkill) return player;

  const def = HERO_DEFS[player.heroId];
  const talent = def.talents.find((t) => t.id === talentId);

  if (talent) {
    const m = talent.modifiers;
    if (m.damageMul) {
      for (const weapon of player.weapons) {
        weapon.damage = Math.round(weapon.damage * m.damageMul);
      }
    }
    if (m.cooldownMul) {
      for (const weapon of player.weapons) {
        weapon.cooldown *= m.cooldownMul;
      }
      player.activeSkill.cooldown = Math.max(1, player.activeSkill.cooldown * m.cooldownMul);
    }
    if (m.rangeMul) {
      for (const weapon of player.weapons) {
        weapon.range *= m.rangeMul;
      }
    }
    if (m.areaMul) player.areaMultiplier *= m.areaMul;
    if (m.critAdd) player.critChance += m.critAdd;
    if (m.armorAdd) player.armor += m.armorAdd;
    if (m.regenAdd) player.regen += m.regenAdd;
    if (m.speedMul) player.speed *= m.speedMul;
    if (m.healthMul) {
      player.maxHealth = Math.floor(player.maxHealth * m.healthMul);
      player.health = player.maxHealth;
    }
    if (m.skillDurationMul) player.activeSkill.duration *= 1 + m.skillDurationMul;

    if (m.deployableDamageMul) {
      player.deployableUpgrades["damage"] =
        (player.deployableUpgrades["damage"] ?? 0) + Math.round((m.deployableDamageMul - 1) * 100);
    }
    if (m.deployableHealthMul) {
      player.deployableUpgrades["health"] =
        (player.deployableUpgrades["health"] ?? 0) + Math.round((m.deployableHealthMul - 1) * 100);
    }
    if (m.deployableRangeMul) {
      player.deployableUpgrades["range"] =
        (player.deployableUpgrades["range"] ?? 0) + Math.round((m.deployableRangeMul - 1) * 100);
    }
    if (m.deployableCooldownMul) {
      player.deployableUpgrades["cooldown"] =
        (player.deployableUpgrades["cooldown"] ?? 0) +
        Math.round((1 - m.deployableCooldownMul) * 100);
    }
    if (m.deployableDurationMul) {
      player.deployableUpgrades["duration"] =
        (player.deployableUpgrades["duration"] ?? 0) +
        Math.round((m.deployableDurationMul - 1) * 100);
    }

    return player;
  }

  // Legacy fallback for older talent identifiers
  switch (talentId) {
    case "skillCooldown":
      player.activeSkill.cooldown = Math.max(1, player.activeSkill.cooldown - 1);
      break;
    case "skillDuration":
      player.activeSkill.duration += 2;
      break;
    case "passiveHealth":
      player.maxHealth = Math.floor(player.maxHealth * 1.1);
      player.health = player.maxHealth;
      break;
    case "passiveSpeed":
      player.speed *= 1.05;
      break;
    default:
      player.activeSkill.duration += 1;
      player.activeSkill.cooldown = Math.max(1, player.activeSkill.cooldown - 0.5);
  }

  return player;
}

export function getHeroTalents(heroId: HeroId): HeroTalent[] {
  return HERO_DEFS[heroId]?.talents ?? [];
}

export function getHeroName(heroId: HeroId | null): string {
  if (!heroId) return "默认";
  return HERO_DEFS[heroId]?.name ?? "默认";
}

export function getHeroColor(heroId: HeroId | null): string {
  if (!heroId) return "#94a3b8";
  return HERO_DEFS[heroId]?.color ?? "#94a3b8";
}

export function createNullHeroState(player: Player): void {
  player.heroId = null;
  player.activeSkill = null;
  player.skillTimer = 0;
}
