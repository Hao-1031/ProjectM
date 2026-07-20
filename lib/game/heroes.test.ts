import { describe, it, expect } from "vitest";
import {
  HERO_DEFS,
  applyHeroToPlayer,
  useHeroSkill,
  useHeroUltimate,
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
import type { HeroId, Player, GameState, Enemy } from "./types";
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
  };
}

function createWalker(x: number, y: number): Enemy {
  return {
    id: "enemy_1",
    x,
    y,
    radius: 14,
    speed: 0,
    health: 200,
    maxHealth: 200,
    damage: 10,
    xpValue: 0,
    color: "#f43f5e",
    variant: "walker",
    slow: 0,
    slowTimer: 0,
    freezeTimer: 0,
    droneMarkTimer: 0,
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
}

function createDefenseGameState(): GameState {
  const engine = new GameEngine({}, "defense", 12345);
  engine.resize(800, 600);
  engine.start();
  return engine.state;
}

describe("hero definitions", () => {
  it("each hero has skill, ultimate and passive", () => {
    const ids = Object.keys(HERO_DEFS) as HeroId[];
    expect(ids).toEqual(["nitrogen", "twilight", "leopard", "recon"]);
    for (const id of ids) {
      const def = HERO_DEFS[id];
      expect(def.id).toBe(id);
      expect(def.name).toBeTruthy();
      expect(def.skill).toBeDefined();
      expect(def.ultimate).toBeDefined();
      expect(def.skill.cooldown).toBeGreaterThan(0);
      expect(def.ultimate.cooldown).toBeGreaterThan(0);
      expect(def.passive).toBeDefined();
      expect(Object.keys(def.passive).length).toBeGreaterThan(0);
    }
  });

  it("getHeroName and getHeroColor return hero values", () => {
    expect(getHeroName("nitrogen")).toBe("液氮");
    expect(getHeroColor("leopard")).toBe(HERO_DEFS.leopard.color);
    expect(getHeroName(null)).toBe("默认");
    expect(getHeroColor(null)).toBe("#94a3b8");
  });
});

describe("applyHeroToPlayer", () => {
  it("sets hero id, skill and ultimate", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "nitrogen");
    expect(player.heroId).toBe("nitrogen");
    expect(player.activeSkill).not.toBeNull();
    expect(player.ultimateSkill).not.toBeNull();
    expect(player.activeSkill!.id).toBe("nitrogen_grenade");
    expect(player.ultimateSkill!.id).toBe("nitrogen_zero");
  });

  it("applies nitrogen passive armor and area multiplier", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "nitrogen");
    expect(player.armor).toBeGreaterThan(0);
    expect(player.areaMultiplier).toBe(1.1);
  });

  it("applies twilight passive regen", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "twilight");
    expect(player.regen).toBe(1.5);
  });

  it("applies leopard passive speed and crit", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "leopard");
    expect(player.speed).toBe(260 * 1.1);
    expect(player.critChance).toBe(0.05);
  });

  it("applies recon passive crit and weapon range", () => {
    const player = basePlayer();
    player.weapons = [
      {
        id: "pulse",
        name: "脉冲",
        level: 1,
        maxLevel: 5,
        cooldown: 0.4,
        timer: 0,
        damage: 20,
        range: 300,
        projectileSpeed: 600,
        count: 1,
        spread: 0,
        pierce: 0,
        color: "#22d3ee",
        description: "",
      },
    ];
    applyHeroToPlayer(player, "recon");
    expect(player.critChance).toBe(0.1);
    expect(player.weapons[0].range).toBe(300 * 1.08);
  });

  it("returns unchanged player for unknown hero", () => {
    const player = basePlayer();
    const original = { ...player };
    applyHeroToPlayer(player, "unknown" as HeroId);
    expect(player).toEqual(original);
  });
});

describe("useHeroSkill", () => {
  it("nitrogen deploys a freeze field", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "nitrogen");
    state.player.skillTimer = 0;
    useHeroSkill(state.player, state);
    expect(state.player.skillTimer).toBeGreaterThan(0);
    expect(state.defenseState!.deployables).toHaveLength(1);
    expect(state.defenseState!.deployables[0].type).toBe("freezeField");
  });

  it("twilight deploys a healing aura", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "twilight");
    state.player.skillTimer = 0;
    useHeroSkill(state.player, state);
    expect(state.defenseState!.deployables[0].type).toBe("healAura");
  });

  it("leopard pounce damages enemies along the path", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "leopard");
    state.player.facing = 0;
    state.enemies.push(createWalker(state.player.x + 120, state.player.y));
    const beforeHealth = state.enemies[0].health;
    state.player.skillTimer = 0;
    useHeroSkill(state.player, state);
    expect(state.enemies[0].health).toBeLessThan(beforeHealth);
    expect(state.player.x).toBeGreaterThan(400);
  });

  it("recon deploys a drone", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "recon");
    state.player.skillTimer = 0;
    useHeroSkill(state.player, state);
    expect(state.defenseState!.deployables[0].type).toBe("drone");
  });

  it("does nothing when skill is on cooldown", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "nitrogen");
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

