import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/supabase/server";
import { createCookieStore } from "@/lib/auth/cookies";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "方法不允许" });
  }

  try {
    const cookieStore = createCookieStore(req.cookies);
    const supabase = createClient(cookieStore);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host}`;
    const nextPath = typeof req.query.next === "string" ? req.query.next : "/";
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
