import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/supabase/server";
import { createCookieStore } from "@/lib/auth/cookies";
import { getSessionFromClient } from "@/lib/auth/session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "方法不允许" });
  }

  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "邮箱和密码不能为空" });
  }

  try {
    const cookieStore = createCookieStore(req.cookies);
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      console.error("账号密码登录失败:", error.message);
      return res.status(401).json({ error: "邮箱或密码错误" });
    }

    const payload = await getSessionFromClient(supabase);
    const setCookies = cookieStore.getSetCookieHeaders();
    if (setCookies.length > 0) {
      res.setHeader("Set-Cookie", setCookies);
    }

    return res.status(200).json(payload);
  } catch (err) {
    console.error("登录接口异常:", err);
    return res.status(500).json({ error: "服务器内部错误" });
  }
}
