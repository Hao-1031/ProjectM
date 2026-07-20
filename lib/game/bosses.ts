import type { BossId, BossPhase, BossTemplate, Enemy, EnemyVariant } from "./types";
import { uid } from "./math";

export const BOSSES: Record<BossId, BossTemplate> = {
  overlord: {
    id: "overlord",
    name: "支配者",
    description: "高速突袭型 Boss，低血量时进入狂暴并召唤分身",
    radius: 38,
    speed: 90,
    health: 3000,
    damage: 35,
    color: "#e879f9",
    secondaryColor: "#f0abfc",
    phases: [
      {
        index: 0,
        name: "猎杀",
        attackPattern: "burst",
        attackCooldown: 1.2,
        projectileCount: 3,
        moveSpeedMultiplier: 1,
      },
      {
        index: 1,
        name: "狂暴",
        attackPattern: "burst",
        attackCooldown: 0.7,
        projectileCount: 5,
        moveSpeedMultiplier: 1.4,
      },
      {
        index: 2,
        name: "绝望",
        attackPattern: "spread",
        attackCooldown: 0.9,
        projectileCount: 8,
        moveSpeedMultiplier: 1.6,
        onEnter: (boss) => {
          boss.damage *= 1.3;
        },
      },
    ],
    phaseThresholds: [0.65, 0.35],
    onPhaseEnter: (boss) => {
      if (boss.phase === 1) {
        boss.speed *= 1.4;
      }
    },
  },
  plaguebringer: {
    id: "plaguebringer",
    name: "疫祸",
    description: "范围毒雾型 Boss，持续施放腐蚀弹幕和自爆虫群",
    radius: 42,
    speed: 55,
    health: 4500,
    damage: 28,
    color: "#84cc16",
    secondaryColor: "#bef264",
    phases: [
      {
        index: 0,
        name: "瘟疫",
        attackPattern: "spread",
        attackCooldown: 1.5,
        projectileCount: 6,
        moveSpeedMultiplier: 1,
      },
      {
        index: 1,
        name: "虫巢",
        attackPattern: "summon",
        attackCooldown: 2,
        projectileCount: 0,
        moveSpeedMultiplier: 1.1,
        onEnter: (boss, engine) => {
          engine as { state: { enemies: Enemy[] } };
          for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 * i) / 4;
            const dist = 80;
            // Summon will be handled by engine using this template
          }
        },
      },
      {
        index: 2,
        name: "灭绝",
        attackPattern: "laser",
        attackCooldown: 1.8,
        projectileCount: 1,
        moveSpeedMultiplier: 0.8,
      },
    ],
    phaseThresholds: [0.7, 0.3],
    onPhaseEnter: (boss) => {
      boss.radius += 4;
    },
  },
  titan: {
    id: "titan",
    name: "泰坦",
    description: "高护甲重装型 Boss，周期性召唤护盾并释放震荡波",
    radius: 48,
    speed: 45,
    health: 6000,
    damage: 50,
    color: "#f43f5e",
    secondaryColor: "#fda4af",
    phases: [
      {
        index: 0,
        name: "碾压",
        attackPattern: "single",
        attackCooldown: 1.8,
        projectileCount: 1,
        moveSpeedMultiplier: 1,
      },
      {
        index: 1,
        name: "护盾",
        attackPattern: "single",
        attackCooldown: 1.4,
        projectileCount: 2,
        moveSpeedMultiplier: 1.2,
        onEnter: (boss) => {
          boss.health = Math.min(boss.maxHealth, boss.health + boss.maxHealth * 0.2);
        },
      },
      {
        index: 2,
        name: "震荡",
        attackPattern: "spread",
        attackCooldown: 1.5,
        projectileCount: 12,
        moveSpeedMultiplier: 0.9,
      },
    ],
    phaseThresholds: [0.6, 0.25],
    onPhaseEnter: (boss) => {
      if (boss.phase === 2) {
        boss.damage *= 1.5;
      }
    },
  },
  ravager: {
    id: "ravager",
    name: "掠夺者",
    description: "极速猎杀型 Boss，闪避弹幕并发动连续冲锋",
    radius: 32,
    speed: 120,
    health: 3600,
    damage: 40,
    color: "#f59e0b",
    secondaryColor: "#fcd34d",
    phases: [
      {
        index: 0,
        name: "掠食",
        attackPattern: "burst",
        attackCooldown: 0.9,
        projectileCount: 2,
        moveSpeedMultiplier: 1,
      },
      {
        index: 1,
        name: "奔袭",
        attackPattern: "charge",
        attackCooldown: 1.2,
        projectileCount: 0,
        moveSpeedMultiplier: 1.6,
        onEnter: (boss) => {
          boss.speed *= 1.5;
        },
      },
      {
        index: 2,
        name: "撕裂",
        attackPattern: "spread",
        attackCooldown: 0.6,
        projectileCount: 5,
        moveSpeedMultiplier: 1.3,
      },
    ],
    phaseThresholds: [0.7, 0.3],
    onPhaseEnter: (boss) => {
      if (boss.phase === 1) {
        boss.damage *= 1.2;
      }
    },
  },
  siren: {
    id: "siren",
    name: "塞壬",
    description: "精神控制型 Boss，召唤信徒并释放追踪音波",
    radius: 34,
    speed: 65,
    health: 4200,
    damage: 32,
    color: "#8b5cf6",
    secondaryColor: "#c4b5fd",
    phases: [
      {
        index: 0,
        name: "低语",
        attackPattern: "single",
        attackCooldown: 1.4,
        projectileCount: 1,
        moveSpeedMultiplier: 1,
      },
      {
        index: 1,
        name: "合唱",
        attackPattern: "summon",
        attackCooldown: 2,
        projectileCount: 0,
        moveSpeedMultiplier: 1.1,
      },
      {
        index: 2,
        name: "狂想",
        attackPattern: "burst",
        attackCooldown: 0.8,
        projectileCount: 6,
        moveSpeedMultiplier: 1.4,
      },
    ],
    phaseThresholds: [0.65, 0.3],
    onPhaseEnter: (boss) => {
      if (boss.phase === 2) {
        boss.damage *= 1.25;
      }
    },
  },
  colossus: {
    id: "colossus",
    name: "巨像",
    description: "超重型攻城 Boss，缓慢推进并释放毁灭性震荡波",
    radius: 52,
    speed: 35,
    health: 8000,
    damage: 60,
    color: "#78716c",
    secondaryColor: "#d6d3d1",
    phases: [
      {
        index: 0,
        name: "碾压",
        attackPattern: "single",
        attackCooldown: 2,
        projectileCount: 1,
        moveSpeedMultiplier: 1,
      },
      {
        index: 1,
        name: "护盾",
        attackPattern: "spread",
        attackCooldown: 1.6,
        projectileCount: 8,
        moveSpeedMultiplier: 1.1,
      },
      {
        index: 2,
        name: "毁灭",
        attackPattern: "laser",
        attackCooldown: 2.2,
        projectileCount: 1,
        moveSpeedMultiplier: 0.8,
      },
    ],
    phaseThresholds: [0.7, 0.35],
    onPhaseEnter: (boss) => {
      if (boss.phase === 1) {
        boss.maxHealth = Math.round(boss.maxHealth * 1.1);
        boss.health = Math.min(boss.health + boss.maxHealth * 0.1, boss.maxHealth);
      }
    },
  },
  dreadnought: {
    id: "dreadnought",
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
        index: 0,
        name: "弹幕",
        attackPattern: "burst",
        attackCooldown: 1.4,
        projectileCount: 4,
        moveSpeedMultiplier: 1,
      },
      {
        index: 1,
        name: "发射舱",
        attackPattern: "summon",
        attackCooldown: 2.4,
        projectileCount: 0,
        moveSpeedMultiplier: 1.1,
        onEnter: (boss) => {
          boss.damage *= 1.15;
        },
      },
      {
        index: 2,
        name: "聚能打击",
        attackPattern: "laser",
        attackCooldown: 1.6,
        projectileCount: 1,
        moveSpeedMultiplier: 0.85,
        onEnter: (boss) => {
          boss.damage *= 1.25;
        },
      },
    ],
    phaseThresholds: [0.7, 0.35],
    onPhaseEnter: (boss) => {
      if (boss.phase === 1) {
        boss.speed *= 1.15;
      }
    },
  },
  juggernaut: {
    id: "juggernaut",
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
        index: 0,
        name: "推进",
        attackPattern: "single",
        attackCooldown: 1.7,
        projectileCount: 1,
        moveSpeedMultiplier: 1,
      },
      {
        index: 1,
        name: "震荡",
        attackPattern: "spread",
        attackCooldown: 1.8,
        projectileCount: 10,
        moveSpeedMultiplier: 1.15,
        onEnter: (boss) => {
          boss.radius += 4;
        },
      },
      {
        index: 2,
        name: "超载",
        attackPattern: "burst",
        attackCooldown: 0.9,
        projectileCount: 6,
        moveSpeedMultiplier: 1.2,
        onEnter: (boss) => {
          boss.damage *= 1.3;
        },
      },
    ],
    phaseThresholds: [0.65, 0.3],
    onPhaseEnter: (boss) => {
      if (boss.phase === 2) {
        boss.speed *= 1.2;
      }
    },
  },
  annihilator: {
    id: "annihilator",
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
        index: 0,
        name: "导弹齐射",
        attackPattern: "burst",
        attackCooldown: 1.5,
        projectileCount: 5,
        moveSpeedMultiplier: 1,
      },
      {
        index: 1,
        name: "炮火覆盖",
        attackPattern: "spread",
        attackCooldown: 1.8,
        projectileCount: 10,
        moveSpeedMultiplier: 1.1,
        onEnter: (boss) => {
          boss.damage *= 1.15;
        },
      },
      {
        index: 2,
        name: "歼灭光束",
        attackPattern: "laser",
        attackCooldown: 1.6,
        projectileCount: 1,
        moveSpeedMultiplier: 0.85,
        onEnter: (boss) => {
          boss.speed *= 1.25;
          boss.damage *= 1.25;
        },
      },
    ],
    phaseThresholds: [0.7, 0.35],
    onPhaseEnter: (boss) => {
      if (boss.phase === 1) {
        boss.radius += 4;
      }
    },
  },
  hive: {
    id: "hive",
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
        index: 0,
        name: "孵化",
        attackPattern: "summon",
        attackCooldown: 2.2,
        projectileCount: 0,
        moveSpeedMultiplier: 1,
      },
      {
        index: 1,
        name: "酸蚀暴雨",
        attackPattern: "spread",
        attackCooldown: 1.4,
        projectileCount: 8,
        moveSpeedMultiplier: 1.2,
        onEnter: (boss) => {
          boss.damage *= 1.2;
        },
      },
      {
        index: 2,
        name: "虫巢过载",
        attackPattern: "burst",
        attackCooldown: 1.0,
        projectileCount: 6,
        moveSpeedMultiplier: 1.3,
        onEnter: (boss) => {
          boss.speed *= 1.2;
        },
      },
    ],
    phaseThresholds: [0.68, 0.32],
    onPhaseEnter: (boss) => {
      if (boss.phase === 2) {
        boss.damage *= 1.15;
      }
    },
  },
};

