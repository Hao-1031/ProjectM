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

  if (password.length < 6) {
    return res.status(400).json({ error: "密码长度至少 6 位" });
  }

  try {
    const cookieStore = createCookieStore(req.cookies);
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          provider: "email",
        },
      },
    });

    if (error) {
      console.error("注册失败:", error.message);
      return res.status(400).json({ error: error.message });
    }

    if (!data.session) {
      return res.status(403).json({
        error: "当前 Supabase 项目开启了邮箱验证，请关闭 Confirm email 后重试",
      });
    }

    const payload = await getSessionFromClient(supabase);
    const setCookies = cookieStore.getSetCookieHeaders();
    if (setCookies.length > 0) {
      res.setHeader("Set-Cookie", setCookies);
    }

    return res.status(201).json(payload);
  } catch (err) {
    console.error("注册接口异常:", err);
    return res.status(500).json({ error: "服务器内部错误" });
  }
}
