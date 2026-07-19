# Project M 完整部署手册

本手册覆盖从本地开发到生产上线的完整流程，包括 Vercel 一键部署、GitHub Actions 自动化、PWA 配置、Sentry 监控与常见问题排查。

---

## 目录

1. [环境要求](#环境要求)
2. [本地开发](#本地开发)
3. [环境变量](#环境变量)
4. [生产构建](#生产构建)
5. [Docker 部署](#docker-部署)
6. [Vercel 部署](#vercel-部署)
7. [GitHub Actions 自动化](#github-actions-自动化)
8. [PWA 与离线游玩](#pwa-与离线游玩)
9. [Sentry 错误监控](#sentry-错误监控)
10. [域名与 HTTPS](#域名与-https)
11. [性能优化清单](#性能优化清单)
12. [上线前检查表](#上线前检查表)
13. [常见问题](#常见问题)

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
