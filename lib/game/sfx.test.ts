import { describe, it, expect } from "vitest";
import {
  SFX_BANK,
  getSfxConfig,
  getSfxKeysByCategory,
  getSfxSrc,
  synthesizeSound,
  type SfxConfig,
} from "./sfx";

describe("SFX bank", () => {
  it("exposes real weapon sound keys", () => {
    const keys = getSfxKeysByCategory("weapons");
    expect(keys).toContain("pulseShoot");
    expect(keys).toContain("railgunFire");
    expect(keys).toContain("rocketLaunch");
    expect(keys.length).toBeGreaterThanOrEqual(8);
  });

  it("exposes real enemy sound keys", () => {
    const keys = getSfxKeysByCategory("enemies");
    expect(keys).toContain("walkerGrowl");
    expect(keys).toContain("bossRoar");
    expect(keys).toContain("eliteRoar");
  });

  it("exposes real hero skill sound keys", () => {
    const keys = getSfxKeysByCategory("heroes");
    expect(keys).toContain("nitrogenGrenade");
    expect(keys).toContain("twilightPulse");
    expect(keys).toContain("leopardPounce");
    expect(keys).toContain("reconStrike");
  });

  it("exposes UI and environment sound keys", () => {
    expect(getSfxKeysByCategory("ui")).toContain("buttonClick");
    expect(getSfxKeysByCategory("environment")).toContain("industrialHum");
  });

  it("returns configuration for a known key", () => {
    const config = getSfxConfig("bossRoar");
    expect(config.category).toBe("enemies");
    expect(config.frequency).toBe(80);
    expect(config.volume).toBeGreaterThan(0);
  });

  it("throws for unknown keys", () => {
    expect(() => getSfxConfig("unknownSound" as keyof typeof SFX_BANK)).toThrow("Unknown SFX key");
  });

  it("returns empty array for categories with no sounds", () => {
    expect(getSfxKeysByCategory("legacy").length).toBeGreaterThan(0);
    expect(getSfxKeysByCategory("notACategory" as never)).toEqual([]);
  });
});

describe("SFX synthesis", () => {
  it("synthesizes a valid WAV data URI", () => {
    const config: SfxConfig = {
      category: "ui",
      frequency: 440,
      duration: 0.05,
      type: "sine",
      volume: 0.1,
    };
    const uri = synthesizeSound(config);
    expect(uri.startsWith("data:audio/wav;base64,")).toBe(true);
    expect(uri.length).toBeGreaterThan(100);
  });

  it("synthesizes noise waveforms", () => {
    const config: SfxConfig = {
      category: "enemies",
      frequency: 120,
      duration: 0.05,
      type: "noise",
      volume: 0.2,
    };
    const uri = synthesizeSound(config);
    expect(uri.startsWith("data:audio/wav;base64,")).toBe(true);
  });

  it("uses explicit src when provided", () => {
    const config: SfxConfig = {
      category: "ui",
      frequency: 800,
      duration: 0.05,
      type: "sine",
      volume: 0.1,
      src: "/sounds/custom.wav",
    };
    expect(getSfxSrc(config)).toBe("/sounds/custom.wav");
  });

  it("falls back to synthesis when src is missing", () => {
    const config: SfxConfig = {
      category: "ui",
      frequency: 800,
      duration: 0.05,
      type: "sine",
      volume: 0.1,
    };
    expect(getSfxSrc(config)).toContain("data:audio/wav;base64,");
  });
});
