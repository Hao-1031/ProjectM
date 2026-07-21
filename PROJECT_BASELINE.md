# Project-M 2.0 移动端旗舰版基线报告

> 生成时间：2026-07-21
> 目标版本：2.0 "移动端旗舰版"
> 核心玩法：据点防守（PvE 合作）+ 个人死斗 PvP
> 部署目标：阿里云 ECS Windows Server / Ubuntu 22.04 双栈

---

## 1. 项目概述

Project-M 2.0 在 L3V100 "创世版" 基础上，以**手游端横屏 Web 触控适配**为核心目标，同步扩展新英雄、新地图与赛季/通行证系统，并坚持 PC 端与移动端双端同等优化。

### 2.0 核心决策

| 维度 | 决策 |
|---|---|
| 核心目标 | 手游端适配 |
| 实现路径 | 现有 Next.js + pnpm 项目内 Web 触控优化，不引入新框架 |
| 屏幕方向 | 横屏优先，平板兼容 |
| 双端策略 | PC 与移动端同等优化，各自独立布局 |
| 操作辅助 | 中度辅助：辅助瞄准 + 自动开火 + 可配置摇杆 |
| 性能策略 | 低/中/高三档画质可选，默认中档 |
| 新内容 | 新英雄、新地图/关卡、新赛季/通行证 |
| 美术资产 | AI/程序化生成为主 |
| 商业模式 | 轻度付费，不卖数值：通行证与外观商店，英雄可通过免费线/游戏币解锁 |
| 时间策略 | 不赶时间，质量优先 |
| 联机模型 | 混合：大厅/匹配/账户走 Next.js API + Supabase，局内 P2P |
| 账户持久化 | 混合：游客账户本地存储 + 服务端双写，注册后合并 |

### 设计参数

- DESIGN_VARIANCE = 8
- MOTION_INTENSITY = 6
- VISUAL_DENSITY = 4
- 字体：Geist Sans / Geist Mono（禁止 Inter）
- 图标：Phosphor Icons
- 动画：Framer Motion + GSAP

---

## 2. 当前架构

### 2.1 技术栈

| 层级   | 技术                            |
| ------ | ------------------------------- |
| 框架   | Next.js 14.2.35（Pages Router） |
| 运行时 | Node.js 20 LTS                  |
| 包管理 | pnpm 11.9.0                     |
| 样式   | Tailwind CSS 3.4 + CSS 变量     |
| 字体   | Geist Sans / Geist Mono         |
| 图标   | Phosphor Icons                  |
| 动画   | Framer Motion + GSAP            |
| 状态   | Zustand（持久化）               |
| 音频   | Howler + Web Audio API          |
| 测试   | Vitest + Testing Library        |
| 监控   | Sentry Next.js SDK              |
| 后端   | Supabase（Postgres + PostgREST）|

### 2.2 核心模块

```
lib/game/
  engine.ts          # 游戏主循环、状态管理、模式切换
  types.ts           # 全量 TypeScript 类型定义
  defense.ts         # 据点防守：地图、核心、节点、波次
  heroes.ts          # 七位英雄（含 Bastion 工程/建造）
  bosses.ts          # 六位 Boss，含巨像（colossus）
  balance.ts         # 敌人/武器/数值平衡配置
  modes.ts           # 多种游戏模式（含 defense、deathmatch）
  weapons.ts         # 武器与升级系统
  affixes.ts         # 精英词缀
  ai.ts              # 敌人 AI 行为树
  audio.ts           # BGM/SFX/空间混音
  sprites.ts         # 精灵与渲染
  input.ts           # 键盘 + 虚拟摇杆输入管理（含 aim assist / auto-fire）
  particles.ts       # 粒子池与特效
  fx.ts              # 屏幕震动、命中反馈
  season.ts          # 50 级双轨赛季通行证、任务、商店
  maps.ts            # 四张地图：工业废墟、废弃炼油厂、冰封轨道站、生物污染实验室
  save.ts            # 本地存档（游客账户）

components/
  GameCanvas.tsx     # 游戏画布与流程控制
  ModeSelect.tsx     # 模式选择
  HeroSelect.tsx     # 英雄选择
  MultiplayerLobby.tsx # 联机大厅
  Hud.tsx            # 游戏内 HUD（已分 Mobile/Desktop 双布局）
  ShopModal.tsx      # 波次间隙商店
  UpgradeModal.tsx   # 升级选择
  RoguelikeRewardModal.tsx # Roguelike 奖励
  SettingsPanel.tsx  # 设置面板（含画质、摇杆、辅助）
  RunEndModal.tsx    # 结算界面

pages/
  index.tsx          # 首页/指挥终端
  landing.tsx        # 落地页
  game.tsx           # 游戏页
  heroes.tsx         # 英雄详情
  modes.tsx          # 模式详情
  armory.tsx         # 军械库
  settings.tsx       # 设置页
  about.tsx          # 关于
  help.tsx           # 帮助
  leaderboard.tsx    # 排行榜
  admin.tsx          # 公告管理

lib/network/        # WebRTC P2P 联机
lib/supabase/       # 服务端 Supabase 客户端与类型
lib/store.ts        # 全局设置状态
```

