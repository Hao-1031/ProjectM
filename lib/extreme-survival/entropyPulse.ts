import type { PulseEvent, PerformanceSnapshot } from "./types";

const BRANCH_WAVE = 25;

export function calculateEntropyPulseEvents(
  wave: number,
  snapshot: PerformanceSnapshot
): PulseEvent[] {
  const x = Math.max(0, wave - BRANCH_WAVE);
  const events: PulseEvent[] = [];

  if (x > 0 && x % 5 === 0) {
    events.push({
      type: "eliteSurge",
      title: "猩红潮汐",
      description: "精英单位比例大幅提升",
      durationSec: 0,
      active: true,
    });
  }

  if (x > 0 && x % 7 === 0) {
    events.push({
      type: "fog",
      title: "迷雾压制",
      description: "视野受限",
      durationSec: 15,
      active: true,
    });
  }

  if (snapshot.coreHealthPercent < 0.5) {
    events.push({
      type: "coreOverload",
      title: "据点过载",
      description: "敌人攻击速度大幅提升",
      durationSec: 20,
      active: true,
    });
  }

  if (x > 0 && x % 11 === 0) {
    events.push({
      type: "resourceStorm",
      title: "资源风暴",
      description: "击杀掉落翻倍",
      durationSec: 10,
      active: true,
    });
  }

  if (snapshot.coreHealthPercent < 0.3) {
    events.push({
      type: "redBreath",
      title: "红色呼吸",
      description: "极限警戒状态",
      durationSec: 0,
      active: true,
    });
  }

  return events;
}
