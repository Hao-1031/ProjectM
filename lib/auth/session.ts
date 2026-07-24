import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { AuthUser, OAuthProvider, SessionPayload } from "./constants";

function userToAuthUser(user: User): AuthUser {
  const provider =
    (user.user_metadata?.provider as OAuthProvider) ||
    (user.app_metadata?.provider as OAuthProvider) ||
    "email";
  return {
    id: user.id,
    provider,
    avatarUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
  };
}

export async function getSessionFromClient(supabase: SupabaseClient): Promise<SessionPayload> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, isAuthenticated: false };
  }

  return { user: userToAuthUser(user), isAuthenticated: true };
}

export async function getSessionFromRequest(req: {
  cookies: Partial<Record<string, string>>;
}): Promise<SessionPayload> {
  const cookieStore = {
    get: (name: string) => {
      const value = req.cookies[name];
      return value ? { value } : undefined;
    },
    set: () => {},
  };

  const supabase = createServerClient(cookieStore);
  return getSessionFromClient(supabase);
}