export function getBossTemplate(id: BossId): BossTemplate {
  return BOSSES[id];
}

export function getRandomBossId(): BossId {
  const ids = Object.keys(BOSSES) as BossId[];
  return ids[Math.floor(Math.random() * ids.length)];
}

export function advanceBossPhase(boss: Enemy, engine?: unknown): void {
  if (boss.phase >= boss.phaseThresholds.length) return;
  boss.phase += 1;
  const template = BOSSES[boss.variant as BossId];
  if (!template) return;
  const phase = template.phases[Math.min(boss.phase, template.phases.length - 1)];
  boss.attackCooldown = phase.attackCooldown;
  boss.speed *= phase.moveSpeedMultiplier;
  phase.onEnter?.(boss, engine);
  template.onPhaseEnter?.(boss);
}

export function checkBossPhaseTransition(boss: Enemy, engine?: unknown): boolean {
  if (!boss.isBoss || boss.phase >= boss.phaseThresholds.length) return false;
  const threshold = boss.phaseThresholds[boss.phase];
  const healthPercent = boss.health / boss.maxHealth;
  if (healthPercent <= threshold) {
    advanceBossPhase(boss, engine);
    return true;
  }
  return false;
}

export function getBossAttackPattern(boss: Enemy): BossPhase {
  const template = BOSSES[boss.variant as BossId];
  if (!template) return DEFAULT_PHASE;
  return template.phases[Math.min(boss.phase, template.phases.length - 1)];
}

