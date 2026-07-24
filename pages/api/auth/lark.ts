import type { NextApiRequest, NextApiResponse } from "next";
import { AUTH_COOKIE_NAMES } from "@/lib/auth/constants";
import { buildLarkAuthorizeUrl, generateState, hashState } from "@/lib/auth/lark";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "方法不允许" });
  }

  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;

  if (!appId || !appSecret) {
    return res.status(503).json({ error: "飞书登录未配置" });
  }

  try {
    const state = generateState();
    const stateHash = hashState(state);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.host}`;
    const redirectUri = `${baseUrl}/api/auth/lark/callback`;

    const url = buildLarkAuthorizeUrl({ appId, redirectUri, state: stateHash });

    const cookieOptions = [
      `${AUTH_COOKIE_NAMES.larkState}=${encodeURIComponent(state)}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${60 * 10}`,
      process.env.NODE_ENV === "production" ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

    res.setHeader("Set-Cookie", cookieOptions);
    return res.redirect(302, url);
  } catch (err) {
    console.error("飞书 OAuth 初始化异常:", err);
    return res.status(500).json({ error: "服务器内部错误" });
  }
}
