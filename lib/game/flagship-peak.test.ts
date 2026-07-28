import { describe, it, expect } from "vitest";
import {
  createFlagshipPeakState,
  getFlagshipPeakPhase,
  getPhaseDisplayName,
  getPhaseAccentColor,
  getPhaseDifficultyMultiplier,
  generateFlagshipPeakChallenges,
  generateFlagshipPeakTasks,
  recordFlagshipPeakKill,
  recordFlagshipPeakBossKill,
  recordFlagshipPeakWaveCleared,
  calculateFlagshipPeakSpeedRank,
  calculateFlagshipPeakSeasonRank,
  getFlagshipPeakSpeedRankMultiplier,
  getFlagshipPeakSpeedRankName,
  getFlagshipPeakSeasonRankName,
  getFlagshipPeakVisualConfig,
  generateFlagshipPeakWaveConfig,
  FLAGSHIP_PEAK_TOTAL_WAVES,
  FLAGSHIP_PEAK_STANDARD_END,
  FLAGSHIP_PEAK_OVERCLOCK_END,
  FLAGSHIP_PEAK_BOSS_WAVE_1,
  FLAGSHIP_PEAK_BOSS_WAVE_2,
  FLAGSHIP_PEAK_FINAL_BOSS_WAVE,
} from "./flagship-peak";
import type { GameState, DefenseState, FlagshipPeakPhase } from "./types";

function makeMockGameState(overrides: Partial<GameState> = {}): GameState {
  const base = {
    mode: "flagship-peak" as const,
    status: "running" as const,
    time: 0,
    score: 0,
    enemies: [] as any[],
    projectiles: [] as any[],
    enemyProjectiles: [] as any[],
    pickups: [] as any[],
    particles: [] as any[],
    damageNumbers: [] as any[],
    events: [] as any[],
    missions: [] as any[],
    currentMissionIndex: 0,
    seed: 12345,
    rng: () => Math.random(),
    totalKills: 0,
    totalEliteKills: 0,
    totalBossKills: 0,
    combo: 0,
    maxCombo: 0,
    roguelikeState: undefined,
    extremeSurvivalState: undefined,
    deathmatchState: undefined,
    fixedWaveState: undefined,
    peakChallengeState: undefined,
    networkRole: undefined,
    networkState: undefined,
    weatherState: undefined,
    curseBlessingState: undefined,
    difficultyConfig: undefined,
  };

  return {
    ...base,
    flagshipPeakState: createFlagshipPeakState(),
    defenseState: {
      core: { x: 800, y: 450, health: 100, maxHealth: 100, radius: 40, color: "#6366f1" },
      nodes: [],
      energy: 0,
      targetEnergy: 100,
      currentWave: 0,
      totalWaves: 8,
      waveInProgress: false,
      waveTimer: 0,
      breakTimer: 0,
      waves: [],
      deployables: [],
      selectedHeroes: {},
    },
    ...overrides,
  } as unknown as GameState;
}

