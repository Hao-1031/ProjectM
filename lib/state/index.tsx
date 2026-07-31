"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/lib/auth/constants";
import type {
  HeroId,
  WeaponId,
  RunResult,
  SeasonState,
  GameModeType,
  GameStatus,
} from "@/lib/game/types";
import type { CampaignProgress } from "@/lib/game/campaign";
import type { BossRushProgress } from "@/lib/game/boss-rush";
import type { RunHistoryEntry } from "@/lib/game/save";
import {
  loadSave,
  addCoins,
  addSeasonXp,
  addSeasonCurrency,
  spendCoins,
  spendSeasonCurrency,
  buyWeapon,
  buyHero,
  setSelectedHero,
  equipWeapon,
  unequipWeapon,
  buyCosmetic,
  equipSkin,
  recordRun,
  claimSeasonReward,
} from "@/lib/game/save";
import {
  AUTH_INITIAL,
  GAME_ENGINE_INITIAL,
  appStateReducer,
  buildInitialState,
  type AppState,
  type AppStateAction,
  type AuthSlice,
  type WalletSlice,
  type ProgressionSlice,
  type CosmeticsSlice,
  type SettingsSlice,
  type GameEngineSlice,
} from "./atoms";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AppStateContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppStateAction>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

function useAppStateContext(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within an <AppStateProvider>");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AppStateProviderProps {
  children: ReactNode;
  initialAuth?: AuthSlice;
  onAuthError?: (error: string) => void;
}

export function AppStateProvider({
  children,
  initialAuth,
  onAuthError,
}: AppStateProviderProps) {
  const [state, dispatch] = useReducer(
    appStateReducer,
    initialAuth ?? AUTH_INITIAL,
    (auth) => buildInitialState(auth)
  );

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// useAppState – raw access to full state + dispatch
// ---------------------------------------------------------------------------

export function useAppState(): AppStateContextValue {
  return useAppStateContext();
}

// ---------------------------------------------------------------------------
// useAuthState – auth slice
// ---------------------------------------------------------------------------

export interface UseAuthStateReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setLoading: () => void;
  setSuccess: (user: AuthUser | null, isAuthenticated: boolean) => void;
  setError: (error: string) => void;
  signOut: () => void;
  reset: () => void;
}

export function useAuthState(): UseAuthStateReturn {
  const { state, dispatch } = useAppStateContext();

  const setLoading = useCallback(() => dispatch({ type: "AUTH_LOADING" }), [dispatch]);
  const setSuccess = useCallback(
    (user: AuthUser | null, isAuthenticated: boolean) =>
      dispatch({ type: "AUTH_SUCCESS", user, isAuthenticated }),
    [dispatch]
  );
  const setError = useCallback(
    (error: string) => dispatch({ type: "AUTH_ERROR", error }),
    [dispatch]
  );
  const signOut = useCallback(() => dispatch({ type: "AUTH_SIGN_OUT" }), [dispatch]);
  const reset = useCallback(() => dispatch({ type: "AUTH_RESET" }), [dispatch]);

  return {
    user: state.auth.user,
    isAuthenticated: state.auth.isAuthenticated,
    isLoading: state.auth.isLoading,
    error: state.auth.error,
    setLoading,
    setSuccess,
    setError,
    signOut,
    reset,
  };
}

// ---------------------------------------------------------------------------
// useWallet – wallet balance + spend/add
// ---------------------------------------------------------------------------

export interface UseWalletReturn {
  coins: number;
  seasonCurrency: number;
  premiumCurrency: number;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addSeasonCurrency: (amount: number) => void;
  spendSeasonCurrency: (amount: number) => boolean;
  addPremium: (amount: number) => void;
  spendPremium: (amount: number) => boolean;
  canAfford: (amount: number, currency: "coins" | "seasonCurrency" | "premium") => boolean;
}

