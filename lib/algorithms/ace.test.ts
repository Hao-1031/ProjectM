import { describe, it, expect } from "vitest";
import { evaluateClientRisk, evaluateServerRisk, combineRisk, type ClientFeatureSnapshot } from "./ace";

const cleanClient: ClientFeatureSnapshot = {
  averageReactionTimeMs: 220,
  aimConsistencyScore: 0.78,
  microCorrectionCountPerMinute: 24,
  memoryChecksumMismatch: false,
  debuggedProcessCount: 0,
  unknownModuleCount: 0,
  framesPerSecond: 60,
};

const cheatingClient: ClientFeatureSnapshot = {
  averageReactionTimeMs: 60,
  aimConsistencyScore: 0.99,
  microCorrectionCountPerMinute: 140,
  memoryChecksumMismatch: true,
  debuggedProcessCount: 2,
  unknownModuleCount: 4,
  framesPerSecond: 60,
};

describe("ACE 反作弊", () => {
  it("干净客户端风险分为 none", () => {
    const report = evaluateClientRisk(cleanClient);
    expect(report.score).toBeLessThan(20);
  });

  it("作弊客户端客户端分达到 critical", () => {
    const report = evaluateClientRisk(cheatingClient);
    expect(report.score).toBeGreaterThanOrEqual(80);
  });

  it("服务端异常事件会加分", () => {
    const events = [{ type: "damage" as const, value: 5000, expectedMax: 800, timestamp: 0 }];
    expect(evaluateServerRisk(events).score).toBeGreaterThan(0);
  });

  it("双向异常时风险等级更高", () => {
    const events = [
      { type: "damage" as const, value: 3000, expectedMax: 800, timestamp: 0 },
      { type: "movement" as const, value: 120, expectedMax: 40, timestamp: 1 },
    ];
    const combined = combineRisk(cheatingClient, events);
    expect(combined.level).toBe("critical");
    expect(combined.score).toBeGreaterThanOrEqual(combined.clientScore);
  });

  it("正常玩家不产生误报", () => {
    const events = [{ type: "damage" as const, value: 700, expectedMax: 800, timestamp: 0 }];
    const combined = combineRisk(cleanClient, events);
    expect(combined.level).toBe("none");
  });
});
