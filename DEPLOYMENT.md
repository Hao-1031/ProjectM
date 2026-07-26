# Project-M L3V100「旗舰版」完整生产部署手册

> 目标环境：阿里云 Ubuntu 22.04 LTS（64 位）
> 技术栈：Next.js 14 + pnpm 11.9 + Node.js 20 LTS
> 部署方式：源码构建 + standalone 输出 + PM2 守护 + Nginx 反向代理 + Certbot HTTPS + GitHub Actions 自动部署
> 当前版本特性：注册/登录功能已临时关闭，所有页面公开访问；官网升级为史诗叙事风格并新增世界观 `/world`、旗舰模式 `/flagship`、赛季 `/season`、英雄档案 `/heroes` 等专题页；旗舰模式（据点防守 + Roguelike + 赛季挑战）与赛季系统已上线；算法实验室 `/algorithms` 与 API `/api/algorithms/run` 已上线；近战武器系统（4 基础 + 1 进阶）与英雄技能实用性增强已实装

---

## 1. 交付物与范围

本次部署为 L3V100「旗舰版」一次性全部上线，包含：

| 模块 | 路径/文件 | 说明 |
|------|-----------|------|
| 品牌官网 | `pages/landing.tsx`, `pages/index.tsx` | 史诗叙事风格官网，非对称 Hero、Bento 网格、GSAP 动效 |
| 世界观页 | `pages/world.tsx` | 旗舰版世界观与战场背景叙事 |
| 旗舰模式页 | `pages/flagship.tsx` | 主打模式介绍：据点防守 + Roguelike + 赛季挑战 |
| 赛季页 | `pages/season.tsx` | 赛季进度、奖励领取与任务追踪 |
| 英雄档案 | `pages/heroes.tsx` | 英雄、皮肤、表情、徽章收藏与解锁 |
| 战绩排行 | `pages/leaderboard.tsx`, `pages/api/leaderboard.ts` | 本地最佳与全球排行榜，支持旗舰/极限生存等模式 |
| 游戏前端 | `pages/game.tsx`, `components/game/` | 生存/据点防守/PvP/肉鸽/旗舰模式等玩法 |
| 算法实验室 | `pages/algorithms.tsx` | 六大核心算法公开演示与实时输出 |
| 算法 API | `pages/api/algorithms/run.ts` | 在线运行任意已注册算法 |
| 管理后台 | `pages/admin.tsx`, `pages/api/announcements.ts` | 公告管理，需 `ADMIN_KEY` |
| 排行榜 API | `pages/api/leaderboard.ts` | 全球战绩提交与查询 |
| 登录入口 | `pages/login.tsx`, `middleware.ts` | 已临时关闭，显示维护提示 |
| 旗舰模式核心 | `lib/game/flagship.ts`, `lib/game/engine.ts`, `lib/game/types.ts` | 赛季挑战、奖励分支、超频阶段、赛季 XP/货币 |
| 赛季系统 | `lib/game/season.ts`, `lib/game/save.ts` | 赛季等级、奖励、任务与持久化 |
| 近战武器系统 | `lib/game/balance.ts`, `lib/game/engine.ts`, `lib/game/weapons.ts`, `lib/game/types.ts` | 4 基础近战 + 1 进阶能量刃，扇形/突刺双机制 |
| 英雄技能增强 | `lib/game/heroes.ts` | 全英雄数值/冷却/效果上调，新增近战天赋联动与部署物更新 |
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

> 仓库地址已校正为 `https://github.com/Hao-1031/ProjectM`。

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
| `NEXT_PUBLIC_SITE_URL` | 手动 | 是 | 生产域名，如 `https://your-domain.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard | 是 | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard | 是 | 公开 anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | 是 | 服务端 service role key，切勿暴露 |
| `ADMIN_KEY` | 手动生成 | 是 | `/admin` 公告管理接口 Bearer Token |
| `LARK_APP_ID` | 飞书开放平台 | 否 | 飞书自建应用 App ID |
| `LARK_APP_SECRET` | 飞书开放平台 | 否 | 飞书自建应用 App Secret |
| `LARK_OAUTH_SECRET` | 手动生成 | 否 | 飞书 OAuth state HMAC 密钥 |
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
   - Site URL: `https://your-domain.com`
   - Redirect URL: `https://your-domain.com/api/auth/callback`

> 当前版本登录功能已临时关闭，但数据库与 OAuth 回调地址仍需正确配置，以便功能恢复时直接启用。

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

> 常见坑：仅执行 `pm2 restart project-m` 不会刷新 `.env.local` 中的变量，可能导致飞书登录等接口读取到旧值。

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

### 13.8 飞书登录返回「飞书登录未配置」

- 确认 `.env.local` 中 `LARK_APP_ID`、`LARK_APP_SECRET`、`LARK_OAUTH_SECRET` 已正确填写。
- 确认修改后执行 `pm2 restart project-m --update-env`。
- 通过 `/api/auth/debug-env`（如存在）或 `pm2 env project-m` 检查实际读取值。

### 13.9 Windows 本地 `pnpm test:run` 出现 worker timeout

