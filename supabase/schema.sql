-- Project-M L3V100 "创世版" 数据库结构
-- 目标：Supabase Postgres 15+
-- 执行方式：登录 Supabase Dashboard > SQL Editor > New query，粘贴后点击 Run

-- 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. 用户资料表
-- 与 Supabase Auth 的 auth.users(id) 一对一关联
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider TEXT NOT NULL DEFAULT 'email',
  provider_id TEXT NOT NULL DEFAULT '',
  avatar_url TEXT
);

COMMENT ON TABLE public.profiles IS '与 Supabase Auth 用户一一对应的公开资料';

-- ============================================================
-- 2. 排行榜表
-- 支持匿名与登录用户提交战绩
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  mode TEXT NOT NULL,
  player_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kills INTEGER NOT NULL DEFAULT 0,
  waves INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE public.leaderboard IS '全球排行榜战绩，允许匿名提交';

-- ============================================================
-- 3. 公告表
-- 管理后台发布，首页/游戏内读取 active=true 的公告
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE public.announcements IS '运营公告，支持优先级与上下线';

-- ============================================================
-- 4. 索引优化
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_provider_id ON public.profiles (provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON public.leaderboard (score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_mode ON public.leaderboard (mode);
CREATE INDEX IF NOT EXISTS idx_leaderboard_mode_score ON public.leaderboard (mode, score DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements (active, priority DESC);

-- ============================================================
-- 5. RLS（行级安全策略）
-- ============================================================

-- 5.1 profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own_or_public"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5.2 leaderboard
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leaderboard_select_public"
  ON public.leaderboard
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "leaderboard_insert_public"
  ON public.leaderboard
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 5.3 announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select_active"
  ON public.announcements
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "announcements_write_service"
  ON public.announcements
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 6. 触发器：自动维护 updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 7. 触发器：用户注册后自动创建 profile
-- 说明：当 auth.users 新用户插入时，自动在 public.profiles 生成一行。
-- 若通过 OAuth 登录，后续回调逻辑也会补充 provider/provider_id。
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, provider, provider_id, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'provider', 'email'),
    COALESCE(NEW.raw_user_meta_data->>'provider_id', NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    provider = EXCLUDED.provider,
    provider_id = EXCLUDED.provider_id,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
