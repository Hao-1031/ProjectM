import { useCallback, useEffect, useState } from "react";
import type { AnnouncementRow } from "@/lib/supabase/api";

export interface AnnouncementFilters {
  active?: boolean;
  limit?: number;
}

export interface UseAnnouncementsReturn {
  announcements: AnnouncementRow[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export async function fetchAnnouncements(filters: AnnouncementFilters = {}): Promise<AnnouncementRow[]> {
  const params = new URLSearchParams();
  if (filters.active !== undefined) params.set("active", String(filters.active));
  if (filters.limit) params.set("limit", String(filters.limit));

  const res = await fetch(`/api/announcements?${params.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `公告加载失败 (${res.status})`);
  }
  const json = await res.json();
  return json.data ?? [];
}

export async function createAnnouncement(
  announcement: Omit<AnnouncementRow, "id" | "created_at">,
  adminKey: string
): Promise<AnnouncementRow> {
  const res = await fetch("/api/announcements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminKey}`,
    },
    body: JSON.stringify(announcement),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `创建失败 (${res.status})`);
  }

  return res.json();
}

export async function updateAnnouncement(
  id: string,
  announcement: Omit<AnnouncementRow, "id" | "created_at">,
  adminKey: string
): Promise<AnnouncementRow> {
  const res = await fetch("/api/announcements", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminKey}`,
    },
    body: JSON.stringify({ id, ...announcement }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `更新失败 (${res.status})`);
  }

  return res.json();
}

export async function deleteAnnouncement(id: string, adminKey: string): Promise<void> {
  const res = await fetch(`/api/announcements?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${adminKey}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `删除失败 (${res.status})`);
  }
}

export function useAnnouncements(filters: AnnouncementFilters = {}): UseAnnouncementsReturn {
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAnnouncements(filters)
      .then(setAnnouncements)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [filters.active, filters.limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { announcements, loading, error, refetch };
}
