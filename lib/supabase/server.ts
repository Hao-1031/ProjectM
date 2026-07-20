import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "./database.types";

export function createClient(cookieStore?: {
  get: (name: string) => { value?: string } | undefined;
  set: (name: string, value: string, options: CookieOptions) => void;
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!cookieStore) {
    return createServerClient<Database>(url, key, {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    });
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => {
        return [
          { name: "sb-access-token", value: cookieStore.get("sb-access-token")?.value },
          { name: "sb-refresh-token", value: cookieStore.get("sb-refresh-token")?.value },
        ].filter((c): c is { name: string; value: string } => !!c.value);
      },
      setAll: (cookies) => {
        cookies.forEach((cookie) => {
          cookieStore.set(cookie.name, cookie.value, cookie.options);
        });
      },
    },
  });
}
