import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  DEFAULT_BALANCE,
  getWeaponBase,
  upgradeWeaponFromBalance,
  getWeaponDps,
  getDifficultyScaledHealth,
  getSpawnInterval,
  getSpawnCount,
  getEliteSpawnChance,
  getEliteAffixCountFromBalance,
  getMechanicalEliteAffixes,
  MECHANICAL_ELITE_AFFIX_COMBOS,
  getDefenseWaveDifficultyMultiplier,
  getXpToNext,
  getXpValue,
  applyDailyModifiers,
  getDailyModifiersFromBalance,
  generateRoguelikeStagesFromBalance,
  getRoguelikeRewards,
  applyRoguelikeReward,
  generateCampaignMissionsFromBalance,
  generateEndlessMissionsFromBalance,
  generateDefenseMissionsFromBalance,
  calculateDefenseCompletionRewardFromBalance,
  getModeDifficultyMultiplier,
  scaleHealthForMode,
  getDailyModifierIds,
  generateDailySeed,
  PASSIVE_BALANCE_DEFS,
  seededRandom,
  type BalanceConfig,
} from "./balance";
import type { Weapon, Enemy, GameState, Player } from "./types";

const basePlayer = (): Player => ({
  id: "player",
  x: 0,
  y: 0,
  radius: 14,
  speed: 260,
  maxHealth: 100,
  health: 100,
  level: 1,
  xp: 0,
  xpToNext: 50,
  weapons: [getWeaponBase("pulse")],
  passives: [],
  invincible: 0,
  magnetRange: 120,
  armor: 0,
  critChance: 0,
  cooldownReduction: 0,
  areaMultiplier: 1,
  regen: 0,
  heroId: null,
  activeSkill: null,
  skillTimer: 0,
  deployableUpgrades: {},
  talentLevels: {},
  knockbackX: 0,
  knockbackY: 0,
  burnDuration: 0,
  burnDamage: 0,
  facing: 0,
  animation: "idle",
  animationTimer: 0,
});

const baseState = (): GameState => ({
  status: "running",
  lastTime: 0,
  time: 0,
  map: { width: 2400, height: 1800, theme: "industrial", obstacles: [], hazards: [] },
  camera: { x: 1200, y: 900, scale: 1 },
  player: basePlayer(),
  enemies: [],
  projectiles: [],
  enemyProjectiles: [],
  pickups: [],
  particles: [],
  damageNumbers: [],
  missions: [],
  currentMissionIndex: 0,
  extraction: null,
  extractionTimer: 0,
  spawnTimer: 0,
  eventTimer: 30,
  mode: "campaign",
  modeConfig: {
    type: "campaign",
    name: "战役",
    description: "",
    allowMissions: true,
    endless: false,
  },
  seed: 12345,
  players: [],
  wave: 1,
  waveTimer: 0,
  eliteKillStreak: 0,
  killCombo: { count: 0, timer: 0, best: 0 },
  difficulty: 1,
  intensity: 0,
  stats: {
    kills: 0,
    damageDealt: 0,
    damageTaken: 0,
    xpCollected: 0,
    resourcesCollected: 0,
    timeSurvived: 0,
    chestsOpened: 0,
    elitesKilled: 0,
    bossesKilled: 0,
  },
  activeEvent: null,
});