### 2.3 已交付关键功能（截至本次扫描）

- 据点防守模式完整流程：模式选择 -> 英雄选择 -> 防守波次 -> 商店/天赋 -> 胜负判定
- 个人死斗 PvP 模式
- 七位特色英雄及主动/被动技能（含 Bastion：水泥墙 + 6 枚自索敌巡飞弹）
- 机械敌人派系与 6 位 Boss（含巨像）
- 四张主题地图（工业废墟、废弃炼油厂、冰封轨道站、生物污染实验室）
- 能量节点占领、核心血量、波次节奏
- 波次间隙商店与英雄天赋升级
- 50 级双轨赛季通行证：日常/周常/赛季任务，免费线与付费线奖励
- P2P 联机大厅与房间系统（BroadcastChannel + localStorage 信令）
- 移动端 HUD 双布局：左侧虚拟摇杆区、右侧大触控技能按钮
- 辅助瞄准、自动开火、摇杆尺寸/透明度可配置
- 画质档位设置（高/中/低）并影响 DPR
- Awwwards 级暗色产品 UI/UX
- Framer Motion 入场/悬停/布局动画
- GSAP 滚动揭示、卡片堆叠、计数器动画
- Sentry sourcemap 自动禁用（无 token 时不影响构建）
- Windows 本地构建跳过 standalone，Linux 生产保留 standalone

---

## 3. 2.0 新增与改造范围

### 3.1 移动端体验重塑

1. **横屏 HUD 重做**
   - 虚拟摇杆视觉反馈与热区优化（左侧 55% 区域）
   - 技能/大招按钮独立触控层，热区 >= 64px
   - 自动开火与辅助瞄准可开关
   - 击杀/连杀/波次通知适配小屏
   - 核心/节点状态信息紧凑化

2. **操作辅助系统**
   - 辅助瞄准：轻微磁性吸附
   - 自动开火：进入射程自动射击
   - 摇杆死区、尺寸、位置可配置
   - 技能建议提示（可开关）

3. **全站移动端响应式**
   - 首页/落地页横屏适配
   - 英雄选择、模式选择改为移动端卡片流
   - 大厅/设置/商店/军械库拇指热区
   - 结算/升级弹窗全屏化

4. **性能与画质**
   - 画质档位影响粒子数量、特效、DPR
   - 移动端默认中档画质
   - 尊重 `prefers-reduced-motion`

### 3.2 新内容扩展

1. **新英雄**
   - Bastion（堡垒）：工程/建造定位
   - 主动技能：放置大血量水泥墙
   - 终极技能：6 枚大范围自索敌巡飞弹
   - 状态：已实现

2. **新地图/关卡**
   - frozen-orbit / 冰封轨道站
   - biohazard-lab / 生物污染实验室
   - 状态：已实现

3. **赛季/通行证**
   - 50 级双轨（免费/付费）
   - 日常/周常/赛季任务，XP 由玩法行为驱动
   - 奖励：皮肤、表情、徽章、赛季币、英雄解锁、便利道具
   - 状态：核心逻辑已实现，需补充服务端持久化

### 3.3 商业模式约束

- **不卖数值**：武器、英雄属性不可付费获取
- **不卖抽卡**：无 gacha 机制
- **可付费内容**：
  - 英雄快速解锁（免费玩家可通过游戏币/任务解锁）
  - 皮肤、外观、表情
  - 通行证（外观/便利奖励）
  - 便利道具（存档栏位、经验加成不影响对局）

### 3.4 联机同步

- **目标架构**：混合模型
  - 大厅/匹配/账户：Next.js API + Supabase
  - 局内：WebRTC P2P，主机 authoritative
  - 同步内容：玩家位置/血量/技能事件、核心血量、节点占领进度
  - 客户端预测 + 关键事件校正
- **当前状态**：P2P 房间与信令已实现，缺少服务端大厅/匹配 API 与账户持久化表

### 3.5 账户持久化

- **目标**：混合
  - 游客账户：本地 localStorage 保存进度
  - 服务端：Supabase 保存赛季进度、账户、战绩
  - 注册/登录后合并本地与云端数据
- **当前状态**：仅本地存档实现，服务端账户表缺失

