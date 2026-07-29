import type { HeroId, HeroSkill, Player, GameState, Deployable, Enemy, HeroTalent } from "./types";
import { uid, distance, angleBetween, normalize, clamp } from "./math";
import type { FXSystem } from "./fx";
import { audio } from "./audio";

export interface HeroDef {
  id: HeroId;
  name: string;
  role: string;
  tagline: string;
  description: string;
  color: string;
  skill: HeroSkill;
  ultimate: HeroSkill;
  passive: {
    maxHealthMul?: number;
    speedMul?: number;
    armorAdd?: number;
    critAdd?: number;
    regenAdd?: number;
    cooldownReductionAdd?: number;
    areaMul?: number;
    rangeMul?: number;
  };
  talents: HeroTalent[];
}

const BASE_SKILL_RANGE = 220;

export const HERO_DEFS: Record<HeroId, HeroDef> = {
  nitrogen: {
    id: "nitrogen",
    name: "液氮",
    role: "工程 / 控制",
    tagline: "低温封锁",
    description: "使用低温装置控场的工程专家，投掷冰冻手雷封锁通道，绝对零度可将敌群彻底冻结。",
    color: "#38bdf8",
    skill: {
      id: "nitrogen_grenade",
      name: "冰冻手雷",
      description:
        "投掷后形成半径 135 的低温区域，持续 6 秒；区域内敌人每 0.35 秒叠加 1 层霜冻，满 4 层冻结 2 秒并碎裂造成 220 伤害。落地瞬间对中心敌人造成 55 伤害与强烈减速",
      cooldown: 9,
      timer: 0,
      range: BASE_SKILL_RANGE,
      duration: 6,
      color: "#38bdf8",
    },
    ultimate: {
      id: "nitrogen_zero",
      name: "绝对零度",
      description:
        "以自身为中心释放半径 280 的冰冻爆发，立即造成 480 伤害并冻结 3.5 秒；冻结结束时碎裂造成 300 伤害，幸存者附加 3 层霜冻",
      cooldown: 38,
      timer: 0,
      range: 280,
      duration: 3.5,
      color: "#0ea5e9",
    },
    passive: { armorAdd: 0.06, areaMul: 1.12 },
    talents: [
      {
        id: "nitrogen_conduction",
        name: "低温传导",
        description: "武器伤害 +5%",
        maxLevel: 5,
        category: "damage",
        modifiers: { damageMul: 1.05 },
      },
      {
        id: "nitrogen_cryo_shells",
        name: "急冻弹壳",
        description: "暴击率 +3%",
        maxLevel: 5,
        category: "damage",
        modifiers: { critAdd: 0.03 },
      },
      {
        id: "nitrogen_supercooled",
        name: "超冷溶液",
        description: "冰冻手雷作用半径 +15%，霜冻叠层上限 +2，碎裂伤害 +50",
        maxLevel: 1,
        category: "skill",
        variantFor: "skill",
        isSkillVariant: true,
        modifiers: { areaMul: 1.15 },
      },
      {
        id: "nitrogen_thermal_sink",
        name: "散热核心",
        description: "护甲 +3%",
        maxLevel: 5,
        category: "utility",
        modifiers: { armorAdd: 0.03 },
      },
    ],
  },
  twilight: {
    id: "twilight",
    name: "暮蝶",
    role: "医疗 / 支援",
    tagline: "战地复苏",
    description: "以共生能量维系小队生命的支援单位，治疗脉冲稳定战线，蛹化复苏能扭转绝境。",
    color: "#a78bfa",
    skill: {
      id: "twilight_pulse",
      name: "治疗脉冲",
      description: "在目标位置生成半径 125 的治疗场，每秒恢复 36 点生命，持续 7 秒",
      cooldown: 13,
      timer: 0,
      range: BASE_SKILL_RANGE,
      duration: 7,
      color: "#a78bfa",
    },
    ultimate: {
      id: "twilight_cocoon",
      name: "蛹化复苏",
      description: "瞬间为自身及附近友方恢复 150 点生命并清除燃烧/腐蚀减益，随后 4.5 秒内额外恢复 38 点生命/秒",
      cooldown: 45,
      timer: 0,
      range: 280,
      duration: 4.5,
      color: "#8b5cf6",
    },
    passive: { regenAdd: 2, cooldownReductionAdd: 0.06 },
    talents: [
      {
        id: "twilight_harmony",
        name: "谐振增幅",
        description: "武器伤害 +4%",
        maxLevel: 5,
        category: "damage",
        modifiers: { damageMul: 1.04 },
      },
      {
        id: "twilight_life_thread",
        name: "生命丝线",
        description: "生命恢复 +0.4/秒",
        maxLevel: 5,
        category: "damage",
        modifiers: { regenAdd: 0.4 },
      },
      {
        id: "twilight_surge",
        name: "脉冲涌动",
        description: "治疗脉冲每秒治疗量提升至 42，作用半径 +15%",
        maxLevel: 1,
        category: "skill",
        variantFor: "skill",
        isSkillVariant: true,
        modifiers: { deployableDamageMul: 1.4 },
      },
      {
        id: "twilight_biomass",
        name: "生物质护甲",
        description: "最大生命值 +6%",
        maxLevel: 5,
        category: "utility",
        modifiers: { healthMul: 1.06 },
      },
    ],
  },
  leopard: {
    id: "leopard",
    name: "豹",
    role: "突击 / 刺客",
    tagline: "掠袭猎杀",
    description: "高机动近战猎手，猛扑撕裂敌阵，猎杀本能让他化为无法阻挡的死亡旋风。",
    color: "#fb923c",
    skill: {
      id: "leopard_pounce",
      name: "猛扑",
      description: "向面朝方向冲刺 280 距离，路径上敌人受到 160 点伤害并被击退；命中后自身移速 +15% 持续 3 秒",
      cooldown: 8,
      timer: 0,
      range: 280,
      duration: 0,
      color: "#fb923c",
    },
    ultimate: {
      id: "leopard_instinct",
      name: "猎杀本能",
      description: "10 秒内移动速度 +40%、暴击率 +30%，击杀会刷新猛扑冷却",
      cooldown: 35,
      timer: 0,
      range: 0,
      duration: 10,
      color: "#f97316",
    },
    passive: { speedMul: 1.12, critAdd: 0.06 },
    talents: [
      {
        id: "leopard_shredder",
        name: "撕裂利爪",
        description: "武器伤害 +5%",
        maxLevel: 5,
        category: "damage",
        modifiers: { damageMul: 1.05 },
      },
      {
        id: "leopard_blade_mastery",
        name: "利刃精通",
        description: "近战武器伤害 +12%，攻击范围 +8%",
        maxLevel: 5,
        category: "damage",
        modifiers: { meleeDamageMul: 1.12, meleeRangeMul: 1.08 },
      },
      {
        id: "leopard_feral_pounce",
        name: "凶性猛扑",
        description: "猛扑距离 +20%，伤害 +20%，命中后自身移速 +15% 持续 2.5 秒",
        maxLevel: 1,
        category: "skill",
        variantFor: "skill",
        isSkillVariant: true,
        modifiers: { rangeMul: 1.2, damageMul: 1.2 },
      },
      {
        id: "leopard_reflexes",
        name: "反射神经",
        description: "移动速度 +3%",
        maxLevel: 5,
        category: "utility",
        modifiers: { speedMul: 1.03 },
      },
    ],
  },
  recon: {
    id: "recon",
    name: "侦查",
    role: "侦察 / 精准",
    tagline: "远程标定",
    description: "视野与精准打击专家，侦察无人机放大全队输出，集束打击可瞬间清除高密度目标。",
    color: "#34d399",
    skill: {
      id: "recon_drone",
      name: "侦察无人机",
      description: "部署无人机，半径 150 范围内敌人受到伤害 +25%，持续 8 秒",
      cooldown: 12,
      timer: 0,
      range: BASE_SKILL_RANGE,
      duration: 8,
      color: "#34d399",
    },
    ultimate: {
      id: "recon_strike",
      name: "集束打击",
      description: "召唤轨道打击，对面朝方向 160 距离处半径 190 区域造成 500 点伤害；幸存者被标记 5 秒，受到伤害 +20%",
      cooldown: 48,
      timer: 0,
      range: 190,
      duration: 0,
      color: "#10b981",
    },
    passive: { critAdd: 0.12, rangeMul: 1.1 },
    talents: [
      {
        id: "recon_ballistics",
        name: "弹道学",
        description: "武器伤害 +4%",
        maxLevel: 5,
        category: "damage",
        modifiers: { damageMul: 1.04 },
      },
      {
        id: "recon_precision",
        name: "精确校准",
        description: "武器射程 +5%",
        maxLevel: 5,
        category: "damage",
        modifiers: { rangeMul: 1.05 },
      },
      {
        id: "recon_overclock_drone",
        name: "超频无人机",
        description: "侦察无人机增伤效果提升至 28%，持续时间 +2 秒",
        maxLevel: 1,
        category: "skill",
        variantFor: "skill",
        isSkillVariant: true,
        modifiers: { deployableDurationMul: 1.29 },
      },
      {
        id: "recon_evasion",
        name: "规避协议",
        description: "护甲 +2%",
        maxLevel: 5,
        category: "utility",
        modifiers: { armorAdd: 0.02 },
      },
    ],
  },
  viper: {
    id: "viper",
    name: "蝰蛇",
    role: "突击 / 毒蚀",
    tagline: "神经毒素",
    description: "擅长用神经毒剂瓦解敌群的突击专家，毒液喷射持续侵蚀目标，蛇巢能封锁大片区域。",
    color: "#84cc16",
    skill: {
      id: "viper_spit",
      name: "毒液喷射",
      description:
        "扇形喷射神经毒素，射程 340；命中敌人受到 40 伤害并叠加 1 层毒素（最多 5 层）。毒素敌人每秒受到 12/层伤害，满层引爆造成 300 伤害并向附近 4 个目标传染 1 层",
      cooldown: 8,
      timer: 0,
      range: 340,
      duration: 5,
      color: "#84cc16",
    },
    ultimate: {
      id: "viper_nest",
      name: "蝰蛇巢穴",
      description:
        "生成半径 240 的毒雾区域，持续 9 秒；每秒造成 85 伤害并叠加 1 层脆弱，每层使受到伤害 +10%（最多 5 层）。区域内敌人减速 35%。中毒敌人死亡时尸体爆裂，对附近敌人造成 130 伤害并传染 1 层毒素",
      cooldown: 40,
      timer: 0,
      range: 260,
      duration: 9,
      color: "#65a30d",
    },
    passive: { critAdd: 0.06, speedMul: 1.05 },
    talents: [
      {
        id: "viper_venom_glands",
        name: "毒腺强化",
        description: "武器伤害 +4%",
        maxLevel: 5,
        category: "damage",
        modifiers: { damageMul: 1.04 },
      },
      {
        id: "viper_corrosive_touch",
        name: "腐蚀之触",
        description: "毒液喷射最多叠加层数 +1，满层引爆伤害 +60 并向附近 4 个目标传染",
        maxLevel: 1,
        category: "skill",
        variantFor: "skill",
        isSkillVariant: true,
        modifiers: { skillDurationMul: 1 },
      },
      {
        id: "viper_swift_slither",
        name: "迅捷游走",
        description: "移动速度 +3%",
        maxLevel: 5,
        category: "utility",
        modifiers: { speedMul: 1.03 },
      },
      {
        id: "viper_toxic_blade",
        name: "毒刃",
        description: "近战武器伤害 +10%，近战命中附加 2 秒毒素（每秒 15 伤害）",
        maxLevel: 5,
        category: "damage",
        modifiers: { meleeDamageMul: 1.1 },
      },
    ],
  },
  falcon: {
    id: "falcon",
    name: "猎鹰",
    role: "侦察 / 机动",
    tagline: "高空压制",
    description: "高机动侦察兵，跃迁推进器可快速 reposition，轨道激光能对集结敌人造成毁灭打击。",
    color: "#f59e0b",
    skill: {
      id: "falcon_dash",
      name: "跃迁推进",
      description: "朝移动方向快速冲刺 200 距离，终点电磁脉冲眩晕附近敌人 1.2 秒并造成 120 伤害",
      cooldown: 7.5,
      timer: 0,
      range: 200,
      duration: 1.2,
      color: "#f59e0b",
    },
    ultimate: {
      id: "falcon_orbital_laser",
      name: "轨道激光",
      description: "呼叫轨道激光扫射前方 260 距离、宽 60 的区域，持续 3.5 秒，每秒造成 260 点伤害",
      cooldown: 45,
      timer: 0,
      range: 300,
      duration: 3.5,
      color: "#ea580c",
    },
    passive: { speedMul: 1.08, critAdd: 0.06 },
    talents: [
      {
        id: "falcon_afterburners",
        name: "加力燃烧",
        description: "移动速度 +3%",
        maxLevel: 5,
        category: "utility",
        modifiers: { speedMul: 1.03 },
      },
      {
        id: "falcon_targeting",
        name: "目标锁定",
        description: "武器射程 +5%",
        maxLevel: 5,
        category: "damage",
        modifiers: { rangeMul: 1.05 },
      },
      {
        id: "falcon_overload",
        name: "超载推进",
        description: "跃迁推进冷却 -2 秒，电磁脉冲范围 +25%",
        maxLevel: 1,
        category: "skill",
        variantFor: "skill",
        isSkillVariant: true,
        modifiers: { cooldownMul: 0.75, areaMul: 1.25 },
      },
      {
        id: "falcon_high_altitude",
        name: "高空优势",
        description: "武器伤害 +4%",
        maxLevel: 5,
        category: "damage",
        modifiers: { damageMul: 1.04 },
      },
    ],
  },
  bastion: {
    id: "bastion",
    name: "堡垒",
    role: "工程 / 建造",
    tagline: "钢铁防线",
    description: "前线工程专家，可部署高强度水泥墙封锁通道，终极技能释放多枚自索敌巡飞弹清场。",
    color: "#b45309",
    skill: {
      id: "bastion_wall",
      name: "水泥墙",
      description: "在面前放置一堵 2200 生命值的水泥墙，阻挡敌人前进并吸收伤害，持续 14 秒；墙存在期间附近友方护甲 +10%",
      cooldown: 12,
      timer: 0,
      range: BASE_SKILL_RANGE,
      duration: 14,
      color: "#b45309",
    },
    ultimate: {
      id: "bastion_swarm",
      name: "巡飞弹集群",
      description: "释放 10 枚大范围自索敌巡飞弹，每枚对命中敌人造成 300 点爆炸伤害",
      cooldown: 48,
      timer: 0,
      range: 380,
      duration: 0,
      color: "#ea580c",
    },
    passive: { armorAdd: 0.1, maxHealthMul: 1.12 },
    talents: [
      {
        id: "bastion_overload",
        name: "过载装药",
        description: "巡飞弹数量 +2",
        maxLevel: 1,
        category: "skill",
        variantFor: "ultimate",
        isSkillVariant: true,
        modifiers: { countAdd: 2 },
      },
      {
        id: "bastion_payload",
        name: "高爆弹头",
        description: "巡飞弹伤害 +8%",
        maxLevel: 5,
        category: "damage",
        modifiers: { damageMul: 1.08 },
      },
      {
        id: "bastion_arsenal",
        name: "军火库",
        description: "武器伤害 +4%",
        maxLevel: 5,
        category: "damage",
        modifiers: { damageMul: 1.04 },
      },
      {
        id: "bastion_fortify",
        name: "阵地加固",
        description: "护甲 +3%",
        maxLevel: 5,
        category: "utility",
        modifiers: { armorAdd: 0.03 },
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

export const HERO_SYNERGIES: HeroSynergyBonus[] = [];

export function getActiveSynergies(_selectedHeroes: HeroId[]): HeroSynergyBonus[] {
  return [];
}

export function applyHeroSynergyBonus(player: Player, _selectedHeroes: HeroId[]): Player {
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
  player.ultimateSkill = { ...def.ultimate, timer: 0 };
  player.skillTimer = 0;
  player.ultimateTimer = 0;
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
    player.cooldownReduction = Math.min(0.75, player.cooldownReduction + def.passive.cooldownReductionAdd);
  if (def.passive.areaMul) player.areaMultiplier *= def.passive.areaMul;
  if (def.passive.rangeMul) {
    for (const weapon of player.weapons) {
      weapon.range *= def.passive.rangeMul;
    }
  }

  return player;
}

export function useHeroSkill(player: Player, state: GameState, fx?: FXSystem): void {
  if (!player.heroId || !player.activeSkill) return;
  if (player.skillTimer > 0) return;

  const def = HERO_DEFS[player.heroId];
  const skill = player.activeSkill;
  player.skillTimer = skill.cooldown;
  skill.timer = skill.duration;

  const aim = normalize({ x: Math.cos(player.facing), y: Math.sin(player.facing) });
  const ds = state.defenseState;

  const deployTarget = ds?.deployables ?? state.deployables;

  const durationMul = getDeployableMultiplier(player, "duration");
  const rangeMul = getDeployableMultiplier(player, "range");
  const deployDuration = skill.duration * durationMul;

  switch (player.heroId) {
    case "nitrogen": {
      const fxX = player.x + aim.x * 60;
      const fxY = player.y + aim.y * 60;
      deployTarget.push({
        id: uid("deploy"),
        x: fxX,
        y: fxY,
        radius: 135 * rangeMul,
        type: "freezeField",
        ownerId: player.id,
        health: 1,
        maxHealth: 1,
        timer: deployDuration,
        maxTimer: deployDuration,
        tickTimer: 0.35,
        tickInterval: 0.35,
        color: def.color,
      });
      for (const enemy of state.enemies) {
        if (distance(enemy, { x: fxX, y: fxY }) <= 45 + enemy.radius) {
          enemy.health -= 55;
          state.stats.damageDealt += 55;
          enemy.slow = Math.max(enemy.slow, 0.55);
          enemy.slowTimer = Math.max(enemy.slowTimer, 2.5);
        }
      }
      audio?.play("nitrogenGrenade");
      fx?.addTrauma(0.08);
      fx?.triggerFlash({ duration: 0.22, color: def.color, opacity: 0.22 });
      spawnParticles(state, fxX, fxY, def.color, 14, 160, 0.45);
      break;
    }
    case "twilight": {
      const healX = player.x + aim.x * 40;
      const healY = player.y + aim.y * 40;
      deployTarget.push({
        id: uid("deploy"),
        x: healX,
        y: healY,
        radius: 125 * rangeMul,
        type: "healAura",
        ownerId: player.id,
        health: 1,
        maxHealth: 1,
        timer: deployDuration,
        maxTimer: deployDuration,
        color: def.color,
      });
      audio?.play("twilightPulse");
      fx?.addTrauma(0.04);
      fx?.triggerFlash({ duration: 0.2, color: def.color, opacity: 0.18 });
      spawnParticles(state, healX, healY, def.color, 10, 90, 0.55);
      break;
    }
    case "leopard": {
      const pounceRange = 280;
      const startX = player.x;
      const startY = player.y;
      const endX = player.x + aim.x * pounceRange;
      const endY = player.y + aim.y * pounceRange;
      let hitCount = 0;

      for (const enemy of state.enemies) {
        if (
          pointSegmentDistance(enemy.x, enemy.y, startX, startY, endX, endY) <=
          player.radius + enemy.radius + 28
        ) {
          enemy.health -= 160;
          const dx = enemy.x - player.x;
          const dy = enemy.y - player.y;
          const dist = Math.hypot(dx, dy) || 1;
          enemy.knockbackX += (dx / dist) * 260;
          enemy.knockbackY += (dy / dist) * 260;
          state.stats.damageDealt += 160;
          hitCount++;
        }
      }

      player.x = clamp(endX, player.radius, state.map.width - player.radius);
      player.y = clamp(endY, player.radius, state.map.height - player.radius);
      if (hitCount > 0) {
        if (player.leopardPounceSpeedTimer > 0) {
          player.speed /= 1.15;
        }
        player.leopardPounceSpeedTimer = 3;
        player.speed *= 1.15;
      }
      audio?.play("leopardPounce");
      fx?.addTrauma(0.12);
      fx?.addShake(1.2, 0);
      if (hitCount > 0) {
        fx?.triggerFlash({ duration: 0.18, color: def.color, opacity: 0.2 });
      }
      spawnParticles(state, player.x, player.y, def.color, 10, 180, 0.35);
      break;
    }
    case "recon": {
      const droneX = player.x + aim.x * 40;
      const droneY = player.y + aim.y * 40;
      deployTarget.push({
        id: uid("deploy"),
        x: droneX,
        y: droneY,
        radius: 150 * rangeMul,
        type: "drone",
        ownerId: player.id,
        health: 1,
        maxHealth: 1,
        timer: deployDuration,
        maxTimer: deployDuration,
        color: def.color,
      });
      audio?.play("reconDrone");
      fx?.addTrauma(0.05);
      fx?.triggerFlash({ duration: 0.18, color: def.color, opacity: 0.16 });
      spawnParticles(state, droneX, droneY, def.color, 8, 70, 0.45);
      break;
    }
    case "viper": {
      const range = 340 * rangeMul;
      const coneAngle = Math.cos(Math.PI / 6);
      const maxStacks = hasTalent(player, "viper_corrosive_touch") ? 6 : 5;
      const burstDamage = hasTalent(player, "viper_corrosive_touch") ? 300 : 240;
      const spreadCount = hasTalent(player, "viper_corrosive_touch") ? 4 : 3;
      let hitCount = 0;

      for (const enemy of state.enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > range + enemy.radius || dist < 1) continue;
        const dot = (dx / dist) * aim.x + (dy / dist) * aim.y;
        if (dot < coneAngle) continue;

        const wasFull = enemy.venomStacks >= maxStacks;
        enemy.health -= 40;
        state.stats.damageDealt += 40;
        enemy.venomStacks = Math.min(maxStacks, enemy.venomStacks + 1);
        enemy.venomTimer = 5;
        hitCount++;

        if (!wasFull && enemy.venomStacks >= maxStacks) {
          enemy.health -= burstDamage;
          state.stats.damageDealt += burstDamage;
          spawnVenomSpread(state, enemy, spreadCount);
          fx?.addTrauma(0.1);
          fx?.triggerFlash({ duration: 0.22, color: "#84cc16", opacity: 0.28 });
        }
      }
      audio?.play("viperSpit");
      if (hitCount === 0) {
        fx?.addTrauma(0.05);
      }
      if (hitCount > 0) {
        spawnParticles(state, player.x + aim.x * 80, player.y + aim.y * 80, def.color, 12, 120, 0.35);
      }
      break;
    }
    case "falcon": {
      const dashRange = 200;
      const endX = clamp(
        player.x + aim.x * dashRange,
        player.radius,
        state.map.width - player.radius
      );
      const endY = clamp(
        player.y + aim.y * dashRange,
        player.radius,
        state.map.height - player.radius
      );
      player.x = endX;
      player.y = endY;
      let hitCount = 0;
      for (const enemy of state.enemies) {
        if (distance(enemy, player) <= 110 * rangeMul + enemy.radius) {
          enemy.health -= 120;
          enemy.freezeTimer = Math.max(enemy.freezeTimer, 1.2);
          state.stats.damageDealt += 120;
          hitCount++;
        }
      }
      audio?.play("falconDash");
      fx?.addTrauma(0.07);
      if (hitCount > 0) {
        fx?.addShake(0.8, 0);
        fx?.triggerFlash({ duration: 0.15, color: def.color, opacity: 0.18 });
      }
      spawnParticles(state, player.x, player.y, def.color, 8, 150, 0.3);
      break;
    }
    case "bastion": {
      const healthMul = getDeployableMultiplier(player, "health");
      const wallHealth = Math.round(2200 * healthMul);
      const wallX = player.x + aim.x * 60;
      const wallY = player.y + aim.y * 60;
      deployTarget.push({
        id: uid("deploy"),
        x: wallX,
        y: wallY,
        radius: 56,
        type: "wall",
        ownerId: player.id,
        health: wallHealth,
        maxHealth: wallHealth,
        timer: deployDuration,
        maxTimer: deployDuration,
        color: def.color,
      });
      audio?.play("bastionWall");
      fx?.addTrauma(0.1);
      fx?.addShake(1.0, 0);
      fx?.triggerFlash({ duration: 0.18, color: def.color, opacity: 0.18 });
      spawnParticles(state, wallX, wallY, "#d4d4d8", 10, 80, 0.45);
      break;
    }
  }
}

export function useHeroUltimate(player: Player, state: GameState, fx?: FXSystem): void {
  if (!player.heroId || !player.ultimateSkill) return;
  if (player.ultimateTimer > 0) return;

  const def = HERO_DEFS[player.heroId];
  const ultimate = player.ultimateSkill;
  player.ultimateTimer = ultimate.cooldown;
  ultimate.timer = ultimate.duration;

  const aim = normalize({ x: Math.cos(player.facing), y: Math.sin(player.facing) });
  const ds = state.defenseState;
  const deployTarget = ds?.deployables ?? state.deployables;

  switch (player.heroId) {
    case "nitrogen": {
      const rangeMul = getDeployableMultiplier(player, "range");
      const burstRange = 260 * rangeMul;
      let hitCount = 0;
      for (const enemy of state.enemies) {
        if (distance(enemy, player) <= burstRange + enemy.radius) {
          enemy.health -= 480;
          enemy.freezeTimer = Math.max(enemy.freezeTimer, 3.5);
          enemy.freezeShatterDamage = 300;
          enemy.frostStacks = 3;
          enemy.frostTimer = 4;
          state.stats.damageDealt += 480;
          hitCount++;
        }
      }
      audio?.play("nitrogenZero");
      fx?.addTrauma(0.22);
      fx?.addShake(3.2, 0);
      fx?.triggerFlash({ duration: 0.4, color: def.color, opacity: 0.38 });
      spawnParticles(state, player.x, player.y, def.color, 24, 200, 0.55);
      break;
    }
    case "twilight": {
      const players = [state.player, ...state.players];
      for (const target of players) {
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        if (dx * dx + dy * dy <= ultimate.range * ultimate.range) {
          target.health = Math.min(target.maxHealth, target.health + 150);
          target.burnDuration = 0;
          target.twilightCocoonTimer = 4;
        }
      }
      audio?.play("twilightCocoon");
      fx?.addTrauma(0.1);
      fx?.triggerFlash({ duration: 0.35, color: def.color, opacity: 0.24 });
      spawnParticles(state, player.x, player.y, def.color, 16, 110, 0.6);
      break;
    }
    case "leopard": {
      if (!player.leopardFrenzyActive) {
        player.leopardFrenzyActive = true;
        player.critChance += 0.30;
        player.speed *= 1.40;
      }
      player.leopardFrenzyTimer = 10;
      audio?.play("leopardInstinct");
      fx?.addTrauma(0.16);
      fx?.addShake(1.4, 0);
      fx?.triggerFlash({ duration: 0.3, color: def.color, opacity: 0.24 });
      spawnParticles(state, player.x, player.y, def.color, 18, 170, 0.55);
      break;
    }
    case "recon": {
      const centerX = player.x + aim.x * 140;
      const centerY = player.y + aim.y * 140;
      let hitCount = 0;
      for (const enemy of state.enemies) {
        if (distance(enemy, { x: centerX, y: centerY }) <= ultimate.range + enemy.radius) {
          enemy.health -= 500;
          state.stats.damageDealt += 500;
          enemy.droneMarkTimer = Math.max(enemy.droneMarkTimer, 4);
          hitCount++;
        }
      }
      audio?.play("reconStrike");
      fx?.addTrauma(0.18);
      fx?.addShake(2.0, 0);
      fx?.triggerFlash({ duration: 0.3, color: def.color, opacity: 0.26 });
      spawnParticles(state, centerX, centerY, def.color, 20, 190, 0.5);
      break;
    }
    case "viper": {
      const rangeMul = getDeployableMultiplier(player, "range");
      const deployDuration = ultimate.duration * getDeployableMultiplier(player, "duration");
      deployTarget.push({
        id: uid("deploy"),
        x: player.x + aim.x * 60,
        y: player.y + aim.y * 60,
        radius: 220 * rangeMul,
        type: "poisonField",
        ownerId: player.id,
        health: 1,
        maxHealth: 1,
        timer: deployDuration,
        maxTimer: deployDuration,
        tickTimer: 1,
        tickInterval: 1,
        color: def.color,
      });
      audio?.play("viperNest");
      fx?.addTrauma(0.16);
      fx?.addShake(1.2, 0);
      fx?.triggerFlash({ duration: 0.28, color: "#65a30d", opacity: 0.28 });
      spawnParticles(state, player.x + aim.x * 60, player.y + aim.y * 60, def.color, 16, 120, 0.55);
      break;
    }
    case "falcon": {
      const rangeMul = getDeployableMultiplier(player, "range");
      const durationMul = getDeployableMultiplier(player, "duration");
      const deployDuration = ultimate.duration * durationMul;
      deployTarget.push({
        id: uid("deploy"),
        x: player.x + aim.x * 120,
        y: player.y + aim.y * 120,
        radius: 240 * rangeMul,
        type: "laserBeam",
        ownerId: player.id,
        health: 1,
        maxHealth: 1,
        timer: deployDuration,
        maxTimer: deployDuration,
        tickTimer: 0.2,
        tickInterval: 0.2,
        color: def.color,
      });
      audio?.play("falconOrbitalLaser");
      fx?.addTrauma(0.18);
      fx?.addShake(2.2, 0);
      fx?.triggerFlash({ duration: 0.32, color: def.color, opacity: 0.26 });
      spawnParticles(state, player.x + aim.x * 120, player.y + aim.y * 120, def.color, 22, 210, 0.6);
      break;
    }
    case "bastion": {
      const count = hasTalent(player, "bastion_overload") ? 12 : 10;
      const damageMul = getDeployableMultiplier(player, "damage");
      const speed = 420;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        state.projectiles.push({
          id: uid("proj"),
          x: player.x + Math.cos(angle) * 30,
          y: player.y + Math.sin(angle) * 30,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 10,
          damage: Math.round(300 * damageMul),
          speed,
          color: def.color,
          pierce: 0,
          weaponId: "bastion_swarm",
          life: 3.5,
          homing: true,
          isExplosive: true,
          areaRadius: 60,
        });
      }
      audio?.play("bastionSwarm");
      fx?.addTrauma(0.2);
      fx?.addShake(2.0, 0);
      fx?.triggerFlash({ duration: 0.32, color: def.color, opacity: 0.3 });
      spawnParticles(state, player.x, player.y, def.color, 16, 160, 0.5);
      break;
    }
  }
}

export function updateHeroSkillsAndDeployables(state: GameState, dt: number, fx?: FXSystem): void {
  const ds = state.defenseState;

  const players = [state.player, ...state.players];
  for (const player of players) {
    if (player.skillTimer > 0) player.skillTimer -= dt;
    if (player.ultimateTimer > 0) player.ultimateTimer -= dt;
    if (player.activeSkill && player.activeSkill.timer > 0) {
      player.activeSkill.timer -= dt;
    }
    if (player.ultimateSkill && player.ultimateSkill.timer > 0) {
      player.ultimateSkill.timer -= dt;
    }
    if (player.leopardFrenzyTimer > 0) {
      player.leopardFrenzyTimer -= dt;
      if (player.leopardFrenzyTimer <= 0 && player.leopardFrenzyActive) {
        player.leopardFrenzyActive = false;
        player.critChance -= 0.30;
        player.speed /= 1.40;
      }
    }
    if (player.leopardPounceSpeedTimer > 0) {
      player.leopardPounceSpeedTimer -= dt;
      if (player.leopardPounceSpeedTimer <= 0) {
        player.speed /= 1.15;
      }
    }
    if (player.leopardBloodlustTimer > 0) {
      player.leopardBloodlustTimer -= dt;
      if (player.leopardBloodlustTimer <= 0) {
        player.leopardBloodlustStacks = 0;
      }
    }
    if (player.twilightCocoonTimer > 0) {
      player.twilightCocoonTimer -= dt;
      player.health = Math.min(player.maxHealth, player.health + 32 * dt);
    }
  }

  if (ds) {
    updateDeployableList(state, ds.deployables, players, dt, fx);
  }
  updateDeployableList(state, state.deployables, players, dt, fx);
}

function updateDeployableList(
  state: GameState,
  deployables: Deployable[],
  players: Player[],
  dt: number,
  fx?: FXSystem
): void {
  for (let i = deployables.length - 1; i >= 0; i--) {
    const d = deployables[i];
    d.timer -= dt;
    if (d.timer <= 0 || d.health <= 0) {
      deployables.splice(i, 1);
      continue;
    }

    switch (d.type) {
      case "healAura": {
        for (const player of players) {
          if (distance(player, d) <= d.radius + player.radius) {
            player.health = Math.min(player.maxHealth, player.health + 36 * dt);
          }
        }
        break;
      }
      case "freezeField": {
        d.tickTimer = (d.tickTimer ?? d.tickInterval ?? 0.35) - dt;
        if (d.tickTimer <= 0) {
          d.tickTimer = d.tickInterval ?? 0.35;
          for (const enemy of state.enemies) {
            if (distance(enemy, d) <= d.radius + enemy.radius) {
              enemy.slow = Math.max(enemy.slow, 0.5);
              enemy.slowTimer = Math.max(enemy.slowTimer, 0.5);
              enemy.frostStacks = Math.min(4, enemy.frostStacks + 1);
              enemy.frostTimer = 5;
              if (enemy.frostStacks >= 4) {
                spawnFrostBurst(state, enemy, 220, fx);
              }
            }
          }
        }
        break;
      }
      case "poisonField": {
        d.tickTimer = (d.tickTimer ?? d.tickInterval ?? 1) - dt;
        if (d.tickTimer <= 0) {
          d.tickTimer = d.tickInterval ?? 1;
          for (const enemy of state.enemies) {
            if (distance(enemy, d) <= d.radius + enemy.radius) {
              enemy.health -= 85;
              state.stats.damageDealt += 85;
              enemy.slow = Math.max(enemy.slow, 0.35);
              enemy.slowTimer = Math.max(enemy.slowTimer, 1.1);
              enemy.vulnerabilityStacks = Math.min(5, enemy.vulnerabilityStacks + 1);
            }
          }
        }
        break;
      }
      case "drone": {
        for (const enemy of state.enemies) {
          if (distance(enemy, d) <= d.radius + enemy.radius) {
            enemy.droneMarkTimer = Math.max(enemy.droneMarkTimer, 0.25);
          }
        }
        // Recon 侦察无人机：发射追踪弹体
        const droneOwner = players.find((p) => p.id === d.ownerId);
        if (droneOwner && droneOwner.heroId === "recon") {
          d.fireTimer = (d.fireTimer ?? 0) - dt;
          if (d.fireTimer <= 0) {
            const target = findNearestEnemy(state, d.x, d.y, d.radius);
            if (target) {
              fireReconDroneProjectile(state, d, target, droneOwner);
              d.fireTimer = d.fireCooldown ?? 0.55;
            }
          }
        }
        break;
      }
      case "laserBeam": {
        d.tickTimer = (d.tickTimer ?? d.tickInterval ?? 0.2) - dt;
        if (d.tickTimer <= 0) {
          d.tickTimer = d.tickInterval ?? 0.2;
          const tickDamage = 260 * (d.tickInterval ?? 0.2);
          for (const enemy of state.enemies) {
            if (distance(enemy, d) <= d.radius + enemy.radius) {
              enemy.health -= tickDamage;
              state.stats.damageDealt += tickDamage;
            }
          }
        }
        break;
      }
      case "turret": {
        const owner = players.find((p) => p.id === d.ownerId) ?? players[0];
        if (owner) {
          d.fireTimer = (d.fireTimer ?? 0) - dt;
          if (d.fireTimer <= 0) {
            const target = findNearestEnemy(state, d.x, d.y, d.radius);
            if (target) {
              fireTurretProjectile(state, d, target, owner);
              d.fireTimer = d.fireCooldown ?? 0.6;
            }
          }
          // 导弹天赋：每5秒发射一枚追踪导弹
          if (hasTalent(owner, "engineer_offense_2")) {
            d.missileTimer = (d.missileTimer ?? 5) - dt;
            if (d.missileTimer <= 0) {
              const missileTarget = findNearestEnemy(state, d.x, d.y, 480);
              if (missileTarget) {
                fireTurretMissile(state, d, missileTarget, owner);
                d.missileTimer = 5;
              }
            }
          }
        }
        break;
      }
      case "shield": {
        break;
      }
      case "mine": {
        break;
      }
      case "beacon": {
        break;
      }
      case "wall": {
        break;
      }
    }
  }
}

function hasTalent(player: Player, talentId: string): boolean {
  return (player.talentLevels?.[talentId] ?? 0) > 0;
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
  const hasMissileTalent = hasTalent(owner, "engineer_offense_2");
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
    homing: hasMissileTalent,
    homingRadius: hasMissileTalent ? 320 : undefined,
    homingTurnRate: hasMissileTalent ? 4.5 : undefined,
  });
}

