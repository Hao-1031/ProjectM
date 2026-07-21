import { describe, it, expect } from "vitest";
import {
  SEASON_ID,
  SEASON_NAME,
  SEASON_DURATION_DAYS,
  MAX_SEASON_LEVEL,
  XP_PER_LEVEL,
  createSeasonState,
  generateSeasonRewards,
  generateSeasonMissions,
  generateSeasonShopItems,
  addSeasonXp,
  claimReward,
  updateMissionProgress,
  unlockPremium,
  getUnlockedHeroes,
  getAvailableShopItems,
  buySeasonShopItem,
  getSeasonCurrencyReward,
} from "./season";

describe("season state", () => {
  it("creates a valid initial season", () => {
    const now = Date.now();
    const state = createSeasonState(now);
    expect(state.id).toBe(SEASON_ID);
    expect(state.name).toBe(SEASON_NAME);
    expect(state.startTime).toBe(now);
    expect(state.endTime).toBe(now + SEASON_DURATION_DAYS * 24 * 60 * 60 * 1000);
    expect(state.currentLevel).toBe(1);
    expect(state.currentXp).toBe(0);
    expect(state.xpToNext).toBe(XP_PER_LEVEL);
    expect(state.premiumUnlocked).toBe(false);
    expect(state.seasonCurrency).toBe(0);
  });

  it("generates 50 free and premium rewards", () => {
    const rewards = generateSeasonRewards();
    const maxLevel = Math.max(...rewards.map((r) => r.level));
    expect(maxLevel).toBeLessThanOrEqual(MAX_SEASON_LEVEL);
    expect(rewards.some((r) => r.free)).toBe(true);
    expect(rewards.some((r) => r.premium)).toBe(true);
    expect(rewards.find((r) => r.id === "s2-hero-viper")?.free).toBe(true);
    expect(rewards.find((r) => r.id === "s2-hero-falcon")?.free).toBe(true);
    expect(rewards.find((r) => r.id === "s2-hero-bastion")?.free).toBe(true);

    // Every level should have at least one reward
    for (let level = 1; level <= MAX_SEASON_LEVEL; level++) {
      const levelRewards = rewards.filter((r) => r.level === level);
      expect(levelRewards.length).toBeGreaterThan(0);
    }
  });

  it("generates weekly, daily and season missions", () => {
    const missions = generateSeasonMissions();
    expect(missions.length).toBeGreaterThan(0);
    expect(missions.some((m) => m.category === "daily")).toBe(true);
    expect(missions.some((m) => m.category === "weekly")).toBe(true);
    expect(missions.some((m) => m.category === "season")).toBe(true);
    expect(missions.some((m) => m.resetWeekly)).toBe(true);
    expect(missions.some((m) => !m.resetWeekly)).toBe(true);
  });
});

describe("season progression", () => {
  it("adds xp and levels up", () => {
    const state = createSeasonState();
    const next = addSeasonXp(state, XP_PER_LEVEL + 100);
    expect(next.currentLevel).toBe(2);
    expect(next.currentXp).toBe(100);
  });

  it("unlocks rewards when leveling up", () => {
    const state = createSeasonState();
    // Level 1 -> 2 needs 1000 XP, level 2 -> 3 needs 1100 XP
    const next = addSeasonXp(state, XP_PER_LEVEL + (XP_PER_LEVEL + 100));
    expect(next.currentLevel).toBe(3);
    expect(next.rewards.every((r) => r.level > 3 || r.unlocked)).toBe(true);
  });

  it("caps at max level", () => {
    const state = createSeasonState();
    // Total XP to reach level 50 is roughly sum of arithmetic series 1000 + 1100 + ...
    const next = addSeasonXp(state, 999999);
    expect(next.currentLevel).toBe(MAX_SEASON_LEVEL);
    expect(next.xpToNext).toBe(0);
  });
});

describe("claim reward", () => {
  it("claims unlocked free reward", () => {
    // Reach level 10 requires ~12,600 XP due to increasing per-level cost
    const state = addSeasonXp(createSeasonState(), 15000);
    const reward = state.rewards.find((r) => r.level <= 10 && r.free)!;
    const { state: next, reward: claimed } = claimReward(state, reward.id);
    expect(claimed).not.toBeNull();
    expect(next.rewards.find((r) => r.id === reward.id)?.claimed).toBe(true);
  });

  it("does not claim premium reward without premium", () => {
    // Reach level 35 requires ~90,100 XP
    const state = addSeasonXp(createSeasonState(), 100000);
    const reward = state.rewards.find((r) => r.level === 35 && r.premium)!;
    const { state: next, reward: claimed } = claimReward(state, reward.id);
    expect(claimed).toBeNull();
    expect(next.rewards.find((r) => r.id === reward.id)?.claimed).toBe(false);
  });

  it("claims premium reward after unlocking premium", () => {
    const state = unlockPremium(addSeasonXp(createSeasonState(), 100000));
    const reward = state.rewards.find((r) => r.level === 35 && r.premium)!;
    const { reward: claimed } = claimReward(state, reward.id);
    expect(claimed).not.toBeNull();
  });
});

