# 多重宇宙「破晓」完整生产部署手册

> 目标环境：阿里云 Ubuntu 22.04 LTS（64 位）
> 技术栈：Next.js 14 + pnpm 11.9 + Node.js 20 LTS
> 部署方式：源码构建 + standalone 输出 + PM2 守护 + Nginx 反向代理 + Certbot HTTPS + GitHub Actions 自动部署
> 当前版本特性：全站 36 页面双主题设计系统；品牌名「多重宇宙 (Multiverse)」；PvE 米白色中国航天风 + PvP 工业擂台暗色风格；版本代号「破晓」(DR-DAYBREAK)；设计旋钮: PvE(DESIGN_VARIANCE=9, MOTION_INTENSITY=4, VISUAL_DENSITY=3) / PvP(DESIGN_VARIANCE=7, MOTION_INTENSITY=8, VISUAL_DENSITY=5)；字体: Geist Sans + Geist Mono；注册/登录已启用，支持 GitHub OAuth 与微信验证码登录；剧情战役 + BossRush 玩法系统；旗舰巅峰MAX模式（六阶段50波终极挑战，含Boss变异系统 + 英雄技能树 + 武器改装锻造 + 2人联机协作 + 独立结算画面 + 六维雷达评分 + 11个隐藏成就系统 + 10级波次里程碑奖励 + 6阶段完成奖励 + 实时HUD显示）；PvP 1v1 积分决斗（BO3/BO5 回合制 + 休闲匹配 + 天梯排位 + 自定义房间 + 战绩历史 + 4英雄 + 6武器 + 8地图）；混合连接网络架构（局域网自动发现 + 房间码直连 + 服务端中转）；单进程集成部署（Next.js + WebSocket 信令合并）；归属感系统（成就/成长/收藏）；世界观内容（英雄档案/维度编年史）；三引擎算法架构（α 玩家端 / β 敌方端 / 基础设施）；动态天气系统（辐射风暴、酸雨、沙尘暴）；诅咒祝福双选系统；多人联机基础设施；HUD 旗舰重设计；近战武器系统（4 基础 + 1 进阶）；英雄技能实用性增强；阶段视觉变色机制（深渊墨→虚空白→创世极光）；事件总线 + 监测面板（15分类×70+事件类型，~/F1 快捷键呼出）；智能敌方 AI 系统（能力门控 + 群体协作 + 学习适应 + Boss 状态机增强）

---

## 1. 交付物与范围

本次部署为「破晓」版本一次性全部上线，包含全站 36 个页面的双主题设计系统及全部玩法系统。

### 1.1 全站页面清单（36 页）

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
| 旗舰巅峰 | `pages/flagship-peak.tsx` | 六阶段50波终极挑战，Boss变异+技能树+武器锻造+2人联机 |
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
| **PvP 大厅** | `pages/pvp/index.tsx` | 竞技入口：休闲匹配/自定义房间/天梯排位，战绩统计 |
| **PvP 决斗** | `pages/pvp/duel.tsx` | 1v1 决斗画面：倒计时/英雄信息/回合结果 |
| **PvP 匹配** | `pages/pvp/matchmaking.tsx` | 休闲匹配：英雄选择/武器选择/赛制选择 |
| **PvP 自定义房间** | `pages/pvp/custom-room.tsx` | 自定义房间：创建/加入/设置/准备 |
| **PvP 战绩** | `pages/pvp/history.tsx` | 战绩列表：胜负统计/段位/历史记录 |

### 1.2 核心系统模块

