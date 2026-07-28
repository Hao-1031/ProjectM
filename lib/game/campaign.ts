import type { GameModeType, BossId } from "./types";

export type CampaignNodeType = "story" | "battle" | "boss" | "reward" | "shop";

export interface CampaignNode {
  id: string;
  type: CampaignNodeType;
  title: string;
  description: string;
  mode: GameModeType;
  /** For boss nodes: which boss to fight */
  bossId?: BossId;
  /** For story nodes: narrative content */
  storyContent?: string;
  /** For reward nodes: currency reward amount */
  rewardCoins?: number;
  rewardSeasonCurrency?: number;
  /** Unlock requirements */
  requiresNodeIds?: string[];
  /** Position on campaign map */
  position: { x: number; y: number };
}

export interface CampaignChapter {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  /** Chapter theme color */
  accentColor: string;
  /** Nodes in this chapter */
  nodes: CampaignNode[];
  /** Chapter completion reward */
  completionReward: {
    coins: number;
    seasonCurrency: number;
    unlocks?: string[];
  };
  /** Story intro displayed when chapter starts */
  intro: string;
  /** Story outro displayed when chapter completes */
  outro: string;
  /** Dimension name for this chapter */
  dimension: string;
}

export interface CampaignProgress {
  completedNodes: string[];
  currentNodeId: string;
  currentChapterId: string;
  chaptersCompleted: string[];
  totalPlayTime: number;
}

