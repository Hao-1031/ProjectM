# Project-M OAuth 配置手册

> 本手册说明如何配置 GitHub 第三方登录。
> 前置条件：已完成 [`LOCAL_DEVELOPMENT.md`](./LOCAL_DEVELOPMENT.md) 或 [`DEPLOYMENT.md`](./DEPLOYMENT.md) 中的 Supabase 项目创建。
> 当前版本：L3V100「旗舰版」已启用登录功能

---

## 1. 核心配置原则

**OAuth 登录成功的关键是三个地址完全一致**：

1. `.env.local` 中的 `NEXT_PUBLIC_SITE_URL`
2. GitHub OAuth App 的 Authorization callback URL
3. Supabase Authentication > URL Configuration 的 Redirect URL

协议（http/https）、域名、端口必须完全匹配，任何差异都会导致 redirect_uri 不匹配错误。

---

## 2. Supabase Auth URL 配置

无论使用哪种 OAuth 提供商，都需要先在 Supabase 中配置回调地址白名单。

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)。
2. 进入 Authentication > URL Configuration。
3. 填写：
   - **Site URL**
     - 本地开发：`http://localhost:3000`
     - 生产环境（IP 方式）：`http://121.40.218.245:3000`
     - 生产环境（域名方式）：`https://your-domain.com`
   - **Redirect URLs**
     - 本地开发：`http://localhost:3000/api/auth/callback`
     - 生产环境（IP 方式）：`http://121.40.218.245:3000/api/auth/callback`
     - 生产环境（域名方式）：`https://your-domain.com/api/auth/callback`

---

## 3. GitHub OAuth App

### 3.1 创建应用

1. 登录 GitHub，进入 Settings > Developer settings > OAuth Apps > New OAuth App。
2. 填写：
   - **Application name**：`Project-M`
   - **Homepage URL**：
     - 本地开发：`http://localhost:3000`
     - 生产环境（IP 方式）：`http://121.40.218.245:3000`
     - 生产环境（域名方式）：`https://your-domain.com`
   - **Authorization callback URL**：
     - 本地开发：`http://localhost:3000/api/auth/callback`
     - 生产环境（IP 方式）：`http://121.40.218.245:3000/api/auth/callback`
     - 生产环境（域名方式）：`https://your-domain.com/api/auth/callback`
3. 点击 Register application。
4. 生成并复制 **Client ID** 和 **Client Secret**。

### 3.2 配置 Supabase GitHub Provider

1. 在 Supabase Dashboard 中进入 Authentication > Providers。
2. 找到 GitHub，启用并填入：
   - **Client ID**（从 GitHub OAuth App 获取）
   - **Client Secret**（从 GitHub OAuth App 生成并复制）
3. 保存。

### 3.3 验证

访问登录页，点击「GitHub 登录」，应能正常跳转、授权并回到首页。

---

## 4. 环境变量配置

在服务器 `.env.local` 中必须配置：

```env
# 生产环境（IP 方式）
NEXT_PUBLIC_SITE_URL=http://121.40.218.245:3000

# 生产环境（域名方式）
# NEXT_PUBLIC_SITE_URL=https://your-domain.com

# 本地开发
# NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> GitHub 的 Client ID / Secret 直接在 Supabase Dashboard 中配置，不需要写入项目 `.env.local`。

---

## 5. 回调地址速查表

| 环境 | NEXT_PUBLIC_SITE_URL | GitHub Authorization callback URL | Supabase Redirect URL |
|------|---------------------|----------------------------------|----------------------|
| 本地开发 | `http://localhost:3000` | `http://localhost:3000/api/auth/callback` | `http://localhost:3000/api/auth/callback` |
| 生产（IP） | `http://121.40.218.245:3000` | `http://121.40.218.245:3000/api/auth/callback` | `http://121.40.218.245:3000/api/auth/callback` |
| 生产（域名） | `https://your-domain.com` | `https://your-domain.com/api/auth/callback` | `https://your-domain.com/api/auth/callback` |

---

## 6. 本地开发调试

### 6.1 本地调试步骤

1. 确保 `.env.local` 中 `NEXT_PUBLIC_SITE_URL=http://localhost:3000`。
2. 确保 Supabase URL Configuration 的 Redirect URL 包含 `http://localhost:3000/api/auth/callback`。
3. 确保 GitHub OAuth App 的 Authorization callback URL 为 `http://localhost:3000/api/auth/callback`。
4. 启动项目：`pnpm dev`
5. 访问 `http://localhost:3000/login`，点击 GitHub 登录按钮。

### 6.2 常见报错与修复

#### 6.2.1 GitHub 提示 redirect_uri 不匹配