症状：全部测试逻辑通过，但报告 `Worker exited unexpectedly` 或 `Timeout waiting for worker to respond`。

原因：Vitest 在 Windows 上多 worker 并发时偶发通信超时。

修复：项目已配置 `vitest.config.ts` 使用 `pool: "forks"` + `maxWorkers: 1`，强制顺序执行以规避 Windows worker 超时。Linux CI 环境可酌情调大 `maxWorkers` 提升速度。

---

## 14. 部署检查清单

部署完成后逐项确认：

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
- [ ] `/world` 世界观页可正常访问
- [ ] `/flagship` 旗舰模式专题页可正常访问
- [ ] `/season` 赛季页可正常访问并领取奖励
- [ ] `/heroes` 页面显示英雄、皮肤、表情、徽章收藏
- [ ] `/leaderboard` 页面可查看本地最佳与全球榜单
- [ ] `/algorithms` 页面可正常访问并演示算法
- [ ] `/login` 页面显示「登录入口临时关闭」提示
- [ ] `/armory` 页面显示近战武器（短刃/长枪/重剑/拳套/等离子刃·改）
- [ ] 游戏内可选择「旗舰模式」，完成挑战并进入超频阶段
- [ ] 游戏内赛季 XP 与赛季货币正确累计并持久化
- [ ] 旗舰模式与极限生存模式成绩可提交到全球排行榜
- [ ] 游戏内新手武器栏包含 2 远程 + 1 近战共 3 把武器

---

## 15. 关键文件说明

| 文件 | 作用 |
|------|------|
| `next.config.mjs` | 控制 standalone 输出、Sentry 自动禁用、测试文件忽略 |
| `ecosystem.config.cjs` | PM2 生产进程配置 |
| `.env.local` | 本地/生产环境变量 |
| `scripts/deploy-ubuntu.sh` | Ubuntu 服务器一键部署脚本 |
| `.github/workflows/deploy.yml` | push 到 main 自动部署 |
| `nginx/project-m.conf` | Nginx 反向代理配置模板 |
| `supabase/schema.sql` | 数据库建表、RLS、触发器 |
| `lib/algorithms/` | 六大核心算法实现与注册表 |
| `pages/world.tsx` | 世界观叙事页 |
| `pages/flagship.tsx` | 旗舰模式专题页 |
| `pages/season.tsx` | 赛季进度与奖励页 |
| `pages/heroes.tsx` | 英雄、皮肤、表情、徽章档案 |
| `pages/leaderboard.tsx` | 战绩与全球排行榜页 |
| `pages/algorithms.tsx` | 算法公开演示页面 |
| `pages/api/algorithms/run.ts` | 算法在线运行 API |
| `lib/game/flagship.ts` | 旗舰模式挑战、奖励与状态管理 |
| `lib/game/season.ts` | 赛季等级、奖励、任务与进度 |
| `lib/game/save.ts` | 本地存档、赛季 XP/货币持久化 |
| `lib/game/balance.ts` | 武器平衡数值与升级曲线（含近战） |
| `lib/game/engine.ts` | 游戏核心循环与近战攻击/渲染逻辑 |
| `lib/game/weapons.ts` | 武器创建器与新手武器栏 |
| `lib/game/heroes.ts` | 英雄定义、技能、天赋与近战联动 |
| `lib/game/types.ts` | 武器/英雄类型扩展（`isMelee`、`meleeShape` 等） |
| `vitest.config.ts` | 测试运行池配置（forks + maxWorkers:1） |
| `DEPLOYMENT.md` | 本手册 |

---

## 16. L3V100 旗舰版内容说明

### 16.1 旗舰版核心内容

L3V100「旗舰版」在原有玩法基础上完成品牌升级与内容扩展：

- **官网叙事包装**：首页升级为史诗叙事 Hero，新增 `/world` 世界观、`/flagship` 旗舰模式、`/season` 赛季、`/heroes` 英雄档案等专题页，统一暗色产品基调与金属/灰烬质感。
- **旗舰模式**：融合「据点防守 + Roguelike 强化选择 + 赛季挑战」。玩家守护核心、完成赛季挑战、在第 15 波进入超频阶段，并积累赛季 XP/货币。
- **极限生存**：已有模式提升为旗舰主打，满配开局、15 分钟高压、进入超频阶段后才可提交排行榜。
- **赛季系统**：`lib/game/season.ts` 提供赛季等级、奖励、任务与进度；`lib/game/save.ts` 持久化赛季 XP/货币。
- **排行榜**：`pages/leaderboard.tsx` 支持按模式筛选，旗舰模式与极限生存仅记录进入超频阶段的 run。
- **英雄与外观**：`pages/heroes.tsx` 展示英雄、皮肤、表情、徽章收藏；所有外观只改变视觉效果，不影响数值。

### 16.2 近战武器概览

L3V100「旗舰版」新增完整近战武器体系，共 5 把武器：4 把基础近战武器免费解锁并进入军械库，1 把进阶能量刃由旧版「等离子刃」重做为近战武器。所有近战武器沿用现有升级系统、通用被动加成与英雄天赋联动。

