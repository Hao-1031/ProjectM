import type {
  Weapon,
  WeaponId,
  Enemy,
  EnemyVariant,
  Player,
  PassiveId,
  GameState,
  RoguelikeStage,
  AffixId,
} from "./types";

// ========================================================================
// 全局平衡配置
// ========================================================================

export interface BalanceConfig {
  player: PlayerBalance;
  weapons: Record<WeaponId, WeaponBalance>;
  enemies: Record<EnemyVariant | "base", EnemyBalance>;
  affixes: Record<AffixId, AffixBalance>;
  bosses: Record<string, BossBalance>;
  difficulty: DifficultyBalance;
  progression: ProgressionBalance;
  pickups: PickupBalance;
  modes: ModeBalance;
}

export interface PlayerBalance {
  baseHealth: number;
  baseSpeed: number;
  baseRadius: number;
  baseMagnetRange: number;
  invincibilityDuration: number;
  knockbackDecay: number;
  regenCap: number;
  armorCap: number;
  critDamageMultiplier: number;
  levelXpCurve: number;
  levelXpMultiplier: number;
}

export interface WeaponBalance {
  name: string;
  description: string;
  color: string;
  cost: number;
  base: WeaponStatBlock;
  maxLevel: number;
  upgrades: WeaponUpgradeStep[];
}

export interface WeaponStatBlock {
  damage: number;
  cooldown: number;
  range: number;
  projectileSpeed: number;
  count: number;
  spread: number;
  pierce: number;
  areaRadius?: number;
  burnDuration?: number;
  chainCount?: number;
  chainRange?: number;
  freezeDuration?: number;
  gravityRadius?: number;
  pullStrength?: number;
  homing?: boolean;
  isMelee?: boolean;
  swarmCount?: number;
}

export interface WeaponUpgradeStep {
  level: number;
  damageMul?: number;
  cooldownMul?: number;
  rangeMul?: number;
  countAdd?: number;
  pierceAdd?: number;
  areaMul?: number;
  burnAdd?: number;
  chainCountAdd?: number;
  chainRangeMul?: number;
  freezeDurationAdd?: number;
  gravityRadiusMul?: number;
  pullStrengthMul?: number;
  swarmCountAdd?: number;
}

export interface EnemyBalance {
  healthMul: number;
  speed: number;
  damage: number;
  radius: number;
  xpValue: number;
  color: string;
  attackCooldown?: number;
  eliteHealthMul?: number;
  eliteDamageMul?: number;
  eliteSpeedMul?: number;
  eliteXpMul?: number;
}

export interface AffixBalance {
  healthMul?: number;
  damageMul?: number;
  speedMul?: number;
  radiusAdd?: number;
  xpMul?: number;
  regenPercent?: number;
  shieldPercent?: number;
}

export interface BossBalance {
  name: string;
  description: string;
  radius: number;
  speed: number;
  health: number;
  damage: number;
  color: string;
  secondaryColor: string;
  phases: BossPhaseBalance[];
  phaseThresholds: number[];
}

export interface BossPhaseBalance {
  name: string;
  attackPattern: "single" | "spread" | "burst" | "summon" | "laser" | "charge";
  attackCooldown: number;
  projectileCount: number;
  moveSpeedMul: number;
  onEnter?: (boss: Enemy) => Partial<Enemy>;
}

export interface DifficultyBalance {
  baseInterval: number;
  intervalDecay: number;
  minInterval: number;
  baseCount: number;
  countGrowth: number;
  maxCount: number;
  difficultyGrowth: number;
  eliteChanceBase: number;
  eliteChanceGrowth: number;
  eliteChanceMax: number;
  affixCountThresholds: number[];
  hordeSpawnInterval: number;
  hordeSpawnCount: number;
}

export interface ProgressionBalance {
  xpBase: number;
  xpGrowth: number;
  xpCurve: number;
  passiveMaxLevel: number;
  weaponMaxLevel: number;
  maxWeapons: number;
}

export interface PickupBalance {
  xpBaseValue: number;
  xpDifficultyScale: number;
  healthValue: number;
  resourceValue: number;
  chestDropCount: number;
  chestEliteChance: number;
  magnetBoostMul: number;
  magnetBoostDuration: number;
}

export interface ModeBalance {
  campaignMissions: MissionTemplateBalance[];
  defenseMissions: MissionTemplateBalance[];
  defenseCompletionRewards: DefenseCompletionRewardBalance;
  endlessWaveDuration: number;
  endlessDifficultyBump: number;
  endlessBossWaveInterval: number;
  dailyModifiers: DailyModifierBalance[];
  roguelikeStages: RoguelikeStageTemplate[];
  roguelikeRewards: RoguelikeRewardBalance[];
}

export interface DefenseCompletionRewardBalance {
  baseXp: number;
  baseResources: number;
  baseScore: number;
  coreHighHealthThreshold: number;
  coreMidHealthThreshold: number;
  coreHighHealthBonus: number;
  coreMidHealthBonus: number;
  coreLowHealthBonus: number;
  nodeBonusPerNode: number;
  waveBonusMax: number;
}

export interface MissionTemplateBalance {
  type:
    | "eliminate"
    | "survive"
    | "collect"
    | "rescue"
    | "extract"
    | "defendCore"
    | "captureNodes"
    | "surviveTimer";
  title: string;
  description: string;
  target: number;
  timeLimit?: number;
}

export interface DailyModifierBalance {
  id: string;
  title: string;
  description: string;
  apply: (state: GameState) => void;
  revert?: (state: GameState) => void;
}

export interface RoguelikeStageTemplate {
  type: "combat" | "elite" | "reward" | "boss";
  name: string;
  targetMul: number;
}

export interface RoguelikeRewardBalance {
  id: string;
  name: string;
  description: string;
  apply: (player: Player) => void;
}

// ========================================================================
// 默认配置
// ========================================================================

