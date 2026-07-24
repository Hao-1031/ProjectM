# Project-M 本地开发手册

> 推荐环境：Windows 11 + WSL2 Ubuntu 22.04 LTS
> 技术栈：Next.js 14 + pnpm 11 + Node.js 20

---

## 1. 环境要求

- Node.js 20 LTS
- pnpm 11
- Git 2.40+
- （推荐）WSL2 Ubuntu 22.04 LTS

---

## 2. 推荐：Windows + WSL2

由于生产环境为 Ubuntu 22.04，推荐 Windows 开发者使用 WSL2 以获得最接近生产的环境，避免 pnpm symlink、路径、standalone 输出等跨平台差异。

### 2.1 安装 WSL2 和 Ubuntu 22.04

以管理员身份打开 PowerShell：

```powershell
wsl --install -d Ubuntu-22.04
```

安装完成后重启，按提示设置 Ubuntu 用户名和密码。

### 2.2 WSL2 中安装 Node.js 20 和 pnpm 11

```bash
# 进入 WSL2 Ubuntu
wsl

# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 pnpm 11
npm install -g pnpm@11

# 验证
node -v
pnpm -v
```

---

## 3. 克隆仓库

```bash
git clone https://github.com/Hao-1031/Project-M.git project-m
cd project-m
```

---

## 4. 安装依赖

```bash
pnpm install
```

---

## 5. 生成图标

```bash
pnpm generate-icons
```

---

## 6. Supabase 连接方式

选择以下任意一种方式配置数据库。

### 方式 A：连接远程 Supabase 项目（推荐，快速启动）

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard) 创建项目。
2. 进入 Project Settings > API，复制：
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` API key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` -> `SUPABASE_SERVICE_ROLE_KEY`
3. 在项目根目录创建 `.env.local`：

```bash
cp .env.example .env.local
nano .env.local
```

4. 填入 Supabase 相关变量和 `ADMIN_KEY`：

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_KEY=your-secure-random-key
```

5. 在 Supabase SQL Editor 中执行 [`supabase/schema.sql`](./supabase/schema.sql)。
6. 如需测试数据，继续执行 [`supabase/seed.sql`](./supabase/seed.sql)。

### 方式 B：本地 Supabase CLI（完全隔离）

适合需要完全离线开发或频繁调整数据库结构的场景。

#### 6.2.1 安装 Supabase CLI

```bash
# 方式 1：通过 npm
npm install -g supabase

# 方式 2：通过 Homebrew（macOS / Linux）
brew install supabase/tap/supabase
```

#### 6.2.2 初始化本地 Supabase

```bash
# 确保 Docker 已启动
supabase login
supabase init
supabase start
```

启动成功后，终端会输出本地服务地址和密钥：

```text
API URL: http://localhost:54321
anon key: eyJhbG...
service_role key: eyJhbG...
```

#### 6.2.3 应用 schema 和 seed

```bash
supabase db reset
supabase seed apply
```

> 若 `seed.sql` 未自动应用，可在 Supabase Studio（`http://localhost:54323`）的 SQL Editor 中手动运行 [`supabase/seed.sql`](./supabase/seed.sql)。

#### 6.2.4 配置 .env.local

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
ADMIN_KEY=your-secure-random-key
```

---

## 7. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000。

---

## 8. 本地构建与预览

```bash
pnpm build
pnpm start
```

> Windows 本地预览必须使用 `pnpm start`，不要直接运行 `node .next/standalone/server.js`。`next.config.mjs` 在 Windows 上不输出 standalone，且 pnpm symlink 会导致 `EPERM` 错误。

---

## 9. 创建测试账号

由于 Supabase Auth 密码需要特殊哈希，无法直接通过 SQL 插入。请在登录页注册测试账号：

1. 访问 http://localhost:3000/login
2. 切换到「注册」页签
3. 填写：
   - 邮箱：`test@project-m.local`
   - 密码：`TestPass123!`
4. 注册成功后，`public.profiles` 会自动生成对应记录
5. 用同一账号登录即可验证登录态、排行榜关联 user_id 等功能

---

*本手册对应 Project-M L3V100 "创世版" 本地开发流程。*