describe("flagship-peak", () => {
  describe("createFlagshipPeakState", () => {
    it("initializes with standard phase and zero wave", () => {
      const state = createFlagshipPeakState();
      expect(state.phase).toBe("standard");
      expect(state.wave).toBe(0);
      expect(state.totalWaves).toBe(25);
      expect(state.score).toBe(0);
      expect(state.combos).toBe(0);
      expect(state.maxCombo).toBe(0);
      expect(state.bossKills).toBe(0);
      expect(state.eliteKills).toBe(0);
    });

    it("initializes with default rankings", () => {
      const state = createFlagshipPeakState();
      expect(state.speedRank).toBe("none");
      expect(state.seasonRank).toBe("bronze");
      expect(state.seasonXp).toBe(0);
      expect(state.seasonCurrency).toBe(0);
    });

    it("generates initial challenges", () => {
      const state = createFlagshipPeakState();
      expect(state.challenges.length).toBe(6);
      expect(state.challenges.every((c) => !c.completed)).toBe(true);
    });

    it("has empty tasks array", () => {
      const state = createFlagshipPeakState();
      expect(state.tasks).toEqual([]);
    });
  });

  describe("getFlagshipPeakPhase", () => {
    it("returns standard for waves 1-10", () => {
      expect(getFlagshipPeakPhase(1)).toBe("standard");
      expect(getFlagshipPeakPhase(5)).toBe("standard");
      expect(getFlagshipPeakPhase(10)).toBe("standard");
    });

    it("returns overclock for waves 11-20", () => {
      expect(getFlagshipPeakPhase(11)).toBe("overclock");
      expect(getFlagshipPeakPhase(15)).toBe("overclock");
      expect(getFlagshipPeakPhase(20)).toBe("overclock");
    });

    it("returns hell for waves 21+", () => {
      expect(getFlagshipPeakPhase(21)).toBe("hell");
      expect(getFlagshipPeakPhase(25)).toBe("hell");
      expect(getFlagshipPeakPhase(30)).toBe("hell");
    });
  });

  describe("getPhaseDisplayName", () => {
    it("returns Chinese names for all phases", () => {
      const phases: FlagshipPeakPhase[] = ["standard", "overclock", "hell", "victory", "defeat"];
      const expected = ["标准巡航", "超频增压", "地狱终局", "胜利", "失败"];
      phases.forEach((p, i) => {
        expect(getPhaseDisplayName(p)).toBe(expected[i]);
      });
    });
  });

  describe("getPhaseAccentColor", () => {
    it("returns distinct colors per phase", () => {
      expect(getPhaseAccentColor("standard")).toBe("#6366f1");
      expect(getPhaseAccentColor("overclock")).toBe("#ef4444");
      expect(getPhaseAccentColor("hell")).toBe("#a855f7");
      expect(getPhaseAccentColor("victory")).toBe("#22c55e");
      expect(getPhaseAccentColor("defeat")).toBe("#ef4444");
    });
  });

  describe("getPhaseDifficultyMultiplier", () => {
    it("returns increasing multipliers", () => {
      expect(getPhaseDifficultyMultiplier("standard")).toBe(1.0);
      expect(getPhaseDifficultyMultiplier("overclock")).toBe(1.5);
      expect(getPhaseDifficultyMultiplier("hell")).toBe(2.0);
    });
  });

  describe("generateFlagshipPeakChallenges", () => {
    it("generates 6 challenges per tier", () => {
      const challenges = generateFlagshipPeakChallenges(1);
      expect(challenges).toHaveLength(6);
    });

    it("each challenge has unique id", () => {
      const challenges = generateFlagshipPeakChallenges(1);
      const ids = challenges.map((c) => c.id);
      expect(new Set(ids).size).toBe(6);
    });

    it("all challenges start uncompleted", () => {
      const challenges = generateFlagshipPeakChallenges(1);
      expect(challenges.every((c) => !c.completed)).toBe(true);
    });

    it("all challenges start with zero progress", () => {
      const challenges = generateFlagshipPeakChallenges(1);
      expect(challenges.every((c) => c.progress === 0)).toBe(true);
    });

    it("challenges have reward scores", () => {
      const challenges = generateFlagshipPeakChallenges(1);
      expect(challenges.every((c) => c.rewardScore > 0)).toBe(true);
    });
  });

  describe("generateFlagshipPeakTasks", () => {
    it("returns empty for standard phase", () => {
      const tasks = generateFlagshipPeakTasks("standard", 5);
      expect(tasks).toEqual([]);
    });

    it("generates tasks for overclock phase", () => {
      const tasks = generateFlagshipPeakTasks("overclock", 11);
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks.every((t) => t.phase === "overclock")).toBe(true);
    });

    it("generates tasks for hell phase", () => {
      const tasks = generateFlagshipPeakTasks("hell", 21);
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks.every((t) => t.phase === "hell")).toBe(true);
    });

    it("all tasks start uncompleted", () => {
      const tasks = generateFlagshipPeakTasks("hell", 21);
      expect(tasks.every((t) => !t.completed)).toBe(true);
    });
  });

  describe("recordFlagshipPeakKill", () => {
    it("increments combo and score", () => {
      const state = makeMockGameState();
      const fp = state.flagshipPeakState!;
      const prevScore = fp.score;
      const prevCombo = fp.combos;

      recordFlagshipPeakKill(state, false);

      expect(fp.combos).toBe(prevCombo + 1);
      expect(fp.score).toBeGreaterThan(prevScore);
      expect(fp.seasonXp).toBeGreaterThan(0);
    });

    it("increments elite kills for elite enemies", () => {
      const state = makeMockGameState();
      const fp = state.flagshipPeakState!;
      recordFlagshipPeakKill(state, true);
      expect(fp.eliteKills).toBe(1);
    });

    it("does not increment elite kills for normal enemies", () => {
      const state = makeMockGameState();
      const fp = state.flagshipPeakState!;
      recordFlagshipPeakKill(state, false);
      expect(fp.eliteKills).toBe(0);
    });

    it("tracks max combo", () => {
      const state = makeMockGameState();
      const fp = state.flagshipPeakState!;
      for (let i = 0; i < 10; i++) {
        recordFlagshipPeakKill(state, false);
      }
      expect(fp.maxCombo).toBe(10);
    });
  });

  describe("recordFlagshipPeakBossKill", () => {
    it("increments boss kills and awards score", () => {
      const state = makeMockGameState();
      const fp = state.flagshipPeakState!;
      const prevBossKills = fp.bossKills;

      recordFlagshipPeakBossKill(state);

      expect(fp.bossKills).toBe(prevBossKills + 1);
      expect(fp.score).toBe(200);
      expect(fp.seasonXp).toBe(20);
      expect(fp.seasonCurrency).toBe(10);
    });
  });

  describe("recordFlagshipPeakWaveCleared", () => {
    it("increments wave counter", () => {
      const state = makeMockGameState();
      const fp = state.flagshipPeakState!;
      state.defenseState!.currentWave = 4;
      state.defenseState!.waveTimer = 45;

      recordFlagshipPeakWaveCleared(state);

      expect(fp.wave).toBe(5);
    });

    it("awards score and xp", () => {
      const state = makeMockGameState();
      const fp = state.flagshipPeakState!;
      state.defenseState!.currentWave = 0;
      state.defenseState!.waveTimer = 60;

      const prevScore = fp.score;
      recordFlagshipPeakWaveCleared(state);

      expect(fp.score).toBeGreaterThan(prevScore);
      expect(fp.seasonXp).toBeGreaterThan(0);
    });

    it("records wave clear time", () => {
      const state = makeMockGameState();
      const fp = state.flagshipPeakState!;
      state.defenseState!.currentWave = 0;
      state.defenseState!.waveTimer = 42;

      recordFlagshipPeakWaveCleared(state);

      expect(fp.waveClearTimes).toContain(42);
    });

    it("awards time bonus for fast clears", () => {
      const state = makeMockGameState();
      const fp = state.flagshipPeakState!;
      state.defenseState!.currentWave = 0;
      state.defenseState!.waveTimer = 30;

      recordFlagshipPeakWaveCleared(state);

      expect(fp.timeAttackScore).toBeGreaterThan(0);
    });

    it("awards perfect wave when core is undamaged", () => {
      const state = makeMockGameState();
      const fp = state.flagshipPeakState!;
      state.defenseState!.currentWave = 0;
      state.defenseState!.waveTimer = 50;
      state.defenseState!.core.health = state.defenseState!.core.maxHealth;

      recordFlagshipPeakWaveCleared(state);

      expect(fp.perfectWaves).toBe(1);
    });

    it("generates overclock tasks at wave 11", () => {
      const state = makeMockGameState();
      const fp = state.flagshipPeakState!;
      state.defenseState!.currentWave = 10;
      state.defenseState!.waveTimer = 50;

      recordFlagshipPeakWaveCleared(state);

      expect(fp.tasks.length).toBeGreaterThan(0);
      expect(fp.tasks.every((t) => t.phase === "overclock")).toBe(true);
    });

    it("generates hell tasks at wave 21", () => {
      const state = makeMockGameState();
      const fp = state.flagshipPeakState!;
      state.defenseState!.currentWave = 20;
      state.defenseState!.waveTimer = 50;

      recordFlagshipPeakWaveCleared(state);

      expect(fp.tasks.length).toBeGreaterThan(0);
      expect(fp.tasks.every((t) => t.phase === "hell")).toBe(true);
    });
  });

  describe("calculateFlagshipPeakSpeedRank", () => {
    it("returns none for zero wave", () => {
      expect(calculateFlagshipPeakSpeedRank(0, 0)).toBe("none");
    });

    it("returns diamond for excellent time attack", () => {
      expect(calculateFlagshipPeakSpeedRank(1000, 10)).toBe("diamond");
    });

    it("returns bronze for poor time attack", () => {
      expect(calculateFlagshipPeakSpeedRank(300, 15)).toBe("bronze");
    });

    it("returns none for very low time attack", () => {
      expect(calculateFlagshipPeakSpeedRank(10, 5)).toBe("none");
    });
  });

  describe("calculateFlagshipPeakSeasonRank", () => {
    it("returns bronze for low xp", () => {
      expect(calculateFlagshipPeakSeasonRank(0)).toBe("bronze");
      expect(calculateFlagshipPeakSeasonRank(1000)).toBe("bronze");
    });

    it("returns silver at 2000 xp", () => {
      expect(calculateFlagshipPeakSeasonRank(2000)).toBe("silver");
    });

    it("returns gold at 5000 xp", () => {
      expect(calculateFlagshipPeakSeasonRank(5000)).toBe("gold");
    });

    it("returns grandmaster at 100000 xp", () => {
      expect(calculateFlagshipPeakSeasonRank(100000)).toBe("grandmaster");
    });
  });

  describe("getFlagshipPeakSpeedRankMultiplier", () => {
    it("returns correct multipliers", () => {
      expect(getFlagshipPeakSpeedRankMultiplier("none")).toBe(1);
      expect(getFlagshipPeakSpeedRankMultiplier("bronze")).toBe(1.1);
      expect(getFlagshipPeakSpeedRankMultiplier("silver")).toBe(1.2);
      expect(getFlagshipPeakSpeedRankMultiplier("gold")).toBe(1.35);
      expect(getFlagshipPeakSpeedRankMultiplier("platinum")).toBe(1.5);
      expect(getFlagshipPeakSpeedRankMultiplier("diamond")).toBe(1.75);
    });
  });

  describe("getFlagshipPeakSpeedRankName", () => {
    it("returns Chinese rank names", () => {
      expect(getFlagshipPeakSpeedRankName("none")).toBe("未评级");
      expect(getFlagshipPeakSpeedRankName("bronze")).toBe("青铜");
      expect(getFlagshipPeakSpeedRankName("silver")).toBe("白银");
      expect(getFlagshipPeakSpeedRankName("gold")).toBe("黄金");
      expect(getFlagshipPeakSpeedRankName("platinum")).toBe("铂金");
      expect(getFlagshipPeakSpeedRankName("diamond")).toBe("钻石");
    });
  });

  describe("getFlagshipPeakSeasonRankName", () => {
    it("returns Chinese rank names", () => {
      expect(getFlagshipPeakSeasonRankName("bronze")).toBe("青铜");
      expect(getFlagshipPeakSeasonRankName("silver")).toBe("白银");
      expect(getFlagshipPeakSeasonRankName("gold")).toBe("黄金");
      expect(getFlagshipPeakSeasonRankName("platinum")).toBe("铂金");
      expect(getFlagshipPeakSeasonRankName("diamond")).toBe("钻石");
      expect(getFlagshipPeakSeasonRankName("master")).toBe("大师");
      expect(getFlagshipPeakSeasonRankName("grandmaster")).toBe("宗师");
    });
  });

  describe("getFlagshipPeakVisualConfig", () => {
    it("returns bridge theme for standard", () => {
      const config = getFlagshipPeakVisualConfig("standard");
      expect(config.hudTheme).toBe("bridge");
      expect(config.screenShakeIntensity).toBe(0);
    });

    it("returns alert theme for overclock", () => {
      const config = getFlagshipPeakVisualConfig("overclock");
      expect(config.hudTheme).toBe("alert");
      expect(config.screenShakeIntensity).toBe(0.4);
    });

    it("returns void theme for hell", () => {
      const config = getFlagshipPeakVisualConfig("hell");
      expect(config.hudTheme).toBe("void");
      expect(config.screenShakeIntensity).toBe(0.7);
      expect(config.particleDensity).toBe(1.5);
    });
  });

  describe("generateFlagshipPeakWaveConfig", () => {
    it("generates config for standard phase", () => {
      const config = generateFlagshipPeakWaveConfig(1);
      expect(config.enemyCount).toBeGreaterThan(0);
      expect(config.eliteCount).toBe(0);
      expect(config.bossVariant).toBeNull();
    });

    it("generates boss at wave 10", () => {
      const config = generateFlagshipPeakWaveConfig(10);
      expect(config.bossVariant).toBe("overlord");
    });

    it("generates boss at wave 23", () => {
      const config = generateFlagshipPeakWaveConfig(23);
      expect(config.bossVariant).toBe("annihilator");
    });

    it("generates final boss at wave 25", () => {
      const config = generateFlagshipPeakWaveConfig(25);
      expect(config.bossVariant).toBe("dreadnought");
    });

    it("increases difficulty with wave number", () => {
      const early = generateFlagshipPeakWaveConfig(1);
      const late = generateFlagshipPeakWaveConfig(25);
      expect(late.enemyCount).toBeGreaterThan(early.enemyCount);
      expect(late.healthMultiplier).toBeGreaterThan(early.healthMultiplier);
      expect(late.damageMultiplier).toBeGreaterThan(early.damageMultiplier);
    });

    it("hell phase has higher special event chance", () => {
      const standard = generateFlagshipPeakWaveConfig(5);
      const hell = generateFlagshipPeakWaveConfig(22);
      expect(hell.specialEventChance).toBeGreaterThan(standard.specialEventChance);
    });
  });

  describe("constants", () => {
    it("total waves is 25", () => {
      expect(FLAGSHIP_PEAK_TOTAL_WAVES).toBe(25);
    });

    it("standard phase ends at wave 10", () => {
      expect(FLAGSHIP_PEAK_STANDARD_END).toBe(10);
    });

    it("overclock phase ends at wave 20", () => {
      expect(FLAGSHIP_PEAK_OVERCLOCK_END).toBe(20);
    });

    it("boss waves are at correct positions", () => {
      expect(FLAGSHIP_PEAK_BOSS_WAVE_1).toBe(10);
      expect(FLAGSHIP_PEAK_BOSS_WAVE_2).toBe(23);
      expect(FLAGSHIP_PEAK_FINAL_BOSS_WAVE).toBe(25);
    });
  });
});