export const DEFAULT_BALANCE: BalanceConfig = {
  player: {
    baseHealth: 200,
    baseSpeed: 260,
    baseRadius: 14,
    baseMagnetRange: 120,
    invincibilityDuration: 0.5,
    knockbackDecay: 6,
    regenCap: 20,
    armorCap: 0.75,
    critDamageMultiplier: 2,
    levelXpCurve: 1.18,
    levelXpMultiplier: 50,
  },

  weapons: {
    pulse: {
      name: "脉冲步枪",
      description: "高射速能量弹，可穿透一个目标",
      color: "#22d3ee",
      cost: 0,
      maxLevel: 5,
      base: {
        damage: 20,
        cooldown: 0.34,
        range: 520,
        projectileSpeed: 920,
        count: 1,
        spread: 0.05,
        pierce: 1,
      },
      upgrades: [
        { level: 2, damageMul: 1.22, cooldownMul: 0.9, pierceAdd: 1 },
        { level: 3, damageMul: 1.22, cooldownMul: 0.9, countAdd: 1 },
        { level: 4, damageMul: 1.22, cooldownMul: 0.9, pierceAdd: 1 },
        { level: 5, damageMul: 1.22, cooldownMul: 0.9, rangeMul: 1.1, pierceAdd: 1 },
      ],
    },
    shotgun: {
      name: "霰弹爆破",
      description: "扇形散射，近距离爆发",
      color: "#f59e0b",
      cost: 300,
      maxLevel: 5,
      base: {
        damage: 15,
        cooldown: 0.88,
        range: 380,
        projectileSpeed: 720,
        count: 5,
        spread: 0.34,
        pierce: 0,
      },
      upgrades: [
        { level: 2, damageMul: 1.18, countAdd: 1, cooldownMul: 0.92 },
        { level: 3, damageMul: 1.18, countAdd: 1, cooldownMul: 0.92 },
        { level: 4, damageMul: 1.18, countAdd: 1, cooldownMul: 0.92 },
        { level: 5, damageMul: 1.18, countAdd: 1, cooldownMul: 0.92, pierceAdd: 1 },
      ],
    },
    laser: {
      name: "贯穿激光",
      description: "高能光束，穿透多个敌人",
      color: "#a855f7",
      cost: 500,
      maxLevel: 5,
      base: {
        damage: 34,
        cooldown: 0.68,
        range: 720,
        projectileSpeed: 1250,
        count: 1,
        spread: 0,
        pierce: 5,
      },
      upgrades: [
        { level: 2, damageMul: 1.28, cooldownMul: 0.88, pierceAdd: 2 },
        { level: 3, damageMul: 1.28, cooldownMul: 0.88, pierceAdd: 2 },
        { level: 4, damageMul: 1.28, cooldownMul: 0.88, countAdd: 1 },
        { level: 5, damageMul: 1.28, cooldownMul: 0.88, pierceAdd: 3, rangeMul: 1.12 },
      ],
    },
    rocket: {
      name: "集束火箭",
      description: "命中后爆炸，造成范围伤害",
      color: "#f43f5e",
      cost: 600,
      maxLevel: 5,
      base: {
        damage: 55,
        cooldown: 1.05,
        range: 620,
        projectileSpeed: 580,
        count: 1,
        spread: 0.08,
        pierce: 0,
        areaRadius: 62,
      },
      upgrades: [
        { level: 2, damageMul: 1.3, cooldownMul: 0.9, areaMul: 1.18 },
        { level: 3, damageMul: 1.3, cooldownMul: 0.9, countAdd: 1 },
        { level: 4, damageMul: 1.3, cooldownMul: 0.9, areaMul: 1.18 },
        { level: 5, damageMul: 1.3, cooldownMul: 0.9, areaMul: 1.18, pierceAdd: 1 },
      ],
    },
    flame: {
      name: "等离子喷火器",
      description: "持续喷射，附带燃烧效果",
      color: "#fb923c",
      cost: 400,
      maxLevel: 5,
      base: {
        damage: 9,
        cooldown: 0.11,
        range: 280,
        projectileSpeed: 520,
        count: 2,
        spread: 0.24,
        pierce: 2,
        burnDuration: 2,
      },
      upgrades: [
        { level: 2, damageMul: 1.2, countAdd: 1, rangeMul: 1.08, burnAdd: 0.5 },
        { level: 3, damageMul: 1.2, countAdd: 1, rangeMul: 1.08, burnAdd: 0.5 },
        { level: 4, damageMul: 1.2, countAdd: 1, rangeMul: 1.08, burnAdd: 0.5 },
        { level: 5, damageMul: 1.2, countAdd: 1, rangeMul: 1.08, burnAdd: 0.5, pierceAdd: 1 },
      ],
    },
    drone: {
      name: "浮游无人机",
      description: "追踪最近目标的自动无人机",
      color: "#34d399",
      cost: 450,
      maxLevel: 5,
      base: {
        damage: 24,
        cooldown: 0.52,
        range: 480,
        projectileSpeed: 680,
        count: 2,
        spread: 0.14,
        pierce: 1,
      },
      upgrades: [
        { level: 2, damageMul: 1.24, cooldownMul: 0.88, countAdd: 1 },
        { level: 3, damageMul: 1.24, cooldownMul: 0.88 },
        { level: 4, damageMul: 1.24, cooldownMul: 0.88, countAdd: 1 },
        { level: 5, damageMul: 1.24, cooldownMul: 0.88, pierceAdd: 1 },
      ],
    },
    plasma: {
      name: "等离子步枪",
      description: "不稳定等离子弹，命中后分裂溅射",
      color: "#38bdf8",
      cost: 350,
      maxLevel: 5,
      base: {
        damage: 26,
        cooldown: 0.42,
        range: 540,
        projectileSpeed: 820,
        count: 1,
        spread: 0.06,
        pierce: 0,
        areaRadius: 42,
      },
      upgrades: [
        { level: 2, damageMul: 1.22, cooldownMul: 0.9, areaMul: 1.16 },
        { level: 3, damageMul: 1.22, cooldownMul: 0.9, countAdd: 1 },
        { level: 4, damageMul: 1.22, cooldownMul: 0.9, areaMul: 1.16 },
        { level: 5, damageMul: 1.22, cooldownMul: 0.9, areaMul: 1.16, pierceAdd: 1 },
      ],
    },
    railgun: {
      name: "磁轨炮",
      description: "高能穿透射线，对路径上所有敌人造成伤害",
      color: "#60a5fa",
      cost: 800,
      maxLevel: 5,
      base: {
        damage: 72,
        cooldown: 1.25,
        range: 900,
        projectileSpeed: 1450,
        count: 1,
        spread: 0,
        pierce: 8,
      },
      upgrades: [
        { level: 2, damageMul: 1.32, cooldownMul: 0.88, pierceAdd: 2 },
        { level: 3, damageMul: 1.32, cooldownMul: 0.88, pierceAdd: 2 },
        { level: 4, damageMul: 1.32, cooldownMul: 0.88, rangeMul: 1.1 },
        { level: 5, damageMul: 1.32, cooldownMul: 0.88, pierceAdd: 3, countAdd: 1 },
      ],
    },
    swarm: {
      name: "蜂群发射器",
      description: "发射追踪微型飞弹，覆盖多个目标",
      color: "#fbbf24",
      cost: 550,
      maxLevel: 5,
      base: {
        damage: 16,
        cooldown: 0.72,
        range: 560,
        projectileSpeed: 620,
        count: 4,
        spread: 0.28,
        pierce: 0,
      },
      upgrades: [
        { level: 2, damageMul: 1.18, cooldownMul: 0.9, countAdd: 1 },
        { level: 3, damageMul: 1.18, cooldownMul: 0.9, countAdd: 1 },
        { level: 4, damageMul: 1.18, cooldownMul: 0.9, countAdd: 1 },
        { level: 5, damageMul: 1.18, cooldownMul: 0.9, countAdd: 2, pierceAdd: 1 },
      ],
    },
    gauss: {
      name: "高斯步枪",
      description: "高穿透穿甲弹，对重装单位造成额外伤害",
      color: "#94a3b8",
      cost: 500,
      maxLevel: 5,
      base: {
        damage: 38,
        cooldown: 0.58,
        range: 640,
        projectileSpeed: 1050,
        count: 1,
        spread: 0.04,
        pierce: 4,
      },
      upgrades: [
        { level: 2, damageMul: 1.24, cooldownMul: 0.9, pierceAdd: 1 },
        { level: 3, damageMul: 1.24, cooldownMul: 0.9, countAdd: 1 },
        { level: 4, damageMul: 1.24, cooldownMul: 0.9, pierceAdd: 2 },
        { level: 5, damageMul: 1.24, cooldownMul: 0.9, rangeMul: 1.12, pierceAdd: 1 },
      ],
    },
    arcCaster: {
      name: "电弧发射器",
      description: "释放连锁电弧，命中后跳跃至附近多个目标",
      color: "#facc15",
      cost: 500,
      maxLevel: 5,
      base: {
        damage: 26,
        cooldown: 0.55,
        range: 500,
        projectileSpeed: 900,
        count: 1,
        spread: 0.04,
        pierce: 1,
        chainCount: 3,
        chainRange: 160,
      },
      upgrades: [
        { level: 2, damageMul: 1.22, cooldownMul: 0.9, chainCountAdd: 1 },
        { level: 3, damageMul: 1.22, cooldownMul: 0.9, chainRangeMul: 1.2 },
        { level: 4, damageMul: 1.22, cooldownMul: 0.9, chainCountAdd: 1 },
        { level: 5, damageMul: 1.22, cooldownMul: 0.9, chainCountAdd: 2, chainRangeMul: 1.2 },
      ],
    },
    cryoLauncher: {
      name: "冷冻榴弹",
      description: "范围冰霜爆炸，降低敌人移动速度",
      color: "#67e8f9",
      cost: 450,
      maxLevel: 5,
      base: {
        damage: 34,
        cooldown: 0.95,
        range: 560,
        projectileSpeed: 580,
        count: 1,
        spread: 0.08,
        pierce: 0,
        areaRadius: 55,
        freezeDuration: 2,
      },
      upgrades: [
        { level: 2, damageMul: 1.24, cooldownMul: 0.9, areaMul: 1.16 },
        { level: 3, damageMul: 1.24, cooldownMul: 0.9, freezeDurationAdd: 0.6 },
        { level: 4, damageMul: 1.24, cooldownMul: 0.9, areaMul: 1.16 },
        { level: 5, damageMul: 1.24, cooldownMul: 0.9, areaMul: 1.16, freezeDurationAdd: 0.6 },
      ],
    },
    plasmaBlade: {
      name: "等离子刃",
      description: "近身高伤害斩击，可穿透路径上所有敌人",
      color: "#e879f9",
      cost: 600,
      maxLevel: 5,
      base: {
        damage: 64,
        cooldown: 0.72,
        range: 170,
        projectileSpeed: 820,
        count: 1,
        spread: 0.18,
        pierce: 6,
        isMelee: true,
      },
      upgrades: [
        { level: 2, damageMul: 1.28, cooldownMul: 0.88, rangeMul: 1.08 },
        { level: 3, damageMul: 1.28, cooldownMul: 0.88, pierceAdd: 2 },
        { level: 4, damageMul: 1.28, cooldownMul: 0.88, rangeMul: 1.08 },
        { level: 5, damageMul: 1.28, cooldownMul: 0.88, pierceAdd: 3, rangeMul: 1.1 },
      ],
    },
    naniteSwarm: {
      name: "纳米虫群",
      description: "释放持续侵蚀敌人的微型机器人，可叠加多层",
      color: "#34d399",
      cost: 550,
      maxLevel: 5,
      base: {
        damage: 5,
        cooldown: 0.28,
        range: 400,
        projectileSpeed: 480,
        count: 3,
        spread: 0.3,
        pierce: 0,
        swarmCount: 4,
      },
      upgrades: [
        { level: 2, damageMul: 1.2, cooldownMul: 0.9, countAdd: 1 },
        { level: 3, damageMul: 1.2, cooldownMul: 0.9, swarmCountAdd: 2 },
        { level: 4, damageMul: 1.2, cooldownMul: 0.9, countAdd: 1 },
        { level: 5, damageMul: 1.2, cooldownMul: 0.9, swarmCountAdd: 3, countAdd: 1 },
      ],
    },
    gravityWell: {
      name: "重力井投射器",
      description: "制造引力场吸引敌人并造成持续伤害",
      color: "#818cf8",
      cost: 700,
      maxLevel: 5,
      base: {
        damage: 18,
        cooldown: 1.1,
        range: 600,
        projectileSpeed: 520,
        count: 1,
        spread: 0.06,
        pierce: 0,
        areaRadius: 80,
        gravityRadius: 140,
        pullStrength: 120,
      },
      upgrades: [
        { level: 2, damageMul: 1.26, cooldownMul: 0.9, gravityRadiusMul: 1.18 },
        { level: 3, damageMul: 1.26, cooldownMul: 0.9, pullStrengthMul: 1.25 },
        { level: 4, damageMul: 1.26, cooldownMul: 0.9, areaMul: 1.16 },
        {
          level: 5,
          damageMul: 1.26,
          cooldownMul: 0.9,
          gravityRadiusMul: 1.18,
          pullStrengthMul: 1.25,
        },
      ],
    },
    vortexCannon: {
      name: "涡流加农炮",
      description: "发射持续穿透的螺旋能量弹，对直线上敌人重复伤害",
      color: "#f472b6",
      cost: 650,
      maxLevel: 5,
      base: {
        damage: 42,
        cooldown: 0.86,
        range: 720,
        projectileSpeed: 780,
        count: 1,
        spread: 0.04,
        pierce: 8,
      },
      upgrades: [
        { level: 2, damageMul: 1.26, cooldownMul: 0.9, pierceAdd: 2 },
        { level: 3, damageMul: 1.26, cooldownMul: 0.9, rangeMul: 1.1 },
        { level: 4, damageMul: 1.26, cooldownMul: 0.9, pierceAdd: 2 },
        { level: 5, damageMul: 1.26, cooldownMul: 0.9, pierceAdd: 3, rangeMul: 1.12 },
      ],
    },
    seekerRifle: {
      name: "追踪步枪",
      description: "发射自动追踪最近目标的智能子弹",
      color: "#a78bfa",
      cost: 500,
      maxLevel: 5,
      base: {
        damage: 30,
        cooldown: 0.62,
        range: 620,
        projectileSpeed: 680,
        count: 1,
        spread: 0.02,
        pierce: 0,
        homing: true,
      },
      upgrades: [
        { level: 2, damageMul: 1.22, cooldownMul: 0.9, countAdd: 1 },
        { level: 3, damageMul: 1.22, cooldownMul: 0.9, rangeMul: 1.1 },
        { level: 4, damageMul: 1.22, cooldownMul: 0.9, countAdd: 1 },
        { level: 5, damageMul: 1.22, cooldownMul: 0.9, countAdd: 1, rangeMul: 1.12 },
      ],
    },
    shardRepeater: {
      name: "晶片连射器",
      description: "高速发射脆弱但数量众多的能量晶片",
      color: "#2dd4bf",
      cost: 400,
      maxLevel: 5,
      base: {
        damage: 11,
        cooldown: 0.18,
        range: 460,
        projectileSpeed: 860,
        count: 3,
        spread: 0.22,
        pierce: 1,
      },
      upgrades: [
        { level: 2, damageMul: 1.18, cooldownMul: 0.92, countAdd: 1 },
        { level: 3, damageMul: 1.18, cooldownMul: 0.92, countAdd: 1 },
        { level: 4, damageMul: 1.18, cooldownMul: 0.92, countAdd: 1 },
        { level: 5, damageMul: 1.18, cooldownMul: 0.92, countAdd: 2, pierceAdd: 1 },
      ],
    },
  },

  enemies: {
    base: {
      healthMul: 1,
      speed: 110,
      damage: 12,
      radius: 14,
      xpValue: 6,
      color: "#fb923c",
    },
    walker: {
      healthMul: 1,
      speed: 105,
      damage: 22,
      radius: 14,
      xpValue: 6,
      color: "#fb923c",
      eliteHealthMul: 2.8,
      eliteDamageMul: 1.5,
      eliteSpeedMul: 1.08,
      eliteXpMul: 3,
    },
    runner: {
      healthMul: 0.55,
      speed: 130,
      damage: 14,
      radius: 10,
      xpValue: 4,
      color: "#34d399",
      eliteHealthMul: 2.8,
      eliteDamageMul: 1.55,
      eliteSpeedMul: 1.12,
      eliteXpMul: 3,
    },
    tank: {
      healthMul: 3.2,
      speed: 78,
      damage: 36,
      radius: 22,
      xpValue: 14,
      color: "#f43f5e",
      eliteHealthMul: 2.4,
      eliteDamageMul: 1.45,
      eliteSpeedMul: 1.05,
      eliteXpMul: 3,
    },
    spitter: {
      healthMul: 0.8,
      speed: 92,
      damage: 16,
      radius: 12,
      xpValue: 9,
      color: "#a3e635",
      attackCooldown: 2,
      eliteHealthMul: 2.8,
      eliteDamageMul: 1.55,
      eliteSpeedMul: 1.1,
      eliteXpMul: 3,
    },
    elite: {
      healthMul: 5.5,
      speed: 128,
      damage: 44,
      radius: 18,
      xpValue: 28,
      color: "#f59e0b",
      attackCooldown: 1.4,
      eliteHealthMul: 1,
      eliteDamageMul: 1,
      eliteSpeedMul: 1,
      eliteXpMul: 1,
    },
    boss: {
      healthMul: 30,
      speed: 72,
      damage: 70,
      radius: 40,
      xpValue: 250,
      color: "#e879f9",
      attackCooldown: 1.1,
      eliteHealthMul: 1,
      eliteDamageMul: 1,
      eliteSpeedMul: 1,
      eliteXpMul: 1,
    },
    drone: {
      healthMul: 0.35,
      speed: 180,
      damage: 12,
      radius: 8,
      xpValue: 4,
      color: "#94a3b8",
      eliteHealthMul: 2.6,
      eliteDamageMul: 1.5,
      eliteSpeedMul: 1.15,
      eliteXpMul: 3,
    },
    sentinel: {
      healthMul: 1.4,
      speed: 95,
      damage: 24,
      radius: 15,
      xpValue: 7,
      color: "#64748b",
      eliteHealthMul: 2.8,
      eliteDamageMul: 1.55,
      eliteSpeedMul: 1.1,
      eliteXpMul: 3,
    },
    crusher: {
      healthMul: 4.5,
      speed: 62,
      damage: 44,
      radius: 26,
      xpValue: 18,
      color: "#f97316",
      eliteHealthMul: 2.4,
      eliteDamageMul: 1.45,
      eliteSpeedMul: 1.05,
      eliteXpMul: 3,
    },
    sniper: {
      healthMul: 0.7,
      speed: 78,
      damage: 18,
      radius: 11,
      xpValue: 8,
      color: "#22d3ee",
      attackCooldown: 2.2,
      eliteHealthMul: 2.6,
      eliteDamageMul: 1.6,
      eliteSpeedMul: 1.08,
      eliteXpMul: 3,
    },
    stalker: {
      healthMul: 0.65,
      speed: 185,
      damage: 16,
      radius: 10,
      xpValue: 5,
      color: "#94a3b8",
      attackCooldown: 1.6,
      eliteHealthMul: 2.8,
      eliteDamageMul: 1.55,
      eliteSpeedMul: 1.14,
      eliteXpMul: 3,
    },
    shielder: {
      healthMul: 2.8,
      speed: 85,
      damage: 26,
      radius: 20,
      xpValue: 13,
      color: "#64748b",
      attackCooldown: 1.8,
      eliteHealthMul: 2.5,
      eliteDamageMul: 1.45,
      eliteSpeedMul: 1.06,
      eliteXpMul: 3,
    },
    harvester: {
      healthMul: 1.1,
      speed: 100,
      damage: 16,
      radius: 13,
      xpValue: 10,
      color: "#f59e0b",
      attackCooldown: 2.5,
      eliteHealthMul: 2.7,
      eliteDamageMul: 1.5,
      eliteSpeedMul: 1.08,
      eliteXpMul: 3,
    },
    artillery: {
      healthMul: 1.2,
      speed: 55,
      damage: 38,
      radius: 14,
      xpValue: 12,
      color: "#78716c",
      attackCooldown: 2.8,
      eliteHealthMul: 2.6,
      eliteDamageMul: 1.65,
      eliteSpeedMul: 1.05,
      eliteXpMul: 3,
    },
    disruptor: {
      healthMul: 0.9,
      speed: 115,
      damage: 13,
      radius: 12,
      xpValue: 9,
      color: "#22d3ee",
      attackCooldown: 2,
      eliteHealthMul: 2.7,
      eliteDamageMul: 1.5,
      eliteSpeedMul: 1.12,
      eliteXpMul: 3,
    },
    scorcher: {
      healthMul: 1.2,
      speed: 100,
      damage: 26,
      radius: 15,
      xpValue: 11,
      color: "#f97316",
      attackCooldown: 2.4,
      eliteHealthMul: 2.6,
      eliteDamageMul: 1.6,
      eliteSpeedMul: 1.08,
      eliteXpMul: 3,
    },
    bomber: {
      healthMul: 0.7,
      speed: 135,
      damage: 34,
      radius: 11,
      xpValue: 10,
      color: "#fbbf24",
      attackCooldown: 2.8,
      eliteHealthMul: 2.5,
      eliteDamageMul: 1.65,
      eliteSpeedMul: 1.1,
      eliteXpMul: 3,
    },
    leech: {
      healthMul: 0.85,
      speed: 110,
      damage: 12,
      radius: 12,
      xpValue: 8,
      color: "#a78bfa",
      attackCooldown: 1.6,
      eliteHealthMul: 2.8,
      eliteDamageMul: 1.5,
      eliteSpeedMul: 1.1,
      eliteXpMul: 3,
    },
    constructor: {
      healthMul: 1.8,
      speed: 65,
      damage: 16,
      radius: 18,
      xpValue: 13,
      color: "#64748b",
      attackCooldown: 3.5,
      eliteHealthMul: 2.4,
      eliteDamageMul: 1.45,
      eliteSpeedMul: 1.05,
      eliteXpMul: 3,
    },
    raptor: {
      healthMul: 0.5,
      speed: 195,
      damage: 13,
      radius: 9,
      xpValue: 5,
      color: "#38bdf8",
      attackCooldown: 1.4,
      eliteHealthMul: 2.7,
      eliteDamageMul: 1.6,
      eliteSpeedMul: 1.14,
      eliteXpMul: 3,
    },
  },

  affixes: {
    shielded: { healthMul: 1.4, shieldPercent: 0.3 },
    splitting: { xpMul: 0.6 },
    explosive: { radiusAdd: 4 },
    swift: { speedMul: 1.5 },
    corrosive: { damageMul: 0.8, radiusAdd: 2 },
    regenerating: { healthMul: 1.25, regenPercent: 0.02 },
    freezing: { damageMul: 0.9, speedMul: 1.2 },
    taunting: { radiusAdd: 6, healthMul: 1.6 },
  },

  bosses: {
    overlord: {
      name: "支配者",
      description: "高速突袭型 Boss，低血量时进入狂暴并召唤分身",
      radius: 38,
      speed: 90,
      health: 3000,
      damage: 45,
      color: "#e879f9",
      secondaryColor: "#f0abfc",
      phases: [
        {
          name: "猎杀",
          attackPattern: "burst",
          attackCooldown: 1.2,
          projectileCount: 3,
          moveSpeedMul: 1,
        },
        {
          name: "狂暴",
          attackPattern: "burst",
          attackCooldown: 0.7,
          projectileCount: 5,
          moveSpeedMul: 1.4,
        },
        {
          name: "绝望",
          attackPattern: "spread",
          attackCooldown: 0.9,
          projectileCount: 8,
          moveSpeedMul: 1.6,
        },
      ],
      phaseThresholds: [0.65, 0.35],
    },
    plaguebringer: {
      name: "疫祸",
      description: "范围毒雾型 Boss，持续施放腐蚀弹幕和自爆虫群",
      radius: 42,
      speed: 55,
      health: 4500,
      damage: 36,
      color: "#84cc16",
      secondaryColor: "#bef264",
      phases: [
        {
          name: "瘟疫",
          attackPattern: "spread",
          attackCooldown: 1.5,
          projectileCount: 6,
          moveSpeedMul: 1,
        },
        {
          name: "虫巢",
          attackPattern: "summon",
          attackCooldown: 2,
          projectileCount: 0,
          moveSpeedMul: 1.1,
        },
        {
          name: "灭绝",
          attackPattern: "laser",
          attackCooldown: 1.8,
          projectileCount: 1,
          moveSpeedMul: 0.8,
        },
      ],
      phaseThresholds: [0.7, 0.3],
    },
    titan: {
      name: "泰坦",
      description: "高护甲重装型 Boss，周期性召唤护盾并释放震荡波",
      radius: 48,
      speed: 45,
      health: 6000,
      damage: 60,
      color: "#f43f5e",
      secondaryColor: "#fda4af",
      phases: [
        {
          name: "碾压",
          attackPattern: "single",
          attackCooldown: 1.8,
          projectileCount: 1,
          moveSpeedMul: 1,
        },
        {
          name: "护盾",
          attackPattern: "single",
          attackCooldown: 1.4,
          projectileCount: 2,
          moveSpeedMul: 1.2,
        },
        {
          name: "震荡",
          attackPattern: "spread",
          attackCooldown: 1.5,
          projectileCount: 12,
          moveSpeedMul: 0.9,
        },
      ],
      phaseThresholds: [0.6, 0.25],
    },
    ravager: {
      name: "掠夺者",
      description: "极速猎杀型 Boss，闪避弹幕并发动连续冲锋",
      radius: 32,
      speed: 120,
      health: 3600,
      damage: 50,
      color: "#f59e0b",
      secondaryColor: "#fcd34d",
      phases: [
        {
          name: "掠食",
          attackPattern: "burst",
          attackCooldown: 0.9,
          projectileCount: 2,
          moveSpeedMul: 1,
        },
        {
          name: "奔袭",
          attackPattern: "charge",
          attackCooldown: 1.2,
          projectileCount: 0,
          moveSpeedMul: 1.6,
        },
        {
          name: "撕裂",
          attackPattern: "spread",
          attackCooldown: 0.6,
          projectileCount: 5,
          moveSpeedMul: 1.3,
        },
      ],
      phaseThresholds: [0.7, 0.3],
    },
    siren: {
      name: "塞壬",
      description: "精神控制型 Boss，召唤信徒并释放追踪音波",
      radius: 34,
      speed: 65,
      health: 4200,
      damage: 40,
      color: "#8b5cf6",
      secondaryColor: "#c4b5fd",
      phases: [
        {
          name: "低语",
          attackPattern: "single",
          attackCooldown: 1.4,
          projectileCount: 1,
          moveSpeedMul: 1,
        },
        {
          name: "合唱",
          attackPattern: "summon",
          attackCooldown: 2,
          projectileCount: 0,
          moveSpeedMul: 1.1,
        },
        {
          name: "狂想",
          attackPattern: "burst",
          attackCooldown: 0.8,
          projectileCount: 6,
          moveSpeedMul: 1.4,
        },
      ],
      phaseThresholds: [0.65, 0.3],
    },
    colossus: {
      name: "巨像",
      description: "机械据点核心，能召唤大量无人机并释放震荡波",
      radius: 52,
      speed: 38,
      health: 9000,
      damage: 55,
      color: "#f43f5e",
      secondaryColor: "#fda4af",
      phases: [
        {
          name: "压制",
          attackPattern: "spread",
          attackCooldown: 1.6,
          projectileCount: 8,
          moveSpeedMul: 1,
        },
        {
          name: "召唤",
          attackPattern: "summon",
          attackCooldown: 2.2,
          projectileCount: 0,
          moveSpeedMul: 1.1,
        },
        {
          name: "毁灭",
          attackPattern: "laser",
          attackCooldown: 1.4,
          projectileCount: 1,
          moveSpeedMul: 0.8,
        },
      ],
      phaseThresholds: [0.7, 0.35],
    },
    dreadnought: {
      name: "无畏舰",
      description: "机械舰队核心，倾泻导弹弹幕并部署突击无人机",
      radius: 50,
      speed: 42,
      health: 9500,
      damage: 58,
      color: "#64748b",
      secondaryColor: "#94a3b8",
      phases: [
        {
          name: "弹幕",
          attackPattern: "burst",
          attackCooldown: 1.4,
          projectileCount: 4,
          moveSpeedMul: 1,
        },
        {
          name: "发射舱",
          attackPattern: "summon",
          attackCooldown: 2.4,
          projectileCount: 0,
          moveSpeedMul: 1.1,
        },
        {
          name: "聚能打击",
          attackPattern: "laser",
          attackCooldown: 1.6,
          projectileCount: 1,
          moveSpeedMul: 0.85,
        },
      ],
      phaseThresholds: [0.7, 0.35],
    },
    juggernaut: {
      name: "主宰",
      description: "重型装甲 walker，碾压路径上的障碍并释放 EMP 震荡",
      radius: 46,
      speed: 48,
      health: 8200,
      damage: 52,
      color: "#475569",
      secondaryColor: "#38bdf8",
      phases: [
        {
          name: "推进",
          attackPattern: "single",
          attackCooldown: 1.7,
          projectileCount: 1,
          moveSpeedMul: 1,
        },
        {
          name: "震荡",
          attackPattern: "spread",
          attackCooldown: 1.8,
          projectileCount: 10,
          moveSpeedMul: 1.15,
        },
        {
          name: "超载",
          attackPattern: "burst",
          attackCooldown: 0.9,
          projectileCount: 6,
          moveSpeedMul: 1.2,
        },
      ],
      phaseThresholds: [0.65, 0.3],
    },
    annihilator: {
      name: "歼灭者",
      description: "机械要塞核心，倾泻导弹弹幕并召唤自动炮塔协防",
      radius: 54,
      speed: 44,
      health: 11000,
      damage: 62,
      color: "#b45309",
      secondaryColor: "#fbbf24",
      phases: [
        {
          name: "导弹齐射",
          attackPattern: "burst",
          attackCooldown: 1.5,
          projectileCount: 5,
          moveSpeedMul: 1,
        },
        {
          name: "炮火覆盖",
          attackPattern: "spread",
          attackCooldown: 1.8,
          projectileCount: 10,
          moveSpeedMul: 1.1,
        },
        {
          name: "歼灭光束",
          attackPattern: "laser",
          attackCooldown: 1.6,
          projectileCount: 1,
          moveSpeedMul: 0.85,
        },
      ],
      phaseThresholds: [0.7, 0.35],
    },
    hive: {
      name: "蜂巢",
      description: "机械虫巢母舰，无限孵化无人机并释放腐蚀性酸液",
      radius: 50,
      speed: 52,
      health: 9500,
      damage: 45,
      color: "#65a30d",
      secondaryColor: "#bef264",
      phases: [
        {
          name: "孵化",
          attackPattern: "summon",
          attackCooldown: 2.2,
          projectileCount: 0,
          moveSpeedMul: 1,
        },
        {
          name: "酸蚀暴雨",
          attackPattern: "spread",
          attackCooldown: 1.4,
          projectileCount: 8,
          moveSpeedMul: 1.2,
        },
        {
          name: "虫巢过载",
          attackPattern: "burst",
          attackCooldown: 1,
          projectileCount: 6,
          moveSpeedMul: 1.3,
        },
      ],
      phaseThresholds: [0.68, 0.32],
    },
  },

  difficulty: {
    baseInterval: 1.45,
    intervalDecay: 0.06,
    minInterval: 0.32,
    baseCount: 1,
    countGrowth: 0.5,
    maxCount: 12,
    difficultyGrowth: 0.022,
    eliteChanceBase: 0,
    eliteChanceGrowth: 0.012,
    eliteChanceMax: 0.22,
    affixCountThresholds: [3, 6, 10, 15],
    hordeSpawnInterval: 0.22,
    hordeSpawnCount: 4,
  },

  progression: {
    xpBase: 6,
    xpGrowth: 0.5,
    xpCurve: 1.18,
    passiveMaxLevel: 5,
    weaponMaxLevel: 5,
    maxWeapons: 3,
  },

  pickups: {
    xpBaseValue: 6,
    xpDifficultyScale: 0.15,
    healthValue: 25,
    resourceValue: 1,
    chestDropCount: 4,
    chestEliteChance: 0.25,
    magnetBoostMul: 1.8,
    magnetBoostDuration: 8,
  },

  modes: {
    campaignMissions: [
      { type: "eliminate", title: "外围清剿", description: "消灭 30 个感染者", target: 30 },
      { type: "collect", title: "资源回收", description: "收集 15 个补给箱", target: 15 },
      {
        type: "rescue",
        title: "营救信号",
        description: "抵达信标并防守 30 秒",
        target: 30,
        timeLimit: 45,
      },
      {
        type: "extract",
        title: "安全撤离",
        description: "抵达撤离点并存活至直升机到达",
        target: 1,
      },
    ],
    defenseMissions: [
      {
        type: "defendCore",
        title: "核心防线",
        description: "核心生命值保持在 60% 以上完成第 3 波",
        target: 3,
      },
      {
        type: "captureNodes",
        title: "节点扩张",
        description: "占领 3 个能量节点",
        target: 3,
      },
      {
        type: "surviveTimer",
        title: "极限坚守",
        description: "在核心存活的前提下坚守 90 秒",
        target: 90,
        timeLimit: 120,
      },
    ],
    defenseCompletionRewards: {
      baseXp: 300,
      baseResources: 20,
      baseScore: 1000,
      coreHighHealthThreshold: 0.75,
      coreMidHealthThreshold: 0.4,
      coreHighHealthBonus: 1.3,
      coreMidHealthBonus: 1.0,
      coreLowHealthBonus: 0.7,
      nodeBonusPerNode: 0.1,
      waveBonusMax: 0.5,
    },
    endlessWaveDuration: 60,
    endlessDifficultyBump: 0.5,
    endlessBossWaveInterval: 5,
    dailyModifiers: [
      {
        id: "ammo_shortage",
        title: "弹药短缺",
        description: "所有武器射速降低 25%",
        apply: (state) => {
          for (const weapon of state.player.weapons) {
            weapon.cooldown *= 1.25;
          }
        },
        revert: (state) => {
          for (const weapon of state.player.weapons) {
            weapon.cooldown /= 1.25;
          }
        },
      },
      {
        id: "infection_surge",
        title: "感染加剧",
        description: "敌人移动速度提升 20%",
        apply: (state) => {
          state.difficulty += 2;
        },
      },
      {
        id: "resource_drought",
        title: "资源匮乏",
        description: "经验获取降低 30%",
        apply: (state) => {
          state.player.xpToNext *= 1.3;
        },
      },
      {
        id: "elite_swarm",
        title: "精英横行",
        description: "精英敌人出现概率翻倍",
        apply: () => {
          // Applied in spawn logic via daily modifier flag
        },
      },
      {
        id: "glass_cannon",
        title: "玻璃大炮",
        description: "玩家伤害 +50%，生命值上限 -30%",
        apply: (state) => {
          state.player.maxHealth *= 0.7;
          state.player.health = Math.min(state.player.health, state.player.maxHealth);
          for (const weapon of state.player.weapons) {
            weapon.damage *= 1.5;
          }
        },
      },
      {
        id: "dense_horde",
        title: "密集尸潮",
        description: "敌人生成数量 +2，但生命值降低 20%",
        apply: () => {
          // Spawn count offset applied in engine via modifier flag
        },
      },
      {
        id: "volatile_kills",
        title: "连锁爆炸",
        description: "敌人死亡时 25% 几率引发小范围爆炸",
        apply: () => {
          // Applied in engine death logic via modifier flag
        },
      },
      {
        id: "rapid_evolution",
        title: "急速进化",
        description: "难度增长速度翻倍",
        apply: () => {
          // Applied in engine difficulty growth via modifier flag
        },
      },
    ],
    roguelikeStages: [
      { type: "combat", name: "区域 1", targetMul: 20 },
      { type: "combat", name: "区域 2", targetMul: 28 },
      { type: "elite", name: "精英据点", targetMul: 15 },
      { type: "combat", name: "区域 3", targetMul: 36 },
      { type: "reward", name: "补给站", targetMul: 0 },
      { type: "boss", name: "最终决战", targetMul: 1 },
    ],
    roguelikeRewards: [
      {
        id: "health_boost",
        name: "生命增幅",
        description: "最大生命值 +30",
        apply: (player) => {
          player.maxHealth += 30;
          player.health += 30;
        },
      },
      {
        id: "speed_boost",
        name: "机动超载",
        description: "移动速度 +15%",
        apply: (player) => {
          player.speed *= 1.15;
        },
      },
      {
        id: "damage_boost",
        name: "武器过载",
        description: "所有武器伤害 +20%",
        apply: (player) => {
          for (const weapon of player.weapons) {
            weapon.damage *= 1.2;
          }
        },
      },
      {
        id: "cooldown_boost",
        name: "极速核心",
        description: "所有武器冷却 -15%",
        apply: (player) => {
          for (const weapon of player.weapons) {
            weapon.cooldown *= 0.85;
          }
        },
      },
      {
        id: "magnet_boost",
        name: "引力增强",
        description: "拾取范围 +30%",
        apply: (player) => {
          player.magnetRange *= 1.3;
        },
      },
      {
        id: "armor_boost",
        name: "装甲镀层",
        description: "护甲 +12%",
        apply: (player) => {
          player.armor += 0.12;
        },
      },
    ],
  },
};