export const CAMPAIGN_CHAPTERS: CampaignChapter[] = [
  {
    id: "chapter-1",
    name: "第一章",
    subtitle: "锚点觉醒",
    description: "维度裂痕首次出现，幸存者基地建立。你作为新兵被征召，学习基础战斗技巧。",
    accentColor: "var(--primary)",
    dimension: "原点维度",
    intro: "公元2147年，维度屏障首次出现裂痕。来自未知维度的生物涌入我们的世界，人类文明在三天内崩溃。幸存者聚集在最后一个锚点周围，建立了基地。你，一名普通的幸存者，被征召加入防御部队。",
    outro: "你成功抵御了第一波入侵，证明了自己的价值。但锚点传感器显示，更强大的维度波动正在靠近。真正的战斗才刚刚开始。",
    nodes: [
      {
        id: "ch1-story-1",
        type: "story",
        title: "觉醒",
        description: "维度裂痕开启，世界陷入混乱",
        mode: "campaign",
        storyContent: "警报声撕裂了寂静的夜空。你从废墟中醒来，头顶的天空裂开了一道诡异的蓝色裂缝。从裂缝中涌出的生物不同于你见过的任何东西 - 它们由纯粹的能量构成，散发着不祥的量子光芒。",
        position: { x: 10, y: 50 },
      },
      {
        id: "ch1-battle-1",
        type: "battle",
        title: "初次接触",
        description: "在废墟中对抗第一批入侵者",
        mode: "campaign",
        requiresNodeIds: ["ch1-story-1"],
        position: { x: 25, y: 40 },
      },
      {
        id: "ch1-story-2",
        type: "story",
        title: "幸存者",
        description: "与其他幸存者汇合，建立防线",
        mode: "campaign",
        storyContent: "你在废墟中遇到了其他幸存者。他们中有工程师、医生和前军人。一个名叫「锚点」的装置被激活，周围的维度能量开始稳定。这是人类最后的希望。",
        requiresNodeIds: ["ch1-battle-1"],
        position: { x: 40, y: 55 },
      },
      {
        id: "ch1-reward-1",
        type: "reward",
        title: "补给箱",
        description: "在废墟中找到的物资",
        mode: "campaign",
        rewardCoins: 500,
        rewardSeasonCurrency: 50,
        requiresNodeIds: ["ch1-story-2"],
        position: { x: 45, y: 35 },
      },
      {
        id: "ch1-battle-2",
        type: "battle",
        title: "防线",
        description: "保卫幸存者营地，抵御第二波攻击",
        mode: "defense",
        requiresNodeIds: ["ch1-reward-1"],
        position: { x: 60, y: 45 },
      },
      {
        id: "ch1-boss-1",
        type: "boss",
        title: "维度哨兵",
        description: "击败第一道维度裂痕的守护者",
        mode: "defense",
        bossId: "lancer",
        requiresNodeIds: ["ch1-battle-2"],
        position: { x: 80, y: 50 },
      },
    ],
    completionReward: {
      coins: 2000,
      seasonCurrency: 200,
      unlocks: ["shotgun", "laser"],
    },
  },
  {
    id: "chapter-2",
    name: "第二章",
    subtitle: "熵增蔓延",
    description: "维度侵蚀加速，熵能污染蔓延。探索废弃城市，寻找抑制熵增的古代技术。",
    accentColor: "var(--entropy)",
    dimension: "熵增维度",
    intro: "锚点稳定后，你发现维度裂痕并非随机出现。它们遵循某种古老的模式，指向一个被称为「熵增维度」的领域。在那里，一切都在加速衰败。你们必须找到抑制熵增的技术，否则锚点将在72小时内崩溃。",
    outro: "你成功获取了熵增抑制器，锚点暂时稳定。但代价是惨重的 - 熵增维度的主宰者「熵之主」已经注意到了你们的存在。它在等待，等待下一次裂痕出现。",
    nodes: [
      {
        id: "ch2-story-1",
        type: "story",
        title: "衰败",
        description: "锚点开始不稳定，熵能污染扩散",
        mode: "campaign",
        storyContent: "锚点发出刺耳的警报。传感器显示周围的维度能量正在以指数级增长。熵增 - 一种加速衰败的能量 - 正在侵蚀锚点周围的区域。如果不加以抑制，整个基地将在三天内瓦解。",
        requiresNodeIds: ["ch1-boss-1"],
        position: { x: 15, y: 48 },
      },
      {
        id: "ch2-battle-1",
        type: "battle",
        title: "污染区",
        description: "穿越熵能污染区，寻找古代实验室",
        mode: "survival",
        requiresNodeIds: ["ch2-story-1"],
        position: { x: 30, y: 40 },
      },
      {
        id: "ch2-shop-1",
        type: "shop",
        title: "地下黑市",
        description: "在废弃地铁站发现的地下交易站",
        mode: "campaign",
        rewardCoins: 300,
        requiresNodeIds: ["ch2-battle-1"],
        position: { x: 35, y: 55 },
      },
      {
        id: "ch2-battle-2",
        type: "battle",
        title: "实验室守卫",
        description: "古代实验室外围的自动防御系统",
        mode: "defense",
        requiresNodeIds: ["ch2-shop-1"],
        position: { x: 50, y: 45 },
      },
      {
        id: "ch2-story-2",
        type: "story",
        title: "发现",
        description: "在实验室中找到熵增抑制器的蓝图",
        mode: "campaign",
        storyContent: "实验室的深处，你发现了一台古老的设备。全息屏幕上显示着「熵增抑制器」的蓝图。这是前文明时代的研究成果，专门用于对抗维度侵蚀。但制造它需要从熵增维度核心获取稀有材料。",
        requiresNodeIds: ["ch2-battle-2"],
        position: { x: 60, y: 52 },
      },
      {
        id: "ch2-boss-1",
        type: "boss",
        title: "熵增核心",
        description: "进入熵增维度核心，获取稀有材料",
        mode: "endless",
        bossId: "titan",
        requiresNodeIds: ["ch2-story-2"],
        position: { x: 80, y: 48 },
      },
    ],
    completionReward: {
      coins: 3500,
      seasonCurrency: 350,
      unlocks: ["railgun", "nitrogen"],
    },
  },
  {
    id: "chapter-3",
    name: "第三章",
    subtitle: "量子深渊",
    description: "维度间出现量子纠缠现象。深入量子深渊，揭开维度裂痕背后的真相。",
    accentColor: "var(--quantum)",
    dimension: "量子维度",
    intro: "熵增抑制器启动后，锚点传感器检测到了一种全新的维度信号 - 量子纠缠。多个维度开始同时与原点维度产生联系。这不是随机事件，而是有人在幕后操纵。量子深渊的入口已经打开。",
    outro: "你在量子深渊的核心发现了真相：维度裂痕是古代文明「先驱者」的实验失控产物。他们试图创造无限能源，却撕裂了维度屏障。现在，你必须决定是关闭所有裂痕，还是尝试控制这种力量。",
    nodes: [
      {
        id: "ch3-story-1",
        type: "story",
        title: "量子信号",
        description: "锚点接收到来自多个维度的量子信号",
        mode: "campaign",
        storyContent: "锚点的控制面板上，量子信号如潮水般涌来。七个不同的维度同时向原点维度发送信号。这不是自然现象 - 这些信号带有明确的人工编码模式。有人，或者有什么东西，在试图与你们建立联系。",
        requiresNodeIds: ["ch2-boss-1"],
        position: { x: 12, y: 50 },
      },
      {
        id: "ch3-battle-1",
        type: "battle",
        title: "量子风暴",
        description: "在量子风暴中生存，追踪信号源",
        mode: "extreme-survival",
        requiresNodeIds: ["ch3-story-1"],
        position: { x: 28, y: 42 },
      },
      {
        id: "ch3-reward-1",
        type: "reward",
        title: "先驱者遗物",
        description: "在量子风暴中发现的古代科技",
        mode: "campaign",
        rewardCoins: 800,
        rewardSeasonCurrency: 80,
        requiresNodeIds: ["ch3-battle-1"],
        position: { x: 32, y: 58 },
      },
      {
        id: "ch3-battle-2",
        type: "battle",
        title: "量子守卫",
        description: "击败量子维度的自动防御系统",
        mode: "defense",
        requiresNodeIds: ["ch3-reward-1"],
        position: { x: 48, y: 45 },
      },
      {
        id: "ch3-story-2",
        type: "story",
        title: "真相",
        description: "在量子深渊核心发现先驱者的记录",
        mode: "campaign",
        storyContent: "核心控制台显示了一段全息录像。先驱者 - 一个高度发达的古代文明 - 试图创造无限的维度能量。但实验失控，维度屏障被撕裂。他们留下了抑制装置，但需要有人从每个维度核心收集能量水晶来激活它。",
        requiresNodeIds: ["ch3-battle-2"],
        position: { x: 62, y: 50 },
      },
      {
        id: "ch3-boss-1",
        type: "boss",
        title: "量子之主",
        description: "量子维度的守护者，先驱者AI的化身",
        mode: "roguelike",
        bossId: "phantom",
        requiresNodeIds: ["ch3-story-2"],
        position: { x: 82, y: 48 },
      },
    ],
    completionReward: {
      coins: 5000,
      seasonCurrency: 500,
      unlocks: ["plasmaBlade", "falcon"],
    },
  },
];

