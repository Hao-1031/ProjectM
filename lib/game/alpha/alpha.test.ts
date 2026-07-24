import { describe, it, expect, vi } from "vitest";
import type { Player, HeroId, EnemyVariant } from "../types";
import type { HeroBuildSnapshot } from "./types";
import {
  DEFAULT_ALPHA_PARAMS,
  sigmoidDifficulty,
  applyBreathingFactor,
  efficiencyFactor,
  createHeroBuildSnapshot,
  getCounterWeights,
  computeDifficulty,
  isVariantCounteredByHero,
} from "./core";
import {
  waveEnemyCount,
  eliteCount,
  generateVariantStats,
  generateEnemyWave,
  generateBossStats,
  applyPlayerCountScaling,
  resolveWaveVariants,
  ALPHA_ENEMY_VARIANTS,
} from "./generator";
import { AlphaTelemetryBuffer, AlphaScheduler, createAlphaRuntime } from "./scheduler";

function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "p1",
    x: 0,
    y: 0,
    radius: 14,
    speed: 260,
    maxHealth: 300,
    health: 300,
    level: 1,
    xp: 0,
    xpToNext: 100,
    weapons: [
      {
        id: "pulse",
        name: "脉冲步枪",
        level: 1,
        maxLevel: 5,
        cooldown: 0.34,
        timer: 0,
        damage: 20,
        range: 520,
        projectileSpeed: 920,
        count: 1,
        spread: 0.05,
        pierce: 1,
        color: "#22d3ee",
        description: "测试武器",
      },
    ],
    passives: [],
    invincible: 0,
    magnetRange: 120,
    armor: 0,
    critChance: 0.05,
    cooldownReduction: 0,
    areaMultiplier: 1,
    regen: 0,
    heroId: null,
    activeSkill: null,
    skillTimer: 0,
    ultimateSkill: null,
    ultimateTimer: 0,
    deployableUpgrades: {},
    talentLevels: {},
    leopardFrenzyTimer: 0,
    leopardBloodlustStacks: 0,
    leopardBloodlustTimer: 0,
    knockbackX: 0,
    knockbackY: 0,
    burnDuration: 0,
    burnDamage: 0,
    facing: 0,
    animation: "idle",
    animationTimer: 0,
    ...overrides,
  } as Player;
}

