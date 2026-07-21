import type {
  HeroId,
  SeasonMission,
  SeasonMissionCategory,
  SeasonReward,
  SeasonState,
  SeasonRewardType,
  SeasonShopItem,
} from "./types";

export const SEASON_ID = "s2-mobile-front";
export const SEASON_NAME = "移动前线";
export const SEASON_DURATION_DAYS = 56;
export const XP_PER_LEVEL = 1000;
export const MAX_SEASON_LEVEL = 50;

export const SEASON_REWARD_TYPES: Record<SeasonRewardType, { color: string; label: string }> = {
  skin: { color: "#b87a3d", label: "皮肤" },
  currency: { color: "#7a8f3e", label: "赛季币" },
  emote: { color: "#c9a34e", label: "表情" },
  badge: { color: "#5e8c6a", label: "徽章" },
  convenience: { color: "#818cf8", label: "便利" },
  heroUnlock: { color: "#22d3ee", label: "英雄" },
};

export function createSeasonState(now = Date.now()): SeasonState {
  return {
    id: SEASON_ID,
    name: SEASON_NAME,
    startTime: now,
    endTime: now + SEASON_DURATION_DAYS * 24 * 60 * 60 * 1000,
    currentLevel: 1,
    currentXp: 0,
    xpToNext: XP_PER_LEVEL,
    premiumUnlocked: false,
    rewards: generateSeasonRewards(),
    missions: generateSeasonMissions(),
    seasonCurrency: 0,
  };
}

function createReward(
  id: string,
  level: number,
  type: SeasonRewardType,
  name: string,
  description: string,
  free: boolean,
  premium: boolean
): SeasonReward {
  return {
    id,
    level,
    type,
    name,
    description,
    free,
    premium,
    unlocked: false,
    claimed: false,
  };
}

