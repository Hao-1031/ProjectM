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
      description: "投掷后形成半径 80 的低温区域，持续 4 秒，减速 40%",
      cooldown: 12,
      timer: 0,
      range: BASE_SKILL_RANGE,
      duration: 4,
      color: "#38bdf8",
    },
    ultimate: {
      id: "nitrogen_zero",
      name: "绝对零度",
      description: "以自身为中心释放半径 200 的冰冻爆发，冻结范围内敌人 3 秒并造成 180 点伤害",
      cooldown: 45,
      timer: 0,
      range: 200,
      duration: 3,
      color: "#0ea5e9",
    },
    passive: { armorAdd: 0.06, areaMul: 1.1 },
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
        description: "冰冻手雷减速效果提升至 55%，作用半径 +10%",
        maxLevel: 1,
        category: "skill",
        variantFor: "skill",
        isSkillVariant: true,
        modifiers: { areaMul: 1.1 },
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
      description: "在目标位置生成半径 100 的治疗场，每秒恢复 22 点生命，持续 5 秒",
      cooldown: 15,
      timer: 0,
      range: BASE_SKILL_RANGE,
      duration: 5,
      color: "#a78bfa",
    },
    ultimate: {
      id: "twilight_cocoon",
      name: "蛹化复苏",
      description: "瞬间为自身及附近友方恢复 80 点生命并清除燃烧/腐蚀减益，半径 250",
      cooldown: 50,
      timer: 0,
      range: 250,
      duration: 0,
      color: "#8b5cf6",
    },
    passive: { regenAdd: 1.5, cooldownReductionAdd: 0.05 },
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
        description: "治疗脉冲每秒治疗量提升至 30，作用半径 +15%",
        maxLevel: 1,
        category: "skill",
        variantFor: "skill",
        isSkillVariant: true,
        modifiers: { deployableDamageMul: 1.36 },
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
      description: "向面朝方向冲刺 250 距离，路径上敌人受到 90 点伤害并被击退",
      cooldown: 10,
      timer: 0,
      range: 250,
      duration: 0,
      color: "#fb923c",
    },
    ultimate: {
      id: "leopard_instinct",
      name: "猎杀本能",
      description: "8 秒内移动速度 +30%、暴击率 +20%",
      cooldown: 40,
      timer: 0,
      range: 0,
      duration: 8,
      color: "#f97316",
    },
    passive: { speedMul: 1.1, critAdd: 0.05 },
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
        id: "leopard_predator",
        name: "掠食本能",
        description: "暴击率 +3%",
        maxLevel: 5,
        category: "damage",
        modifiers: { critAdd: 0.03 },
      },
      {
        id: "leopard_feral_pounce",
        name: "凶性猛扑",
        description: "猛扑距离 +20%，伤害 +15%，命中后自身移速 +10% 持续 2 秒",
        maxLevel: 1,
        category: "skill",
        variantFor: "skill",
        isSkillVariant: true,
        modifiers: { rangeMul: 1.2, damageMul: 1.15 },
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
      description: "部署无人机，半径 120 范围内敌人受到伤害 +12%，持续 6 秒",
      cooldown: 14,
      timer: 0,
      range: BASE_SKILL_RANGE,
      duration: 6,
      color: "#34d399",
    },
    ultimate: {
      id: "recon_strike",
      name: "集束打击",
      description: "召唤轨道打击，对面朝方向 120 距离处半径 150 区域造成 320 点伤害",
      cooldown: 55,
      timer: 0,
      range: 150,
      duration: 0,
      color: "#10b981",
    },
    passive: { critAdd: 0.1, rangeMul: 1.08 },
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
        description: "侦察无人机增伤效果提升至 20%，持续时间 +2 秒",
        maxLevel: 1,
        category: "skill",
        variantFor: "skill",
        isSkillVariant: true,
        modifiers: { deployableDurationMul: 1.33 },
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
      description: "朝目标方向喷射毒液，对路径敌人造成 60 点伤害并附加 4 秒腐蚀",
      cooldown: 10,
      timer: 0,
      range: BASE_SKILL_RANGE,
      duration: 4,
      color: "#84cc16",
    },
    ultimate: {
      id: "viper_nest",
      name: "蝰蛇巢穴",
      description: "在目标位置生成半径 160 的毒雾区域，持续 7 秒，每秒造成 45 点伤害并减速 30%",
      cooldown: 48,
      timer: 0,
      range: 180,
      duration: 7,
      color: "#65a30d",
    },
    passive: { critAdd: 0.05, speedMul: 1.04 },
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
        description: "毒液喷射腐蚀持续时间 +1.5 秒",
        maxLevel: 1,
        category: "skill",
        variantFor: "skill",
        isSkillVariant: true,
        modifiers: { skillDurationMul: 1.5 },
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
        id: "viper_neurotoxin",
        name: "神经毒素",
        description: "暴击率 +3%",
        maxLevel: 5,
        category: "damage",
        modifiers: { critAdd: 0.03 },
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
      description: "朝移动方向快速冲刺一段距离，并在终点释放一圈电磁脉冲，眩晕附近敌人 0.8 秒",
      cooldown: 9,
      timer: 0,
      range: 160,
      duration: 0.8,
      color: "#f59e0b",
    },
    ultimate: {
      id: "falcon_orbital_laser",
      name: "轨道激光",
      description: "呼叫轨道激光扫射前方 200 距离、宽 40 的区域，持续 3 秒，每秒造成 150 点伤害",
      cooldown: 52,
      timer: 0,
      range: 240,
      duration: 3,
      color: "#ea580c",
    },
    passive: { speedMul: 1.06, critAdd: 0.05 },
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
        description: "跃迁推进冷却 -2 秒，电磁脉冲范围 +20%",
        maxLevel: 1,
        category: "skill",
        variantFor: "skill",
        isSkillVariant: true,
        modifiers: { cooldownMul: 0.75, areaMul: 1.2 },
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
      description: "在面前放置一堵大血量水泥墙，阻挡敌人前进并吸收伤害，持续 10 秒",
      cooldown: 14,
      timer: 0,
      range: BASE_SKILL_RANGE,
      duration: 10,
      color: "#b45309",
    },
    ultimate: {
      id: "bastion_swarm",
      name: "巡飞弹集群",
      description: "释放 6 枚大范围自索敌巡飞弹，每枚对命中敌人造成 180 点爆炸伤害",
      cooldown: 55,
      timer: 0,
      range: 320,
      duration: 0,
      color: "#ea580c",
    },
    passive: { armorAdd: 0.08, maxHealthMul: 1.12 },
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
    player.cooldownReduction += def.passive.cooldownReductionAdd;
  if (def.passive.areaMul) player.areaMultiplier *= def.passive.areaMul;
  if (def.passive.rangeMul) {
    for (const weapon of player.weapons) {
      weapon.range *= def.passive.rangeMul;
    }
  }

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
  const ds = state.defenseState;
  if (!ds) return;

  const durationMul = getDeployableMultiplier(player, "duration");
  const rangeMul = getDeployableMultiplier(player, "range");
  const deployDuration = skill.duration * durationMul;

  switch (player.heroId) {
    case "nitrogen": {
      ds.deployables.push({
        id: uid("deploy"),
        x: player.x + aim.x * 40,
        y: player.y + aim.y * 40,
        radius: 80 * rangeMul,
        type: "freezeField",
        ownerId: player.id,
        health: 1,
        maxHealth: 1,
        timer: deployDuration,
        maxTimer: deployDuration,
        color: def.color,
      });
      break;
    }
    case "twilight": {
      ds.deployables.push({
        id: uid("deploy"),
        x: player.x + aim.x * 40,
        y: player.y + aim.y * 40,
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
    case "leopard": {
      const pounceRange = 250;
      const startX = player.x;
      const startY = player.y;
      const endX = player.x + aim.x * pounceRange;
      const endY = player.y + aim.y * pounceRange;

      for (const enemy of state.enemies) {
        if (
          pointSegmentDistance(enemy.x, enemy.y, startX, startY, endX, endY) <=
          player.radius + enemy.radius + 20
        ) {
          enemy.health -= 90;
          const dx = enemy.x - player.x;
          const dy = enemy.y - player.y;
          const dist = Math.hypot(dx, dy) || 1;
          enemy.knockbackX += (dx / dist) * 180;
          enemy.knockbackY += (dy / dist) * 180;
          state.stats.damageDealt += 90;
        }
      }

      player.x = clamp(endX, player.radius, state.map.width - player.radius);
      player.y = clamp(endY, player.radius, state.map.height - player.radius);
      break;
    }
    case "recon": {
      ds.deployables.push({
        id: uid("deploy"),
        x: player.x + aim.x * 40,
        y: player.y + aim.y * 40,
        radius: 120 * rangeMul,
        type: "drone",
        ownerId: player.id,
        health: 1,
        maxHealth: 1,
        timer: deployDuration,
        maxTimer: deployDuration,
        color: def.color,
      });
      break;
    }
    case "viper": {
      const range = 260 * rangeMul;
      for (const enemy of state.enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > range + enemy.radius) continue;
        const dot = (dx / (dist || 1)) * aim.x + (dy / (dist || 1)) * aim.y;
        if (dot < 0.55) continue;
        enemy.health -= 60;
        enemy.burnDuration = Math.max(enemy.burnDuration, 4);
        enemy.burnDamage = Math.max(enemy.burnDamage, 8);
        state.stats.damageDealt += 60;
      }
      break;
    }
    case "falcon": {
      const dashRange = 160;
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
      for (const enemy of state.enemies) {
        if (distance(enemy, player) <= 90 * rangeMul + enemy.radius) {
          enemy.health -= 50;
          enemy.freezeTimer = Math.max(enemy.freezeTimer, 0.8);
          state.stats.damageDealt += 50;
        }
      }
      break;
    }
    case "bastion": {
      const healthMul = getDeployableMultiplier(player, "health");
      const wallHealth = Math.round(1200 * healthMul);
      ds.deployables.push({
        id: uid("deploy"),
        x: player.x + aim.x * 60,
        y: player.y + aim.y * 60,
        radius: 42,
        type: "wall",
        ownerId: player.id,
        health: wallHealth,
        maxHealth: wallHealth,
        timer: deployDuration,
        maxTimer: deployDuration,
        color: def.color,
      });
      break;
    }
  }
}

export function useHeroUltimate(player: Player, state: GameState): void {
  if (!player.heroId || !player.ultimateSkill) return;
  if (player.ultimateTimer > 0) return;

  const def = HERO_DEFS[player.heroId];
  const ultimate = player.ultimateSkill;
  player.ultimateTimer = ultimate.cooldown;
  ultimate.timer = ultimate.duration;

  const aim = normalize({ x: Math.cos(player.facing), y: Math.sin(player.facing) });
  const ds = state.defenseState;

  switch (player.heroId) {
    case "nitrogen": {
      if (!ds) return;
      const rangeMul = getDeployableMultiplier(player, "range");
      const deployDuration = ultimate.duration * getDeployableMultiplier(player, "duration");
      ds.deployables.push({
        id: uid("deploy"),
        x: player.x,
        y: player.y,
        radius: 200 * rangeMul,
        type: "freezeField",
        ownerId: player.id,
        health: 1,
        maxHealth: 1,
        timer: deployDuration,
        maxTimer: deployDuration,
        color: def.color,
      });
      for (const enemy of state.enemies) {
        if (distance(enemy, player) <= 200 * rangeMul + enemy.radius) {
          enemy.health -= 180;
          enemy.freezeTimer = Math.max(enemy.freezeTimer, 3);
          enemy.slow = 1;
          state.stats.damageDealt += 180;
        }
      }
      break;
    }
    case "twilight": {
      const players = [state.player, ...state.players];
      for (const target of players) {
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        if (dx * dx + dy * dy <= ultimate.range * ultimate.range) {
          target.health = Math.min(target.maxHealth, target.health + 80);
          target.burnDuration = 0;
        }
      }
      break;
    }
    case "leopard": {
      player.leopardFrenzyTimer = 8;
      break;
    }
    case "recon": {
      const centerX = player.x + aim.x * 120;
      const centerY = player.y + aim.y * 120;
      for (const enemy of state.enemies) {
        if (distance(enemy, { x: centerX, y: centerY }) <= ultimate.range + enemy.radius) {
          enemy.health -= 320;
          state.stats.damageDealt += 320;
        }
      }
      break;
    }
    case "viper": {
      if (!ds) return;
      const rangeMul = getDeployableMultiplier(player, "range");
      const deployDuration = ultimate.duration * getDeployableMultiplier(player, "duration");
      ds.deployables.push({
        id: uid("deploy"),
        x: player.x + aim.x * 60,
        y: player.y + aim.y * 60,
        radius: 160 * rangeMul,
        type: "freezeField",
        ownerId: player.id,
        health: 1,
        maxHealth: 1,
        timer: deployDuration,
        maxTimer: deployDuration,
        color: def.color,
      });
      break;
    }
    case "falcon": {
      const width = 40;
      const length = 200;
      const centerX = player.x + aim.x * 120;
      const centerY = player.y + aim.y * 120;
      const perpX = -aim.y;
      const perpY = aim.x;
      for (let i = 0; i < 15; i++) {
        const t = i / 14;
        const px = centerX + aim.x * (t - 0.5) * length + perpX * (Math.random() - 0.5) * width;
        const py = centerY + aim.y * (t - 0.5) * length + perpY * (Math.random() - 0.5) * width;
        for (const enemy of state.enemies) {
          if (distance(enemy, { x: px, y: py }) <= 60 + enemy.radius) {
            enemy.health -= 150 * 0.2;
            state.stats.damageDealt += 150 * 0.2;
          }
        }
      }
      break;
    }
    case "bastion": {
      const count = hasTalent(player, "bastion_overload") ? 8 : 6;
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
          damage: Math.round(180 * damageMul),
          speed,
          color: def.color,
          pierce: 0,
          weaponId: "bastion_swarm",
          life: 3.5,
          homing: true,
          isExplosive: true,
          areaRadius: 55,
        });
      }
      break;
    }
  }
}

