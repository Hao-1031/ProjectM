# Project-M L3V100 "创世版" 生产部署手册

> 目标环境：阿里云 Ubuntu 22.04 LTS（64 位）
> 技术栈：Next.js 14 + pnpm 11 + Node.js 20
> 部署方式：本地构建 + standalone 输出 + PM2 守护 + Nginx 反向代理 + GitHub Actions 自动部署

---

## 1. 环境准备

### 1.1 操作系统要求

- Ubuntu 22.04 LTS（64 位）
- 至少 2 vCPU / 4 GB 内存（推荐 4 vCPU / 8 GB）
- 系统盘剩余空间 >= 20 GB
- 开放端口：22（SSH）、80（HTTP）、443（HTTPS）、3000（应用，可选）

### 1.2 更新系统

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 安装 Git

```bash
sudo apt install git -y
git --version
```

### 1.4 安装 Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v  # v20.x.x
npm -v
```

### 1.5 安装 pnpm 11

```bash
npm install -g pnpm@11
pnpm -v
```

### 1.6 安装 PM2

```bash
npm install -g pm2
pm2 -v
```

---

## 2. 源码与依赖

### 2.1 拉取代码

```bash
cd /var/www
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www

git clone https://github.com/Hao-1031/Project-M.git project-m
cd project-m
```

### 2.2 安装依赖

```bash
pnpm install --frozen-lockfile
```

> `--frozen-lockfile` 保证与开发环境依赖版本完全一致。

---

## 3. 环境变量

在项目根目录创建 `.env.local`：

```bash
cp .env.example .env.local
nano .env.local
```

### 3.1 统一环境变量清单

| 变量名 | 来源 | 必填 | 说明 |
|--------|------|------|------|
| `NODE_ENV` | 手动 | 是 | 固定填 `production` |
| `PORT` | 手动 | 是 | 应用监听端口，默认 `3000` |
| `HOSTNAME` | 手动 | 是 | 填 `0.0.0.0` |
| `NEXT_PUBLIC_SITE_URL` | 手动 | 是 | 生产域名，如 `https://your-domain.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > API | 是 | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > API | 是 | 公开 anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > API | 是 | 服务端 service role key，切勿暴露 |
| `ADMIN_KEY` | 手动生成 | 是 | `/admin` 公告管理接口密钥 |
| `LARK_APP_ID` | 飞书开放平台 | 否 | 飞书自建应用 App ID |
| `LARK_APP_SECRET` | 飞书开放平台 | 否 | 飞书自建应用 App Secret |
| `LARK_OAUTH_SECRET` | 手动生成 | 否 | 飞书 OAuth state HMAC 密钥 |
| `SENTRY_ORG` | Sentry | 否 | Sentry 组织名 |
| `SENTRY_PROJECT` | Sentry | 否 | Sentry 项目名 |
| `SENTRY_AUTH_TOKEN` | Sentry | 否 | 未配置时构建自动跳过 sourcemap 上传 |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry | 否 | 前端 DSN |

生成安全的 `ADMIN_KEY`：

```bash
openssl rand -base64 32
```

> 关键约定：`SENTRY_AUTH_TOKEN` 未配置时，`next.config.mjs` 会自动禁用 Sentry sourcemap 上传并跳过 Sentry 构建包装，避免构建阻塞。

---

## 4. 数据库初始化

首次部署前，必须在 Supabase 中执行建表脚本：

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)。
2. 进入 SQL Editor > New query。
3. 粘贴 [`supabase/schema.sql`](./supabase/schema.sql) 全部内容并运行。
4. 如需测试数据，再运行 [`supabase/seed.sql`](./supabase/seed.sql)。

---

## 5. 构建

### 5.1 运行构建

```bash
cd /var/www/project-m
pnpm build
```

构建产物：

- `.next/standalone/`：独立可运行目录（Linux 下启用 standalone 输出）
- `.next/static/`：静态资源（已自动复制到 standalone 目录）

### 5.2 验证构建

```bash
pnpm test:run
pnpm lint
pnpm typecheck
```

> 生产部署前建议至少运行 `pnpm test:run` 与 `pnpm build`。

---

## 6. 启动应用

### 6.1 直接启动（调试用）

```bash
cd /var/www/project-m/.next/standalone
node server.js
```

默认监听 `http://localhost:3000`。

> Linux 生产环境使用 standalone 输出，因此直接运行 `server.js`。

### 6.2 PM2 生产守护

项目已提供 [`ecosystem.config.cjs`](./ecosystem.config.cjs)，直接启动即可：

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
pm2 logs project-m
pm2 restart project-m
pm2 stop project-m
pm2 delete project-m
```

---

## 7. 防火墙配置

### 7.1 UFW

```bash
sudo apt install ufw -y

sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# 若未使用反向代理，可直接暴露 3000
# sudo ufw allow 3000/tcp

sudo ufw enable
sudo ufw status verbose
```

### 7.2 阿里云安全组

登录阿里云控制台，为 ECS 实例的安全组添加规则：

| 类型 | 端口 | 授权对象 |
|------|------|----------|
| SSH | 22 | 你的 IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |
| 自定义 TCP | 3000 | 127.0.0.1/32（仅本机反向代理访问） |

---

## 8. 反向代理

### 8.1 安装 Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 8.2 配置 Nginx

项目已提供 [`nginx/project-m.conf`](./nginx/project-m.conf)。复制到站点配置目录：

```bash
sudo cp nginx/project-m.conf /etc/nginx/sites-available/project-m
sudo nano /etc/nginx/sites-available/project-m
# 将 server_name 修改为你的域名或服务器 IP