| 模块 | 路径/文件 | 说明 |
|------|-----------|------|
| 版本常量 | `lib/version.ts` | 版本代号「破晓」(DR-DAYBREAK)、品牌名、标语、双主题设计系统 |
| 全局设计系统 | `styles/globals.css` | 双主题 CSS 变量（PvE 航天风 + PvP 工业擂台风）、动画、工具类 |
| Tailwind 配置 | `tailwind.config.ts` | 配色、字体、动画扩展 |
| 全局布局 | `components/Layout.tsx` | 版本水印、导航栏（含 PvP 竞技入口） |
| 游戏核心 | `lib/game/engine.ts`, `lib/game/types.ts` | 游戏循环、类型定义 |
| 剧情战役 | `lib/game/campaign.ts` | 章节、节点、进度管理 |
| BossRush | `lib/game/boss-rush.ts` | 关卡、首领、奖励机制 |
| 顶峰挑战 | `lib/game/peak-challenge.ts` | 高难度挑战逻辑 |
| 旗舰巅峰 | `lib/game/flagship-peak.ts` | 六阶段50波、双轨挑战、双维度评级、统一积分制 |
| 旗舰巅峰MAX | `lib/game/flagship-peak.ts`, `lib/game/flagship-peak-achievements.ts`, `lib/game/boss-variants.ts`, `lib/game/hero-skill-tree.ts`, `lib/game/weapon-forge.ts`, `lib/network/coop-room.ts`, `lib/network/signaling.ts`, `lib/network/peer.ts` | Boss变异系统(18种)、英雄技能树(3分支×5层)、武器改装锻造(30模块)、2人联机协作、阶段视觉变色(深渊墨→虚空白→创世极光)、11隐藏成就、10级里程碑 |
| 成就系统 | `lib/game/achievements.ts` | 成就定义、进度、奖励 |
| 编年史 | `lib/game/chronicles.ts` | 世界观数据 |
| 赛季系统 | `lib/game/season.ts`, `lib/game/save.ts` | 赛季等级、奖励、任务与持久化 |
| 天气系统 | `lib/game/weather.ts` | 辐射风暴、酸雨、沙尘暴 |
| 诅咒祝福 | `lib/game/curseBlessing.ts` | Roguelike 二选一配对系统 |
| 三引擎架构 | `lib/engine/alpha/`, `lib/engine/beta/`, `lib/engine/infra/` | α 玩家端 / β 敌方端 / 基础设施 |
| 多人联机 | `lib/network/` | 预测、插值、Delta、Jitter、匹配、房间、信令、P2P |
| 近战武器 | `lib/game/balance.ts`, `lib/game/weapons.ts` | 4 基础 + 1 进阶，扇形/突刺双机制 |
| 英雄系统 | `lib/game/heroes.ts` | 全英雄数值/冷却/效果，近战天赋联动 |
| HUD 系统 | `components/Hud.tsx`, `components/game/HudDesktop.tsx`, `components/game/HudMobile.tsx`, `components/game/KillFeed.tsx` | 武器面板、击杀推送、状态效果栏 |
| 补给窗口 | `components/game/SupplyWindow.tsx` | B/ESC 快捷键、倒计时、快速下一波 |
| 事件总线 | `lib/game/event-bus.ts` | 统一游戏事件总线，环形缓冲区(1000条)，15分类×70+事件类型，订阅/发布/过滤/搜索/暂停/导出 |
| 监测面板 | `components/game/EventMonitor.tsx` | ~/F1快捷键悬浮面板，实时事件流，分类过滤，关键词搜索，统计摘要，JSON导出 |
| **PvP 核心** | `lib/game/pvp/` | PvP 类型定义、英雄、武器、地图、决斗逻辑、匹配、自定义房间、战绩 |
| **混合连接网络** | `lib/network/multiplayer-v2.ts`, `lib/network/lan-discovery.ts`, `lib/network/room-code.ts`, `lib/network/server-relay.ts` | 局域网自动发现 + 房间码直连 + 服务端中转三种混合连接模式 |
| **集成服务器** | `server.mjs` | Next.js + WebSocket 信令单进程集成入口 |
| Supabase 后端 | `lib/supabase/`, `supabase/schema.sql` | Postgres 数据库与类型契约 |
| 进程管理 | `ecosystem.config.cjs` | PM2 单进程生产配置 |
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
| `NEXT_PUBLIC_SIGNALING_URL` | 手动 | 否 | WebSocket 信令服务器地址，跨设备组队和 PvP 联机需要；生产 `wss://your-domain.com/signaling/`；不配置则仅支持同设备组队 |

> **破晓版本变更**：WebSocket 信令已集成到主进程（端口 3000），不再需要独立端口 3001。`NEXT_PUBLIC_SIGNALING_URL` 的路径为 `/signaling/`（同域），而非独立端口。

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

### 7.1 破晓版本架构变更

**破晓版本将 WebSocket 信令服务器集成到 Next.js 主进程中，实现单进程部署。** 不再需要独立的信令服务器进程（端口 3001）。

```
旧架构（梦想家）：Next.js(:3000) + 信令服务器(:3001) = 双进程
新架构（破晓）：  server.mjs(:3000) = 单进程（Next.js + WebSocket 信令合并）
```

