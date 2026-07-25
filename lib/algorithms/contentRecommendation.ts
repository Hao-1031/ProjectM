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
  options: { now?: number; explorationRate?: number; diversityPenalty?: number } = {}
): RankedContent[] {
  const { now = Date.now(), explorationRate = 0.15, diversityPenalty = 0.08 } = options;
  const interestMap = new Map(userInterests.map((i) => [i.tag, i.weight]));

  const scored = items.map((item) => {
    const ageHours = Math.max(1, (now - item.createdAt) / 3600000);

    // 内容热度：防止刷量，使用 log 压缩
    const engagement = Math.log1p(item.likes) * 2 + Math.log1p(item.views) * 0.5;

    // 个性化相关分：取最高权重标签，并累加次要标签的一半权重
    let relevance = 0;
    let matchedTag = "";
    const tagWeights = item.tags
      .map((tag) => ({ tag, weight: interestMap.get(tag) ?? 0 }))
      .sort((a, b) => b.weight - a.weight);

    if (tagWeights.length > 0) {
      relevance = tagWeights[0].weight;
      matchedTag = tagWeights[0].tag;
      // 次要标签提供额外 30% 加成
      relevance += tagWeights.slice(1).reduce((sum, t) => sum + t.weight * 0.3, 0);
      relevance = clamp(relevance, 0, 1.5);
    }

    // 新鲜度衰减：24 小时内高分，7 天后显著衰减
    const freshness = Math.max(0, 1 - Math.log(ageHours / 24 + 1) / 3);

    // 冷启动探索：给低观看内容固定加分
    const isCold = item.views < 50;
    const explorationBonus = isCold ? explorationRate * 25 : 0;

    // 提高新鲜度与探索分权重，避免高热老内容持续霸榜
    const score = relevance * 45 + engagement * 1.2 + freshness * 30 + explorationBonus * 1.5;

    let reason = "综合热度与新鲜度";
    if (relevance > 0.3) {
      reason = `匹配你的兴趣：${matchedTag}`;
    } else if (freshness > 0.7) {
      reason = "最新发布";
    } else if (isCold) {
      reason = "新作品探索";
    }

    return { item, rawScore: score, reason };
  });

  // 多样性惩罚：相邻内容标签重叠度过高时，降低后续相似内容分数
  const tagFrequency = new Map<string, number>();
  const ranked: RankedContent[] = [];

  scored.sort((a, b) => b.rawScore - a.rawScore);

  for (const entry of scored) {
    let overlapPenalty = 0;
    for (const tag of entry.item.tags) {
      const count = tagFrequency.get(tag) ?? 0;
      overlapPenalty += count * diversityPenalty * 10;
      tagFrequency.set(tag, count + 1);
    }

    const finalScore = clamp(entry.rawScore - overlapPenalty, 0, 200);
    ranked.push({ item: entry.item, score: round2(finalScore), reason: entry.reason });
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