// ========================================================================
// 计算辅助函数
// ========================================================================

export function getWeaponBase(id: WeaponId): Weapon {
  const cfg = DEFAULT_BALANCE.weapons[id];
  return {
    id,
    name: cfg.name,
    level: 1,
    maxLevel: cfg.maxLevel,
    cooldown: cfg.base.cooldown,
    timer: 0,
    damage: cfg.base.damage,
    range: cfg.base.range,
    projectileSpeed: cfg.base.projectileSpeed,
    count: cfg.base.count,
    spread: cfg.base.spread,
    pierce: cfg.base.pierce,
    color: cfg.color,
    description: cfg.description,
    areaRadius: cfg.base.areaRadius,
    burnDuration: cfg.base.burnDuration,
    chainCount: cfg.base.chainCount,
    chainRange: cfg.base.chainRange,
    freezeDuration: cfg.base.freezeDuration,
    gravityRadius: cfg.base.gravityRadius,
    pullStrength: cfg.base.pullStrength,
    homing: cfg.base.homing,
    isMelee: cfg.base.isMelee,
    swarmCount: cfg.base.swarmCount,
  };
}

export function upgradeWeaponFromBalance(weapon: Weapon): Weapon {
  const cfg = DEFAULT_BALANCE.weapons[weapon.id];
  const next = { ...weapon };
  if (next.level >= next.maxLevel) return next;
  next.level += 1;

  const step = cfg.upgrades.find((u) => u.level === next.level);
  if (!step) return next;

  if (step.damageMul) next.damage = Math.round(next.damage * step.damageMul);
  if (step.cooldownMul) next.cooldown *= step.cooldownMul;
  if (step.rangeMul) next.range *= step.rangeMul;
  if (step.countAdd) next.count += step.countAdd;
  if (step.pierceAdd) next.pierce += step.pierceAdd;
  if (step.areaMul) next.areaRadius = (next.areaRadius ?? 60) * step.areaMul;
  if (step.burnAdd) next.burnDuration = (next.burnDuration ?? 2) + step.burnAdd;
  if (step.chainCountAdd) next.chainCount = (next.chainCount ?? 0) + step.chainCountAdd;
  if (step.chainRangeMul) next.chainRange = (next.chainRange ?? 120) * step.chainRangeMul;
  if (step.freezeDurationAdd)
    next.freezeDuration = (next.freezeDuration ?? 0) + step.freezeDurationAdd;
  if (step.gravityRadiusMul)
    next.gravityRadius = (next.gravityRadius ?? 120) * step.gravityRadiusMul;
  if (step.pullStrengthMul) next.pullStrength = (next.pullStrength ?? 100) * step.pullStrengthMul;
  if (step.swarmCountAdd) next.swarmCount = (next.swarmCount ?? 0) + step.swarmCountAdd;

  return next;
}