### 7.2 直接启动（仅调试用）

```bash
cd /var/www/project-m
node server.mjs
```

默认监听 `http://0.0.0.0:3000`。

### 7.3 PM2 生产守护（单进程）

```bash
cd /var/www/project-m
mkdir -p logs

pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd
```

> `pm2 startup systemd` 会输出一条命令，复制并执行它以设置开机自启。

`ecosystem.config.cjs` 已配置单进程：

| 进程名 | 端口 | 脚本 | 说明 |
|--------|------|------|------|
| `project-m` | 3000 | `server.mjs` | Next.js + WebSocket 信令集成进程 |

常用命令：

```bash
pm2 status
pm2 logs project-m --lines 100
pm2 restart project-m
pm2 restart all
pm2 stop all
pm2 delete all
```

### 7.4 更新环境变量后重启

修改 `.env.local` 后，PM2 不会自动重新加载环境变量，必须使用：

```bash
pm2 restart project-m --update-env
```

> 常见坑：仅执行 `pm2 restart project-m` 不会刷新 `.env.local` 中的变量，可能导致 OAuth 登录等接口读取到旧值。

### 7.5 信令服务说明

信令服务已集成到 `server.mjs` 中，通过 WebSocket 升级连接处理 `/signaling/` 路径的请求。不再需要独立的信令服务器进程或端口。

**工作原理**：

```
客户端A ←→ WebSocket ←→ server.mjs (:3000) ←→ WebSocket ←→ 客户端B
                              ↓
                    /signaling/ 路径自动升级
```

1. 客户端通过 WebSocket 连接到 `wss://your-domain.com/signaling/`
2. `server.mjs` 中的 `createSignalingServer` 处理 WebSocket 升级
3. 创建/加入房间时，信令服务器广播房间成员列表
4. 客户端之间交换 WebRTC SDP (offer/answer) 和 ICE candidates
5. 建立 P2P DataChannel 后，游戏数据直接传输

**环境变量**：

| 变量 | 必填 | 说明 |
|------|------|------|
| `NEXT_PUBLIC_SIGNALING_URL` | 否 | 客户端连接地址，生产环境填 `wss://your-domain.com/signaling/`；不配置则仅支持同设备组队 |

**验证信令服务**：

```bash
# 检查进程
pm2 status

# 检查端口
sudo ss -tlnp | grep 3000

# 日志
pm2 logs project-m --lines 50
```

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

