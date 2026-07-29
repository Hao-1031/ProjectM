"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import React from "react";
import {
  GameController,
  Infinity,
  Calendar,
  TreeStructure,
  Shield,
  Target,
  Users,
  CaretRight,
  Sparkle,
  Crosshair,
  Radioactive,
  Warning,
  Play,
  Skull,
  Heartbeat,
  Gauge,
  Sword,
  ArrowsOut,
  Clock,
  Crown,
  Fire,
  Lightning,
  Trophy,
  Star,
  Hexagon,
  Pulse,
  Rocket,
} from "@phosphor-icons/react";
import { useState } from "react";
import Layout from "@/components/Layout";
import { getModeList, getDailyModifiers } from "@/lib/game/modes";
import NuclearBackground from "@/components/effects/NuclearBackground";

interface ModeMetaEntry {
  icon: typeof GameController;
  accent: string;
  accentBg: string;
  bullets: string[];
  threat: string;
  isFeatured: boolean;
  image?: string;
}

const MODE_META: Record<string, ModeMetaEntry> = {
  survival: { icon: Skull, accent: "text-danger", accentBg: "bg-danger/10", bullets: ["15 分钟限时生存", "自动攻击 + 移动 + Build 流派", "全球排行榜记录最高击杀"], threat: "高", isFeatured: false },
  campaign: { icon: Target, accent: "text-accent", accentBg: "bg-accent/10", bullets: ["完成 5-7 个连续任务", "抵达撤离点即可结算", "适合熟悉武器与地图"], threat: "低", isFeatured: false },
  endless: { icon: Infinity, accent: "text-danger", accentBg: "bg-danger/10", bullets: ["敌人强度随波次指数增长", "没有撤离点直到核心被摧毁", "考验极限生存与Build深度"], threat: "极高", isFeatured: false },
  daily: { icon: Calendar, accent: "text-warning", accentBg: "bg-warning/10", bullets: ["每日固定种子与地图", "全局统一词缀规则", "可与好友比拼当日分数"], threat: "中", isFeatured: false },
  roguelike: { icon: TreeStructure, accent: "text-success", accentBg: "bg-success/10", bullets: ["分支关卡树推进", "每关后选择诅咒或祝福", "击败最终首领通关"], threat: "高", isFeatured: false },
  defense: { icon: Shield, accent: "text-primary", accentBg: "bg-primary/10", bullets: ["2-4 人合作防守核心", "占领能量节点获得补给", "动态天气系统影响战局", "抵御 8 波机械敌潮与巨像"], threat: "高", isFeatured: true, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20battle%20scene%20of%20a%20fortified%20defense%20position%2C%20energy%20barriers%2C%20mechanical%20enemies%20approaching%2C%20dark%20industrial%20wasteland%2C%20low%20saturation%2C%20epic%20scale%2C%20no%20text&image_size=landscape_16_9" },
  deathmatch: { icon: Crosshair, accent: "text-danger", accentBg: "bg-danger/10", bullets: ["PVP 自由混战 + Bot", "率先达到击杀目标获胜", "限时最高击杀决胜", "动态阶段与连杀系统"], threat: "中", isFeatured: false },
  "peak-challenge": { icon: Crown, accent: "text-warning", accentBg: "bg-warning/10", bullets: ["赛季排名与段位系统", "5波挑战任务轮换", "完美波次额外奖励", "挑战连胜额外加分"], threat: "高", isFeatured: true, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20scene%20of%20an%20elite%20challenge%20arena%2C%20golden%20ranking%20icons%2C%20mechanical%20bosses%20circling%2C%20dark%20industrial%2C%20low%20saturation%2C%20epic%2C%20no%20text&image_size=landscape_16_9" },
  flagship: { icon: Trophy, accent: "text-primary", accentBg: "bg-primary/10", bullets: ["速通排名与时间挑战", "连击倍数得分系统", "完美波次大幅加分", "旗舰级综合挑战"], threat: "极高", isFeatured: true, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20scene%20of%20a%20flagship%20command%20center%2C%20holographic%20displays%2C%20tactical%20map%2C%20dark%20industrial%2C%20low%20saturation%2C%20epic%2C%20no%20text&image_size=landscape_16_9" },
  "flagship-peak": { icon: Rocket, accent: "text-primary", accentBg: "bg-primary/10", bullets: ["三阶段25波终极挑战", "标准巡航(1-10) → 超频增压(11-20) → 地狱终局(21-25)", "双轨挑战(固定+动态) + 双维度评级(速度×赛季)", "统一积分制 + 六维雷达结算 + 隐藏成就"], threat: "极高", isFeatured: true, image: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20scene%20of%20a%20spaceship%20bridge%20command%20center%2C%20three%20phase%20transformation%20from%20blue%20to%20red%20to%20void%20black%2C%20holographic%20tactical%20displays%2C%20dark%20industrial%20scifi%2C%20low%20saturation%2C%20epic%20scale%2C%20no%20text&image_size=landscape_16_9" },
  "extreme-survival": { icon: Lightning, accent: "text-danger", accentBg: "bg-danger/10", bullets: ["熵增事件随机触发", "过载阶段极限挑战", "表现评分系统", "Boss击杀与精英击杀统计"], threat: "极高", isFeatured: false },
};

const THREAT_COLOR: Record<string, string> = {
  低: "#5e8c6a", 中: "#c9a34e", 高: "#b87a3d", 极高: "#b84a55",
};

function ThreatBadge({ threat }: { threat: string }) {
  const color = THREAT_COLOR[threat] ?? THREAT_COLOR["低"];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]"
      style={{ borderColor: `${color}40`, color, backgroundColor: `${color}10` }}>
      <Warning size={9} weight="bold" />
      威胁 {threat}
    </span>
  );
}

function FlagshipPeakPhaseGlow() {
  const reducedMotion = useReducedMotion();
  const phases = [
    { color: "rgba(99, 102, 241, 0.4)", label: "标准巡航" },
    { color: "rgba(239, 68, 68, 0.5)", label: "超频增压" },
    { color: "rgba(168, 85, 247, 0.6)", label: "地狱终局" },
  ];
  const [activePhase, setActivePhase] = useState(0);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {phases.map((phase, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: activePhase === i ? 0.35 : 0.05 }}
          animate={reducedMotion ? {} : {
            opacity: activePhase === i ? [0.15, 0.35, 0.15] : 0.05,
          }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <div
            className="absolute -right-20 -top-20 h-80 w-80 rounded-full blur-3xl"
            style={{ backgroundColor: phase.color }}
          />
          <div
            className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full blur-3xl"
            style={{ backgroundColor: phase.color }}
          />
        </motion.div>
      ))}
      <div className="absolute bottom-3 right-3 flex gap-1.5">
        {phases.map((phase, i) => (
          <button
            key={i}
            type="button"
            className="pointer-events-auto relative h-2 w-2 rounded-full transition-all"
            style={{
              backgroundColor: activePhase === i ? phase.color : "rgba(255,255,255,0.15)",
              boxShadow: activePhase === i ? `0 0 8px ${phase.color}` : undefined,
            }}
            onClick={() => setActivePhase(i)}
            aria-label={phase.label}
          />
        ))}
      </div>
    </div>
  );
}

