import { describe, it, expect } from "vitest";
import {
  COSMETICS,
  HERO_UNLOCK_COST,
  DEFAULT_HEROES,
  getCosmetic,
  getHeroCost,
  isDefaultHero,
  getSkinsForHero,
  getCosmeticsByType,
} from "./cosmetics";

describe("cosmetics data", () => {
  it("has unique cosmetic ids", () => {
    const ids = COSMETICS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("default hero only contains recon", () => {
    expect(DEFAULT_HEROES).toEqual(["recon"]);
  });

  it("every hero has a defined unlock cost", () => {
    const heroes: import("./types").HeroId[] = [
      "recon",
      "nitrogen",
      "twilight",
      "leopard",
      "viper",
      "falcon",
      "bastion",
    ];
    for (const hero of heroes) {
      expect(typeof getHeroCost(hero)).toBe("number");
      expect(getHeroCost(hero)).toBeGreaterThanOrEqual(0);
    }
  });

  it("recon is free and other heroes cost coins", () => {
    expect(getHeroCost("recon")).toBe(0);
    expect(getHeroCost("bastion")).toBeGreaterThan(0);
  });

  it("getCosmetic returns correct item or undefined", () => {
    expect(getCosmetic("skin-wasteland")?.name).toBe("废土行者");
    expect(getCosmetic("unknown")).toBeUndefined();
  });

  it("isDefaultHero recognizes default heroes", () => {
    expect(isDefaultHero("recon")).toBe(true);
    expect(isDefaultHero("viper")).toBe(false);
  });

  it("getSkinsForHero includes general and hero-specific skins", () => {
    const nitrogenSkins = getSkinsForHero("nitrogen");
    expect(nitrogenSkins.some((s) => s.id === "skin-wasteland")).toBe(true);
    expect(nitrogenSkins.some((s) => s.id === "skin-nitrogen-deep-freeze")).toBe(true);
    expect(nitrogenSkins.some((s) => s.id === "skin-viper-neurotoxin")).toBe(false);
  });

  it("getCosmeticsByType groups correctly", () => {
    expect(getCosmeticsByType("skin").length).toBeGreaterThan(0);
    expect(getCosmeticsByType("emote").length).toBeGreaterThan(0);
    expect(getCosmeticsByType("badge").length).toBeGreaterThan(0);
    expect(getCosmeticsByType("skin").every((c) => c.type === "skin")).toBe(true);
  });
});
