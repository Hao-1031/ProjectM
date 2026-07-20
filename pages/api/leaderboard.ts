import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  isSupabaseConfigured,
  validateLeaderboardEntry,
  parsePostgrestError,
  type LeaderboardRow,
  type ApiError,
} from "@/lib/supabase/api";

export interface LeaderboardListResponse {
  data: LeaderboardRow[];
}

export interface LeaderboardSubmitResponse {
  id: string;
  rank?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LeaderboardListResponse | LeaderboardSubmitResponse | ApiError>
) {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ message: "Supabase 未配置，排行榜功能不可用" });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (req.method === "GET") {
    const mode = typeof req.query.mode === "string" ? req.query.mode : undefined;
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

    let query = supabase
      .from("leaderboard")
      .select("*")
      .order("score", { ascending: false })
      .limit(limit);

    if (mode) {
      query = query.eq("mode", mode);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json(parsePostgrestError(error));
    }

    return res.status(200).json({ data: data ?? [] });
  }

  if (req.method === "POST") {
    const validation = validateLeaderboardEntry(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    const { data, error } = await supabase.from("leaderboard").insert(validation.entry).select().single();

    if (error) {
      return res.status(500).json(parsePostgrestError(error));
    }

    const { count } = await supabase
      .from("leaderboard")
      .select("*", { count: "exact", head: true })
      .gte("score", data.score);

    return res.status(201).json({ id: data.id, rank: count ?? undefined });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: "方法不允许" });
}
