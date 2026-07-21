# Project M 2.0 商业化上线部署手册

> 目标：将 Project M 2.0 完整产品套件（Next.js 全栈 Web 游戏 + 排行榜/公告后端）部署至阿里云 Windows Server，并接入 Supabase 托管数据库。

---

## 1. 交付物清单

| 模块 | 文件/路径 | 说明 |
|------|-----------|------|
| 游戏前端 | `pages/game.tsx`, `components/game/` | 生存模式、据点防守、PVP 等玩法入口 |
| 品牌官网 | `pages/landing.tsx`, `pages/index.tsx` | 2.0 官网与指挥终端首页 |
| 管理后台 | `pages/admin.tsx`, `pages/api/announcements.ts` | 公告 CRUD，需 `ADMIN_KEY` |
| 排行榜 API | `pages/api/leaderboard.ts`, `hooks/useLeaderboard.ts` | 全球战绩提交与查询 |
| Supabase 类型 | `lib/supabase/database.types.ts` | TypeScript 数据库契约 |
| 环境模板 | `.env.example` | 必填环境变量说明 |
| CI/CD | `.github/workflows/ci.yml` | GitHub Actions 自动测试与构建 |
| PM2 配置 | `ecosystem.config.cjs` | Windows/Linux 双平台进程管理 |
| 一键部署脚本 | `scripts/deploy-windows.ps1` | 阿里云 Windows Server 初始化与部署 |

---

## 2. 技术栈与环境要求

- **Node.js**: 18 LTS 及以上
- **包管理器**: pnpm 8+
- **Git**: 2.40+
- **进程管理**: PM2
- **数据库**: Supabase（Postgres + PostgREST）
- **反向代理**: Nginx for Windows（可选，推荐生产使用）
- **操作系统**: Windows Server 2022 / 2019（本手册以 Windows 为主）

---

## 3. Supabase 后端配置

### 3.1 创建项目

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)。
2. 新建 Organization 与 Project，建议地域选择离用户最近的节点。
3. 进入 Project Settings > API，复制：
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` API key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3.2 建表 SQL

在 Supabase SQL Editor 中执行以下语句：

```sql
-- 排行榜表
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  mode TEXT NOT NULL,
  player_name TEXT NOT NULL,
  user_id UUID DEFAULT NULL,
  kills INTEGER NOT NULL DEFAULT 0,
  waves INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0
);

-- 公告表
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0
);

