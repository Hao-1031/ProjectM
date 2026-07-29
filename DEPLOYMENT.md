# 多重宇宙「奇迹」完整生产部署手册

> 目标环境：阿里云 Ubuntu 22.04 LTS（64 位）
> 技术栈：Next.js 14 + pnpm 11.9 + Node.js 20 LTS
> 部署方式：源码构建 + standalone 输出 + PM2 守护 + Nginx 反向代理 + Certbot HTTPS + GitHub Actions 自动部署
> 当前版本特性：全站 31 页面太空舰桥指挥舱风格重设计；品牌名「多重宇宙 (Multiverse)」；暗物质紫黑 (#0c0a14) 底色 + 品红全息光 (#c44dff) 主色 + 金色锚点 (#c8a45c) 强调色；版本代号「奇迹」(MI-MIRACLE)；注册/登录已启用，支持 GitHub OAuth 与微信验证码登录；剧情战役 + BossRush 玩法系统；旗舰巅峰模式（三阶段25波终极挑战 + 独立结算画面 + 六维雷达评分 + 隐藏成就系统 + 波次里程碑奖励 + 阶段完成奖励 + 实时HUD显示）；归属感系统（成就/成长/收藏）；世界观内容（英雄档案/维度编年史）；三引擎算法架构（α 玩家端 / β 敌方端 / 基础设施）；动态天气系统（辐射风暴、酸雨、沙尘暴）；诅咒祝福双选系统；多人联机基础设施；HUD 旗舰重设计；近战武器系统（4 基础 + 1 进阶）；英雄技能实用性增强

---

## 1. 交付物与范围

本次部署为「奇迹」版本一次性全部上线，包含全站 31 个页面的舰桥风格重设计及全部玩法系统。

### 1.1 全站页面清单（31 页）

| 页面 | 路径 | 说明 |
|------|------|------|
| 品牌首页 | `pages/landing.tsx` | 史诗叙事品牌首页，非对称 Hero、Bento 网格、舰桥风格 |
| 战术指挥中心 | `pages/index.tsx` | 全息模式选择器、维度跃迁状态指示器、舰桥广播系统 |
| 登录 | `pages/login.tsx` | GitHub OAuth + 邮箱验证码登录，舰桥面板风格 |
| 游戏大厅 | `pages/game.tsx` | 生存/据点防守/PvP/肉鸽/旗舰模式等玩法入口 |
| 基地 | `pages/base.tsx` | 玩家基地管理，舰桥风格面板 |
| 模式选择 | `pages/modes.tsx` | 全部游戏模式概览 |
| 剧情战役 | `pages/campaign.tsx` | 章节节点进度管理，全息地图风格 |
| BossRush | `pages/boss-rush.tsx` | 首领连战模式，关卡与奖励 |
| 旗舰巅峰 | `pages/flagship-peak.tsx` | 三阶段25波终极挑战，双轨挑战+双维度评级+统一积分制 |
| 顶峰挑战 | `pages/peak-challenge.tsx` | 高难度挑战内容 |
| 极限生存 | `pages/extreme-survival/index.tsx` | 极限生存模式入口 |
| 赛季 | `pages/season.tsx` | 赛季进度、奖励领取与任务追踪 |
| 英雄档案 | `pages/hero-archive.tsx` | 全部可玩英雄详细信息 |
| 英雄收藏 | `pages/heroes.tsx` | 英雄、皮肤、表情、徽章收藏与解锁 |
| 维度编年史 | `pages/chronicles.tsx` | 游戏历史与事件记录 |
| 成就 | `pages/achievements.tsx` | 成就系统、进度与奖励 |
| 排行榜 | `pages/leaderboard.tsx` | 本地最佳与全球排行榜 |
| 公会 | `pages/guild.tsx` | 公会功能与信息展示 |
| 世界地图 | `pages/world.tsx` | 维度网络节点连接图 |
| 军械库 | `pages/armory.tsx` | 全部武器展示（含近战 5 把） |
| 敌人图鉴 | `pages/enemies.tsx` | 全部敌人/Boss 信息 |
| 算法实验室 | `pages/algorithms.tsx` | 三引擎算法仪表盘（α/β/基础设施） |
| 关于 | `pages/about.tsx` | 项目信息与说明 |
| 帮助 | `pages/help.tsx` | 游戏帮助与指南 |
| 设置 | `pages/settings.tsx` | 用户个性化设置 |
| 管理后台 | `pages/admin.tsx` | 公告管理，需 `ADMIN_KEY` |
| 404 | `pages/404.tsx` | 自定义 404 页面 |

### 1.2 核心系统模块

| 模块 | 路径/文件 | 说明 |
|------|-----------|------|
| 版本常量 | `lib/version.ts` | 版本代号「奇迹」(MI-MIRACLE)、品牌名、标语 |
| 全局设计系统 | `styles/globals.css` | 舰桥风格 CSS 变量、动画、工具类 |
| Tailwind 配置 | `tailwind.config.ts` | 配色、字体、动画扩展 |
| 全局布局 | `components/Layout.tsx` | 版本水印、舰桥基础结构 |
| 游戏核心 | `lib/game/engine.ts`, `lib/game/types.ts` | 游戏循环、类型定义 |
| 剧情战役 | `lib/game/campaign.ts` | 章节、节点、进度管理 |
| BossRush | `lib/game/boss-rush.ts` | 关卡、首领、奖励机制 |
| 顶峰挑战 | `lib/game/peak-challenge.ts` | 高难度挑战逻辑 |
| 旗舰巅峰 | `lib/game/flagship-peak.ts` | 三阶段25波、双轨挑战、双维度评级、统一积分制 |
| 成就系统 | `lib/game/achievements.ts` | 成就定义、进度、奖励 |
| 编年史 | `lib/game/chronicles.ts` | 世界观数据 |
| 赛季系统 | `lib/game/season.ts`, `lib/game/save.ts` | 赛季等级、奖励、任务与持久化 |
| 天气系统 | `lib/game/weather.ts` | 辐射风暴、酸雨、沙尘暴 |
| 诅咒祝福 | `lib/game/curseBlessing.ts` | Roguelike 二选一配对系统 |
| 三引擎架构 | `lib/engine/alpha/`, `lib/engine/beta/`, `lib/engine/infra/` | α 玩家端 / β 敌方端 / 基础设施 |
| 多人联机 | `lib/network/` | 预测、插值、Delta、Jitter、匹配、房间、信令 |
| 近战武器 | `lib/game/balance.ts`, `lib/game/weapons.ts` | 4 基础 + 1 进阶，扇形/突刺双机制 |
| 英雄系统 | `lib/game/heroes.ts` | 全英雄数值/冷却/效果，近战天赋联动 |
| HUD 系统 | `components/Hud.tsx`, `components/game/HudDesktop.tsx`, `components/game/HudMobile.tsx`, `components/game/KillFeed.tsx` | 武器面板、击杀推送、状态效果栏 |
| 补给窗口 | `components/game/SupplyWindow.tsx` | B/ESC 快捷键、倒计时、快速下一波 |
| Supabase 后端 | `lib/supabase/`, `supabase/schema.sql` | Postgres 数据库与类型契约 |
| 进程管理 | `ecosystem.config.cjs` | PM2 跨平台配置 |
| 一键部署 | `scripts/deploy-ubuntu.sh` | Ubuntu 22.04 初始化与更新脚本 |
| CI/CD | `.github/workflows/deploy.yml` | push 到 main 自动部署 |

---

## 2. 环境准备

### 2.1 服务器要求

- 操作系统：Ubuntu 22.04 LTS（64 位）
- 计算：至少 2 vCPU / 4 GB 内存；推荐 4 vCPU / 8 GB
- 存储：系统盘剩余空间 >= 20 GB，建议使用 SSD
- 网络：开放 22（SSH）、80（HTTP）、443（HTTPS）；3000 端口按需开放（建议仅监听 127.0.0.1）

### 2.2 更新系统

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git nginx ufw certbot python3-certbot-nginx
```

### 2.3 安装 Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v  # v20.x.x
npm -v
```

### 2.4 安装 pnpm 11

```bash
npm install -g pnpm@11.9.0
pnpm -v
```

### 2.5 安装 PM2

```bash
npm install -g pm2
pm2 -v
```

---

## 3. 源码与依赖

### 3.1 拉取代码

```bash
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www

cd /var/www
git clone https://github.com/Hao-1031/ProjectM.git project-m
cd project-m
```

> 仓库地址：`https://github.com/Hao-1031/ProjectM`。

### 3.2 安装依赖

```bash
pnpm install --frozen-lockfile
pnpm generate-icons
```

> `--frozen-lockfile` 保证与 `pnpm-lock.yaml` 完全一致，避免依赖漂移。

---

## 4. 环境变量

### 4.1 创建 `.env.local`

```bash
cp .env.example .env.local
nano .env.local
```

### 4.2 完整变量清单

| 变量名 | 来源 | 必填 | 说明 |
|--------|------|------|------|
| `NODE_ENV` | 手动 | 是 | 固定填 `production` |
| `PORT` | 手动 | 是 | 应用监听端口，默认 `3000` |
| `HOSTNAME` | 手动 | 是 | 填 `0.0.0.0` |
| `NEXT_PUBLIC_SITE_URL` | 手动 | 是 | 生产环境完整 URL，如 `http://121.40.218.245:3000` 或 `https://your-domain.com`；**必须与 GitHub OAuth App 的回调地址一致** |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard | 是 | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard | 是 | 公开 anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | 是 | 服务端 service role key，切勿暴露 |
| `ADMIN_KEY` | 手动生成 | 是 | `/admin` 公告管理接口 Bearer Token |
| `SENTRY_ORG` | Sentry | 否 | Sentry 组织名 |
| `SENTRY_PROJECT` | Sentry | 否 | Sentry 项目名 |
| `SENTRY_AUTH_TOKEN` | Sentry | 否 | 未配置时构建自动跳过 sourcemap 上传 |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry | 否 | 前端 DSN |

生成 `ADMIN_KEY`：

```bash
openssl rand -base64 32
```

### 4.3 Sentry 构建约定

`next.config.mjs` 已实现自动检测：当 `SENTRY_AUTH_TOKEN` 未配置时，禁用 sourcemap 上传并跳过 Sentry 构建包装，避免构建阻塞。无需额外修改。

---

## 5. 数据库初始化

首次部署必须在 Supabase 中执行建表脚本：

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)。
2. 进入 SQL Editor > New query。
3. 粘贴 [`supabase/schema.sql`](./supabase/schema.sql) 全部内容并运行。
4. 如需测试数据，再运行 [`supabase/seed.sql`](./supabase/seed.sql)。
5. 在 Authentication > URL Configuration 中配置：
   - Site URL: `http://121.40.218.245:3000`（或你的域名）
   - Redirect URL: `http://121.40.218.245:3000/api/auth/callback`（或你的域名）

