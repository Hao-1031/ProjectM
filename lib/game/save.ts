import type { RunResult, WeaponId, HeroId, GameModeType, SeasonState, SeasonShopItem } from "./types";
import { DEFAULT_BALANCE } from "./balance";
import { HERO_DEFS } from "./heroes";
import { COSMETICS, DEFAULT_HEROES, getHeroCost, getCosmetic, type CosmeticType } from "./cosmetics";
import {
  createSeasonState,
  addSeasonXp as addSeasonStateXp,
  claimReward,
  getSeasonCurrencyReward,
  type SeasonPurchaseResult,
} from "./season";

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
  seasonXp: number;
  seasonCurrency: number;
  seasonState: SeasonState;
  unlockedWeapons: WeaponId[];
  equippedWeapons: WeaponId[];
  selectedHero: HeroId;
  unlockedHeroes: HeroId[];
  ownedSkins: string[];
  equippedSkin: string | null;
  ownedEmotes: string[];
  ownedBadges: string[];
  runHistory: RunHistoryEntry[];
  settings: {
    audioEnabled: boolean;
    volume: number;
    vibrationEnabled: boolean;
    reducedMotion: boolean;
  };
}

const SAVE_KEY = "project_m_save_v5";
const CURRENT_SAVE_VERSION = 5;
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
    seasonXp: 0,
    seasonCurrency: 0,
    seasonState: createSeasonState(),
    unlockedWeapons: ["pulse"],
    equippedWeapons: ["pulse"],
    selectedHero: "recon",
    unlockedHeroes: [...DEFAULT_HEROES],
    ownedSkins: [],
    equippedSkin: null,
    ownedEmotes: [],
    ownedBadges: [],
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

  const unlockedHeroes: HeroId[] = Array.isArray(parsed.unlockedHeroes)
    ? (parsed.unlockedHeroes.filter((id) => id in HERO_DEFS) as HeroId[])
    : fallback.unlockedHeroes;
  const validHeroes =
    unlockedHeroes.length > 0 ? unlockedHeroes : fallback.unlockedHeroes;
  const validSelectedHero =
    selectedHero && validHeroes.includes(selectedHero) ? selectedHero : fallback.selectedHero;

  const ownedSkins: string[] = Array.isArray(parsed.ownedSkins)
    ? parsed.ownedSkins.filter((id) => COSMETICS.some((c) => c.id === id))
    : fallback.ownedSkins;
  const ownedEmotes: string[] = Array.isArray(parsed.ownedEmotes)
    ? parsed.ownedEmotes.filter((id) => COSMETICS.some((c) => c.id === id))
    : fallback.ownedEmotes;
  const ownedBadges: string[] = Array.isArray(parsed.ownedBadges)
    ? parsed.ownedBadges.filter((id) => COSMETICS.some((c) => c.id === id))
    : fallback.ownedBadges;
  const equippedSkin =
    typeof parsed.equippedSkin === "string" && ownedSkins.includes(parsed.equippedSkin)
      ? parsed.equippedSkin
      : null;

  const seasonState: SeasonState =
    parsed.seasonState &&
    typeof parsed.seasonState === "object" &&
    typeof parsed.seasonState.currentLevel === "number" &&
    typeof parsed.seasonState.currentXp === "number" &&
    Array.isArray(parsed.seasonState.rewards) &&
    Array.isArray(parsed.seasonState.missions)
      ? parsed.seasonState
      : createSeasonState();

  return {
    ...fallback,
    ...parsed,
    version: CURRENT_SAVE_VERSION,
    coins:
      typeof parsed.coins === "number" ? Math.max(0, Math.floor(parsed.coins)) : fallback.coins,
    seasonXp: typeof parsed.seasonXp === "number" ? Math.max(0, parsed.seasonXp) : fallback.seasonXp,
    seasonCurrency:
      typeof parsed.seasonCurrency === "number"
        ? Math.max(0, parsed.seasonCurrency)
        : fallback.seasonCurrency,
    seasonState,
    unlockedWeapons: unlocked.length > 0 ? unlocked : fallback.unlockedWeapons,
    equippedWeapons: clampedEquipped,
    selectedHero: validSelectedHero,
    unlockedHeroes: validHeroes,
    ownedSkins,
    equippedSkin,
    ownedEmotes,
    ownedBadges,
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
        "project_m_save_v4",
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

export function saveSave(data: Partial<SaveData>) {
  if (typeof window === "undefined") return;
  try {
    const fallback = createFallback();
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...fallback, ...data }));
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

export function addSeasonXp(amount: number) {
  if (amount <= 0) return;
  const save = loadSave();
  save.seasonXp += Math.floor(amount);
  save.seasonState = addSeasonStateXp(save.seasonState, Math.floor(amount));
  saveSave(save);
}

