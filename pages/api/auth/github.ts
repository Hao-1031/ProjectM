import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/supabase/server";
import { createCookieStore } from "@/lib/auth/cookies";
import { applySecurityHeaders } from "@/lib/auth/security";
import { getRequestBaseUrl } from "@/lib/utils";

function sanitizeRedirectPath(raw: string): string {
  if (!raw || raw === "/") return "/";
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith("//") || decoded.startsWith("\\\\")) return "/";
    if (/^https?:/i.test(decoded)) return "/";
    if (!decoded.startsWith("/")) return "/";
    return decoded;
  } catch {
    return "/";
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applySecurityHeaders(res);
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "方法不允许" });
  }

  try {
    const cookieStore = createCookieStore(req.cookies);
    const supabase = createClient(cookieStore);
    const baseUrl = getRequestBaseUrl(req);
    const nextPath = sanitizeRedirectPath(typeof req.query.next === "string" ? req.query.next : "/");
    const callbackUrl = new URL("/api/auth/callback", baseUrl);
    callbackUrl.searchParams.set("next", nextPath);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error || !data.url) {
      console.error("GitHub OAuth 初始化失败:", error);
      return res.status(500).json({ error: "OAuth 初始化失败" });
    }

    const setCookies = cookieStore.getSetCookieHeaders();
    if (setCookies.length > 0) {
      res.setHeader("Set-Cookie", setCookies);
    }

    return res.redirect(302, data.url);
  } catch (err) {
    console.error("GitHub OAuth 异常:", err);
    return res.status(500).json({ error: "服务器内部错误" });
  }
}