export function getWeaponDps(weapon: Weapon): number {
  const effectiveCooldown = Math.max(0.04, weapon.cooldown);
  const projectilesPerSecond = weapon.count / effectiveCooldown;
  return weapon.damage * projectilesPerSecond;
}

export function getDifficultyScaledHealth(difficulty: number, variant: EnemyVariant): number {
  const base = DEFAULT_BALANCE.enemies.base;
  const v = DEFAULT_BALANCE.enemies[variant] ?? base;
  const baseHealth = 30 + difficulty * 8;
  return Math.floor(baseHealth * v.healthMul);
}

export function getSpawnInterval(difficulty: number): number {
  const cfg = DEFAULT_BALANCE.difficulty;
  return Math.max(cfg.minInterval, cfg.baseInterval - difficulty * cfg.intervalDecay);
}

export function getSpawnCount(difficulty: number): number {
  const cfg = DEFAULT_BALANCE.difficulty;
  return Math.min(cfg.maxCount, Math.floor(cfg.baseCount + difficulty * cfg.countGrowth));
}

export function getEliteSpawnChance(difficulty: number): number {
  const cfg = DEFAULT_BALANCE.difficulty;
  if (difficulty < 3) return 0;
  return Math.min(
    cfg.eliteChanceMax,
    cfg.eliteChanceBase + (difficulty - 3) * cfg.eliteChanceGrowth
  );
}

