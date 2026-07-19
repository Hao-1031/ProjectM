import { Howl, Howler } from "howler";
import { SFX_BANK, getSfxSrc, type SfxKey, type SfxConfig, type SfxCategory } from "./sfx";

const SAMPLE_RATE = 44100;

type BgmLayerKey = "drone" | "bass" | "rhythm" | "lead";

interface BgmLayerConfig {
  key: BgmLayerKey;
  baseVolume: number;
  intensityGain: number;
}

const BGM_LAYERS: BgmLayerConfig[] = [
  { key: "drone", baseVolume: 0.8, intensityGain: 0.1 },
  { key: "bass", baseVolume: 0.1, intensityGain: 0.8 },
  { key: "rhythm", baseVolume: 0.0, intensityGain: 0.95 },
  { key: "lead", baseVolume: 0.0, intensityGain: 0.85 },
];

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWav(samples: Float32Array): string {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  for (let i = 0; i < samples.length; i++) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, value * 32767)), true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${typeof window !== "undefined" ? window.btoa(binary) : Buffer.from(binary, "binary").toString("base64")}`;
}

function generateMusicLayerDataUri(layer: BgmLayerKey, duration: number, intensity = 0.5): string {
  const samples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new Float32Array(samples);
  const baseFreq = layer === "drone" ? 55 : layer === "bass" ? 55 : layer === "rhythm" ? 110 : 220;
  const notes = [1, 1.189, 1.335, 1.498, 1.782, 2];

  for (let i = 0; i < samples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / samples;
    const beat = Math.floor(t * 2);
    const noteIndex = beat % notes.length;
    const freq = baseFreq * notes[noteIndex];
    let sample = 0;

    if (layer === "drone") {
      sample += Math.sin(2 * Math.PI * freq * t) * 0.3;
      sample += Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.2;
      sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.05 * intensity;
    } else if (layer === "bass") {
      if (Math.floor(t * 2) % 4 === 0) {
        sample += Math.sin(2 * Math.PI * 40 * ((t * 2) % 1)) * (0.2 + intensity * 0.2);
      }
      sample += Math.sin(2 * Math.PI * freq * 0.25 * t) * 0.1 * intensity;
    } else if (layer === "rhythm") {
      if (Math.floor(t * 4) % 2 === 1) {
        sample += (Math.random() * 2 - 1) * (0.04 + intensity * 0.08);
      }
      if (Math.floor(t * 2) % 4 === 2) {
        sample += (Math.random() * 2 - 1) * (0.03 + intensity * 0.05);
      }
    } else {
      const leadBeat = Math.floor(t * 4);
      const leadNote = notes[leadBeat % notes.length];
      const leadFreq = baseFreq * leadNote;
      sample += Math.sin(2 * Math.PI * leadFreq * t) * (0.05 + intensity * 0.15);
      sample += Math.sin(2 * Math.PI * leadFreq * 1.5 * t) * (0.02 + intensity * 0.05);
    }

    const envelope = Math.min(1, progress * 4) * Math.min(1, (1 - progress) * 4);
    buffer[i] = sample * envelope * (0.5 + intensity * 0.5);
  }

  return encodeWav(buffer);
}

export type { SfxKey, SfxConfig, SfxCategory };

export class AudioManager {
  private sounds: Partial<Record<SfxKey, Howl>> = {};
  private bgmLayers: Partial<Record<BgmLayerKey, Howl>> = {};
  private enabled = true;
  private muted = false;
  private volume = 0.8;
  private bgmVolume = 0.35;
  private intensity = 0;
  private listener = { x: 0, y: 0 };
  private spatialMaxDistance = 800;

  constructor() {
    if (typeof window === "undefined") return;
    this.load();
  }

  load() {
    this.enabled = this.getStoredBool("pm_audio_enabled", true);
    this.muted = this.getStoredBool("pm_audio_mute", false);
    this.volume = this.getStoredNumber("pm_audio_volume", 0.8);
    this.bgmVolume = this.getStoredNumber("pm_bgm_volume", 0.35);

    for (const key of Object.keys(SFX_BANK) as SfxKey[]) {
      try {
        const config = SFX_BANK[key];
        this.sounds[key] = new Howl({
          src: [getSfxSrc(config)],
          format: ["wav"],
          volume: this.volume,
        });
      } catch {
        // Ignore audio initialization errors in restricted environments
      }
    }

    for (const layer of BGM_LAYERS) {
      try {
        this.bgmLayers[layer.key] = new Howl({
          src: [generateMusicLayerDataUri(layer.key, 8, this.intensity)],
          format: ["wav"],
          volume: 0,
          loop: true,
        });
      } catch {
        // Ignore BGM initialization errors
      }
    }

    this.applyBgmLayerVolumes();
    Howler.mute(this.muted || !this.enabled);
    Howler.volume(this.volume);
  }

  startBgm() {
    if (!this.enabled || !this.bgmLayers.drone) return;
    for (const layer of BGM_LAYERS) {
      const howl = this.bgmLayers[layer.key];
      if (howl && !howl.playing()) {
        howl.play();
      }
    }
  }

  stopBgm() {
    for (const layer of Object.values(this.bgmLayers)) {
      if (layer?.playing()) {
        layer.stop();
      }
    }
  }

  setIntensity(value: number) {
    this.intensity = clamp(value, 0, 1);
    this.applyBgmLayerVolumes();
  }

  getIntensity(): number {
    return this.intensity;
  }

  setEnabled(value: boolean) {
    this.enabled = value;
    this.setStoredBool("pm_audio_enabled", value);
    if (!value) {
      Howler.mute(true);
      this.stopBgm();
    } else {
      Howler.mute(this.muted);
      Howler.volume(this.volume);
      this.startBgm();
    }
  }

  setMuted(value: boolean) {
    this.muted = value;
    this.setStoredBool("pm_audio_mute", value);
    Howler.mute(value || !this.enabled);
  }

  isMuted(): boolean {
    return this.muted;
  }

  setVolume(value: number) {
    this.volume = clamp(value, 0, 1);
    this.setStoredNumber("pm_audio_volume", this.volume);
    Howler.volume(this.volume);
    for (const sound of Object.values(this.sounds)) {
      sound?.volume(this.volume);
    }
  }

  setBgmVolume(value: number) {
    this.bgmVolume = clamp(value, 0, 1);
    this.setStoredNumber("pm_bgm_volume", this.bgmVolume);
    this.applyBgmLayerVolumes();
  }

  play(key: SfxKey, options?: { volumeScale?: number; pitchShift?: number }) {
    if (!this.enabled) return;
    const sound = this.sounds[key];
    if (!sound) return;

    const config = SFX_BANK[key];
    const baseVolume = config.volume ?? 1;
    const volumeScale = options?.volumeScale ?? 1;
    const volume = this.volume * baseVolume * volumeScale * (key === "explosion" ? 1.2 : 1);
    sound.volume(volume);

    if (config.pitchVariation || options?.pitchShift) {
      const variation = config.pitchVariation ?? 0;
      const shift = options?.pitchShift ?? 0;
      const rate = 1 + shift + (Math.random() * 2 - 1) * variation;
      sound.rate(clamp(rate, 0.5, 2));
    }

    sound.play();
  }

  setListenerPosition(x: number, y: number) {
    this.listener.x = x;
    this.listener.y = y;
    try {
      Howler.pos(x, y, -0.5);
    } catch {
      // Ignore spatial audio errors in restricted environments
    }
  }

  setSpatialMaxDistance(distance: number) {
    this.spatialMaxDistance = Math.max(1, distance);
  }

  playSpatial(key: SfxKey, x: number, y: number, maxDistance?: number) {
    if (!this.enabled) return;
    const sound = this.sounds[key];
    if (!sound) return;

    const distanceLimit = maxDistance ?? this.spatialMaxDistance;
    const dx = x - this.listener.x;
    const dy = y - this.listener.y;
    const dist = Math.hypot(dx, dy);
    const attenuation = clamp(1 - dist / distanceLimit, 0, 1);

    try {
      sound.pos(x, y, -0.5);
    } catch {
      // Ignore spatial audio errors in restricted environments
    }

    this.play(key, { volumeScale: attenuation });
  }

  private applyBgmLayerVolumes() {
    for (const layer of BGM_LAYERS) {
      const howl = this.bgmLayers[layer.key];
      if (!howl) continue;
      const volume = this.bgmVolume * (layer.baseVolume + layer.intensityGain * this.intensity);
      howl.volume(clamp(volume, 0, 1));
    }
  }

  private getStoredBool(key: string, fallback: boolean): boolean {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : raw === "true";
    } catch {
      return fallback;
    }
  }

  private setStoredBool(key: string, value: boolean) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // Ignore storage errors
    }
  }

  private getStoredNumber(key: string, fallback: number): number {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : Number.parseFloat(raw);
    } catch {
      return fallback;
    }
  }

  private setStoredNumber(key: string, value: number) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // Ignore storage errors
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  const clamped = Math.max(min, Math.min(max, value));
  return clamped;
}

export const audio = typeof window !== "undefined" ? new AudioManager() : null;
