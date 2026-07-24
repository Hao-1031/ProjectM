import type { RunResult, WeaponId, HeroId, GameModeType } from "./types";
import { DEFAULT_BALANCE } from "./balance";
import { HERO_DEFS } from "./heroes";

export interface RunHistoryEntry {
  timestamp: number;
  mode: GameModeType;
  elapsed: number;
  reward: number;
  victory: boolean;
  surrendered: boolean;
}

export interface SaveData {
  version: number;
  bestRun: RunResult | null;
  totalKills: number;
  totalRuns: number;
  coins: number;
  unlockedWeapons: WeaponId[];
  equippedWeapons: WeaponId[];
  selectedHero: HeroId;
  runHistory: RunHistoryEntry[];
  settings: {
    audioEnabled: boolean;
    volume: number;
    vibrationEnabled: boolean;
    reducedMotion: boolean;
  };
}

const SAVE_KEY = "project_m_save_v4";
const CURRENT_SAVE_VERSION = 4;
const MAX_RUN_HISTORY = 20;
const DEATH_REWARD_CAP = 200;
const MIN_DEATH_REWARD_TIME = 45;

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
    runHistory: [],
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

  const runHistory: RunHistoryEntry[] = Array.isArray(parsed.runHistory)
    ? parsed.runHistory.filter(
        (h): h is RunHistoryEntry =>
          !!h &&
          typeof h.timestamp === "number" &&
          typeof h.elapsed === "number" &&
          typeof h.reward === "number" &&
          typeof h.victory === "boolean" &&
          typeof h.surrendered === "boolean"
      )
    : fallback.runHistory;

  return {
    ...fallback,
    ...parsed,
    version: CURRENT_SAVE_VERSION,
    coins:
      typeof parsed.coins === "number" ? Math.max(0, Math.floor(parsed.coins)) : fallback.coins,
    unlockedWeapons: unlocked.length > 0 ? unlocked : fallback.unlockedWeapons,
    equippedWeapons: clampedEquipped,
    selectedHero,
    runHistory,
    settings: { ...fallback.settings, ...parsed.settings },
  };
}

export function loadSave(): SaveData {
  if (typeof window === "undefined") return createFallback();

  try {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      // Migrate from older save keys if present
      for (const oldKey of [
        "project_m_save_v3",
        "project_m_save_v2",
        "project_m_save_v1",
        "project_m_save",
      ]) {
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

  const reward = calculateRunReward(result, save.runHistory);
  save.coins = Math.max(0, save.coins + reward);

  // Track run history for anti-farm analysis on future runs.
  save.runHistory.push({
    timestamp: Date.now(),
    mode: result.mode,
    elapsed: result.elapsed,
    reward,
    victory: result.victory,
    surrendered: !!result.surrendered,
  });
  if (save.runHistory.length > MAX_RUN_HISTORY) {
    save.runHistory = save.runHistory.slice(-MAX_RUN_HISTORY);
  }

  saveSave(save);
}

function computeAntiFarmMultiplier(result: RunResult, history: RunHistoryEntry[]): number {
  // Instant death farming: no reward.
  if (result.elapsed < MIN_DEATH_REWARD_TIME) return 0;

  // AFK / no engagement: no reward.
  const hasEngagement = result.stats.kills > 0 || result.stats.damageDealt >= 300;
  if (!hasEngagement) return 0;

  // Look at recent forced deaths (non-victory, non-surrender) for pattern detection.
  const recentDefeats = history.filter((h) => !h.victory && !h.surrendered).slice(-5);

  let multiplier = 1;

  if (recentDefeats.length >= 2) {
    const avgElapsed = recentDefeats.reduce((sum, h) => sum + h.elapsed, 0) / recentDefeats.length;
    if (avgElapsed < 90) multiplier *= 0.5;
  }

  if (recentDefeats.length >= 3) {
    const avgElapsed = recentDefeats.reduce((sum, h) => sum + h.elapsed, 0) / recentDefeats.length;
    if (avgElapsed < 120) multiplier *= 0.3;
  }

  // Repeated rapid deaths are a strong farming signal.
  const rapidDefeats = recentDefeats.filter((h) => h.elapsed < 60).length;
  if (rapidDefeats >= 2) multiplier *= 0.2;

  return Math.max(0, multiplier);
}

export function calculateDeathReward(result: RunResult, history: RunHistoryEntry[] = []): number {
  if (result.surrendered || result.victory) return 0;

  const farmMultiplier = computeAntiFarmMultiplier(result, history);
  if (farmMultiplier <= 0) return 0;

  // Base from resources actually collected during the run.
  const resourceBase = Math.max(0, result.stats.resourcesCollected);

  // Engagement bonuses.
  const killBonus = Math.min(result.stats.kills * 2, 50);
  const missionBonus = result.completedMissions * 10;
  const waveBonus = (result.stats.wavesCleared ?? 0) * 5;

  // Time multiplier: longer genuine attempts are rewarded more, but capped.
  const timeMultiplier = Math.min(1, Math.max(0.4, result.elapsed / 180));

  const total = Math.floor(
    (resourceBase + killBonus + missionBonus + waveBonus) * timeMultiplier * farmMultiplier
  );

  return Math.min(total, DEATH_REWARD_CAP);
}

export function calculateRunReward(
  result: RunResult,
  history: RunHistoryEntry[] = []
): number {
  if (result.surrendered) return 0;
  if (!result.victory) return calculateDeathReward(result, history);

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