const DEFAULT_PHASE: BossPhase = {
  index: 0,
  name: "普通攻击",
  attackPattern: "single",
  attackCooldown: 1.5,
  projectileCount: 1,
  moveSpeedMultiplier: 1,
};

export interface BossSummonInfo {
  variant: EnemyVariant;
  count: number;
  radius: number;
  offsetRadius: number;
  eliteChance: number;
}

export const BOSS_SUMMONS: Record<BossId, BossSummonInfo[]> = {
  overlord: [{ variant: "runner", count: 3, radius: 12, offsetRadius: 70, eliteChance: 0 }],
  plaguebringer: [
    { variant: "walker", count: 4, radius: 13, offsetRadius: 90, eliteChance: 0.1 },
    { variant: "spitter", count: 2, radius: 12, offsetRadius: 110, eliteChance: 0 },
  ],
  titan: [{ variant: "tank", count: 2, radius: 16, offsetRadius: 100, eliteChance: 0.2 }],
  ravager: [{ variant: "runner", count: 4, radius: 11, offsetRadius: 60, eliteChance: 0 }],
  siren: [
    { variant: "walker", count: 5, radius: 12, offsetRadius: 80, eliteChance: 0 },
    { variant: "elite", count: 1, radius: 14, offsetRadius: 100, eliteChance: 1 },
  ],
  colossus: [{ variant: "tank", count: 3, radius: 16, offsetRadius: 120, eliteChance: 0.3 }],
  dreadnought: [
    { variant: "drone", count: 4, radius: 9, offsetRadius: 90, eliteChance: 0.1 },
    { variant: "stalker", count: 2, radius: 11, offsetRadius: 120, eliteChance: 0.2 },
  ],
  juggernaut: [
    { variant: "shielder", count: 2, radius: 18, offsetRadius: 100, eliteChance: 0.25 },
    { variant: "sentinel", count: 3, radius: 14, offsetRadius: 130, eliteChance: 0 },
  ],
  annihilator: [
    { variant: "artillery", count: 2, radius: 16, offsetRadius: 120, eliteChance: 0.2 },
    { variant: "sentinel", count: 3, radius: 14, offsetRadius: 150, eliteChance: 0.1 },
  ],
  hive: [
    { variant: "drone", count: 6, radius: 9, offsetRadius: 90, eliteChance: 0.05 },
    { variant: "raptor", count: 3, radius: 10, offsetRadius: 120, eliteChance: 0.15 },
    { variant: "stalker", count: 2, radius: 11, offsetRadius: 150, eliteChance: 0.2 },
  ],
};