export function updateHeroSkillsAndDeployables(state: GameState, dt: number): void {
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
    if (player.leopardFrenzyTimer > 0) player.leopardFrenzyTimer -= dt;
    if (player.leopardBloodlustTimer > 0) {
      player.leopardBloodlustTimer -= dt;
      if (player.leopardBloodlustTimer <= 0) {
        player.leopardBloodlustStacks = 0;
      }
    }
  }

  if (!ds) return;

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

    if (d.type === "freezeField") {
      for (const enemy of state.enemies) {
        if (distance(enemy, d) <= d.radius + enemy.radius) {
          if (owner.heroId === "viper") {
            enemy.burnDuration = Math.max(enemy.burnDuration, 1);
            enemy.burnDamage = Math.max(enemy.burnDamage, 22);
            enemy.slow = Math.max(enemy.slow, 0.3);
            enemy.slowTimer = Math.max(enemy.slowTimer, d.timer);
          } else {
            const slowStrength =
              owner.heroId === "nitrogen" && hasTalent(owner, "nitrogen_supercooled") ? 0.55 : 0.4;
            enemy.slow = Math.max(enemy.slow, slowStrength);
            enemy.slowTimer = Math.max(enemy.slowTimer, d.timer);
          }
        }
      }
    }

    if (d.type === "drone") {
      for (const enemy of state.enemies) {
        if (distance(enemy, d) <= d.radius + enemy.radius) {
          enemy.droneMarkTimer = Math.max(enemy.droneMarkTimer, d.timer);
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
