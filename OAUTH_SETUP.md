# Project-M OAuth 配置手册

> 本手册说明如何配置 GitHub 第三方登录。
> 前置条件：已完成 [`LOCAL_DEVELOPMENT.md`](./LOCAL_DEVELOPMENT.md) 或 [`DEPLOYMENT.md`](./DEPLOYMENT.md) 中的 Supabase 项目创建。

---

## 1. Supabase Auth URL 配置

无论使用哪种 OAuth 提供商，都需要先在 Supabase 中配置回调地址白名单。

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)。
2. 进入 Authentication > URL Configuration。
3. 填写：
   - **Site URL**
     - 本地开发：`http://localhost:3000`
     - 生产环境：`https://your-domain.com`
   - **Redirect URLs**
     - 本地开发：`http://localhost:3000/api/auth/callback`
     - 生产环境：`https://your-domain.com/api/auth/callback`

---

## 2. GitHub OAuth App

### 2.1 创建应用

1. 登录 GitHub，进入 Settings > Developer settings > OAuth Apps > New OAuth App。
2. 填写：
   - **Application name**：`Project-M`
   - **Homepage URL**：
     - 本地开发：`http://localhost:3000`
     - 生产环境：`https://your-domain.com`
   - **Authorization callback URL**：
     - 本地开发：`http://localhost:3000/api/auth/callback`
     - 生产环境：`https://your-domain.com/api/auth/callback`
3. 点击 Register application。
4. 生成并复制 **Client ID** 和 **Client Secret**。

### 2.2 配置 Supabase GitHub Provider

1. 在 Supabase Dashboard 中进入 Authentication > Providers。
2. 找到 GitHub，启用并填入：
   - **Client ID**
   - **Client Secret**
3. 保存。

### 2.3 验证

访问登录页，点击「GitHub 登录」，应能正常跳转、授权并回到首页。

---

## 3. 本地开发调试

### 3.1 回调地址速查

| 环境 | GitHub callback URL |
|------|---------------------|
| 本地 | `http://localhost:3000/api/auth/callback` |
| 生产 | `https://your-domain.com/api/auth/callback` |

### 3.2 本地调试步骤

1. 确保 Supabase URL Configuration 的 Redirect URL 包含 `http://localhost:3000/api/auth/callback`。
2. 启动项目：`pnpm dev`
3. 访问 `http://localhost:3000/login`，点击 GitHub 登录按钮。

### 3.3 常见本地报错

#### GitHub 提示 redirect_uri 不匹配

- 检查 GitHub OAuth App 的 Authorization callback URL 是否与当前访问地址完全一致（包括协议、端口、路径）。

---

## 4. 生产环境配置

1. 将 GitHub OAuth App 的 Homepage URL 和 Authorization callback URL 改为生产域名。
2. 将 Supabase URL Configuration 的 Site URL 和 Redirect URLs 改为生产域名。
3. 确保服务器 `.env.local` 中 `NEXT_PUBLIC_SITE_URL` 为生产域名。

---

## 5. 环境变量汇总

| 变量名 | 来源 | 说明 |
|--------|------|------|
| `NEXT_PUBLIC_SITE_URL` | 手动 | 当前环境的站点地址，决定 OAuth 回调域名 |

> GitHub 的 Client ID / Secret 直接在 Supabase Dashboard 中配置，不需要写入项目 `.env.local`。

---

*本手册对应 Project-M L3V100 "旗舰版" OAuth 登录配置流程。*
