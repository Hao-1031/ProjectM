import type { NextApiRequest, NextApiResponse } from "next";
import { createCookieStore } from "@/lib/auth/cookies";
import { generateState, hashState, buildLarkAuthorizeUrl } from "@/lib/auth/lark";
import { AUTH_COOKIE_NAMES } from "@/lib/auth/constants";
import { applySecurityHeaders } from "@/lib/auth/security";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applySecurityHeaders(res);
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "方法不允许" });
  }

  const appId = process.env.LARK_APP_ID;
  if (!appId) {
    return res.status(503).json({ error: "飞书登录未配置" });
  }

  try {
    const cookieStore = createCookieStore(req.cookies);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host}`;
    const redirectUri = `${baseUrl}/api/auth/lark/callback`;
    const state = generateState();
    const hashedState = hashState(state);

    cookieStore.set(AUTH_COOKIE_NAMES.larkState, hashedState, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
    });

    const authorizeUrl = buildLarkAuthorizeUrl({ appId, redirectUri, state });

    const setCookies = cookieStore.getSetCookieHeaders();
    if (setCookies.length > 0) {
      res.setHeader("Set-Cookie", setCookies);
    }

    return res.redirect(302, authorizeUrl);
  } catch (err) {
    console.error("飞书 OAuth 初始化异常:", err);
    return res.status(500).json({ error: "服务器内部错误" });
  }
}