import { describe, it, expect } from "vitest";
import { evaluateNetwork, predictEntityState, type NetworkSnapshot, type EntityState } from "./networkPrediction";

const excellentSnapshot: NetworkSnapshot = {
  latencyMs: 30,
  jitterMs: 5,
  packetLossPercent: 0,
  serverTime: 1000,
  clientTime: 1005,
};

const poorSnapshot: NetworkSnapshot = {
  latencyMs: 250,
  jitterMs: 60,
  packetLossPercent: 4,
  serverTime: 1000,
  clientTime: 1260,
};

const entity: EntityState = {
  x: 100,
  y: 100,
  vx: 200,
  vy: 50,
  timestamp: 950,
};

describe("网络预测与补偿", () => {
  it("评估低延迟网络为 excellent", () => {
    const report = evaluateNetwork(excellentSnapshot);
    expect(report.quality).toBe("excellent");
  });

  it("评估高延迟高抖动网络为 poor 或 critical", () => {
    const report = evaluateNetwork(poorSnapshot);
    expect(["poor", "critical"]).toContain(report.quality);
  });

  it("推荐插值延迟大于当前延迟", () => {
    const report = evaluateNetwork(excellentSnapshot);
    expect(report.recommendedInterpolationMs).toBeGreaterThanOrEqual(excellentSnapshot.latencyMs);
  });

  it("高延迟时预测置信度较低", () => {
    const goodPredicted = predictEntityState(entity, excellentSnapshot);
    const poorPredicted = predictEntityState(entity, poorSnapshot);
    expect(goodPredicted.confidence).toBeGreaterThan(poorPredicted.confidence);
  });

  it("预测位置沿速度方向移动", () => {
    const predicted = predictEntityState(entity, excellentSnapshot);
    expect(predicted.x).toBeGreaterThan(entity.x);
    expect(predicted.y).toBeGreaterThan(entity.y);
  });

  it("高延迟/丢包时建议和解", () => {
    const predicted = predictEntityState(entity, poorSnapshot);
    expect(predicted.reconciliationNeeded).toBe(true);
  });
});
