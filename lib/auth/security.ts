import type { NextApiRequest, NextApiResponse } from "next";

export function applySecurityHeaders(res: NextApiResponse): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");

  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
}

export function sanitizeInput(input: string, maxLength = 256): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, "");
}

export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(trimmed);
}

export function validateAuthBody(body: Record<string, unknown>): string | null {
  if (!body || typeof body !== "object") {
    return "请求体格式错误";
  }

  const { email, password } = body;

  if (typeof email !== "string" || !isValidEmail(email)) {
    return "邮箱格式无效";
  }

  if (typeof password !== "string") {
    return "密码格式无效";
  }

  return null;
}

export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function setCsrfCookie(res: NextApiResponse, token: string): void {
  const cookieValue = `${encodeURIComponent("csrf-token")}=${encodeURIComponent(token)}; Path=/; SameSite=Strict; HttpOnly${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }; Max-Age=${60 * 60 * 24}`;
  res.setHeader("Set-Cookie", cookieValue);
}

export function verifyCsrfToken(req: NextApiRequest, res: NextApiResponse): boolean {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return true;
  }

  const cookieToken = req.cookies["csrf-token"];
  const headerToken = req.headers["x-csrf-token"] as string;

  if (!cookieToken || !headerToken) {
    return false;
  }

  return cookieToken === headerToken;
}