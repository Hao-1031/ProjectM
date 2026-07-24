import type { CookieOptions } from "@supabase/ssr";
import { AUTH_COOKIE_NAMES } from "./constants";

export interface SerializableCookieStore {
  get: (name: string) => { value?: string } | undefined;
  set: (name: string, value: string, options: CookieOptions) => void;
  getSetCookieHeaders: () => string[];
}

const DEFAULT_OPTIONS: CookieOptions = {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7,
};

export function createCookieStore(reqCookies: Partial<Record<string, string>>): SerializableCookieStore {
  const setCookies: string[] = [];

  function serializeCookie(name: string, value: string, options: CookieOptions = DEFAULT_OPTIONS): string {
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    if (options.path) cookie += `; Path=${options.path}`;
    if (options.httpOnly) cookie += "; HttpOnly";
    if (options.secure) cookie += "; Secure";
    if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
    if (options.maxAge !== undefined) cookie += `; Max-Age=${options.maxAge}`;
    if (options.expires) cookie += `; Expires=${options.expires.toUTCString()}`;
    return cookie;
  }

  return {
    get: (name: string) => {
      const value = reqCookies[name];
      return value ? { value } : undefined;
    },
    set: (name, value, options) => {
      const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
      setCookies.push(serializeCookie(name, value, mergedOptions));
    },
    getSetCookieHeaders: () => setCookies,
  };
}

export function createClearCookieHeader(name: string): string {
  return `${encodeURIComponent(name)}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;
}

export function clearAuthCookiesHeaders(): string[] {
  return [AUTH_COOKIE_NAMES.accessToken, AUTH_COOKIE_NAMES.refreshToken, AUTH_COOKIE_NAMES.larkState].map(
    createClearCookieHeader
  );
}
