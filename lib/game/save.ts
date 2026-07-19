import type { RunResult } from "./types";

export interface SaveData {
  bestRun: RunResult | null;
  totalKills: number;
  totalRuns: number;
  unlockedWeapons: string[];
  settings: {
    audioEnabled: boolean;
    volume: number;
    vibrationEnabled: boolean;
    reducedMotion: boolean;
  };
}

const SAVE_KEY = "project_m_save_v1";

export function loadSave(): SaveData {
  const fallback: SaveData = {
    bestRun: null,
    totalKills: 0,
    totalRuns: 0,
    unlockedWeapons: ["pulse"],
    settings: {
      audioEnabled: true,
      volume: 0.8,
      vibrationEnabled: true,
      reducedMotion: false,
    },
  };

  if (typeof window === "undefined") return fallback;

  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      ...fallback,
      ...parsed,
      settings: { ...fallback.settings, ...parsed.settings },
    };
  } catch {
    return fallback;
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

  if (result.victory) {
    save.unlockedWeapons = ["pulse", "shotgun", "laser"];
  }

  saveSave(save);
}