describe("useHeroUltimate", () => {
  it("nitrogen freezes nearby enemies and deals damage", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "nitrogen");
    state.enemies.push(createWalker(state.player.x + 80, state.player.y));
    const beforeHealth = state.enemies[0].health;
    state.player.ultimateTimer = 0;
    useHeroUltimate(state.player, state);
    expect(state.player.ultimateTimer).toBeGreaterThan(0);
    expect(state.enemies[0].health).toBeLessThan(beforeHealth);
    expect(state.enemies[0].freezeTimer).toBeGreaterThan(0);
  });

  it("twilight heals nearby players and clears burn", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "twilight");
    state.player.health = 50;
    state.player.burnDuration = 3;
    state.player.ultimateTimer = 0;
    useHeroUltimate(state.player, state);
    expect(state.player.health).toBeGreaterThan(50);
    expect(state.player.burnDuration).toBe(0);
  });

  it("leopard enters frenzy state", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "leopard");
    state.player.ultimateTimer = 0;
    useHeroUltimate(state.player, state);
    expect(state.player.leopardFrenzyTimer).toBeGreaterThan(0);
    expect(state.player.ultimateTimer).toBeGreaterThan(0);
  });

  it("recon deals damage in targeted area", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "recon");
    state.player.facing = 0;
    state.enemies.push(createWalker(state.player.x + 120, state.player.y));
    const beforeHealth = state.enemies[0].health;
    state.player.ultimateTimer = 0;
    useHeroUltimate(state.player, state);
    expect(state.enemies[0].health).toBeLessThan(beforeHealth);
  });

  it("does nothing when ultimate is on cooldown", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "recon");
    state.player.ultimateTimer = 5;
    const before = state.player.ultimateTimer;
    useHeroUltimate(state.player, state);
    expect(state.player.ultimateTimer).toBe(before);
  });
});

describe("updateHeroSkillsAndDeployables", () => {
  it("reduces skill cooldown and active timers", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "nitrogen");
    state.player.skillTimer = 10;
    state.player.activeSkill!.timer = 5;
    state.player.ultimateTimer = 20;
    updateHeroSkillsAndDeployables(state, 2);
    expect(state.player.skillTimer).toBe(8);
    expect(state.player.activeSkill!.timer).toBe(3);
    expect(state.player.ultimateTimer).toBe(18);
  });

  it("removes expired deployables", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "nitrogen");
    useHeroSkill(state.player, state);
    const deployable = state.defenseState!.deployables[0];
    deployable.timer = 0.1;
    updateHeroSkillsAndDeployables(state, 0.2);
    expect(state.defenseState!.deployables).toHaveLength(0);
  });

  it("healAura restores player health", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "twilight");
    useHeroSkill(state.player, state);
    state.player.health = 50;
    const deployable = state.defenseState!.deployables[0];
    deployable.timer = 2;
    updateHeroSkillsAndDeployables(state, 1);
    expect(state.player.health).toBeGreaterThan(50);
  });

  it("freezeField slows enemies", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "nitrogen");
    useHeroSkill(state.player, state);
    const deployable = state.defenseState!.deployables[0];
    state.enemies.push(createWalker(deployable.x, deployable.y));
    updateHeroSkillsAndDeployables(state, 0.5);
    expect(state.enemies[0].slow).toBeGreaterThan(0);
  });

  it("drone marks enemies", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "recon");
    useHeroSkill(state.player, state);
    const deployable = state.defenseState!.deployables[0];
    state.enemies.push(createWalker(deployable.x, deployable.y));
    updateHeroSkillsAndDeployables(state, 0.5);
    expect(state.enemies[0].droneMarkTimer).toBeGreaterThan(0);
  });

  it("leopard frenzy timer ticks down", () => {
    const state = createDefenseGameState();
    applyHeroToPlayer(state.player, "leopard");
    state.player.leopardFrenzyTimer = 5;
    updateHeroSkillsAndDeployables(state, 2);
    expect(state.player.leopardFrenzyTimer).toBe(3);
  });
});