> **破晓版本变更**：不再需要开放端口 3001（信令已集成到 3000 端口）。

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
upstream project_m_app {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
  listen 80;
  server_name your-domain.com;

  # WebSocket 信令服务器代理（已集成到主进程，同端口 3000）
  location /signaling/ {
    proxy_pass http://project_m_app;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_buffering off;
    proxy_connect_timeout 120s;
    proxy_send_timeout 86400s;
    proxy_read_timeout 86400s;
  }

  location / {
    proxy_pass http://project_m_app;
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

> **破晓版本变更**：`/signaling/` 代理目标已从 `project_m_signaling` 改为 `project_m_app`，不再需要独立的信令 upstream。

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
- `server.mjs` 路径错误（未重新构建 standalone）。

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

### 13.11 信令服务不可用（PvP 联机失败）

症状：PvP 匹配或自定义房间无法连接，浏览器控制台显示 WebSocket 连接失败。

原因：

1. `NEXT_PUBLIC_SIGNALING_URL` 未配置或配置错误。
2. Nginx 未正确代理 `/signaling/` 路径。
3. 防火墙阻止了 WebSocket 升级。

修复：

1. 确认 `.env.local` 中 `NEXT_PUBLIC_SIGNALING_URL` 配置正确：`wss://your-domain.com/signaling/`。
2. 确认 Nginx 配置中 `/signaling/` location 已正确代理到 `project_m_app`。
3. 确认 Nginx 配置中包含 `proxy_set_header Upgrade $http_upgrade` 和 `proxy_set_header Connection "upgrade"`。
4. 使用 `pm2 restart project-m --update-env` 重启应用。

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
- [ ] `node server.mjs` 可访问 `http://localhost:3000`
- [ ] PM2 进程运行中且状态为 `online`（单进程：project-m）
- [ ] `NEXT_PUBLIC_SIGNALING_URL` 已配置（生产环境）
- [ ] 修改 `.env.local` 后使用 `--update-env` 重启
- [ ] 防火墙/安全组端口已放行（仅需 80/443/22，不再需要 3001）
- [ ] Nginx 反向代理配置正确（`/signaling/` 代理至 `project_m_app`）
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
- [ ] `/flagship-peak` 旗舰巅峰页可正常访问，六阶段50波递进、Boss变异、技能树、武器锻造、2人联机展示正常
- [ ] `/extreme-survival` 极限生存页可正常访问
- [ ] `/season` 赛季页可正常访问并领取奖励

### PvP 页面（破晓新增）
- [ ] `/pvp` PvP 大厅页面可正常访问，三种模式入口正常，战绩统计正常
- [ ] `/pvp/duel` PvP 决斗页面可正常访问，倒计时、英雄信息、回合结果正常
- [ ] `/pvp/matchmaking` PvP 匹配页面可正常访问，英雄/武器/赛制选择正常
- [ ] `/pvp/custom-room` PvP 自定义房间页面可正常访问，创建/加入/设置/准备正常
- [ ] `/pvp/history` PvP 战绩页面可正常访问，战绩列表、胜负统计、段位正常

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
- [ ] 游戏内可选择「旗舰巅峰」，完成六阶段50波挑战
- [ ] 旗舰巅峰结算画面正常显示：六阶段主题切换、粒子动画、扫描线效果
- [ ] 六维雷达评分图正常渲染
- [ ] 11个隐藏成就正确显示与解锁
- [ ] 波次里程碑奖励正常显示
- [ ] 阶段完成奖励正常显示
- [ ] 阶段指示器实时切换正常（标准蓝紫→超频红→地狱紫→深渊墨黑→虚空纯白→创世极光）
- [ ] Boss变异系统正常（各阶段随机3种变异形态）
- [ ] 英雄技能树正常（3分支×5层级，创世阶段觉醒）
- [ ] 武器改装锻造正常（30种模块，波间锻造台）
- [ ] 2人联机协作正常（WebSocket信令 + WebRTC P2P）
- [ ] PvP 1v1 决斗可正常创建和进行
- [ ] PvP 休闲匹配可正常排队并匹配
- [ ] PvP 自定义房间可正常创建和加入
- [ ] PvP 战绩可正常记录和查询
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
- [ ] PvE 页面米白色 (#F5F2ED) 底色一致
- [ ] PvE 页面深空蓝 (#0B1D3A) 主色 + 航天金 (#C8A45C) 强调色 + 轨道蓝 (#3B7DD8) 数据色一致
- [ ] PvP 页面暗色 (#1A1A1E) 底色一致
- [ ] PvP 页面焦橙 (#E8652C) 主色 + 热金 (#FFB84D) 强调色一致
- [ ] 页面底部版本水印「破晓」正确显示
- [ ] 字体为 Geist Sans / Geist Mono（非 Inter）
- [ ] 导航栏包含「竞技」入口，指向 `/pvp`

---

## 15. 关键文件说明

### 15.1 配置文件

| 文件 | 作用 |
|------|------|
| `next.config.mjs` | 控制 standalone 输出、Sentry 自动禁用、测试文件忽略 |
| `tailwind.config.ts` | Tailwind 配色、字体、动画扩展 |
| `ecosystem.config.cjs` | PM2 单进程生产配置（project-m: 1G） |
| `.env.local` | 本地/生产环境变量 |
| `vitest.config.ts` | 测试运行池配置（forks + maxWorkers:1） |

### 15.2 部署脚本

| 文件 | 作用 |
|------|------|
| `scripts/deploy-ubuntu.sh` | Ubuntu 服务器一键部署脚本 |
| `scripts/health-check.sh` | 健康检查脚本（需手动创建） |
| `scripts/recover.sh` | 灾难恢复脚本（需手动创建） |
| `.github/workflows/deploy.yml` | push 到 main 自动部署 |
| `nginx/project-m.conf` | Nginx 反向代理 + WebSocket 信令代理配置模板 |
| `server.mjs` | 集成服务器入口（Next.js + WebSocket 信令合并） |
| `supabase/schema.sql` | 数据库建表、RLS、触发器 |

### 15.3 核心库

| 文件 | 作用 |
|------|------|
| `lib/version.ts` | 版本代号「破晓」(DR-DAYBREAK)、品牌名「多重宇宙」、标语、双主题设计系统常量 |
| `styles/globals.css` | 全局设计系统：PvE/PvP 双主题 CSS 变量、动画、工具类 |
| `components/Layout.tsx` | 全局布局组件，导航栏（含 PvP 竞技入口），版本水印渲染 |

### 15.4 游戏核心

| 文件 | 作用 |
|------|------|
| `lib/game/engine.ts` | 游戏核心循环、近战攻击/渲染、补给窗口逻辑 |
| `lib/game/types.ts` | 武器/英雄/Boss/存档类型扩展 |
| `lib/game/balance.ts` | 武器平衡数值与升级曲线（含近战） |
| `lib/game/weapons.ts` | 武器创建器与新手武器栏（3 把：2 远程 + 1 近战） |
| `lib/game/heroes.ts` | 英雄定义、技能、天赋与近战联动 |
| `lib/game/ai/` | AI 行为（bot-ai/pathfinding/tactics/ability-gating/coordination/learning） |

### 15.5 玩法系统

| 文件 | 作用 |
|------|------|
| `lib/game/campaign.ts` | 剧情战役：章节、节点、进度管理 |
| `lib/game/boss-rush.ts` | BossRush：关卡、首领、奖励机制 |
| `lib/game/peak-challenge.ts` | 顶峰挑战：高难度挑战逻辑 |
| `lib/game/flagship-peak.ts` | 旗舰巅峰MAX：六阶段50波、双轨挑战、双维度评级、统一积分制 |
| `lib/game/flagship-peak-achievements.ts` | 旗舰巅峰成就：11隐藏成就、波次里程碑、阶段奖励、结算计算 |
| `lib/game/boss-variants.ts` | Boss变异系统：6阶段×3形态共18种Boss变异配置 |
| `lib/game/hero-skill-tree.ts` | 英雄技能树：5英雄×3分支×5层级技能及终极觉醒 |
| `lib/game/weapon-forge.ts` | 武器改装锻造：30种改装模块、材料掉落与锻造逻辑 |
| `lib/network/coop-room.ts` | 2人联机房间：房间管理、P2P DataChannel、数据同步 |
| `lib/network/signaling.ts` | WebSocket信令客户端：房间创建/加入、成员广播、SDP/ICE交换 |
| `lib/network/peer.ts` | WebRTC P2P连接：DataChannel封装、心跳、重连 |
| `lib/game/season.ts` | 赛季等级、奖励、任务与进度 |
| `lib/game/save.ts` | 本地存档、赛季 XP/货币持久化 |
| `lib/game/weather.ts` | 动态天气系统（辐射风暴、酸雨、沙尘暴） |
| `lib/game/curseBlessing.ts` | 诅咒祝福双选系统 |
| `lib/game/achievements.ts` | 成就系统：定义、进度、奖励 |
| `lib/game/chronicles.ts` | 维度编年史：世界观数据 |

### 15.6 PvP 系统（破晓新增）

| 文件 | 作用 |
|------|------|
| `lib/game/pvp/types.ts` | PvP 类型定义：决斗/回合/英雄/武器/地图/战绩 |
| `lib/game/pvp/pvp-heroes.ts` | PvP 英雄定义：铁拳格斗家/暗影刺客/烈焰骑士/风暴游侠 |
| `lib/game/pvp/pvp-weapons.ts` | PvP 武器定义：指虎/十字弩/战术匕首/震击拳套/战术弓/相位匕首 |
| `lib/game/pvp/pvp-maps.ts` | PvP 地图定义：8张竞技地图，4种主题（工业/自然/科技/古典） |
| `lib/game/pvp/duel.ts` | 1v1 决斗逻辑：创建/开始/回合/伤害/评分 |
| `lib/game/pvp/pvp-matchmaking.ts` | 匹配队列：玩家匹配/质量计算 |
| `lib/game/pvp/custom-room.ts` | 自定义房间：创建/加入/设置/准备 |
| `lib/game/pvp/battle-history.ts` | 战绩管理：创建/保存/查询/统计 |

### 15.7 混合连接网络（破晓新增）

| 文件 | 作用 |
|------|------|
| `lib/network/multiplayer-v2.ts` | 混合连接集成层：LAN/房间码/服务端中转统一管理 |
| `lib/network/lan-discovery.ts` | 局域网自动发现：创建/加入/发现房间 |
| `lib/network/room-code.ts` | 房间码直连：创建/加入/状态检查 |
| `lib/network/server-relay.ts` | 服务端中转：连接/消息/重连 |

### 15.8 引擎与网络

| 文件 | 作用 |
|------|------|
| `lib/engine/alpha/` | α 引擎：玩家端（DDA、经济平衡、匹配、反作弊） |
| `lib/engine/beta/` | β 引擎：敌方端（Bot AI、生成优化、敌人移动） |
| `lib/engine/infra/` | 基础设施引擎（地图平衡、网络预测） |
| `lib/network/` | 多人联机基础设施（预测、插值、Delta、Jitter、匹配、房间、信令、P2P） |

### 15.9 UI 组件

| 文件 | 作用 |
|------|------|
| `components/Hud.tsx` | HUD 主入口（桌面/移动端路由） |
| `components/game/HudDesktop.tsx` | 桌面 HUD：武器面板、冷却环、击杀推送、状态效果栏 |
| `components/game/HudMobile.tsx` | 移动端 HUD：紧凑状态栏、触控优化 |
| `components/game/KillFeed.tsx` | 实时击杀滚动通知（AnimatePresence + 自动过期） |
| `components/game/SupplyWindow.tsx` | 补给窗口：B/ESC 快捷键、倒计时、快速下一波 |
| `components/game/FlagshipPeakSettlement.tsx` | 旗舰巅峰结算画面：六阶段主题、六维雷达、11隐藏成就、里程碑、粒子动画 |
| `components/game/PhaseIndicator.tsx` | 阶段指示器：实时显示当前阶段（标准/超频/地狱/深渊/虚空/创世），带动态切换动画 |

---

## 16. 破晓版本内容说明

### 16.1 双主题设计系统

「破晓」版本引入双主题视觉设计系统，PvE 和 PvP 模式拥有独立的视觉风格：

#### PvE 主题 — 米白色中国航天风

| 角色 | 颜色 | 用途 |
|------|------|------|
| 底色 | `#F5F2ED` | 米白色，全站背景 |
| 主强调 | `#0B1D3A` | 深空蓝，主交互元素 |
| 辅强调 | `#C8A45C` | 航天金，锚点高亮 |
| 轨道蓝 | `#3B7DD8` | 数据流、轨道线 |

设计旋钮：DESIGN_VARIANCE=9, MOTION_INTENSITY=4, VISUAL_DENSITY=3

#### PvP 主题 — 工业擂台暗色风

| 角色 | 颜色 | 用途 |
|------|------|------|
| 底色 | `#1A1A1E` | 暗色背景 |
| 前景 | `#F0EDE8` | 暖白文字 |
| 主强调 | `#E8652C` | 焦橙，竞技元素 |
| 辅强调 | `#FFB84D` | 热金，高亮 |
| 次要 | `#4A5568` | 灰蓝辅助 |

设计旋钮：DESIGN_VARIANCE=7, MOTION_INTENSITY=8, VISUAL_DENSITY=5

#### 字体栈

- 标题：Geist Sans
- 正文：Geist Sans
- 等宽数据：Geist Mono (font-mono tabular-nums)
- 禁止：Inter

### 16.2 版本代号机制

`lib/version.ts` 定义全站版本常量：

```typescript
VERSION_CODE = "DR-DAYBREAK"       // 版本代码
VERSION_DISPLAY = "破晓"            // 显示名称
VERSION_LABEL = "破晓 (DR-DAYBREAK)"  // 完整标签
VERSION_META_GENERATOR = "多重宇宙 破晓 (DR-DAYBREAK)"  // meta 标签
VERSION_WATERMARK = "破晓"          // 页面水印

PREV_VERSION_CODE = "DR-DREAMER"   // 上一个版本代码
PREV_VERSION_DISPLAY = "梦想家"     // 上一个版本名称

BRAND_NAME = "多重宇宙"             // 品牌名
BRAND_NAME_EN = "Multiverse"       // 品牌英文名
BRAND_TAGLINE = "深空探索 · 公平竞技 · 无付费加成"  // 品牌标语
BRAND_URL = "multiverse.game"      // 品牌域名
```

### 16.3 破晓版本架构变更

#### 单进程集成部署

破晓版本将 WebSocket 信令服务器集成到 Next.js 主进程中，实现单进程部署：

| 对比项 | 梦想家 (DR-DREAMER) | 破晓 (DR-DAYBREAK) |
|--------|---------------------|---------------------|
| 进程数 | 2 (Next.js + 信令) | 1 (集成) |
| 端口 | 3000 + 3001 | 3000 |
| 启动脚本 | `.next/standalone/server.js` + `signaling-server.mjs` | `server.mjs` |
| PM2 配置 | 2 个 app | 1 个 app |
| 信令路径 | 独立端口 3001 | 同端口 /signaling/ |
| Nginx upstream | 2 个 (app + signaling) | 1 个 (app) |

#### 混合连接网络

网络层从 PeerJS WebRTC P2P 重构为三种混合连接模式：

| 模式 | 适用场景 | 说明 |
|------|----------|------|
| 局域网自动发现 | 同一 WiFi/LAN | 基于 UDP 广播，零配置自动发现 |
| 房间码直连 | 远程好友 | 输入 6 位房间码即可直连 |
| 服务端中转 | 复杂网络环境 | 通过 WebSocket 信令服务器中转 |

### 16.4 PvP 1v1 积分决斗系统

#### 核心特性

| 特性 | 说明 |
|------|------|
| 决斗模式 | 休闲匹配 / 天梯排位 / 自定义房间 |
| 回合制 | BO3（三局两胜）/ BO5（五局三胜） |
| 积分系统 | ELO 评分，胜负影响积分变化 |
| 段位 | 青铜→白银→黄金→铂金→钻石→宗师 |

#### PvP 英雄（4个）

| 英雄 ID | 名称 | 角色 | 特点 |
|---------|------|------|------|
| `iron_fist` | 铁拳格斗家 | 近战斗士 | 高血量，高护甲，近战连击 |
| `shadow_assassin` | 暗影刺客 | 突进刺客 | 高速度，低血量，暴击隐身 |
| `flame_knight` | 烈焰骑士 | 均衡战士 | 中等属性，火焰范围伤害 |
| `storm_ranger` | 风暴游侠 | 远程射手 | 高射程，低血量，风筝战术 |

#### PvP 武器（6种）

| 武器 ID | 名称 | 类型 | 特殊效果 |
|---------|------|------|----------|
| `brass_knuckles` | 指虎 | 近战 | 连击 combo |
| `crossbow` | 十字弩 | 远程 | 蓄力 charge |
| `combat_blade` | 战术匕首 | 近战 | 格挡 parry |
| `shock_gauntlet` | 震击拳套 | 近战 | 冲刺 dash |
| `tactical_bow` | 战术弓 | 远程 | 爆发 burst |
| `phase_dagger` | 相位匕首 | 混合 | 瞬移 teleport |

#### PvP 地图（8张）

| 地图 ID | 名称 | 主题 | 特色 |
|---------|------|------|------|
| `forge_arena` | 锻炉竞技场 | 工业 | 经典对称竞技场 |
| `pipeline_yard` | 管道工场 | 工业 | 复杂掩体 |
| `ancient_grove` | 古木林地 | 自然 | 开阔视野 |
| `crystal_cavern` | 水晶洞穴 | 自然 | 狭窄通道 |
| `server_farm` | 服务器集群 | 科技 | 数据流危险区 |
| `neon_rooftop` | 霓虹天台 | 科技 | 高低差地形 |
| `colosseum` | 古代斗兽场 | 古典 | 圆形竞技场 |
| `zen_garden` | 禅意庭院 | 古典 | 对称布局 |

### 16.5 旗舰巅峰MAX（继承自梦想家）

旗舰巅峰MAX模式完整保留，包含六阶段50波递进、Boss变异系统、英雄技能树、武器改装锻造、2人联机协作、独立结算画面、六维雷达评分、11个隐藏成就、10级波次里程碑奖励、6阶段完成奖励和实时HUD显示。

详见梦想家版本部署手册第 16.3 节。

### 16.6 智能敌方 AI 系统（继承自梦想家）

智能敌方 AI 系统完整保留，包含能力门控（波次+敌人类型双重解锁）、群体协作（角色分工/集火/掩护/编队）、学习适应（热力图/英雄检测/波次递增）和 Boss 状态机增强。

详见梦想家版本部署手册第 16.18 节。

### 16.7 寻飞弹全追踪系统（继承自梦想家）

寻飞弹全追踪系统完整保留，8个追踪目标差异化参数，涵盖武器、技能、天赋、锻造和事件。

详见梦想家版本部署手册第 16.17 节。

---

## 17. 监控与日志

### 17.1 游戏内事件监测面板

破晓版本内置统一游戏事件总线，运行时可通过 `~` 键或 `F1` 键呼出悬浮监测面板。

**事件总线架构** (`lib/game/event-bus.ts`)：
- 环形缓冲区：最大容量 1000 条事件
- 事件分类：15 个分类（生命周期/登录/补给/波次/Boss/联机/技能/武器/成就/资源/网络/界面/能量/升级/奖励）
- 事件类型：70+ 事件类型，覆盖全量游戏关键节点
- 核心功能：订阅/发布、分类过滤、关键词搜索、暂停/恢复、JSON 导出下载

**监测面板** (`components/game/EventMonitor.tsx`)：
- 触发方式：`~` 键或 `F1` 键
- 实时事件流：滚动显示最新事件
- 分类过滤：下拉选择15个分类或全部
- 等级过滤：DEBUG/INFO/WARN/ERROR 四级过滤
- 关键词搜索：搜索事件类型/分类/来源/负载
- 统计面板：展开查看各事件类型计数
- 导出功能：一键下载 JSON 格式事件日志

### 17.2 PM2 进程监控

```bash
pm2 monit                  # 实时监控面板
pm2 status                 # 进程列表与状态
pm2 logs project-m --lines 200 --nostream  # 查看最近日志
pm2 logs project-m --lines 0                 # 实时跟踪日志
```

### 17.3 日志轮转

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

### 17.4 系统资源监控

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

### 17.5 应用层健康检查接口

```bash
curl http://localhost:3000/api/health
# 预期返回: {"status":"ok","timestamp":"..."}
```

### 17.6 告警阈值建议

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
pm2 status

echo "=== 恢复完成 ==="
```

---

## 22. 运维命令速查

```bash
# 应用管理
pm2 status                    # 查看进程状态
pm2 restart project-m         # 重启应用
pm2 restart project-m --update-env  # 刷新环境变量后重启
pm2 logs project-m --lines 100      # 查看应用日志
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

## 25. 破晓版本升级指南（从梦想家升级）

### 25.1 架构变更摘要

| 变更项 | 梦想家 | 破晓 |
|--------|--------|------|
| 版本代号 | DR-DREAMER | DR-DAYBREAK |
| 进程数 | 2 | 1 |
| 启动脚本 | `.next/standalone/server.js` | `server.mjs` |
| 信令端口 | 3001（独立） | 3000（集成） |
| 信令服务器文件 | `signaling-server.mjs` | 已删除（集成到 server.mjs） |
| Nginx upstream | 2 个 | 1 个 |
| 页面数 | 31 | 36（+5 PvP 页面） |
| 导航栏 | 无 PvP 入口 | 新增「竞技」入口 |
| 品牌标语 | 公平竞技 · 无付费加成 | 深空探索 · 公平竞技 · 无付费加成 |

### 25.2 升级步骤

1. 拉取最新代码：`git pull origin main`
2. 安装依赖：`pnpm install --frozen-lockfile`
3. 更新 Nginx 配置：用新版 `nginx/project-m.conf` 替换旧配置，移除 `project_m_signaling` upstream
4. 更新 `.env.local`：确保 `NEXT_PUBLIC_SIGNALING_URL` 指向 `wss://your-domain.com/signaling/`（不再需要独立端口）
5. 构建：`pnpm build`
6. 停止旧进程：`pm2 delete project-m-signaling`（移除旧信令进程）
7. 重启：`pm2 restart project-m --update-env`

---

*本手册对应多重宇宙「破晓」版本一次性全部上线部署流程。全站 36 页面双主题设计系统，品牌名「多重宇宙 (Multiverse)」，版本代号「破晓」(DR-DAYBREAK)。PvE 设计旋钮: DESIGN_VARIANCE=9, MOTION_INTENSITY=4, VISUAL_DENSITY=3；PvP 设计旋钮: DESIGN_VARIANCE=7, MOTION_INTENSITY=8, VISUAL_DENSITY=5。当前版本注册/登录功能已启用，支持 GitHub OAuth；所有游戏模式（含旗舰巅峰MAX六阶段50波终极挑战、PvP 1v1 积分决斗）、剧情战役、BossRush、成就系统、英雄档案、维度编年史、算法页面、排行榜、近战武器系统、英雄技能增强、智能敌方 AI 系统均可公开访问。WebSocket 信令已集成到主进程，单进程部署。*