export function getChapterById(id: string): CampaignChapter | undefined {
  return CAMPAIGN_CHAPTERS.find((c) => c.id === id);
}

export function getNodeById(chapterId: string, nodeId: string): CampaignNode | undefined {
  const chapter = getChapterById(chapterId);
  return chapter?.nodes.find((n) => n.id === nodeId);
}

export function getNextUnlockedNode(
  chapter: CampaignChapter,
  progress: CampaignProgress,
): CampaignNode | null {
  for (const node of chapter.nodes) {
    if (progress.completedNodes.includes(node.id)) continue;
    if (!node.requiresNodeIds || node.requiresNodeIds.length === 0) {
      return node;
    }
    const allReqMet = node.requiresNodeIds.every((rid) => progress.completedNodes.includes(rid));
    if (allReqMet) return node;
  }
  return null;
}

export function isNodeUnlocked(
  node: CampaignNode,
  chapter: CampaignChapter,
  progress: CampaignProgress,
): boolean {
  if (progress.completedNodes.includes(node.id)) return true;
  if (!node.requiresNodeIds || node.requiresNodeIds.length === 0) return true;
  return node.requiresNodeIds.every((rid) => progress.completedNodes.includes(rid));
}

export function isChapterComplete(
  chapter: CampaignChapter,
  progress: CampaignProgress,
): boolean {
  return chapter.nodes.every((n) => progress.completedNodes.includes(n.id));
}

export function getChapterProgress(
  chapter: CampaignChapter,
  progress: CampaignProgress,
): number {
  const completed = chapter.nodes.filter((n) => progress.completedNodes.includes(n.id)).length;
  return Math.round((completed / chapter.nodes.length) * 100);
}

export function canStartChapter(
  chapter: CampaignChapter,
  progress: CampaignProgress,
): boolean {
  const idx = CAMPAIGN_CHAPTERS.findIndex((c) => c.id === chapter.id);
  if (idx === 0) return true;
  const prevChapter = CAMPAIGN_CHAPTERS[idx - 1];
  return isChapterComplete(prevChapter, progress);
}

export const DEFAULT_CAMPAIGN_PROGRESS: CampaignProgress = {
  completedNodes: [],
  currentNodeId: "ch1-story-1",
  currentChapterId: "chapter-1",
  chaptersCompleted: [],
  totalPlayTime: 0,
};