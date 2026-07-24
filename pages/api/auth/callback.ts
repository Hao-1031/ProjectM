import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/supabase/server";
import { createCookieStore } from "@/lib/auth/cookies";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "方法不允许" });
  }

  const { code } = req.query;
  const next = typeof req.query.next === "string" ? req.query.next : "/";

  if (typeof code !== "string") {
    return res.status(400).json({ error: "缺少授权码" });
  }

  try {
    const cookieStore = createCookieStore(req.cookies);
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Supabase OAuth 回调处理失败:", error);
      return res.redirect(302, `/?auth_error=${encodeURIComponent("登录失败，请重试")}`);
    }

    const setCookies = cookieStore.getSetCookieHeaders();
    if (setCookies.length > 0) {
      res.setHeader("Set-Cookie", setCookies);
    }

    return res.redirect(302, next);
  } catch (err) {
    console.error("OAuth 回调异常:", err);
    return res.redirect(302, `/?auth_error=${encodeURIComponent("登录失败，请重试")}`);
  }
}
