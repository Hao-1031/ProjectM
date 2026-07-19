# Project M 完整部署手册

本手册覆盖从本地开发到生产上线的完整流程，包括 Vercel 一键部署、GitHub Actions 自动化、PWA 配置、Sentry 监控与常见问题排查。

---

## 目录

1. [环境要求](#环境要求)
2. [本地开发](#本地开发)
3. [环境变量](#环境变量)
4. [生产构建](#生产构建)
5. [阿里云 Ubuntu 22.04 LTS 部署（PM2）](#阿里云-ubuntu-2204-lts-部署pm2)
6. [Docker 部署](#docker-部署)
7. [Vercel 部署](#vercel-部署)
8. [GitHub Actions 自动化](#github-actions-自动化)
9. [PWA 与离线游玩](#pwa-与离线游玩)
10. [Sentry 错误监控](#sentry-错误监控)
11. [域名与 HTTPS](#域名与-https)
12. [性能优化清单](#性能优化清单)
13. [上线前检查表](#上线前检查表)
14. [常见问题](#常见问题)

---

## 环境要求

- Node.js 18.x 或更高
- pnpm 8.x 或更高（推荐）
- Git
- 一个 Vercel 账号（可选，用于托管）
- 一个 Sentry 账号（可选，用于错误监控）

## 本地开发

### 1. 安装依赖

```bash
pnpm install
```

> 若使用 npm：`npm install`。若使用 yarn：`yarn install`。

### 2. 生成 PWA 图标

```bash
pnpm generate-icons
```

此命令读取 `public/icon.svg`，输出 `public/icon-192.png` 与 `public/icon-512.png`。

### 3. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)。

### 4. 运行测试

```bash
pnpm test:run
```

### 5. 代码检查

```bash
pnpm lint
pnpm format:check
pnpm typecheck
```

---

## 环境变量

项目使用以下环境变量。开发时可在项目根目录创建 `.env.local`。

| 变量                     | 必需 | 说明              |
| ------------------------ | ---- | ----------------- |
| `SENTRY_ORG`             | 否   | Sentry 组织 slug  |
| `SENTRY_PROJECT`         | 否   | Sentry 项目 slug  |
| `SENTRY_AUTH_TOKEN`      | 否   | Sentry 身份令牌   |
| `NEXT_PUBLIC_SENTRY_DSN` | 否   | Sentry 客户端 DSN |

示例 `.env.local`：

```bash
SENTRY_ORG=your-org
SENTRY_PROJECT=project-m
SENTRY_AUTH_TOKEN=your-token
NEXT_PUBLIC_SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
```

> 若未配置 Sentry，构建时仅会跳过上传 source map，不影响应用运行。

---

## 生产构建

### 构建步骤

```bash
pnpm install
pnpm generate-icons
pnpm build
```

构建产物位于 `.next/` 目录。`next-pwa` 会在生产构建时自动生成 Service Worker 与预缓存清单到 `public/`。

### 构建产物说明

- `.next/static/`：静态资源
- `.next/server/`：服务端渲染产物
- `public/sw.js`：Service Worker（自动生成）
- `public/workbox-*.js`：Workbox 运行时（自动生成）

---

## 阿里云 Ubuntu 22.04 LTS 部署（PM2）

本节针对 L3V100 "创世版" 目标环境：全新阿里云 ECS Ubuntu 22.04 64 位，使用 PM2 持久化运行 Next.js 生产服务。

> 一键部署脚本：[scripts/deploy-ubuntu.sh](file:///e:/M/project-m/scripts/deploy-ubuntu.sh)。本节命令与脚本逻辑一致。
>
> 构建说明：`next.config.mjs` 已配置 Sentry 插件。当 `SENTRY_AUTH_TOKEN` 未设置时，sourcemap 上传会自动禁用，构建与运行均不受影响。

### 1. 服务器初始化

在阿里云控制台重置 root 密码或使用密钥登录，通过 SSH 进入服务器：

```bash
ssh root@<公网IP>
```

更新系统包：

```bash
apt-get update && apt-get upgrade -y
```

### 2. 一键自动部署

项目已提供自动化脚本，复制到服务器后直接执行：

```bash
curl -fsSL https://raw.githubusercontent.com/Hao-1031/Project-M/main/scripts/deploy-ubuntu.sh -o deploy-ubuntu.sh
chmod +x deploy-ubuntu.sh
sudo DOMAIN=your-domain.com ./deploy-ubuntu.sh
```

不带 Nginx 的最小化部署：

```bash
sudo ./deploy-ubuntu.sh
```

脚本会依次完成：安装 Git/Node.js/pnpm/PM2、拉取代码、安装依赖、构建、PM2 启动、UFW 防火墙、Nginx + Certbot SSL（可选，传入 `DOMAIN` 时启用）。

### 3. 手动部署步骤

如不使用脚本，可按以下步骤手动操作。

#### 3.1 安装基础软件

```bash
apt-get update
apt-get install -y curl wget git software-properties-common ca-certificates gnupg lsb-release ufw
```

#### 3.2 安装 Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v
npm -v
```

#### 3.3 安装 pnpm 与 PM2

```bash
npm install -g pnpm pm2
pnpm -v
pm2 -v
```

#### 3.4 拉取代码

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/Hao-1031/Project-M.git project-m
cd project-m
```

#### 3.5 配置环境变量

```bash
cp .env.example .env.local
nano .env.local
```

最小配置：

```env
NODE_ENV=production
PORT=3000
```

启用 Sentry：

```env
SENTRY_ORG=your-org
SENTRY_PROJECT=project-m
SENTRY_AUTH_TOKEN=your-token
NEXT_PUBLIC_SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
```

#### 3.6 构建

```bash
pnpm install --frozen-lockfile
pnpm generate-icons
pnpm build
```

### 4. 使用 PM2 启动

项目已提供 `ecosystem.config.cjs`，基于 Next.js standalone 输出直接运行 `server.js`：

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd
```

执行 `pm2 startup systemd` 后，按提示运行生成的命令完成 systemd 服务注册。

常用运维命令：

```bash
pm2 status              # 查看运行状态
pm2 logs project-m      # 实时查看日志
pm2 reload project-m    # 热重载（更新代码后）
pm2 restart project-m   # 重启
pm2 stop project-m      # 停止
pm2 monit               # 资源监控
```

### 5. 防火墙配置

#### 5.1 阿里云安全组

在阿里云 ECS 控制台 > 安全组规则中放行：

| 类型       | 端口 | 授权对象            |
| ---------- | ---- | ------------------- |
| 自定义 TCP | 3000 | 0.0.0.0/0 或指定 IP |
| 自定义 TCP | 80   | 0.0.0.0/0           |
| 自定义 TCP | 443  | 0.0.0.0/0           |

#### 5.2 UFW

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable
ufw status
```

### 6. Nginx 反向代理（可选）

安装 Nginx：

```bash
apt-get install -y nginx
```

创建站点配置 `/etc/nginx/sites-available/project-m`：

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

启用配置：

```bash
rm -f /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/project-m /etc/nginx/sites-enabled/project-m
nginx -t
systemctl restart nginx
systemctl enable nginx
```

### 7. HTTPS（推荐）

使用 Let's Encrypt + Certbot：

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com --non-interactive --agree-tos --email admin@your-domain.com
```

测试自动续期：

```bash
certbot renew --dry-run
```

### 8. 更新与回滚

#### 8.1 更新部署

```bash
cd /var/www/project-m
git pull origin main
pnpm install --frozen-lockfile
pnpm generate-icons
pnpm build
pm2 reload project-m
```

#### 8.2 快速回滚

```bash
cd /var/www/project-m
git log --oneline -5
git reset --hard <上一个稳定 commit>
pnpm install --frozen-lockfile
pnpm build
pm2 reload project-m
```

### 9. Ubuntu 专属故障排除

#### 9.1 端口被占用

```bash
ss -tlnp | grep :3000
kill -9 <PID>
```

#### 9.2 构建卡在 sourcemap 上传

确认 `SENTRY_AUTH_TOKEN` 已配置。未配置时 `next.config.mjs` 会自动跳过上传。如仍卡住：

```bash
rm -rf .next
SENTRY_AUTH_TOKEN="" pnpm build
```

#### 9.3 PM2 日志过大

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 10
```

#### 9.4 Nginx 502 Bad Gateway

- 检查应用是否运行：`pm2 status`
- 检查端口是否监听：`ss -tlnp | grep 3000`
- 检查 Nginx 配置：`nginx -t`

#### 9.5 深度排错（Ubuntu 22.04）

**PM2 状态为 `errored`**

```bash
pm2 logs project-m --lines 100
pm2 describe project-m
```

常见原因与修复：

- `.next/standalone/server.js` 不存在：未成功执行 `pnpm build`，或 `next.config.mjs` 未设置 `output: "standalone"`。
- 权限不足：确认 `/var/www/project-m` 归运行用户所有。

  ```bash
  chown -R $USER:$USER /var/www/project-m
  ```

- Node 版本不对：Ubuntu 默认源可能安装 Node 12。使用 Nodesource 20.x 重新安装。

  ```bash
  node -v
  # 应输出 v20.x.x
  ```

**进程被 OOM Killer 终止**

```bash
dmesg -T | grep -i "killed process"
```

若看到 `Out of memory: Killed process ... (node)`，说明物理内存不足。建议：

1. 添加 2-4 GB Swap：

   ```bash
   fallocate -l 4G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   echo '/swapfile none swap sw 0 0' >> /etc/fstab
   ```

2. 降低 Node 堆内存上限，或在 `ecosystem.config.cjs` 中限制 `max_memory_restart`。

**文件描述符耗尽**

大量并发连接或日志文件未轮转可能导致 `EMFILE` 错误：

```bash
ulimit -n
# 若小于 65535，修改 /etc/security/limits.conf
```

```text
* soft nofile 65535
* hard nofile 65535
```

同时提升 inotify 监听上限：

```bash
echo "fs.inotify.max_user_watches=524288" >> /etc/sysctl.conf
sysctl -p
```

**端口被占用**

```bash
ss -tlnp | grep :3000
# 或
lsof -i :3000
```

终止占用进程后重新启动 PM2：

```bash
pm2 restart project-m
```

**构建卡在 `Collecting build traces ...`**

本地未配置 Sentry 时通常不会卡住，但若遇到，可清理缓存：

```bash
rm -rf .next
SENTRY_AUTH_TOKEN="" pnpm build
```

**HTTPS 证书续期失败**

```bash
certbot renew --dry-run
```

若 80 端口被占用，先停止 Nginx 或临时释放端口：

```bash
systemctl stop nginx
certbot renew
systemctl start nginx
```

#### 9.6 性能调优（Ubuntu 22.04）

**Node.js 运行时调优**

在 `ecosystem.config.cjs` 中为应用增加 Node 参数：

```js
node_args: "--max-old-space-size=4096 --optimize-for-size",
```

对于 2 GB 内存服务器，建议设置为 `--max-old-space-size=1536`；4 GB 服务器可设置为 3072-4096。

**PM2 配置优化**

- `max_memory_restart` 建议设置为物理内存的 60%-70%。
- `restart_delay` 在崩溃后避免抖动重启。
- `min_uptime` 确保应用在 10 秒内稳定运行，否则视为启动失败。

已提供的 `ecosystem.config.cjs` 已包含这些默认值，可根据服务器规格调整。

**Nginx 性能优化**

在 `/etc/nginx/nginx.conf` 的 `http` 块中启用 gzip/brotli 与静态缓存：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

# 若已安装 ngx_brotli
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/javascript application/json;

# 静态资源长期缓存
location /_next/static {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location /static {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**系统级优化**

```bash
# 降低 swap 使用倾向，避免游戏进程被换出
sysctl vm.swappiness=10
echo "vm.swappiness=10" >> /etc/sysctl.conf

# 开启 TCP BBR（Ubuntu 22.04 默认已启用）
sysctl net.ipv4.tcp_congestion_control
```

**Next.js 构建优化**

- 生产构建使用 `pnpm build`，不要带 `NODE_ENV=development`。
- 确保 `public/icon-192.png` 与 `public/icon-512.png` 已生成，否则 PWA 资源缺失会导致额外网络请求。
- 未配置 Sentry 时，`next.config.mjs` 会自动跳过 sourcemap 上传，避免构建等待。

#### 9.7 备份与恢复

**每日自动备份脚本**

创建 `/var/backups/project-m/backup.sh`：

```bash
#!/bin/bash
set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/project-m"
SOURCE="/var/www/project-m"
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"

tar czf "$BACKUP_DIR/project-m_$DATE.tar.gz" \
  --exclude="$SOURCE/node_modules" \
  --exclude="$SOURCE/.next" \
  --exclude="$SOURCE/.git/objects" \
  -C /var/www project-m

# 备份关键环境文件（如已存在）
cp "$SOURCE/.env.local" "$BACKUP_DIR/env_$DATE.local" 2>/dev/null || true
cp "$SOURCE/ecosystem.config.cjs" "$BACKUP_DIR/ecosystem_$DATE.cjs" 2>/dev/null || true

# 保留最近 14 天
find "$BACKUP_DIR" -type f -mtime +$KEEP_DAYS -delete
```

赋予执行权限并加入 cron：

```bash
chmod +x /var/backups/project-m/backup.sh
crontab -e
```

```text
0 3 * * * /var/backups/project-m/backup.sh >> /var/log/project-m-backup.log 2>&1
```

**恢复到上一版本**

```bash
# 停止应用
pm2 stop project-m

# 解压备份
cd /var/www
tar xzf /var/backups/project-m/project-m_YYYYMMDD_HHMMSS.tar.gz

# 恢复环境文件
cp /var/backups/project-m/env_YYYYMMDD_HHMMSS.local /var/www/project-m/.env.local

# 重新安装依赖并构建
cd /var/www/project-m
pnpm install --frozen-lockfile
pnpm generate-icons
pnpm build

# 启动
pm2 start ecosystem.config.cjs --env production
pm2 save
```

**异地备份（可选）**

将备份目录同步到对象存储或另一台服务器：

```bash
rsync -avz --delete /var/backups/project-m/ user@backup-server:/backups/project-m/
```

或使用阿里云 OSS 工具 `ossutil`：

```bash
ossutil cp -r /var/backups/project-m/ oss://your-bucket/project-m-backups/
```

#### 9.8 监控与告警

**PM2 日志管理**

PM2 默认日志路径为 `/var/log/pm2/project-m/`。查看实时日志：

```bash
pm2 logs project-m
pm2 logs project-m --lines 200
```

日志轮转：

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 20
pm2 set pm2-logrotate:compress true
pm2 save
```

**系统资源监控**

```bash
pm2 monit
```

或使用 `htop`、`vmstat`、`iostat`：

```bash
vmstat 1 10
iostat -x 1 5
```

**基础健康检查脚本**

创建 `/usr/local/bin/project-m-health.sh`：

```bash
#!/bin/bash
URL="http://127.0.0.1:3000"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

if [ "$STATUS" != "200" ]; then
  echo "$(date) - Health check failed: HTTP $STATUS" >> /var/log/project-m-health.log
  pm2 reload project-m
else
  echo "$(date) - OK" >> /var/log/project-m-health.log
fi
```

加入 cron，每 5 分钟检查一次：

```text
*/5 * * * * /usr/local/bin/project-m-health.sh
```

**Sentry 告警**

生产环境配置 `SENTRY_AUTH_TOKEN` 与 `NEXT_PUBLIC_SENTRY_DSN` 后，错误会自动上报到 Sentry。建议在 Sentry 中设置：

- Issue Alert：当 5 分钟内出现超过 10 次相同错误时发送邮件或钉钉/飞书 webhook。
- Metric Alert：当页面加载时间超过 3 秒或错误率超过 1% 时触发告警。

**systemd 开机自启**

执行 PM2 提供的 systemd 生成命令：

```bash
pm2 startup systemd
```

复制并执行输出的命令，然后：

```bash
pm2 save
```

这样服务器重启后，PM2 与 `project-m` 会自动启动。

### 10. 部署检查清单

- [ ] Ubuntu 22.04 64 位已安装 Node.js 20 LTS、Git、pnpm、PM2
- [ ] 项目已克隆到 `/var/www/project-m`
- [ ] `.env.local` 已配置 `NODE_ENV=production`
- [ ] `pnpm build` 成功
- [ ] PM2 已启动并设置 systemd 开机自启
- [ ] 阿里云安全组已放行 3000/80/443
- [ ] UFW 已放行对应端口
- [ ] Nginx 反向代理已指向 `http://127.0.0.1:3000`（如使用）
- [ ] HTTPS 证书已部署（如使用）
- [ ] 浏览器可正常访问域名并进入游戏
- [ ] 角色移动、障碍物碰撞、据点防守模式已验证
- [ ] 已配置 Swap 与文件描述符限制
- [ ] 已启用 PM2 日志轮转
- [ ] 已配置每日自动备份

---

## Docker 部署

项目已配置 Next.js standalone 输出，支持使用 Docker 容器化部署。

### 本地构建与运行

```bash
# 构建镜像
docker build -t project-m .

# 运行容器
docker run -p 3000:3000 project-m
```

访问 [http://localhost:3000](http://localhost:3000)。

### Docker Compose

```bash
# 一键启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

`docker-compose.yml` 已将容器 3000 端口映射到宿主机的 3000 端口。

### Dockerfile 说明

- **base**: 启用 corepack 与 pnpm
- **deps**: 基于 lock 文件安装依赖
- **builder**: 生成 PWA 图标并执行 Next.js 生产构建
- **runner**: 仅复制 standalone 产物与静态资源，使用非 root 用户运行

> `next.config.mjs` 已设置 `output: "standalone"`，构建后会生成 `.next/standalone/server.js`，无需完整 node_modules 即可运行。

### 推送镜像到 GitHub Container Registry

```bash
# 登录 GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 打标签并推送
docker tag project-m ghcr.io/OWNER/project-m:main
docker push ghcr.io/OWNER/project-m:main
```

---

## Vercel 部署

### 方式一：Vercel CLI

1. 安装 Vercel CLI

```bash
npm i -g vercel
```

2. 登录并部署

```bash
vercel login
vercel --prod
```

3. 在 Vercel Dashboard 中配置环境变量。

### 方式二：Git 集成

1. 将代码推送到 GitHub / GitLab / Bitbucket。
2. 在 Vercel 创建新项目，选择对应仓库。
3. 设置构建命令：`pnpm generate-icons && pnpm build`
4. 设置输出目录：`.next`
5. 添加环境变量后点击 Deploy。

### Vercel 推荐配置

在 Vercel 项目设置中：

- **Build Command**：`pnpm generate-icons && pnpm build`
- **Output Directory**：`.next`
- **Install Command**：`pnpm install`
- **Node.js Version**：`18.x`

---

## GitHub Actions 自动化

项目已配置两个工作流，位于 `.github/workflows/`。

### CI 工作流

`.github/workflows/ci.yml` 在每次 push 与 pull_request 时执行：安装依赖、生成图标、lint、format 检查、类型检查、单元测试与生产构建。

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm generate-icons
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm typecheck
      - run: pnpm test:run
      - run: pnpm build
        env:
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          NEXT_PUBLIC_SENTRY_DSN: ${{ secrets.NEXT_PUBLIC_SENTRY_DSN }}
```

### Docker 工作流

`.github/workflows/docker.yml` 在 main 分支 push 与 tag push 时构建 Docker 镜像，并推送到 GitHub Container Registry。PR 仅构建不推送。

```yaml
name: Docker Build and Push

on:
  push:
    branches: [main]
    tags: ["v*"]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  docker:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        if: github.event_name != 'pull_request'
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### GitHub Secrets 配置

在仓库 Settings > Secrets and variables > Actions 中添加：

- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `VERCEL_TOKEN`（如使用 Vercel CLI 部署）

> Docker 工作流使用 `GITHUB_TOKEN` 自动登录 GHCR，无需额外配置 token。

---

## PWA 与离线游玩

### PWA 配置

PWA 由 `next-pwa` 自动管理，配置位于 `next.config.mjs`：

```js
const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: !pwaEnabled,
  buildExcludes: [/middleware-manifest\.json$/],
})(nextConfig);
```

- 仅在 `NODE_ENV === "production"` 时启用 PWA
- Service Worker 会预缓存静态资源与页面，支持离线访问

### manifest

`public/manifest.json` 定义了应用名称、图标、主题色与显示模式。关键字段：

- `display: "standalone"`：以独立应用形式运行
- `orientation: "landscape"`：默认横屏，适合游戏操作
- `icons`：192x192 与 512x512 PNG 图标，以及 SVG 自适应图标

### 安装到主屏幕

- **Android Chrome**：访问站点后点击菜单 > 添加到主屏幕
- **iOS Safari**：点击分享按钮 > 添加到主屏幕
- **桌面 Chrome**：地址栏右侧出现安装图标时点击安装

### 验证 PWA

1. 打开 Chrome DevTools > Lighthouse
2. 选择 Progressive Web App 分类
3. 点击 Analyze page load
4. 确保通过 installable 与 PWA optimized 检测

---

## Sentry 错误监控

### 配置步骤

1. 在 Sentry 创建项目，选择平台为 Next.js
2. 复制 DSN 与组织/项目信息
3. 在环境变量中填入对应值
4. 重新构建部署

### 已集成位置

- `sentry.client.config.ts`：客户端错误捕获
- `sentry.server.config.ts`：服务端错误捕获
- `sentry.edge.config.ts`：Edge Runtime 错误捕获
- `next.config.mjs`：构建时 source map 上传与 tunnel route

> 本地未配置 `SENTRY_AUTH_TOKEN` 时，`next.config.mjs` 会自动禁用 sourcemap 上传，避免 Sentry CLI 等待网络超时导致构建挂起。生产环境（Vercel / GitHub Actions）配置 token 后仍会正常上传。

### 测试错误上报

在浏览器控制台执行：

```js
Sentry.captureException(new Error("测试错误"));
```

---

## 域名与 HTTPS

### Vercel 默认域名

部署后会获得 `https://project-m-xxx.vercel.app`，自动启用 HTTPS。

### 自定义域名

1. 在 Vercel Dashboard > Domains 中添加域名
2. 按提示配置 DNS 记录
3. 等待 DNS 生效，Vercel 会自动签发 SSL 证书

### 推荐 DNS 配置

| 类型  | 主机记录 | 值                     |
| ----- | -------- | ---------------------- |
| A     | `@`      | `76.76.21.21`          |
| CNAME | `www`    | `cname.vercel-dns.com` |

---

## 性能优化清单

- [ ] 启用 `next-pwa` 预缓存
- [ ] 使用 `sharp` 生成的 PNG 图标替代大尺寸图片
- [ ] 生产构建时启用 Sentry source map 上传
- [ ] 在 Vercel 开启 Analytics 与 Speed Insights
- [ ] 移动端使用 `dvh` 单位避免工具栏遮挡
- [ ] 为游戏画布设置 `touch-none` 防止页面滚动
- [ ] 通过 `requestAnimationFrame` 驱动游戏循环

---

## 上线前检查表

- [ ] `pnpm test:run` 全部通过
- [ ] `pnpm lint` 无错误
- [ ] `pnpm format:check` 通过
- [ ] `pnpm typecheck` 无类型错误
- [ ] `pnpm generate-icons` 成功生成 `icon-192.png` 与 `icon-512.png`
- [ ] `pnpm build` 成功完成
- [ ] `docker build -t project-m .` 成功完成（如使用 Docker）
- [ ] `docker-compose up -d` 可在本地启动服务
- [ ] 本地访问首页、游戏页、基地、设置等页面正常
- [ ] 移动端虚拟摇杆可正常移动角色
- [ ] PWA 可安装并离线启动
- [ ] Sentry DSN 与 token 已配置
- [ ] 环境变量已同步到 Vercel / GitHub Actions

---

## 常见问题

### 1. 安装依赖失败

尝试清除缓存后重新安装：

```bash
pnpm store prune
pnpm install
```

或指定 registry：

```bash
pnpm install --registry https://registry.npmjs.org
```

### 2. `@sentry/cli` 构建脚本被忽略

```bash
pnpm approve-builds @sentry/cli
```

### 3. TypeScript 报 Set 迭代错误

确保 `tsconfig.json` 中 `target` 为 `es2015` 或更高。本项目已设置为 `es2020`。

### 4. PWA 图标 404

确认已运行：

```bash
pnpm generate-icons
```

并检查 `public/icon-192.png` 与 `public/icon-512.png` 是否存在。

### 5. Service Worker 未注册

PWA 仅在 `NODE_ENV === "production"` 时启用。请使用 `pnpm build && pnpm start` 或部署到生产环境验证。

### 6. 移动端横屏被系统旋转锁定

用户需自行关闭设备旋转锁定，或在 iOS 设置中允许横屏。

### 7. 构建长时间卡在 `Collecting build traces ...`

通常发生在本地未配置 Sentry token 时。`next.config.mjs` 已自动判断：无 `SENTRY_AUTH_TOKEN` 则跳过 sourcemap 上传。若仍卡住，可尝试：

```bash
# 清理构建缓存后重试
Remove-Item -Recurse -Force .next
pnpm build
```

生产环境（配置了 Sentry token）下不应出现此问题。

### 8. Windows 下 `node .next/standalone/server.js` 报 EPERM

Next.js standalone 输出在 Windows + pnpm 环境下可能因符号链接权限导致启动失败。本地预览建议直接使用：

```bash
pnpm start
```

部署到 Linux / Docker 环境时，`node .next/standalone/server.js` 可正常运行。

---

## 更新与回滚

### 热更新

通过 Git 推送触发 GitHub Actions 自动部署。Vercel 会为每个 PR 生成预览链接。

### 回滚

在 Vercel Dashboard > Deployments 中选择上一个成功版本，点击 Promote to Production。

---

**维护者备注**：本手册随项目版本同步更新。若新增第三方服务或构建步骤，请同步修改本文件与 README.md。