> **关键配置**：GitHub OAuth App 的 Authorization callback URL 必须与 `NEXT_PUBLIC_SITE_URL + /api/auth/callback` 完全一致，否则会出现 redirect_uri 不匹配错误。

---

## 5.5 GitHub OAuth 配置

### 5.5.1 创建 GitHub OAuth App

1. 登录 [GitHub Developer Settings](https://github.com/settings/developers)。
2. 进入 OAuth Apps > New OAuth App。
3. 填写：
   - Application name: `Project-M`
   - Homepage URL: `http://121.40.218.245:3000`（或你的域名）
   - Authorization callback URL: `http://121.40.218.245:3000/api/auth/callback`（或你的域名）
4. 点击 Register application。

### 5.5.2 配置 Supabase GitHub Provider

1. 在 Supabase Dashboard 中进入 Authentication > Providers。
2. 找到 GitHub，启用并填入：
   - Client ID（从 GitHub OAuth App 获取）
   - Client Secret（从 GitHub OAuth App 生成并复制）
3. 保存。

### 5.5.3 验证

访问 `http://121.40.218.245:3000/login`，点击「GitHub 登录」，应能正常跳转、授权并回到首页。

---

## 6. 构建

### 6.1 运行构建

```bash
cd /var/www/project-m
pnpm build
```

构建产物：

- `.next/standalone/`：独立可运行目录（Linux 生产环境已启用 standalone 输出）
- `.next/static/`：静态资源（已自动复制到 standalone 目录）

### 6.2 构建前验证

```bash
pnpm lint
pnpm typecheck
pnpm test:run
```

> 生产部署前建议至少运行 `pnpm typecheck` 与 `pnpm test:run`。Windows 本地开发使用 `pnpm start` 预览，不直接运行 `node .next/standalone/server.js`（pnpm symlink 可能导致 EPERM）。

---

## 7. 启动应用

### 7.1 直接启动（仅调试用）

```bash
cd /var/www/project-m/.next/standalone
node server.js
```

默认监听 `http://0.0.0.0:3000`。

### 7.2 PM2 生产守护

```bash
cd /var/www/project-m
mkdir -p logs

pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd
```

> `pm2 startup systemd` 会输出一条命令，复制并执行它以设置开机自启。

常用命令：

```bash
pm2 status
pm2 logs project-m --lines 100
pm2 restart project-m
pm2 stop project-m
pm2 delete project-m
```

### 7.3 更新环境变量后重启

修改 `.env.local` 后，PM2 不会自动重新加载环境变量，必须使用：

```bash
pm2 restart project-m --update-env
```

> 常见坑：仅执行 `pm2 restart project-m` 不会刷新 `.env.local` 中的变量，可能导致 OAuth 登录等接口读取到旧值。

---

## 8. 防火墙配置

### 8.1 UFW

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# 若未使用反向代理，可临时暴露 3000
# sudo ufw allow 3000/tcp

sudo ufw enable
sudo ufw status verbose
```

### 8.2 阿里云安全组

为 ECS 实例安全组添加规则：

| 类型 | 端口 | 授权对象 |
|------|------|----------|
| SSH | 22 | 你的 IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |
| 自定义 TCP | 3000 | 127.0.0.1/32（仅本机反向代理访问） |

---

## 9. 反向代理

### 9.1 安装并启动 Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 9.2 配置 Nginx

项目已提供 [`nginx/project-m.conf`](./nginx/project-m.conf)：

```bash
sudo cp nginx/project-m.conf /etc/nginx/sites-available/project-m
sudo nano /etc/nginx/sites-available/project-m
# 修改 server_name 为你的域名

sudo ln -sf /etc/nginx/sites-available/project-m /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

示例核心配置：

```nginx
server {
  listen 80;
  server_name your-domain.com;

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
```

---

## 10. HTTPS

### 10.1 安装 Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 10.2 申请并自动配置证书

```bash
sudo certbot --nginx -d your-domain.com
```

按提示完成配置，Certbot 会自动修改 Nginx 配置并启用 443。

### 10.3 自动续期测试

```bash
sudo certbot renew --dry-run
```

---

## 11. GitHub Actions 自动部署

仓库已配置 [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)。push 到 `main` 分支后，Actions 会通过 SSH 连接生产服务器并执行 [`scripts/deploy-ubuntu.sh`](./scripts/deploy-ubuntu.sh)。

### 11.1 配置 GitHub Secrets

在 GitHub 仓库 Settings > Secrets and variables > Actions 中添加：

| Secret | 说明 |
|--------|------|
| `DEPLOY_SSH_HOST` | 服务器公网 IP 或域名 |
| `DEPLOY_SSH_USER` | SSH 用户名，如 `root` 或 `ubuntu` |
| `DEPLOY_SSH_PRIVATE_KEY` | SSH 私钥（对应服务器 `~/.ssh/authorized_keys`） |
| `DEPLOY_SSH_PORT` | SSH 端口，默认 22 |

### 11.2 服务器端准备

确保服务器已执行本手册 1-7 节，且代码位于 `/var/www/project-m`。首次自动部署前建议手动运行一次脚本验证：

```bash
cd /var/www/project-m
chmod +x scripts/deploy-ubuntu.sh
./scripts/deploy-ubuntu.sh
```

### 11.3 自动部署流程

push 到 `main` 后，Actions 会执行：

1. SSH 登录服务器
2. 进入 `/var/www/project-m`
3. 执行 `scripts/deploy-ubuntu.sh`
4. 脚本内部完成 `git reset --hard origin/main`、`pnpm install --frozen-lockfile`、`pnpm generate-icons`、`pnpm build`、`pm2 startOrRestart`

---

## 12. 更新与回滚

### 12.1 更新版本（自动）

push 到 `main` 后自动部署，无需手动操作。

### 12.2 更新版本（手动）

```bash
cd /var/www/project-m
git pull origin main
pnpm install --frozen-lockfile
pnpm generate-icons
pnpm build
pm2 restart project-m --update-env
```

### 12.3 快速回滚

```bash
cd /var/www/project-m
git log --oneline -5
git reset --hard <commit-hash>
pnpm install --frozen-lockfile
pnpm build
pm2 restart project-m --update-env
```

---

## 13. 故障排查

### 13.1 构建卡在 "Collecting build traces..."

- 等待，该步骤在低配机器上可能耗时数分钟。
- 如超过 30 分钟，检查磁盘空间与 I/O：`df -h`, `iostat -x 1`。
- 查看构建日志：`pnpm build 2>&1 | tee build.log`。
- 可尝试清理缓存后重试：`rm -rf .next && pnpm build`。

### 13.2 standalone 目录缺失

- 确认构建在 Linux 上执行（`next.config.mjs` 仅在非 win32 时输出 standalone）。
- Windows 本地预览使用 `pnpm start`，不依赖 standalone。

### 13.3 Sentry 构建失败

- 确认 `.env.local` 中未设置 `SENTRY_AUTH_TOKEN`。未设置时项目已自动跳过 Sentry 包装。
- 若需启用 Sentry，再填入对应 token、org、project。

### 13.4 端口占用

```bash
sudo ss -tlnp | grep :3000
sudo kill -9 <PID>
```

### 13.5 PM2 进程反复重启

```bash
pm2 logs project-m --lines 200
```

常见原因：

- 内存超限：调整 `max_memory_restart` 或升级服务器。
- `.env.local` 缺失必要变量。
- `server.js` 路径错误（未重新构建 standalone）。

### 13.6 环境变量未生效

症状：接口返回旧值或提示「未配置」。

```bash
# 检查 PM2 进程环境
pm2 env project-m

# 必须带 --update-env 重启
pm2 restart project-m --update-env
```

### 13.7 GitHub Actions 部署失败

- 检查 GitHub Secrets 是否正确配置。
- 在 Actions 日志中查看 SSH 连接错误信息。
- 确认服务器防火墙允许 GitHub Actions runner IP 访问 SSH（如需白名单，建议使用固定 IP 的 self-hosted runner）。

### 13.8 GitHub OAuth redirect_uri 不匹配

症状：点击「GitHub 登录」后跳转到 GitHub 报错页面，提示 "The redirect_uri is not associated with this application"。

原因：`NEXT_PUBLIC_SITE_URL` 配置的地址与 GitHub OAuth App 的 Authorization callback URL 不一致。

修复：

1. 确认 `.env.local` 中 `NEXT_PUBLIC_SITE_URL` 值（如 `http://121.40.218.245:3000`）。
2. 在 GitHub OAuth App 设置中，确保 Authorization callback URL 为 `http://121.40.218.245:3000/api/auth/callback`。
3. 在 Supabase Authentication > URL Configuration 中，确保 Redirect URL 包含 `http://121.40.218.245:3000/api/auth/callback`。
4. 使用 `pm2 restart project-m --update-env` 重启应用刷新环境变量。

> 注意：协议（http/https）、域名、端口必须完全一致，不能有任何差异。

### 13.9 `pm2 env` 显示环境变量不一致

- 确认修改后执行 `pm2 restart project-m --update-env`。
- 通过 `pm2 env project-m` 检查实际读取值。

### 13.10 Windows 本地 `pnpm test:run` 出现 worker timeout

症状：全部测试逻辑通过，但报告 `Worker exited unexpectedly` 或 `Timeout waiting for worker to respond`。

原因：Vitest 在 Windows 上多 worker 并发时偶发通信超时。

修复：项目已配置 `vitest.config.ts` 使用 `pool: "forks"` + `maxWorkers: 1`，强制顺序执行以规避 Windows worker 超时。Linux CI 环境可酌情调大 `maxWorkers` 提升速度。

---

## 14. 部署检查清单

部署完成后逐项确认：

### 基础设施
- [ ] Ubuntu 22.04 已更新
- [ ] Node.js 20 LTS 已安装
- [ ] pnpm 11.9 已安装
- [ ] PM2 已安装
- [ ] Supabase 数据库已执行 `schema.sql`
- [ ] `.env.local` 已正确配置并放置于 `/var/www/project-m`
- [ ] `pnpm install --frozen-lockfile` 成功
- [ ] `pnpm build` 成功并生成 `.next/standalone/`
- [ ] `pnpm test:run` 通过
- [ ] `node .next/standalone/server.js` 可访问 `http://localhost:3000`
- [ ] PM2 进程运行中且状态为 `online`
- [ ] 修改 `.env.local` 后使用 `--update-env` 重启
- [ ] 防火墙/安全组端口已放行
- [ ] Nginx 反向代理配置正确
- [ ] HTTPS 证书已配置并可自动续期
- [ ] Sentry 未配置时构建不报错
- [ ] GitHub Actions Secrets 已配置，push 到 main 可自动部署

### 核心页面
- [ ] `/` 战术指挥中心主页可正常访问，全息模式选择器交互正常
- [ ] `/landing` 品牌首页可正常访问，舰桥风格叙事 Hero 正常
- [ ] `/login` 页面可正常访问，GitHub 登录按钮可跳转授权页面
- [ ] `/game` 游戏大厅可正常访问，模式选择入口正常
- [ ] `/base` 玩家基地可正常访问
- [ ] `/modes` 模式选择页可正常访问

### 玩法页面
- [ ] `/campaign` 剧情战役页可正常访问，章节节点显示正常
- [ ] `/boss-rush` BossRush 页可正常访问，关卡与首领信息正常
- [ ] `/peak-challenge` 顶峰挑战页可正常访问
- [ ] `/flagship-peak` 旗舰巅峰页可正常访问，三阶段递进、双轨挑战、双维度评级展示正常
- [ ] `/extreme-survival` 极限生存页可正常访问
- [ ] `/season` 赛季页可正常访问并领取奖励

### 归属感页面
- [ ] `/hero-archive` 英雄档案页可正常访问，全部英雄信息正常
- [ ] `/heroes` 页面显示英雄、皮肤、表情、徽章收藏
- [ ] `/chronicles` 维度编年史页可正常访问
- [ ] `/achievements` 成就页可正常访问，进度与奖励正常
- [ ] `/leaderboard` 页面可查看本地最佳与全球榜单

### 社交与世界观
- [ ] `/guild` 公会页可正常访问
- [ ] `/world` 世界观页可正常访问，维度网络节点正常
- [ ] `/armory` 页面显示近战武器（短刃/长枪/重剑/拳套/等离子刃·改）
- [ ] `/enemies` 敌人图鉴页可正常访问

### 工具页面
- [ ] `/algorithms` 页面可正常访问，三引擎仪表盘显示正常
- [ ] `/about` 关于页可正常访问
- [ ] `/help` 帮助页可正常访问
- [ ] `/settings` 设置页可正常访问
- [ ] `/admin` 管理后台可正常访问，需 `ADMIN_KEY`
- [ ] `/404` 自定义 404 页面正常

### 游戏功能
- [ ] 游戏内可选择「旗舰巅峰」，完成三阶段25波挑战
- [ ] 旗舰巅峰结算画面正常显示：三阶段主题切换、粒子动画、扫描线效果
- [ ] 六维雷达评分图正常渲染（速度20%/完美波次20%/连击18%/首领击杀18%/击杀12%/精英击杀12%）
- [ ] 7个隐藏成就（5普通+1稀有+1传说）正确显示与解锁
- [ ] 波次里程碑奖励（5/10/15/20/25波）正常显示
- [ ] 阶段完成奖励（标准/超频/地狱）正常显示
- [ ] 阶段指示器 (PhaseIndicator) 实时切换正常（标准蓝紫→超频红→地狱紫）
- [ ] 游戏内赛季 XP 与赛季货币正确累计并持久化
- [ ] 旗舰模式与极限生存模式成绩可提交到全球排行榜
- [ ] 游戏内新手武器栏包含 2 远程 + 1 近战共 3 把武器
- [ ] 游戏内天气系统效果可见（辐射风暴、酸雨、沙尘暴）
- [ ] Roguelike 模式中诅咒祝福双选弹窗正常显示
- [ ] 多人联机模式下网络预测与状态同步正常
- [ ] 游戏 HUD 显示武器面板、击杀推送、状态效果栏
- [ ] 补给窗口 B/ESC 快捷键正常，倒计时与快速下一波正常
- [ ] 算法页面显示三引擎架构（α / β / 基础设施）

### 视觉验证
- [ ] 全站暗物质紫黑 (#0c0a14) 底色一致
- [ ] 品红全息光 (#c44dff) 主色 + 金色锚点 (#c8a45c) 强调色一致
- [ ] 舰桥面板 (bridge-panel) 样式一致
- [ ] 全息扫描线 (holo-scan) 动画效果正常
- [ ] 页面底部版本水印「奇迹」正确显示
- [ ] 字体为 Cabinet Grotesk / Geist / Outfit / Satoshi（非 Inter）

---

## 15. 关键文件说明

### 15.1 配置文件

| 文件 | 作用 |
|------|------|
| `next.config.mjs` | 控制 standalone 输出、Sentry 自动禁用、测试文件忽略 |
| `tailwind.config.ts` | Tailwind 配色、字体、舰桥动画扩展 |
| `ecosystem.config.cjs` | PM2 生产进程配置（max_memory_restart: 1G, node_args: --max-old-space-size=1536） |
| `.env.local` | 本地/生产环境变量 |
| `vitest.config.ts` | 测试运行池配置（forks + maxWorkers:1） |

### 15.2 部署脚本

| 文件 | 作用 |
|------|------|
| `scripts/deploy-ubuntu.sh` | Ubuntu 服务器一键部署脚本 |
| `scripts/health-check.sh` | 健康检查脚本（需手动创建） |
| `scripts/recover.sh` | 灾难恢复脚本（需手动创建） |
| `.github/workflows/deploy.yml` | push 到 main 自动部署 |
| `nginx/project-m.conf` | Nginx 反向代理配置模板 |
| `supabase/schema.sql` | 数据库建表、RLS、触发器 |

### 15.3 核心库

| 文件 | 作用 |
|------|------|
| `lib/version.ts` | 版本代号「奇迹」(MI-MIRACLE)、品牌名「多重宇宙」、标语 |
| `styles/globals.css` | 全局设计系统：舰桥风格 CSS 变量、动画（holoScan/dataStream/statusPulse）、工具类（bridge-panel/holo-scan/bridge-glow） |
| `components/Layout.tsx` | 全局布局组件，版本水印渲染 |

### 15.4 游戏核心

| 文件 | 作用 |
|------|------|
| `lib/game/engine.ts` | 游戏核心循环、近战攻击/渲染、补给窗口逻辑 |
| `lib/game/types.ts` | 武器/英雄/Boss/存档类型扩展 |
| `lib/game/balance.ts` | 武器平衡数值与升级曲线（含近战） |
| `lib/game/weapons.ts` | 武器创建器与新手武器栏（3 把：2 远程 + 1 近战） |
| `lib/game/heroes.ts` | 英雄定义、技能、天赋与近战联动 |
| `lib/game/ai/` | AI 行为（bot-ai/pathfinding/tactics） |

### 15.5 玩法系统

| 文件 | 作用 |
|------|------|
| `lib/game/campaign.ts` | 剧情战役：章节、节点、进度管理 |
| `lib/game/boss-rush.ts` | BossRush：关卡、首领、奖励机制 |
| `lib/game/peak-challenge.ts` | 顶峰挑战：高难度挑战逻辑 |
| `lib/game/flagship-peak.ts` | 旗舰巅峰：三阶段25波、双轨挑战、双维度评级、统一积分制 |
| `lib/game/flagship-peak-achievements.ts` | 旗舰巅峰成就：7隐藏成就、波次里程碑、阶段奖励、结算计算 |
| `lib/game/season.ts` | 赛季等级、奖励、任务与进度 |
| `lib/game/save.ts` | 本地存档、赛季 XP/货币持久化 |
| `lib/game/weather.ts` | 动态天气系统（辐射风暴、酸雨、沙尘暴） |
| `lib/game/curseBlessing.ts` | 诅咒祝福双选系统 |
| `lib/game/achievements.ts` | 成就系统：定义、进度、奖励 |
| `lib/game/chronicles.ts` | 维度编年史：世界观数据 |

### 15.6 引擎与网络

| 文件 | 作用 |
|------|------|
| `lib/engine/alpha/` | α 引擎：玩家端（DDA、经济平衡、匹配、反作弊） |
| `lib/engine/beta/` | β 引擎：敌方端（Bot AI、生成优化、敌人移动） |
| `lib/engine/infra/` | 基础设施引擎（地图平衡、网络预测） |
| `lib/network/` | 多人联机基础设施（预测、插值、Delta、Jitter、匹配、房间、信令、P2P） |

### 15.7 UI 组件

| 文件 | 作用 |
|------|------|
| `components/Hud.tsx` | HUD 主入口（桌面/移动端路由） |
| `components/game/HudDesktop.tsx` | 桌面 HUD：武器面板、冷却环、击杀推送、状态效果栏 |
| `components/game/HudMobile.tsx` | 移动端 HUD：紧凑状态栏、触控优化 |
| `components/game/KillFeed.tsx` | 实时击杀滚动通知（AnimatePresence + 自动过期） |
| `components/game/SupplyWindow.tsx` | 补给窗口：B/ESC 快捷键、倒计时、快速下一波 |
| `components/game/FlagshipPeakSettlement.tsx` | 旗舰巅峰结算画面：三阶段主题、六维雷达、隐藏成就、里程碑、粒子动画 |
| `components/game/PhaseIndicator.tsx` | 阶段指示器：实时显示当前阶段（标准/超频/地狱），带动态切换动画 |

### 15.8 页面

| 文件 | 作用 |
|------|------|
| `pages/index.tsx` | 战术指挥中心主页（全息模式选择器、舰桥广播） |
| `pages/landing.tsx` | 品牌首页（史诗叙事 Hero、舰桥风格） |
| `pages/login.tsx` | 登录页（GitHub OAuth + 邮箱验证码） |
| `pages/game.tsx` | 游戏大厅 |
| `pages/base.tsx` | 玩家基地 |
| `pages/modes.tsx` | 模式选择 |
| `pages/campaign.tsx` | 剧情战役 |
| `pages/boss-rush.tsx` | BossRush |
| `pages/peak-challenge.tsx` | 顶峰挑战 |
| `pages/flagship-peak.tsx` | 旗舰巅峰（三阶段25波终极挑战） |
| `pages/extreme-survival/index.tsx` | 极限生存 |
| `pages/season.tsx` | 赛季进度与奖励 |
| `pages/hero-archive.tsx` | 英雄档案 |
| `pages/heroes.tsx` | 英雄收藏 |
| `pages/chronicles.tsx` | 维度编年史 |
| `pages/achievements.tsx` | 成就系统 |
| `pages/leaderboard.tsx` | 战绩与全球排行榜 |
| `pages/guild.tsx` | 公会 |
| `pages/world.tsx` | 世界地图（维度网络） |
| `pages/armory.tsx` | 军械库 |
| `pages/enemies.tsx` | 敌人图鉴 |
| `pages/algorithms.tsx` | 算法实验室（三引擎仪表盘） |
| `pages/about.tsx` | 关于 |
| `pages/help.tsx` | 帮助 |
| `pages/settings.tsx` | 设置 |
| `pages/admin.tsx` | 管理后台 |
| `pages/404.tsx` | 自定义 404 |

---

## 16. 奇迹版本内容说明

### 16.1 舰桥指挥舱设计系统

「奇迹」版本全站 30 页面统一采用太空舰桥指挥舱视觉风格。

#### 配色方案

| 角色 | 颜色 | CSS 变量 | 用途 |
|------|------|----------|------|
| 底色 | `#0c0a14` | `--background` | 暗物质紫黑，全站背景 |
| 主强调 | `#c44dff` | `--primary` | 品红全息光，主交互元素 |
| 辅强调 | `#c8a45c` | `--accent` | 金色锚点，高亮重要数据 |
| 面板 | `rgba(255,255,255,0.02)` | `--panel` | 半透明面板背景 |
| 前景 | `#e8e4f0` | `--foreground` | 主文字色 |
| 前景次要 | `#9a95a8` | `--foreground-muted` | 次要文字色 |

#### 核心 CSS 类

| 类名 | 作用 |
|------|------|
| `.bridge-panel` | 舰桥面板：1px 品红边框 + 圆角 + 半透明背景 |
| `.bridge-panel-header` | 面板标题：品红渐变文字 + 底部边框 |
| `.holo-scan` | 全息扫描线：线性渐变 + 4s 循环动画 |
| `.bridge-glow` | 舰桥光晕：品红 box-shadow 辉光效果 |
| `.holo-ring` | 全息环：旋转 border 动画 |
| `.status-pulse` | 状态脉冲：呼吸灯效果 |
| `.data-stream` | 数据流：上下滚动文字动画 |
| `.version-watermark` | 版本水印：右下角「奇迹」标记 |

#### 动画关键帧

| 动画 | 效果 |
|------|------|
| `holoScan` | 全息扫描线从上到下 4s 循环 |
| `dataStream` | 数据流滚动 1s 循环 |
| `statusPulse` | 呼吸脉冲 2s 缓入缓出 |
| `holoRing` | 全息环旋转 8s 线性 |
| `bridgeGlow` | 舰桥光晕脉冲 3s 缓入缓出 |

#### 字体栈

- 标题：Cabinet Grotesk / Outfit
- 正文：Geist / Satoshi
- 等宽数据：JetBrains Mono (font-mono tabular-nums)
- 禁止：Inter

### 16.2 版本代号机制

`lib/version.ts` 定义全站版本常量：

```typescript
VERSION_CODE = "MI-MIRACLE"    // 版本代码
VERSION_DISPLAY = "奇迹"        // 显示名称
VERSION_LABEL = "奇迹 (MI-MIRACLE)"  // 完整标签
VERSION_META_GENERATOR = "多重宇宙 奇迹 (MI-MIRACLE)"  // meta 标签
VERSION_WATERMARK = "奇迹"      // 页面水印

BRAND_NAME = "多重宇宙"         // 品牌名
BRAND_NAME_EN = "Multiverse"   // 品牌英文名
BRAND_TAGLINE = "公平竞技 · 无付费加成"  // 品牌标语
BRAND_URL = "multiverse.game"  // 品牌域名
```

版本水印通过 `components/Layout.tsx` 渲染在所有页面底部。

### 16.3 新增玩法系统

#### 剧情战役 (Campaign)

`lib/game/campaign.ts` + `pages/campaign.tsx`

- 多章节线性叙事，每章包含多个节点
- 节点类型：战斗、Boss、剧情、奖励
- 进度持久化至 `SaveData.campaignProgress`
- 全息地图风格 UI，章节节点可视化

#### BossRush

`lib/game/boss-rush.ts` + `pages/boss-rush.tsx`

- 连续挑战 8 个首领（lancer/charger/spitter/phantom/overlord/juggernaut/weaver/nexus）
- 每个首领有多阶段机制（phases）
- 通关奖励与进度持久化至 `SaveData.bossRushProgress`
- 舰桥面板风格关卡选择

#### 顶峰挑战 (Peak Challenge)

`lib/game/peak-challenge.ts` + `pages/peak-challenge.tsx`

- 高难度挑战模式，含特殊规则与限制
- 独立的挑战进度与奖励系统

#### 旗舰巅峰 (Flagship Peak)

`lib/game/flagship-peak.ts` + `lib/game/flagship-peak-achievements.ts` + `pages/flagship-peak.tsx` + `components/game/FlagshipPeakSettlement.tsx` + `components/game/PhaseIndicator.tsx`

- 旗舰与巅峰模式融合升级，11 种游戏模式中的终极防守体验
- **三阶段25波递进**：标准巡航(1-10) → 超频增压(11-20) → 地狱终局(21-25)
- **双轨挑战系统**：固定挑战（每5波6个）+ 动态任务（超频/地狱阶段专属）
- **双维度评级**：速度评级（青铜→钻石，1.0-1.75倍积分）+ 赛季段位（青铜→宗师）
- **统一积分制**：击杀(10+连击)、精英(+50)、首领(+200)、波次(+50)、完美(+200)、时间奖励
- **三阶段视觉**：舰桥蓝紫→红色警报→黑色虚空，HUD 主题动态切换
- **首领战**：第10波 Overlord、第23波 Annihilator、第25波 Dreadnought
- 难度系数：标准 1.0x → 超频 1.5x → 地狱 2.0x
- 测试覆盖：98 个单元测试（`lib/game/flagship-peak.test.ts`）

##### 独立结算画面

`components/game/FlagshipPeakSettlement.tsx` — 旗舰巅峰模式专属结算画面，电影级视觉动效：

- **三阶段主题**：标准（舰桥蓝紫）→ 超频（深红警报）→ 地狱（黑色虚空），阶段切换带过场动画
- **电影级粒子系统**：按阶段颜色动态生成浮动粒子，粒子密度随阶段递增（标准40→超频55→地狱70）
- **扫描线效果**：全息扫描线动画叠加，增强科技感
- **脉冲波纹**：阶段切换时从中心扩散的脉冲光环
- **滚动数字计数器**：积分、经验、击杀数等数据以平滑动画滚动显示
- **结算流程**：动画阶段 → 评分阶段 → 奖励阶段，三阶段可手动切换

##### 六维雷达评分

`components/game/FlagshipPeakSettlement.tsx` 内 RadarChart 组件：

| 维度 | 权重 | 说明 |
|------|------|------|
| 速度 | 20% | 通关速度评级，越快分越高 |
| 完美波次 | 20% | 无伤波次占比 |
| 连击 | 18% | 最大连击数与平均连击 |
| 首领击杀 | 18% | 首领击杀速度与效率 |
| 击杀 | 12% | 总击杀数评分 |
| 精英击杀 | 12% | 精英敌人击杀数评分 |

- SVG 六边形雷达图，带渐变填充与动画描边
- 各维度标签带百分比显示
- 总分 = 各维度加权求和

##### 隐藏成就系统

`lib/game/flagship-peak-achievements.ts` — 7 个成就（5 核心 + 1 稀有 + 1 传说）：

| 成就 ID | 名称 | 稀有度 | 达成条件 |
|---------|------|--------|----------|
| `no_damage_10` | 钢铁防线 | 普通 | 前10波核心不受任何伤害 |
| `speed_demon` | 极速传说 | 普通 | 全部25波速度评级达到S |
| `combo_master` | 连击大师 | 普通 | 达成100+连击 |
| `perfectionist` | 完美主义者 | 普通 | 全部6个固定挑战完成 |
| `survivor` | 不屈意志 | 普通 | 0死亡完成全部25波 |
| `immortal` | 不朽传奇 | 稀有 | 同时达成「钢铁防线」+「完美主义者」+「不屈意志」 |
| `void_lord` | 虚空之主 | 传说 | 同时达成「不朽传奇」+「三阶全S」+「挑战征服者」 |

- 未解锁成就显示为灰色锁定状态
- 解锁时带粒子爆发动画
- 结算画面中按稀有度排序展示

##### 波次里程碑奖励

| 波次 | 里程碑 | 奖励 |
|------|--------|------|
| 5波 | 初战告捷 | 基础战利品箱 |
| 10波 | 标准通关 | 阶段宝箱（标准） |
| 15波 | 超频适应 | 高级战利品箱 |
| 20波 | 超频通关 | 阶段宝箱（超频） |
| 25波 | 地狱征服 | 阶段宝箱（地狱）+ 传说印记 |

##### 阶段完成奖励

| 阶段 | 奖励 |
|------|------|
| 标准巡航 (1-10) | 经验 + 赛季积分 + 基础宝箱 |
| 超频增压 (11-20) | 经验(1.5x) + 赛季积分(1.5x) + 高级宝箱 |
| 地狱终局 (21-25) | 经验(2.0x) + 赛季积分(2.0x) + 传说宝箱 + 赛季称号 |

##### 实时HUD显示

`components/game/HudDesktop.tsx` + `components/game/HudMobile.tsx` — 旗舰巅峰模式专属HUD面板：

- 当前积分（带连击倍率显示）
- 当前连击计数（Combo xN）
- 活跃挑战任务（固定挑战 + 动态任务）
- 阶段指示器（PhaseIndicator 组件，带阶段切换动画）
- 下一波预览（波次编号 + 难度提示）

##### 阶段指示器

`components/game/PhaseIndicator.tsx` — 实时显示当前阶段：

- 标准阶段：蓝色图标 + 舰桥蓝紫边框
- 超频阶段：红色图标 + 脉冲动画 + 红色警报边框
- 地狱阶段：紫色图标 + 虚空主题 + 紫色边框
- 阶段切换时带 scale + opacity 过渡动画
- 支持 `prefers-reduced-motion` 无障碍适配

### 16.4 归属感系统

#### 成就系统

`lib/game/achievements.ts` + `pages/achievements.tsx`

- 多类别成就定义（战斗/探索/收集/社交/赛季）
- 进度追踪与奖励发放
- 舰桥面板风格成就展示

#### 玩家成长

`pages/base.tsx`

- 玩家等级、经验进度条
- 总游戏时长、击杀数等统计数据
- 维度跃迁状态指示器

#### 收藏进度

`pages/heroes.tsx` + `pages/armory.tsx` + `pages/enemies.tsx`

- 已收集英雄、武器、皮肤、表情、徽章
- 已击败 Boss 图鉴
- 收藏完成度百分比

### 16.5 世界观内容

#### 英雄档案

`pages/hero-archive.tsx`

- 全部可玩英雄详细信息（背景故事、技能、天赋）
- 全息卡片风格展示

#### 维度编年史

`lib/game/chronicles.ts` + `pages/chronicles.tsx`

- 游戏世界历史事件时间线
- 维度设定与背景叙事

### 16.6 近战武器概览

| 武器 ID | 名称 | 类型 | 机制 | 定位 |
|---------|------|------|------|------|
| `shortBlade` | 碳钢短刃 | 基础近战 | 扇形瞬发 (`arc`) | 高攻速、小范围、清杂兵 |
| `spear` | 合金长枪 | 基础近战 | 短程弹道突刺 (`thrust`) | 中距离直线穿透 |
| `greatsword` | 重型大剑 | 基础近战 | 短程弹道突刺 (`thrust`) | 慢速、高伤、重击破甲 |
| `gauntlet` | 脉冲拳套 | 基础近战 | 扇形瞬发 (`arc`) | 超高速连击、大角度 |
| `plasmaBlade` | 等离子刃·改 | 进阶近战 | 扇形瞬发 (`arc`) | 高伤能量斩击 + 灼烧 |

### 16.7 双攻击机制

- **扇形瞬发 (`arc`)**：短刃、拳套、等离子刃·改。以玩家面朝方向为中心，`meleeAngle` 扇形检测，命中最多 `pierce + 1` 个敌人。瞬时伤害，无飞行弹道。
- **短程弹道突刺 (`thrust`)**：长枪、重剑。短寿命穿透弹道，沿直线命中多个敌人。

### 16.8 新手武器栏

```typescript
getStarterWeapons() // [pulseRifle, shotgun, spear] = 2 远程 + 1 近战
```

### 16.9 英雄技能实用性增强

关键 Bug 修复：非防御模式下技能完全无法使用（`if (!ds) return;` 守卫拦截）。修复方案：移除强制检查，改为双存储降级策略，新增全局 `deployables` 字段。

| 英雄 | 技能 | 修复前 | 修复后 |
|------|------|--------|--------|
| 液氮 (Nitrogen) | 绝对零度 伤害 | 420 | 480 |
| 液氮 (Nitrogen) | 绝对零度 冻结时长 | 3.2s | 3.5s |
| 液氮 (Nitrogen) | 绝对零度 碎裂伤害 | 260 | 300 |
| 豹 (Leopard) | 速度倍率重置 | 1.12 | 1.15 |
| 豹 (Leopard) | 狂乱状态 暴击率 | 25% | 30% |
| 豹 (Leopard) | 狂乱状态 速度 | 35% | 40% |
| 豹 (Leopard) | 狂乱状态 时长 | 8s | 10s |
| 蝰蛇 (Viper) | 毒液 DOT 每层 | 10/s | 12/s |
| 蝰蛇 (Viper) | 尸体爆发 伤害 | 100 | 130 |
| 猎鹰 (Recon) | 终极技能 伤害 | 420 | 500 |
| 暮蝶 (Twilight) | 茧 治疗量 | 120 | 150 |

### 16.10 近战天赋联动

- **豹（leopard）- 利刃精通**：近战武器伤害 +12%，攻击范围 +8%
- **蝰蛇（viper）- 毒刃**：近战武器伤害 +10%，近战命中附加 2 秒毒素（每秒 15 伤害）

### 16.11 三引擎算法架构

| 引擎 | 定位 | 包含算法 | 文件 |
|------|------|----------|------|
| α 引擎 | 玩家端 | DDA 动态难度、经济平衡、匹配系统、奖励推荐、内容推荐、反作弊 | `lib/engine/alpha/` |
| β 引擎 | 敌方端 | Bot AI、生成优化、敌人移动 | `lib/engine/beta/` |
| 基础设施引擎 | 共享 | 地图平衡、网络预测 | `lib/engine/infra/` |

算法页面 `/algorithms` 以三引擎仪表盘形式展示所有引擎的实时演示。

### 16.12 动态天气系统

| 天气 | 视觉效果 | 玩家影响 | 敌人影响 |
|------|----------|----------|----------|
| 辐射风暴 | 绿色粒子、屏幕闪烁 | 移速 -15%、持续伤害 2/s | 移速 +10% |
| 酸雨 | 蓝色下落粒子、屏幕腐蚀 | 护甲 -30%、移速 -10% | 生命回复 +5/s |
| 沙尘暴 | 棕色粒子、视野缩小 | 视野 -40%、移速 -20% | 无影响 |

### 16.13 诅咒祝福双选系统

Roguelike 模式每次升级时二选一：

- **诅咒（Curse）**：负面效果 + 高额奖励
- **祝福（Blessing）**：纯正面增益

### 16.14 多人联机基础设施

| 模块 | 文件 | 功能 |
|------|------|------|
| 网络预测 | `prediction.ts` | 客户端输入预测 + 服务端状态校正 |
| Jitter 缓冲 | `jitter.ts` | 输入缓冲、重放、乱序处理 |
| Delta 同步 | `delta.ts` | 增量状态编码/解码，减少带宽 |
| 连接质量 | `quality.ts` | 延迟、丢包率、带宽实时监控 |
| 匹配队列 | `matchmaking.ts` | 基于技能分 + 延迟的匹配算法 |
| 房间管理 | `room.ts` | 多人房间生命周期、心跳、广播 |
| 信令服务 | `signaling.ts` | WebRTC 信令交换 |
| 点对点连接 | `peer.ts` | WebRTC DataChannel 封装 |

### 16.15 HUD 旗舰重设计

| 组件 | 文件 | 功能 |
|------|------|------|
| HUD 主入口 | `components/Hud.tsx` | 桌面/移动端自动路由、HUD 缩放 |
| 桌面 HUD | `components/game/HudDesktop.tsx` | 玩家状态面板、武器面板、技能按钮、击杀推送、统计行 |
| 移动 HUD | `components/game/HudMobile.tsx` | 紧凑状态栏、触控优化技能按钮、防守模式指示器 |
| 击杀推送 | `components/game/KillFeed.tsx` | 实时滚动击杀通知（AnimatePresence + 自动过期） |
| 补给窗口 | `components/game/SupplyWindow.tsx` | B/ESC 快捷键、倒计时、快速下一波 |

新增特性：

- **武器面板**：冷却环（SVG 圆环进度），就绪/冷却状态区分
- **状态效果栏**：护甲、暴击、回复、范围等被动效果可视化标签
- **渐变血条**：绿/黄/红三色渐变，低血量脉冲动画
- **击杀推送**：滚动显示击杀者、武器、受害者，自动消失
- **连杀指示器**：底部进度条显示连杀窗口剩余时间
- **补给窗口**：B/ESC 快捷键控制，倒计时自动跳过，快速下一波按钮

### 16.16 测试覆盖

- `lib/game/weapons.test.ts`：新手武器栏、近战武器创建器
- `lib/game/balance.test.ts`：武器平衡数值、升级曲线、弹速例外
- `lib/game/engine.test.ts`：扇形/突刺命中判定、伤害结算
- `lib/game/heroes.test.ts`（45 tests）：英雄技能数值、天赋应用、冻结场 tick 逻辑
- `lib/game/ai.test.ts`：AI 行为适配近战范围

---

## 17. 监控与日志

### 17.1 PM2 进程监控

```bash
pm2 monit                  # 实时监控面板
pm2 status                 # 进程列表与状态
pm2 logs project-m --lines 200 --nostream  # 查看最近日志
pm2 logs project-m --lines 0                 # 实时跟踪日志
```

### 17.2 日志轮转

PM2 默认日志无限增长，必须配置轮转：

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:workerInterval 30
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
pm2 set pm2-logrotate:rotateModule true
```

### 17.3 系统资源监控

```bash
# 实时资源
htop                      # CPU/内存
df -h                     # 磁盘空间
sudo ss -tlnp             # 端口监听

# 定时资源检查脚本
cat > /var/www/project-m/scripts/health-check.sh << 'SCRIPT'
#!/bin/bash
echo "=== $(date) ==="
echo "--- Disk ---"
df -h / | tail -1
echo "--- Memory ---"
free -h | grep Mem
echo "--- PM2 ---"
pm2 jlist | grep -E '"status"|"memory"|"cpu"'
echo "--- Load ---"
uptime
SCRIPT
chmod +x /var/www/project-m/scripts/health-check.sh
```

### 17.4 应用层健康检查接口

```bash
curl http://localhost:3000/api/health
# 预期返回: {"status":"ok","timestamp":"..."}
```

### 17.5 告警阈值建议

| 指标 | 告警阈值 | 处理方式 |
|------|----------|----------|
| CPU 使用率 | > 80% 持续 5 分钟 | 检查进程、考虑升级 |
| 内存使用率 | > 85% | 检查内存泄漏、重启 |
| 磁盘使用率 | > 80% | 清理日志、扩容 |
| PM2 进程重启 | 1 小时内 > 3 次 | 查看日志排查根因 |
| 健康检查失败 | 连续 2 次 | 自动重启或人工介入 |

---

## 18. 备份与恢复

### 18.1 备份策略

| 备份对象 | 频率 | 方式 | 保留 |
|----------|------|------|------|
| Supabase 数据库 | 每日自动 | Supabase 内置备份（Pro 计划） | 7 天 |
| 数据库手动导出 | 每周 | `pg_dump` 导出 SQL 文件 | 4 周 |
| 环境变量 | 每次变更 | `.env.local` 备份到安全位置 | 永久 |
| 日志文件 | 按 PM2 logrotate | 自动轮转压缩 | 7 天 |

### 18.2 数据库手动备份

```bash
# 安装 PostgreSQL 客户端
sudo apt install postgresql-client -y

# 导出 Supabase 数据库
pg_dump "postgresql://postgres:[YOUR_PASSWORD]@[YOUR_HOST]:5432/postgres" \
  --file="/var/backups/project-m-$(date +%Y%m%d).sql"

# 仅导出 schema（不含数据）
pg_dump --schema-only \
  "postgresql://postgres:[YOUR_PASSWORD]@[YOUR_HOST]:5432/postgres" \
  --file="/var/backups/project-m-schema-$(date +%Y%m%d).sql"
```

### 18.3 代码备份

```bash
tar -czf "/var/backups/project-m-code-$(date +%Y%m%d).tar.gz" \
  --exclude=node_modules --exclude=.next --exclude=.git \
  /var/www/project-m
```

### 18.4 恢复流程

```bash
# 1. 恢复代码
cd /var/www
git clone https://github.com/Hao-1031/ProjectM.git project-m
cd project-m
git checkout <target-commit>

# 2. 恢复环境变量
cp /secure/backup/.env.local /var/www/project-m/.env.local

# 3. 恢复数据库（在 Supabase SQL Editor 中执行备份 SQL）

# 4. 构建并启动
pnpm install --frozen-lockfile
pnpm build
pm2 start ecosystem.config.cjs --env production
pm2 save
```

---

## 19. 性能优化

### 19.1 Next.js 构建优化

`next.config.mjs` 已配置：

- `output: "standalone"`：独立部署（Linux 生产环境），减少依赖体积
- `staticPageGenerationTimeout: 300`：放宽静态生成超时至 5 分钟
- 测试文件排除：`test Match`、`spec Match`、`test` 目录

### 19.2 静态资源优化

- 所有图片使用 Next.js `Image` 组件（自动 WebP 转换、懒加载）
- 字体使用 `next/font`（自动子集化、无外部请求）
- 图标使用 Phosphor（按需加载，无全量引入）

### 19.3 Nginx 优化

```nginx
# 在 server 块中添加
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript
           application/javascript application/json application/xml
           image/svg+xml;

# 静态资源缓存
location /_next/static/ {
  expires 365d;
  add_header Cache-Control "public, immutable";
}
```

### 19.4 内存优化

```bash
# PM2 内存限制（ecosystem.config.cjs）
max_memory_restart: "1G"                          # 超过 1GB 自动重启
node_args: "--max-old-space-size=1536 --optimize-for-size"  # V8 堆上限 1.5GB + 优化体积
```

---

## 20. 安全加固

### 20.1 服务器层面

```bash
# 禁用 root SSH 密码登录
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# 安装 fail2ban 防暴力破解
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# 自动安全更新
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 20.2 应用层面

- API 路由已集成 `applySecurityHeaders`（CSP、X-Frame-Options、X-Content-Type-Options 等）
- 算法/公告/排行榜 API 已集成 `rateLimiter` 频率限制
- 算法路由已添加 `sanitizeInput` 输入验证与错误信息净化
- `ADMIN_KEY` 用于管理后台认证，生成方式：`openssl rand -base64 32`

### 20.3 定期安全检查

```bash
# 检查开放端口
sudo ss -tlnp

# 检查异常登录
sudo last -20

# 检查失败登录尝试
sudo grep "Failed password" /var/log/auth.log | tail -20

# 更新系统
sudo apt update && sudo apt upgrade -y
```

---

## 21. 灾难恢复

### 21.1 场景与应对

| 场景 | 检测方式 | 恢复步骤 |
|------|----------|----------|
| 服务器宕机 | 阿里云监控 / UptimeRobot | 阿里云控制台重启实例，PM2 自动启动 |
| 应用崩溃 | PM2 自动重启 | PM2 自动重启，检查日志确认根因 |
| 数据库不可用 | API 返回错误 | 确认 Supabase 状态页，切换本地存档模式 |
| 域名过期 | 浏览器证书错误 | 续费域名，重新申请 SSL 证书 |
| 磁盘满 | 健康检查脚本告警 | 清理日志，`pm2 flush`，扩容磁盘 |
| 安全入侵 | 异常日志/进程 | 隔离服务器，恢复备份，重置密钥 |

### 21.2 快速恢复脚本

```bash
#!/bin/bash
# 灾难恢复脚本: /var/www/project-m/scripts/recover.sh
set -e

echo "=== Project-M 灾难恢复 ==="
echo "1. 停止旧进程..."
pm2 stop project-m 2>/dev/null || true

echo "2. 拉取最新代码..."
cd /var/www/project-m
git fetch origin
git reset --hard origin/main

echo "3. 安装依赖..."
pnpm install --frozen-lockfile

echo "4. 构建..."
pnpm build

echo "5. 启动服务..."
pm2 start ecosystem.config.cjs --env production
pm2 save

echo "6. 验证..."
sleep 3
curl -s http://localhost:3000/api/health

echo "=== 恢复完成 ==="
```

---

## 22. 运维命令速查

```bash
# 应用管理
pm2 status                    # 查看进程状态
pm2 restart project-m         # 重启应用
pm2 restart project-m --update-env  # 刷新环境变量后重启
pm2 logs project-m --lines 100      # 查看日志
pm2 flush                     # 清空日志

# 构建
cd /var/www/project-m
git pull origin main
pnpm install --frozen-lockfile
pnpm build
pm2 restart project-m --update-env

# 系统
htop                          # 进程监控
df -h                         # 磁盘
free -h                       # 内存
sudo systemctl status nginx   # Nginx 状态
sudo nginx -t                 # Nginx 配置测试
sudo systemctl reload nginx   # 重载 Nginx
sudo certbot renew --dry-run  # SSL 续期测试

# 网络
sudo ss -tlnp                 # 端口监听
sudo ufw status verbose       # 防火墙状态
curl -I https://your-domain.com  # HTTP 响应头检查
```

---

## 23. 运营相关文件

| 文件 | 说明 |
|------|------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 本部署手册 |
| [docs/OPERATIONS.md](./docs/OPERATIONS.md) | 游戏运营方向完整评估 |
| [supabase/schema.sql](./supabase/schema.sql) | 数据库建表脚本 |
| [scripts/deploy-ubuntu.sh](./scripts/deploy-ubuntu.sh) | 一键部署脚本 |
| [scripts/health-check.sh](./scripts/health-check.sh) | 健康检查脚本（需手动创建） |
| [scripts/recover.sh](./scripts/recover.sh) | 灾难恢复脚本（需手动创建） |

---

## 24. OAuth 配置速查表

| 配置项 | 生产环境值（IP 方式） | 生产环境值（域名方式） |
|--------|---------------------|---------------------|
| `NEXT_PUBLIC_SITE_URL` | `http://121.40.218.245:3000` | `https://your-domain.com` |
| GitHub OAuth Homepage URL | `http://121.40.218.245:3000` | `https://your-domain.com` |
| GitHub OAuth Authorization callback URL | `http://121.40.218.245:3000/api/auth/callback` | `https://your-domain.com/api/auth/callback` |
| Supabase Site URL | `http://121.40.218.245:3000` | `https://your-domain.com` |
| Supabase Redirect URL | `http://121.40.218.245:3000/api/auth/callback` | `https://your-domain.com/api/auth/callback` |

---

*本手册对应多重宇宙「奇迹」版本一次性全部上线部署流程。全站 31 页面太空舰桥指挥舱风格重设计，品牌名「多重宇宙 (Multiverse)」，版本代号「奇迹」(MI-MIRACLE)。当前版本注册/登录功能已启用，支持 GitHub OAuth；所有游戏模式（含旗舰巅峰三阶段25波终极挑战）、剧情战役、BossRush、成就系统、英雄档案、维度编年史、算法页面、排行榜、近战武器系统与英雄技能增强均可公开访问。*