export function useWallet(): UseWalletReturn {
  const { state, dispatch } = useAppStateContext();

  const addCoinsFn = useCallback(
    (amount: number) => {
      dispatch({ type: "WALLET_ADD_COINS", amount: Math.floor(amount) });
      addCoins(amount);
    },
    [dispatch]
  );

  const spendCoinsFn = useCallback(
    (amount: number): boolean => {
      if (state.wallet.coins < amount) return false;
      dispatch({ type: "WALLET_SPEND_COINS", amount: Math.floor(amount) });
      spendCoins(amount);
      return true;
    },
    [state.wallet.coins, dispatch]
  );

  const addSeasonCurrencyFn = useCallback(
    (amount: number) => {
      dispatch({ type: "WALLET_ADD_SEASON_CURRENCY", amount: Math.floor(amount) });
      addSeasonCurrency(amount);
    },
    [dispatch]
  );

  const spendSeasonCurrencyFn = useCallback(
    (amount: number): boolean => {
      if (state.wallet.seasonCurrency < amount) return false;
      dispatch({ type: "WALLET_SPEND_SEASON_CURRENCY", amount: Math.floor(amount) });
      spendSeasonCurrency(amount);
      return true;
    },
    [state.wallet.seasonCurrency, dispatch]
  );

  const addPremiumFn = useCallback(
    (amount: number) => dispatch({ type: "WALLET_ADD_PREMIUM", amount: Math.floor(amount) }),
    [dispatch]
  );

  const spendPremiumFn = useCallback(
    (amount: number): boolean => {
      if (state.wallet.premiumCurrency < amount) return false;
      dispatch({ type: "WALLET_SPEND_PREMIUM", amount: Math.floor(amount) });
      return true;
    },
    [state.wallet.premiumCurrency, dispatch]
  );

  const canAfford = useCallback(
    (amount: number, currency: "coins" | "seasonCurrency" | "premium"): boolean => {
      switch (currency) {
        case "coins":
          return state.wallet.coins >= amount;
        case "seasonCurrency":
          return state.wallet.seasonCurrency >= amount;
        case "premium":
          return state.wallet.premiumCurrency >= amount;
      }
    },
    [state.wallet]
  );

  return {
    coins: state.wallet.coins,
    seasonCurrency: state.wallet.seasonCurrency,
    premiumCurrency: state.wallet.premiumCurrency,
    addCoins: addCoinsFn,
    spendCoins: spendCoinsFn,
    addSeasonCurrency: addSeasonCurrencyFn,
    spendSeasonCurrency: spendSeasonCurrencyFn,
    addPremium: addPremiumFn,
    spendPremium: spendPremiumFn,
    canAfford,
  };
}

// ---------------------------------------------------------------------------
// usePlayerProgression – player progression data
// ---------------------------------------------------------------------------

export interface UsePlayerProgressionReturn {
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
  recordRun: (result: RunResult) => void;
  unlockHero: (heroId: HeroId) => boolean;
  selectHero: (heroId: HeroId) => void;
  unlockWeapon: (weaponId: WeaponId) => boolean;
  equipWeapon: (weaponId: WeaponId) => boolean;
  unequipWeapon: (weaponId: WeaponId) => boolean;
  addSeasonXp: (amount: number) => void;
  claimReward: (rewardId: string) => { success: boolean; reward: import("@/lib/game/types").SeasonReward | null };
  updateCampaign: (progress: CampaignProgress) => void;
  updateBossRush: (progress: BossRushProgress) => void;
}

