import type {
  WaveConfig,
  PerformanceSnapshot,
  ExtremeSurvivalPhase,
  OverclockResult,
} from "./types";
import { calculateBaseAttributeConfig } from "./baseAttributeCurve";
import { calculateBaseBehaviorMix } from "./baseBehaviorMix";
import { calculateBasePulseEvents } from "./basePulseEvent";
import { calculateBerserkConfig } from "./berserkProtocol";
import { calculateOverloadField } from "./overloadField";
import { calculateEntropyPulseEvents } from "./entropyPulse";

export const BRANCH_WAVE = 25;

export function calculateWaveConfig(
  wave: number,
  phase: ExtremeSurvivalPhase,
  snapshot: PerformanceSnapshot,
  performanceScore: number
): OverclockResult {
  const isOverclock = phase === "overclock";

  const baseAttrs = calculateBaseAttributeConfig(wave, snapshot);
  const baseBehavior = calculateBaseBehaviorMix(wave, snapshot);
  const baseEvents = calculateBasePulseEvents(wave, snapshot);

  if (!isOverclock) {
    const waveConfig: WaveConfig = {
      wave,
      phase,
      enemyConfig: {
        ...baseAttrs,
        eliteRatio: baseBehavior.eliteRatio,
        rangedRatio: baseBehavior.rangedRatio,
        specialChance: baseBehavior.specialChance,
      },
      events: baseEvents,
    };
    return { waveConfig, performanceScoreDelta: 0 };
  }

  const berserk = calculateBerserkConfig(wave, snapshot, performanceScore);
  const overload = calculateOverloadField(wave, snapshot);
  const entropyEvents = calculateEntropyPulseEvents(wave, snapshot);

  const waveConfig: WaveConfig = {
    wave,
    phase,
    enemyConfig: {
      healthMultiplier: berserk.healthMultiplier,
      damageMultiplier: berserk.damageMultiplier,
      speedMultiplier: berserk.speedMultiplier,
      spawnCount: berserk.spawnCount,
      eliteRatio: overload.eliteRatio,
      rangedRatio: overload.rangedRatio,
      specialChance: overload.specialChance,
    },
    events: entropyEvents,
  };

  const performanceScoreDelta = calculatePerformanceDelta(wave, snapshot, performanceScore);

  return { waveConfig, performanceScoreDelta };
}

export function shouldTriggerBranchChoice(wave: number, phase: ExtremeSurvivalPhase): boolean {
  return phase === "normal" && wave === BRANCH_WAVE;
}

function calculatePerformanceDelta(
  wave: number,
  snapshot: PerformanceSnapshot,
  currentScore: number
): number {
  const x = Math.max(0, wave - BRANCH_WAVE);
  const killBonus = snapshot.killsLastWave * 2;
  const healthPenalty = Math.max(0, 1 - snapshot.coreHealthPercent) * 15;
  const timeBonus = Math.max(0, 60 - snapshot.elapsedWaveSec) * 0.5;
  const overclockMultiplier = 1 + x * 0.05;
  const delta = (killBonus - healthPenalty + timeBonus) * overclockMultiplier;
  return Math.max(-20, Math.min(40, delta));
}

export function calculatePerformanceScore(snapshot: PerformanceSnapshot): number {
  const base = 50;
  const killBonus = snapshot.killsLastWave * 1.5;
  const healthFactor = snapshot.coreHealthPercent * 30;
  const timeBonus = Math.max(0, 60 - snapshot.elapsedWaveSec) * 0.3;
  return Math.max(0, Math.min(200, base + killBonus + healthFactor + timeBonus));
}
