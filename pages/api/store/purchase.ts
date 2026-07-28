import type { NextApiRequest, NextApiResponse } from "next";
import { applySecurityHeaders } from "@/lib/auth/security";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getCosmetic } from "@/lib/game/cosmetics";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applySecurityHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "方法不允许" });
  }

  const session = await getSessionFromRequest(req);
  if (!session.isAuthenticated || !session.user) {
    return res.status(401).json({ error: "请先登录" });
  }

  const { itemId } = req.body as { itemId?: string };
  if (!itemId || typeof itemId !== "string") {
    return res.status(400).json({ error: "缺少商品 ID" });
  }

  const cosmetic = getCosmetic(itemId);
  if (!cosmetic) {
    return res.status(404).json({ error: "商品不存在" });
  }

  return res.status(200).json({
    success: true,
    message: "购买请求已接收",
    item: { id: cosmetic.id, name: cosmetic.name, cost: cosmetic.cost },
  });
}