export default function ModesPage() {
  const reducedMotion = useReducedMotion();
  const modes = getModeList();
  const dailyModifiers = getDailyModifiers();

  return (
    <Layout title="作战模式">
      <div className="relative min-h-[100dvh]">
        <NuclearBackground />
        <div className="noise-overlay" />
        <div className="pointer-events-none absolute inset-0 z-0 bridge-grid opacity-20" />
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -right-[15%] top-[5%] h-[55vh] w-[55vh] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute -left-[10%] bottom-[10%] h-[45vh] w-[45vh] rounded-full bg-accent/4 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-3 md:py-6">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 md:mb-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
                  <Radioactive weight="duotone" size={14} className="status-pulse" />作战模式
                </span>
                <h1 className="mt-2 font-display text-[clamp(1.5rem,4vw,2.5rem)] font-bold leading-[0.95] tracking-tight">
                  选择<br /><span className="text-gradient">辐射区任务</span>
                </h1>
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">
                  10种模式覆盖单人任务、无尽生存、PVP混战与PvE合作。据点防守为奇迹版本核心玩法。
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-3 md:grid-cols-12 md:grid-flow-dense">
            {modes.map((mode, index) => {
              const meta = MODE_META[mode.type] ?? MODE_META.survival;
              const Icon = meta.icon;
              const isLarge = meta.isFeatured;
              const isFlagshipPeak = mode.type === "flagship-peak";
              const href =
                mode.type === "defense"
                  ? "/game?mode=defense&multiplayer=1"
                  : mode.type === "flagship-peak"
                    ? "/flagship-peak"
                    : `/game?mode=${mode.type}`;
              return (
                <motion.article key={mode.type}
                  initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
                  className={`bridge-panel group holo-scan relative overflow-hidden transition-all hover:border-primary/30 bridge-glow ${isFlagshipPeak ? "md:col-span-12" : isLarge ? "md:col-span-7" : "md:col-span-5"}`}>
                  {isFlagshipPeak && <FlagshipPeakPhaseGlow />}
                  {!isFlagshipPeak && (
                    <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full blur-3xl opacity-15 transition-opacity group-hover:opacity-35" style={{ backgroundColor: THREAT_COLOR[meta.threat] ?? "#6e7870" }} />
                  )}
                  <div className="relative flex h-full flex-col p-2.5 md:p-3">
                    {isLarge && meta.image && (
                      <div className="relative mb-3 overflow-hidden rounded-2xl">
                        <img src={meta.image} alt={mode.name} className={`object-cover w-full ${isFlagshipPeak ? "h-52 md:h-64" : "h-40 md:h-48"}`} />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-panel via-panel/30 to-transparent" />
                        <div className="pointer-events-none absolute inset-0 data-stream opacity-30" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                          <div className="flex items-center gap-2">
                            <span className="holo-ring inline-flex p-1.5">
                              <Icon size={20} weight="duotone" className={meta.accent} />
                            </span>
                            <div>
                              <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">{mode.name}</h2>
                              <ThreatBadge threat={meta.threat} />
                            </div>
                          </div>
                          {isFlagshipPeak ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                              <Rocket size={10} weight="fill" className="status-pulse" />
                              创世旗舰
                            </span>
                          ) : (
                            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-primary status-pulse">
                              旗舰
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {(!isLarge || !meta.image) && (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`holo-ring inline-flex p-1.5 ${meta.accentBg}`}>
                            <Icon size={20} weight="duotone" className={meta.accent} />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="font-display text-base font-bold tracking-tight">{mode.name}</h2>
                              {isLarge && (
                                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-primary status-pulse">
                                  旗舰
                                </span>
                              )}
                            </div>
                            <ThreatBadge threat={meta.threat} />
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="mt-2 text-[11px] leading-relaxed text-muted">{mode.description}</p>
                    <ul className="mt-2 space-y-1">
                      {meta.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-muted">
                          <CaretRight size={11} className="mt-0.5 shrink-0 text-primary" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                    {isFlagshipPeak && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {[
                          { label: "标准巡航", color: "#6366f1", icon: Shield },
                          { label: "超频增压", color: "#ef4444", icon: Fire },
                          { label: "地狱终局", color: "#a855f7", icon: Skull },
                        ].map((p) => (
                          <span
                            key={p.label}
                            className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold"
                            style={{ borderColor: `${p.color}40`, color: p.color, backgroundColor: `${p.color}10` }}
                          >
                            {React.createElement(p.icon, { size: 9, weight: "fill" })}
                            {p.label}
                          </span>
                        ))}
                        <span className="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold text-accent">
                          <Hexagon size={9} weight="fill" />
                          六维雷达
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[9px] font-bold text-warning">
                          <Star size={9} weight="fill" />
                          7隐藏成就
                        </span>
                      </div>
                    )}
                    {mode.type === "defense" && (
                      <div className="mt-1.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
                        <Users size={11} />推荐 2-4 人合作
                      </div>
                    )}
                    <div className="mt-auto pt-2">
                      <Link href={href}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all focus-ring active:scale-95 ${
                          isFlagshipPeak
                            ? "bg-primary text-background hover:bg-primary/90 shadow-lg shadow-primary/20"
                            : "bg-primary/10 text-primary hover:bg-primary hover:text-background"
                        }`}>
                        <Play size={14} weight="fill" />{isFlagshipPeak ? "进入旗舰巅峰" : "进入任务"}
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          <motion.section
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bridge-panel mt-4 p-2.5 md:p-3"
          >
            <div className="bridge-panel-header -mx-2.5 -mt-2.5 mb-2 md:-mx-3 md:-mt-3">
              <div className="flex items-center gap-2 px-2.5 pt-2.5 md:px-3 md:pt-3">
                <Sparkle size={12} weight="duotone" className="text-primary status-pulse" />
                <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">环境词缀</span>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {dailyModifiers.map((mod, index) => (
                <div key={index} className="bridge-panel p-2.5 transition-all hover:border-warning/20">
                  <div className="flex items-center gap-2">
                    <Warning size={12} weight="bold" className="text-warning" />
                    <p className="text-xs font-semibold">{mod.title}</p>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{mod.description}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mt-4 grid gap-3 md:grid-cols-2"
          >
            <Link href="/enemies"
              className="bridge-panel group relative p-3 transition-all hover:border-danger/40 bridge-glow">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-danger/10 blur-3xl" />
              <div className="relative flex items-center gap-3">
                <span className="holo-ring flex h-10 w-10 shrink-0 items-center justify-center text-danger">
                  <Skull size={22} weight="bold" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold tracking-tight">威胁图鉴</h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                    查看机械敌人的行为模式、精英词缀与首领机制，提前制定防守策略。
                  </p>
                </div>
                <CaretRight size={16} className="shrink-0 text-danger transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
            <Link href="/armory"
              className="bridge-panel group relative p-3 transition-all hover:border-primary/40 bridge-glow">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative flex items-center gap-3">
                <span className="holo-ring flex h-10 w-10 shrink-0 items-center justify-center text-primary">
                  <Crosshair size={22} weight="bold" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold tracking-tight">军械库</h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                    解锁并装配武器，自由搭配出战配置，找到最适合你的战术组合。
                  </p>
                </div>
                <CaretRight size={16} className="shrink-0 text-primary transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}