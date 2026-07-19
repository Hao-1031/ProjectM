import { describe, it, expect } from "vitest";
import {
  BOSSES,
  getBossTemplate,
  getRandomBossId,
  advanceBossPhase,
  checkBossPhaseTransition,
  getBossAttackPattern,
} from "./bosses";
import type { BossId, Enemy } from "./types";

function createBossFromTemplate(id: BossId, overrides: Partial<Enemy> = {}): Enemy {
  const template = getBossTemplate(id);
  return {
    id: `boss_${id}`,
    x: 1200,
    y: 900,
    radius: template.radius,
    speed: template.speed,
    health: template.health,
    maxHealth: template.health,
    damage: template.damage,
    xpValue: 200,
    color: template.color,
    variant: id,
    slow: 0,
    isElite: true,
    isBoss: true,
    affixes: [],
    attackTimer: 0,
    attackCooldown: template.phases[0].attackCooldown,
    knockbackX: 0,
    knockbackY: 0,
    burnDuration: 0,
    phase: 0,
    phaseThresholds: [...template.phaseThresholds],
    facing: 0,
    animation: "move",
    animationTimer: 0,
    ...overrides,
  };
}

describe("bosses", () => {
  describe("BOSS registry", () => {
    it("contains five bosses", () => {
      expect(Object.keys(BOSSES)).toHaveLength(5);
    });

    it("every boss has required fields", () => {
      for (const boss of Object.values(BOSSES)) {
        expect(boss.id).toBeTruthy();
        expect(boss.name).toBeTruthy();
        expect(boss.health).toBeGreaterThan(0);
        expect(boss.damage).toBeGreaterThan(0);
        expect(boss.radius).toBeGreaterThan(0);
        expect(boss.speed).toBeGreaterThan(0);
        expect(boss.phases.length).toBeGreaterThanOrEqual(2);
        expect(boss.phaseThresholds.length).toBe(boss.phases.length - 1);
      }
    });
  });

  describe("getBossTemplate", () => {
    it("returns overlord template", () => {
      const template = getBossTemplate("overlord");
      expect(template.id).toBe("overlord");
      expect(template.phases).toHaveLength(3);
    });

    it("returns plaguebringer template", () => {
      const template = getBossTemplate("plaguebringer");
      expect(template.phases.some((p) => p.attackPattern === "summon")).toBe(true);
    });

    it("returns titan template", () => {
      const template = getBossTemplate("titan");
      expect(template.phases.some((p) => p.attackPattern === "spread")).toBe(true);
    });
  });

  describe("getRandomBossId", () => {
    it("returns a valid boss id", () => {
      const id = getRandomBossId();
      expect(Object.keys(BOSSES)).toContain(id);
    });
  });

  describe("advanceBossPhase", () => {
    it("advances phase and applies phase modifiers", () => {
      const boss = createBossFromTemplate("overlord");
      const initialSpeed = boss.speed;
      advanceBossPhase(boss);
      expect(boss.phase).toBe(1);
      expect(boss.attackCooldown).toBe(BOSSES.overlord.phases[1].attackCooldown);
      expect(boss.speed).toBe(initialSpeed * BOSSES.overlord.phases[1].moveSpeedMultiplier * 1.4);
    });

    it("does not advance beyond phase thresholds", () => {
      const boss = createBossFromTemplate("overlord");
      boss.phase = boss.phaseThresholds.length;
      advanceBossPhase(boss);
      expect(boss.phase).toBe(boss.phaseThresholds.length);
    });

    it("executes phase onEnter callbacks", () => {
      const boss = createBossFromTemplate("overlord");
      const initialDamage = boss.damage;
      boss.phase = 1;
      advanceBossPhase(boss);
      expect(boss.damage).toBe(initialDamage * 1.3);
    });

    it("executes template onPhaseEnter callbacks", () => {
      const boss = createBossFromTemplate("overlord");
      const initialSpeed = boss.speed;
      boss.phase = 0;
      advanceBossPhase(boss);
      expect(boss.speed).toBe(initialSpeed * 1.4 * 1.4);
    });

    it("heals titan when entering shield phase", () => {
      const boss = createBossFromTemplate("titan");
      boss.health = boss.maxHealth * 0.5;
      boss.phase = 0;
      advanceBossPhase(boss);
      expect(boss.health).toBe(Math.round(boss.maxHealth * 0.7));
    });

    it("passes engine to onEnter callback", () => {
      const boss = createBossFromTemplate("plaguebringer");
      boss.phase = 0;
      const engine = { state: { enemies: [] } };
      advanceBossPhase(boss, engine);
      expect(boss.phase).toBe(1);
    });
  });

  describe("checkBossPhaseTransition", () => {
    it("transitions when health crosses threshold", () => {
      const boss = createBossFromTemplate("overlord");
      boss.health = boss.maxHealth * 0.6;
      const changed = checkBossPhaseTransition(boss);
      expect(changed).toBe(true);
      expect(boss.phase).toBe(1);
    });

    it("does not transition for non-boss enemies", () => {
      const fakeBoss = createBossFromTemplate("overlord", { isBoss: false });
      fakeBoss.health = fakeBoss.maxHealth * 0.1;
      expect(checkBossPhaseTransition(fakeBoss)).toBe(false);
    });

    it("does not transition when above threshold", () => {
      const boss = createBossFromTemplate("overlord");
      boss.health = boss.maxHealth * 0.8;
      expect(checkBossPhaseTransition(boss)).toBe(false);
      expect(boss.phase).toBe(0);
    });

    it("passes engine reference through transition", () => {
      const boss = createBossFromTemplate("plaguebringer");
      boss.health = boss.maxHealth * 0.2;
      const engine = { state: { enemies: [] } };
      const changed = checkBossPhaseTransition(boss, engine);
      expect(changed).toBe(true);
    });
  });

  describe("getBossAttackPattern", () => {
    it("returns current phase pattern", () => {
      const boss = createBossFromTemplate("titan");
      const pattern = getBossAttackPattern(boss);
      expect(pattern.attackPattern).toBe("single");
      expect(pattern.projectileCount).toBe(1);
    });

    it("returns phase 2 pattern after advancing", () => {
      const boss = createBossFromTemplate("overlord");
      boss.phase = 2;
      const pattern = getBossAttackPattern(boss);
      expect(pattern.attackPattern).toBe("spread");
      expect(pattern.projectileCount).toBe(8);
    });

    it("falls back to default for unknown variant", () => {
      const boss = createBossFromTemplate("overlord", { variant: "boss" as BossId });
      const pattern = getBossAttackPattern(boss);
      expect(pattern.attackPattern).toBe("single");
    });
  });
});