export function generateSeasonRewards(): SeasonReward[] {
  const rewards: SeasonReward[] = [];

  // Hero unlocks on free track
  rewards.push(
    createReward(
      "s2-hero-viper",
      1,
      "heroUnlock",
      "蝰蛇",
      "解锁新英雄蝰蛇（免费线）",
      true,
      false
    )
  );
  rewards.push(
    createReward(
      "s2-hero-falcon",
      5,
      "heroUnlock",
      "猎鹰",
      "解锁新英雄猎鹰（免费线）",
      true,
      false
    )
  );
  rewards.push(
    createReward(
      "s2-hero-bastion",
      10,
      "heroUnlock",
      "堡垒",
      "解锁新英雄堡垒（免费线）",
      true,
      false
    )
  );

  for (let level = 1; level <= MAX_SEASON_LEVEL; level++) {
    const hasFreeHero = level === 1 || level === 5 || level === 10;
    if (hasFreeHero) continue;

    // Free track pattern
    if (level % 2 === 0) {
      rewards.push(
        createReward(
          `s2-currency-free-${level}`,
          level,
          "currency",
          "赛季币",
          `免费线奖励：获得 ${level * 2} 赛季币`,
          true,
          false
        )
      );
    } else if (level === 15 || level === 30 || level === 45) {
      const names: Record<number, string> = {
        15: "废土行者涂装",
        30: "锈蚀核心涂装",
        45: "轨道幽灵涂装",
      };
      rewards.push(
        createReward(
          `s2-skin-free-${level}`,
          level,
          "skin",
          names[level],
          `赛季专属外观（免费线 ${level} 级）`,
          true,
          false
        )
      );
    } else if (level === 20 || level === 40) {
      const names: Record<number, string> = {
        20: "前线新兵徽章",
        40: "据点守卫徽章",
      };
      rewards.push(
        createReward(
          `s2-badge-free-${level}`,
          level,
          "badge",
          names[level],
          `赛季专属徽章（免费线 ${level} 级）`,
          true,
          false
        )
      );
    } else if (level === 25 || level === 50) {
      const names: Record<number, string> = {
        25: "敬礼表情",
        50: "专属入场表情",
      };
      rewards.push(
        createReward(
          `s2-emote-free-${level}`,
          level,
          "emote",
          names[level],
          `赛季专属表情（免费线 ${level} 级）`,
          true,
          false
        )
      );
    } else if (level === 35) {
      rewards.push(
        createReward(
          `s2-convenience-free-${level}`,
          level,
          "convenience",
          "额外存档栏位",
          "扩展一个自定义配装存档槽位，不影响对局",
          true,
          false
        )
      );
    } else {
      // Fallback currency for remaining odd levels
      rewards.push(
        createReward(
          `s2-currency-free-${level}`,
          level,
          "currency",
          "赛季币",
          `免费线奖励：获得 ${level} 赛季币`,
          true,
          false
        )
      );
    }

    // Premium track: every level has a premium reward
    if (level % 3 === 0) {
      rewards.push(
        createReward(
          `s2-currency-premium-${level}`,
          level,
          "currency",
          "赛季币",
          `付费线奖励：获得 ${level * 4} 赛季币`,
          false,
          true
        )
      );
    } else if (level === 1 || level === 12 || level === 24 || level === 38 || level === 50) {
      const names: Record<number, string> = {
        1: "极光先锋涂装",
        12: "黑钢特勤涂装",
        24: "赤色警戒涂装",
        38: "深空漫游涂装",
        50: "终极典藏涂装",
      };
      rewards.push(
        createReward(
          `s2-skin-premium-${level}`,
          level,
          "skin",
          names[level],
          `赛季限定外观（付费线 ${level} 级）`,
          false,
          true
        )
      );
    } else if (level === 8 || level === 18 || level === 28 || level === 42) {
      const names: Record<number, string> = {
        8: "胜利姿态表情",
        18: "嘲讽表情",
        28: "集合表情",
        42: "终极胜利表情",
      };
      rewards.push(
        createReward(
          `s2-emote-premium-${level}`,
          level,
          "emote",
          names[level],
          `赛季限定表情（付费线 ${level} 级）`,
          false,
          true
        )
      );
    } else if (level === 6 || level === 16 || level === 26 || level === 36 || level === 46) {
      const names: Record<number, string> = {
        6: "精英猎手徽章",
        16: "机械克星徽章",
        26: "节点掌控者徽章",
        36: "寒冬幸存者徽章",
        46: "实验室清道夫徽章",
      };
      rewards.push(
        createReward(
          `s2-badge-premium-${level}`,
          level,
          "badge",
          names[level],
          `赛季限定徽章（付费线 ${level} 级）`,
          false,
          true
        )
      );
    } else if (level === 10 || level === 30) {
      rewards.push(
        createReward(
          `s2-convenience-premium-${level}`,
          level,
          "convenience",
          "便利道具包",
          "包含额外存档栏位与经验加成卡，不影响对局数值",
          false,
          true
        )
      );
    } else {
      // Fallback premium currency for remaining levels
      rewards.push(
        createReward(
          `s2-currency-premium-${level}`,
          level,
          "currency",
          "赛季币",
          `付费线奖励：获得 ${level * 3} 赛季币`,
          false,
          true
        )
      );
    }
  }

  return rewards;
}

function createMission(
  id: string,
  title: string,
  description: string,
  target: number,
  xpReward: number,
  category: SeasonMissionCategory,
  resetWeekly: boolean
): SeasonMission {
  return {
    id,
    title,
    description,
    target,
    progress: 0,
    xpReward,
    completed: false,
    resetWeekly,
    category,
  };
}

