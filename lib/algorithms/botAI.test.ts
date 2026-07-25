import { describe, it, expect } from "vitest";
import {
  calculateBotAI,
  assignBotRole,
  selectBotTarget,
  chooseBotState,
  computeBotMove,
  computeBotAim,
  shouldBotFire,
  findCoverDirection,
  type BotAIEntity,
  type BotAIObstacle,
  type BotAIDifficulty,
  type BotAIConfig,
  type BotAIBounds,
} from "./botAI";

const DEFAULT_WEAPON = { id: "pulse", range: 320, damage: 24, cooldown: 0.4 };

function makeBot(
  overrides: Partial<BotAIEntity> = {},
  weapon = DEFAULT_WEAPON
): BotAIEntity {
  return {
    id: "bot_01",
    x: 400,
    y: 300,
    radius: 16,
    speed: 180,
    maxHealth: 100,
    health: 100,
    teamId: "red",
    weapon,
    ...overrides,
  };
}

function makeTarget(overrides: Partial<BotAIEntity> = {}): BotAIEntity {
  return {
    id: "target_01",
    x: 700,
    y: 300,
    radius: 16,
    speed: 180,
    maxHealth: 100,
    health: 100,
    teamId: "blue",
    weapon: DEFAULT_WEAPON,
    ...overrides,
  };
}

const DEFAULT_BOUNDS: BotAIBounds = { width: 1200, height: 800 };

const DEFAULT_PARAMS: BotAIDifficulty = {
  aggression: 0.6,
  botAccuracy: 0.85,
  botReactionDelay: 0.12,
};

function rng() {
  return 0.5;
}

