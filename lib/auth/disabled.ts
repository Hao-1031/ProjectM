import type { NextApiRequest, NextApiResponse } from "next";

export const AUTH_DISABLED_MESSAGE = "注册与登录功能已临时关闭，请稍后重试";

export function authDisabledResponse(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Retry-After", "86400");
  return res.status(503).json({ error: AUTH_DISABLED_MESSAGE });
}
