# Project-M L3V100 创世版基线报告

> 生成时间：2026-07-19
> 目标版本：L3V100 "创世版"
> 核心玩法：据点防守（PvE 合作）
> 部署目标：阿里云 ECS Ubuntu 22.04 64 位

---

## 1. 项目概述

Project-M 是一款基于 Next.js + TypeScript 的轻量Roguelike射击网页游戏。L3V100"创世版"以"据点防守"为核心玩法，强调英雄协作、能量节点占领、波次防守与 Boss 攻略，并配合全局 UI/UX 重塑、动画特效、音效与战斗平衡调整完成一次性全部上线。

---

## 2. 当前架构

### 2.1 技术栈

| 层级 | 技术 |
| ---- | ---- |
| 框架 | Next.js 14.2.35（Pages Router） |
| 运行时 | Node.js 20 LTS |
| 包管理 | pnpm 9 |
| 样式 | Tailwind CSS 3.4 + CSS 变量 |
| 字体 | Geist Sans / Geist Mono |
| 图标 | Phosphor Icons |
| 动画 | Framer Motion |
| 状态 | Zustand |
| 音频 | Howler + Web Audio API |
| 测试 | Vitest + Testing Library |
| 监控 | Sentry Next.js SDK |

### 2.2 核心模块

```
lib/game/
  engine.ts          # 游戏主循环、状态管理、模式切换
  types.ts           # 全量 TypeScript 类型定义
  defense.ts         # 据点防守：地图、核心、节点、波次
  heroes.ts          # 四位英雄：侦察/突击/医疗/工程
  bosses.ts          # 六位 Boss，含巨像（colossus）
  balance.ts         # 敌人/武器/数值平衡配置
  modes.ts           # 五种游戏模式（含 defense）
  weapons.ts         # 武器与升级系统
  affixes.ts         # 精英词缀
  ai.ts              # 敌人 AI 行为树
  audio.ts           # BGM/SFX/空间混音
  sprites.ts         # 精灵与渲染

components/
  GameCanvas.tsx     # 游戏画布与流程控制
  ModeSelect.tsx     # 模式选择（Bento 非对称网格）
  HeroSelect.tsx     # 英雄选择
  MultiplayerLobby.tsx # 联机大厅
  Hud.tsx            # 游戏内 HUD
  ShopModal.tsx      # 波次间隙商店
  UpgradeModal.tsx   # 升级选择
  RoguelikeRewardModal.tsx # Roguelike 奖励
  SettingsPanel.tsx  # 设置面板
  RunEndModal.tsx    # 结算界面

pages/
  index.tsx          # 首页
  game.tsx           # 游戏页
  settings.tsx       # 设置页
  404.tsx            # 404
  _error.tsx         # 错误页

lib/network/        # WebRTC P2P 联机
lib/store.ts        # 全局设置状态
```

### 2.3 已交付关键功能

- 据点防守模式完整流程：模式选择 -> 英雄选择 -> 防守波次 -> 商店/天赋 -> 胜负判定
- 四位特色英雄及主动/被动技能
- 机械敌人派系与 6 位 Boss（含巨像）
- 能量节点占领、核心血量、波次节奏
- 波次间隙商店与英雄天赋升级
- P2P 联机大厅与房间系统
- Awwwards 级暗色产品 UI/UX 重塑
- Framer Motion 入场/悬停/布局动画
- Sentry sourcemap 自动禁用（无 token 时不影响构建）
- Ubuntu 22.04 部署脚本与手册

---

## 3. 技术债务

### 3.1 已知债务

| 编号 | 债务项 | 影响 | 建议处理 |
| ---- | ------ | ---- | -------- |
| D01 | Windows 本地 standalone 构建因 pnpm symlink 权限失败 | 仅影响 Windows 本地预览 | 使用 `pnpm start` 或切换至 Ubuntu/Docker 构建 |
| D02 | 部分 UI 组件仍使用内联样式与硬编码颜色 | 维护成本略高 | 逐步迁移至 CSS 变量与 Tailwind 配置 |
| D03 | 网络同步对可部署实体与防御状态覆盖不完整 | 多人据点防守体验可能不一致 | 补充 `GameRoomManager` 对 defenseState 的序列化同步 |
| D04 | 音效系统依赖 Howler，单元测试环境打印大量 `Not implemented` 警告 | 测试日志嘈杂 | 增加测试 stub 或切换至 Web Audio 轻量封装 |
| D05 | 英雄天赋与商店商品缺少高级动画与空状态深度设计 | 视觉节奏可进一步提升 | 后续迭代补充骨架屏与微交互 |
| D06 | `PROJECT_BASELINE.md` 需随版本持续更新 | 基线可能过期 | 每次大版本迭代同步 |

### 3.2 代码统计参考

- 当前已修改/新增文件超过 40 个
- 单元测试：320 个全部通过
- TypeScript 类型检查：通过

---

## 4. 风险清单

| 编号 | 风险 | 可能性 | 影响 | 缓解措施 |
| ---- | ---- | ------ | ---- | -------- |
| R01 | 阿里云 ECS 首次构建因网络/权限失败 | 中 | 高 | 使用 `scripts/deploy-ubuntu.sh` 自动化，预留手动回退步骤 |
| R02 | WebRTC P2P 在不同网络环境下无法直连 | 高 | 中 | 准备 TURN 服务器配置说明 |
| R03 | 据点防守多人同步延迟导致节点占领不同步 | 中 | 高 | 主机 authoritative，客户端预测 + 状态校验 |
| R04 | Boss 巨像数值过强/过弱影响首日体验 | 中 | 中 | 预留热更新平衡参数能力 |
| R05 | Sentry 未配置 token 时构建仍尝试上传 | 低 | 中 | 已在 `next.config.mjs` 中自动禁用 sourcemap 上传 |
| R06 | 移动端/平板适配未完全验证 | 中 | 中 | PC 大屏优先，后续专项优化 pad 端 |
| R07 | 大量动画在低配设备上导致掉帧 | 中 | 中 | 已支持 `prefers-reduced-motion` 与画质设置 |

---

## 5. 部署验证建议

1. 在 Ubuntu 22.04 主机执行 `bash scripts/deploy-ubuntu.sh`
2. 确认 `pm2 status` 显示 `project-m` 在线
3. 访问 `http://<服务器IP>:3000` 验证首页加载
4. 进行一局据点防守流程验证
5. 可选：配置 Nginx + Certbot SSL

---

## 6. 结论

L3V100 "创世版"核心功能与基础设施已基本就绪，代码通过类型检查与全量单元测试。主要剩余工作集中在生产环境首次部署验证、P2P 网络稳定性调优与后续迭代中的细节打磨。
