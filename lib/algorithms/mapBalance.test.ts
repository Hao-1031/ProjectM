import { describe, it, expect } from "vitest";
import { analyzeMapBalance } from "./mapBalance";

describe("地图平衡审计", () => {
  it("空数据返回空报告", () => {
    const report = analyzeMapBalance([]);
    expect(report.variants).toHaveLength(0);
  });

  it("胜率偏离大的变体平衡分低", () => {
    const stats = [
      { variantId: "A", matches: 200, wins: 100, avgDurationSec: 600 },
      { variantId: "B", matches: 200, wins: 160, avgDurationSec: 540 },
    ];
    const report = analyzeMapBalance(stats);
    const a = report.variants.find((v) => v.variantId === "A");
    const b = report.variants.find((v) => v.variantId === "B");
    expect(a?.balanceScore).toBeGreaterThan(b?.balanceScore ?? 0);
  });

  it("样本不足会被提示", () => {
    const stats = [
      { variantId: "A", matches: 200, wins: 100, avgDurationSec: 600 },
      { variantId: "B", matches: 10, wins: 2, avgDurationSec: 700 },
    ];
    const report = analyzeMapBalance(stats);
    expect(report.recommendations.some((r) => r.includes("样本不足"))).toBe(true);
  });

  it("平衡优秀的变体会被推荐为基准", () => {
    const stats = [
      { variantId: "A", matches: 200, wins: 102, avgDurationSec: 600 },
      { variantId: "B", matches: 200, wins: 160, avgDurationSec: 540 },
    ];
    const report = analyzeMapBalance(stats);
    expect(report.recommendations.some((r) => r.includes("基准"))).toBe(true);
  });
});