export interface BossAbility {
  id: string;
  name: string;
  cooldown: number;
  condition: (boss: Enemy, time: number) => boolean;
}

export function getBossSummons(id: BossId): BossSummonInfo[] {
  return BOSS_SUMMONS[id] ?? [];
}

export function shouldBossSummon(boss: Enemy): boolean {
  const pattern = getBossAttackPattern(boss);
  return pattern.attackPattern === "summon";
}

export function getBossPhaseCount(id: BossId): number {
  return BOSSES[id]?.phases.length ?? 1;
}

export function isFinalPhase(boss: Enemy): boolean {
  const template = BOSSES[boss.variant as BossId];
  if (!template) return false;
  return boss.phase >= template.phases.length - 1;
}

export function getBossHealthPercent(boss: Enemy): number {
  return boss.health / boss.maxHealth;
}

export function getNextPhaseThreshold(boss: Enemy): number | null {
  if (boss.phase >= boss.phaseThresholds.length) return null;
  return boss.phaseThresholds[boss.phase];
}

export function formatBossName(boss: Enemy): string {
  const template = BOSSES[boss.variant as BossId];
  if (!template) return "未知首领";
  const pattern = getBossAttackPattern(boss);
  return `${template.name} - ${pattern.name}`;
}

export function getBossDifficultyMultiplier(difficulty: number): number {
  return 1 + (difficulty - 1) * 0.25;
}

