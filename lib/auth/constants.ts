export const AUTH_COOKIE_NAMES = {
  accessToken: "sb-access-token",
  refreshToken: "sb-refresh-token",
  larkState: "lark-oauth-state",
} as const;

export type OAuthProvider = "github" | "discord" | "lark";

export interface AuthUser {
  id: string;
  provider: OAuthProvider;
  avatarUrl: string | null;
}

export interface SessionPayload {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

export const LARK_OAUTH_BASE = "https://open.feishu.cn/open-apis/authen/v1/authorize";
export const LARK_TOKEN_URL = "https://open.feishu.cn/open-apis/authen/v1/oidc/access_token";
export const LARK_USER_URL = "https://open.feishu.cn/open-apis/authen/v1/user_info";
