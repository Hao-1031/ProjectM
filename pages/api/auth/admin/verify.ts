import type { NextApiRequest, NextApiResponse } from "next";
import { rateLimiter } from "@/lib/auth/rate-limiter";
import { applySecurityHeaders } from "@/lib/auth/security";

const ADMIN_KEY = process.env.ADMIN_KEY;

export interface AdminVerifyResponse {
  valid: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<AdminVerifyResponse>) {
  applySecurityHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ valid: false });
  }

  if (!ADMIN_KEY) {
    return res.status(503).json({ valid: false });
  }

  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
  if (rateLimiter(`admin-verify:${ip}`, { maxAttempts: 10, windowMs: 300000 })) {
    return res.status(429).json({ valid: false });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ valid: false });
  }

  const token = authHeader.slice(7);
  if (token !== ADMIN_KEY) {
    return res.status(401).json({ valid: false });
  }

  return res.status(200).json({ valid: true });
}