export function scaleBossForDifficulty(boss: Enemy, difficulty: number): void {
  const multiplier = getBossDifficultyMultiplier(difficulty);
  boss.maxHealth = Math.round(boss.maxHealth * multiplier);
  boss.health = boss.maxHealth;
  boss.damage = Math.round(boss.damage * multiplier);
  boss.speed = Math.round(boss.speed * Math.min(multiplier, 1.5));
}

export function createBossEnemy(id: BossId, x: number, y: number): Enemy {
  const template = getBossTemplate(id);
  return {
    id: `boss_${id}_${uid()}`,
    x,
    y,
    radius: template.radius,
    speed: template.speed,
    health: template.health,
    maxHealth: template.health,
    damage: template.damage,
    xpValue: 500,
    color: template.color,
    variant: id,
    slow: 0,
    slowTimer: 0,
    freezeTimer: 0,
    droneMarkTimer: 0,
    isElite: true,
    isBoss: true,
    affixes: [],
    attackTimer: 0,
    attackCooldown: template.phases[0].attackCooldown,
    knockbackX: 0,
    knockbackY: 0,
    burnDuration: 0,
    phase: 0,
    phaseThresholds: [...template.phaseThresholds],
    targetCore: false,
    facing: 0,
    animation: "move",
    animationTimer: 0,
  };
}

export function getBossList(): { id: BossId; name: string; description: string }[] {
  return Object.values(BOSSES).map((b) => ({
    id: b.id as BossId,
    name: b.name,
    description: b.description,
  }));
}

// ========================================================================
// Boss 元数据与查询辅助
// ========================================================================

export type BossFaction = "biological" | "mechanical" | "energy" | "corrupted";
export type BossDifficultyTier = "standard" | "advanced" | "epic";

export interface BossMetadata {
  faction: BossFaction;
  tier: BossDifficultyTier;
  recommendedLevel: number;
  tags: string[];
  weakness: string[];
  resistance: string[];
  soundtrackIntensity: number;
}