describe("applyHeroTalent", () => {
  it("applies damage talent for nitrogen", () => {
    const player = basePlayer();
    player.weapons = [
      {
        id: "pulse",
        name: "脉冲",
        level: 1,
        maxLevel: 5,
        cooldown: 0.4,
        timer: 0,
        damage: 20,
        range: 300,
        projectileSpeed: 600,
        count: 1,
        spread: 0,
        pierce: 0,
        color: "#22d3ee",
        description: "",
      },
    ];
    applyHeroToPlayer(player, "nitrogen");
    applyHeroTalent(player, "nitrogen_conduction");
    expect(player.weapons[0].damage).toBe(21);
  });

  it("applies skill variant talent", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "nitrogen");
    applyHeroTalent(player, "nitrogen_supercooled");
    expect(player.talentLevels["nitrogen_supercooled"]).toBe(1);
    expect(player.areaMultiplier).toBe(1.1 * 1.1);
  });

  it("applies utility talent", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "leopard");
    const beforeSpeed = player.speed;
    applyHeroTalent(player, "leopard_reflexes");
    expect(player.speed).toBeGreaterThan(beforeSpeed);
  });

  it("does nothing when player has no hero", () => {
    const player = basePlayer();
    const original = { ...player };
    applyHeroTalent(player, "nitrogen_conduction");
    expect(player).toEqual(original);
  });
});

describe("createNullHeroState", () => {
  it("clears hero state from player", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "recon");
    createNullHeroState(player);
    expect(player.heroId).toBeNull();
    expect(player.activeSkill).toBeNull();
    expect(player.ultimateSkill).toBeNull();
    expect(player.skillTimer).toBe(0);
    expect(player.ultimateTimer).toBe(0);
  });
});

describe("hero talent trees", () => {
  it("every hero has exactly 4 talents", () => {
    const ids = Object.keys(HERO_DEFS) as HeroId[];
    for (const id of ids) {
      expect(HERO_DEFS[id].talents.length).toBe(4);
    }
  });

  it("every hero has 2 damage, 1 skill variant and 1 utility talent", () => {
    const ids = Object.keys(HERO_DEFS) as HeroId[];
    for (const id of ids) {
      const talents = HERO_DEFS[id].talents;
      expect(talents.filter((t) => t.category === "damage").length).toBe(2);
      expect(talents.filter((t) => t.category === "skill").length).toBe(1);
      expect(talents.filter((t) => t.category === "utility").length).toBe(1);
      const variant = talents.find((t) => t.category === "skill");
      expect(variant?.isSkillVariant).toBe(true);
      expect(variant?.maxLevel).toBe(1);
    }
  });
});

describe("hero synergies", () => {
  it("returns no synergies by default", () => {
    expect(getActiveSynergies(["nitrogen", "twilight"])).toHaveLength(0);
  });

  it("applyHeroSynergyBonus returns player unchanged", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "nitrogen");
    const original = { ...player };
    applyHeroSynergyBonus(player, ["nitrogen", "twilight"]);
    expect(player).toEqual(original);
  });
});

describe("deployable upgrades", () => {
  it("upgradeDeployable increases rank", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "nitrogen");
    upgradeDeployable(player, "damage");
    upgradeDeployable(player, "damage");
    expect(player.deployableUpgrades.damage).toBe(2);
  });

  it("getDeployableMultiplier scales with rank", () => {
    const player = basePlayer();
    applyHeroToPlayer(player, "nitrogen");
    expect(getDeployableMultiplier(player, "damage")).toBe(1);
    upgradeDeployable(player, "damage");
    expect(getDeployableMultiplier(player, "damage")).toBe(1.01);
  });

  it("mine proximity explosion damages enemies", () => {
    const state = createDefenseGameState();
    state.defenseState!.deployables.push({
      id: "mine_1",
      x: 400,
      y: 300,
      radius: 12,
      type: "mine",
      ownerId: "player",
      health: 1,
      maxHealth: 1,
      timer: 60,
      maxTimer: 60,
      color: "#f59e0b",
    });
    state.enemies.push(createWalker(400, 300));
    const beforeHealth = state.enemies[0].health;
    handleMineProximity(state);
    expect(state.enemies[0].health).toBeLessThan(beforeHealth);
  });
});