---

## 4. 技术债务

### 4.1 已知债务

| 编号 | 债务项 | 影响 | 建议处理 |
| ---- | ---- | ---- | ---- |
| D01 | Windows 本地 standalone 构建因 pnpm symlink 权限失败 | 仅影响 Windows 本地预览 | 使用 `pnpm start` 或切换至 Ubuntu/Docker 构建 |
| D02 | 部分 UI 组件仍使用内联样式与硬编码颜色 | 维护成本略高 | 逐步迁移至 CSS 变量与 Tailwind 配置 |
| D03 | 网络同步对可部署实体与防御状态覆盖不完整 | 多人据点防守体验可能不一致 | 补充 `GameRoomManager` 对 defenseState 的序列化同步 |
| D04 | 音效系统依赖 Howler，单元测试环境打印大量 `Not implemented` 警告 | 测试日志嘈杂 | 增加测试 stub 或切换至 Web Audio 轻量封装 |
| D05 | 移动端 HUD 已初步适配，但真机验证不足 | 手游体验可能仍有误触 | 增加真机测试与触控热区调优 |
| D06 | 画质档位已影响 DPR，粒子池降级未完全落地 | 低配设备可能掉帧 | 在 engine/particles/fx 中按 quality 降级 |
| D07 | 服务端大厅/匹配/账户持久化缺失 | 无法支持跨设备进度与稳定联机 | 新增 Supabase 表与 Next.js API |
| D08 | 赛季/通行证本地状态未与服务端同步 | 进度可能丢失 | 实现游客/登录账户双写 |
| D09 | `PROJECT_BASELINE.md` 需随版本持续更新 | 基线可能过期 | 每次大版本迭代同步 |

### 4.2 代码统计参考

- 当前已修改/新增文件超过 50 个
- 单元测试：618 个全部通过（L3V100 最终状态）
- TypeScript 类型检查：待本次完整扫描后重新验证

---

## 5. 风险清单

| 编号 | 风险 | 可能性 | 影响 | 缓解措施 |
| ---- | ---- | ------ | ---- | -------- |
| R01 | 阿里云 ECS 首次构建因网络/权限失败 | 中 | 高 | 使用 `scripts/deploy-windows.ps1` 自动化，预留手动回退步骤 |
| R02 | WebRTC P2P 在不同网络环境下无法直连 | 高 | 中 | 准备 TURN 服务器配置说明 |
| R03 | 据点防守多人同步延迟导致节点占领不同步 | 中 | 高 | 主机 authoritative，客户端预测 + 状态校验 |
| R04 | Boss 巨像数值过强/过弱影响首日体验 | 中 | 中 | 预留热更新平衡参数能力 |
| R05 | Sentry 未配置 token 时构建仍尝试上传 | 低 | 中 | 已在 `next.config.mjs` 中自动禁用 sourcemap 上传 |
| R06 | 移动端触控适配复杂度高，可能导致误触回归 | 中 | 高 | 增加移动端专项测试与真机验证 |
| R07 | 大量动画在低配设备上导致掉帧 | 中 | 中 | 已支持 `prefers-reduced-motion` 与画质设置 |
| R08 | 新内容扩展导致类型与测试爆炸 | 中 | 中 | 严格类型检查，每新增内容同步补充测试 |
| R09 | Windows Server 部署文档不完善 | 中 | 高 | 2.0 输出完整 Windows Server 部署手册 |
| R10 | 服务端账户/赛季持久化设计不当导致数据冲突 | 中 | 高 | 明确游客/登录/合并状态机，写入前校验版本 |

---

## 6. 部署验证建议

1. 在目标主机执行部署脚本
2. 确认 `pm2 status` 显示 `project-m` 在线
3. 访问 `http://<服务器IP>:3000` 验证首页加载
4. 在移动设备浏览器横屏访问验证 HUD 与触控
5. 进行一局据点防守流程验证
6. 验证画质档位切换后粒子/特效变化
7. 验证赛季通行证任务进度保存
8. 可选：配置 Nginx/IIS + SSL

---

## 7. 结论

Project-M 2.0 的核心方向已明确：以移动端横屏 Web 触控适配为重心，双端同等优化，中度操作辅助，分档画质，同步扩展新英雄、新地图与赛季/通行证。当前代码基础扎实，核心玩法、新内容、移动端 HUD、输入辅助均已实现。主要剩余工作集中在：

1. 全站页面移动端/响应式深度重塑
2. 服务端大厅/匹配/账户持久化（Supabase 表 + Next.js API）
3. 局内 P2P 状态同步对 defenseState 与可部署实体的完整覆盖
4. 完整 Windows Server 部署手册与生产构建验证