export function generateSeasonMissions(): SeasonMission[] {
  const missions: SeasonMission[] = [];

  // Daily missions
  missions.push(
    createMission("s2-daily-login", "每日登录", "今日登录游戏", 1, 100, "daily", false),
    createMission("s2-daily-match", "每日一战", "完成 1 局任意模式", 1, 150, "daily", false),
    createMission("s2-daily-kills", "每日清剿", "累计击杀 50 个敌人", 50, 150, "daily", false)
  );

  // Weekly missions
  missions.push(
    createMission(
      "s2-weekly-defense",
      "据点坚守者",
      "完成 5 局据点防守",
      5,
      350,
      "weekly",
      true
    ),
    createMission(
      "s2-weekly-mech",
      "机械猎手",
      "累计击杀 200 个机械敌人",
      200,
      300,
      "weekly",
      true
    ),
    createMission(
      "s2-weekly-nodes",
      "节点控制",
      "占领能量节点 30 次",
      30,
      300,
      "weekly",
      true
    ),
    createMission(
      "s2-weekly-elite",
      "精英终结",
      "击杀 20 个精英敌人",
      20,
      400,
      "weekly",
      true
    ),
    createMission(
      "s2-weekly-hero",
      "英雄轮换",
      "使用 3 个不同英雄完成对局",
      3,
      250,
      "weekly",
      true
    ),
    createMission(
      "s2-weekly-damage",
      "火力全开",
      "累计造成 100000 点伤害",
      100000,
      300,
      "weekly",
      true
    )
  );

  // Season missions
  missions.push(
    createMission(
      "s2-season-clear",
      "赛季通关",
      "通关任意难度据点防守 10 次",
      10,
      1000,
      "season",
      false
    ),
    createMission(
      "s2-season-nodes",
      "能量主宰",
      "累计占领能量节点 200 次",
      200,
      800,
      "season",
      false
    ),
    createMission(
      "s2-season-boss",
      "巨像杀手",
      "累计击杀 5 个 Boss 单位",
      5,
      1200,
      "season",
      false
    ),
    createMission(
      "s2-season-maps",
      "地图探索者",
      "在冰封轨道站和生物污染实验室各完成 3 局",
      6,
      600,
      "season",
      false
    )
  );

  return missions;
}

export function addSeasonXp(state: SeasonState, xp: number): SeasonState {
  let currentXp = state.currentXp + xp;
  let currentLevel = state.currentLevel;
  let xpToNext = state.xpToNext;

  while (currentLevel < MAX_SEASON_LEVEL && currentXp >= xpToNext) {
    currentXp -= xpToNext;
    currentLevel++;
    xpToNext = XP_PER_LEVEL + (currentLevel - 1) * 100;
  }

  if (currentLevel >= MAX_SEASON_LEVEL) {
    currentXp = 0;
    xpToNext = 0;
  }

  const rewards = state.rewards.map((r) => ({
    ...r,
    unlocked: r.level <= currentLevel,
  }));

  return {
    ...state,
    currentXp,
    currentLevel,
    xpToNext,
    rewards,
  };
}

export function claimReward(
  state: SeasonState,
  rewardId: string
): { state: SeasonState; reward: SeasonReward | null } {
  let claimedReward: SeasonReward | null = null;
  const rewards = state.rewards.map((r) => {
    if (r.id !== rewardId) return r;
    if (!r.unlocked || r.claimed) return r;
    if (r.premium && !state.premiumUnlocked) return r;
    claimedReward = { ...r, claimed: true };
    return claimedReward;
  });

  return {
    state: { ...state, rewards },
    reward: claimedReward,
  };
}

export function updateMissionProgress(
  state: SeasonState,
  missionId: string,
  delta: number
): { state: SeasonState; gainedXp: number } {
  let gainedXp = 0;
  const missions = state.missions.map((m) => {
    if (m.id !== missionId || m.completed) return m;
    const progress = Math.min(m.target, m.progress + delta);
    const completed = progress >= m.target;
    if (completed) gainedXp += m.xpReward;
    return { ...m, progress, completed };
  });

  return { state: { ...state, missions }, gainedXp };
}

export function unlockPremium(state: SeasonState): SeasonState {
  return { ...state, premiumUnlocked: true };
}

const SEASON_HERO_REWARDS: Record<string, HeroId> = {
  "s2-hero-viper": "viper",
  "s2-hero-falcon": "falcon",
  "s2-hero-bastion": "bastion",
};

export function getUnlockedHeroes(
  baseHeroes: HeroId[] = ["nitrogen", "twilight", "leopard", "recon"],
  state?: SeasonState
): HeroId[] {
  const set = new Set<HeroId>(baseHeroes);
  if (state) {
    for (const reward of state.rewards) {
      if (reward.type === "heroUnlock" && reward.claimed && reward.free) {
        const heroId = SEASON_HERO_REWARDS[reward.id];
        if (heroId) set.add(heroId);
      }
    }
  }
  return Array.from(set);
}

export function getSeasonCurrencyReward(reward: SeasonReward): number {
  if (reward.type !== "currency") return 0;
  if (reward.premium) return reward.level * 4;
  return reward.level * 2;
}

