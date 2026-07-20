import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadSave, saveSave, setSelectedHero, getLoadout, buyWeapon } from "./save";

describe("save migration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("creates fallback with current version when no save exists", () => {
    const save = loadSave();
    expect(save.version).toBe(3);
    expect(save.selectedHero).toBe("recon");
    expect(save.equippedWeapons).toEqual(["pulse"]);
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
    expect(save.version).toBe(3);
    expect(save.selectedHero).toBe("recon");
    expect(save.coins).toBe(120);
    expect(save.settings.audioEnabled).toBe(false);
  });

  it("keeps current version hero when already migrated", () => {
    saveSave({
      version: 3,
      selectedHero: "leopard",
      unlockedWeapons: ["pulse"],
      equippedWeapons: ["pulse"],
      coins: 0,
      totalRuns: 0,
      totalKills: 0,
      bestRun: null,
      settings: { audioEnabled: true, volume: 0.8, vibrationEnabled: true, reducedMotion: false },
    });

    const save = loadSave();
    expect(save.selectedHero).toBe("leopard");
  });

  it("migrates invalid hero to fallback", () => {
    localStorage.setItem(
      "project_m_save_v3",
      JSON.stringify({
        version: 3,
        selectedHero: "nonexistent",
        unlockedWeapons: ["pulse"],
        equippedWeapons: ["pulse"],
        coins: 0,
        totalRuns: 0,
        totalKills: 0,
        bestRun: null,
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
      version: 3,
      selectedHero: "recon",
      unlockedWeapons: ["pulse"],
      equippedWeapons: ["pulse"],
      coins: 500,
      totalRuns: 0,
      totalKills: 0,
      bestRun: null,
      settings: { audioEnabled: true, volume: 0.8, vibrationEnabled: true, reducedMotion: false },
    });

    const ok = buyWeapon("shotgun");
    expect(ok).toBe(true);
    const save = loadSave();
    expect(save.unlockedWeapons).toContain("shotgun");
    expect(save.coins).toBe(200);
  });
});
