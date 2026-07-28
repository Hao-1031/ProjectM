import type { AuthUser } from "@/lib/auth/constants";
import type {
  HeroId,
  WeaponId,
  RunResult,
  SeasonState,
  GameModeType,
  GameStatus,
} from "@/lib/game/types";
import type {
  SaveData,
  RunHistoryEntry,
} from "@/lib/game/save";
import type { CampaignProgress } from "@/lib/game/campaign";
import type { BossRushProgress } from "@/lib/game/boss-rush";
import { loadSave, saveSave } from "@/lib/game/save";
import { HERO_DEFS } from "@/lib/game/heroes";
import { DEFAULT_BALANCE } from "@/lib/game/balance";
import { COSMETICS, DEFAULT_HEROES } from "@/lib/game/cosmetics";

// ---------------------------------------------------------------------------
// Auth Slice
// ---------------------------------------------------------------------------

export interface AuthSlice {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const AUTH_INITIAL: AuthSlice = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export type AuthAction =
  | { type: "AUTH_LOADING" }
  | { type: "AUTH_SUCCESS"; user: AuthUser | null; isAuthenticated: boolean }
  | { type: "AUTH_ERROR"; error: string }
  | { type: "AUTH_SIGN_OUT" }
  | { type: "AUTH_RESET" };

export function authReducer(state: AuthSlice, action: AuthAction): AuthSlice {
  switch (action.type) {
    case "AUTH_LOADING":
      return { ...state, isLoading: true, error: null };
    case "AUTH_SUCCESS":
      return {
        user: action.user,
        isAuthenticated: action.isAuthenticated,
        isLoading: false,
        error: null,
      };
    case "AUTH_ERROR":
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.error,
      };
    case "AUTH_SIGN_OUT":
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case "AUTH_RESET":
      return { ...AUTH_INITIAL };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Wallet Slice
// ---------------------------------------------------------------------------

export interface WalletSlice {
  coins: number;
  seasonCurrency: number;
  premiumCurrency: number;
}

export function walletFromSave(save: SaveData): WalletSlice {
  return {
    coins: save.coins,
    seasonCurrency: save.seasonCurrency,
    premiumCurrency: 0,
  };
}

export function validateWallet(wallet: WalletSlice): WalletSlice {
  return {
    coins: Math.max(0, Math.floor(wallet.coins)),
    seasonCurrency: Math.max(0, Math.floor(wallet.seasonCurrency)),
    premiumCurrency: Math.max(0, Math.floor(wallet.premiumCurrency)),
  };
}

export type WalletAction =
  | { type: "WALLET_SET"; wallet: WalletSlice }
  | { type: "WALLET_ADD_COINS"; amount: number }
  | { type: "WALLET_SPEND_COINS"; amount: number }
  | { type: "WALLET_ADD_SEASON_CURRENCY"; amount: number }
  | { type: "WALLET_SPEND_SEASON_CURRENCY"; amount: number }
  | { type: "WALLET_ADD_PREMIUM"; amount: number }
  | { type: "WALLET_SPEND_PREMIUM"; amount: number };

export function walletReducer(state: WalletSlice, action: WalletAction): WalletSlice {
  switch (action.type) {
    case "WALLET_SET":
      return validateWallet(action.wallet);
    case "WALLET_ADD_COINS":
      return validateWallet({ ...state, coins: state.coins + action.amount });
    case "WALLET_SPEND_COINS":
      return validateWallet({ ...state, coins: state.coins - action.amount });
    case "WALLET_ADD_SEASON_CURRENCY":
      return validateWallet({ ...state, seasonCurrency: state.seasonCurrency + action.amount });
    case "WALLET_SPEND_SEASON_CURRENCY":
      return validateWallet({ ...state, seasonCurrency: state.seasonCurrency - action.amount });
    case "WALLET_ADD_PREMIUM":
      return validateWallet({ ...state, premiumCurrency: state.premiumCurrency + action.amount });
    case "WALLET_SPEND_PREMIUM":
      return validateWallet({ ...state, premiumCurrency: state.premiumCurrency - action.amount });
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Progression Slice
// ---------------------------------------------------------------------------

export interface ProgressionSlice {
  totalKills: number;
  totalRuns: number;
  bestRun: RunResult | null;
  seasonXp: number;
  seasonState: SeasonState;
  runHistory: RunHistoryEntry[];
  unlockedHeroes: HeroId[];
  selectedHero: HeroId;
  unlockedWeapons: WeaponId[];
  equippedWeapons: WeaponId[];
  campaignProgress: CampaignProgress;
  bossRushProgress: BossRushProgress;
}

export function progressionFromSave(save: SaveData): ProgressionSlice {
  return {
    totalKills: save.totalKills,
    totalRuns: save.totalRuns,
    bestRun: save.bestRun,
    seasonXp: save.seasonXp,
    seasonState: save.seasonState,
    runHistory: save.runHistory,
    unlockedHeroes: save.unlockedHeroes,
    selectedHero: save.selectedHero,
    unlockedWeapons: save.unlockedWeapons,
    equippedWeapons: save.equippedWeapons,
    campaignProgress: save.campaignProgress,
    bossRushProgress: save.bossRushProgress,
  };
}

export function validateProgression(prog: ProgressionSlice): ProgressionSlice {
  const validHeroes = prog.unlockedHeroes.filter((id) => id in HERO_DEFS);
  const validSelectedHero =
    prog.selectedHero && validHeroes.includes(prog.selectedHero)
      ? prog.selectedHero
      : validHeroes.length > 0
        ? validHeroes[0]
        : DEFAULT_HEROES[0];
  const validWeapons = prog.unlockedWeapons.filter(
    (id) => id in DEFAULT_BALANCE.weapons
  );
  const validEquipped = prog.equippedWeapons.filter(
    (id) => validWeapons.includes(id)
  );
  return {
    ...prog,
    totalKills: Math.max(0, Math.floor(prog.totalKills)),
    totalRuns: Math.max(0, Math.floor(prog.totalRuns)),
    seasonXp: Math.max(0, prog.seasonXp),
    unlockedHeroes: validHeroes.length > 0 ? validHeroes : [...DEFAULT_HEROES],
    selectedHero: validSelectedHero,
    unlockedWeapons: validWeapons.length > 0 ? validWeapons : ["pulse"],
    equippedWeapons: validEquipped.length > 0 ? validEquipped : ["pulse"],
  };
}

export type ProgressionAction =
  | { type: "PROG_SET"; progression: ProgressionSlice }
  | { type: "PROG_ADD_KILLS"; amount: number }
  | { type: "PROG_RECORD_RUN"; result: RunResult }
  | { type: "PROG_UNLOCK_HERO"; heroId: HeroId }
  | { type: "PROG_SELECT_HERO"; heroId: HeroId }
  | { type: "PROG_UNLOCK_WEAPON"; weaponId: WeaponId }
  | { type: "PROG_EQUIP_WEAPON"; weaponId: WeaponId }
  | { type: "PROG_UNEQUIP_WEAPON"; weaponId: WeaponId }
  | { type: "PROG_ADD_SEASON_XP"; amount: number }
  | { type: "PROG_UPDATE_SEASON_STATE"; seasonState: SeasonState }
  | { type: "PROG_UPDATE_CAMPAIGN"; campaignProgress: CampaignProgress }
  | { type: "PROG_UPDATE_BOSS_RUSH"; bossRushProgress: BossRushProgress };

export function progressionReducer(
  state: ProgressionSlice,
  action: ProgressionAction
): ProgressionSlice {
  switch (action.type) {
    case "PROG_SET":
      return validateProgression(action.progression);
    case "PROG_ADD_KILLS":
      return validateProgression({
        ...state,
        totalKills: state.totalKills + action.amount,
      });
    case "PROG_RECORD_RUN": {
      const result = action.result;
      const isBetter =
        !state.bestRun ||
        (result.victory && !state.bestRun.victory) ||
        (result.victory === state.bestRun.victory &&
          result.stats.kills > state.bestRun.stats.kills);
      const entry: RunHistoryEntry = {
        timestamp: Date.now(),
        mode: result.mode,
        elapsed: result.elapsed,
        reward: 0,
        victory: result.victory,
        surrendered: !!result.surrendered,
      };
      const runHistory = [...state.runHistory, entry].slice(-20);
      return validateProgression({
        ...state,
        totalRuns: state.totalRuns + 1,
        totalKills: state.totalKills + result.stats.kills,
        bestRun: isBetter ? result : state.bestRun,
        runHistory,
      });
    }
    case "PROG_UNLOCK_HERO": {
      if (!(action.heroId in HERO_DEFS)) return state;
      if (state.unlockedHeroes.includes(action.heroId)) return state;
      return validateProgression({
        ...state,
        unlockedHeroes: [...state.unlockedHeroes, action.heroId],
      });
    }
    case "PROG_SELECT_HERO": {
      if (!(action.heroId in HERO_DEFS)) return state;
      if (!state.unlockedHeroes.includes(action.heroId)) return state;
      return { ...state, selectedHero: action.heroId };
    }
    case "PROG_UNLOCK_WEAPON": {
      if (!(action.weaponId in DEFAULT_BALANCE.weapons)) return state;
      if (state.unlockedWeapons.includes(action.weaponId)) return state;
      return validateProgression({
        ...state,
        unlockedWeapons: [...state.unlockedWeapons, action.weaponId],
      });
    }
    case "PROG_EQUIP_WEAPON": {
      if (!state.unlockedWeapons.includes(action.weaponId)) return state;
      if (state.equippedWeapons.includes(action.weaponId)) return state;
      if (state.equippedWeapons.length >= DEFAULT_BALANCE.progression.maxWeapons) return state;
      return {
        ...state,
        equippedWeapons: [...state.equippedWeapons, action.weaponId],
      };
    }
    case "PROG_UNEQUIP_WEAPON": {
      if (!state.equippedWeapons.includes(action.weaponId)) return state;
      if (state.equippedWeapons.length <= 1) return state;
      return {
        ...state,
        equippedWeapons: state.equippedWeapons.filter((w) => w !== action.weaponId),
      };
    }
    case "PROG_ADD_SEASON_XP":
      return validateProgression({
        ...state,
        seasonXp: state.seasonXp + action.amount,
      });
    case "PROG_UPDATE_SEASON_STATE":
      return { ...state, seasonState: action.seasonState };
    case "PROG_UPDATE_CAMPAIGN":
      return { ...state, campaignProgress: action.campaignProgress };
    case "PROG_UPDATE_BOSS_RUSH":
      return { ...state, bossRushProgress: action.bossRushProgress };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Cosmetics Slice
// ---------------------------------------------------------------------------

export interface CosmeticsSlice {
  ownedSkins: string[];
  equippedSkin: string | null;
  ownedEmotes: string[];
  ownedBadges: string[];
}

export function cosmeticsFromSave(save: SaveData): CosmeticsSlice {
  return {
    ownedSkins: save.ownedSkins,
    equippedSkin: save.equippedSkin,
    ownedEmotes: save.ownedEmotes,
    ownedBadges: save.ownedBadges,
  };
}

export function validateCosmetics(cosm: CosmeticsSlice): CosmeticsSlice {
  const validSkins = cosm.ownedSkins.filter((id) =>
    COSMETICS.some((c) => c.id === id && c.type === "skin")
  );
  const validEmotes = cosm.ownedEmotes.filter((id) =>
    COSMETICS.some((c) => c.id === id && c.type === "emote")
  );
  const validBadges = cosm.ownedBadges.filter((id) =>
    COSMETICS.some((c) => c.id === id && c.type === "badge")
  );
  const validEquippedSkin =
    cosm.equippedSkin && validSkins.includes(cosm.equippedSkin)
      ? cosm.equippedSkin
      : null;
  return {
    ownedSkins: validSkins,
    equippedSkin: validEquippedSkin,
    ownedEmotes: validEmotes,
    ownedBadges: validBadges,
  };
}

export type CosmeticsAction =
  | { type: "COSM_SET"; cosmetics: CosmeticsSlice }
  | { type: "COSM_OWN_SKIN"; skinId: string }
  | { type: "COSM_OWN_EMOTE"; emoteId: string }
  | { type: "COSM_OWN_BADGE"; badgeId: string }
  | { type: "COSM_EQUIP_SKIN"; skinId: string | null }
  | { type: "COSM_UNEQUIP_SKIN" };

export function cosmeticsReducer(
  state: CosmeticsSlice,
  action: CosmeticsAction
): CosmeticsSlice {
  switch (action.type) {
    case "COSM_SET":
      return validateCosmetics(action.cosmetics);
    case "COSM_OWN_SKIN": {
      const cosmetic = COSMETICS.find((c) => c.id === action.skinId && c.type === "skin");
      if (!cosmetic) return state;
      if (state.ownedSkins.includes(action.skinId)) return state;
      return validateCosmetics({
        ...state,
        ownedSkins: [...state.ownedSkins, action.skinId],
      });
    }
    case "COSM_OWN_EMOTE": {
      const cosmetic = COSMETICS.find((c) => c.id === action.emoteId && c.type === "emote");
      if (!cosmetic) return state;
      if (state.ownedEmotes.includes(action.emoteId)) return state;
      return validateCosmetics({
        ...state,
        ownedEmotes: [...state.ownedEmotes, action.emoteId],
      });
    }
    case "COSM_OWN_BADGE": {
      const cosmetic = COSMETICS.find((c) => c.id === action.badgeId && c.type === "badge");
      if (!cosmetic) return state;
      if (state.ownedBadges.includes(action.badgeId)) return state;
      return validateCosmetics({
        ...state,
        ownedBadges: [...state.ownedBadges, action.badgeId],
      });
    }
    case "COSM_EQUIP_SKIN": {
      if (action.skinId === null) {
        return { ...state, equippedSkin: null };
      }
      const cosmetic = COSMETICS.find((c) => c.id === action.skinId && c.type === "skin");
      if (!cosmetic) return state;
      if (!state.ownedSkins.includes(action.skinId)) return state;
      return { ...state, equippedSkin: action.skinId };
    }
    case "COSM_UNEQUIP_SKIN":
      return { ...state, equippedSkin: null };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Settings Slice
// ---------------------------------------------------------------------------

export interface SettingsSlice {
  audioEnabled: boolean;
  volume: number;
  vibrationEnabled: boolean;
  reducedMotion: boolean;
}

export function settingsFromSave(save: SaveData): SettingsSlice {
  return { ...save.settings };
}

export function validateSettings(settings: SettingsSlice): SettingsSlice {
  return {
    audioEnabled: !!settings.audioEnabled,
    volume: Math.max(0, Math.min(1, settings.volume)),
    vibrationEnabled: !!settings.vibrationEnabled,
    reducedMotion: !!settings.reducedMotion,
  };
}

export type SettingsAction =
  | { type: "SETTINGS_SET"; settings: SettingsSlice }
  | { type: "SETTINGS_TOGGLE_AUDIO" }
  | { type: "SETTINGS_SET_VOLUME"; volume: number }
  | { type: "SETTINGS_TOGGLE_VIBRATION" }
  | { type: "SETTINGS_TOGGLE_REDUCED_MOTION" };

export function settingsReducer(
  state: SettingsSlice,
  action: SettingsAction
): SettingsSlice {
  switch (action.type) {
    case "SETTINGS_SET":
      return validateSettings(action.settings);
    case "SETTINGS_TOGGLE_AUDIO":
      return { ...state, audioEnabled: !state.audioEnabled };
    case "SETTINGS_SET_VOLUME":
      return validateSettings({ ...state, volume: action.volume });
    case "SETTINGS_TOGGLE_VIBRATION":
      return { ...state, vibrationEnabled: !state.vibrationEnabled };
    case "SETTINGS_TOGGLE_REDUCED_MOTION":
      return { ...state, reducedMotion: !state.reducedMotion };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Game Engine Slice (runtime-only, not persisted)
// ---------------------------------------------------------------------------

export interface GameEngineSlice {
  status: GameStatus;
  mode: GameModeType | null;
  isRunning: boolean;
  currentRunId: string | null;
  sessionStartTime: number | null;
}

export const GAME_ENGINE_INITIAL: GameEngineSlice = {
  status: "idle",
  mode: null,
  isRunning: false,
  currentRunId: null,
  sessionStartTime: null,
};

export type GameEngineAction =
  | { type: "ENGINE_START"; mode: GameModeType }
  | { type: "ENGINE_PAUSE" }
  | { type: "ENGINE_RESUME" }
  | { type: "ENGINE_END" }
  | { type: "ENGINE_SET_STATUS"; status: GameStatus };

export function gameEngineReducer(
  state: GameEngineSlice,
  action: GameEngineAction
): GameEngineSlice {
  switch (action.type) {
    case "ENGINE_START":
      return {
        status: "running",
        mode: action.mode,
        isRunning: true,
        currentRunId: `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sessionStartTime: Date.now(),
      };
    case "ENGINE_PAUSE":
      return { ...state, status: "paused" };
    case "ENGINE_RESUME":
      return { ...state, status: "running" };
    case "ENGINE_END":
      return {
        status: "idle",
        mode: null,
        isRunning: false,
        currentRunId: null,
        sessionStartTime: null,
      };
    case "ENGINE_SET_STATUS":
      return { ...state, status: action.status };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Full App State
// ---------------------------------------------------------------------------

export interface AppState {
  auth: AuthSlice;
  wallet: WalletSlice;
  progression: ProgressionSlice;
  cosmetics: CosmeticsSlice;
  settings: SettingsSlice;
  gameEngine: GameEngineSlice;
}

export type AppStateAction =
  | { type: "INIT_FROM_SAVE"; save: SaveData }
  | { type: "PERSIST_TO_SAVE" }
  | AuthAction
  | WalletAction
  | ProgressionAction
  | CosmeticsAction
  | SettingsAction
  | GameEngineAction;

export function appStateReducer(state: AppState, action: AppStateAction): AppState {
  if (action.type === "INIT_FROM_SAVE") {
    return {
      auth: state.auth,
      wallet: walletFromSave(action.save),
      progression: progressionFromSave(action.save),
      cosmetics: cosmeticsFromSave(action.save),
      settings: settingsFromSave(action.save),
      gameEngine: state.gameEngine,
    };
  }
  if (action.type === "PERSIST_TO_SAVE") {
    persistState(state);
    return state;
  }
  if (action.type.startsWith("AUTH_")) {
    return { ...state, auth: authReducer(state.auth, action as AuthAction) };
  }
  if (action.type.startsWith("WALLET_")) {
    const next = { ...state, wallet: walletReducer(state.wallet, action as WalletAction) };
    persistState(next);
    return next;
  }
  if (action.type.startsWith("PROG_")) {
    const next = { ...state, progression: progressionReducer(state.progression, action as ProgressionAction) };
    persistState(next);
    return next;
  }
  if (action.type.startsWith("COSM_")) {
    const next = { ...state, cosmetics: cosmeticsReducer(state.cosmetics, action as CosmeticsAction) };
    persistState(next);
    return next;
  }
  if (action.type.startsWith("SETTINGS_")) {
    const next = { ...state, settings: settingsReducer(state.settings, action as SettingsAction) };
    persistState(next);
    return next;
  }
  if (action.type.startsWith("ENGINE_")) {
    return { ...state, gameEngine: gameEngineReducer(state.gameEngine, action as GameEngineAction) };
  }
  return state;
}

function persistState(state: AppState): void {
  if (typeof window === "undefined") return;
  const save = loadSave();
  saveSave({
    coins: state.wallet.coins,
    seasonCurrency: state.wallet.seasonCurrency,
    totalKills: state.progression.totalKills,
    totalRuns: state.progression.totalRuns,
    bestRun: state.progression.bestRun,
    seasonXp: state.progression.seasonXp,
    seasonState: state.progression.seasonState,
    runHistory: state.progression.runHistory,
    unlockedHeroes: state.progression.unlockedHeroes,
    selectedHero: state.progression.selectedHero,
    unlockedWeapons: state.progression.unlockedWeapons,
    equippedWeapons: state.progression.equippedWeapons,
    campaignProgress: state.progression.campaignProgress,
    bossRushProgress: state.progression.bossRushProgress,
    ownedSkins: state.cosmetics.ownedSkins,
    equippedSkin: state.cosmetics.equippedSkin,
    ownedEmotes: state.cosmetics.ownedEmotes,
    ownedBadges: state.cosmetics.ownedBadges,
    settings: state.settings,
  });
}

export function buildInitialState(auth: AuthSlice = AUTH_INITIAL): AppState {
  let save: SaveData;
  try {
    save = loadSave();
  } catch {
    save = loadSave();
  }
  return {
    auth,
    wallet: walletFromSave(save),
    progression: progressionFromSave(save),
    cosmetics: cosmeticsFromSave(save),
    settings: settingsFromSave(save),
    gameEngine: { ...GAME_ENGINE_INITIAL },
  };
}