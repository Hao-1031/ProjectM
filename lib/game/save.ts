import type { RunResult, WeaponId, HeroId } from "./types";
import { DEFAULT_BALANCE } from "./balance";
import { HERO_DEFS } from "./heroes";

export interface SaveData {
  version: number;
  bestRun: RunResult | null;
  totalKills: number;
  totalRuns: number;
  coins: number;
  unlockedWeapons: WeaponId[];
  equippedWeapons: WeaponId[];
  selectedHero: HeroId;
  settings: {
    audioEnabled: boolean;
    volume: number;
    vibrationEnabled: boolean;
    reducedMotion: boolean;
  };
}

const SAVE_KEY = "project_m_save_v3";
const CURRENT_SAVE_VERSION = 3;

function getWeaponCost(id: WeaponId): number {
  return DEFAULT_BALANCE.weapons[id]?.cost ?? 0;
}

const LEGACY_HERO_MAP: Record<string, HeroId> = {
  scout: "recon",
  assault: "leopard",
  medic: "twilight",
  engineer: "nitrogen",
  vanguard: "leopard",
};

function createFallback(): SaveData {
  return {
    version: CURRENT_SAVE_VERSION,
    bestRun: null,
    totalKills: 0,
    totalRuns: 0,
    coins: 0,
    unlockedWeapons: ["pulse"],
    equippedWeapons: ["pulse"],
    selectedHero: "recon",
    settings: {
      audioEnabled: true,
      volume: 0.8,
      vibrationEnabled: true,
      reducedMotion: false,
    },
  };
}

function migrateLegacy(parsed: Partial<SaveData>): SaveData {
  const fallback = createFallback();
  const needsHeroMigration =
    typeof parsed.version !== "number" || parsed.version < CURRENT_SAVE_VERSION;

  const unlocked: WeaponId[] = Array.isArray(parsed.unlockedWeapons)
    ? (parsed.unlockedWeapons.filter((id) => id in DEFAULT_BALANCE.weapons) as WeaponId[])
    : fallback.unlockedWeapons;

  const equipped: WeaponId[] = Array.isArray(parsed.equippedWeapons)
    ? (parsed.equippedWeapons.filter(
        (id) => id in DEFAULT_BALANCE.weapons && unlocked.includes(id as WeaponId)
      ) as WeaponId[])
    : unlocked.length > 0
      ? [unlocked[0]]
      : fallback.equippedWeapons;
  const validEquipped = equipped.length > 0 ? equipped : fallback.equippedWeapons;
  const clampedEquipped = validEquipped.slice(0, DEFAULT_BALANCE.progression.maxWeapons);

  let selectedHero: HeroId = fallback.selectedHero;
  if (parsed.selectedHero) {
    const migratedHero = needsHeroMigration
      ? (LEGACY_HERO_MAP[parsed.selectedHero] ?? parsed.selectedHero)
      : parsed.selectedHero;
    selectedHero = migratedHero && migratedHero in HERO_DEFS ? migratedHero : fallback.selectedHero;
  }

  return {
    ...fallback,
    ...parsed,
    version: CURRENT_SAVE_VERSION,
    coins:
      typeof parsed.coins === "number" ? Math.max(0, Math.floor(parsed.coins)) : fallback.coins,
    unlockedWeapons: unlocked.length > 0 ? unlocked : fallback.unlockedWeapons,
    equippedWeapons: clampedEquipped,
    selectedHero,
    settings: { ...fallback.settings, ...parsed.settings },
  };
}

export function loadSave(): SaveData {
  if (typeof window === "undefined") return createFallback();

  try {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      // Migrate from older save keys if present
      for (const oldKey of ["project_m_save_v2", "project_m_save_v1", "project_m_save"]) {
        raw = localStorage.getItem(oldKey);
        if (raw) break;
      }
    }
    if (!raw) return createFallback();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const migrated = migrateLegacy(parsed);
    if (migrated.version !== parsed.version) {
      saveSave(migrated);
    }
    return migrated;
  } catch {
    return createFallback();
  }
}

export function saveSave(data: SaveData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors
  }
}

export function recordRun(result: RunResult) {
  const save = loadSave();
  save.totalRuns += 1;
  save.totalKills += result.stats.kills;

  const isBetter =
    !save.bestRun ||
    (result.victory && !save.bestRun.victory) ||
    (result.victory === save.bestRun.victory && result.stats.kills > save.bestRun.stats.kills);

  if (isBetter) {
    save.bestRun = result;
  }

  const reward = calculateRunReward(result);
  save.coins = Math.max(0, save.coins + reward);

  saveSave(save);
}

export function calculateRunReward(result: RunResult): number {
  if (!result.victory) return 0;
  const base = 150;
  const killReward = result.stats.kills * 2;
  const waveReward = (result.stats.wavesCleared ?? 0) * 20;
  const missionReward = result.completedMissions * 30;
  return base + killReward + waveReward + missionReward;
}

export function addCoins(amount: number) {
  if (amount <= 0) return;
  const save = loadSave();
  save.coins += Math.floor(amount);
  saveSave(save);
}

export function spendCoins(amount: number): boolean {
  if (amount <= 0) return true;
  const save = loadSave();
  if (save.coins < amount) return false;
  save.coins -= Math.floor(amount);
  saveSave(save);
  return true;
}

export function isWeaponUnlocked(id: WeaponId): boolean {
  return loadSave().unlockedWeapons.includes(id);
}

export function buyWeapon(id: WeaponId): boolean {
  const save = loadSave();
  if (save.unlockedWeapons.includes(id)) return true;

  const cost = getWeaponCost(id);
  if (save.coins < cost) return false;

  save.coins -= cost;
  save.unlockedWeapons.push(id);
  saveSave(save);
  return true;
}

export function equipWeapon(id: WeaponId): boolean {
  const save = loadSave();
  if (!save.unlockedWeapons.includes(id)) return false;
  if (save.equippedWeapons.includes(id)) return true;
  if (save.equippedWeapons.length >= DEFAULT_BALANCE.progression.maxWeapons) return false;

  save.equippedWeapons.push(id);
  saveSave(save);
  return true;
}

export function unequipWeapon(id: WeaponId): boolean {
  const save = loadSave();
  if (!save.equippedWeapons.includes(id)) return false;
  if (save.equippedWeapons.length <= 1) return false;

  save.equippedWeapons = save.equippedWeapons.filter((w) => w !== id);
  saveSave(save);
  return true;
}

export function setSelectedHero(heroId: HeroId) {
  if (!(heroId in HERO_DEFS)) return;
  const save = loadSave();
  save.selectedHero = heroId;
  saveSave(save);
}

export function getLoadout(): { heroId: HeroId; weaponIds: WeaponId[] } {
  const save = loadSave();
  const weapons: WeaponId[] = save.equippedWeapons.length > 0 ? save.equippedWeapons : ["pulse"];
  return {
    heroId: save.selectedHero,
    weaponIds: weapons.slice(0, DEFAULT_BALANCE.progression.maxWeapons),
  };
}

export function saveLoadout(heroId: HeroId, weaponIds: WeaponId[]) {
  if (!(heroId in HERO_DEFS)) return;
  const save = loadSave();
  save.selectedHero = heroId;
  const validWeapons = weaponIds.filter(
    (id) => id in DEFAULT_BALANCE.weapons && save.unlockedWeapons.includes(id)
  );
  if (validWeapons.length === 0) validWeapons.push("pulse");
  save.equippedWeapons = validWeapons.slice(0, DEFAULT_BALANCE.progression.maxWeapons);
  saveSave(save);
}