export const BOSS_METADATA: Record<BossId, BossMetadata> = {
  overlord: {
    faction: "biological",
    tier: "standard",
    recommendedLevel: 5,
    tags: ["高速", "召唤", "狂暴"],
    weakness: ["冰冻", "束缚"],
    resistance: ["毒素"],
    soundtrackIntensity: 0.6,
  },
  plaguebringer: {
    faction: "biological",
    tier: "advanced",
    recommendedLevel: 8,
    tags: ["毒雾", "范围", "自爆虫"],
    weakness: ["火焰", "高爆"],
    resistance: ["毒素", "腐蚀"],
    soundtrackIntensity: 0.7,
  },
  titan: {
    faction: "mechanical",
    tier: "advanced",
    recommendedLevel: 10,
    tags: ["重装", "护盾", "震荡波"],
    weakness: ["穿甲", "电磁脉冲"],
    resistance: ["常规弹道", "火焰"],
    soundtrackIntensity: 0.75,
  },
  ravager: {
    faction: "biological",
    tier: "standard",
    recommendedLevel: 6,
    tags: ["极速", "冲锋", "连击"],
    weakness: ["减速", "地雷"],
    resistance: ["击退"],
    soundtrackIntensity: 0.65,
  },
  siren: {
    faction: "energy",
    tier: "advanced",
    recommendedLevel: 9,
    tags: ["召唤", "音波", "追踪"],
    weakness: ["电磁脉冲", "高爆"],
    resistance: ["精神控制"],
    soundtrackIntensity: 0.7,
  },
  colossus: {
    faction: "mechanical",
    tier: "epic",
    recommendedLevel: 12,
    tags: ["攻城", "护盾", "毁灭震荡"],
    weakness: ["集火", "穿甲", "EMP"],
    resistance: ["击退", "常规弹道"],
    soundtrackIntensity: 0.9,
  },
  dreadnought: {
    faction: "mechanical",
    tier: "epic",
    recommendedLevel: 13,
    tags: ["弹幕", "无人机", "聚能打击"],
    weakness: ["EMP", "冰冻"],
    resistance: ["火焰", "毒素"],
    soundtrackIntensity: 0.85,
  },
  juggernaut: {
    faction: "mechanical",
    tier: "epic",
    recommendedLevel: 14,
    tags: ["装甲", "碾压", "EMP 震荡"],
    weakness: ["穿甲", "高爆"],
    resistance: ["常规弹道", "击退"],
    soundtrackIntensity: 0.9,
  },
  annihilator: {
    faction: "mechanical",
    tier: "epic",
    recommendedLevel: 15,
    tags: ["导弹弹幕", "炮火覆盖", "歼灭光束", "自动炮塔"],
    weakness: ["EMP", "穿甲", "冰冻"],
    resistance: ["火焰", "毒素", "常规弹道"],
    soundtrackIntensity: 1,
  },
  hive: {
    faction: "mechanical",
    tier: "epic",
    recommendedLevel: 16,
    tags: ["虫巢", "无人机", "酸蚀", "孵化"],
    weakness: ["火焰", "范围伤害", "EMP"],
    resistance: ["毒素", "腐蚀"],
    soundtrackIntensity: 0.95,
  },
};

export function getBossMetadata(id: BossId): BossMetadata {
  return (
    BOSS_METADATA[id] ?? {
      faction: "biological",
      tier: "standard",
      recommendedLevel: 1,
      tags: [],
      weakness: [],
      resistance: [],
      soundtrackIntensity: 0.5,
    }
  );
}

export function getBossFaction(id: BossId): BossFaction {
  return getBossMetadata(id).faction;
}

export function getBossTier(id: BossId): BossDifficultyTier {
  return getBossMetadata(id).tier;
}

export function getBossRecommendedLevel(id: BossId): number {
  return getBossMetadata(id).recommendedLevel;
}

export function getBossTags(id: BossId): string[] {
  return [...getBossMetadata(id).tags];
}

export function isMechanicalBoss(id: BossId): boolean {
  return getBossFaction(id) === "mechanical";
}

export function isEnergyBoss(id: BossId): boolean {
  return getBossFaction(id) === "energy";
}

export function isBiologicalBoss(id: BossId): boolean {
  return getBossFaction(id) === "biological";
}

export function getBossWeakness(id: BossId): string[] {
  return [...getBossMetadata(id).weakness];
}

export function getBossResistance(id: BossId): string[] {
  return [...getBossMetadata(id).resistance];
}

export function getBossDescription(id: BossId): string {
  return BOSSES[id]?.description ?? "";
}

export function getBossColor(id: BossId): string {
  return BOSSES[id]?.color ?? "#94a3b8";
}

export function getBossSecondaryColor(id: BossId): string {
  return BOSSES[id]?.secondaryColor ?? "#cbd5e1";
}

export function getBossPhaseThreshold(id: BossId, phaseIndex: number): number | null {
  const template = BOSSES[id];
  if (!template) return null;
  if (phaseIndex < 0 || phaseIndex >= template.phaseThresholds.length) return null;
  return template.phaseThresholds[phaseIndex];
}

export function getBossPhaseName(id: BossId, phaseIndex: number): string {
  const template = BOSSES[id];
  if (!template) return "未知阶段";
  const phase = template.phases[Math.min(phaseIndex, template.phases.length - 1)];
  return phase?.name ?? "未知阶段";
}