export function generateSeasonShopItems(): SeasonShopItem[] {
  const items: SeasonShopItem[] = [
    {
      id: "s2-shop-skin-wasteland",
      name: "废土行者涂装",
      type: "skin",
      description: "通用武器废土主题皮肤，不影响数值",
      cost: 800,
      available: true,
      unlockLevel: 10,
    },
    {
      id: "s2-shop-skin-rust",
      name: "锈蚀核心涂装",
      type: "skin",
      description: "机械敌人风格武器皮肤",
      cost: 1200,
      available: true,
      unlockLevel: 20,
    },
    {
      id: "s2-shop-skin-ghost",
      name: "轨道幽灵涂装",
      type: "skin",
      description: "冰封轨道站主题武器皮肤",
      cost: 1500,
      available: true,
      unlockLevel: 30,
    },
    {
      id: "s2-shop-skin-bio",
      name: "生物 hazard 涂装",
      type: "skin",
      description: "生物污染实验室主题武器皮肤",
      cost: 1500,
      available: true,
      unlockLevel: 35,
    },
    {
      id: "s2-shop-emote-salute",
      name: "敬礼表情",
      type: "emote",
      description: "局内快捷表情",
      cost: 300,
      available: true,
    },
    {
      id: "s2-shop-emote-taunt",
      name: "挑衅表情",
      type: "emote",
      description: "局内快捷表情",
      cost: 300,
      available: true,
    },
    {
      id: "s2-shop-emote-rally",
      name: "集合表情",
      type: "emote",
      description: "局内快捷表情",
      cost: 400,
      available: true,
      unlockLevel: 15,
    },
    {
      id: "s2-shop-badge-frontline",
      name: "前线老兵徽章",
      type: "badge",
      description: "个人资料展示徽章",
      cost: 500,
      available: true,
      unlockLevel: 15,
    },
    {
      id: "s2-shop-badge-mech",
      name: "机械克星徽章",
      type: "badge",
      description: "个人资料展示徽章",
      cost: 600,
      available: true,
      unlockLevel: 25,
    },
    {
      id: "s2-shop-badge-node",
      name: "节点掌控者徽章",
      type: "badge",
      description: "个人资料展示徽章",
      cost: 600,
      available: true,
      unlockLevel: 30,
    },
    {
      id: "s2-shop-convenience-slot",
      name: "额外存档栏位",
      type: "convenience",
      description: "扩展一个自定义配装存档槽位，不影响对局",
      cost: 600,
      available: true,
    },
    {
      id: "s2-shop-convenience-xp",
      name: "经验加成卡",
      type: "convenience",
      description: "赛季期间获得 10% 额外经验加成，不影响对局数值",
      cost: 1000,
      available: true,
      unlockLevel: 20,
    },
    {
      id: "s2-shop-currency-bundle",
      name: "赛季币礼包",
      type: "currency",
      description: "直接兑换 500 赛季币",
      cost: 0,
      available: false,
    },
  ];
  return items;
}

export function getAvailableShopItems(
  items: SeasonShopItem[],
  seasonLevel: number,
  ownedIds: string[]
): SeasonShopItem[] {
  return items
    .filter((item) => item.available && !ownedIds.includes(item.id))
    .map((item) => ({
      ...item,
      available: (item.unlockLevel ?? 1) <= seasonLevel,
    }));
}

export interface SeasonPurchaseResult {
  success: boolean;
  state: SeasonState;
  ownedIds: string[];
  item: SeasonShopItem | null;
  message: string;
}

export function buySeasonShopItem(
  state: SeasonState,
  item: SeasonShopItem,
  ownedIds: string[]
): SeasonPurchaseResult {
  if (!item.available) {
    return { success: false, state, ownedIds, item, message: "商品当前不可用" };
  }
  if (ownedIds.includes(item.id)) {
    return { success: false, state, ownedIds, item, message: "已拥有该物品" };
  }
  if (state.seasonCurrency < item.cost) {
    return { success: false, state, ownedIds, item, message: "赛季币不足" };
  }
  const unlockLevel = item.unlockLevel ?? 1;
  if (state.currentLevel < unlockLevel) {
    return { success: false, state, ownedIds, item, message: `需要达到 ${unlockLevel} 级` };
  }

  const nextState = { ...state, seasonCurrency: state.seasonCurrency - item.cost };
  const nextOwned = [...ownedIds, item.id];
  return {
    success: true,
    state: nextState,
    ownedIds: nextOwned,
    item,
    message: "购买成功",
  };
}
