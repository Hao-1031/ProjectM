// Dynamic Weather System for Defense Mode
// Six weather types with distinct gameplay effects and visual indicators

import { clamp } from "./math";

export type WeatherType = "clear" | "sandstorm" | "thunderstorm" | "fog" | "acidRain" | "blizzard";

export interface WeatherEffect {
  /** Multiplier applied to player movement speed */
  playerSpeedMul: number;
  /** Multiplier applied to enemy movement speed */
  enemySpeedMul: number;
  /** Multiplier applied to all damage dealt */
  damageMul: number;
  /** Multiplier applied to healing received */
  healingMul: number;
  /** Vision range cap (pixels), 0 = no limit */
  visionRange: number;
  /** DOT damage per second applied to all entities */
  dotDamagePerSec: number;
  /** Chance of lightning strike per second per enemy */
  lightningChancePerSec: number;
  /** Lightning strike damage */
  lightningDamage: number;
  /** Overlay color for the screen tint */
  overlayColor: string;
  /** Overlay opacity (0-1) */
  overlayOpacity: number;
  /** Particle density multiplier */
  particleDensity: number;
}

export interface WeatherState {
  type: WeatherType;
  timer: number;
  duration: number;
  nextType: WeatherType;
  transitionProgress: number;
  transitionDuration: number;
}

export interface WeatherConfig {
  minDuration: number;
  maxDuration: number;
  transitionDuration: number;
  clearWeight: number;
  sandstormWeight: number;
  thunderstormWeight: number;
  fogWeight: number;
  acidRainWeight: number;
  blizzardWeight: number;
}

const WEATHER_EFFECTS: Record<WeatherType, WeatherEffect> = {
  clear: {
    playerSpeedMul: 1,
    enemySpeedMul: 1,
    damageMul: 1,
    healingMul: 1,
    visionRange: 0,
    dotDamagePerSec: 0,
    lightningChancePerSec: 0,
    lightningDamage: 0,
    overlayColor: "#141210",
    overlayOpacity: 0,
    particleDensity: 0,
  },
  sandstorm: {
    playerSpeedMul: 0.75,
    enemySpeedMul: 0.6,
    damageMul: 0.9,
    healingMul: 0.8,
    visionRange: 500,
    dotDamagePerSec: 2,
    lightningChancePerSec: 0,
    lightningDamage: 0,
    overlayColor: "#c49a3c",
    overlayOpacity: 0.15,
    particleDensity: 1.2,
  },
  thunderstorm: {
    playerSpeedMul: 0.9,
    enemySpeedMul: 0.85,
    damageMul: 1.25,
    healingMul: 1,
    visionRange: 700,
    dotDamagePerSec: 0,
    lightningChancePerSec: 0.08,
    lightningDamage: 120,
    overlayColor: "#1a1a3e",
    overlayOpacity: 0.2,
    particleDensity: 0.8,
  },
  fog: {
    playerSpeedMul: 0.85,
    enemySpeedMul: 1.1,
    damageMul: 0.85,
    healingMul: 1,
    visionRange: 350,
    dotDamagePerSec: 0,
    lightningChancePerSec: 0,
    lightningDamage: 0,
    overlayColor: "#8a9a9a",
    overlayOpacity: 0.25,
    particleDensity: 0.6,
  },
  acidRain: {
    playerSpeedMul: 0.8,
    enemySpeedMul: 0.7,
    damageMul: 1.1,
    healingMul: 0.3,
    visionRange: 600,
    dotDamagePerSec: 5,
    lightningChancePerSec: 0,
    lightningDamage: 0,
    overlayColor: "#3a5a1a",
    overlayOpacity: 0.18,
    particleDensity: 1.0,
  },
  blizzard: {
    playerSpeedMul: 0.65,
    enemySpeedMul: 0.45,
    damageMul: 0.8,
    healingMul: 0.6,
    visionRange: 450,
    dotDamagePerSec: 3,
    lightningChancePerSec: 0,
    lightningDamage: 0,
    overlayColor: "#aaccff",
    overlayOpacity: 0.22,
    particleDensity: 1.5,
  },
};

