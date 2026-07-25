import { describe, it, expect } from "vitest";
import { recommendRewards, type RewardOption, type PlayerBuild, type EnemyComposition } from "./rewardRecommendation";

const options: RewardOption[] = [
  { id: "w1", name: "散射脉冲", type: "weapon", tags: ["area", "multishot"], rarity: "rare" },
  { id: "p1", name: "纳米再生", type: "passive", tags: ["regen"], rarity: "epic" },
  { id: "w2", name: "穿甲磁轨", type: "weapon", tags: ["pierce", "bossDamage"], rarity: "legendary" },
  { id: "p2", name: "动能护盾", type: "passive", tags: ["shield"], rarity: "common" },
];

const baseBuild: PlayerBuild = {
  weapons: ["plasma"],
  passives: ["speed"],
  heroId: "nitrogen",
  healthPercent: 0.8,
};

const baseEnemies: EnemyComposition = {
  variants: ["tank"],
  eliteRatio: 0.1,
  bossPresent: false,
};

describe("奖励/构筑推荐", () => {
  it("克制当前敌人的选项排名更高", () => {
    const result = recommendRewards(options, baseBuild, { ...baseEnemies, variants: ["tank"] });
    const pierceOption = result.find((r) => r.option.id === "w2");
    expect(pierceOption).toBeDefined();
    expect(pierceOption!.score).toBeGreaterThan(0);
  });

  it("低血量时优先推荐恢复/护盾", () => {
    const lowHealthBuild = { ...baseBuild, healthPercent: 0.25 };
    const result = recommendRewards(options, lowHealthBuild, baseEnemies);
    const topIds = result.slice(0, 2).map((r) => r.option.id);
    expect(topIds).toContain("p1");
  });

  it("BOSS 在场时优先推荐 bossDamage", () => {
    const bossEnemies = { ...baseEnemies, bossPresent: true };
    const result = recommendRewards(options, baseBuild, bossEnemies);
    const top = result[0];
    expect(top.option.tags).toContain("bossDamage");
  });

  it("返回结果数量不超过 maxResults", () => {
    const result = recommendRewards(options, baseBuild, baseEnemies, { maxResults: 2 });
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("空选项返回空数组", () => {
    expect(recommendRewards([], baseBuild, baseEnemies)).toEqual([]);
  });
});
