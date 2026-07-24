import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  loadSave,
  saveSave,
  setSelectedHero,
  getLoadout,
  buyWeapon,
  recordRun,
  calculateRunReward,
  calculateDeathReward,
  type RunHistoryEntry,
} from "./save";

function baseRunResult(overrides: Partial<import("./types").RunResult> = {}): import("./types").RunResult {
  return {
    victory: false,
    surrendered: false,
    stats: {
      kills: 10,
      damageDealt: 2500,
      damageTaken: 100,
      xpCollected: 0,
      resourcesCollected: 30,
      timeSurvived: 120,
      chestsOpened: 0,
      elitesKilled: 0,
      bossesKilled: 0,
      wavesCleared: 2,
      score: 0,
    },
    completedMissions: 1,
    elapsed: 120,
    mode: "campaign",
    ...overrides,
  };
}

describe("save migration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("creates fallback with current version when no save exists", () => {
    const save = loadSave();
    expect(save.version).toBe(4);
    expect(save.selectedHero).toBe("recon");
    expect(save.equippedWeapons).toEqual(["pulse"]);
    expect(save.runHistory).toEqual([]);
  });

  it("migrates legacy v2 hero names to new roster", () => {
    localStorage.setItem(
      "project_m_save_v2",
      JSON.stringify({
        version: 2,
        selectedHero: "scout",
        unlockedWeapons: ["pulse", "shotgun"],
        equippedWeapons: ["pulse", "shotgun"],
        coins: 120,
        totalRuns: 5,
        totalKills: 300,
        bestRun: null,
        settings: { audioEnabled: false, volume: 0.5, vibrationEnabled: true, reducedMotion: true },
      })
    );

    const save = loadSave();
    expect(save.version).toBe(4);
    expect(save.selectedHero).toBe("recon");
    expect(save.coins).toBe(120);
    expect(save.runHistory).toEqual([]);
    expect(save.settings.audioEnabled).toBe(false);
  });

  it("migrates legacy v3 save to v4 with empty run history", () => {
    localStorage.setItem(
      "project_m_save_v3",
      JSON.stringify({
        version: 3,
        selectedHero: "leopard",
        unlockedWeapons: ["pulse"],
        equippedWeapons: ["pulse"],
        coins: 80,
        totalRuns: 5,
        totalKills: 120,
        bestRun: null,
        settings: { audioEnabled: true, volume: 0.8, vibrationEnabled: true, reducedMotion: false },
      })
    );

    const save = loadSave();
    expect(save.version).toBe(4);
    expect(save.selectedHero).toBe("leopard");
    expect(save.coins).toBe(80);
    expect(save.runHistory).toEqual([]);
  });

  it("keeps current version hero when already migrated", () => {
    saveSave({
      version: 4,
      selectedHero: "leopard",
      unlockedWeapons: ["pulse"],
      equippedWeapons: ["pulse"],
      coins: 0,
      totalRuns: 0,
      totalKills: 0,
      bestRun: null,
      runHistory: [],
      settings: { audioEnabled: true, volume: 0.8, vibrationEnabled: true, reducedMotion: false },
    });

    const save = loadSave();
    expect(save.selectedHero).toBe("leopard");
  });

  it("migrates invalid hero to fallback", () => {
    localStorage.setItem(
      "project_m_save_v4",
      JSON.stringify({
        version: 4,
        selectedHero: "nonexistent",
        unlockedWeapons: ["pulse"],
        equippedWeapons: ["pulse"],
        coins: 0,
        totalRuns: 0,
        totalKills: 0,
        bestRun: null,
        runHistory: [],
        settings: { audioEnabled: true, volume: 0.8, vibrationEnabled: true, reducedMotion: false },
      })
    );

    const save = loadSave();
    expect(save.selectedHero).toBe("recon");
  });

  it("getLoadout returns valid defaults", () => {
    const loadout = getLoadout();
    expect(loadout.heroId).toBe("recon");
    expect(loadout.weaponIds.length).toBeGreaterThan(0);
    expect(loadout.weaponIds[0]).toBe("pulse");
  });

  it("setSelectedHero persists and rejects invalid hero", () => {
    setSelectedHero("twilight");
    expect(loadSave().selectedHero).toBe("twilight");

    setSelectedHero("invalid" as import("./types").HeroId);
    expect(loadSave().selectedHero).toBe("twilight");
  });

  it("buyWeapon unlocks weapon and spends coins", () => {
    saveSave({
      version: 4,
      selectedHero: "recon",
      unlockedWeapons: ["pulse"],
      equippedWeapons: ["pulse"],
      coins: 500,
      totalRuns: 0,
      totalKills: 0,
      bestRun: null,
      runHistory: [],
      settings: { audioEnabled: true, volume: 0.8, vibrationEnabled: true, reducedMotion: false },
    });

    const ok = buyWeapon("shotgun");
    expect(ok).toBe(true);
    const save = loadSave();
    expect(save.unlockedWeapons).toContain("shotgun");
    expect(save.coins).toBe(200);
  });
});

describe("death settlement", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("surrender yields no reward", () => {
    const result = baseRunResult({ surrendered: true });
    expect(calculateRunReward(result)).toBe(0);
    expect(calculateDeathReward(result)).toBe(0);
  });

  it("forced death rewards resources based on engagement", () => {
    const result = baseRunResult();
    const reward = calculateDeathReward(result);
    expect(reward).toBeGreaterThan(0);

    recordRun(result);
    const save = loadSave();
    expect(save.coins).toBe(reward);
    expect(save.runHistory).toHaveLength(1);
    expect(save.runHistory[0].victory).toBe(false);
    expect(save.runHistory[0].surrendered).toBe(false);
  });

  it("forced death below minimum time yields no reward", () => {
    const result = baseRunResult({ elapsed: 30, stats: { ...baseRunResult().stats, timeSurvived: 30 } });
    expect(calculateDeathReward(result)).toBe(0);
  });

  it("forced death with no engagement yields no reward", () => {
    const result = baseRunResult({
      stats: { ...baseRunResult().stats, kills: 0, damageDealt: 0, resourcesCollected: 0 },
    });
    expect(calculateDeathReward(result)).toBe(0);
  });

  it("anti-farm reduces reward for repeated rapid deaths", () => {
    const history: RunHistoryEntry[] = [
      { timestamp: 1, mode: "campaign", elapsed: 50, reward: 10, victory: false, surrendered: false },
      { timestamp: 2, mode: "campaign", elapsed: 45, reward: 10, victory: false, surrendered: false },
      { timestamp: 3, mode: "campaign", elapsed: 40, reward: 10, victory: false, surrendered: false },
    ];
    const result = baseRunResult({ elapsed: 50 });
    const reward = calculateDeathReward(result, history);
    expect(reward).toBeLessThan(calculateDeathReward(result, []));
  });

  it("victory uses existing reward formula and ignores death anti-farm", () => {
    const result = baseRunResult({ victory: true });
    expect(calculateRunReward(result)).toBe(150 + 10 * 2 + 2 * 20 + 1 * 30);
  });
});
