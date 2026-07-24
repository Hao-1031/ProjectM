import { useCallback, useEffect, useState } from "react";
import type { AuthUser, SessionPayload } from "@/lib/auth/constants";

interface UseAuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  signOut: () => Promise<void>;
}

async function fetchSession(): Promise<SessionPayload> {
  const res = await fetch("/api/auth/session", {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error("获取登录状态失败");
  }

  return (await res.json()) as SessionPayload;
}

export function useAuth(): UseAuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSession();
      setUser(data.user);
      setIsAuthenticated(data.isAuthenticated);
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "same-origin",
      });
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登出失败");
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { user, isAuthenticated, isLoading, error, refetch, signOut };
}
