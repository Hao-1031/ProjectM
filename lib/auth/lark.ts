import { createHash, randomBytes } from "crypto";
import { LARK_TOKEN_URL, LARK_USER_URL } from "./constants";

export interface LarkAccessTokenResponse {
  code: number;
  msg: string;
  data?: {
    access_token: string;
    token_type: string;
    expires_in: number;
    name: string;
    en_name?: string;
    avatar_url?: string;
    avatar_thumb?: string;
    avatar_middle?: string;
    avatar_big?: string;
    open_id: string;
    union_id?: string;
    email?: string;
    user_id?: string;
    mobile?: string;
    tenant_key?: string;
    refresh_token?: string;
  };
}

export interface LarkUserInfo {
  openId: string;
  name: string;
  avatarUrl: string | null;
}

export function generateState(): string {
  return randomBytes(32).toString("hex");
}

export function hashState(state: string): string {
  return createHash("sha256").update(state).digest("hex");
}

export function deriveBridgePassword(openId: string, secret: string): string {
  return createHash("sha256").update(`${openId}:${secret}`).digest("hex");
}

export function buildLarkAuthorizeUrl({
  appId,
  redirectUri,
  state,
}: {
  appId: string;
  redirectUri: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    app_id: appId,
    redirect_uri: redirectUri,
    state,
  });
  return `https://open.feishu.cn/open-apis/authen/v1/authorize?${params.toString()}`;
}

export async function exchangeLarkCode({
  appId,
  appSecret,
  code,
}: {
  appId: string;
  appSecret: string;
  code: string;
}): Promise<LarkUserInfo> {
  const tokenRes = await fetch(LARK_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`飞书 token 接口请求失败: ${tokenRes.status}`);
  }

  const tokenData = (await tokenRes.json()) as LarkAccessTokenResponse;
  if (tokenData.code !== 0 || !tokenData.data?.access_token) {
    throw new Error(tokenData.msg || "飞书 access_token 获取失败");
  }

  const { access_token, open_id, name, avatar_url, avatar_middle, avatar_big } = tokenData.data;

  const userRes = await fetch(LARK_USER_URL, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: "application/json",
    },
  });

  if (!userRes.ok) {
    throw new Error(`飞书用户信息接口请求失败: ${userRes.status}`);
  }

  const userData = (await userRes.json()) as LarkAccessTokenResponse;
  if (userData.code !== 0 || !userData.data?.open_id) {
    throw new Error(userData.msg || "飞书用户信息获取失败");
  }

  const data = userData.data;
  const displayName = data.name || name || "飞书用户";
  const avatar =
    data.avatar_url || data.avatar_big || data.avatar_middle || avatar_big || avatar_middle || avatar_url || null;

  return {
    openId: data.open_id || open_id,
    name: displayName,
    avatarUrl: avatar,
  };
}
