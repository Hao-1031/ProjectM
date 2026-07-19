import { Howl, Howler } from "howler";

export type SoundKey =
  "shoot" | "hit" | "explosion" | "pickup" | "levelup" | "alert" | "hurt" | "enemyShoot";

interface SoundConfig {
  frequency: number;
  duration: number;
  type: "sine" | "square" | "sawtooth" | "noise";
  volume: number;
  slide?: number;
}

const SOUND_CONFIGS: Record<SoundKey, SoundConfig> = {
  shoot: { frequency: 880, duration: 0.08, type: "square", volume: 0.12, slide: -300 },
  enemyShoot: { frequency: 420, duration: 0.12, type: "sawtooth", volume: 0.14, slide: -150 },
  hit: { frequency: 220, duration: 0.06, type: "noise", volume: 0.1 },
  explosion: { frequency: 120, duration: 0.25, type: "noise", volume: 0.22, slide: -200 },
  pickup: { frequency: 1320, duration: 0.12, type: "sine", volume: 0.16, slide: 400 },
  levelup: { frequency: 660, duration: 0.35, type: "sine", volume: 0.2, slide: 600 },
  alert: { frequency: 440, duration: 0.25, type: "sawtooth", volume: 0.16, slide: 200 },
  hurt: { frequency: 160, duration: 0.18, type: "sawtooth", volume: 0.18, slide: -100 },
};

const SAMPLE_RATE = 44100;

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function generateWavDataUri(config: SoundConfig): string {
  const samples = Math.floor(SAMPLE_RATE * config.duration);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
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
  view.setUint32(40, samples * 2, true);

  const phase = 0;
  for (let i = 0; i < samples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / samples;
    const freq = config.slide ? config.frequency + config.slide * progress : config.frequency;
    let sample = 0;

    if (config.type === "noise") {
      sample = (Math.random() * 2 - 1) * Math.sin(Math.PI * progress) * 2;
    } else if (config.type === "square") {
      sample = Math.sin(2 * Math.PI * freq * t + phase) > 0 ? 1 : -1;
    } else if (config.type === "sawtooth") {
      sample = 2 * ((freq * t) % 1) - 1;
    } else {
      sample = Math.sin(2 * Math.PI * freq * t + phase);
    }

    const envelope = Math.min(1, (1 - progress) * 4) * (1 - progress);
    const value = sample * config.volume * envelope;
    view.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, value * 32767)), true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${typeof window !== "undefined" ? window.btoa(binary) : Buffer.from(binary, "binary").toString("base64")}`;
}

function generateMusicDataUri(duration: number, intensity = 0.5): string {
  const samples = Math.floor(SAMPLE_RATE * duration);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
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
  view.setUint32(40, samples * 2, true);

  const baseFreq = 55; // A1
  const notes = [1, 1.189, 1.335, 1.498, 1.782, 2];

  for (let i = 0; i < samples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / samples;
    const beat = Math.floor(t * 2); // BPM 120
    const noteIndex = beat % notes.length;
    const freq = baseFreq * notes[noteIndex];

    let sample = 0;
    // Deep drone
    sample += Math.sin(2 * Math.PI * freq * t) * 0.3;
    sample += Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.2;
    // Hi-hat-ish noise on off-beats
    if (Math.floor(t * 4) % 2 === 1) {
      sample += (Math.random() * 2 - 1) * 0.05 * intensity;
    }
    // Bass pulse
    if (Math.floor(t * 2) % 4 === 0) {
      sample += Math.sin(2 * Math.PI * 40 * ((t * 2) % 1)) * 0.15;
    }

    const envelope = Math.min(1, progress * 4) * Math.min(1, (1 - progress) * 4);
    const value = sample * 0.12 * envelope * (0.6 + intensity * 0.4);
    view.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, value * 32767)), true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${typeof window !== "undefined" ? window.btoa(binary) : Buffer.from(binary, "binary").toString("base64")}`;
}

export class AudioManager {
  private sounds: Partial<Record<SoundKey, Howl>> = {};
  private bgm: Howl | null = null;
  private enabled = true;
  private volume = 0.8;
  private bgmVolume = 0.35;
  private intensity = 0;

  constructor() {
    if (typeof window === "undefined") return;
    this.load();
  }

  load() {
    this.enabled = this.getStoredBool("pm_audio_enabled", true);
    this.volume = this.getStoredNumber("pm_audio_volume", 0.8);
    this.bgmVolume = this.getStoredNumber("pm_bgm_volume", 0.35);

    for (const key of Object.keys(SOUND_CONFIGS) as SoundKey[]) {
      try {
        this.sounds[key] = new Howl({
          src: [generateWavDataUri(SOUND_CONFIGS[key])],
          format: ["wav"],
          volume: this.volume,
        });
      } catch {
        // Ignore audio initialization errors in restricted environments
      }
    }

    try {
      this.bgm = new Howl({
        src: [generateMusicDataUri(30, this.intensity)],
        format: ["wav"],
        volume: this.bgmVolume,
        loop: true,
      });
    } catch {
      // Ignore BGM initialization errors
    }
  }

  startBgm() {
    if (!this.enabled || !this.bgm) return;
    if (!this.bgm.playing()) {
      this.bgm.play();
    }
  }

  stopBgm() {
    if (this.bgm?.playing()) {
      this.bgm.stop();
    }
  }

  setIntensity(value: number) {
    this.intensity = clamp(value, 0, 1);
    if (this.bgm) {
      this.bgm.volume(this.bgmVolume * (0.7 + this.intensity * 0.3));
    }
  }

  setEnabled(value: boolean) {
    this.enabled = value;
    this.setStoredBool("pm_audio_enabled", value);
    if (!value) {
      Howler.mute(true);
    } else {
      Howler.mute(false);
      Howler.volume(this.volume);
      this.startBgm();
    }
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
    this.bgm?.volume(this.bgmVolume);
  }

  play(key: SoundKey) {
    if (!this.enabled) return;
    const sound = this.sounds[key];
    if (sound) {
      sound.volume(this.volume * (key === "explosion" ? 1.2 : 1));
      sound.play();
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
  return Math.max(min, Math.min(max, value));
}

export const audio = typeof window !== "undefined" ? new AudioManager() : null;