export function getEliteAffixCountFromBalance(difficulty: number): number {
  const thresholds = DEFAULT_BALANCE.difficulty.affixCountThresholds;
  for (let i = 0; i < thresholds.length; i++) {
    if (difficulty < thresholds[i]) return i + 1;
  }
  return thresholds.length;
}

/**
 * 机械派系精英敌人的推荐词缀组合。
 * 这些组合会强化机械单位的协同威胁，而不是随机堆叠。
 */
export const MECHANICAL_ELITE_AFFIX_COMBOS: AffixId[][] = [
  ["shielded", "swift"],
  ["taunting", "regenerating"],
  ["explosive", "swift"],
  ["freezing", "shielded"],
  ["corrosive", "taunting"],
  ["splitting", "swift"],
];

export function getMechanicalEliteAffixes(difficulty: number): AffixId[] {
  const count = Math.min(2, getEliteAffixCountFromBalance(difficulty));
  const pool = [...MECHANICAL_ELITE_AFFIX_COMBOS];
  const combo = pool[Math.floor(Math.random() * pool.length)];
  return combo.slice(0, count);
}

export function getDefenseWaveDifficultyMultiplier(waveIndex: number): number {
  return 1 + waveIndex * 0.12;
}

export function getXpToNext(level: number): number {
  const cfg = DEFAULT_BALANCE.player;
  return Math.floor(cfg.levelXpMultiplier * Math.pow(cfg.levelXpCurve, level - 1));
}

