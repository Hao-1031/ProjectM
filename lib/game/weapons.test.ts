import { describe, it, expect, vi } from "vitest";
import {
  createPulseRifle,
  createShotgun,
  createLaser,
  createRocketLauncher,
  createFlamethrower,
  createDroneSwarm,
  WEAPON_CREATORS,
  getStarterWeapons,
  upgradeWeapon,
  generateUpgradeOptions,
  applyUpgrade,
  createPassive,
  applyPassive,
} from "./weapons";
import type { Player, UpgradeOption } from "./types";

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
  weapons: getStarterWeapons(),
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
});

describe("weapons", () => {
  describe("createPulseRifle", () => {
    it("creates a level 1 pulse rifle", () => {
      const weapon = createPulseRifle();
      expect(weapon.id).toBe("pulse");
      expect(weapon.level).toBe(1);
      expect(weapon.maxLevel).toBe(5);
      expect(weapon.damage).toBe(20);
    });
  });

  describe("createShotgun", () => {
    it("creates a level 1 shotgun", () => {
      const weapon = createShotgun();
      expect(weapon.id).toBe("shotgun");
      expect(weapon.level).toBe(1);
      expect(weapon.count).toBe(5);
    });
  });

  describe("createLaser", () => {
    it("creates a level 1 laser", () => {
      const weapon = createLaser();
      expect(weapon.id).toBe("laser");
      expect(weapon.level).toBe(1);
      expect(weapon.pierce).toBe(5);
    });
  });

  describe("createRocketLauncher", () => {
    it("creates a level 1 rocket launcher", () => {
      const weapon = createRocketLauncher();
      expect(weapon.id).toBe("rocket");
      expect(weapon.damage).toBe(55);
      expect(weapon.cooldown).toBe(1.05);
    });
  });

  describe("createFlamethrower", () => {
    it("creates a level 1 flamethrower", () => {
      const weapon = createFlamethrower();
      expect(weapon.id).toBe("flame");
      expect(weapon.damage).toBe(9);
      expect(weapon.count).toBe(2);
    });
  });

  describe("createDroneSwarm", () => {
    it("creates a level 1 drone swarm", () => {
      const weapon = createDroneSwarm();
      expect(weapon.id).toBe("drone");
      expect(weapon.count).toBe(2);
      expect(weapon.pierce).toBe(1);
    });
  });

  describe("getStarterWeapons", () => {
    it("returns only pulse rifle", () => {
      const weapons = getStarterWeapons();
      expect(weapons).toHaveLength(1);
      expect(weapons[0].id).toBe("pulse");
    });
  });

  describe("upgradeWeapon", () => {
    it("increases weapon level", () => {
      const pulse = createPulseRifle();
      const upgraded = upgradeWeapon(pulse);
      expect(upgraded.level).toBe(2);
      expect(upgraded.damage).toBeGreaterThan(pulse.damage);
    });

    it("stops applying upgrades after max level", () => {
      let weapon = createPulseRifle();
      for (let i = 0; i < 10; i++) {
        weapon = upgradeWeapon(weapon);
      }
      expect(weapon.level).toBe(5);
    });

    it("upgrades rocket area radius", () => {
      const rocket = createRocketLauncher();
      const upgraded = upgradeWeapon(rocket);
      expect(upgraded.level).toBe(2);
      expect(upgraded.areaRadius).toBeGreaterThan(rocket.areaRadius ?? 0);
    });

    it("upgrades flame burn duration", () => {
      const flame = createFlamethrower();
      const upgraded = upgradeWeapon(flame);
      expect(upgraded.burnDuration).toBeGreaterThan(flame.burnDuration ?? 0);
    });
  });

  describe("passives", () => {
    it("creates passive item", () => {
      const passive = createPassive("maxHealth", 1);
      expect(passive.id).toBe("maxHealth");
      expect(passive.name).toBe("生命强化");
      expect(passive.maxLevel).toBe(5);
    });

    it("applies max health passive", () => {
      const player = basePlayer();
      const next = applyPassive(player, "maxHealth");
      expect(next.maxHealth).toBe(120);
      expect(next.health).toBe(120);
      expect(next.passives).toHaveLength(1);
      expect(next.passives[0].level).toBe(1);
    });

    it("levels up existing passive", () => {
      const player = applyPassive(basePlayer(), "speed");
      const next = applyPassive(player, "speed");
      expect(next.passives[0].level).toBe(2);
      expect(next.speed).toBeCloseTo(260 * 1.06 * 1.06);
    });

    it("does not exceed passive max level", () => {
      let player = basePlayer();
      for (let i = 0; i < 6; i++) {
        player = applyPassive(player, "magnet");
      }
      expect(player.passives[0].level).toBe(5);
    });
  });

  describe("generateUpgradeOptions", () => {
    it("generates four options", () => {
      const options = generateUpgradeOptions(basePlayer());
      expect(options.length).toBe(4);
    });

    it("offers new weapon when slot available", () => {
      const random = vi.spyOn(Math, "random").mockReturnValue(0.99);
      const options = generateUpgradeOptions(basePlayer());
      random.mockRestore();
      const newWeapon = options.find(
        (o) => o.type === "weapon" && o.level === 1 && o.targetId !== "pulse"
      );
      expect(newWeapon).toBeDefined();
    });

    it("includes passive options", () => {
      const options = generateUpgradeOptions(basePlayer());
      const passive = options.find((o) => o.type === "passive");
      expect(passive).toBeDefined();
    });

    it("does not offer passive beyond max level", () => {
      let player = basePlayer();
      for (let i = 0; i < 5; i++) {
        player = applyPassive(player, "armor");
      }
      const options = generateUpgradeOptions(player);
      expect(options.some((o) => o.type === "passive" && o.targetId === "armor")).toBe(false);
    });
  });

  describe("applyUpgrade", () => {
    it("applies weapon upgrade", () => {
      const option: UpgradeOption = {
        id: "opt_1",
        type: "weapon",
        targetId: "pulse",
        name: "脉冲步枪 Lv.2",
        description: "伤害提升",
        level: 1,
        maxLevel: 5,
      };
      const next = applyUpgrade(basePlayer(), option);
      expect(next.weapons[0].level).toBe(2);
    });

    it("unlocks new weapon", () => {
      const option: UpgradeOption = {
        id: "opt_1",
        type: "weapon",
        targetId: "shotgun",
        name: "解锁霰弹爆破",
        description: "扇形散射",
        level: 1,
        maxLevel: 5,
      };
      const next = applyUpgrade(basePlayer(), option);
      expect(next.weapons).toHaveLength(2);
      expect(next.weapons[1].id).toBe("shotgun");
    });

    it("applies passive upgrade", () => {
      const option: UpgradeOption = {
        id: "opt_1",
        type: "passive",
        targetId: "maxHealth",
        name: "生命强化",
        description: "最大生命值 +20",
        level: 0,
        maxLevel: 5,
      };
      const next = applyUpgrade(basePlayer(), option);
      expect(next.maxHealth).toBe(120);
    });

    it("applies legacy stat upgrade as passive", () => {
      const option: UpgradeOption = {
        id: "opt_1",
        type: "stat",
        targetId: "speed",
        name: "机动增强",
        description: "移动速度 +6%",
        level: 0,
        maxLevel: 5,
      };
      const next = applyUpgrade(basePlayer(), option);
      expect(next.speed).toBeCloseTo(260 * 1.06);
    });
  });

  describe("additional weapon behavior", () => {
    it("all weapon creators produce level 1 weapons", () => {
      const ids = ["pulse", "shotgun", "laser", "rocket", "flame", "drone"] as const;
      for (const id of ids) {
        const weapon = WEAPON_CREATORS[id]();
        expect(weapon.id).toBe(id);
        expect(weapon.level).toBe(1);
        expect(weapon.maxLevel).toBeGreaterThanOrEqual(1);
      }
    });

    it("drone swarm gains additional drones on upgrade", () => {
      const drone = createDroneSwarm();
      const upgraded = upgradeWeapon(drone);
      expect(upgraded.count).toBeGreaterThan(drone.count);
    });

    it("laser gains additional pierce on upgrade", () => {
      const laser = createLaser();
      const upgraded = upgradeWeapon(laser);
      expect(upgraded.pierce).toBeGreaterThan(laser.pierce);
    });

    it("rocket launcher damage and area radius increase on upgrade", () => {
      const rocket = createRocketLauncher();
      const upgraded = upgradeWeapon(rocket);
      expect(upgraded.damage).toBeGreaterThan(rocket.damage);
      expect(upgraded.areaRadius ?? 0).toBeGreaterThan(rocket.areaRadius ?? 0);
    });

    it("flamethrower burn duration increases on upgrade", () => {
      const flame = createFlamethrower();
      const upgraded = upgradeWeapon(flame);
      expect(upgraded.burnDuration ?? 0).toBeGreaterThan(flame.burnDuration ?? 0);
    });

    it("upgrading at max level keeps weapon at max level", () => {
      let weapon = createPulseRifle();
      for (let i = 1; i < weapon.maxLevel; i++) {
        weapon = upgradeWeapon(weapon);
      }
      expect(weapon.level).toBe(weapon.maxLevel);
      const atMax = upgradeWeapon(weapon);
      expect(atMax.level).toBe(weapon.maxLevel);
    });
  });
});