describe("alpha core", () => {
  describe("sigmoidDifficulty", () => {
    it("returns low value at start of single wave", () => {
      expect(sigmoidDifficulty(0, 1)).toBeLessThan(0.02);
    });

    it("starts near 0 and ends near 1 across multiple waves", () => {
      const start = sigmoidDifficulty(0, 11);
      const end = sigmoidDifficulty(10, 11);
      expect(start).toBeLessThan(0.05);
      expect(end).toBeGreaterThan(0.95);
    });

    it("midpoint lands near 0.5 with default params", () => {
      // midpoint=0.55, totalWaves=11 -> waveIndex=6 gives t=0.6 closest to midpoint
      const mid = sigmoidDifficulty(6, 11);
      expect(mid).toBeCloseTo(0.6, 1);
    });
  });

  describe("applyBreathingFactor", () => {
    it("returns base difficulty when no boss waves", () => {
      const base = 0.5;
      expect(applyBreathingFactor(base, 3, 10, [])).toBe(base);
    });

    it("reduces difficulty before boss wave", () => {
      const base = 0.6;
      const result = applyBreathingFactor(base, 4, 10, [5]);
      expect(result).toBeLessThan(base);
    });

    it("reduces difficulty more after boss wave", () => {
      const base = 0.6;
      const pre = applyBreathingFactor(base, 4, 10, [5]);
      const post = applyBreathingFactor(base, 6, 10, [5]);
      expect(post).toBeLessThan(pre);
    });
  });

  describe("efficiencyFactor", () => {
    it("returns 1 for empty window", () => {
      expect(
        efficiencyFactor({ spawned: 0, killed: 0, killRate: 0, expectedKillRate: 0.75 })
      ).toBe(1);
    });

    it("increases difficulty when player overperforms", () => {
      const factor = efficiencyFactor({
        spawned: 10,
        killed: 10,
        killRate: 1,
        expectedKillRate: 0.75,
      });
      expect(factor).toBeGreaterThan(1);
    });

    it("decreases difficulty when player underperforms", () => {
      const factor = efficiencyFactor({
        spawned: 10,
        killed: 3,
        killRate: 0.3,
        expectedKillRate: 0.75,
      });
      expect(factor).toBeLessThan(1);
    });

    it("clamps within configured bounds", () => {
      const low = efficiencyFactor({
        spawned: 10,
        killed: 0,
        killRate: 0,
        expectedKillRate: 0.75,
      });
      const high = efficiencyFactor({
        spawned: 10,
        killed: 10,
        killRate: 1,
        expectedKillRate: 0.75,
      });
      expect(low).toBeGreaterThanOrEqual(DEFAULT_ALPHA_PARAMS.efficiency.minFactor);
      expect(high).toBeLessThanOrEqual(DEFAULT_ALPHA_PARAMS.efficiency.maxFactor);
    });
  });

  describe("createHeroBuildSnapshot", () => {
    it("calculates total dps from weapons", () => {
      const player = createMockPlayer();
      const build = createHeroBuildSnapshot(player);
      expect(build.totalDps).toBeCloseTo(20 / 0.34, 1);
    });

    it("detects crowd control from hero", () => {
      const player = createMockPlayer({ heroId: "nitrogen" as HeroId });
      const build = createHeroBuildSnapshot(player);
      expect(build.hasCrowdControl).toBe(true);
    });

    it("detects area damage from weapons", () => {
      const player = createMockPlayer({
        weapons: [
          {
            id: "rocket",
            name: "火箭",
            level: 1,
            maxLevel: 5,
            cooldown: 1,
            timer: 0,
            damage: 55,
            range: 620,
            projectileSpeed: 580,
            count: 1,
            spread: 0.08,
            pierce: 0,
            color: "#f43f5e",
            description: "测试",
            areaRadius: 62,
          },
        ],
      });
      const build = createHeroBuildSnapshot(player);
      expect(build.hasAreaDamage).toBe(true);
    });
  });

  describe("getCounterWeights", () => {
    it("returns equal weights for neutral build", () => {
      const build: HeroBuildSnapshot = {
        heroId: null,
        totalDps: 180,
        averageRange: 420,
        hasCrowdControl: false,
        hasAreaDamage: false,
        hasBurstDamage: false,
        survivability: 250,
      };
      const weights = getCounterWeights(build, ALPHA_ENEMY_VARIANTS);
      const values = Object.values(weights);
      const allOnes = values.every((v) => v === 1);
      expect(allOnes).toBe(true);
    });

    it("boosts fast enemies against long range burst build", () => {
      const build = createHeroBuildSnapshot(
        createMockPlayer({
          heroId: "recon" as HeroId,
          weapons: [
            {
              id: "railgun",
              name: "磁轨炮",
              level: 1,
              maxLevel: 5,
              cooldown: 1,
              timer: 0,
              damage: 72,
              range: 900,
              projectileSpeed: 1450,
              count: 1,
              spread: 0,
              pierce: 8,
              color: "#60a5fa",
              description: "测试",
            },
          ],
        })
      );
      const weights = getCounterWeights(build, ALPHA_ENEMY_VARIANTS);
      expect(weights.runner).toBeGreaterThan(1);
      expect(weights.stalker).toBeGreaterThan(1);
    });

    it("reduces tank weight for low dps build", () => {
      const build = createHeroBuildSnapshot(createMockPlayer());
      build.totalDps = 100;
      const weights = getCounterWeights(build, ALPHA_ENEMY_VARIANTS);
      expect(weights.crusher).toBeLessThan(1);
      expect(weights.tank).toBeLessThan(1);
    });
  });

  describe("computeDifficulty", () => {
    it("returns linear fallback when disabled", () => {
      const snapshot = computeDifficulty(
        5,
        11,
        { spawned: 10, killed: 8, killRate: 0.8, expectedKillRate: 0.75 },
        createHeroBuildSnapshot(createMockPlayer()),
        [],
        { ...DEFAULT_ALPHA_PARAMS, enabled: false }
      );
      expect(snapshot.baseDifficulty).toBeCloseTo(0.5, 1);
      expect(snapshot.efficiencyFactor).toBe(1);
      expect(snapshot.counterFactor).toBe(1);
    });

    it("produces smooth sigmoid progression", () => {
      const build = createHeroBuildSnapshot(createMockPlayer());
      const values: number[] = [];
      for (let i = 0; i < 11; i++) {
        const s = computeDifficulty(
          i,
          11,
          { spawned: 10, killed: 8, killRate: 0.8, expectedKillRate: 0.75 },
          build,
          []
        );
        values.push(s.finalDifficulty);
      }
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i - 1] - 0.05);
      }
      expect(values[values.length - 1]).toBeGreaterThan(values[0]);
    });
  });

  describe("isVariantCounteredByHero", () => {
    it("identifies recon countered by fast flyers", () => {
      expect(isVariantCounteredByHero("drone", "recon")).toBe(true);
    });

    it("returns false for unknown hero", () => {
      expect(isVariantCounteredByHero("drone", null)).toBe(false);
    });
  });
});

