import type { Weapon, UpgradeOption, Player, PassiveItem, WeaponId, PassiveId } from "./types";
import { uid } from "./math";
import {
  DEFAULT_BALANCE,
  getWeaponBase,
  upgradeWeaponFromBalance,
  PASSIVE_BALANCE_DEFS,
} from "./balance";
import { HERO_DEFS, applyHeroTalent } from "./heroes";

export function createPulseRifle(): Weapon {
  return getWeaponBase("pulse");
}

export function createShotgun(): Weapon {
  return getWeaponBase("shotgun");
}

export function createLaser(): Weapon {
  return getWeaponBase("laser");
}

export function createRocketLauncher(): Weapon {
  return getWeaponBase("rocket");
}

export function createFlamethrower(): Weapon {
  return getWeaponBase("flame");
}

export function createDroneSwarm(): Weapon {
  return getWeaponBase("drone");
}

export function createPlasmaRifle(): Weapon {
  return getWeaponBase("plasma");
}

export function createRailgun(): Weapon {
  return getWeaponBase("railgun");
}

export function createSwarmLauncher(): Weapon {
  return getWeaponBase("swarm");
}

export function createGaussRifle(): Weapon {
  return getWeaponBase("gauss");
}

export function createArcCaster(): Weapon {
  return getWeaponBase("arcCaster");
}

export function createCryoLauncher(): Weapon {
  return getWeaponBase("cryoLauncher");
}

export function createPlasmaBlade(): Weapon {
  return getWeaponBase("plasmaBlade");
}

export function createNaniteSwarm(): Weapon {
  return getWeaponBase("naniteSwarm");
}

export function createGravityWell(): Weapon {
  return getWeaponBase("gravityWell");
}

export function createVortexCannon(): Weapon {
  return getWeaponBase("vortexCannon");
}

export function createSeekerRifle(): Weapon {
  return getWeaponBase("seekerRifle");
}

export function createShardRepeater(): Weapon {
  return getWeaponBase("shardRepeater");
}

export const WEAPON_CREATORS: Record<WeaponId, () => Weapon> = {
  pulse: createPulseRifle,
  shotgun: createShotgun,
  laser: createLaser,
  rocket: createRocketLauncher,
  flame: createFlamethrower,
  drone: createDroneSwarm,
  plasma: createPlasmaRifle,
  railgun: createRailgun,
  swarm: createSwarmLauncher,
  gauss: createGaussRifle,
  arcCaster: createArcCaster,
  cryoLauncher: createCryoLauncher,
  plasmaBlade: createPlasmaBlade,
  naniteSwarm: createNaniteSwarm,
  gravityWell: createGravityWell,
  vortexCannon: createVortexCannon,
  seekerRifle: createSeekerRifle,
  shardRepeater: createShardRepeater,
};

export function getStarterWeapons(): Weapon[] {
  return [createPulseRifle()];
}

export function cloneWeapon(weapon: Weapon): Weapon {
  return { ...weapon };
}

export function upgradeWeapon(weapon: Weapon): Weapon {
  return upgradeWeaponFromBalance(weapon);
}

export function createPassive(id: PassiveId, level = 1): PassiveItem {
  const def = PASSIVE_BALANCE_DEFS.find((d) => d.id === id);
  return {
    id,
    name: def?.name ?? id,
    level,
    maxLevel: def?.maxLevel ?? DEFAULT_BALANCE.progression.passiveMaxLevel,
    description: def?.description ?? "",
    color: def?.color ?? "#ffffff",
  };
}

export function applyPassive(player: Player, id: PassiveId): Player {
  const def = PASSIVE_BALANCE_DEFS.find((d) => d.id === id);
  if (!def) return player;

  const existing = player.passives.find((p) => p.id === id);
  if (existing && existing.level >= existing.maxLevel) return player;

  const next = { ...player };
  next.passives = player.passives.map((p) => ({ ...p }));

  if (existing) {
    const idx = player.passives.findIndex((p) => p.id === id);
    next.passives[idx] = { ...existing, level: existing.level + 1 };
  } else {
    next.passives.push(createPassive(id, 1));
  }

  def.apply(next);
  return next;
}

