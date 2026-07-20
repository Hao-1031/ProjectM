export type SfxWaveform = "sine" | "square" | "sawtooth" | "triangle" | "noise";

export type SfxCategory = "weapons" | "enemies" | "heroes" | "ui" | "environment" | "legacy";

export interface SfxConfig {
  category: SfxCategory;
  frequency: number;
  duration: number;
  type: SfxWaveform;
  volume: number;
  slide?: number;
  pitchVariation?: number;
  src?: string;
}

export type SfxKey =
  // Legacy aliases kept for backward compatibility
  | "shoot"
  | "enemyShoot"
  | "hit"
  | "crit"
  | "explosion"
  | "pickup"
  | "levelup"
  | "alert"
  | "hurt"
  // Weapons
  | "pulseShoot"
  | "shotgunBlast"
  | "laserCharge"
  | "rocketLaunch"
  | "flameBurst"
  | "droneDeploy"
  | "plasmaBurst"
  | "railgunFire"
  | "swarmRelease"
  | "gaussShot"
  // Enemies
  | "walkerGrowl"
  | "runnerScreech"
  | "tankStep"
  | "spitterSpit"
  | "eliteRoar"
  | "bossRoar"
  | "sentryBeep"
  | "sniperLock"
  | "stalkerCloak"
  | "crusherSlam"
  | "shielderBubble"
  | "harvesterDrain"
  | "artilleryWhistle"
  | "disruptorPulse"
  // Heroes
  | "nitrogenGrenade"
  | "twilightPulse"
  | "leopardPounce"
  | "reconStrike"
  // UI
  | "buttonClick"
  | "upgradeSelect"
  | "rewardOpen"
  | "missionComplete"
  | "extractionReady"
  | "defeatAlarm"
  // Environment
  | "industrialHum"
  | "frozenWind"
  | "biohazardBubble"
  | "coreOverload";