describe("alpha generator", () => {
  describe("waveEnemyCount", () => {
    it("grows with wave progress", () => {
      const early = waveEnemyCount(0, 11, 0.2);
      const late = waveEnemyCount(10, 11, 0.9);
      expect(late).toBeGreaterThan(early);
    });

    it("respects minimum count", () => {
      expect(waveEnemyCount(0, 11, 0)).toBeGreaterThanOrEqual(4);
    });
  });

  describe("eliteCount", () => {
    it("returns 0 when elite chance is 0", () => {
      expect(eliteCount(5, 11, 0.5, 0)).toBe(0);
    });

    it("scales with elite chance", () => {
      const count = waveEnemyCount(5, 11, 0.5);
      expect(eliteCount(5, 11, 0.5, 0.5)).toBeGreaterThanOrEqual(Math.floor(count * 0.5));
    });
  });

  describe("generateVariantStats", () => {
    it("scales stats with difficulty", () => {
      const low = generateVariantStats("walker", 0.2, false);
      const high = generateVariantStats("walker", 0.9, false);
      expect(high.maxHp).toBeGreaterThan(low.maxHp);
      expect(high.damage).toBeGreaterThan(low.damage);
      expect(high.speed).toBeGreaterThan(low.speed);
    });

    it("makes elites stronger", () => {
      const normal = generateVariantStats("walker", 0.5, false);
      const elite = generateVariantStats("walker", 0.5, true);
      expect(elite.maxHp).toBeGreaterThan(normal.maxHp);
    });
  });

  describe("generateEnemyWave", () => {
    it("produces valid wave stats", () => {
      const snapshot = computeDifficulty(
        3,
        11,
        { spawned: 10, killed: 8, killRate: 0.8, expectedKillRate: 0.75 },
        createHeroBuildSnapshot(createMockPlayer()),
        []
      );
      const wave = generateEnemyWave(snapshot, createHeroBuildSnapshot(createMockPlayer()));
      expect(wave.waveEnemyCount).toBeGreaterThan(0);
      expect(wave.spawnIntervalMs).toBeGreaterThanOrEqual(220);
      expect(wave.maxActiveCount).toBeGreaterThanOrEqual(6);
      expect(Object.keys(wave.variantWeights).length).toBeGreaterThan(0);
    });

    it("caps elite chance for early waves", () => {
      const snapshot = computeDifficulty(
        0,
        11,
        { spawned: 10, killed: 8, killRate: 0.8, expectedKillRate: 0.75 },
        createHeroBuildSnapshot(createMockPlayer()),
        []
      );
      const wave = generateEnemyWave(snapshot, createHeroBuildSnapshot(createMockPlayer()));
      expect(wave.eliteChance).toBe(0);
    });
  });

  describe("resolveWaveVariants", () => {
    it("returns requested count", () => {
      const weights = Object.fromEntries(ALPHA_ENEMY_VARIANTS.map((v) => [v, 1])) as Record<
        EnemyVariant,
        number
      >;
      const variants = resolveWaveVariants(12, weights);
      expect(variants.length).toBe(12);
    });
  });

  describe("generateBossStats", () => {
    it("scales boss health with progress", () => {
      const earlySnapshot = computeDifficulty(
        2,
        11,
        { spawned: 10, killed: 8, killRate: 0.8, expectedKillRate: 0.75 },
        createHeroBuildSnapshot(createMockPlayer()),
        []
      );
      const lateSnapshot = computeDifficulty(
        9,
        11,
        { spawned: 10, killed: 8, killRate: 0.8, expectedKillRate: 0.75 },
        createHeroBuildSnapshot(createMockPlayer()),
        []
      );
      const early = generateBossStats("colossus", earlySnapshot, []);
      const late = generateBossStats("colossus", lateSnapshot, []);
      expect(late.healthMultiplier).toBeGreaterThan(early.healthMultiplier);
    });

    it("provides relief multipliers", () => {
      const snapshot = computeDifficulty(
        5,
        11,
        { spawned: 10, killed: 8, killRate: 0.8, expectedKillRate: 0.75 },
        createHeroBuildSnapshot(createMockPlayer()),
        []
      );
      const boss = generateBossStats("colossus", snapshot, []);
      expect(boss.preBossRelief).toBeLessThan(1);
      expect(boss.postBossRelief).toBeLessThan(boss.preBossRelief);
    });
  });

  describe("applyPlayerCountScaling", () => {
    it("increases stats with more players", () => {
      const snapshot = computeDifficulty(
        3,
        11,
        { spawned: 10, killed: 8, killRate: 0.8, expectedKillRate: 0.75 },
        createHeroBuildSnapshot(createMockPlayer()),
        []
      );
      const base = generateEnemyWave(snapshot, createHeroBuildSnapshot(createMockPlayer()));
      const scaled = applyPlayerCountScaling(base, 3);
      expect(scaled.maxHp).toBeGreaterThan(base.maxHp);
      expect(scaled.waveEnemyCount).toBeGreaterThan(base.waveEnemyCount);
    });
  });
});