describe("mission progress", () => {
  it("updates progress and grants xp on completion", () => {
    const state = createSeasonState();
    const mission = state.missions[0];
    const { state: next, gainedXp } = updateMissionProgress(state, mission.id, mission.target);
    expect(gainedXp).toBe(mission.xpReward);
    expect(next.missions.find((m) => m.id === mission.id)?.completed).toBe(true);
  });

  it("does not double grant xp", () => {
    const state = createSeasonState();
    const mission = state.missions[0];
    const s1 = updateMissionProgress(state, mission.id, mission.target).state;
    const { gainedXp } = updateMissionProgress(s1, mission.id, 1);
    expect(gainedXp).toBe(0);
  });
});

describe("hero unlock", () => {
  it("unlocks viper from season reward", () => {
    const state = createSeasonState();
    const heroes = getUnlockedHeroes(["nitrogen", "twilight", "leopard", "recon"], state);
    expect(heroes).not.toContain("viper");

    const claimed = claimReward(addSeasonXp(state, XP_PER_LEVEL), "s2-hero-viper").state;
    const unlocked = getUnlockedHeroes(["nitrogen", "twilight", "leopard", "recon"], claimed);
    expect(unlocked).toContain("viper");
  });

  it("unlocks all new heroes from free track", () => {
    const state = addSeasonXp(createSeasonState(), 15000);
    const claimed = state.rewards.reduce(
      (acc, r) => (r.free && r.type === "heroUnlock" ? claimReward(acc, r.id).state : acc),
      state
    );
    const heroes = getUnlockedHeroes(["nitrogen", "twilight", "leopard", "recon"], claimed);
    expect(heroes).toContain("viper");
    expect(heroes).toContain("falcon");
    expect(heroes).toContain("bastion");
  });
});

describe("season currency reward", () => {
  it("returns correct currency amount based on track", () => {
    const freeCurrency = generateSeasonRewards().find(
      (r) => r.type === "currency" && r.free && !r.premium
    )!;
    const premiumCurrency = generateSeasonRewards().find(
      (r) => r.type === "currency" && r.premium && !r.free
    )!;
    expect(getSeasonCurrencyReward(freeCurrency)).toBe(freeCurrency.level * 2);
    expect(getSeasonCurrencyReward(premiumCurrency)).toBe(premiumCurrency.level * 4);
  });
});

describe("season shop", () => {
  it("generates shop items", () => {
    const items = generateSeasonShopItems();
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => i.cost > 0 || !i.available)).toBe(true);
  });

  it("filters available items by level and ownership", () => {
    const items = generateSeasonShopItems();
    const available = getAvailableShopItems(items, 25, []);
    expect(available.some((i) => i.id === "s2-shop-skin-rust")).toBe(true);

    const owned = getAvailableShopItems(items, 25, ["s2-shop-skin-wasteland"]);
    expect(owned.some((i) => i.id === "s2-shop-skin-wasteland")).toBe(false);

    const lowLevel = getAvailableShopItems(items, 5, []);
    expect(lowLevel.find((i) => i.id === "s2-shop-skin-rust")?.available).toBe(false);
  });

  it("buys item when currency and level are sufficient", () => {
    const state = { ...createSeasonState(), seasonCurrency: 1000, currentLevel: 15 };
    const item = generateSeasonShopItems().find((i) => i.id === "s2-shop-emote-salute")!;
    const result = buySeasonShopItem(state, item, []);
    expect(result.success).toBe(true);
    expect(result.state.seasonCurrency).toBe(1000 - item.cost);
    expect(result.ownedIds).toContain(item.id);
  });

  it("refuses purchase when currency is insufficient", () => {
    const state = { ...createSeasonState(), seasonCurrency: 100, currentLevel: 15 };
    const item = generateSeasonShopItems().find((i) => i.id === "s2-shop-skin-wasteland")!;
    const result = buySeasonShopItem(state, item, []);
    expect(result.success).toBe(false);
  });

  it("refuses purchase when level is too low", () => {
    const state = { ...createSeasonState(), seasonCurrency: 2000, currentLevel: 5 };
    const item = generateSeasonShopItems().find((i) => i.id === "s2-shop-skin-rust")!;
    const result = buySeasonShopItem(state, item, []);
    expect(result.success).toBe(false);
  });

  it("refuses duplicate purchase", () => {
    const state = { ...createSeasonState(), seasonCurrency: 2000, currentLevel: 25 };
    const item = generateSeasonShopItems().find((i) => i.id === "s2-shop-skin-wasteland")!;
    const result = buySeasonShopItem(state, item, [item.id]);
    expect(result.success).toBe(false);
  });
});
