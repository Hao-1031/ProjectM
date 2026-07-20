import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  isSupabaseConfigured,
  validateAnnouncement,
  parsePostgrestError,
  type AnnouncementRow,
  type ApiError,
} from "@/lib/supabase/api";

export interface AnnouncementListResponse {
  data: AnnouncementRow[];
}

const ADMIN_KEY = process.env.ADMIN_KEY;

function isAdmin(req: NextApiRequest): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  return authHeader.slice(7) === ADMIN_KEY;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnnouncementListResponse | AnnouncementRow | ApiError>
) {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ message: "Supabase 未配置，公告功能不可用" });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (req.method === "GET") {
    const activeOnly = req.query.active !== "false";
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    let query = supabase.from("announcements").select("*").order("priority", { ascending: false }).limit(limit);

    if (activeOnly) {
      query = query.eq("active", true);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json(parsePostgrestError(error));
    }

    return res.status(200).json({ data: data ?? [] });
  }

  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    if (!ADMIN_KEY) {
      return res.status(503).json({ message: "管理员功能未配置" });
    }
    if (!isAdmin(req)) {
      return res.status(401).json({ message: "未授权访问" });
    }
  }

  if (req.method === "POST") {
    const validation = validateAnnouncement(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    const { data, error } = await supabase.from("announcements").insert(validation.announcement).select().single();

    if (error) {
      return res.status(500).json(parsePostgrestError(error));
    }

    return res.status(201).json(data);
  }

  if (req.method === "PUT") {
    const id = typeof req.body.id === "string" ? req.body.id : undefined;
    if (!id) {
      return res.status(400).json({ message: "缺少公告 ID" });
    }

    const validation = validateAnnouncement(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    const { data, error } = await supabase
      .from("announcements")
      .update({
        title: validation.announcement.title,
        content: validation.announcement.content,
        active: validation.announcement.active,
        priority: validation.announcement.priority,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json(parsePostgrestError(error));
    }

    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const id = typeof req.query.id === "string" ? req.query.id : undefined;
    if (!id) {
      return res.status(400).json({ message: "缺少公告 ID" });
    }

    const { error } = await supabase.from("announcements").delete().eq("id", id);

    if (error) {
      return res.status(500).json(parsePostgrestError(error));
    }

    return res.status(204).end();
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  return res.status(405).json({ message: "方法不允许" });
}
