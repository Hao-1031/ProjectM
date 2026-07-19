import { describe, it, expect, beforeEach, vi } from "vitest";
import { AudioManager } from "./audio";
import { Howler } from "howler";

describe("AudioManager", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("initializes with default volume, mute and intensity state", () => {
    const manager = new AudioManager();
    expect((manager as any).enabled).toBe(true);
    expect((manager as any).muted).toBe(false);
    expect((manager as any).volume).toBe(0.8);
    expect((manager as any).bgmVolume).toBe(0.35);
    expect((manager as any).intensity).toBe(0);
    expect((manager as any).listener).toEqual({ x: 0, y: 0 });
  });

  it("loads persisted audio settings from localStorage", () => {
    localStorage.setItem("pm_audio_enabled", "false");
    localStorage.setItem("pm_audio_mute", "true");
    localStorage.setItem("pm_audio_volume", "0.4");
    localStorage.setItem("pm_bgm_volume", "0.2");

    const manager = new AudioManager();
    expect((manager as any).enabled).toBe(false);
    expect((manager as any).muted).toBe(true);
    expect((manager as any).volume).toBe(0.4);
    expect((manager as any).bgmVolume).toBe(0.2);
  });

  it("setVolume updates master volume and persists", () => {
    const manager = new AudioManager();
    manager.setVolume(0.5);
    expect((manager as any).volume).toBe(0.5);
    expect(localStorage.getItem("pm_audio_volume")).toBe("0.5");
    expect(Howler.volume).toHaveBeenCalledWith(0.5);
  });

  it("setBgmVolume updates bgm volume, persists and applies to layers", () => {
    const manager = new AudioManager();
    const layers = (manager as any).bgmLayers as Record<
      string,
      { volume: ReturnType<typeof vi.fn> }
    >;

    manager.setBgmVolume(0.2);
    expect((manager as any).bgmVolume).toBe(0.2);
    expect(localStorage.getItem("pm_bgm_volume")).toBe("0.2");
    const droneLastCall = layers.drone.volume.mock.calls.at(-1)?.[0] as number;
    const bassLastCall = layers.bass.volume.mock.calls.at(-1)?.[0] as number;
    expect(droneLastCall).toBeCloseTo(0.16, 10);
    expect(bassLastCall).toBeCloseTo(0.02, 10);
  });

  it("setEnabled toggles global audio state and persists", () => {
    const manager = new AudioManager();
    manager.setEnabled(false);
    expect((manager as any).enabled).toBe(false);
    expect(localStorage.getItem("pm_audio_enabled")).toBe("false");
    expect(Howler.mute).toHaveBeenCalledWith(true);

    manager.setEnabled(true);
    expect((manager as any).enabled).toBe(true);
    expect(localStorage.getItem("pm_audio_enabled")).toBe("true");
    expect(Howler.mute).toHaveBeenCalledWith(false);
  });

  it("setMuted toggles mute and persists", () => {
    const manager = new AudioManager();
    manager.setMuted(true);
    expect(manager.isMuted()).toBe(true);
    expect(localStorage.getItem("pm_audio_mute")).toBe("true");
    expect(Howler.mute).toHaveBeenCalledWith(true);

    manager.setMuted(false);
    expect(manager.isMuted()).toBe(false);
    expect(localStorage.getItem("pm_audio_mute")).toBe("false");
    expect(Howler.mute).toHaveBeenCalledWith(false);
  });

  it("startBgm plays all layers that are not already playing", () => {
    const manager = new AudioManager();
    const layers = (manager as any).bgmLayers as Record<
      string,
      { playing: ReturnType<typeof vi.fn>; play: ReturnType<typeof vi.fn> }
    >;
    for (const layer of Object.values(layers)) {
      layer.playing.mockReturnValue(false);
    }

    manager.startBgm();
    for (const layer of Object.values(layers)) {
      expect(layer.play).toHaveBeenCalled();
    }
  });

  it("startBgm does nothing when audio is disabled", () => {
    const manager = new AudioManager();
    (manager as any).enabled = false;
    const layers = (manager as any).bgmLayers as Record<
      string,
      { playing: ReturnType<typeof vi.fn>; play: ReturnType<typeof vi.fn> }
    >;
    for (const layer of Object.values(layers)) {
      layer.playing.mockReturnValue(false);
    }

    manager.startBgm();
    for (const layer of Object.values(layers)) {
      expect(layer.play).not.toHaveBeenCalled();
    }
  });

  it("stopBgm stops every playing layer", () => {
    const manager = new AudioManager();
    const layers = (manager as any).bgmLayers as Record<
      string,
      { playing: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }
    >;
    for (const layer of Object.values(layers)) {
      layer.playing.mockReturnValue(true);
    }

    manager.stopBgm();
    for (const layer of Object.values(layers)) {
      expect(layer.stop).toHaveBeenCalled();
    }
  });

  it("play triggers the requested sfx with volume and pitch variation", () => {
    const manager = new AudioManager();
    const sounds = (manager as any).sounds as Record<
      string,
      {
        play: ReturnType<typeof vi.fn>;
        volume: ReturnType<typeof vi.fn>;
        rate: ReturnType<typeof vi.fn>;
      }
    >;

    manager.play("pulseShoot");
    expect(sounds.pulseShoot.play).toHaveBeenCalled();
    expect(sounds.pulseShoot.volume).toHaveBeenCalled();
    expect(sounds.pulseShoot.rate).toHaveBeenCalled();
  });

  it("play respects explicit pitch shift option", () => {
    const manager = new AudioManager();
    const sounds = (manager as any).sounds as Record<
      string,
      { play: ReturnType<typeof vi.fn>; rate: ReturnType<typeof vi.fn> }
    >;

    manager.play("laserCharge", { pitchShift: 0.1 });
    expect(sounds.laserCharge.play).toHaveBeenCalled();
    expect(sounds.laserCharge.rate).toHaveBeenCalled();
    const lastRate = sounds.laserCharge.rate.mock.calls.at(-1)?.[0] as number;
    expect(lastRate).toBeGreaterThanOrEqual(1.05);
    expect(lastRate).toBeLessThanOrEqual(1.15);
  });

  it("play does nothing when audio is disabled", () => {
    const manager = new AudioManager();
    (manager as any).enabled = false;
    const sounds = (manager as any).sounds as Record<string, { play: ReturnType<typeof vi.fn> }>;

    manager.play("explosion");
    expect(sounds.explosion.play).not.toHaveBeenCalled();
  });

  it("setIntensity clamps value and adjusts layer volumes", () => {
    const manager = new AudioManager();
    const layers = (manager as any).bgmLayers as Record<
      string,
      { volume: ReturnType<typeof vi.fn> }
    >;
    const initialCalls = layers.rhythm.volume.mock.calls.length;

    manager.setIntensity(0.5);
    expect((manager as any).intensity).toBe(0.5);
    expect(layers.rhythm.volume.mock.calls.length).toBeGreaterThan(initialCalls);

    manager.setIntensity(2);
    expect((manager as any).intensity).toBe(1);

    manager.setIntensity(-1);
    expect((manager as any).intensity).toBe(0);
  });

  it("setListenerPosition updates the audio listener", () => {
    const manager = new AudioManager();
    manager.setListenerPosition(120, 340);
    expect((manager as any).listener).toEqual({ x: 120, y: 340 });
  });

  it("setSpatialMaxDistance enforces a positive distance", () => {
    const manager = new AudioManager();
    manager.setSpatialMaxDistance(0);
    expect((manager as any).spatialMaxDistance).toBe(1);

    manager.setSpatialMaxDistance(600);
    expect((manager as any).spatialMaxDistance).toBe(600);
  });

  it("playSpatial attenuates sound by distance from listener", () => {
    const manager = new AudioManager();
    manager.setListenerPosition(0, 0);
    manager.setSpatialMaxDistance(200);

    const sounds = (manager as any).sounds as Record<
      string,
      {
        play: ReturnType<typeof vi.fn>;
        volume: ReturnType<typeof vi.fn>;
        pos: ReturnType<typeof vi.fn>;
      }
    >;

    manager.playSpatial("explosion", 100, 0);
    expect(sounds.explosion.pos).toHaveBeenCalledWith(100, 0, -0.5);
    expect(sounds.explosion.play).toHaveBeenCalled();
  });

  it("playSpatial fully attenuates sound beyond max distance", () => {
    const manager = new AudioManager();
    manager.setListenerPosition(0, 0);
    manager.setSpatialMaxDistance(100);

    const sounds = (manager as any).sounds as Record<
      string,
      {
        play: ReturnType<typeof vi.fn>;
        volume: ReturnType<typeof vi.fn>;
        pos: ReturnType<typeof vi.fn>;
      }
    >;

    manager.playSpatial("bossRoar", 0, 100);
    expect(sounds.bossRoar.volume).toHaveBeenLastCalledWith(0);
    expect(sounds.bossRoar.play).toHaveBeenCalled();
  });
});
