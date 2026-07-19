# Project M: 末世幸存者

一款可在 Web 与移动端游玩的冷色调科技末日风格 Rogue-lite 幸存者游戏。灵感来自 Vampire Survivors，采用「移动 + 自动射击 + 任务撤离」的核心循环。

## 核心特性

- **纯 Canvas 游戏主体**：HTML5 Canvas API + TypeScript，不依赖游戏引擎
- **多端适配**：键盘 / 触屏双操控，虚拟摇杆自动在移动设备启用
- **PWA 离线游玩**：可安装到主屏幕，支持离线启动
- **本地存档**：所有数据仅存于浏览器，不上传服务器
- **Rogue-lite 成长**：1 名角色、3 把武器、1 张地图、5 类任务、升级组合
- **监控与质量**：Sentry 错误上报、ESLint、Prettier、Vitest 单元测试

## 技术栈

- [Next.js](https://nextjs.org/) 14 Pages Router
- [React](https://react.dev/) 18
- [TypeScript](https://www.typescriptlang.org/) 5
- [Tailwind CSS](https://tailwindcss.com/) 3
- [Zustand](https://github.com/pmndrs/zustand) 状态管理
- [Howler.js](https://howlerjs.com/) 音频（含程序化音效）
- [next-pwa](https://github.com/shadowwalker/next-pwa) PWA 支持
- [Sentry](https://sentry.io/) 错误监控
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) 测试

## 快速开始

```bash
# 安装依赖（项目使用 pnpm，npm / yarn 亦可）
pnpm install

# 生成 PWA 图标
pnpm generate-icons

# 启动开发服务器
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可访问。

## 可用脚本

| 脚本                  | 说明                     |
| --------------------- | ------------------------ |
| `pnpm dev`            | 启动开发服务器           |
| `pnpm build`          | 生产构建                 |
| `pnpm start`          | 启动生产服务器           |
| `pnpm lint`           | 运行 ESLint              |
| `pnpm lint:fix`       | 自动修复 ESLint 问题     |
| `pnpm format`         | 格式化代码               |
| `pnpm format:check`   | 检查代码格式             |
| `pnpm test`           | 交互式运行测试           |
| `pnpm test:run`       | 单次运行测试             |
| `pnpm typecheck`      | 运行 TypeScript 类型检查 |
| `pnpm generate-icons` | 由 SVG 生成 PWA PNG 图标 |

## 项目结构

```
project-m/
├── components/          # React 组件
│   ├── GameCanvas.tsx   # 游戏画布与 UI 覆盖层
│   ├── Hud.tsx          # 游戏内 HUD
│   ├── Layout.tsx       # 页面布局
│   ├── RunEndModal.tsx  # 结算弹窗
│   └── UpgradeModal.tsx # 升级选择弹窗
├── lib/
│   ├── game/            # 游戏核心逻辑
│   │   ├── engine.ts    # 游戏引擎
│   │   ├── input.ts     # 输入管理（键盘 / 触屏）
│   │   ├── audio.ts     # 音频管理
│   │   ├── weapons.ts   # 武器与升级
│   │   ├── missions.ts  # 任务系统
│   │   ├── save.ts      # 本地存档
│   │   ├── math.ts      # 数学工具
│   │   └── types.ts     # 类型定义
│   └── store.ts         # Zustand 全局状态
├── pages/               # Next.js 页面
├── public/              # 静态资源与 PWA 清单
├── scripts/             # 构建辅助脚本
├── styles/              # 全局样式
└── tests/               # 单元测试（*.test.ts）
```

## 操作说明

- **桌面**：WASD / 方向键移动，武器自动射击，Esc / P 暂停
- **移动设备**：在屏幕任意位置拖动触发虚拟摇杆，武器自动射击
- **目标**：完成 4 个任务后前往撤离点，在倒计时结束前抵达即胜利

## 部署

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 隐私声明

Project M 承诺永不收集、上传或出售用户数据。所有游戏进度与设置均保存在浏览器本地存储（localStorage）中。

## 开源协议

MIT
