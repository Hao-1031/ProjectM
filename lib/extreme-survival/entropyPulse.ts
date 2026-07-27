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

  if (x > 0 && x % 9 === 0) {
    events.push({
      type: "entropyStorm",
      title: "熵增风暴",
      description: "所有敌人获得随机属性增幅",
      durationSec: 12,
      active: true,
    });
  }

  if (x > 0 && x % 13 === 0) {
    events.push({
      type: "gravityWell",
      title: "重力陷阱",
      description: "玩家移动速度降低30%",
      durationSec: 10,
      active: true,
    });
  }

  if (x > 0 && x % 15 === 0) {
    events.push({
      type: "timeWarp",
      title: "时空扭曲",
      description: "敌人移动速度翻倍，冷却时间减半",
      durationSec: 8,
      active: true,
    });
  }

  if (snapshot.coreHealthPercent < 0.15) {
    events.push({
      type: "doubleTrouble",
      title: "双重危机",
      description: "本波敌人数量翻倍",
      durationSec: 0,
      active: true,
    });
  }

  if (snapshot.coreHealthPercent < 0.1 && x > 10) {
    events.push({
      type: "lastStand",
      title: "最后防线",
      description: "核心进入无敌状态5秒，但敌人攻击力翻倍",
      durationSec: 5,
      active: true,
    });
  }

  return events;
}