export function generateUpgradeOptions(player: Player): UpgradeOption[] {
  const options: UpgradeOption[] = [];

  // Hero-talent based upgrades: 2 damage + 1 skill + 1 utility
  if (player.heroId) {
    const def = HERO_DEFS[player.heroId];
    const levels = player.talentLevels ?? {};
    const available = def.talents.filter((t) => (levels[t.id] ?? 0) < t.maxLevel);

    const damage = shuffleArray(available.filter((t) => t.category === "damage"));
    const skill = shuffleArray(available.filter((t) => t.category === "skill"));
    const utility = shuffleArray(available.filter((t) => t.category === "utility"));

    const picks: typeof def.talents = [];
    picks.push(...damage.slice(0, 2));
    picks.push(...skill.slice(0, 1));
    picks.push(...utility.slice(0, 1));

    if (picks.length < 4) {
      const used = new Set(picks.map((t) => t.id));
      const remaining = shuffleArray(available.filter((t) => !used.has(t.id)));
      picks.push(...remaining.slice(0, 4 - picks.length));
    }

    for (const talent of picks.slice(0, 4)) {
      const level = levels[talent.id] ?? 0;
      options.push({
        id: uid("opt"),
        type: "heroTalent",
        targetId: talent.id,
        name: level === 0 ? `解锁 ${talent.name}` : `${talent.name} Lv.${level + 1}`,
        description: talent.description,
        level,
        maxLevel: talent.maxLevel,
      });
    }
  }

  // Fallback: weapon/passive pool for runs without a hero
  if (options.length < 4) {
    const maxWeapons = DEFAULT_BALANCE.progression.maxWeapons;
    const pool: UpgradeOption[] = [];

    const availableWeapons = (Object.keys(WEAPON_CREATORS) as WeaponId[]).filter(
      (id) => !player.weapons.some((w) => w.id === id)
    );
    if (availableWeapons.length > 0 && player.weapons.length < maxWeapons) {
      const id = availableWeapons[0];
      const weapon = WEAPON_CREATORS[id]();
      pool.push({
        id: uid("opt"),
        type: "weapon",
        targetId: id,
        name: `解锁 ${weapon.name}`,
        description: weapon.description,
        level: 1,
        maxLevel: weapon.maxLevel,
      });
    }

    for (const weapon of player.weapons) {
      if (weapon.level < weapon.maxLevel) {
        pool.push({
          id: uid("opt"),
          type: "weapon",
          targetId: weapon.id,
          name: `${weapon.name} Lv.${weapon.level + 1}`,
          description: getWeaponUpgradeDescription(weapon),
          level: weapon.level,
          maxLevel: weapon.maxLevel,
        });
      }
    }

    for (const def of PASSIVE_BALANCE_DEFS) {
      const existing = player.passives.find((p) => p.id === def.id);
      const level = existing?.level ?? 0;
      if (level < def.maxLevel) {
        pool.push({
          id: uid("opt"),
          type: "passive",
          targetId: def.id,
          name: level === 0 ? `解锁 ${def.name}` : `${def.name} Lv.${level + 1}`,
          description: def.description,
          level,
          maxLevel: def.maxLevel,
        });
      }
    }

    const shuffled = shuffleArray(pool);
    options.push(...shuffled.slice(0, 4 - options.length));
  }

  return options.slice(0, 4);
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function applyUpgrade(player: Player, option: UpgradeOption): Player {
  let next = { ...player };
  next.weapons = player.weapons.map((w) => ({ ...w }));
  next.passives = player.passives.map((p) => ({ ...p }));
  next.talentLevels = { ...player.talentLevels };
  next.deployableUpgrades = { ...player.deployableUpgrades };

  if (option.type === "heroTalent") {
    next = applyHeroTalent(next, option.targetId);
    next.talentLevels[option.targetId] = (next.talentLevels[option.targetId] ?? 0) + 1;
  } else if (option.type === "weapon") {
    const existing = next.weapons.find((w) => w.id === option.targetId);
    if (existing) {
      const idx = next.weapons.indexOf(existing);
      next.weapons[idx] = upgradeWeapon(existing);
    } else {
      const creator = WEAPON_CREATORS[option.targetId as WeaponId];
      if (creator) next.weapons.push(creator());
    }
  } else if (option.type === "passive") {
    next = applyPassive(next, option.targetId as PassiveId);
  } else {
    // Legacy stat upgrades mapped to passives for backward compatibility
    const legacyMap: Record<string, PassiveId> = {
      maxHealth: "maxHealth",
      speed: "speed",
      magnet: "magnet",
      regen: "regen",
    };
    const passiveId = legacyMap[option.targetId];
    if (passiveId) next = applyPassive(next, passiveId);
  }

  return next;
}

function getWeaponUpgradeDescription(weapon: Weapon): string {
  switch (weapon.id) {
    case "pulse":
      return "伤害 +20%，冷却 -8%，穿透 +1";
    case "shotgun":
      return "弹丸 +1，伤害 +15%，冷却 -6%";
    case "laser":
      return "伤害 +25%，冷却 -10%，穿透 +2";
    case "rocket":
      return "伤害 +30%，冷却 -8%，爆炸范围提升";
    case "flame":
      return "伤害 +18%，弹丸 +1，燃烧延长";
    case "drone":
      return "伤害 +22%，冷却 -10%，无人机 +1";
    case "plasma":
      return "伤害 +22%，冷却 -8%，溅射范围提升";
    case "railgun":
      return "伤害 +32%，冷却 -10%，穿透 +2";
    case "swarm":
      return "伤害 +18%，飞弹 +1，冷却 -8%";
    case "gauss":
      return "伤害 +24%，穿透 +1，射程提升";
    case "arcCaster":
      return "伤害 +22%，连锁次数 +1，跳跃距离提升";
    case "cryoLauncher":
      return "伤害 +24%，冻结延长，爆炸范围提升";
    case "plasmaBlade":
      return "伤害 +28%，斩击范围提升，穿透 +2";
    case "naniteSwarm":
      return "伤害 +20%，弹丸 +1，纳米层数提升";
    case "gravityWell":
      return "伤害 +26%，引力半径与牵引力提升";
    case "vortexCannon":
      return "伤害 +26%，冷却 -10%，穿透 +2";
    case "seekerRifle":
      return "伤害 +22%，弹丸 +1，追踪距离提升";
    case "shardRepeater":
      return "伤害 +18%，弹丸 +1，冷却 -8%";
    default:
      return "属性全面提升";
  }
}
