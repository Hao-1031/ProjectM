import type { Weapon, UpgradeOption, Player, PassiveItem, WeaponId, PassiveId } from "./types";
import { uid } from "./math";
import {
  DEFAULT_BALANCE,
  getWeaponBase,
  upgradeWeaponFromBalance,
  PASSIVE_BALANCE_DEFS,
} from "./balance";

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

export const WEAPON_CREATORS: Record<WeaponId, () => Weapon> = {
  pulse: createPulseRifle,
  shotgun: createShotgun,
  laser: createLaser,
  rocket: createRocketLauncher,
  flame: createFlamethrower,
  drone: createDroneSwarm,
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
  const maxWeapons = DEFAULT_BALANCE.progression.maxWeapons;

  // Offer a new weapon if slot available
  const availableWeapons = (Object.keys(WEAPON_CREATORS) as WeaponId[]).filter(
    (id) => !player.weapons.some((w) => w.id === id)
  );
  if (availableWeapons.length > 0 && player.weapons.length < maxWeapons) {
    const id = availableWeapons[0];
    const weapon = WEAPON_CREATORS[id]();
    options.push({
      id: uid("opt"),
      type: "weapon",
      targetId: id,
      name: `解锁 ${weapon.name}`,
      description: weapon.description,
      level: 1,
      maxLevel: weapon.maxLevel,
    });
  }

  // Offer weapon upgrades
  for (const weapon of player.weapons) {
    if (weapon.level < weapon.maxLevel) {
      options.push({
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

  // Offer passive upgrades
  for (const def of PASSIVE_BALANCE_DEFS) {
    const existing = player.passives.find((p) => p.id === def.id);
    const level = existing?.level ?? 0;
    if (level < def.maxLevel) {
      options.push({
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

  // Shuffle and pick up to 3
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options.slice(0, 3);
}

export function applyUpgrade(player: Player, option: UpgradeOption): Player {
  let next = { ...player };
  next.weapons = player.weapons.map((w) => ({ ...w }));
  next.passives = player.passives.map((p) => ({ ...p }));

  if (option.type === "weapon") {
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
    default:
      return "属性全面提升";
  }
}
