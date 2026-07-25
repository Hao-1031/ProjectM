import { describe, it, expect } from "vitest";
import {
  calculateEnemyMovement,
  type MovementRequest,
  type MovementEntity,
  type MovementTarget,
} from "./enemyMovement";

function makeRequest(
  overrides: Partial<MovementRequest> = {},
  entityOverrides: Partial<MovementEntity> = {},
  targetOverrides: Partial<MovementTarget> = {}
): MovementRequest {
  return {
    entity: {
      id: "e1",
      position: { x: 100, y: 100 },
      radius: 16,
      speed: 120,
      variant: "walker",
      health: 100,
      maxHealth: 100,
      ...entityOverrides,
    },
    target: {
      position: { x: 300, y: 100 },
      type: "player",
      ...targetOverrides,
    },
    allies: [],
    obstacles: [],
    bounds: { width: 800, height: 600 },
    coordinateMode: "vector",
    ...overrides,
  };
}

describe("敌人移动走位", () => {
  it("追击行为会朝目标移动", () => {
    const result = calculateEnemyMovement(
      makeRequest({ config: { behavior: "pursue" } })
    );
    expect(result.behavior).toBe("pursue");
    expect(result.velocity.x).toBeGreaterThan(0);
    expect(Math.abs(result.velocity.y)).toBeLessThan(10);
  });

  it("拦截行为会考虑目标速度提前量", () => {
    const result = calculateEnemyMovement(
      makeRequest(
        { config: { behavior: "intercept", interceptLead: 0.5 } },
        {},
        { velocity: { x: 200, y: 0 } }
      )
    );
    expect(result.behavior).toBe("intercept");
    expect(result.velocity.x).toBeGreaterThan(0);
  });

  it("风筝行为在过近时远离目标", () => {
    const result = calculateEnemyMovement(
      makeRequest(
        { config: { behavior: "kite", preferredDistance: 180 } },
        { position: { x: 100, y: 100 }, variant: "sniper" },
        { position: { x: 140, y: 100 } }
      )
    );
    expect(result.behavior).toBe("kite");
    expect(result.velocity.x).toBeLessThan(0);
  });

  it("侧翼行为的移动方向不与目标正对", () => {
    const result = calculateEnemyMovement(
      makeRequest(
        { config: { behavior: "flank", flankAngle: Math.PI / 4 } },
        { variant: "runner" }
      )
    );
    expect(result.behavior).toBe("flank");
    expect(result.velocity.x).not.toBeCloseTo(1, 1);
  });

  it("撤退行为会远离目标", () => {
    const result = calculateEnemyMovement(
      makeRequest(
        { config: { behavior: "retreat" } },
        { health: 20, maxHealth: 100 }
      )
    );
    expect(result.behavior).toBe("retreat");
    expect(result.velocity.x).toBeLessThan(0);
  });

  it("拥挤时会受到分离力推开", () => {
    const result = calculateEnemyMovement(
      makeRequest(
        {
          config: { behavior: "pursue", crowdRadius: 120, separationWeight: 2 },
          allies: [
            { id: "a1", position: { x: 100, y: 130 }, radius: 16 },
            { id: "a2", position: { x: 130, y: 100 }, radius: 16 },
          ],
        },
        { position: { x: 100, y: 100 } },
        { position: { x: 300, y: 100 } }
      )
    );
    expect(result.forces.separation.y).not.toBe(0);
  });

  it("障碍会施加避让力", () => {
    const result = calculateEnemyMovement(
      makeRequest(
        {
          config: { behavior: "pursue", obstacleWeight: 3 },
          obstacles: [{ id: "wall", x: 180, y: 80, width: 40, height: 40 }],
        },
        { position: { x: 100, y: 100 } },
        { position: { x: 300, y: 100 } }
      )
    );
    expect(result.forces.obstacle.x).toBeLessThan(0);
  });

  it("进入攻击范围且视线通畅时 shouldAttack 为 true", () => {
    const result = calculateEnemyMovement(
      makeRequest(
        { config: { behavior: "pursue", attackRange: 80 } },
        { position: { x: 100, y: 100 } },
        { position: { x: 150, y: 100 } }
      )
    );
    expect(result.shouldAttack).toBe(true);
  });

  it("网格坐标模式下返回速度单位为格/秒", () => {
    const result = calculateEnemyMovement(
      makeRequest(
        { coordinateMode: "grid", bounds: { width: 40, height: 30 } },
        { id: "g1", position: { col: 5, row: 5 }, speed: 4 },
        { position: { col: 10, row: 5 } }
      )
    );
    expect(result.velocity.x).toBeGreaterThan(0);
    expect(result.targetPosition).toEqual({ x: 10, y: 5 });
  });

  it("包围行为会分散到目标周围", () => {
    const result = calculateEnemyMovement(
      makeRequest(
        { config: { behavior: "surround" } },
        { id: "e1", position: { x: 100, y: 100 }, variant: "disruptor" },
        { position: { x: 300, y: 300 } }
      )
    );
    expect(result.behavior).toBe("surround");
    expect(result.velocity.x).not.toBeCloseTo(1, 1);
    expect(result.velocity.y).not.toBeCloseTo(0, 1);
  });

  it("侧向走位会产生切向速度分量", () => {
    const result = calculateEnemyMovement(
      makeRequest(
        { config: { behavior: "strafe", strafeFrequency: 2, time: 1 } },
        { position: { x: 100, y: 100 }, variant: "spitter" },
        { position: { x: 200, y: 100 } }
      )
    );
    expect(result.behavior).toBe("strafe");
    expect(Math.abs(result.velocity.y)).toBeGreaterThan(10);
  });

  it("找掩体行为会偏向障碍物方向", () => {
    const result = calculateEnemyMovement(
      makeRequest(
        {
          config: {
            behavior: "seek_cover",
            coverLookAhead: 120,
            obstacleWeight: 0,
            separationWeight: 0,
            boundaryWeight: 0,
          },
          obstacles: [{ id: "cover", x: 20, y: 80, width: 60, height: 60 }],
        },
        { position: { x: 100, y: 100 }, health: 20, maxHealth: 100 },
        { position: { x: 300, y: 100 } }
      )
    );
    expect(result.behavior).toBe("seek_cover");
    // 掩体在目标反方向，应远离目标朝掩体移动
    expect(result.velocity.x).toBeLessThan(0);
  });
});
