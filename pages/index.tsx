import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Play,
  Users,
  Target,
  Calendar,
  Shield,
  Shuffle,
  Clock,
  ArrowRight,
  Sword,
  Skull,
  Trophy,
  Gear,
  Question,
  Info,
  Crown,
  Lightning,
  Crosshair,
  CaretRight,
  Coin,
} from "@phosphor-icons/react";
import { loadSave, type SaveData } from "@/lib/game/save";
import { getModeList } from "@/lib/game/modes";
import type { GameModeType } from "@/lib/game/types";
import { HERO_DEFS } from "@/lib/game/heroes";
import { DEFAULT_BALANCE } from "@/lib/game/balance";

const MODES: { type: GameModeType; label: string; icon: typeof Target; accent: string; desc: string }[] = [
  { type: "defense", label: "据点防守", icon: Shield, accent: "#4ecdc4", desc: "2-4 人合作" },
  { type: "campaign", label: "战役模式", icon: Target, accent: "#f4a261", desc: "连续任务" },
  { type: "endless", label: "无尽生存", icon: Clock, accent: "#e05a6a", desc: "极限存活" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function RankBadge({ runs }: { runs: number }) {
  const ranks = [
    { min: 0, name: "新兵", color: "#6c7280" },
    { min: 5, name: "列兵", color: "#52b788" },
    { min: 20, name: "中士", color: "#4ecdc4" },
    { min: 50, name: "上尉", color: "#f4a261" },
    { min: 100, name: "指挥官", color: "#e05a6a" },
  ];
  const rank = [...ranks].reverse().find((r) => runs >= r.min) ?? ranks[0];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
      style={{ borderColor: `${rank.color}40`, color: rank.color, backgroundColor: `${rank.color}10` }}
    >
      <Crown size={12} weight="fill" />
      {rank.name}
    </span>
  );
}

export default function HomePage() {
  const [save, setSave] = useState<SaveData | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameModeType>("defense");
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const modes = getModeList();
  const heroes = Object.values(HERO_DEFS);
  const weapons = Object.values(DEFAULT_BALANCE.weapons);
  const bossNames = Object.values(DEFAULT_BALANCE.bosses).map((b) => b.name);

  const playHref = selectedMode === "defense" ? "/game?mode=defense&multiplayer=1" : `/game?mode=${selectedMode}`;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground">
      {/* Background atmosphere */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(78,205,196,0.08),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(244,162,97,0.05),transparent_40%)]" />
        <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:48px_48px]" />
        <motion.div
          animate={reducedMotion ? undefined : { y: ["0%", "100%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 top-0 h-full w-full opacity-[0.04] [background:linear-gradient(to_bottom,transparent_0%,rgba(78,205,196,0.4)_50%,transparent_100%)]"
        />
      </div>

      {/* Top bar */}
      <motion.header
        initial={reducedMotion ? undefined : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 py-4"
      >
        <Link href="/" className="group flex items-center gap-2 focus-ring rounded-lg">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
            <Crosshair size={18} weight="bold" />
          </span>
          <div className="flex flex-col">
            <span className="font-mono text-sm font-bold uppercase tracking-widest">Project M</span>
            <span className="text-[10px] text-muted">L3V100 创世版</span>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {[
            { href: "/leaderboard", label: "战绩", icon: Trophy },
            { href: "/help", label: "指南", icon: Question },
            { href: "/about", label: "关于", icon: Info },
            { href: "/settings", label: "设置", icon: Gear },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted transition-all hover:bg-panel hover:text-foreground focus-ring"
              >
                <Icon size={14} className="transition-colors group-hover:text-primary" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </motion.header>

      {/* Main menu */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-4 md:pt-8">
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left: title + play */}
          <div className="flex flex-col justify-center lg:col-span-7">
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                系统在线
              </span>
              <h1 className="mt-5 text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
                自动射击
                <br />
                <span className="text-primary">手动生存</span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted md:text-base">
                选择模式、英雄与武器，在科技末日废墟中完成任务并撤离。据点防守支持 2-4 人联机合作。
              </p>
            </motion.div>

            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <Link
                href={playHref}
                className="group relative inline-flex h-16 items-center justify-center gap-3 overflow-hidden rounded-2xl bg-primary px-10 text-lg font-bold text-background shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 focus-ring active:scale-95 md:h-20 md:text-xl"
              >
                <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
                <Play size={28} weight="fill" />
                <span className="whitespace-nowrap">立即部署</span>
                <CaretRight size={20} weight="bold" />
              </Link>
              <Link
                href="/game?multiplayer=1"
                className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl border border-border bg-panel px-6 text-sm font-semibold transition-all hover:border-accent/40 hover:bg-panel-raised focus-ring active:scale-95"
              >
                <Users size={20} />
                <span className="whitespace-nowrap">组队大厅</span>
              </Link>
            </motion.div>

            {/* Mode quick selector */}
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8"
            >
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">选择任务类型</p>
              <div className="flex flex-wrap gap-2">
                {MODES.map((mode) => {
                  const active = selectedMode === mode.type;
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.type}
                      type="button"
                      onClick={() => setSelectedMode(mode.type)}
                      className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all focus-ring ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-panel text-muted hover:border-muted/60 hover:text-foreground"
                      }`}
                    >
                      <Icon size={16} weight={active ? "bold" : "regular"} style={{ color: active ? mode.accent : undefined }} />
                      <span>{mode.label}</span>
                      <span className="hidden text-xs text-muted sm:inline">{mode.desc}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Right: player profile */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="lg:col-span-5"
          >
            <div className="relative overflow-hidden rounded-3xl border border-border bg-panel p-6 shadow-2xl shadow-black/20 md:p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-muted">指挥官档案</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight">匿名幸存者</h2>
                    <div className="mt-2">
                      <RankBadge runs={save?.totalRuns ?? 0} />
                    </div>
                  </div>
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background">
                    <Crosshair size={28} weight="bold" className="text-primary" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-background/50 p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-muted">出战</p>
                    <p className="mt-1 text-3xl font-bold">{save?.totalRuns ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/50 p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-muted">击杀</p>
                    <p className="mt-1 text-3xl font-bold">{save?.totalKills ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/50 p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-muted">最佳</p>
                    <p className="mt-1 text-3xl font-bold">{save?.bestRun?.stats.kills ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/50 p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-muted">武器</p>
                    <p className="mt-1 text-3xl font-bold">{save?.unlockedWeapons.length ?? 1}</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/50 px-3 py-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning">
                      <Coin size={16} weight="fill" />
                    </span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">游戏币</p>
                      <p className="font-mono text-lg font-bold">{save?.coins ?? 0}</p>
                    </div>
                  </div>
                  <Link
                    href="/leaderboard"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline focus-ring rounded"
                  >
                    查看战绩 <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mode tiles */}
        <motion.section
          initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 md:mt-14"
        >
          <div className="mb-4 flex items-end justify-between">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">快速进入</p>
            <Link href="/modes" className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground focus-ring rounded">
              全部模式 <ArrowRight size={12} />
            </Link>
          </div>
          <motion.div
            variants={reducedMotion ? undefined : containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {MODES.map((mode, index) => {
              const Icon = mode.icon;
              const featured = mode.type === "defense";
              return (
                <motion.div key={mode.type} variants={itemVariants} className={featured ? "sm:col-span-2 lg:col-span-2" : ""}>
                  <Link
                    href={mode.type === "defense" ? "/game?mode=defense&multiplayer=1" : `/game?mode=${mode.type}`}
                    className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border bg-panel p-5 transition-all hover:border-primary/40 hover:bg-panel-raised focus-ring"
                    style={{ borderColor: featured ? `${mode.accent}30` : undefined }}
                  >
                    <div
                      className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-opacity duration-500 opacity-30 group-hover:opacity-60"
                      style={{ backgroundColor: mode.accent }}
                    />
                    <div className="relative flex items-start justify-between">
                      <div
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${mode.accent}15`, color: mode.accent }}
                      >
                        <Icon size={22} weight="bold" />
                      </div>
                      {featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                          <Lightning size={10} weight="fill" />
                          主打
                        </span>
                      )}
                    </div>
                    <div className="relative mt-8">
                      <h3 className="text-lg font-bold tracking-tight">{mode.label}</h3>
                      <p className="mt-1 text-xs text-muted">{modes.find((m) => m.type === mode.type)?.description}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>

        {/* Encyclopedia shortcuts */}
        <motion.section
          initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/heroes"
              className="group flex items-center gap-4 rounded-2xl border border-border bg-panel p-4 transition-all hover:border-accent/40 hover:bg-panel-raised focus-ring"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Users size={20} weight="bold" />
              </div>
              <div>
                <p className="font-semibold">{heroes.length} 位英雄</p>
                <p className="text-xs text-muted">查看技能与天赋</p>
              </div>
              <CaretRight size={16} className="ml-auto text-muted transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/armory"
              className="group flex items-center gap-4 rounded-2xl border border-border bg-panel p-4 transition-all hover:border-primary/40 hover:bg-panel-raised focus-ring"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sword size={20} weight="bold" />
              </div>
              <div>
                <p className="font-semibold">{weapons.length} 种武器</p>
                <p className="text-xs text-muted">升级路线与数值</p>
              </div>
              <CaretRight size={16} className="ml-auto text-muted transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/modes"
              className="group flex items-center gap-4 rounded-2xl border border-border bg-panel p-4 transition-all hover:border-danger/40 hover:bg-panel-raised focus-ring"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
                <Skull size={20} weight="bold" />
              </div>
              <div>
                <p className="font-semibold">{bossNames.length} 位首领</p>
                <p className="text-xs text-muted">威胁图鉴与机制</p>
              </div>
              <CaretRight size={16} className="ml-auto text-muted transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.section>

        {/* Footer note */}
        <motion.footer
          initial={reducedMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted sm:flex-row"
        >
          <p>公平竞技 · 无付费加成 · Project M</p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-foreground focus-ring rounded">关于</Link>
            <Link href="/settings" className="hover:text-foreground focus-ring rounded">设置</Link>
          </div>
        </motion.footer>
      </main>
    </div>
  );
}