const DEFAULT_CONFIG: WeatherConfig = {
  minDuration: 25,
  maxDuration: 55,
  transitionDuration: 3,
  clearWeight: 3,
  sandstormWeight: 2,
  thunderstormWeight: 2,
  fogWeight: 2,
  acidRainWeight: 1.5,
  blizzardWeight: 1.5,
};

export function getWeatherEffect(type: WeatherType): WeatherEffect {
  return WEATHER_EFFECTS[type];
}

export function createWeatherState(initialType?: WeatherType): WeatherState {
  return {
    type: initialType ?? "clear",
    timer: 0,
    duration: 30,
    nextType: "clear",
    transitionProgress: 0,
    transitionDuration: DEFAULT_CONFIG.transitionDuration,
  };
}

export function rollWeatherType(
  previousType: WeatherType,
  config: WeatherConfig = DEFAULT_CONFIG
): WeatherType {
  const weights: Record<WeatherType, number> = {
    clear: config.clearWeight,
    sandstorm: config.sandstormWeight,
    thunderstorm: config.thunderstormWeight,
    fog: config.fogWeight,
    acidRain: config.acidRainWeight,
    blizzard: config.blizzardWeight,
  };

  // Reduce weight of the current type to avoid repeats
  weights[previousType] *= 0.3;

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;

  const types: WeatherType[] = ["clear", "sandstorm", "thunderstorm", "fog", "acidRain", "blizzard"];
  for (const type of types) {
    roll -= weights[type];
    if (roll <= 0) return type;
  }

  return "clear";
}

export function getWeatherDuration(config: WeatherConfig = DEFAULT_CONFIG): number {
  return config.minDuration + Math.random() * (config.maxDuration - config.minDuration);
}

export function updateWeather(
  state: WeatherState,
  dt: number,
  config: WeatherConfig = DEFAULT_CONFIG
): WeatherState {
  const next = { ...state };

  if (next.transitionProgress > 0) {
    next.transitionProgress = Math.max(0, next.transitionProgress - dt / config.transitionDuration);
    if (next.transitionProgress <= 0) {
      next.type = next.nextType;
      next.duration = getWeatherDuration(config);
      next.timer = 0;
    }
    return next;
  }

  next.timer += dt;

  if (next.timer >= next.duration) {
    next.nextType = rollWeatherType(next.type, config);
    next.transitionProgress = 1;
  }

  return next;
}

export function forceWeatherTransition(
  state: WeatherState,
  targetType: WeatherType,
  config: WeatherConfig = DEFAULT_CONFIG
): WeatherState {
  return {
    ...state,
    nextType: targetType,
    transitionProgress: 1,
  };
}

export function getWeatherDisplayName(type: WeatherType): string {
  switch (type) {
    case "clear": return "晴朗";
    case "sandstorm": return "沙尘暴";
    case "thunderstorm": return "雷暴";
    case "fog": return "浓雾";
    case "acidRain": return "酸雨";
    case "blizzard": return "暴风雪";
  }
}

export function getWeatherIcon(type: WeatherType): string {
  switch (type) {
    case "clear": return "☀";
    case "sandstorm": return "🌪";
    case "thunderstorm": return "⚡";
    case "fog": return "🌫";
    case "acidRain": return "☣";
    case "blizzard": return "❄";
  }
}

export function getWeatherDescription(type: WeatherType): string {
  switch (type) {
    case "clear": return "视野清晰，无特殊效果";
    case "sandstorm": return "敌我移速降低，每秒受到微量伤害，视野受限";
    case "thunderstorm": return "所有伤害提升25%，随机落雷打击敌人";
    case "fog": return "视野大幅受限，敌人移速提升，伤害降低";
    case "acidRain": return "每秒受到酸蚀伤害(5点)，治疗效果大幅降低";
    case "blizzard": return "敌我移速大幅降低，每秒受到冰冻伤害(3点)，视野受限";
  }
}

export function getWeatherColor(type: WeatherType): string {
  switch (type) {
    case "clear": return "#22d3ee";
    case "sandstorm": return "#c49a3c";
    case "thunderstorm": return "#6366f1";
    case "fog": return "#8a9a9a";
    case "acidRain": return "#84cc16";
    case "blizzard": return "#aaccff";
  }
}