# Project-M 生产部署手册

> 目标环境：阿里云 Ubuntu 22.04 LTS（64 位）
> 技术栈：Next.js 14 + pnpm + Node.js 20
> 部署方式：本地构建 + standalone 输出 + `node .next/standalone/server.js` 启动

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
# 安装 NodeSource 源
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 安装 Node.js
sudo apt install -y nodejs

# 验证
node -v  # v20.x.x
npm -v
```

### 1.5 安装 pnpm

```bash
npm install -g pnpm@9
pnpm -v
```

### 1.6 安装 PM2（生产守护）

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

git clone https://github.com/Hao-1031/Project-M.git
cd Project-M
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
nano /var/www/Project-M/.env.local
```

内容示例：

```env
# 数据库（如使用 Supabase）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Sentry（可选；未配置时自动跳过 sourcemap 上传）
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=

# 其他业务环境变量
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

> 关键约定：`SENTRY_AUTH_TOKEN` 未配置时，`next.config.mjs` 会自动禁用 Sentry sourcemap 上传并跳过 Sentry 构建包装，避免构建阻塞。

---

## 4. 构建

### 4.1 运行构建

```bash
cd /var/www/Project-M
pnpm build
```

构建产物：

- `.next/standalone/`：独立可运行目录（Linux 下启用 standalone 输出）
- `.next/static/`：静态资源（需复制到 standalone 目录）

### 4.2 验证构建

```bash
pnpm test
pnpm lint
pnpm typecheck
```

> 生产部署前建议至少运行 `pnpm test` 与 `pnpm build`。

---

## 5. 启动应用

### 5.1 直接启动（调试用）

```bash
cd /var/www/Project-M/.next/standalone
node server.js
```

默认监听 `http://localhost:3000`。

> Linux 生产环境使用 standalone 输出，因此直接运行 `server.js`。

### 5.2 PM2 生产守护

创建 `ecosystem.config.js`：

```bash
nano /var/www/Project-M/ecosystem.config.js
```

内容：

```js
module.exports = {
  apps: [
    {
      name: "project-m",
      script: "/var/www/Project-M/.next/standalone/server.js",
      cwd: "/var/www/Project-M/.next/standalone",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "1G",
      restart_delay: 3000,
      max_restarts: 5,
      min_uptime: "10s",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/var/www/Project-M/logs/err.log",
      out_file: "/var/www/Project-M/logs/out.log",
      merge_logs: true,
    },
  ],
};
```

启动：

```bash
cd /var/www/Project-M
mkdir -p logs

pm2 start ecosystem.config.js
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

## 6. 防火墙配置

### 6.1 UFW（推荐）

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

### 6.2 阿里云安全组

登录阿里云控制台，为 ECS 实例的安全组添加规则：

| 类型 | 端口 | 授权对象 |
|------|------|----------|
| SSH | 22 | 你的 IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |
| 自定义 TCP | 3000 | 127.0.0.1/32（仅本机反向代理访问） |

---

## 7. 反向代理（推荐）

### 7.1 安装 Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 7.2 配置 Nginx

创建站点配置：

```bash
sudo nano /etc/nginx/sites-available/project-m
```

内容：

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

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/project-m /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. HTTPS（推荐）

### 8.1 安装 Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 8.2 申请证书

```bash
sudo certbot --nginx -d your-domain.com
```

按提示完成配置，Certbot 会自动修改 Nginx 配置并启用 443。

### 8.3 自动续期

Certbot 默认安装 systemd timer 自动续期，可手动测试：

```bash
sudo certbot renew --dry-run
```

---

## 9. 更新与回滚

### 9.1 更新版本

```bash
cd /var/www/Project-M
git pull origin main
pnpm install --frozen-lockfile
pnpm build
pm2 restart project-m
```

### 9.2 快速回滚

```bash
cd /var/www/Project-M
git log --oneline -5
git reset --hard <commit-hash>
pnpm install --frozen-lockfile
pnpm build
pm2 restart project-m
```

---

## 10. 故障排查

### 10.1 构建卡在 "Collecting build traces..."

现象：`pnpm build` 长时间停留在收集构建追踪。

处理：

- 等待，该步骤在低配机器上可能耗时数分钟。
- 如超过 30 分钟，检查磁盘空间与 I/O。
- 查看构建日志：`pnpm build 2>&1 | tee build.log`

### 10.2 standalone 目录缺失

现象：运行 `node .next/standalone/server.js` 提示文件不存在。

处理：

- 确认构建在 Linux 上执行（`next.config.mjs` 仅在非 win32 时输出 standalone）。
- 重新运行 `pnpm build`。

### 10.3 Sentry 构建失败

现象：构建时提示 Sentry sourcemap 上传失败。

处理：确认 `.env.local` 中未设置 `SENTRY_AUTH_TOKEN`。未设置时项目已自动跳过 Sentry 包装。若需启用 Sentry，再填入对应 token、org、project。

### 10.4 端口占用

```bash
# 查看 3000 端口占用
sudo ss -tlnp | grep :3000

# 结束对应进程
sudo kill -9 <PID>
```

### 10.5 PM2 进程反复重启

检查：

```bash
pm2 logs project-m
```

常见原因：

- 内存超限：调整 `max_memory_restart` 或升级服务器。
- `.env.local` 缺失必要变量。
- `server.js` 路径错误（未重新构建 standalone）。

---

## 11. 部署检查清单

部署完成后逐项确认：

- [ ] Ubuntu 22.04 已更新
- [ ] Node.js 20 已安装
- [ ] pnpm 已安装
- [ ] PM2 已安装
- [ ] `pnpm install --frozen-lockfile` 成功
- [ ] `pnpm build` 成功并生成 `.next/standalone/`
- [ ] `pnpm test` 通过
- [ ] `node .next/standalone/server.js` 可访问 `http://localhost:3000`
- [ ] PM2 进程运行中
- [ ] 防火墙/安全组端口已放行
- [ ] Nginx 反向代理配置正确
- [ ] HTTPS 证书已配置
- [ ] Sentry 未配置时构建不报错

---

## 12. 关键文件说明

| 文件 | 作用 |
|------|------|
| `next.config.mjs` | 控制 standalone 输出、Sentry 自动禁用、测试文件忽略 |
| `ecosystem.config.js` | PM2 生产进程配置 |
| `.env.local` | 本地/生产环境变量 |
| `DEPLOYMENT.md` | 本手册 |

---

*本手册对应 Project-M L3V100 "创世版" 一次性全部上线部署流程。*