-- 常用查询索引
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON public.leaderboard (score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_mode ON public.leaderboard (mode);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements (active, priority DESC);
```

### 3.3 RLS 策略（推荐）

排行榜允许匿名写入与读取；公告只允许服务角色或管理员写入。

```sql
-- 开启 RLS
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 排行榜：所有人可读
CREATE POLICY "leaderboard_select_public"
  ON public.leaderboard
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 排行榜：所有人可插入（匿名提交战绩）
CREATE POLICY "leaderboard_insert_public"
  ON public.leaderboard
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 公告：所有人可读
CREATE POLICY "announcements_select_public"
  ON public.announcements
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- 公告：仅服务角色可写（通过 ADMIN_KEY 保护的 API 路由操作）
CREATE POLICY "announcements_write_service"
  ON public.announcements
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

> 注意：本项目的 `/api/announcements` 使用 `anon` key 进行数据库操作，因此如果启用 RLS，请确保 `anon` 角色对 announcements 有写权限，或在 API 中使用 `service_role` key。为简化部署，默认建议在 Supabase 中赋予 `anon` 对两张表的完整权限，并通过 `ADMIN_KEY` 保护管理接口。

---

## 4. 本地开发与验证

```powershell
# 1. 克隆仓库
git clone https://github.com/Hao-1031/ProjectM.git project-m
cd project-m

# 2. 安装依赖
pnpm install

# 3. 生成图标
pnpm generate-icons

# 4. 配置环境变量
copy .env.example .env.local
# 编辑 .env.local 填入 Supabase 与 ADMIN_KEY

# 5. 类型检查、测试、构建
pnpm typecheck
pnpm test:run
pnpm build

# 6. 本地预览
pnpm start
```

---

## 5. CI/CD（GitHub Actions）

仓库已配置 `.github/workflows/ci.yml`，在 `push` 或 `pull_request` 到 `main` 时自动执行：

1. `pnpm install --frozen-lockfile`
2. `pnpm generate-icons`
3. `pnpm lint`
4. `pnpm format:check`
5. `pnpm typecheck`
6. `pnpm test:run`
7. `pnpm build`

### 5.1 配置 Secrets

在 GitHub 仓库 Settings > Secrets and variables > Actions 中添加：

| Secret | 说明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |
| `ADMIN_KEY` | 管理后台密钥（任意高强度随机字符串） |
| `SENTRY_ORG` | Sentry 组织（可选） |
| `SENTRY_PROJECT` | Sentry 项目（可选） |
| `SENTRY_AUTH_TOKEN` | Sentry Auth Token（可选，未配置时自动跳过 sourcemap 上传） |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN（可选） |

---

## 6. 阿里云 Windows Server 部署

### 6.1 服务器准备

- 规格建议：2 vCPU / 4 GB 内存 起步，带宽按玩家规模选择。
- 系统盘：至少 40 GB SSD。
- 开放安全组端口：
  - `80` HTTP
  - `443` HTTPS
  - `3000` 应用直连（调试或 Nginx 上游）
  - `22` / `3389` 远程管理

### 6.2 一键部署脚本

以管理员身份打开 PowerShell，执行：

```powershell
# 下载并执行部署脚本（推荐）
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/Hao-1031/ProjectM/main/scripts/deploy-windows.ps1" -OutFile "C:\deploy-windows.ps1"
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
C:\deploy-windows.ps1 -Domain "your-domain.com" -AdminKey "your-secure-admin-key"
```

或直接运行仓库内的脚本：

```powershell
.\scripts\deploy-windows.ps1 -Domain "your-domain.com" -AdminKey "your-secure-admin-key"
```

### 6.3 脚本执行流程说明

`scripts/deploy-windows.ps1` 会依次完成：

1. **管理员权限检查**：非管理员则退出。
2. **安装 Chocolatey**：Windows 包管理器。
3. **安装 Node.js LTS、Git**：通过 `choco`。
4. **安装 pnpm 与 PM2**：`npm install -g pnpm pm2`。
5. **拉取代码**：默认目录 `C:\www\project-m`，支持重复执行时 `git reset --hard origin/main` 更新。
6. **生成 `.env.local`**：从 `.env.example` 复制，并追加 Supabase 与 `ADMIN_KEY` 占位符；首次部署后需手动填入真实值。
7. **安装依赖与构建**：`pnpm install --frozen-lockfile && pnpm generate-icons && pnpm build`。
8. **配置防火墙**：开放 3000/80/443 入站端口。
9. **启动 PM2**：`pm2 start ecosystem.config.cjs --env production` 并设置开机自启。
10. **可选 Nginx**：传入 `-Domain` 时自动下载 Nginx for Windows、生成反向代理配置并启动。

### 6.4 手动部署（不使用脚本）

```powershell
# 以管理员身份运行 PowerShell

# 安装 Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 安装 Node.js 与 Git
choco install nodejs-lts git -y
refreshenv

# 安装 pnpm 与 PM2
npm install -g pnpm pm2

# 拉取代码
New-Item -ItemType Directory -Force -Path C:\www
cd C:\www
git clone https://github.com/Hao-1031/ProjectM.git project-m
cd project-m

# 配置环境变量
copy .env.example .env.local
# 使用记事本或 VS Code 编辑 .env.local，填入真实值
notepad .env.local

# 安装、构建、启动
pnpm install --frozen-lockfile
pnpm generate-icons
pnpm build
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup windows

# 开放防火墙
New-NetFirewallRule -DisplayName "Project-M-3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
New-NetFirewallRule -DisplayName "Project-M-HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Project-M-HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

### 6.5 PM2 运维

```powershell
# 查看状态
pm2 status

# 查看日志
pm2 logs project-m --lines 100

# 重启
pm2 restart project-m

# 重载配置
pm2 reload ecosystem.config.cjs --env production

# 开机自启
pm2 startup windows
pm2 save
```

### 6.6 Nginx 反向代理与 HTTPS

如果通过脚本传入 `-Domain`，Nginx 会自动监听 80 并转发到 `127.0.0.1:3000`。生产环境建议：

1. 在阿里云申请或上传 SSL 证书。
2. 修改 `C:\nginx\conf\nginx.conf`，新增 443 server 块：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate     C:\ssl\your-domain.com.pem;
    ssl_certificate_key C:\ssl\your-domain.com.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}
```

3. 重启 Nginx：

```powershell
cd C:\nginx
.\nginx.exe -s reload
```

---

## 7. 配置项说明

### 7.1 `.env.local` 完整示例

```env
# 应用基础
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Supabase 后端（排行榜、公告）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 管理员后台密钥（用于 /admin 公告管理）
ADMIN_KEY=your-secure-random-key

# Sentry 错误监控（可选，未配置 SENTRY_AUTH_TOKEN 时构建自动跳过）
SENTRY_ORG=your-org
SENTRY_PROJECT=project-m
SENTRY_AUTH_TOKEN=your-token
NEXT_PUBLIC_SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
```

### 7.2 生成安全的 ADMIN_KEY

```powershell
# 在 PowerShell 中生成 32 字节随机密钥
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 } | ForEach-Object { [byte]$_ }))
```

---

## 8. 上线后检查清单

- [ ] 访问 `http://<服务器IP>:3000` 或域名，确认首页加载。
- [ ] 进入 `/admin`，使用 `ADMIN_KEY` 登录并发布一条公告。
- [ ] 首页顶部应显示最新公告横幅。
- [ ] 完成一局生存模式后，在 `/leaderboard` 提交战绩，确认全球排行榜返回数据。
- [ ] 检查 PM2 状态：`pm2 status` 显示 `project-m` 为 `online`。
- [ ] 检查日志：`pm2 logs project-m --lines 50` 无异常报错。
- [ ] 确认防火墙规则已生效。
- [ ] 确认 Nginx 已转发到 3000 端口（如启用）。

---

## 9. 故障排查

### 9.1 构建卡在 "Collecting build traces..."

- Windows 上 standalone 输出与 pnpm symlink 可能冲突。
- 已配置 `next.config.mjs`：Windows 本地构建不输出 standalone，Linux 生产服务器输出 standalone。
- 如仍卡住，尝试删除 `.next` 目录后重新构建：

```powershell
Remove-Item -Recurse -Force .next
pnpm build
```

### 9.2 `pnpm install` 出现 EPERM

- 以管理员身份运行 PowerShell。
- 或尝试 `pnpm install --shamefully-hoist`。

### 9.3 Supabase 返回 401/403

- 检查 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是否正确。
- 检查 Supabase 表是否已创建、RLS 策略是否允许 `anon` 角色访问。
- 管理后台写入失败时，检查 `ADMIN_KEY` 是否与 `/admin` 页面输入一致。

### 9.4 页面访问 500

- 查看 PM2 日志：

```powershell
pm2 logs project-m --lines 200
```

- 常见原因：环境变量未配置、Supabase 未连通、构建产物损坏。

### 9.5 Nginx 无法启动

- 检查 80/443 端口是否被占用：

```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 80).OwningProcess
```

- 检查 `C:\nginx\conf\nginx.conf` 语法：

```powershell
cd C:\nginx
.\nginx.exe -t
```

### 9.6 PM2 开机自启失效

- 执行 `pm2 startup windows` 后，根据提示运行生成的命令。
- 然后执行 `pm2 save`。

---

## 10. 安全与合规建议

- **无氪金承诺**：游戏内商店仅出售外观与便利道具，不售卖数值、英雄或抽卡。部署前请复核 `lib/game/` 与 `pages/armory.tsx`，确保没有隐藏的付费加成逻辑。
- **HTTPS**：生产环境必须配置 SSL，防止战绩提交与管理员接口被中间人攻击。
- **ADMIN_KEY**：定期轮换，不要提交到仓库；仅通过环境变量注入。
- **Supabase**：定期备份数据库；对 `leaderboard` 表可设置自动清理旧数据策略。
- **防火墙**：仅开放必要端口；数据库不直接暴露在公网。

---

## 11. 更新与回滚

### 更新版本

```powershell
cd C:\www\project-m
git fetch origin
git reset --hard origin/main
pnpm install --frozen-lockfile
pnpm generate-icons
pnpm build
pm2 reload project-m
```

### 快速回滚

```powershell
cd C:\www\project-m
git log --oneline -5
# 选择上一个稳定 commit
git reset --hard <stable-commit-hash>
pnpm build
pm2 reload project-m
```

---

## 12. 联系与文档

- 仓库地址：https://github.com/Hao-1031/ProjectM
- Supabase 文档：https://supabase.com/docs
- PM2 文档：https://pm2.keymetrics.io/docs/
- Next.js 部署文档：https://nextjs.org/docs/deployment
