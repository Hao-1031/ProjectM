import type { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createAnonClient } from "@/lib/supabase/server";
import { createCookieStore } from "@/lib/auth/cookies";
import { AUTH_COOKIE_NAMES } from "@/lib/auth/constants";
import {
  deriveBridgePassword,
  exchangeLarkCode,
  hashState,
  type LarkUserInfo,
} from "@/lib/auth/lark";

function buildErrorRedirect(message: string): string {
  return `/?auth_error=${encodeURIComponent(message)}`;
}

function getRedirectTarget(req: NextApiRequest): string {
  const nextCookie = req.cookies[AUTH_COOKIE_NAMES.redirectNext];
  if (typeof nextCookie === "string" && nextCookie.startsWith("/")) {
    return nextCookie;
  }
  return "/";
}

function validateState(req: NextApiRequest): boolean {
  const rawState = req.cookies[AUTH_COOKIE_NAMES.larkState];
  const returnedState = typeof req.query.state === "string" ? req.query.state : "";

  if (!rawState || !returnedState) return false;
  return hashState(rawState) === returnedState;
}

async function findOrCreateLarkUser(larkUser: LarkUserInfo): Promise<{ userId: string; password: string }> {
  const admin = createAdminClient();
  const bridgePassword = deriveBridgePassword(larkUser.openId, process.env.LARK_OAUTH_SECRET || "");
  const email = `${larkUser.openId}@lark.project-m.local`;

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("provider", "lark")
    .eq("provider_id", larkUser.openId)
    .single();

  if (existingProfile?.id) {
    return { userId: existingProfile.id, password: bridgePassword };
  }

  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password: bridgePassword,
    email_confirm: true,
    user_metadata: {
      provider: "lark",
      provider_id: larkUser.openId,
      name: larkUser.name,
      avatar_url: larkUser.avatarUrl,
    },
  });

  if (createError || !newUser.user) {
    throw new Error(createError?.message || "创建飞书用户失败");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: newUser.user.id,
    provider: "lark",
    provider_id: larkUser.openId,
    avatar_url: larkUser.avatarUrl,
  });

  if (profileError) {
    console.error("飞书用户资料写入失败:", profileError);
  }

  return { userId: newUser.user.id, password: bridgePassword };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "方法不允许" });
  }

  const code = typeof req.query.code === "string" ? req.query.code : "";
  if (!code) {
    return res.redirect(302, buildErrorRedirect("缺少飞书授权码"));
  }

  if (!validateState(req)) {
    return res.redirect(302, buildErrorRedirect("登录状态校验失败，请重试"));
  }

  try {
    const appId = process.env.LARK_APP_ID;
    const appSecret = process.env.LARK_APP_SECRET;
    if (!appId || !appSecret || !process.env.LARK_OAUTH_SECRET) {
      return res.redirect(302, buildErrorRedirect("飞书登录未配置"));
    }

    const larkUser = await exchangeLarkCode({ appId, appSecret, code });
    const { password } = await findOrCreateLarkUser(larkUser);
    const email = `${larkUser.openId}@lark.project-m.local`;

    const cookieStore = createCookieStore(req.cookies);
    const anonClient = createAnonClient(cookieStore);

    const { error: signInError } = await anonClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("飞书桥接登录失败:", signInError);
      return res.redirect(302, buildErrorRedirect("登录失败，请重试"));
    }

    const setCookies = cookieStore.getSetCookieHeaders();
    const clearStateCookie = `${AUTH_COOKIE_NAMES.larkState}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`;

    const redirectTarget = getRedirectTarget(req);
    const clearRedirectCookie = `${AUTH_COOKIE_NAMES.redirectNext}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`;

    res.setHeader("Set-Cookie", [...setCookies, clearStateCookie, clearRedirectCookie]);
    return res.redirect(302, redirectTarget);
  } catch (err) {
    console.error("飞书回调异常:", err);
    const message = err instanceof Error ? err.message : "登录失败，请重试";
    return res.redirect(302, buildErrorRedirect(message));
  }
}
