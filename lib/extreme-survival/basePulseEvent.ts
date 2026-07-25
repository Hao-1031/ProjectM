import type { PulseEvent, PerformanceSnapshot } from "./types";

export function calculateBasePulseEvents(
  wave: number,
  snapshot: PerformanceSnapshot
): PulseEvent[] {
  const events: PulseEvent[] = [];

  if (wave > 0 && wave % 5 === 0) {
    events.push({
      type: "eliteSurge",
      title: "精英潮",
      description: "该波精英单位比例提升",
      durationSec: 0,
      active: true,
    });
  }

  if (snapshot.coreHealthPercent < 0.35) {
    events.push({
      type: "coreOverload",
      title: "核心过载",
      description: "敌人攻击速度小幅提升",
      durationSec: 10,
      active: true,
    });
  }

  return events;
}
