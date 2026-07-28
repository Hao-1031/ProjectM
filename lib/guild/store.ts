import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Guild, GuildMember, GuildPerk, Friend, FriendRequest, GuildChatMessage } from "./types";
import { DEFAULT_GUILD } from "./types";

interface GuildState {
  guild: Guild | null;
  friends: Friend[];
  friendRequests: FriendRequest[];
  chatMessages: GuildChatMessage[];

  createGuild: (name: string, tag: string, description: string) => void;
  joinGuild: (guildId: string) => void;
  leaveGuild: () => void;
  upgradePerk: (perkId: string) => void;
  addContribution: (amount: number) => void;
  addExp: (amount: number) => void;

  addFriend: (friend: Friend) => void;
  removeFriend: (friendId: string) => void;
  sendFriendRequest: (request: FriendRequest) => void;
  acceptFriendRequest: (requestId: string) => void;
  declineFriendRequest: (requestId: string) => void;

  sendChatMessage: (message: GuildChatMessage) => void;
  clearChat: () => void;
}

export const useGuildStore = create<GuildState>()(
  persist(
    (set, get) => ({
      guild: null,
      friends: [],
      friendRequests: [],
      chatMessages: [],

      createGuild: (name, tag, description) => {
        const guild: Guild = {
          ...DEFAULT_GUILD,
          id: `guild_${Date.now()}`,
          name,
          tag,
          description,
          memberCount: 1,
          members: [
            {
              id: "self",
              name: "你",
              role: "leader",
              avatarUrl: null,
              joinedAt: Date.now(),
              contribution: 0,
              rank: "维度行者",
            },
          ],
          createdAt: Date.now(),
        };
        set({ guild });
      },

      joinGuild: (guildId) => {
        const state = get();
        if (!state.guild) return;
        set({
          guild: {
            ...state.guild,
            memberCount: state.guild.memberCount + 1,
          },
        });
      },

      leaveGuild: () => {
        set({ guild: null, chatMessages: [] });
      },

      upgradePerk: (perkId) => {
        const state = get();
        if (!state.guild) return;
        const perks = state.guild.perks.map((p) =>
          p.id === perkId && p.level < p.maxLevel
            ? { ...p, level: p.level + 1, unlocked: true }
            : p
        );
        set({ guild: { ...state.guild, perks } });
      },

      addContribution: (amount) => {
        const state = get();
        if (!state.guild) return;
        const members = state.guild.members.map((m) =>
          m.id === "self" ? { ...m, contribution: m.contribution + amount } : m
        );
        set({ guild: { ...state.guild, members } });
      },

      addExp: (amount) => {
        const state = get();
        if (!state.guild) return;
        let { exp, expToNext, level } = state.guild;
        exp += amount;
        while (exp >= expToNext) {
          exp -= expToNext;
          level += 1;
          expToNext = Math.floor(expToNext * 1.5);
        }
        set({ guild: { ...state.guild, exp, expToNext, level } });
      },

      addFriend: (friend) => {
        set((s) => ({ friends: [...s.friends, friend] }));
      },

      removeFriend: (friendId) => {
        set((s) => ({ friends: s.friends.filter((f) => f.id !== friendId) }));
      },

      sendFriendRequest: (request) => {
        set((s) => ({ friendRequests: [...s.friendRequests, request] }));
      },

      acceptFriendRequest: (requestId) => {
        set((s) => ({
          friendRequests: s.friendRequests.map((r) =>
            r.id === requestId ? { ...r, status: "accepted" as const } : r
          ),
        }));
      },

      declineFriendRequest: (requestId) => {
        set((s) => ({
          friendRequests: s.friendRequests.map((r) =>
            r.id === requestId ? { ...r, status: "declined" as const } : r
          ),
        }));
      },

      sendChatMessage: (message) => {
        set((s) => ({ chatMessages: [...s.chatMessages.slice(-99), message] }));
      },

      clearChat: () => {
        set({ chatMessages: [] });
      },
    }),
    {
      name: "project-m-guild",
      partialize: (state) => ({
        guild: state.guild,
        friends: state.friends,
        friendRequests: state.friendRequests,
      }),
    }
  )
);