const SAMPLE_RATE = 44100;

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export function synthesizeSound(config: SfxConfig): string {
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
    } else if (config.type === "triangle") {
      sample = (4 * Math.abs(((freq * t) % 1) - 0.5) - 1) * 0.8;
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

export function getSfxConfig(key: SfxKey): SfxConfig {
  const config = SFX_BANK[key];
  if (!config) {
    throw new Error(`Unknown SFX key: ${key}`);
  }
  return config;
}

export function getSfxKeysByCategory(category: SfxCategory): SfxKey[] {
  return (Object.keys(SFX_BANK) as SfxKey[]).filter((key) => SFX_BANK[key].category === category);
}

export function getSfxSrc(config: SfxConfig): string {
  return config.src ?? synthesizeSound(config);
}

export const SFX_BANK: Record<SfxKey, SfxConfig> = {
  // Legacy aliases
  shoot: {
    category: "legacy",
    frequency: 880,
    duration: 0.08,
    type: "square",
    volume: 0.12,
    slide: -300,
  },
  enemyShoot: {
    category: "legacy",
    frequency: 420,
    duration: 0.12,
    type: "sawtooth",
    volume: 0.14,
    slide: -150,
  },
  hit: { category: "legacy", frequency: 220, duration: 0.06, type: "noise", volume: 0.1 },
  crit: {
    category: "legacy",
    frequency: 1320,
    duration: 0.1,
    type: "square",
    volume: 0.14,
    slide: 600,
  },
  explosion: {
    category: "legacy",
    frequency: 120,
    duration: 0.25,
    type: "noise",
    volume: 0.22,
    slide: -200,
  },
  pickup: {
    category: "legacy",
    frequency: 1320,
    duration: 0.12,
    type: "sine",
    volume: 0.16,
    slide: 400,
  },
  levelup: {
    category: "legacy",
    frequency: 660,
    duration: 0.35,
    type: "sine",
    volume: 0.2,
    slide: 600,
  },
  alert: {
    category: "legacy",
    frequency: 440,
    duration: 0.25,
    type: "sawtooth",
    volume: 0.16,
    slide: 200,
  },
  hurt: {
    category: "legacy",
    frequency: 160,
    duration: 0.18,
    type: "sawtooth",
    volume: 0.18,
    slide: -100,
  },

  // Weapons
  pulseShoot: {
    category: "weapons",
    frequency: 920,
    duration: 0.07,
    type: "square",
    volume: 0.12,
    slide: -240,
    pitchVariation: 0.05,
  },
  shotgunBlast: {
    category: "weapons",
    frequency: 180,
    duration: 0.16,
    type: "noise",
    volume: 0.2,
    pitchVariation: 0.08,
  },
  laserCharge: {
    category: "weapons",
    frequency: 600,
    duration: 0.22,
    type: "sine",
    volume: 0.14,
    slide: 800,
    pitchVariation: 0.03,
  },
  rocketLaunch: {
    category: "weapons",
    frequency: 140,
    duration: 0.28,
    type: "sawtooth",
    volume: 0.22,
    slide: -180,
    pitchVariation: 0.05,
  },
  flameBurst: {
    category: "weapons",
    frequency: 260,
    duration: 0.18,
    type: "noise",
    volume: 0.16,
    pitchVariation: 0.12,
  },
  droneDeploy: {
    category: "weapons",
    frequency: 520,
    duration: 0.2,
    type: "triangle",
    volume: 0.13,
    slide: -100,
    pitchVariation: 0.04,
  },
  plasmaBurst: {
    category: "weapons",
    frequency: 340,
    duration: 0.24,
    type: "sawtooth",
    volume: 0.17,
    slide: 300,
    pitchVariation: 0.06,
  },
  railgunFire: {
    category: "weapons",
    frequency: 200,
    duration: 0.35,
    type: "square",
    volume: 0.24,
    slide: 1200,
    pitchVariation: 0.02,
  },
  swarmRelease: {
    category: "weapons",
    frequency: 1100,
    duration: 0.1,
    type: "sine",
    volume: 0.11,
    slide: -400,
    pitchVariation: 0.1,
  },
  gaussShot: {
    category: "weapons",
    frequency: 150,
    duration: 0.14,
    type: "square",
    volume: 0.21,
    slide: 600,
    pitchVariation: 0.03,
  },

  // Enemies
  walkerGrowl: {
    category: "enemies",
    frequency: 90,
    duration: 0.3,
    type: "sawtooth",
    volume: 0.16,
    pitchVariation: 0.07,
  },
  runnerScreech: {
    category: "enemies",
    frequency: 700,
    duration: 0.18,
    type: "square",
    volume: 0.15,
    slide: 400,
    pitchVariation: 0.1,
  },
  tankStep: {
    category: "enemies",
    frequency: 60,
    duration: 0.35,
    type: "noise",
    volume: 0.18,
    pitchVariation: 0.05,
  },
  spitterSpit: {
    category: "enemies",
    frequency: 450,
    duration: 0.14,
    type: "sawtooth",
    volume: 0.14,
    slide: -200,
    pitchVariation: 0.08,
  },
  eliteRoar: {
    category: "enemies",
    frequency: 220,
    duration: 0.4,
    type: "sawtooth",
    volume: 0.2,
    slide: 150,
    pitchVariation: 0.06,
  },
  bossRoar: {
    category: "enemies",
    frequency: 80,
    duration: 0.8,
    type: "sawtooth",
    volume: 0.26,
    slide: 80,
    pitchVariation: 0.04,
  },
  sentryBeep: {
    category: "enemies",
    frequency: 1600,
    duration: 0.08,
    type: "sine",
    volume: 0.12,
    pitchVariation: 0.05,
  },
  sniperLock: {
    category: "enemies",
    frequency: 900,
    duration: 0.25,
    type: "square",
    volume: 0.13,
    slide: 300,
    pitchVariation: 0.03,
  },
  stalkerCloak: {
    category: "enemies",
    frequency: 300,
    duration: 0.28,
    type: "noise",
    volume: 0.1,
    pitchVariation: 0.08,
  },
  crusherSlam: {
    category: "enemies",
    frequency: 70,
    duration: 0.32,
    type: "noise",
    volume: 0.22,
    pitchVariation: 0.05,
  },
  shielderBubble: {
    category: "enemies",
    frequency: 350,
    duration: 0.3,
    type: "sine",
    volume: 0.14,
    slide: -80,
    pitchVariation: 0.04,
  },
  harvesterDrain: {
    category: "enemies",
    frequency: 180,
    duration: 0.4,
    type: "sawtooth",
    volume: 0.15,
    slide: -120,
    pitchVariation: 0.06,
  },
  artilleryWhistle: {
    category: "enemies",
    frequency: 600,
    duration: 0.5,
    type: "sine",
    volume: 0.17,
    slide: -500,
    pitchVariation: 0.04,
  },
  disruptorPulse: {
    category: "enemies",
    frequency: 240,
    duration: 0.35,
    type: "square",
    volume: 0.16,
    slide: 200,
    pitchVariation: 0.07,
  },

  // Heroes
  nitrogenGrenade: {
    category: "heroes",
    frequency: 1200,
    duration: 0.28,
    type: "sine",
    volume: 0.14,
    slide: 400,
    pitchVariation: 0.04,
  },
  twilightPulse: {
    category: "heroes",
    frequency: 520,
    duration: 0.5,
    type: "sine",
    volume: 0.13,
    slide: -80,
    pitchVariation: 0.03,
  },
  leopardPounce: {
    category: "heroes",
    frequency: 200,
    duration: 0.45,
    type: "sawtooth",
    volume: 0.2,
    slide: 250,
    pitchVariation: 0.05,
  },
  reconStrike: {
    category: "heroes",
    frequency: 160,
    duration: 0.55,
    type: "sine",
    volume: 0.18,
    slide: -60,
    pitchVariation: 0.03,
  },

  // UI
  buttonClick: {
    category: "ui",
    frequency: 800,
    duration: 0.05,
    type: "sine",
    volume: 0.12,
    pitchVariation: 0.02,
  },
  upgradeSelect: {
    category: "ui",
    frequency: 1100,
    duration: 0.12,
    type: "sine",
    volume: 0.14,
    slide: 200,
    pitchVariation: 0.03,
  },
  rewardOpen: {
    category: "ui",
    frequency: 760,
    duration: 0.2,
    type: "sine",
    volume: 0.15,
    slide: 300,
    pitchVariation: 0.04,
  },
  missionComplete: {
    category: "ui",
    frequency: 980,
    duration: 0.35,
    type: "square",
    volume: 0.16,
    slide: 400,
    pitchVariation: 0.03,
  },
  extractionReady: {
    category: "ui",
    frequency: 1320,
    duration: 0.4,
    type: "sine",
    volume: 0.15,
    slide: 250,
    pitchVariation: 0.03,
  },
  defeatAlarm: {
    category: "ui",
    frequency: 280,
    duration: 0.6,
    type: "sawtooth",
    volume: 0.18,
    slide: -60,
    pitchVariation: 0.04,
  },

  // Environment
  industrialHum: {
    category: "environment",
    frequency: 55,
    duration: 2.0,
    type: "sine",
    volume: 0.08,
    pitchVariation: 0.02,
  },
  frozenWind: {
    category: "environment",
    frequency: 180,
    duration: 2.0,
    type: "noise",
    volume: 0.1,
    pitchVariation: 0.05,
  },
  biohazardBubble: {
    category: "environment",
    frequency: 90,
    duration: 2.0,
    type: "sine",
    volume: 0.09,
    pitchVariation: 0.04,
  },
  coreOverload: {
    category: "environment",
    frequency: 45,
    duration: 2.0,
    type: "sawtooth",
    volume: 0.12,
    slide: 40,
    pitchVariation: 0.03,
  },
};