export function getXpValue(enemy: Enemy, difficulty: number): number {
  const cfg = DEFAULT_BALANCE.pickups;
  return Math.floor(enemy.xpValue * (1 + difficulty * cfg.xpDifficultyScale));
}

export function applyDailyModifiers(state: GameState): void {
  const modifiers = getDailyModifiersFromBalance();
  for (const mod of modifiers) {
    mod.apply(state);
  }
}

export function getDailyModifiersFromBalance(): DailyModifierBalance[] {
  const cfg = DEFAULT_BALANCE.modes.dailyModifiers;
  const seed = generateDailySeed();
  const rng = seededRandom(Number.parseInt(seed, 10));
  const count = 1 + Math.floor(rng() * 2);
  const result: DailyModifierBalance[] = [];
  const pool = [...cfg];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}

export function generateRoguelikeStagesFromBalance(seed: number): RoguelikeStage[] {
  const cfg = DEFAULT_BALANCE.modes.roguelikeStages;
  const rng = seededRandom(seed);
  return cfg.map((stage, index) => {
    const isBoss = stage.type === "boss";
    const isElite = stage.type === "elite";
    const target = isBoss ? 1 : isElite ? stage.targetMul + index * 5 : stage.targetMul + index * 8;
    return {
      id: `rl_${index}`,
      name: stage.name,
      type: stage.type,
      mission: {
        id: `rl_m_${index}`,
        type: isBoss ? "eliminate" : "eliminate",
        title: isBoss ? "击败区域首领" : isElite ? "清剿精英" : "清剿感染者",
        description: `消灭 ${target} 个感染者`,
        target,
        progress: 0,
        completed: false,
        elapsed: 0,
      },
      rewardOptions: stage.type === "reward" ? 3 : undefined,
      cleared: false,
    };
  });
}

