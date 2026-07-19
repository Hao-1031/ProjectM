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
