# Project-M L3V100「创世版」完整生产部署手册

> 目标环境：阿里云 Ubuntu 22.04 LTS（64 位）
> 技术栈：Next.js 14 + pnpm 11.9 + Node.js 20 LTS
> 部署方式：源码构建 + standalone 输出 + PM2 守护 + Nginx 反向代理 + Certbot HTTPS + GitHub Actions 自动部署
> 当前版本特性：注册/登录功能已临时关闭，所有页面公开访问；算法实验室 `/algorithms` 与 API `/api/algorithms/run` 已上线

---

## 1. 交付物与范围

本次部署为 L3V100「创世版」一次性全部上线，包含：

| 模块 | 路径/文件 | 说明 |
|------|-----------|------|
| 品牌官网 | `pages/landing.tsx`, `pages/index.tsx` | Awwwards 级暗色产品风格官网 |
| 游戏前端 | `pages/game.tsx`, `components/game/` | 生存/据点防守/PvP/肉鸽等玩法 |
| 算法实验室 | `pages/algorithms.tsx` | 六大核心算法公开演示与实时输出 |
| 算法 API | `pages/api/algorithms/run.ts` | 在线运行任意已注册算法 |
| 管理后台 | `pages/admin.tsx`, `pages/api/announcements.ts` | 公告管理，需 `ADMIN_KEY` |
| 排行榜 API | `pages/api/leaderboard.ts` | 全球战绩提交与查询 |
| 登录入口 | `pages/login.tsx`, `middleware.ts` | 已临时关闭，显示维护提示 |
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
- [ ] `/algorithms` 页面可正常访问并演示算法
- [ ] `/login` 页面显示「登录入口临时关闭」提示

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
| `pages/algorithms.tsx` | 算法公开演示页面 |
| `pages/api/algorithms/run.ts` | 算法在线运行 API |
| `DEPLOYMENT.md` | 本手册 |

---

*本手册对应 Project-M L3V100「创世版」一次性全部上线部署流程。当前版本注册/登录功能已临时关闭，所有游戏模式、算法页面与排行榜均可公开访问。*
