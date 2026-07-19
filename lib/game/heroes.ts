import type { HeroId, HeroSkill, Player, GameState, Deployable, Enemy } from "./types";
import { uid, distance, angleBetween, normalize, clamp } from "./math";

export interface HeroDef {
  id: HeroId;
  name: string;
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
}

const BASE_SKILL_RANGE = 220;

export const HERO_DEFS: Record<HeroId, HeroDef> = {
  scout: {
    id: "scout",
    name: "侦察",
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
  },
  assault: {
    id: "assault",
    name: "突击",
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
  },
  medic: {
    id: "medic",
    name: "医疗",
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
    passive: { regenAdd: 1.5, maxHealthMul: 0.95 },
  },
  engineer: {
    id: "engineer",
    name: "工程",
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
  },
};

export function applyHeroToPlayer(player: Player, heroId: HeroId): Player {
  const def = HERO_DEFS[heroId];
  if (!def) return player;

  player.heroId = heroId;
  player.activeSkill = { ...def.skill, timer: 0 };
  player.skillTimer = 0;

  if (def.passive.maxHealthMul) {
    player.maxHealth = Math.floor(player.maxHealth * def.passive.maxHealthMul);
    player.health = player.maxHealth;
  }
  if (def.passive.speedMul) player.speed *= def.passive.speedMul;
  if (def.passive.armorAdd) player.armor += def.passive.armorAdd;
  if (def.passive.critAdd) player.critChance += def.passive.critAdd;
  if (def.passive.regenAdd) player.regen += def.passive.regenAdd;
  if (def.passive.cooldownReductionAdd) player.cooldownReduction += def.passive.cooldownReductionAdd;
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

  switch (player.heroId) {
    case "scout": {
      ds.deployables.push({
        id: uid("deploy"),
        x: deployX,
        y: deployY,
        radius: 90,
        type: "beacon",
        ownerId: player.id,
        health: 1,
        maxHealth: 1,
        timer: skill.duration,
        maxTimer: skill.duration,
        color: def.color,
      });
      break;
    }
    case "assault": {
      ds.deployables.push({
        id: uid("deploy"),
        x: deployX,
        y: deployY,
        radius: 70,
        type: "shield",
        ownerId: player.id,
        health: 600,
        maxHealth: 600,
        timer: skill.duration,
        maxTimer: skill.duration,
        color: def.color,
      });
      break;
    }
    case "medic": {
      ds.deployables.push({
        id: uid("deploy"),
        x: deployX,
        y: deployY,
        radius: 100,
        type: "healAura",
        ownerId: player.id,
        health: 1,
        maxHealth: 1,
        timer: skill.duration,
        maxTimer: skill.duration,
        color: def.color,
      });
      break;
    }
    case "engineer": {
      ds.deployables.push({
        id: uid("deploy"),
        x: deployX,
        y: deployY,
        radius: 28,
        type: "turret",
        ownerId: player.id,
        health: 350,
        maxHealth: 350,
        timer: skill.duration,
        maxTimer: skill.duration,
        fireTimer: 0,
        fireCooldown: 0.45,
        color: def.color,
      });
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

    if (d.type === "healAura") {
      for (const player of players) {
        if (distance(player, d) <= d.radius + player.radius) {
          player.health = Math.min(player.maxHealth, player.health + 12 * dt);
        }
      }
    }

    if (d.type === "turret") {
      d.fireTimer = (d.fireTimer ?? 0) - dt;
      if (d.fireTimer <= 0) {
        const target = findNearestEnemy(state, d.x, d.y, 420);
        if (target) {
          fireTurretProjectile(state, d, target);
          d.fireTimer = d.fireCooldown ?? 0.45;
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

function fireTurretProjectile(state: GameState, d: Deployable, target: Enemy): void {
  const angle = angleBetween(d, target);
  const speed = 760;
  state.projectiles.push({
    id: uid("proj"),
    x: d.x + Math.cos(angle) * 24,
    y: d.y + Math.sin(angle) * 24,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 4,
    damage: 28,
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

  for (let i = ds.deployables.length - 1; i >= 0; i--) {
    const d = ds.deployables[i];
    if (d.type !== "mine") continue;
    for (const enemy of state.enemies) {
      if (distance(enemy, d) <= d.radius + enemy.radius) {
        // Explosion
        for (const other of state.enemies) {
          if (distance(other, d) <= 100 + other.radius) {
            other.health -= 120;
          }
        }
        ds.deployables.splice(i, 1);
        break;
      }
    }
  }
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