**症状**：点击「GitHub 登录」后跳转到 GitHub 报错页面，提示 "The redirect_uri is not associated with this application"。

**原因**：三个地址不一致。

**修复**：

1. 确认 `.env.local` 中 `NEXT_PUBLIC_SITE_URL` 值。
2. 在 GitHub OAuth App 设置中，确保 Authorization callback URL 与 `NEXT_PUBLIC_SITE_URL + /api/auth/callback` 完全一致。
3. 在 Supabase Authentication > URL Configuration 中，确保 Redirect URL 包含相同地址。
4. 使用 `pm2 restart project-m --update-env` 重启应用刷新环境变量（生产环境）。

#### 6.2.2 授权后跳转空白页

**症状**：GitHub 授权成功后跳转回应用但页面空白或显示错误。

**原因**：OAuth 回调处理失败。

**修复**：

1. 检查浏览器控制台是否有 JavaScript 错误。
2. 查看 PM2 日志：`pm2 logs project-m --lines 100`。
3. 确认 Supabase 的 Site URL 与实际访问地址一致。

#### 6.2.3 登录后立即退出

**症状**：登录成功后立即被重定向到登录页。

**原因**：Session 验证失败。

**修复**：

1. 检查浏览器是否允许 Cookie。
2. 确认 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 配置正确。
3. 查看 `/api/auth/session` 返回值。

---

## 7. 生产环境配置

### 7.1 IP 方式部署（当前推荐）

服务器直接通过 IP 访问，无需域名：

1. 将 GitHub OAuth App 的 Homepage URL 改为：`http://121.40.218.245:3000`
2. 将 GitHub OAuth App 的 Authorization callback URL 改为：`http://121.40.218.245:3000/api/auth/callback`
3. 将 Supabase URL Configuration 的 Site URL 改为：`http://121.40.218.245:3000`
4. 将 Supabase URL Configuration 的 Redirect URLs 改为：`http://121.40.218.245:3000/api/auth/callback`
5. 确保服务器 `.env.local` 中 `NEXT_PUBLIC_SITE_URL=http://121.40.218.245:3000`
6. 重启应用：`pm2 restart project-m --update-env`

### 7.2 域名方式部署

使用自定义域名并配置 HTTPS：

1. 将 GitHub OAuth App 的 Homepage URL 改为：`https://your-domain.com`
2. 将 GitHub OAuth App 的 Authorization callback URL 改为：`https://your-domain.com/api/auth/callback`
3. 将 Supabase URL Configuration 的 Site URL 改为：`https://your-domain.com`
4. 将 Supabase URL Configuration 的 Redirect URLs 改为：`https://your-domain.com/api/auth/callback`
5. 确保服务器 `.env.local` 中 `NEXT_PUBLIC_SITE_URL=https://your-domain.com`
6. 配置 Nginx 反向代理和 HTTPS（参考 [DEPLOYMENT.md](./DEPLOYMENT.md)）
7. 重启应用：`pm2 restart project-m --update-env`

---

## 8. 环境变量汇总

| 变量名 | 来源 | 说明 |
|--------|------|------|
| `NEXT_PUBLIC_SITE_URL` | 手动 | 当前环境的站点地址，决定 OAuth 回调域名；**必须与 GitHub OAuth 和 Supabase 配置一致** |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard | 公开 anon key |

---

## 9. OAuth 流程说明

```
用户访问 /login
  ↓
点击「GitHub 登录」
  ↓
/api/auth/github 生成 OAuth URL（使用 NEXT_PUBLIC_SITE_URL 拼接回调地址）
  ↓
重定向到 GitHub 授权页面
  ↓
用户授权后，GitHub 回调到 /api/auth/callback
  ↓
/api/auth/callback 交换授权码获取 session
  ↓
重定向到用户原始访问页面或首页
```

---

## 10. 重要注意事项

1. **地址一致性**：`NEXT_PUBLIC_SITE_URL`、GitHub OAuth callback URL、Supabase Redirect URL 三者必须完全一致。
2. **协议匹配**：如果使用 HTTPS，所有配置必须使用 `https://`；如果使用 HTTP（如 IP 方式），所有配置必须使用 `http://`。
3. **端口匹配**：如果使用非标准端口（如 `:3000`），端口号必须包含在所有配置中。
4. **环境变量刷新**：修改 `.env.local` 后必须使用 `pm2 restart project-m --update-env` 重启应用。
5. **多个回调地址**：Supabase 支持添加多个 Redirect URL，可以同时配置本地和生产地址方便切换。

---

*本手册对应 Project-M L3V100「旗舰版」OAuth 登录配置流程。*