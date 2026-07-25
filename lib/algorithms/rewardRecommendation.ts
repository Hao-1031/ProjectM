export type RewardType = "weapon" | "passive" | "skillVariant";

export interface RewardOption {
  id: string;
  name: string;
  type: RewardType;
  tags: string[];
  rarity: "common" | "rare" | "epic" | "legendary";
  level?: number;
}

export interface PlayerBuild {
  weapons: string[];
  passives: string[];
  heroId: string;
  healthPercent: number;
}

export interface EnemyComposition {
  variants: string[];
  eliteRatio: number;
  bossPresent: boolean;
}

export interface RewardScore {
  option: RewardOption;
  score: number;
  reason: string;
}

const RARITY_WEIGHTS: Record<string, number> = {
  common: 1,
  rare: 1.15,
  epic: 1.35,
  legendary: 1.6,
};

const COUNTER_TAGS: Record<string, string[]> = {
  swarm: ["area", "chain", "multishot"],
  tank: ["pierce", "slow", "armorBreak"],
  elite: ["crit", "burn", "corrosive"],
  aerial: ["homing", "laser", "railgun"],
  melee: ["knockback", "freeze", "shield"],
  boss: ["crit", "pierce", "burn"],
};

/**
 * 根据当前构筑、敌人组成与血量状态，推荐下一项奖励。
 * 目标：避免同质化构筑，提供 counter-pick 与补弱建议。
 */
export function recommendRewards(
  options: RewardOption[],
  build: PlayerBuild,
  enemies: EnemyComposition,
  optionsConfig: { maxResults?: number; diversityDecay?: number } = {}
): RewardScore[] {
  const { maxResults = 3, diversityDecay = 0.15 } = optionsConfig;

  if (!options.length) return [];

  const enemyTags = new Set(enemies.variants.flatMap((v) => COUNTER_TAGS[v] ?? []));
  const ownedTags = new Set([...build.weapons, ...build.passives]);

  const scored = options.map((option) => {
    let score = 0;
    const reasons: string[] = [];

    // 稀有度加成
    const rarityMultiplier = RARITY_WEIGHTS[option.rarity] ?? 1;
    score += rarityMultiplier * 8;
    if (option.rarity !== "common") reasons.push(`品质：${option.rarity}`);

    // 克制当前敌人
    const counterMatches = option.tags.filter((t) => enemyTags.has(t)).length;
    if (counterMatches > 0) {
      score += counterMatches * 12;
      reasons.push("克制当前敌人");
    }

    // 补足缺失类型，防止同质化
    const newTags = option.tags.filter((t) => !ownedTags.has(t));
    const duplicateTags = option.tags.filter((t) => ownedTags.has(t));
    score += newTags.length * 10;
    score -= duplicateTags.length * 6;
    if (newTags.length > 0) reasons.push("扩展构筑");
    if (duplicateTags.length > 0) reasons.push("已有类似选择");

    // 低血量时优先防御/恢复类
    if (build.healthPercent < 0.4 && option.tags.includes("regen")) {
      score += 15;
      reasons.push("低血量恢复优先");
    }
    if (build.healthPercent < 0.4 && option.tags.includes("shield")) {
      score += 10;
      reasons.push("低血量护盾优先");
    }

    // BOSS 战中优先单体高伤
    if (enemies.bossPresent && option.tags.includes("bossDamage")) {
      score += 12;
      reasons.push("BOSS 战增伤");
    }

    // 精英比例高时优先控制
    if (enemies.eliteRatio > 0.3 && option.tags.includes("control")) {
      score += 8;
      reasons.push("精英控制优先");
    }

    return {
      option,
      score: clamp(score, 0, 100),
      reason: reasons.length > 0 ? reasons[0] : "综合评估",
    };
  });

  // 多样性衰减：同类型奖励重复出现时降低后续分数
  const typeCount = new Map<RewardType, number>();
  scored.sort((a, b) => b.score - a.score);

  const results: RewardScore[] = [];
  for (const entry of scored) {
    const count = typeCount.get(entry.option.type) ?? 0;
    const decayedScore = clamp(entry.score - count * diversityDecay * 10, 0, 100);
    typeCount.set(entry.option.type, count + 1);

    results.push({ option: entry.option, score: round2(decayedScore), reason: entry.reason });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
