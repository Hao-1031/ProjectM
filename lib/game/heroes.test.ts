import { describe, it, expect, vi } from "vitest";
import {
  HERO_DEFS,
  HERO_SYNERGIES,
  applyHeroToPlayer,
  useHeroSkill,
  updateHeroSkillsAndDeployables,
  applyHeroTalent,
  getHeroName,
  getHeroColor,
  createNullHeroState,
  getActiveSynergies,
  applyHeroSynergyBonus,
  upgradeDeployable,
  getDeployableMultiplier,
  handleMineProximity,
} from "./heroes";
import type { HeroId, Player, GameState } from "./types";
import { GameEngine } from "./engine";

function basePlayer(): Player {
  return {
    id: "player",
    x: 400,
    y: 300,
    radius: 14,
    speed: 260,
    maxHealth: 100,
    health: 100,
    level: 1,
    xp: 0,
    xpToNext: 50,
    weapons: [],
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
  };
}

function createDefenseGameState(): GameState {
  const engine = new GameEngine({}, "defense", 12345);
  engine.resize(800, 600);
  engine.start();
  return engine.state;
}

describe("hero definitions", () => {
  it("each hero has a defined skill and passive", () => {
    const ids = Object.keys(HERO_DEFS) as HeroId[];
    for (const id of ids) {
      const def = HERO_DEFS[id];
      expect(def.id).toBe(id);
      expect(def.name).toBeTruthy();
      expect(def.skill).toBeDefined();
      expect(def.skill.id).toBeTruthy();
      expect(def.skill.cooldown).toBeGreaterThan(0);
      expect(def.passive).toBeDefined();
      expect(Object.keys(def.passive).length).toBeGreaterThan(0);
    }
  });

  it("getHeroName and getHeroColor return hero values", () => {
    expect(getHeroName("scout")).toBe("侦察");
    expect(getHeroColor("scout")).toBe("#22d3ee");
    expect(getHeroName(null)).toBe("默认");
    expect(getHeroColor(null)).toBe("#94a3b8");
  });
});

describe("applyHeroToPlayer", () => {
  it("sets hero id, skill and applies passive stats", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "assault");
    expect(player.heroId).toBe("assault");
    expect(player.activeSkill).not.toBeNull();
    expect(player.activeSkill!.id).toBe("assault_shield");
    expect(player.maxHealth).toBe(120);
    expect(player.health).toBe(120);
    expect(player.armor).toBeGreaterThan(0);
  });

  it("scout increases speed and crit", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "scout");
    expect(player.speed).toBe(260 * 1.1);
    expect(player.critChance).toBe(0.08);
  });

  it("medic increases regen", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "medic");
    expect(player.regen).toBe(2);
  });

  it("engineer increases cooldown reduction and area", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "engineer");
    expect(player.cooldownReduction).toBe(0.08);
    expect(player.areaMultiplier).toBe(1.1);
  });

  it("returns unchanged player for unknown hero", () => {
    const player = basePlayer();
    const original = { ...player };
    applyHeroToPlayer(player, "unknown" as HeroId);
    expect(player).toEqual(original);
  });
});

describe("useHeroSkill", () => {
  it("scout deploys a beacon", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "scout");
    state.player.skillTimer = 0;
    useHeroSkill(state.player, state);
    expect(state.player.skillTimer).toBeGreaterThan(0);
    expect(state.defenseState!.deployables).toHaveLength(1);
    expect(state.defenseState!.deployables[0].type).toBe("beacon");
  });

  it("assault deploys a shield", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "assault");
    state.player.skillTimer = 0;
    useHeroSkill(state.player, state);
    expect(state.defenseState!.deployables[0].type).toBe("shield");
    expect(state.defenseState!.deployables[0].health).toBe(400);
  });

  it("medic deploys a healing aura", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "medic");
    state.player.skillTimer = 0;
    useHeroSkill(state.player, state);
    expect(state.defenseState!.deployables[0].type).toBe("healAura");
  });

  it("engineer deploys a turret", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "engineer");
    state.player.skillTimer = 0;
    useHeroSkill(state.player, state);
    expect(state.defenseState!.deployables[0].type).toBe("turret");
    expect(state.defenseState!.deployables[0].fireCooldown).toBe(0.45);
  });

  it("does nothing when skill is on cooldown", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "scout");
    state.player.skillTimer = 5;
    useHeroSkill(state.player, state);
    expect(state.defenseState!.deployables).toHaveLength(0);
  });

  it("does nothing when player has no hero", () => {
    const state = createDefenseGameState();
    state.player.heroId = null;
    state.player.activeSkill = null;
    useHeroSkill(state.player, state);
    expect(state.defenseState!.deployables).toHaveLength(0);
  });
});