function fireTurretMissile(state: GameState, d: Deployable, target: Enemy, owner: Player): void {
  const angle = angleBetween(d, target);
  const speed = 520;
  const damageMul = getDeployableMultiplier(owner, "damage");
  const missileDamage = hasTalent(owner, "engineer_offense_2") ? 1.20 : 1.0;
  state.projectiles.push({
    id: uid("proj"),
    x: d.x + Math.cos(angle) * 28,
    y: d.y + Math.sin(angle) * 28,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 6,
    damage: Math.round(28 * damageMul * missileDamage),
    speed,
    color: "#f59e0b",
    pierce: 0,
    weaponId: "turret_missile",
    life: 3.5,
    homing: true,
    homingRadius: 320,
    homingTurnRate: 4.5,
    isExplosive: true,
    areaRadius: 60 * (owner.areaMultiplier ?? 1),
  });
}

function fireReconDroneProjectile(state: GameState, d: Deployable, target: Enemy, owner: Player): void {
  const angle = angleBetween(d, target);
  const speed = 640;
  const damageMul = getDeployableMultiplier(owner, "damage");
  state.projectiles.push({
    id: uid("proj"),
    x: d.x + Math.cos(angle) * 18,
    y: d.y + Math.sin(angle) * 18,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 4,
    damage: Math.round(22 * damageMul),
    speed,
    color: d.color,
    pierce: 0,
    weaponId: "recon_drone",
    life: 480 / speed,
    homing: true,
    homingRadius: 220,
    homingTurnRate: 4.8,
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
    player.talentLevels[talentId] = (player.talentLevels[talentId] ?? 0) + 1;
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
      if (player.ultimateSkill) {
        player.ultimateSkill.cooldown = Math.max(1, player.ultimateSkill.cooldown * m.cooldownMul);
      }
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
    if (m.meleeDamageMul || m.meleeRangeMul) {
      for (const weapon of player.weapons) {
        if (weapon.isMelee) {
          if (m.meleeDamageMul) weapon.damage = Math.round(weapon.damage * m.meleeDamageMul);
          if (m.meleeRangeMul) weapon.range *= m.meleeRangeMul;
        }
      }
    }
    if (m.skillDurationMul && player.activeSkill) {
      player.activeSkill.duration *= 1 + m.skillDurationMul;
    }

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
  player.ultimateSkill = null;
  player.skillTimer = 0;
  player.ultimateTimer = 0;
  player.leopardFrenzyTimer = 0;
  player.leopardBloodlustStacks = 0;
  player.leopardBloodlustTimer = 0;
}

function spawnVenomSpread(state: GameState, source: Enemy, count: number): void {
  let spread = 0;
  const candidates = state.enemies
    .filter((e) => e.id !== source.id)
    .map((e) => ({ enemy: e, dist: distance(e, source) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, count);
  for (const { enemy } of candidates) {
    enemy.venomStacks = Math.min(5, enemy.venomStacks + 1);
    enemy.venomTimer = Math.max(enemy.venomTimer, 4);
    spread++;
  }
}

function spawnFrostBurst(state: GameState, enemy: Enemy, damage: number, fx?: FXSystem): void {
  enemy.health -= damage;
  state.stats.damageDealt += damage;
  enemy.freezeTimer = Math.max(enemy.freezeTimer, 1.8);
  enemy.freezeShatterDamage = damage;
  enemy.frostStacks = 0;
  enemy.frostTimer = 0;
  fx?.addTrauma(0.06);
  spawnParticles(state, enemy.x, enemy.y, "#e0f2fe", 8, 140, 0.35);
}

function spawnParticles(
  state: GameState,
  x: number,
  y: number,
  color: string,
  count: number,
  speed: number,
  life: number
): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const vel = Math.random() * speed;
    state.particles.push({
      id: uid("particle"),
      x,
      y,
      vx: Math.cos(angle) * vel,
      vy: Math.sin(angle) * vel,
      radius: Math.random() * 2 + 1,
      color,
      life,
      maxLife: life,
    });
  }
}

function pointSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
