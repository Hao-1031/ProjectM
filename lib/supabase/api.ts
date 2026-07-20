import type { PostgrestError } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type LeaderboardRow = Database["public"]["Tables"]["leaderboard"]["Row"];
export type LeaderboardInsert = Database["public"]["Tables"]["leaderboard"]["Insert"];
export type AnnouncementRow = Database["public"]["Tables"]["announcements"]["Row"];
export type AnnouncementInsert = Database["public"]["Tables"]["announcements"]["Insert"];

export interface ApiError {
  message: string;
  code?: string;
}

export function parsePostgrestError(error: PostgrestError): ApiError {
  return {
    message: error.message || "数据库操作失败",
    code: error.code,
  };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function validateLeaderboardEntry(data: unknown): { valid: false; error: string } | { valid: true; entry: LeaderboardInsert } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "提交数据格式错误" };
  }

  const entry = data as Record<string, unknown>;

  if (typeof entry.player_name !== "string" || entry.player_name.trim().length < 1 || entry.player_name.trim().length > 32) {
    return { valid: false, error: "玩家名称长度应为 1-32 个字符" };
  }

  const validModes = ["campaign", "endless", "daily", "roguelike", "defense", "deathmatch", "survival"];
  if (typeof entry.mode !== "string" || !validModes.includes(entry.mode)) {
    return { valid: false, error: "游戏模式无效" };
  }

  const kills = typeof entry.kills === "number" ? entry.kills : Number(entry.kills);
  const waves = typeof entry.waves === "number" ? entry.waves : Number(entry.waves);
  const score = typeof entry.score === "number" ? entry.score : Number(entry.score);
  const duration = typeof entry.duration === "number" ? entry.duration : Number(entry.duration);

  if (!Number.isFinite(kills) || kills < 0 || kills > 999999) {
    return { valid: false, error: "击杀数无效" };
  }
  if (!Number.isFinite(waves) || waves < 0 || waves > 999999) {
    return { valid: false, error: "波次数无效" };
  }
  if (!Number.isFinite(score) || score < 0 || score > 99999999) {
    return { valid: false, error: "分数无效" };
  }
  if (!Number.isFinite(duration) || duration < 0 || duration > 86400) {
    return { valid: false, error: "时长无效" };
  }

  return {
    valid: true,
    entry: {
      player_name: entry.player_name.trim(),
      mode: entry.mode,
      kills: Math.floor(kills),
      waves: Math.floor(waves),
      score: Math.floor(score),
      duration: Math.floor(duration),
    },
  };
}

export function validateAnnouncement(data: unknown): { valid: false; error: string } | { valid: true; announcement: AnnouncementInsert } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "公告数据格式错误" };
  }

  const entry = data as Record<string, unknown>;

  if (typeof entry.title !== "string" || entry.title.trim().length < 1 || entry.title.trim().length > 120) {
    return { valid: false, error: "标题长度应为 1-120 个字符" };
  }

  if (typeof entry.content !== "string" || entry.content.trim().length < 1 || entry.content.trim().length > 4000) {
    return { valid: false, error: "内容长度应为 1-4000 个字符" };
  }

  const priority = typeof entry.priority === "number" ? entry.priority : Number(entry.priority ?? 0);
  if (!Number.isFinite(priority) || priority < 0 || priority > 100) {
    return { valid: false, error: "优先级应为 0-100 之间的数字" };
  }

  return {
    valid: true,
    announcement: {
      title: entry.title.trim(),
      content: entry.content.trim(),
      active: entry.active === true,
      priority: Math.floor(priority),
    },
  };
}