export function formatBossPhaseName(boss: Enemy): string {
  return getBossPhaseName(boss.variant as BossId, boss.phase);
}

export function getBossRemainingPhaseHealth(boss: Enemy): number {
  const threshold = getNextPhaseThreshold(boss);
  if (threshold === null) return 0;
  const currentPercent = getBossHealthPercent(boss);
  return Math.max(0, (currentPercent - threshold) * 100);
}

export function getBossPhaseProgress(boss: Enemy): number {
  const thresholds = boss.phaseThresholds;
  if (thresholds.length === 0) return 1;
  const prevThreshold = boss.phase > 0 ? thresholds[boss.phase - 1] : 1;
  const nextThreshold = boss.phase < thresholds.length ? thresholds[boss.phase] : 0;
  const range = prevThreshold - nextThreshold;
  if (range <= 0) return 1;
  const current = getBossHealthPercent(boss);
  return Math.min(1, Math.max(0, (current - nextThreshold) / range));
}

export function getBossAttackPatternName(boss: Enemy): string {
  const pattern = getBossAttackPattern(boss);
  const names: Record<BossPhase["attackPattern"], string> = {
    single: "单发",
    spread: "散射",
    burst: "连射",
    summon: "召唤",
    laser: "激光",
    charge: "冲锋",
  };
  return names[pattern.attackPattern] ?? "攻击";
}

export function getBossBaseHealth(id: BossId): number {
  return BOSSES[id]?.health ?? 0;
}

export function getBossBaseDamage(id: BossId): number {
  return BOSSES[id]?.damage ?? 0;
}

export function getBossBaseSpeed(id: BossId): number {
  return BOSSES[id]?.speed ?? 0;
}

export function getBossBaseRadius(id: BossId): number {
  return BOSSES[id]?.radius ?? 0;
}

export function getBossSoundtrackIntensity(id: BossId): number {
  return getBossMetadata(id).soundtrackIntensity;
}

export function getBossSummonTotalCount(id: BossId): number {
  return getBossSummons(id).reduce((sum, info) => sum + info.count, 0);
}

export function getBossByTier(tier: BossDifficultyTier): BossId[] {
  return (Object.keys(BOSS_METADATA) as BossId[]).filter((id) => BOSS_METADATA[id].tier === tier);
}

export function getMechanicalBossIds(): BossId[] {
  return (Object.keys(BOSS_METADATA) as BossId[]).filter(isMechanicalBoss);
}

export function getEpicBossIds(): BossId[] {
  return getBossByTier("epic");
}

export function sortBossesByDifficulty(): BossId[] {
  return (Object.keys(BOSS_METADATA) as BossId[]).sort(
    (a, b) => BOSS_METADATA[a].recommendedLevel - BOSS_METADATA[b].recommendedLevel
  );
}

export function getBossUnlockLevel(id: BossId): number {
  return getBossRecommendedLevel(id);
}

export function isBossUnlocked(id: BossId, playerLevel: number): boolean {
  return playerLevel >= getBossUnlockLevel(id);
}

export function getBossDamagePerSecond(boss: Enemy): number {
  const pattern = getBossAttackPattern(boss);
  if (pattern.attackCooldown <= 0) return 0;
  const projectilesPerSecond = pattern.projectileCount / pattern.attackCooldown;
  return boss.damage * projectilesPerSecond;
}

export interface BossSelectionOption {
  id: BossId;
  name: string;
  description: string;
  tier: BossDifficultyTier;
  recommendedLevel: number;
  faction: BossFaction;
}

export function getBossSelectionOptions(): BossSelectionOption[] {
  return Object.values(BOSSES).map((b) => {
    const meta = getBossMetadata(b.id as BossId);
    return {
      id: b.id as BossId,
      name: b.name,
      description: b.description,
      tier: meta.tier,
      recommendedLevel: meta.recommendedLevel,
      faction: meta.faction,
    };
  });
}