export function claimSeasonReward(rewardId: string): { success: boolean; reward: import("./types").SeasonReward | null } {
  const save = loadSave();
  const { state, reward } = claimReward(save.seasonState, rewardId);
  save.seasonState = state;
  if (reward?.type === "currency") {
    save.seasonCurrency += getSeasonCurrencyReward(reward);
  }
  if (reward?.type === "skin" && !save.ownedSkins.includes(reward.id)) {
    save.ownedSkins.push(reward.id);
  }
  if (reward?.type === "emote" && !save.ownedEmotes.includes(reward.id)) {
    save.ownedEmotes.push(reward.id);
  }
  if (reward?.type === "badge" && !save.ownedBadges.includes(reward.id)) {
    save.ownedBadges.push(reward.id);
  }
  saveSave(save);
  return { success: reward !== null, reward };
}

export function addSeasonCurrency(amount: number) {
  if (amount <= 0) return;
  const save = loadSave();
  save.seasonCurrency += Math.floor(amount);
  save.seasonState = {
    ...save.seasonState,
    seasonCurrency: save.seasonState.seasonCurrency + Math.floor(amount),
  };
  saveSave(save);
}

export function spendSeasonCurrency(amount: number): boolean {
  if (amount <= 0) return true;
  const save = loadSave();
  if (save.seasonCurrency < amount) return false;
  save.seasonCurrency -= Math.floor(amount);
  save.seasonState = {
    ...save.seasonState,
    seasonCurrency: Math.max(0, save.seasonState.seasonCurrency - Math.floor(amount)),
  };
  saveSave(save);
  return true;
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

export function isHeroUnlocked(heroId: HeroId): boolean {
  return loadSave().unlockedHeroes.includes(heroId);
}

export function buyHero(heroId: HeroId): boolean {
  if (!(heroId in HERO_DEFS)) return false;
  const save = loadSave();
  if (save.unlockedHeroes.includes(heroId)) return true;

  const cost = getHeroCost(heroId);
  if (save.coins < cost) return false;

  save.coins -= cost;
  save.unlockedHeroes.push(heroId);
  saveSave(save);
  return true;
}

export function setSelectedHero(heroId: HeroId) {
  if (!(heroId in HERO_DEFS)) return;
  const save = loadSave();
  if (!save.unlockedHeroes.includes(heroId)) return;
  save.selectedHero = heroId;
  saveSave(save);
}

export function isCosmeticOwned(id: string): boolean {
  const save = loadSave();
  const cosmetic = getCosmetic(id);
  if (!cosmetic) return false;
  if (cosmetic.type === "skin") return save.ownedSkins.includes(id);
  if (cosmetic.type === "emote") return save.ownedEmotes.includes(id);
  return save.ownedBadges.includes(id);
}

export function buyCosmetic(id: string): boolean {
  const cosmetic = getCosmetic(id);
  if (!cosmetic) return false;
  if (isCosmeticOwned(id)) return true;

  const save = loadSave();
  if (save.coins < cosmetic.cost) return false;

  save.coins -= cosmetic.cost;
  if (cosmetic.type === "skin") save.ownedSkins.push(id);
  else if (cosmetic.type === "emote") save.ownedEmotes.push(id);
  else if (cosmetic.type === "badge") save.ownedBadges.push(id);
  saveSave(save);
  return true;
}

export function equipSkin(id: string | null): boolean {
  const save = loadSave();
  if (id === null) {
    save.equippedSkin = null;
    saveSave(save);
    return true;
  }
  const cosmetic = getCosmetic(id);
  if (!cosmetic || cosmetic.type !== "skin") return false;
  if (!save.ownedSkins.includes(id)) return false;
  save.equippedSkin = id;
  saveSave(save);
  return true;
}

export function getEquippedSkin(): string | null {
  return loadSave().equippedSkin;
}

export function getLoadout(): { heroId: HeroId; weaponIds: WeaponId[] } {
  const save = loadSave();
  const weapons: WeaponId[] = save.equippedWeapons.length > 0 ? save.equippedWeapons : ["pulse"];
  const heroId = save.unlockedHeroes.includes(save.selectedHero)
    ? save.selectedHero
    : DEFAULT_HEROES[0];
  return {
    heroId,
    weaponIds: weapons.slice(0, DEFAULT_BALANCE.progression.maxWeapons),
  };
}

export function saveLoadout(heroId: HeroId, weaponIds: WeaponId[]) {
  if (!(heroId in HERO_DEFS)) return;
  const save = loadSave();
  if (!save.unlockedHeroes.includes(heroId)) return;
  save.selectedHero = heroId;
  const validWeapons = weaponIds.filter(
    (id) => id in DEFAULT_BALANCE.weapons && save.unlockedWeapons.includes(id)
  );
  if (validWeapons.length === 0) validWeapons.push("pulse");
  save.equippedWeapons = validWeapons.slice(0, DEFAULT_BALANCE.progression.maxWeapons);
  saveSave(save);
}
