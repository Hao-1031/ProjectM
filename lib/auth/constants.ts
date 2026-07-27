export const AUTH_COOKIE_NAMES = {
  accessToken: "sb-access-token",
  refreshToken: "sb-refresh-token",
  redirectNext: "auth-redirect-next",
} as const;

export type OAuthProvider = "github" | "discord" | "email";

export interface AuthUser {
  id: string;
  provider: OAuthProvider;
  avatarUrl: string | null;
}

export interface SessionPayload {
  user: AuthUser | null;
  isAuthenticated: boolean;
}
