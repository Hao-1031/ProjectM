import { useCallback, useEffect, useState } from "react";
import type { LeaderboardRow } from "@/lib/supabase/api";

export interface LeaderboardFilters {
  mode?: string;
  limit?: number;
}

export interface UseLeaderboardReturn {
  entries: LeaderboardRow[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export async function fetchLeaderboard(filters: LeaderboardFilters = {}): Promise<LeaderboardRow[]> {
  const params = new URLSearchParams();
  if (filters.mode) params.set("mode", filters.mode);
  if (filters.limit) params.set("limit", String(filters.limit));

  const res = await fetch(`/api/leaderboard?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `排行榜加载失败 (${res.status})`);
  }
  const json = await res.json();
  return json.data ?? [];
}

export async function submitLeaderboardEntry(entry: {
  player_name: string;
  mode: string;
  kills: number;
  waves: number;
  score: number;
  duration: number;
}): Promise<{ id: string; rank?: number }> {
  const res = await fetch("/api/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `提交失败 (${res.status})`);
  }

  return res.json();
}

export function useLeaderboard(filters: LeaderboardFilters = {}): UseLeaderboardReturn {
  const [entries, setEntries] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchLeaderboard(filters)
      .then(setEntries)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [filters.mode, filters.limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { entries, loading, error, refetch };
}