describe("updateHeroSkillsAndDeployables", () => {
  it("reduces skill cooldown and active skill timer", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "scout");
    state.player.skillTimer = 10;
    state.player.activeSkill!.timer = 5;
    updateHeroSkillsAndDeployables(state, 2);
    expect(state.player.skillTimer).toBe(8);
    expect(state.player.activeSkill!.timer).toBe(3);
  });

  it("removes expired deployables", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "scout");
    useHeroSkill(state.player, state);
    const deployable = state.defenseState!.deployables[0];
    deployable.timer = 0.1;
    updateHeroSkillsAndDeployables(state, 0.2);
    expect(state.defenseState!.deployables).toHaveLength(0);
  });

  it("healAura restores player health", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "medic");
    useHeroSkill(state.player, state);
    state.player.health = 50;
    const deployable = state.defenseState!.deployables[0];
    deployable.timer = 2;
    updateHeroSkillsAndDeployables(state, 1);
    expect(state.player.health).toBeGreaterThan(50);
  });

  it("turret fires at nearby enemies", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "engineer");
    useHeroSkill(state.player, state);
    const turret = state.defenseState!.deployables[0];
    state.enemies.push({
      id: "enemy_1",
      x: turret.x + 100,
      y: turret.y,
      radius: 14,
      speed: 0,
      health: 100,
      maxHealth: 100,
      damage: 10,
      xpValue: 0,
      color: "#f43f5e",
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
    });
    updateHeroSkillsAndDeployables(state, 1);
    expect(state.projectiles.some((p) => p.weaponId === "turret")).toBe(true);
  });
});

describe("applyHeroTalent", () => {
  it("reduces skill cooldown for skillCooldown talent", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "assault");
    const before = player.activeSkill!.cooldown;
    applyHeroTalent(player, "skillCooldown");
    expect(player.activeSkill!.cooldown).toBe(before - 1);
  });

  it("increases skill duration for skillDuration talent", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "assault");
    const before = player.activeSkill!.duration;
    applyHeroTalent(player, "skillDuration");
    expect(player.activeSkill!.duration).toBe(before + 2);
  });

  it("applies default talent boost when talent id is unknown", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "scout");
    const beforeDuration = player.activeSkill!.duration;
    const beforeCooldown = player.activeSkill!.cooldown;
    applyHeroTalent(player, "mystery");
    expect(player.activeSkill!.duration).toBe(beforeDuration + 1);
    expect(player.activeSkill!.cooldown).toBeLessThan(beforeCooldown);
  });

  it("does nothing when player has no hero", () => {
    const player = basePlayer();
    const original = { ...player };
    applyHeroTalent(player, "skillCooldown");
    expect(player).toEqual(original);
  });
});

describe("createNullHeroState", () => {
  it("clears hero state from player", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "scout");
    createNullHeroState(player);
    expect(player.heroId).toBeNull();
    expect(player.activeSkill).toBeNull();
    expect(player.skillTimer).toBe(0);
  });
});

describe("hero talent trees", () => {
  it("every hero has at least 8 talents", () => {
    const ids = Object.keys(HERO_DEFS) as HeroId[];
    for (const id of ids) {
      expect(HERO_DEFS[id].talents.length).toBeGreaterThanOrEqual(8);
    }
  });

  it("medic has deployable focused talents", () => {
    const medic = HERO_DEFS.medic;
    const hasDroneTalents = medic.talents.some(
      (t) => t.modifiers.deployableDamageMul || t.modifiers.deployableRangeMul
    );
    expect(hasDroneTalents).toBe(true);
  });

  it("engineer has turret focused talents", () => {
    const engineer = HERO_DEFS.engineer;
    const hasTurretTalents = engineer.talents.some(
      (t) =>
        t.modifiers.deployableDamageMul ||
        t.modifiers.deployableCooldownMul ||
        t.modifiers.deployableRangeMul ||
        t.modifiers.deployableHealthMul
    );
    expect(hasTurretTalents).toBe(true);
  });

  it("vanguard has mine focused talents", () => {
    const vanguard = HERO_DEFS.vanguard;
    const hasMineTalents = vanguard.talents.some(
      (t) => t.modifiers.deployableDamageMul || t.modifiers.deployableRangeMul
    );
    expect(hasMineTalents).toBe(true);
  });

  it("talent modifiers apply deployable upgrades", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "medic");
    applyHeroTalent(player, "medic_drone_output");
    expect(getDeployableMultiplier(player, "damage")).toBeGreaterThan(1);
  });

  it("talent modifiers increase player stats", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "assault");
    const beforeHealth = player.maxHealth;
    applyHeroTalent(player, "assault_vitality");
    expect(player.maxHealth).toBeGreaterThan(beforeHealth);
  });
});

