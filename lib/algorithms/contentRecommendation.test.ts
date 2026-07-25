import { describe, it, expect } from "vitest";
import { rankContent } from "./contentRecommendation";

const now = Date.now();

describe("UGC 内容推荐", () => {
  it("匹配用户兴趣的内容排名更高", () => {
    const items = [
      { id: "1", title: "狙击攻略", tags: ["sniper"], createdAt: now - 3600000, likes: 10, views: 200 },
      { id: "2", title: "坦克攻略", tags: ["tank"], createdAt: now - 3600000, likes: 10, views: 200 },
    ];
    const ranked = rankContent(items, [{ tag: "sniper", weight: 0.9 }]);
    expect(ranked[0].item.id).toBe("1");
  });

  it("新鲜内容获得加成", () => {
    const items = [
      { id: "old", title: "旧内容", tags: ["sniper"], createdAt: now - 86400000 * 10, likes: 100, views: 1000 },
      { id: "new", title: "新内容", tags: ["sniper"], createdAt: now - 3600000, likes: 5, views: 30 },
    ];
    const ranked = rankContent(items, [{ tag: "sniper", weight: 0.5 }]);
    expect(ranked[0].item.id).toBe("new");
  });

  it("冷启动内容有探索分", () => {
    const items = [
      { id: "cold", title: "冷启动", tags: ["unknown"], createdAt: now - 3600000, likes: 0, views: 0 },
      { id: "hot", title: "热门", tags: ["unknown"], createdAt: now - 3600000, likes: 100, views: 1000 },
    ];
    const ranked = rankContent(items, [], { explorationRate: 0.5 });
    expect(ranked[0].item.id).toBe("cold");
  });
});
