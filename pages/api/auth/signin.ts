import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/supabase/server";
import { createCookieStore } from "@/lib/auth/cookies";
import { getSessionFromClient } from "@/lib/auth/session";
import { rateLimiter } from "@/lib/auth/rate-limiter";
import { applySecurityHeaders, validateAuthBody } from "@/lib/auth/security";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applySecurityHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "方法不允许" });
  }

  const bodyError = validateAuthBody(req.body as Record<string, unknown>);
  if (bodyError) {
    return res.status(400).json({ error: bodyError });
  }

  const { email, password } = req.body as { email: string; password: string };

  const ip = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "unknown";
  const rateLimitKey = `signin:${ip}`;

  if (rateLimiter(rateLimitKey, { maxAttempts: 10, windowMs: 900000 })) {
    return res.status(429).json({ error: "登录尝试过于频繁，请 15 分钟后重试" });
  }

  try {
    const cookieStore = createCookieStore(req.cookies);
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      console.error("账号密码登录失败:", error.message);
      return res.status(401).json({ error: "邮箱或密码错误" });
    }

    const payload = await getSessionFromClient(supabase);
    const setCookies = cookieStore.getSetCookieHeaders();
    if (setCookies.length > 0) {
      res.setHeader("Set-Cookie", setCookies);
    }

    return res.status(200).json(payload);
  } catch (err) {
    console.error("登录接口异常:", err);
    return res.status(500).json({ error: "服务器内部错误" });
  }
}