export function usePlayerProgression(): UsePlayerProgressionReturn {
  const { state, dispatch } = useAppStateContext();

  const recordRunFn = useCallback(
    (result: RunResult) => {
      dispatch({ type: "PROG_RECORD_RUN", result });
      recordRun(result);
    },
    [dispatch]
  );

  const unlockHeroFn = useCallback(
    (heroId: HeroId): boolean => {
      const success = buyHero(heroId);
      if (success) {
        dispatch({ type: "PROG_UNLOCK_HERO", heroId });
      }
      return success;
    },
    [dispatch]
  );

  const selectHeroFn = useCallback(
    (heroId: HeroId) => {
      dispatch({ type: "PROG_SELECT_HERO", heroId });
      setSelectedHero(heroId);
    },
    [dispatch]
  );

  const unlockWeaponFn = useCallback(
    (weaponId: WeaponId): boolean => {
      const success = buyWeapon(weaponId);
      if (success) {
        dispatch({ type: "PROG_UNLOCK_WEAPON", weaponId });
      }
      return success;
    },
    [dispatch]
  );

  const equipWeaponFn = useCallback(
    (weaponId: WeaponId): boolean => {
      const success = equipWeapon(weaponId);
      if (success) {
        dispatch({ type: "PROG_EQUIP_WEAPON", weaponId });
      }
      return success;
    },
    [dispatch]
  );

  const unequipWeaponFn = useCallback(
    (weaponId: WeaponId): boolean => {
      const success = unequipWeapon(weaponId);
      if (success) {
        dispatch({ type: "PROG_UNEQUIP_WEAPON", weaponId });
      }
      return success;
    },
    [dispatch]
  );

  const addSeasonXpFn = useCallback(
    (amount: number) => {
      dispatch({ type: "PROG_ADD_SEASON_XP", amount });
      addSeasonXp(amount);
    },
    [dispatch]
  );

  const claimRewardFn = useCallback(
    (rewardId: string) => {
      const result = claimSeasonReward(rewardId);
      if (result.success && result.reward) {
        const updatedSave = loadSave();
        dispatch({
          type: "INIT_FROM_SAVE",
          save: updatedSave,
        });
      }
      return result;
    },
    [dispatch]
  );

  const updateCampaignFn = useCallback(
    (progress: CampaignProgress) => dispatch({ type: "PROG_UPDATE_CAMPAIGN", campaignProgress: progress }),
    [dispatch]
  );

  const updateBossRushFn = useCallback(
    (progress: BossRushProgress) => dispatch({ type: "PROG_UPDATE_BOSS_RUSH", bossRushProgress: progress }),
    [dispatch]
  );

  return {
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
    recordRun: recordRunFn,
    unlockHero: unlockHeroFn,
    selectHero: selectHeroFn,
    unlockWeapon: unlockWeaponFn,
    equipWeapon: equipWeaponFn,
    unequipWeapon: unequipWeaponFn,
    addSeasonXp: addSeasonXpFn,
    claimReward: claimRewardFn,
    updateCampaign: updateCampaignFn,
    updateBossRush: updateBossRushFn,
  };
}

// ---------------------------------------------------------------------------
// useCosmetics – cosmetics slice
// ---------------------------------------------------------------------------

export interface UseCosmeticsReturn {
  ownedSkins: string[];
  equippedSkin: string | null;
  ownedEmotes: string[];
  ownedBadges: string[];
  buyCosmetic: (id: string) => boolean;
  equipSkin: (id: string | null) => boolean;
  isOwned: (id: string) => boolean;
}

export function useCosmetics(): UseCosmeticsReturn {
  const { state, dispatch } = useAppStateContext();

  const buyCosmeticFn = useCallback(
    (id: string): boolean => {
      const success = buyCosmetic(id);
      if (success) {
        const updatedSave = loadSave();
        dispatch({ type: "INIT_FROM_SAVE", save: updatedSave });
      }
      return success;
    },
    [dispatch]
  );

  const equipSkinFn = useCallback(
    (id: string | null): boolean => {
      const success = equipSkin(id);
      if (success) {
        dispatch({ type: "COSM_EQUIP_SKIN", skinId: id });
      }
      return success;
    },
    [dispatch]
  );

  const isOwned = useCallback(
    (id: string): boolean => {
      if (state.cosmetics.ownedSkins.includes(id)) return true;
      if (state.cosmetics.ownedEmotes.includes(id)) return true;
      if (state.cosmetics.ownedBadges.includes(id)) return true;
      return false;
    },
    [state.cosmetics]
  );

  return {
    ownedSkins: state.cosmetics.ownedSkins,
    equippedSkin: state.cosmetics.equippedSkin,
    ownedEmotes: state.cosmetics.ownedEmotes,
    ownedBadges: state.cosmetics.ownedBadges,
    buyCosmetic: buyCosmeticFn,
    equipSkin: equipSkinFn,
    isOwned,
  };
}

