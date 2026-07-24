# Project-M OAuth 配置手册

> 本手册说明如何配置 GitHub 与飞书（Lark）第三方登录。
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

> 飞书登录使用独立的 `/api/auth/lark/callback`，但 Supabase Auth 的回调白名单同样需要正确配置，因为登录流程最终会通过 Supabase 创建 session。

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

## 3. 飞书（Lark）企业自建应用

飞书登录采用「自建应用 + OAuth 2.0 授权」方式。项目通过 `LARK_APP_ID`、`LARK_APP_SECRET` 和 `LARK_OAUTH_SECRET` 完成桥接。

### 3.1 创建应用

1. 登录 [飞书开放平台](https://open.feishu.cn/)。
2. 进入「控制台」>「创建企业自建应用」。
3. 填写应用名称（如 `Project-M`）、应用描述、图标，点击创建。

### 3.2 配置凭证与权限

1. 进入应用详情页，点击「凭证与基础信息」。
2. 复制：
   - **App ID** -> `LARK_APP_ID`
   - **App Secret** -> `LARK_APP_SECRET`
3. 进入「权限管理」，添加以下权限：
   - `contact:user.base:readonly`（获取用户基本信息）
   - `contact:user.employee_id:readonly`（可选，获取用户 ID）

### 3.3 配置安全设置

1. 进入「安全设置」。
2. 在「OAuth 2.0 回调地址」中添加：
   - 本地开发：`http://localhost:3000/api/auth/lark/callback`
   - 生产环境：`https://your-domain.com/api/auth/lark/callback`
3. 保存。

### 3.4 发布应用（生产环境必需）

1. 进入「版本管理与发布」。
2. 点击「创建版本」，填写版本号和更新说明。
3. 提交发布申请，由企业管理员审核通过。

> 本地开发时，未发布的应用只能由应用创建者本人测试使用。

### 3.5 生成 LARK_OAUTH_SECRET

`LARK_OAUTH_SECRET` 用于加密飞书 OAuth state 和推导桥接密码，建议使用高强度随机字符串：

```bash
openssl rand -hex 32
```

### 3.6 配置 .env.local

```env
LARK_APP_ID=your-lark-app-id
LARK_APP_SECRET=your-lark-app-secret
LARK_OAUTH_SECRET=your-random-hmac-secret
```

---

## 4. 本地开发调试

### 4.1 回调地址速查

| 环境 | GitHub callback URL | 飞书 redirect_uri |
|------|---------------------|-------------------|
| 本地 | `http://localhost:3000/api/auth/callback` | `http://localhost:3000/api/auth/lark/callback` |
| 生产 | `https://your-domain.com/api/auth/callback` | `https://your-domain.com/api/auth/lark/callback` |

### 4.2 本地调试步骤

1. 确保 `.env.local` 已配置 `LARK_APP_ID`、`LARK_APP_SECRET`、`LARK_OAUTH_SECRET`。
2. 确保 Supabase URL Configuration 的 Redirect URL 包含 `http://localhost:3000/api/auth/callback`。
3. 确保飞书应用「安全设置」中的 OAuth 2.0 回调地址包含 `http://localhost:3000/api/auth/lark/callback`。
4. 启动项目：`pnpm dev`
5. 访问 `http://localhost:3000/login`，点击飞书登录按钮。

### 4.3 常见本地报错

#### state 校验失败

- 检查浏览器是否允许 Cookie。
- 检查 `LARK_OAUTH_SECRET` 是否已配置，长度是否足够。
- 确认飞书回调地址中的 `state` 参数与发起时一致。

#### 飞书提示「应用未发布」

- 本地开发时，只有应用创建者可以测试未发布的应用。
- 如需其他成员测试，请在飞书开放平台创建版本并提交审核。

#### GitHub 提示 redirect_uri 不匹配

- 检查 GitHub OAuth App 的 Authorization callback URL 是否与当前访问地址完全一致（包括协议、端口、路径）。

---

## 5. 生产环境配置

1. 将 GitHub OAuth App 的 Homepage URL 和 Authorization callback URL 改为生产域名。
2. 将飞书应用「安全设置」中的 OAuth 2.0 回调地址改为生产域名。
3. 将 Supabase URL Configuration 的 Site URL 和 Redirect URLs 改为生产域名。
4. 确保服务器 `.env.local` 中 `NEXT_PUBLIC_SITE_URL` 为生产域名。

---

## 6. 环境变量汇总

| 变量名 | 来源 | 说明 |
|--------|------|------|
| `NEXT_PUBLIC_SITE_URL` | 手动 | 当前环境的站点地址，决定 OAuth 回调域名 |
| `LARK_APP_ID` | 飞书开放平台 | 飞书自建应用 App ID |
| `LARK_APP_SECRET` | 飞书开放平台 | 飞书自建应用 App Secret |
| `LARK_OAUTH_SECRET` | 手动生成 | 飞书 OAuth state 加密与桥接密码推导 |

> GitHub 的 Client ID / Secret 直接在 Supabase Dashboard 中配置，不需要写入项目 `.env.local`。

---

*本手册对应 Project-M L3V100 "创世版" OAuth 登录配置流程。*