describe("DEFAULT_BALANCE", () => {
  it("has required top-level sections", () => {
    expect(DEFAULT_BALANCE.player).toBeDefined();
    expect(DEFAULT_BALANCE.weapons).toBeDefined();
    expect(DEFAULT_BALANCE.enemies).toBeDefined();
    expect(DEFAULT_BALANCE.affixes).toBeDefined();
    expect(DEFAULT_BALANCE.bosses).toBeDefined();
    expect(DEFAULT_BALANCE.difficulty).toBeDefined();
    expect(DEFAULT_BALANCE.progression).toBeDefined();
    expect(DEFAULT_BALANCE.pickups).toBeDefined();
    expect(DEFAULT_BALANCE.modes).toBeDefined();
  });

  it("has 18 weapon definitions", () => {
    expect(Object.keys(DEFAULT_BALANCE.weapons)).toHaveLength(18);
  });

  it("every weapon has positive base stats", () => {
    for (const [id, cfg] of Object.entries(DEFAULT_BALANCE.weapons)) {
      expect(cfg.base.damage, `${id} damage`).toBeGreaterThan(0);
      expect(cfg.base.cooldown, `${id} cooldown`).toBeGreaterThan(0);
      expect(cfg.base.range, `${id} range`).toBeGreaterThan(0);
      expect(cfg.base.projectileSpeed, `${id} projectileSpeed`).toBeGreaterThan(0);
      expect(cfg.base.count, `${id} count`).toBeGreaterThan(0);
      expect(cfg.maxLevel, `${id} maxLevel`).toBeGreaterThanOrEqual(1);
      expect(cfg.upgrades.length, `${id} upgrades`).toBeGreaterThan(0);
    }
  });

  it("every weapon upgrade step matches expected level", () => {
    for (const cfg of Object.values(DEFAULT_BALANCE.weapons)) {
      for (let i = 2; i <= cfg.maxLevel; i++) {
        const step = cfg.upgrades.find((u) => u.level === i);
        expect(step).toBeDefined();
      }
    }
  });

  it("enemy variants include mechanical faction units", () => {
    expect(DEFAULT_BALANCE.enemies.drone).toBeDefined();
    expect(DEFAULT_BALANCE.enemies.sentinel).toBeDefined();
    expect(DEFAULT_BALANCE.enemies.artillery).toBeDefined();
    expect(DEFAULT_BALANCE.enemies.disruptor).toBeDefined();
    expect(DEFAULT_BALANCE.enemies.raptor).toBeDefined();
  });

  it("every enemy has positive stats", () => {
    for (const [id, cfg] of Object.entries(DEFAULT_BALANCE.enemies)) {
      if (id === "base") continue;
      expect(cfg.speed).toBeGreaterThan(0);
      expect(cfg.damage).toBeGreaterThan(0);
      expect(cfg.radius).toBeGreaterThan(0);
      expect(cfg.xpValue).toBeGreaterThan(0);
    }
  });

  it("affixes have valid modifiers", () => {
    expect(Object.keys(DEFAULT_BALANCE.affixes)).toHaveLength(8);
    for (const cfg of Object.values(DEFAULT_BALANCE.affixes)) {
      const hasModifier =
        cfg.healthMul !== undefined ||
        cfg.damageMul !== undefined ||
        cfg.speedMul !== undefined ||
        cfg.radiusAdd !== undefined ||
        cfg.xpMul !== undefined ||
        cfg.regenPercent !== undefined ||
        cfg.shieldPercent !== undefined;
      expect(hasModifier).toBe(true);
    }
  });

  it("boss balance blocks have required fields", () => {
    for (const [id, cfg] of Object.entries(DEFAULT_BALANCE.bosses)) {
      expect(cfg.health).toBeGreaterThan(0);
      expect(cfg.damage).toBeGreaterThan(0);
      expect(cfg.radius).toBeGreaterThan(0);
      expect(cfg.speed).toBeGreaterThanOrEqual(0);
      expect(cfg.phases.length).toBeGreaterThanOrEqual(2);
      expect(cfg.phaseThresholds.length).toBe(cfg.phases.length - 1);
    }
  });

  it("difficulty config enforces minimum interval", () => {
    const cfg = DEFAULT_BALANCE.difficulty;
    expect(cfg.minInterval).toBeGreaterThan(0);
    expect(cfg.baseInterval).toBeGreaterThan(cfg.minInterval);
  });

  it("progression caps weapons and passives", () => {
    expect(DEFAULT_BALANCE.progression.maxWeapons).toBeGreaterThanOrEqual(1);
    expect(DEFAULT_BALANCE.progression.weaponMaxLevel).toBeGreaterThanOrEqual(1);
    expect(DEFAULT_BALANCE.progression.passiveMaxLevel).toBeGreaterThanOrEqual(1);
  });

  it("daily modifiers are unique", () => {
    const ids = DEFAULT_BALANCE.modes.dailyModifiers.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("roguelike rewards are unique", () => {
    const ids = DEFAULT_BALANCE.modes.roguelikeRewards.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getWeaponBase", () => {
  it("creates weapon from balance for every id", () => {
    const ids = Object.keys(DEFAULT_BALANCE.weapons) as Array<keyof BalanceConfig["weapons"]>;
    for (const id of ids) {
      const weapon = getWeaponBase(id);
      expect(weapon.id).toBe(id);
      expect(weapon.level).toBe(1);
      expect(weapon.timer).toBe(0);
    }
  });

  it("preserves special fields like homing and gravity", () => {
    const seeker = getWeaponBase("seekerRifle");
    expect(seeker.homing).toBe(true);
    const gravity = getWeaponBase("gravityWell");
    expect(gravity.gravityRadius).toBeGreaterThan(0);
    expect(gravity.pullStrength).toBeGreaterThan(0);
  });
});

describe("upgradeWeaponFromBalance", () => {
  it("upgrades every weapon to max level", () => {
    const ids = Object.keys(DEFAULT_BALANCE.weapons) as Array<Weapon["id"]>;
    for (const id of ids) {
      let weapon = getWeaponBase(id);
      for (let i = 1; i < weapon.maxLevel; i++) {
        weapon = upgradeWeaponFromBalance(weapon);
      }
      expect(weapon.level).toBe(weapon.maxLevel);
    }
  });

  it("does not exceed max level", () => {
    let weapon = getWeaponBase("pulse");
    for (let i = 0; i < 10; i++) {
      weapon = upgradeWeaponFromBalance(weapon);
    }
    expect(weapon.level).toBe(weapon.maxLevel);
  });

  it("increases damage for pulse rifle", () => {
    const base = getWeaponBase("pulse");
    const upgraded = upgradeWeaponFromBalance(base);
    expect(upgraded.damage).toBeGreaterThan(base.damage);
  });

  it("adds count and pierce for laser", () => {
    const base = getWeaponBase("laser");
    const max = upgradeWeaponToMax(base);
    expect(max.count).toBeGreaterThanOrEqual(base.count);
    expect(max.pierce).toBeGreaterThanOrEqual(base.pierce);
  });
});

describe("getWeaponDps", () => {
  it("returns positive dps for every weapon", () => {
    for (const id of Object.keys(DEFAULT_BALANCE.weapons) as Array<Weapon["id"]>) {
      const weapon = getWeaponBase(id);
      expect(getWeaponDps(weapon)).toBeGreaterThan(0);
    }
  });

  it("dps increases after upgrade", () => {
    const base = getWeaponBase("shotgun");
    const upgraded = upgradeWeaponFromBalance(base);
    expect(getWeaponDps(upgraded)).toBeGreaterThan(getWeaponDps(base));
  });
});

describe("enemy scaling", () => {
  it("scales health by difficulty", () => {
    const low = getDifficultyScaledHealth(1, "walker");
    const high = getDifficultyScaledHealth(10, "walker");
    expect(high).toBeGreaterThan(low);
  });

  it("tank has more health than walker at same difficulty", () => {
    const tank = getDifficultyScaledHealth(5, "tank");
    const walker = getDifficultyScaledHealth(5, "walker");
    expect(tank).toBeGreaterThan(walker);
  });

  it("spawn interval shrinks with difficulty", () => {
    const low = getSpawnInterval(1);
    const high = getSpawnInterval(20);
    expect(high).toBeLessThan(low);
    expect(high).toBe(DEFAULT_BALANCE.difficulty.minInterval);
  });

  it("spawn count grows with difficulty", () => {
    const low = getSpawnCount(1);
    const high = getSpawnCount(20);
    expect(high).toBeGreaterThan(low);
  });

  it("elite chance starts at zero and caps", () => {
    expect(getEliteSpawnChance(1)).toBe(0);
    expect(getEliteSpawnChance(2)).toBe(0);
    expect(getEliteSpawnChance(25)).toBe(DEFAULT_BALANCE.difficulty.eliteChanceMax);
  });

  it("affix count increases with difficulty", () => {
    expect(getEliteAffixCountFromBalance(1)).toBe(1);
    expect(getEliteAffixCountFromBalance(5)).toBe(2);
  });
});

describe("mechanical elite affixes", () => {
  it("returns valid combo", () => {
    const affixes = getMechanicalEliteAffixes(5);
    expect(affixes.length).toBeGreaterThan(0);
    expect(affixes.length).toBeLessThanOrEqual(2);
    for (const affix of affixes) {
      expect(DEFAULT_BALANCE.affixes[affix]).toBeDefined();
    }
  });

  it("uses only defined combos", () => {
    for (const combo of MECHANICAL_ELITE_AFFIX_COMBOS) {
      for (const affix of combo) {
        expect(DEFAULT_BALANCE.affixes[affix]).toBeDefined();
      }
    }
  });

  it("caps at two affixes even at high difficulty", () => {
    expect(getMechanicalEliteAffixes(100).length).toBeLessThanOrEqual(2);
  });
});

describe("defense wave multiplier", () => {
  it("increases linearly with wave index", () => {
    expect(getDefenseWaveDifficultyMultiplier(0)).toBe(1);
    expect(getDefenseWaveDifficultyMultiplier(7)).toBeGreaterThan(1);
  });
});

describe("xp progression", () => {
  it("xp to next level grows", () => {
    expect(getXpToNext(2)).toBeGreaterThan(getXpToNext(1));
    expect(getXpToNext(10)).toBeGreaterThan(getXpToNext(5));
  });

  it("xp value scales with difficulty", () => {
    const enemy: Enemy = {
      id: "e1",
      x: 0,
      y: 0,
      radius: 14,
      speed: 100,
      health: 100,
      maxHealth: 100,
      damage: 10,
      xpValue: 10,
      color: "#fff",
      variant: "walker",
      slow: 0,
      isElite: false,
      isBoss: false,
      affixes: [],
      attackTimer: 0,
      attackCooldown: 0,
      knockbackX: 0,
      knockbackY: 0,
      burnDuration: 0,
      phase: 0,
      phaseThresholds: [],
      targetCore: false,
      facing: 0,
      animation: "move",
      animationTimer: 0,
    };
    expect(getXpValue(enemy, 5)).toBeGreaterThan(getXpValue(enemy, 1));
  });
});

describe("daily modifiers", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns modifiers for today", () => {
    vi.setSystemTime(new Date("2026-07-19T00:00:00Z"));
    const modifiers = getDailyModifiersFromBalance();
    expect(modifiers.length).toBeGreaterThan(0);
    expect(modifiers.length).toBeLessThanOrEqual(3);
  });

  it("applies modifiers to state", () => {
    const state = baseState();
    const before = state.player.magnetRange;
    state.activeEvent = null;
    // Use ammo_shortage explicitly for deterministic effect
    const modifier = DEFAULT_BALANCE.modes.dailyModifiers.find((m) => m.id === "ammo_shortage")!;
    const beforeCooldown = state.player.weapons[0].cooldown;
    modifier.apply(state);
    expect(state.player.weapons[0].cooldown).toBeGreaterThan(beforeCooldown);
    modifier.revert?.(state);
    expect(state.player.weapons[0].cooldown).toBeCloseTo(beforeCooldown);
  });

  it("lists all modifier ids", () => {
    const ids = getDailyModifierIds();
    expect(ids.length).toBe(DEFAULT_BALANCE.modes.dailyModifiers.length);
  });

  it("generates daily seed from current date", () => {
    vi.setSystemTime(new Date("2026-07-19T00:00:00Z"));
    expect(generateDailySeed()).toBe("20260719");
  });
});

describe("roguelike balance", () => {
  it("generates stages from template", () => {
    const stages = generateRoguelikeStagesFromBalance(12345);
    expect(stages.length).toBe(DEFAULT_BALANCE.modes.roguelikeStages.length);
    expect(stages[stages.length - 1].type).toBe("boss");
  });

  it("boss stage target is one", () => {
    const stages = generateRoguelikeStagesFromBalance(12345);
    const boss = stages.find((s) => s.type === "boss")!;
    expect(boss.mission.target).toBe(1);
  });

  it("returns requested number of rewards", () => {
    const player = basePlayer();
    const rewards = getRoguelikeRewards(3, player);
    expect(rewards.length).toBe(3);
  });

  it("applies reward to player", () => {
    const player = basePlayer();
    const before = player.maxHealth;
    expect(applyRoguelikeReward(player, "health_boost")).toBe(true);
    expect(player.maxHealth).toBeGreaterThan(before);
  });

  it("returns false for unknown reward", () => {
    expect(applyRoguelikeReward(basePlayer(), "unknown")).toBe(false);
  });
});

describe("mission generation", () => {
  it("generates campaign missions", () => {
    const missions = generateCampaignMissionsFromBalance();
    expect(missions.length).toBe(DEFAULT_BALANCE.modes.campaignMissions.length);
    for (const m of missions) {
      expect(m.target).toBeGreaterThan(0);
      expect(m.progress).toBe(0);
      expect(m.completed).toBe(false);
    }
  });

  it("generates endless survive mission", () => {
    const missions = generateEndlessMissionsFromBalance(3);
    expect(missions).toHaveLength(1);
    expect(missions[0].type).toBe("survive");
    expect(missions[0].target).toBe(120 + 3 * 30);
  });

  it("generates defense missions and shuffles with seed", () => {
    const a = generateDefenseMissionsFromBalance(1);
    const b = generateDefenseMissionsFromBalance(2);
    expect(a.length).toBe(DEFAULT_BALANCE.modes.defenseMissions.length);
    expect(a.map((m) => m.id)).not.toEqual(b.map((m) => m.id));
  });
});

describe("defense completion reward", () => {
  it("calculates base reward", () => {
    const reward = calculateDefenseCompletionRewardFromBalance(5000, 5000, 0, 8, 8, 1200);
    expect(reward.xp).toBeGreaterThan(0);
    expect(reward.score).toBeGreaterThan(0);
  });

  it("awards more for high core health", () => {
    const high = calculateDefenseCompletionRewardFromBalance(5000, 5000, 0, 8, 8, 0);
    const low = calculateDefenseCompletionRewardFromBalance(1000, 5000, 0, 8, 8, 0);
    expect(high.xp).toBeGreaterThan(low.xp);
  });

  it("awards more for captured nodes", () => {
    const none = calculateDefenseCompletionRewardFromBalance(5000, 5000, 0, 8, 8, 0);
    const all = calculateDefenseCompletionRewardFromBalance(5000, 5000, 8, 8, 8, 0);
    expect(all.xp).toBeGreaterThan(none.xp);
  });

  it("caps energy reward", () => {
    const reward = calculateDefenseCompletionRewardFromBalance(5000, 5000, 8, 8, 8, 1200);
    expect(reward.energy).toBe(1200);
  });
});

describe("mode difficulty multiplier", () => {
  it("campaign is baseline", () => {
    expect(getModeDifficultyMultiplier("campaign")).toBe(1);
  });

  it("endless scales with stage", () => {
    expect(getModeDifficultyMultiplier("endless", 5)).toBeGreaterThan(1);
  });

  it("daily is harder", () => {
    expect(getModeDifficultyMultiplier("daily")).toBeGreaterThan(1);
  });

  it("scales health for mode", () => {
    expect(scaleHealthForMode(100, "endless", 5)).toBeGreaterThan(100);
    expect(scaleHealthForMode(100, "campaign")).toBe(100);
  });
});

describe("seededRandom", () => {
  it("produces deterministic sequence", () => {
    const rngA = seededRandom(12345);
    const rngB = seededRandom(12345);
    for (let i = 0; i < 10; i++) {
      expect(rngA()).toBe(rngB());
    }
  });

  it("produces values between 0 and 1", () => {
    const rng = seededRandom(999);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("PASSIVE_BALANCE_DEFS", () => {
  it("covers all passive ids", () => {
    expect(PASSIVE_BALANCE_DEFS).toHaveLength(8);
    const ids = PASSIVE_BALANCE_DEFS.map((p) => p.id);
    expect(ids).toContain("maxHealth");
    expect(ids).toContain("speed");
    expect(ids).toContain("magnet");
    expect(ids).toContain("regen");
    expect(ids).toContain("armor");
    expect(ids).toContain("crit");
    expect(ids).toContain("cooldown");
    expect(ids).toContain("area");
  });

  it("each passive applies a positive effect", () => {
    for (const def of PASSIVE_BALANCE_DEFS) {
      const player = basePlayer();
      const before = getPassiveSnapshot(player, def.id);
      def.apply(player);
      const after = getPassiveSnapshot(player, def.id);
      expect(after).toBeGreaterThan(before);
    }
  });
});

function upgradeWeaponToMax(weapon: Weapon): Weapon {
  let w = weapon;
  while (w.level < w.maxLevel) {
    w = upgradeWeaponFromBalance(w);
  }
  return w;
}

function getPassiveSnapshot(player: Player, id: string): number {
  switch (id) {
    case "maxHealth":
      return player.maxHealth;
    case "speed":
      return player.speed;
    case "magnet":
      return player.magnetRange;
    case "regen":
      return player.regen;
    case "armor":
      return player.armor;
    case "crit":
      return player.critChance;
    case "cooldown":
      return player.cooldownReduction;
    case "area":
      return player.areaMultiplier;
    default:
      return 0;
  }
}
