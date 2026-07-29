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
  FLAGSHIP_PEAK_BOSS_WAVE_3,
  FLAGSHIP_PEAK_BOSS_WAVE_4,
  FLAGSHIP_PEAK_BOSS_WAVE_FINAL,
  FLAGSHIP_PEAK_ABYSS_END,
  FLAGSHIP_PEAK_VOID_END,
  FLAGSHIP_PEAK_MAX_TOTAL_WAVES,
} from "./flagship-peak";
import {
  calculateFlagshipPeakRadar,
  checkFlagshipPeakAchievements,
  checkFlagshipPeakMilestones,
  checkFlagshipPeakPhaseRewards,
  calculateFlagshipPeakSettlement,
  FLAGSHIP_PEAK_ACHIEVEMENTS,
  FLAGSHIP_PEAK_MILESTONES,
  FLAGSHIP_PEAK_PHASE_REWARDS,
} from "./flagship-peak-achievements";
import type { GameState, FlagshipPeakPhase, FlagshipPeakState, FlagshipSpeedRank } from "./types";

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
      expect(state.totalWaves).toBe(50);
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

    it("returns hell for waves 21-25", () => {
      expect(getFlagshipPeakPhase(21)).toBe("hell");
      expect(getFlagshipPeakPhase(25)).toBe("hell");
    });

    it("returns abyss for waves 26-35", () => {
      expect(getFlagshipPeakPhase(26)).toBe("abyss");
      expect(getFlagshipPeakPhase(30)).toBe("abyss");
      expect(getFlagshipPeakPhase(35)).toBe("abyss");
    });

    it("returns void for waves 36-45", () => {
      expect(getFlagshipPeakPhase(36)).toBe("void");
      expect(getFlagshipPeakPhase(40)).toBe("void");
      expect(getFlagshipPeakPhase(45)).toBe("void");
    });

    it("returns genesis for waves 46+", () => {
      expect(getFlagshipPeakPhase(46)).toBe("genesis");
      expect(getFlagshipPeakPhase(50)).toBe("genesis");
    });
  });

  describe("getPhaseDisplayName", () => {
    it("returns Chinese names for all phases", () => {
      const phases: FlagshipPeakPhase[] = ["standard", "overclock", "hell", "abyss", "void", "genesis", "victory", "defeat"];
      const expected = ["标准巡航", "超频增压", "地狱终局", "深渊", "虚空", "创世", "胜利", "失败"];
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
      expect(getPhaseAccentColor("abyss")).toBe("#1a1a1a");
      expect(getPhaseAccentColor("void")).toBe("#e2e8f0");
      expect(getPhaseAccentColor("genesis")).toBe("#00ffcc");
      expect(getPhaseAccentColor("victory")).toBe("#22c55e");
      expect(getPhaseAccentColor("defeat")).toBe("#ef4444");
    });
  });

  describe("getPhaseDifficultyMultiplier", () => {
    it("returns increasing multipliers", () => {
      expect(getPhaseDifficultyMultiplier("standard")).toBe(1.0);
      expect(getPhaseDifficultyMultiplier("overclock")).toBe(1.5);
      expect(getPhaseDifficultyMultiplier("hell")).toBe(2.0);
      expect(getPhaseDifficultyMultiplier("abyss")).toBe(3.0);
      expect(getPhaseDifficultyMultiplier("void")).toBe(4.0);
      expect(getPhaseDifficultyMultiplier("genesis")).toBe(5.0);
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
      expect(config.bossVariant).toBe("devourer");
    });

    it("generates boss at wave 35 (abyss boss)", () => {
      const config = generateFlagshipPeakWaveConfig(35);
      expect(config.bossVariant).toBe("dreadnought");
    });

    it("generates boss at wave 45 (void boss)", () => {
      const config = generateFlagshipPeakWaveConfig(45);
      expect(config.bossVariant).toBe("juggernaut");
    });

    it("generates final boss at wave 50 (genesis)", () => {
      const config = generateFlagshipPeakWaveConfig(50);
      expect(config.bossVariant).toBe("devourer");
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
    it("total waves is 25 (legacy) / max total waves is 50", () => {
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

// ========================================================================
// 结算+成就+雷达图 测试
// ========================================================================

function makeFPState(overrides: Partial<FlagshipPeakState> = {}): FlagshipPeakState {
  return {
    phase: "standard",
    wave: 0,
    totalWaves: 50,
    challenges: [],
    tasks: [],
    score: 0,
    combos: 0,
    maxCombo: 0,
    bossKills: 0,
    eliteKills: 0,
    coreHealth: 100,
    coreMaxHealth: 100,
    timeAttackScore: 0,
    perfectWaves: 0,
    speedRank: "none" as FlagshipSpeedRank,
    seasonRank: "bronze",
    seasonXp: 0,
    waveClearTimes: [],
    comboBreakerCount: 0,
    challengeStreak: 0,
    seasonCurrency: 0,
    skillPoints: 0,
    unlockedSkills: [],
    weaponMods: [],
    bossVariants: {},
    forgeMaterials: { iron: 0, crystal: 0, voidEssence: 0, genesisCore: 0 },
    coopMode: false,
    mapThemePhase: "standard",
    ...overrides,
  };
}

describe("flagship-peak-achievements", () => {
  describe("成就定义", () => {
    it("定义了11个成就", () => {
      expect(FLAGSHIP_PEAK_ACHIEVEMENTS).toHaveLength(11);
    });

    it("包含3个普通成就", () => {
      const common = FLAGSHIP_PEAK_ACHIEVEMENTS.filter((a) => a.rarity === "common");
      expect(common).toHaveLength(3);
    });

    it("包含6个稀有成就", () => {
      const rare = FLAGSHIP_PEAK_ACHIEVEMENTS.filter((a) => a.rarity === "rare");
      expect(rare).toHaveLength(6);
    });

    it("包含2个传说成就", () => {
      const legendary = FLAGSHIP_PEAK_ACHIEVEMENTS.filter((a) => a.rarity === "legendary");
      expect(legendary).toHaveLength(2);
      expect(legendary.map((a) => a.id)).toContain("void_lord");
      expect(legendary.map((a) => a.id)).toContain("genesis_god");
    });

    it("每个成就都有标题和描述", () => {
      for (const ach of FLAGSHIP_PEAK_ACHIEVEMENTS) {
        expect(ach.title).toBeTruthy();
        expect(ach.description).toBeTruthy();
        expect(ach.icon).toBeTruthy();
      }
    });
  });

  describe("里程碑定义", () => {
    it("定义了10个里程碑", () => {
      expect(FLAGSHIP_PEAK_MILESTONES).toHaveLength(10);
    });

    it("里程碑波次为5/10/15/20/25/30/35/40/45/50", () => {
      const waves = FLAGSHIP_PEAK_MILESTONES.map((m) => m.wave);
      expect(waves).toEqual([5, 10, 15, 20, 25, 30, 35, 40, 45, 50]);
    });

    it("奖励递增", () => {
      const xpRewards = FLAGSHIP_PEAK_MILESTONES.map((m) => m.xpReward);
      for (let i = 1; i < xpRewards.length; i++) {
        expect(xpRewards[i]).toBeGreaterThan(xpRewards[i - 1]);
      }
    });
  });

  describe("阶段奖励定义", () => {
    it("定义了6个阶段奖励", () => {
      const phases = Object.keys(FLAGSHIP_PEAK_PHASE_REWARDS);
      expect(phases).toHaveLength(6);
      expect(phases).toContain("standard");
      expect(phases).toContain("overclock");
      expect(phases).toContain("hell");
      expect(phases).toContain("abyss");
      expect(phases).toContain("void");
      expect(phases).toContain("genesis");
    });

    it("genesis阶段奖励最高", () => {
      const genesisReward = FLAGSHIP_PEAK_PHASE_REWARDS.genesis;
      const standardReward = FLAGSHIP_PEAK_PHASE_REWARDS.standard;
      expect(genesisReward.xpReward).toBeGreaterThan(standardReward.xpReward);
      expect(genesisReward.currencyReward).toBeGreaterThan(standardReward.currencyReward);
    });
  });

  describe("calculateFlagshipPeakRadar", () => {
    it("返回6个维度", () => {
      const fp = makeFPState({
        timeAttackScore: 50,
        perfectWaves: 10,
        maxCombo: 25,
        bossKills: 2,
        eliteKills: 15,
      });
      const radar = calculateFlagshipPeakRadar(fp, 100);
      expect(radar).toHaveLength(6);
    });

    it("维度标签正确", () => {
      const fp = makeFPState();
      const radar = calculateFlagshipPeakRadar(fp, 0);
      const labels = radar.map((r) => r.label);
      expect(labels).toEqual(["速度", "击杀", "连击", "完美波次", "精英", "首领"]);
    });

    it("权重总和为1", () => {
      const fp = makeFPState();
      const radar = calculateFlagshipPeakRadar(fp, 0);
      const totalWeight = radar.reduce((s, r) => s + r.weight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it("score不超过100", () => {
      const fp = makeFPState({
        timeAttackScore: 500,
        perfectWaves: 100,
        maxCombo: 200,
        bossKills: 20,
        eliteKills: 100,
      });
      const radar = calculateFlagshipPeakRadar(fp, 1000);
      for (const r of radar) {
        expect(r.score).toBeLessThanOrEqual(100);
      }
    });

    it("零数据时所有维度为0", () => {
      const fp = makeFPState();
      const radar = calculateFlagshipPeakRadar(fp, 0);
      for (const r of radar) {
        expect(r.score).toBe(0);
      }
    });

    it("满分数据时所有维度为100", () => {
      const fp = makeFPState({
        timeAttackScore: 100,
        perfectWaves: 25,
        maxCombo: 50,
        bossKills: 3,
        eliteKills: 30,
      });
      const radar = calculateFlagshipPeakRadar(fp, 200);
      for (const r of radar) {
        expect(r.score).toBe(100);
      }
    });
  });

  describe("checkFlagshipPeakAchievements", () => {
    it("完美波次>=10解锁钢铁防线", () => {
      const fp = makeFPState({ perfectWaves: 10 });
      const results = checkFlagshipPeakAchievements(fp, {}, 0, 0);
      const ach = results.find((a) => a.id === "no_damage_10");
      expect(ach?.unlocked).toBe(true);
    });

    it("完美波次<10不解锁钢铁防线", () => {
      const fp = makeFPState({ perfectWaves: 5 });
      const results = checkFlagshipPeakAchievements(fp, {}, 0, 0);
      const ach = results.find((a) => a.id === "no_damage_10");
      expect(ach?.unlocked).toBe(false);
    });

    it("平均通关<30秒+>=10波解锁闪电突袭", () => {
      const fp = makeFPState({
        waveClearTimes: [25, 28, 22, 30, 20, 26, 24, 29, 27, 21],
      });
      const results = checkFlagshipPeakAchievements(fp, {}, 0, 0);
      const ach = results.find((a) => a.id === "speedrun_flagship");
      expect(ach?.unlocked).toBe(true);
    });

    it("挑战连胜>=3解锁挑战征服者", () => {
      const fp = makeFPState({ challengeStreak: 3 });
      const results = checkFlagshipPeakAchievements(fp, {}, 0, 0);
      const ach = results.find((a) => a.id === "all_challenges");
      expect(ach?.unlocked).toBe(true);
    });

    it("wave>23解锁地狱幸存者", () => {
      const fp = makeFPState({ wave: 24 });
      const results = checkFlagshipPeakAchievements(fp, {}, 0, 0);
      const ach = results.find((a) => a.id === "hell_survivor");
      expect(ach?.unlocked).toBe(true);
    });

    it("零死亡+25波通关解锁不朽传奇", () => {
      const fp = makeFPState({ wave: 25 });
      const results = checkFlagshipPeakAchievements(fp, {}, 0, 0);
      const ach = results.find((a) => a.id === "zero_death_25");
      expect(ach?.unlocked).toBe(true);
    });

    it("有死亡记录不解锁不朽传奇", () => {
      const fp = makeFPState({ wave: 25 });
      const results = checkFlagshipPeakAchievements(fp, {}, 0, 1);
      const ach = results.find((a) => a.id === "zero_death_25");
      expect(ach?.unlocked).toBe(false);
    });

    it("三阶段S评级解锁三阶全S", () => {
      const fp = makeFPState({ wave: 25 });
      const phaseStats: Record<string, FlagshipSpeedRank> = {
        standard: "gold",
        overclock: "gold",
        hell: "gold",
      };
      const results = checkFlagshipPeakAchievements(fp, phaseStats, 0, 0);
      const ach = results.find((a) => a.id === "triple_s_rank");
      expect(ach?.unlocked).toBe(true);
    });

    it("阶段评级不全是S不解锁三阶全S", () => {
      const fp = makeFPState({ wave: 25 });
      const phaseStats: Record<string, FlagshipSpeedRank> = {
        standard: "gold",
        overclock: "silver",
        hell: "gold",
      };
      const results = checkFlagshipPeakAchievements(fp, phaseStats, 0, 0);
      const ach = results.find((a) => a.id === "triple_s_rank");
      expect(ach?.unlocked).toBe(false);
    });

    it("同时达成不朽+三阶全S+挑战征服者解锁虚空之主", () => {
      const fp = makeFPState({
        wave: 25,
        challengeStreak: 3,
      });
      const phaseStats: Record<string, FlagshipSpeedRank> = {
        standard: "gold",
        overclock: "gold",
        hell: "gold",
      };
      const results = checkFlagshipPeakAchievements(fp, phaseStats, 0, 0);
      const ach = results.find((a) => a.id === "void_lord");
      expect(ach?.unlocked).toBe(true);
    });

    it("未达成前提条件不解锁虚空之主", () => {
      const fp = makeFPState({ wave: 25, challengeStreak: 1 });
      const phaseStats: Record<string, FlagshipSpeedRank> = {
        standard: "gold",
        overclock: "silver",
        hell: "gold",
      };
      const results = checkFlagshipPeakAchievements(fp, phaseStats, 0, 0);
      const ach = results.find((a) => a.id === "void_lord");
      expect(ach?.unlocked).toBe(false);
    });
  });

  describe("checkFlagshipPeakMilestones", () => {
    it("wave=0时无里程碑达成", () => {
      const milestones = checkFlagshipPeakMilestones(0);
      expect(milestones.filter((m) => m.reached)).toHaveLength(0);
    });

    it("wave=5时达成第一个里程碑", () => {
      const milestones = checkFlagshipPeakMilestones(5);
      const reached = milestones.filter((m) => m.reached);
      expect(reached).toHaveLength(1);
      expect(reached[0].wave).toBe(5);
    });

    it("wave=10时达成前两个里程碑", () => {
      const milestones = checkFlagshipPeakMilestones(10);
      const reached = milestones.filter((m) => m.reached);
      expect(reached).toHaveLength(2);
    });

    it("wave=25时达成前5个里程碑", () => {
      const milestones = checkFlagshipPeakMilestones(25);
      const reached = milestones.filter((m) => m.reached);
      expect(reached).toHaveLength(5);
    });

    it("wave=50时达成全部里程碑", () => {
      const milestones = checkFlagshipPeakMilestones(50);
      expect(milestones.every((m) => m.reached)).toBe(true);
    });
  });

  describe("checkFlagshipPeakPhaseRewards", () => {
    it("standard阶段解锁标准奖励", () => {
      const fp = makeFPState({ phase: "standard" });
      const rewards = checkFlagshipPeakPhaseRewards("standard", fp);
      expect(rewards).toHaveLength(1);
      expect(rewards[0].phase).toBe("standard");
    });

    it("overclock阶段解锁标准+超频奖励", () => {
      const fp = makeFPState({ phase: "overclock" });
      const rewards = checkFlagshipPeakPhaseRewards("overclock", fp);
      expect(rewards).toHaveLength(2);
      expect(rewards.map((r) => r.phase)).toEqual(["standard", "overclock"]);
    });

    it("hell阶段解锁标准+超频+地狱奖励", () => {
      const fp = makeFPState({ phase: "hell" });
      const rewards = checkFlagshipPeakPhaseRewards("hell", fp);
      expect(rewards).toHaveLength(3);
      expect(rewards.map((r) => r.phase)).toEqual(["standard", "overclock", "hell"]);
    });

    it("genesis阶段解锁全部6个奖励", () => {
      const fp = makeFPState({ phase: "genesis" });
      const rewards = checkFlagshipPeakPhaseRewards("genesis", fp);
      expect(rewards).toHaveLength(6);
      expect(rewards.map((r) => r.phase)).toEqual(["standard", "overclock", "hell", "abyss", "void", "genesis"]);
    });

    it("victory阶段解锁全部6个奖励", () => {
      const fp = makeFPState({ phase: "victory" });
      const rewards = checkFlagshipPeakPhaseRewards("victory", fp);
      expect(rewards).toHaveLength(6);
    });

    it("defeat阶段不解锁任何奖励", () => {
      const fp = makeFPState({ phase: "defeat" });
      const rewards = checkFlagshipPeakPhaseRewards("defeat", fp);
      expect(rewards).toHaveLength(0);
    });
  });

  describe("calculateFlagshipPeakSettlement", () => {
    it("返回完整结算数据", () => {
      const fp = makeFPState({
        phase: "standard",
        wave: 10,
        score: 5000,
        timeAttackScore: 60,
        perfectWaves: 8,
        maxCombo: 30,
        bossKills: 1,
        eliteKills: 12,
        seasonXp: 300,
        seasonCurrency: 50,
        speedRank: "gold",
        seasonRank: "silver",
      });
      const phaseStats: Record<string, FlagshipSpeedRank> = {
        standard: "gold",
      };
      const settlement = calculateFlagshipPeakSettlement(fp, 80, 0, phaseStats, true);

      expect(settlement.victory).toBe(true);
      expect(settlement.reachedPhase).toBe("standard");
      expect(settlement.radarScores).toHaveLength(6);
      expect(settlement.totalScore).toBeGreaterThan(5000);
      expect(settlement.totalXp).toBeGreaterThan(300);
      expect(settlement.totalCurrency).toBeGreaterThan(50);
      expect(settlement.kills).toBe(80);
      expect(settlement.maxCombo).toBe(30);
      expect(settlement.bossKills).toBe(1);
      expect(settlement.eliteKills).toBe(12);
      expect(settlement.perfectWaves).toBe(8);
    });

    it("victory结算包含胜利加成", () => {
      const fp = makeFPState({ phase: "hell", wave: 25, score: 10000 });
      const phaseStats: Record<string, FlagshipSpeedRank> = {};
      const victorySettlement = calculateFlagshipPeakSettlement(fp, 200, 0, phaseStats, true);
      const defeatSettlement = calculateFlagshipPeakSettlement(fp, 200, 0, phaseStats, false);

      expect(victorySettlement.totalScore).toBeGreaterThan(defeatSettlement.totalScore);
      expect(victorySettlement.totalXp).toBeGreaterThan(defeatSettlement.totalXp);
    });

    it("解锁成就时获得额外奖励", () => {
      const fp = makeFPState({
        phase: "hell",
        wave: 25,
        score: 10000,
        perfectWaves: 10,
        challengeStreak: 3,
      });
      const phaseStats: Record<string, FlagshipSpeedRank> = {
        standard: "gold",
        overclock: "gold",
        hell: "gold",
      };
      const settlement = calculateFlagshipPeakSettlement(fp, 200, 0, phaseStats, true);

      expect(settlement.unlockedAchievements.length).toBeGreaterThan(0);
      expect(settlement.totalScore).toBeGreaterThan(10000);
    });

    it("radarScores包含加权分数", () => {
      const fp = makeFPState({
        timeAttackScore: 50,
        perfectWaves: 10,
        maxCombo: 25,
        bossKills: 2,
        eliteKills: 15,
      });
      const phaseStats: Record<string, FlagshipSpeedRank> = {};
      const settlement = calculateFlagshipPeakSettlement(fp, 100, 0, phaseStats, false);

      for (const r of settlement.radarScores) {
        expect(r.weightedScore).toBeGreaterThanOrEqual(0);
        expect(r.weight).toBeGreaterThan(0);
      }
    });

    it("milestonesReached根据wave正确计算", () => {
      const fp = makeFPState({ wave: 12 });
      const phaseStats: Record<string, FlagshipSpeedRank> = {};
      const settlement = calculateFlagshipPeakSettlement(fp, 50, 0, phaseStats, false);

      const reached = settlement.milestonesReached.filter((m) => m.reached);
      expect(reached).toHaveLength(2);
      expect(reached.map((m) => m.wave)).toEqual([5, 10]);
    });

    it("phaseRewards根据phase正确计算", () => {
      const fp = makeFPState({ phase: "overclock", wave: 15 });
      const phaseStats: Record<string, FlagshipSpeedRank> = {};
      const settlement = calculateFlagshipPeakSettlement(fp, 50, 0, phaseStats, false);

      expect(settlement.phaseRewards).toHaveLength(2);
      expect(settlement.phaseRewards[0].phase).toBe("standard");
      expect(settlement.phaseRewards[1].phase).toBe("overclock");
    });

    it("defeat结算不包含胜利加成", () => {
      const fp = makeFPState({ phase: "defeat", wave: 18, score: 5000 });
      const phaseStats: Record<string, FlagshipSpeedRank> = {};
      const settlement = calculateFlagshipPeakSettlement(fp, 100, 0, phaseStats, false);

      expect(settlement.victory).toBe(false);
      expect(settlement.totalScore).toBe(5000);
    });
  });
});