export interface GuildMember {
  id: string;
  name: string;
  role: "leader" | "officer" | "member";
  avatarUrl: string | null;
  joinedAt: number;
  contribution: number;
  rank: string;
}

export interface GuildPerk {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cost: number;
  unlocked: boolean;
}

export interface Guild {
  id: string;
  name: string;
  tag: string;
  description: string;
  level: number;
  exp: number;
  expToNext: number;
  memberCount: number;
  maxMembers: number;
  anchorStability: number;
  members: GuildMember[];
  perks: GuildPerk[];
  createdAt: number;
  logo: string | null;
}

export interface GuildApplication {
  id: string;
  playerName: string;
  message: string;
  submittedAt: number;
}

export interface GuildChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
}

export interface Friend {
  id: string;
  name: string;
  avatarUrl: string | null;
  status: "online" | "offline" | "in-game";
  lastSeen: number;
  guildTag: string | null;
}

export const GUILD_PERKS: Omit<GuildPerk, "level" | "unlocked">[] = [
  {
    id: "xp_boost",
    name: "经验加成",
    description: "所有成员获得额外经验值加成",
    maxLevel: 5,
    cost: 100,
  },
  {
    id: "anchor_buff",
    name: "锚点强化",
    description: "锚点初始耐久度提升",
    maxLevel: 5,
    cost: 150,
  },
  {
    id: "member_slots",
    name: "成员扩容",
    description: "公会最大成员数增加",
    maxLevel: 10,
    cost: 200,
  },
  {
    id: "coin_boost",
    name: "碎片加成",
    description: "所有成员获得额外锚点碎片",
    maxLevel: 5,
    cost: 120,
  },
  {
    id: "wave_skip",
    name: "波次跳跃",
    description: "可以跳过已完成的低难度波次",
    maxLevel: 3,
    cost: 300,
  },
];

export const DEFAULT_GUILD: Guild = {
  id: "",
  name: "",
  tag: "",
  description: "",
  level: 1,
  exp: 0,
  expToNext: 100,
  memberCount: 0,
  maxMembers: 10,
  anchorStability: 0,
  members: [],
  perks: GUILD_PERKS.map((p) => ({ ...p, level: 0, unlocked: false })),
  createdAt: 0,
  logo: null,
};