describe("alpha scheduler", () => {
  describe("AlphaTelemetryBuffer", () => {
    it("tracks spawn and kill window", () => {
      const buffer = new AlphaTelemetryBuffer(30);
      const now = Date.now();
      buffer.recordSpawn(1, "walker", now);
      buffer.recordSpawn(1, "runner", now);
      buffer.recordKill(1, "walker", now);
      const window = buffer.getWindow(now);
      expect(window.spawned).toBe(2);
      expect(window.killed).toBe(1);
    });

    it("prunes old events", () => {
      const buffer = new AlphaTelemetryBuffer(1);
      const now = Date.now();
      buffer.recordSpawn(1, "walker", now - 2000);
      buffer.recordKill(1, "walker", now);
      const window = buffer.getWindow(now);
      expect(window.spawned).toBe(0);
      expect(window.killed).toBe(1);
    });

    it("calculates kill window correctly", () => {
      const buffer = new AlphaTelemetryBuffer(30);
      const now = Date.now();
      for (let i = 0; i < 10; i++) buffer.recordSpawn(1, "walker", now);
      for (let i = 0; i < 8; i++) buffer.recordKill(1, "walker", now);
      const kw = buffer.toKillWindow(0.8);
      expect(kw.spawned).toBe(10);
      expect(kw.killed).toBe(8);
      expect(kw.killRate).toBe(0.8);
      expect(kw.expectedKillRate).toBe(0.8);
    });
  });

  describe("AlphaScheduler", () => {
    it("initializes with default plan", () => {
      const scheduler = new AlphaScheduler({ totalWaves: 10, bossWaves: [4, 9] });
      const plan = scheduler.getCurrentPlan();
      expect(plan.waveIndex).toBe(0);
      expect(plan.isBossWave).toBe(false);
      expect(plan.enemyStats.waveEnemyCount).toBeGreaterThan(0);
    });

    it("advances waves and clears telemetry", () => {
      const scheduler = new AlphaScheduler({ totalWaves: 10, bossWaves: [9] });
      scheduler.telemetry.recordSpawn(0, "walker");
      scheduler.nextWave();
      expect(scheduler.getCurrentPlan().waveIndex).toBe(1);
      expect(scheduler.telemetry.getWindow().spawned).toBe(0);
    });

    it("marks boss waves correctly", () => {
      const scheduler = new AlphaScheduler({ totalWaves: 10, bossWaves: [4, 9] });
      scheduler.setWave(4);
      const plan = scheduler.getCurrentPlan();
      expect(plan.isBossWave).toBe(true);
      expect(plan.bossStats).toBeDefined();
      expect(plan.enemyStats.waveEnemyCount).toBeLessThan(
        scheduler.planWave(3).enemyStats.waveEnemyCount
      );
    });

    it("responds to player efficiency", () => {
      const scheduler = new AlphaScheduler({ totalWaves: 10, bossWaves: [] });
      scheduler.setPlayerBuilds([createHeroBuildSnapshot(createMockPlayer())]);
      const before = scheduler.tick();
      scheduler.telemetry.recordSpawn(2, "walker");
      scheduler.telemetry.recordSpawn(2, "walker");
      scheduler.telemetry.recordSpawn(2, "walker");
      scheduler.telemetry.recordKill(2, "walker");
      const after = scheduler.tick();
      expect(after.efficiencyFactor).toBeLessThan(before.efficiencyFactor);
    });

    it("provides rhythm metrics", () => {
      const scheduler = new AlphaScheduler({ totalWaves: 10, bossWaves: [5] });
      scheduler.telemetry.recordSpawn(0, "walker");
      scheduler.telemetry.recordKill(0, "walker");
      const metrics = scheduler.getRhythmMetrics(0.8, 0.9);
      expect(metrics.intensity).toBeGreaterThanOrEqual(0);
      expect(metrics.pressure).toBeGreaterThan(0);
      expect(metrics.killEfficiency).toBe(1);
    });

    it("generates all plans", () => {
      const scheduler = new AlphaScheduler({ totalWaves: 5, bossWaves: [2, 4] });
      const plans = scheduler.generateAllPlans();
      expect(plans.length).toBe(5);
      expect(plans[2]?.isBossWave).toBe(true);
      expect(plans[4]?.isBossWave).toBe(true);
    });
  });

  describe("createAlphaRuntime", () => {
    it("creates a runtime context", () => {
      const runtime = createAlphaRuntime({ totalWaves: 8, bossWaves: [4, 7] });
      expect(runtime.scheduler).toBeInstanceOf(AlphaScheduler);
      expect(runtime.events).toEqual([]);
      expect(runtime.startTime).toBeLessThanOrEqual(Date.now());
    });
  });
});