sudo ln -s /etc/nginx/sites-available/project-m /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 9. HTTPS

### 9.1 安装 Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 9.2 申请证书

```bash
sudo certbot --nginx -d your-domain.com
```

按提示完成配置，Certbot 会自动修改 Nginx 配置并启用 443。

### 9.3 自动续期

Certbot 默认安装 systemd timer 自动续期，可手动测试：

```bash
sudo certbot renew --dry-run
```

---

## 10. GitHub Actions 自动部署

仓库已配置 [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)。push 到 `main` 分支后，GitHub Actions 会通过 SSH 连接到生产服务器并执行 [`scripts/deploy-ubuntu.sh`](./scripts/deploy-ubuntu.sh)。

### 10.1 配置 GitHub Secrets

在 GitHub 仓库 Settings > Secrets and variables > Actions 中添加：

| Secret | 说明 |
|--------|------|
| `DEPLOY_SSH_HOST` | 服务器公网 IP 或域名 |
| `DEPLOY_SSH_USER` | SSH 用户名，如 `root` 或 `ubuntu` |
| `DEPLOY_SSH_PRIVATE_KEY` | SSH 私钥（对应服务器 `~/.ssh/authorized_keys`） |
| `DEPLOY_SSH_PORT` | SSH 端口，默认 22 |

### 10.2 服务器端准备

确保服务器上已执行过本手册的 1-6 节，且代码位于 `/var/www/project-m`。首次自动部署前，建议手动运行一次部署脚本验证：

```bash
cd /var/www/project-m
./scripts/deploy-ubuntu.sh
```

### 10.3 自动部署流程

push 到 `main` 后，Actions 会执行：

1. SSH 登录服务器
2. 进入 `/var/www/project-m`
3. 执行 `scripts/deploy-ubuntu.sh`
4. 脚本内部完成 `git reset --hard origin/main`、`pnpm install`、`pnpm build`、`pm2 restart`

---

## 11. 更新与回滚

### 11.1 更新版本（自动）

push 到 `main` 后自动部署，无需手动操作。

### 11.2 更新版本（手动）

```bash
cd /var/www/project-m
git pull origin main
pnpm install --frozen-lockfile
pnpm build
pm2 restart project-m
```

### 11.3 快速回滚

```bash
cd /var/www/project-m
git log --oneline -5
git reset --hard <commit-hash>
pnpm install --frozen-lockfile
pnpm build
pm2 restart project-m
```

---

## 12. 故障排查

### 12.1 构建卡在 "Collecting build traces..."

- 等待，该步骤在低配机器上可能耗时数分钟。
- 如超过 30 分钟，检查磁盘空间与 I/O。
- 查看构建日志：`pnpm build 2>&1 | tee build.log`

### 12.2 standalone 目录缺失

- 确认构建在 Linux 上执行（`next.config.mjs` 仅在非 win32 时输出 standalone）。
- 重新运行 `pnpm build`。

### 12.3 Sentry 构建失败

- 确认 `.env.local` 中未设置 `SENTRY_AUTH_TOKEN`。未设置时项目已自动跳过 Sentry 包装。
- 若需启用 Sentry，再填入对应 token、org、project。

### 12.4 端口占用

```bash
sudo ss -tlnp | grep :3000
sudo kill -9 <PID>
```

### 12.5 PM2 进程反复重启

```bash
pm2 logs project-m
```

常见原因：

- 内存超限：调整 `max_memory_restart` 或升级服务器。
- `.env.local` 缺失必要变量。
- `server.js` 路径错误（未重新构建 standalone）。

### 12.6 GitHub Actions 部署失败

- 检查 GitHub Secrets 是否正确配置。
- 在 Actions 日志中查看 SSH 连接错误信息。
- 确认服务器防火墙允许 GitHub Actions  runner IP 访问 SSH（如需白名单，建议改用固定 IP 的 self-hosted runner 或 key-based 认证）。

---

## 13. 部署检查清单

部署完成后逐项确认：

- [ ] Ubuntu 22.04 已更新
- [ ] Node.js 20 已安装
- [ ] pnpm 11 已安装
- [ ] PM2 已安装
- [ ] Supabase 数据库已执行 `schema.sql`
- [ ] `.env.local` 已正确配置并放置于 `/var/www/project-m`
- [ ] `pnpm install --frozen-lockfile` 成功
- [ ] `pnpm build` 成功并生成 `.next/standalone/`
- [ ] `pnpm test:run` 通过
- [ ] `node .next/standalone/server.js` 可访问 `http://localhost:3000`
- [ ] PM2 进程运行中
- [ ] 防火墙/安全组端口已放行
- [ ] Nginx 反向代理配置正确
- [ ] HTTPS 证书已配置
- [ ] Sentry 未配置时构建不报错
- [ ] GitHub Actions Secrets 已配置，push 到 main 可自动部署

---

## 14. 关键文件说明

| 文件 | 作用 |
|------|------|
| `next.config.mjs` | 控制 standalone 输出、Sentry 自动禁用、测试文件忽略 |
| `ecosystem.config.cjs` | PM2 生产进程配置 |
| `.env.local` | 本地/生产环境变量 |
| `scripts/deploy-ubuntu.sh` | Ubuntu 服务器一键部署脚本 |
| `.github/workflows/deploy.yml` | push 到 main 自动部署 |
| `nginx/project-m.conf` | Nginx 反向代理配置模板 |
| `supabase/schema.sql` | 数据库建表、RLS、触发器 |
| `DEPLOYMENT.md` | 本手册 |

---

*本手册对应 Project-M L3V100 "创世版" 一次性全部上线部署流程。*