export function getRoguelikeRewards(count: number, player: Player): RoguelikeRewardBalance[] {
  const cfg = DEFAULT_BALANCE.modes.roguelikeRewards;
  const rewards: RoguelikeRewardBalance[] = [];
  const pool = [...cfg];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    rewards.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return rewards;
}

export function applyRoguelikeReward(player: Player, rewardId: string): boolean {
  const reward = DEFAULT_BALANCE.modes.roguelikeRewards.find((r) => r.id === rewardId);
  if (!reward) return false;
  reward.apply(player);
  return true;
}

export function generateCampaignMissionsFromBalance(): import("./types").Mission[] {
  const cfg = DEFAULT_BALANCE.modes.campaignMissions;
  return cfg.map((template, index) => ({
    id: `m${index + 1}`,
    type: template.type,
    title: template.title,
    description: template.description,
    target: template.target,
    progress: 0,
    completed: false,
    elapsed: 0,
    timeLimit: template.timeLimit,
  }));
}

export function generateEndlessMissionsFromBalance(wave: number): import("./types").Mission[] {
  return [
    {
      id: "endless_survive",
      type: "survive",
      title: "坚守",
      description: `在无尽感染潮中存活 ${120 + wave * 30} 秒`,
      target: 120 + wave * 30,
      progress: 0,
      completed: false,
      elapsed: 0,
    },
  ];
}

