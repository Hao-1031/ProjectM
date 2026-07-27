export type ExtremeSurvivalPhase = "normal" | "overclock";

export interface ExtremeSurvivalRun {
  runId: string;
  wave: number;
  phase: ExtremeSurvivalPhase;
  loadout: {
    heroId: string;
    weaponIds: string[];
  };
  performanceScore: number;
  shieldUsed: boolean;
  overclockBranchChosen: boolean;
  coreHealthPercent: number;
  elapsedTime: number;
  scoreMultiplier: number;
  totalScore: number;
  overclockWavesSurvived: number;
  bossKills: number;
  eliteKills: number;
  perfectWaves: number;
}

export interface WaveEnemyConfig {
  healthMultiplier: number;
  damageMultiplier: number;
  speedMultiplier: number;
  spawnCount: number;
  eliteRatio: number;
  rangedRatio: number;
  specialChance: number;
}

export type PulseEventType = "eliteSurge" | "fog" | "coreOverload" | "resourceStorm" | "redBreath" | "entropyStorm" | "gravityWell" | "timeWarp" | "doubleTrouble" | "lastStand";

export interface PulseEvent {
  type: PulseEventType;
  title: string;
  description: string;
  durationSec: number;
  active: boolean;
}

export interface WaveConfig {
  wave: number;
  phase: ExtremeSurvivalPhase;
  enemyConfig: WaveEnemyConfig;
  events: PulseEvent[];
}

export interface PerformanceSnapshot {
  killsLastWave: number;
  damageTakenLastWave: number;
  coreHealthPercent: number;
  elapsedWaveSec: number;
}

export interface OverclockResult {
  waveConfig: WaveConfig;
  performanceScoreDelta: number;
}
