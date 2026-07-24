import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/supabase/server";
import { createCookieStore, clearAuthCookiesHeaders } from "@/lib/auth/cookies";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "方法不允许" });
  }

  try {
    const cookieStore = createCookieStore(req.cookies);
    const supabase = createClient(cookieStore);
    await supabase.auth.signOut();

    const clearCookies = clearAuthCookiesHeaders();
    res.setHeader("Set-Cookie", clearCookies);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("登出异常:", err);
    const clearCookies = clearAuthCookiesHeaders();
    res.setHeader("Set-Cookie", clearCookies);
    return res.status(200).json({ success: true });
  }
}
