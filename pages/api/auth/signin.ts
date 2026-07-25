import type { NextApiRequest, NextApiResponse } from "next";
import { authDisabledResponse } from "@/lib/auth/disabled";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return authDisabledResponse(req, res);
}