| 武器 ID | 名称 | 类型 | 机制 | 定位 |
|---------|------|------|------|------|
| `shortBlade` | 碳钢短刃 | 基础近战 | 扇形瞬发 (`arc`) | 高攻速、小范围、清杂兵 |
| `spear` | 合金长枪 | 基础近战 | 短程弹道突刺 (`thrust`) | 中距离直线穿透 |
| `greatsword` | 重型大剑 | 基础近战 | 短程弹道突刺 (`thrust`) | 慢速、高伤、重击破甲 |
| `gauntlet` | 脉冲拳套 | 基础近战 | 扇形瞬发 (`arc`) | 超高速连击、大角度 |
| `plasmaBlade` | 等离子刃·改 | 进阶近战 | 扇形瞬发 (`arc`) | 高伤能量斩击 + 灼烧 |

### 16.3 双攻击机制

近战武器采用混合机制，按武器类型区分：

- **扇形瞬发 (`arc`)**：适用于短刃、拳套、等离子刃·改。攻击时以玩家面朝方向为中心，按 `meleeAngle` 展开扇形检测，命中范围内最多 `pierce + 1` 个敌人。判定为瞬时伤害，无飞行弹道。
- **短程弹道突刺 (`thrust`)**：适用于长枪、重剑。生成短寿命穿透弹道，沿直线前进并命中路径上多个敌人，适合中距离直线清场。

### 16.4 新手武器栏

`getStarterWeapons()` 默认返回 3 把武器，确保新玩家开局即可体验远近搭配：

```typescript
[pulseRifle, shotgun, spear] // 2 远程 + 1 近战
```

### 16.5 高风险高回报平衡

近战武器在数值上定位为「高风险高回报」：

- 基础伤害为同阶远程武器的 1.5 ~ 3 倍；
- 射程控制在 88 ~ 220 px（远程武器通常 > 400 px）；
- 冷却较长，需要贴近敌人输出；
- 穿透/连击属性鼓励冲入敌群。

### 16.6 视觉表现

采用分层视觉方案：

- 基础攻击：几何扇形光效或矩形突刺轨迹，使用武器主题色；
- 暴击/重击：触发粒子爆发；
- 等离子刃·改：附带高热灼烧的离子残影。

渲染逻辑位于 `lib/game/engine.ts` 的 `drawProjectiles` 中，通过 `isMelee` / `meleeArcVisual` 标志区分。

### 16.7 英雄技能实用性增强

本次更新对所有英雄的主动技能、终极技能、被动与天赋进行了数值上调、效果强化与关键 Bug 修复，提升实战存在感。

#### 16.7.1 技能使用无效修复（关键 Bug）

**问题**：在非防御模式（无限模式、日常挑战、肉鸽、死亡竞赛、生存、极限生存、旗舰模式）中，英雄技能和终极技能完全无法使用。根因是 `useHeroSkill` 和 `useHeroUltimate` 函数中存在 `if (!ds) return;` 守卫，导致非防御模式下技能调用被直接拦截。

**修复方案**：
- 移除 `useHeroSkill` 和 `useHeroUltimate` 中的 `defenseState` 强制检查，改为 `const deployTarget = ds?.deployables ?? state.deployables;` 双存储降级策略
- 在 `GameState` 接口中新增全局 `deployables: Deployable[]` 字段，为非防御模式提供部署物存储
- 新增 `updateDeployableList` 函数，统一处理所有模式下的部署物效果（治愈光环、冰冻场、毒雾、无人机、激光束等），优先使用 `defenseState.deployables`，回退至 `state.deployables`
- 在网络输入广播中新增 `useSkill` 和 `useUltimate` 状态，修复多人模式下技能激活无法同步的问题
- 更新障碍物碰撞检测逻辑，同时检查 `defenseState` 和全局 `deployables` 中的墙体部署物

#### 16.7.2 英雄数值对齐

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

### 16.8 近战天赋联动

部分英雄新增近战专属天赋：

- **豹（leopard）- 利刃精通**：近战武器伤害 +12%，攻击范围 +8%；
- **蝰蛇（viper）- 毒刃**：近战武器伤害 +10%，近战命中附加 2 秒毒素（每秒 15 伤害）。

天赋系统在 `applyHeroTalent` 中通过 `meleeDamageMul` 与 `meleeRangeMul` 修饰符仅对 `isMelee` 武器生效。

### 16.9 测试覆盖

近战武器与英雄改动已被以下测试覆盖：

- `lib/game/weapons.test.ts`：新手武器栏、近战武器创建器；
- `lib/game/balance.test.ts`：武器平衡数值、升级曲线、弹速例外；
- `lib/game/engine.test.ts`：扇形/突刺命中判定、伤害结算；
- `lib/game/heroes.test.ts`（45 tests）：英雄技能数值、天赋应用、冻结场 tick 逻辑；
- `lib/game/ai.test.ts`：AI 行为适配近战范围（如 spitter 改为横向游斗）。

---

*本手册对应 Project-M L3V100「旗舰版」一次性全部上线部署流程。当前版本注册/登录功能已临时关闭，所有游戏模式、算法页面、排行榜、近战武器系统与英雄技能增强均可公开访问。*