describe("hero synergies", () => {
  it("returns active synergy for two paired heroes", () => {
    const synergies = getActiveSynergies(["assault", "vanguard"]);
    expect(synergies.length).toBeGreaterThan(0);
    expect(synergies[0].id).toBe("synergy_frontline");
  });

  it("does not return synergy when required hero is missing", () => {
    const synergies = getActiveSynergies(["assault", "medic"]);
    expect(synergies.find((s) => s.id === "synergy_frontline")).toBeUndefined();
  });

  it("full squad synergy requires all five heroes", () => {
    const allHeroes: HeroId[] = ["scout", "assault", "medic", "engineer", "vanguard"];
    expect(getActiveSynergies(allHeroes).some((s) => s.id === "synergy_full_squad")).toBe(true);
    expect(
      getActiveSynergies(["scout", "assault", "medic", "engineer"]).some(
        (s) => s.id === "synergy_full_squad"
      )
    ).toBe(false);
  });

  it("applies synergy bonuses to player stats", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "assault");
    const beforeHealth = player.maxHealth;
    applyHeroSynergyBonus(player, ["assault", "vanguard"]);
    expect(player.maxHealth).toBeGreaterThan(beforeHealth);
    expect(player.armor).toBeGreaterThan(0);
  });

  it("HERO_SYNERGIES have unique ids", () => {
    const ids = HERO_SYNERGIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("deployable upgrades", () => {
  it("upgradeDeployable increases rank", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "engineer");
    upgradeDeployable(player, "damage");
    upgradeDeployable(player, "damage");
    expect(player.deployableUpgrades.damage).toBe(2);
  });

  it("getDeployableMultiplier scales with rank", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "engineer");
    expect(getDeployableMultiplier(player, "damage")).toBe(1);
    upgradeDeployable(player, "damage");
    expect(getDeployableMultiplier(player, "damage")).toBe(1.01);
  });

  it("deployed turret health scales with health upgrade", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "engineer");
    upgradeDeployable(state.player, "health");
    state.player.skillTimer = 0;
    useHeroSkill(state.player, state);
    const turret = state.defenseState!.deployables[0];
    expect(turret.maxHealth).toBeGreaterThan(350);
  });

  it("deployed shield health scales with health upgrade", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "assault");
    upgradeDeployable(state.player, "health");
    state.player.skillTimer = 0;
    useHeroSkill(state.player, state);
    const shield = state.defenseState!.deployables[0];
    expect(shield.maxHealth).toBeGreaterThan(400);
  });

  it("vanguard deploys multiple mines with mineCount upgrade", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "vanguard");
    state.player.deployableUpgrades.mineCount = 2;
    state.player.skillTimer = 0;
    useHeroSkill(state.player, state);
    expect(state.defenseState!.deployables.filter((d) => d.type === "mine").length).toBe(3);
  });

  it("mine explosion damage scales with damage upgrade", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "vanguard");
    state.player.deployableUpgrades.damage = 10;
    state.player.skillTimer = 0;
    useHeroSkill(state.player, state);
    const mine = state.defenseState!.deployables[0];
    state.enemies.push({
      id: "enemy_1",
      x: mine.x,
      y: mine.y,
      radius: 14,
      speed: 0,
      health: 200,
      maxHealth: 200,
      damage: 10,
      xpValue: 0,
      color: "#f43f5e",
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
    });
    const beforeHealth = state.enemies[0].health;
    handleMineProximity(state);
    expect(state.enemies[0].health).toBeLessThan(beforeHealth);
  });
});