// ---------------------------------------------------------------------------
// useSettings – settings slice
// ---------------------------------------------------------------------------

export interface UseSettingsReturn {
  audioEnabled: boolean;
  volume: number;
  vibrationEnabled: boolean;
  reducedMotion: boolean;
  toggleAudio: () => void;
  setVolume: (volume: number) => void;
  toggleVibration: () => void;
  toggleReducedMotion: () => void;
}

export function useSettings(): UseSettingsReturn {
  const { state, dispatch } = useAppStateContext();

  const toggleAudio = useCallback(() => dispatch({ type: "SETTINGS_TOGGLE_AUDIO" }), [dispatch]);
  const setVolumeFn = useCallback(
    (volume: number) => dispatch({ type: "SETTINGS_SET_VOLUME", volume }),
    [dispatch]
  );
  const toggleVibration = useCallback(() => dispatch({ type: "SETTINGS_TOGGLE_VIBRATION" }), [dispatch]);
  const toggleReducedMotion = useCallback(
    () => dispatch({ type: "SETTINGS_TOGGLE_REDUCED_MOTION" }),
    [dispatch]
  );

  return {
    audioEnabled: state.settings.audioEnabled,
    volume: state.settings.volume,
    vibrationEnabled: state.settings.vibrationEnabled,
    reducedMotion: state.settings.reducedMotion,
    toggleAudio,
    setVolume: setVolumeFn,
    toggleVibration,
    toggleReducedMotion,
  };
}

// ---------------------------------------------------------------------------
// useGameState – game engine runtime state
// ---------------------------------------------------------------------------

export interface UseGameStateReturn {
  status: GameStatus;
  mode: GameModeType | null;
  isRunning: boolean;
  currentRunId: string | null;
  sessionStartTime: number | null;
  startGame: (mode: GameModeType) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  setStatus: (status: GameStatus) => void;
}

export function useGameState(): UseGameStateReturn {
  const { state, dispatch } = useAppStateContext();

  const startGame = useCallback(
    (mode: GameModeType) => dispatch({ type: "ENGINE_START", mode }),
    [dispatch]
  );
  const pauseGame = useCallback(() => dispatch({ type: "ENGINE_PAUSE" }), [dispatch]);
  const resumeGame = useCallback(() => dispatch({ type: "ENGINE_RESUME" }), [dispatch]);
  const endGame = useCallback(() => dispatch({ type: "ENGINE_END" }), [dispatch]);
  const setStatus = useCallback(
    (status: GameStatus) => dispatch({ type: "ENGINE_SET_STATUS", status }),
    [dispatch]
  );

  return {
    status: state.gameEngine.status,
    mode: state.gameEngine.mode,
    isRunning: state.gameEngine.isRunning,
    currentRunId: state.gameEngine.currentRunId,
    sessionStartTime: state.gameEngine.sessionStartTime,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    setStatus,
  };
}

// ---------------------------------------------------------------------------
// useRefreshFromSave – re-sync in-memory state from localStorage
// ---------------------------------------------------------------------------

export function useRefreshFromSave() {
  const { dispatch } = useAppStateContext();
  return useCallback(() => {
    const save = loadSave();
    dispatch({ type: "INIT_FROM_SAVE", save });
  }, [dispatch]);
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export type {
  AppState,
  AppStateAction,
  AuthSlice,
  WalletSlice,
  ProgressionSlice,
  CosmeticsSlice,
  SettingsSlice,
  GameEngineSlice,
} from "./atoms";