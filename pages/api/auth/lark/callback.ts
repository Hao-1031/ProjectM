import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/supabase/server";
import { createCookieStore } from "@/lib/auth/cookies";
import { hashState, exchangeLarkCode, deriveBridgePassword } from "@/lib/auth/lark";
import { AUTH_COOKIE_NAMES } from "@/lib/auth/constants";
import { applySecurityHeaders } from "@/lib/auth/security";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applySecurityHeaders(res);
  const { code, state } = req.query;

  if (typeof code !== "string" || typeof state !== "string") {
    return res.redirect(302, "/?auth_error=飞书授权参数缺失");
  }

  const storedHash = req.cookies[AUTH_COOKIE_NAMES.larkState];
  if (!storedHash || hashState(state) !== storedHash) {
    return res.redirect(302, "/?auth_error=飞书授权状态校验失败");
  }

  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;
  const oauthSecret = process.env.LARK_OAUTH_SECRET;

  if (!appId || !appSecret || !oauthSecret) {
    return res.redirect(302, "/?auth_error=飞书登录未配置");
  }

  try {
    const larkUser = await exchangeLarkCode({ appId, appSecret, code });
    const bridgePassword = deriveBridgePassword(larkUser.openId, oauthSecret);

    const cookieStore = createCookieStore(req.cookies);
    const supabase = createClient(cookieStore);

    const { error: signUpError } = await supabase.auth.signUp({
      email: `${larkUser.openId}@lark.project-m.internal`,
      password: bridgePassword,
      options: {
        data: {
          provider: "lark",
          name: larkUser.name,
          avatar_url: larkUser.avatarUrl,
        },
      },
    });

    if (signUpError && !signUpError.message.includes("already registered")) {
      console.error("飞书桥接注册失败:", signUpError);
      return res.redirect(302, "/?auth_error=飞书登录失败");
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: `${larkUser.openId}@lark.project-m.internal`,
      password: bridgePassword,
    });

    if (signInError) {
      console.error("飞书桥接登录失败:", signInError);
      return res.redirect(302, "/?auth_error=飞书登录失败");
    }

    const setCookies = cookieStore.getSetCookieHeaders();
    if (setCookies.length > 0) {
      res.setHeader("Set-Cookie", setCookies);
    }

    const clearLarkState = `${encodeURIComponent(AUTH_COOKIE_NAMES.larkState)}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`;
    const existingHeaders = setCookies.length > 0 ? setCookies : [];
    res.setHeader("Set-Cookie", [...existingHeaders, clearLarkState]);

    return res.redirect(302, "/");
  } catch (err) {
    console.error("飞书 OAuth 回调异常:", err);
    return res.redirect(302, "/?auth_error=飞书登录失败");
  }
}