describe("botAI", () => {
  it("角色定位：长射程高伤害武器判定为狙击手", () => {
    const role = assignBotRole({ id: "rail", range: 700, damage: 90, cooldown: 1.2 });
    expect(role).toBe("sniper");
  });

  it("角色定位：范围武器判定为 controller", () => {
    const role = assignBotRole({ id: "rocket", range: 300, damage: 40, cooldown: 1, areaRadius: 80 });
    expect(role).toBe("controller");
  });

  it("角色定位：高弹速武器判定为 roamer", () => {
    const role = assignBotRole({ id: "laser", range: 300, damage: 30, cooldown: 0.5, projectileSpeed: 600 });
    expect(role).toBe("roamer");
  });

  it("目标选择：优先选择残血目标", () => {
    const self = makeBot();
    const targets = [
      makeTarget({ id: "t1", x: 600, y: 300, health: 100 }),
      makeTarget({ id: "t2", x: 650, y: 300, health: 20 }),
    ];
    const target = selectBotTarget(self, targets, "assault", DEFAULT_PARAMS, null, []);
    expect(target?.id).toBe("t2");
  });

  it("目标选择：无可见目标时返回 null", () => {
    const self = makeBot();
    const target = selectBotTarget(self, [], "assault", DEFAULT_PARAMS, null, []);
    expect(target).toBeNull();
  });

  it("状态机：低血量时进入撤退或找掩体", () => {
    const self = makeBot({ health: 25 });
    const target = makeTarget();
    const state = chooseBotState(self, target, "assault", DEFAULT_PARAMS, rng);
    expect(["flee", "seek_cover"]).toContain(state);
  });

  it("状态机：狙击手远距离追击", () => {
    const self = makeBot();
    const target = makeTarget({ x: 900, y: 300 });
    const state = chooseBotState(self, target, "sniper", DEFAULT_PARAMS, rng);
    expect(state).toBe("chase");
  });

  it("状态机：突击手近距离侧向走位", () => {
    const self = makeBot();
    const target = makeTarget({ x: 500, y: 300 });
    const state = chooseBotState(self, target, "assault", DEFAULT_PARAMS, rng);
    expect(state).toBe("strafe");
  });

  it("走位：追击状态朝向目标移动", () => {
    const self = makeBot({ x: 0, y: 0 });
    const target = makeTarget({ x: 100, y: 0 });
    const config: Required<BotAIConfig> = {
      role: "assault",
      difficulty: DEFAULT_PARAMS,
      preferredRangeScale: 0.6,
      separationWeight: 0,
      obstacleWeight: 0,
      boundaryWeight: 0,
      strafeFrequency: 2,
      coverLookAhead: 120,
      fireCooldown: 0,
      currentTargetId: null,
    };
    const move = computeBotMove(
      self,
      target,
      "chase",
      "assault",
      DEFAULT_PARAMS,
      0,
      [],
      DEFAULT_BOUNDS,
      config,
      []
    );
    expect(move.x).toBeGreaterThan(0.9);
    expect(Math.abs(move.y)).toBeLessThan(0.1);
  });

  it("走位：撤退状态远离目标", () => {
    const self = makeBot({ x: 0, y: 0 });
    const target = makeTarget({ x: 100, y: 0 });
    const config: Required<BotAIConfig> = {
      role: "assault",
      difficulty: DEFAULT_PARAMS,
      preferredRangeScale: 0.6,
      separationWeight: 0,
      obstacleWeight: 0,
      boundaryWeight: 0,
      strafeFrequency: 2,
      coverLookAhead: 120,
      fireCooldown: 0,
      currentTargetId: null,
    };
    const move = computeBotMove(
      self,
      target,
      "flee",
      "assault",
      DEFAULT_PARAMS,
      0,
      [],
      DEFAULT_BOUNDS,
      config,
      []
    );
    expect(move.x).toBeLessThan(-0.9);
    expect(Math.abs(move.y)).toBeLessThan(0.1);
  });

  it("找掩体：偏好障碍物方向", () => {
    const self = makeBot({ x: 200, y: 200 });
    const obstacles: BotAIObstacle[] = [
      { id: "cover", x: 260, y: 200, width: 60, height: 60 },
    ];
    const dir = findCoverDirection(self, obstacles, { x: 1, y: 0 });
    expect(dir.x).toBeGreaterThan(0);
  });

  it("瞄准：含预判与随机散布", () => {
    const self = makeBot({ x: 0, y: 0 });
    const target = makeTarget({ x: 100, y: 0, velocity: { x: 50, y: 0 } });
    const aim = computeBotAim(self, target, DEFAULT_PARAMS, () => 0.5);
    expect(Math.hypot(aim.x, aim.y)).toBeCloseTo(1, 5);
    expect(aim.x).toBeGreaterThan(0);
  });

  it("开火：瞄准精度足够且距离在射程内时开火", () => {
    const self = makeBot({ x: 0, y: 0 });
    const target = makeTarget({ x: 100, y: 0 });
    const aim = { x: 1, y: 0 };
    const fire = shouldBotFire(self, target, aim, DEFAULT_PARAMS);
    expect(fire).toBe(true);
  });

  it("开火：超出射程不开火", () => {
    const self = makeBot({ x: 0, y: 0 });
    const target = makeTarget({ x: 1000, y: 0 });
    const aim = { x: 1, y: 0 };
    const fire = shouldBotFire(self, target, aim, DEFAULT_PARAMS);
    expect(fire).toBe(false);
  });

  it("完整决策：assault 会选中目标并输出标准化向量", () => {
    const self = makeBot();
    const target = makeTarget();
    const result = calculateBotAI({
      self,
      targets: [target],
      allies: [],
      obstacles: [],
      bounds: DEFAULT_BOUNDS,
      time: 1,
      dt: 0.016,
      rngSeed: 12345,
    });

    expect(result.role).toBe("assault");
    expect(result.targetId).toBe("target_01");
    expect(result.state).toBe("chase");
    expect(Math.hypot(result.move.x, result.move.y)).toBeCloseTo(1, 5);
    expect(Math.hypot(result.aim.x, result.aim.y)).toBeCloseTo(1, 5);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("完整决策：健康为 0 时返回 idle 且不移动", () => {
    const self = makeBot({ health: 0 });
    const result = calculateBotAI({
      self,
      targets: [makeTarget()],
      allies: [],
      obstacles: [],
      bounds: DEFAULT_BOUNDS,
      time: 1,
      dt: 0.016,
      rngSeed: 12345,
    });

    expect(result.state).toBe("idle");
    expect(result.move.x).toBe(0);
    expect(result.move.y).toBe(0);
    expect(result.fire).toBe(false);
  });

  it("完整决策：无目标时进入巡逻状态", () => {
    const self = makeBot();
    const result = calculateBotAI({
      self,
      targets: [],
      allies: [],
      obstacles: [],
      bounds: DEFAULT_BOUNDS,
      time: 1,
      dt: 0.016,
      rngSeed: 12345,
    });

    expect(result.state).toBe("idle");
    expect(result.targetId).toBeNull();
    expect(Math.hypot(result.move.x, result.move.y)).toBeCloseTo(1, 5);
  });

  it("完整决策：障碍物会改变移动方向", () => {
    const self = makeBot({ x: 130, y: 200 });
    const target = makeTarget({ x: 400, y: 200 });
    const obstacles: BotAIObstacle[] = [
      { id: "wall", x: 250, y: 120, width: 60, height: 60 },
    ];

    const result = calculateBotAI({
      self,
      targets: [target],
      allies: [],
      obstacles,
      bounds: DEFAULT_BOUNDS,
      time: 1,
      dt: 0.016,
      rngSeed: 12345,
    });

    // 因障碍在前方偏上，移动方向应有明显 y 分量以绕行
    expect(Math.abs(result.move.y)).toBeGreaterThan(0.05);
  });
});