export function generateDefenseMissionsFromBalance(seed?: number): import("./types").Mission[] {
  const cfg = DEFAULT_BALANCE.modes.defenseMissions;
  let templates = cfg.map((template, originalIndex) => ({ ...template, originalIndex }));
  if (seed) {
    const rng = seededRandom(seed + 2654435761);
    const keyed = templates.map((template) => ({ template, key: rng() }));
    keyed.sort((a, b) => a.key - b.key);
    templates = keyed.map((k) => k.template);
  }
  return templates.map((template) => ({
    id: `def_${template.originalIndex + 1}`,
    type: template.type,
    title: template.title,
    description: template.description,
    target: template.target,
    progress: 0,
    completed: false,
    elapsed: 0,
    timeLimit: template.timeLimit,
  }));
}

export interface DefenseCompletionRewardSnapshot {
  xp: number;
  resources: number;
  energy: number;
  score: number;
}

export function calculateDefenseCompletionRewardFromBalance(
  coreHealth: number,
  coreMaxHealth: number,
  capturedNodes: number,
  completedWaves: number,
  totalWaves: number,
  energy: number
): DefenseCompletionRewardSnapshot {
  const cfg = DEFAULT_BALANCE.modes.defenseCompletionRewards;
  const ratio = coreHealth / Math.max(1, coreMaxHealth);

  let coreBonus: number;
  if (ratio >= cfg.coreHighHealthThreshold) {
    coreBonus = cfg.coreHighHealthBonus;
  } else if (ratio >= cfg.coreMidHealthThreshold) {
    coreBonus = cfg.coreMidHealthBonus;
  } else {
    coreBonus = cfg.coreLowHealthBonus;
  }

  const nodeBonus = 1 + capturedNodes * cfg.nodeBonusPerNode;
  const waveBonus = 1 + (completedWaves / Math.max(1, totalWaves)) * cfg.waveBonusMax;

  return {
    xp: Math.floor(cfg.baseXp * coreBonus * nodeBonus * waveBonus),
    resources: Math.floor(cfg.baseResources * nodeBonus),
    energy,
    score: Math.floor(cfg.baseScore * coreBonus * nodeBonus * waveBonus),
  };
}

export function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function getModeDifficultyMultiplier(
  mode: import("./types").GameModeType,
  stageIndex = 0
): number {
  switch (mode) {
    case "campaign":
      return 1;
    case "endless":
      return 1 + stageIndex * 0.08;
    case "daily":
      return 1.15;
    case "roguelike":
      return 1 + stageIndex * 0.12;
    case "defense":
      return 1 + stageIndex * 0.1;
    default:
      return 1;
  }
}

export function scaleHealthForMode(
  health: number,
  mode: import("./types").GameModeType,
  stageIndex = 0
): number {
  return Math.floor(health * getModeDifficultyMultiplier(mode, stageIndex));
}

export function getDailyModifierIds(): string[] {
  return DEFAULT_BALANCE.modes.dailyModifiers.map((m) => m.id);
}

export function generateDailySeed(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
}

// ========================================================================
// 被动道具配置（与 balance 同步）
// ========================================================================

export interface PassiveBalanceDef {
  id: PassiveId;
  name: string;
  description: string;
  color: string;
  maxLevel: number;
  apply: (p: Player) => void;
}

export const PASSIVE_BALANCE_DEFS: PassiveBalanceDef[] = [
  {
    id: "maxHealth",
    name: "生命强化",
    description: "最大生命值 +20",
    color: "#f43f5e",
    maxLevel: 5,
    apply: (p) => {
      p.maxHealth += 20;
      p.health += 20;
    },
  },
  {
    id: "speed",
    name: "机动增强",
    description: "移动速度 +6%",
    color: "#22d3ee",
    maxLevel: 5,
    apply: (p) => {
      p.speed *= 1.06;
    },
  },
  {
    id: "magnet",
    name: "磁力拾取",
    description: "拾取范围 +18%",
    color: "#f59e0b",
    maxLevel: 5,
    apply: (p) => {
      p.magnetRange *= 1.18;
    },
  },
  {
    id: "regen",
    name: "纳米修复",
    description: "每秒恢复 +1 生命",
    color: "#34d399",
    maxLevel: 5,
    apply: (p) => {
      p.regen += 1;
    },
  },
  {
    id: "armor",
    name: "外骨骼装甲",
    description: "受到伤害 -8%",
    color: "#64748b",
    maxLevel: 5,
    apply: (p) => {
      p.armor += 0.08;
    },
  },
  {
    id: "crit",
    name: "弱点解析",
    description: "暴击几率 +5%",
    color: "#ef4444",
    maxLevel: 5,
    apply: (p) => {
      p.critChance += 0.05;
    },
  },
  {
    id: "cooldown",
    name: "超频核心",
    description: "武器冷却 -5%",
    color: "#a855f7",
    maxLevel: 5,
    apply: (p) => {
      p.cooldownReduction += 0.05;
    },
  },
  {
    id: "area",
    name: "范围增幅",
    description: "范围效果 +10%",
    color: "#38bdf8",
    maxLevel: 5,
    apply: (p) => {
      p.areaMultiplier += 0.1;
    },
  },
];
