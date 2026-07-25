import { describe, it, expect } from "vitest";
import { buildBalancedSquad } from "./matchmaking";

describe("PvE 组队平衡", () => {
  it("空队列返回空小队", () => {
    const squad = buildBalancedSquad([]);
    expect(squad.members).toHaveLength(0);
  });

  it("优先保证角色覆盖", () => {
    const queue = [
      { id: "t1", skillScore: 0.9, latencyMs: 50, preferredRole: "tank" as const },
      { id: "d1", skillScore: 0.8, latencyMs: 60, preferredRole: "dps" as const },
      { id: "s1", skillScore: 0.7, latencyMs: 70, preferredRole: "support" as const },
      { id: "d2", skillScore: 0.85, latencyMs: 55, preferredRole: "dps" as const },
    ];
    const squad = buildBalancedSquad(queue);
    expect(squad.roleCoverage).toContain("tank");
    expect(squad.roleCoverage).toContain("dps");
    expect(squad.roleCoverage).toContain("support");
    expect(squad.members).toHaveLength(4);
  });

  it("高延迟玩家不应被选中", () => {
    const queue = [
      { id: "a", skillScore: 0.9, latencyMs: 50 },
      { id: "b", skillScore: 0.8, latencyMs: 500 },
    ];
    const squad = buildBalancedSquad(queue, { maxSize: 2 });
    expect(squad.members.map((m) => m.id)).not.toContain("b");
  });

  it("实力越强预期难度越高", () => {
    const weak = buildBalancedSquad([{ id: "w", skillScore: 0.2, latencyMs: 60 }]);
    const strong = buildBalancedSquad([{ id: "s", skillScore: 0.9, latencyMs: 60 }]);
    expect(strong.estimatedDifficulty).toBeGreaterThan(weak.estimatedDifficulty);
  });
});
