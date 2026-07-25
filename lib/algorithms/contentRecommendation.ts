export interface ContentItem {
  id: string;
  title: string;
  tags: string[];
  createdAt: number;
  likes: number;
  views: number;
}

export interface UserInterest {
  tag: string;
  weight: number;
}

export interface RankedContent {
  item: ContentItem;
  score: number;
  reason: string;
}

export function rankContent(
  items: ContentItem[],
  userInterests: UserInterest[],
  options: { now?: number; explorationRate?: number } = {}
): RankedContent[] {
  const { now = Date.now(), explorationRate = 0.15 } = options;
  const interestMap = new Map(userInterests.map((i) => [i.tag, i.weight]));

  const ranked = items.map((item) => {
    const ageHours = Math.max(1, (now - item.createdAt) / 3600000);

    // 内容热度：防止刷量，使用 log 压缩
    const engagement =
      Math.log1p(item.likes) * 2 + Math.log1p(item.views) * 0.5;

    // 个性化相关分
    let relevance = 0;
    let matchedTag = "";
    for (const tag of item.tags) {
      const weight = interestMap.get(tag) ?? 0;
      if (weight > relevance) {
        relevance = weight;
        matchedTag = tag;
      }
    }

    // 新鲜度衰减：24 小时内高分，7 天后显著衰减
    const freshness = Math.max(0, 1 - Math.log(ageHours / 24 + 1) / 3);

    // 冷启动探索：给低观看内容固定加分
    const isCold = item.views < 50;
    const explorationBonus = isCold ? explorationRate * 10 : 0;

    const score = relevance * 40 + engagement * 3 + freshness * 20 + explorationBonus;

    let reason = "综合热度与新鲜度";
    if (relevance > 0.3) {
      reason = `匹配你的兴趣：${matchedTag}`;
    } else if (freshness > 0.7) {
      reason = "最新发布";
    } else if (isCold) {
      reason = "新作品探索";
    }

    return { item, score: round2(score), reason };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
