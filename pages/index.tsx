import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  Play,
  Users,
  Shield,
  ArrowRight,
  Sword,
  Skull,
  Trophy,
  Crown,
  Crosshair,
  CaretRight,
  Coin,
  Radioactive,
  PaintBrush,
  Lightning,
  Target,
  Question,
  Info,
  Gear,
  Clock,
  Star,
  Sparkle,
  Fire,
  Heartbeat,
  Pulse,
} from "@phosphor-icons/react";
import { loadSave, type SaveData } from "@/lib/game/save";
import { getModeList } from "@/lib/game/modes";
import type { GameModeType } from "@/lib/game/types";
import { HERO_DEFS } from "@/lib/game/heroes";
import { DEFAULT_BALANCE } from "@/lib/game/balance";
import NuclearBackground from "@/components/effects/NuclearBackground";
import GSAPTextReveal from "@/components/effects/GSAPTextReveal";
import GSAPScrollReveal from "@/components/effects/GSAPScrollReveal";
import GSAPCardStack, { type GSAPCardStackCard } from "@/components/effects/GSAPCardStack";
import Button from "@/components/ui/Button";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useAuth } from "@/hooks/useAuth";
import AuthButton from "@/components/AuthButton";

const MODES: {
  type: GameModeType;
  label: string;
  icon: typeof Shield;
  accent: string;
  desc: string;
  featured: boolean;
  span: string;
}[] = [
  {
    type: "defense",
    label: "据点防守",
    icon: Shield,
    accent: "#7a8f3e",
    desc: "2-4 人合作守护核心",
    featured: true,
    span: "lg:col-span-3 lg:row-span-2",
  },
  {
    type: "extreme-survival",
    label: "极限生存",
    icon: Lightning,
    accent: "#c45c4a",
    desc: "满配超频极限挑战",
    featured: true,
    span: "lg:col-span-3 lg:row-span-2",
  },
  {
    type: "survival",
    label: "生存模式",
    icon: Skull,
    accent: "#b84a55",
    desc: "15 分钟割草突围",
    featured: false,
    span: "lg:col-span-3",
  },
  {
    type: "campaign",
    label: "战役模式",
    icon: Target,
    accent: "#b87a3d",
    desc: "连续任务推进",
    featured: false,
    span: "lg:col-span-3",
  },
  {
    type: "deathmatch",
    label: "个人死斗",
    icon: Sword,
    accent: "#b84a55",
    desc: "PvP 竞技对抗",
    featured: false,
    span: "lg:col-span-3",
  },
  {
    type: "peak-challenge",
    label: "巅峰挑战",
    icon: Trophy,
    accent: "#b87a3d",
    desc: "全球排行榜竞速",
    featured: false,
    span: "lg:col-span-3",
  },
];

const modeCardStack: GSAPCardStackCard[] = [
  {
    id: "defense",
    title: "据点防守",
    description: "与队友协同守卫核芯反应堆。分工明确：前线承伤、远程输出、治疗支援。每波敌人强度递增，Boss 战需要精确配合。",
    meta: "旗舰模式",
    color: "success",
  },
  {
    id: "extreme",
    title: "极限生存",
    description: "满配开局，超频武器火力全开。面对 5 倍密度敌潮，每一秒都是生存考验。只有最强者能撑过 10 分钟。",
    meta: "高难挑战",
    color: "danger",
  },
  {
    id: "roguelike",
    title: "肉鸽构筑",
    description: "每次升级从诅咒与祝福中二选一。诅咒带来负面效果但奖励更丰厚，祝福提供稳定增益。构建你的专属流派。",
    meta: "策略深度",
    color: "primary",
  },
  {
    id: "weather",
    title: "动态天气",
    description: "辐射风暴、酸雨、沙尘暴实时影响战场。视野受限、移速降低、持续伤害，环境本身就是你的敌人。",
    meta: "沉浸体验",
    color: "accent",
  },
];

function RankBadge({ runs }: { runs: number }) {
  const ranks = [
    { min: 0, name: "新兵", color: "#6e7870" },
    { min: 5, name: "列兵", color: "#5e8c6a" },
    { min: 20, name: "中士", color: "#7a8f3e" },
    { min: 50, name: "上尉", color: "#b87a3d" },
    { min: 100, name: "指挥官", color: "#b84a55" },
  ];
  const rank = [...ranks].reverse().find((r) => runs >= r.min) ?? ranks[0];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
      style={{
        borderColor: `${rank.color}40`,
        color: rank.color,
        backgroundColor: `${rank.color}10`,
      }}
    >
      <Crown size={12} weight="fill" />
      {rank.name}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, accent }: {
  label: string;
  value: number;
  icon: typeof Crosshair;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-panel/60 p-3 transition-all hover:border-primary/30 hover:bg-panel">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
            {value.toLocaleString()}
          </p>
        </div>
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors group-hover:scale-110"
          style={{ backgroundColor: `${accent}12`, color: accent }}
        >
          <Icon size={18} weight="bold" />
        </span>
      </div>
    </div>
  );
}

function PlayerProfileCard({ save, isAuthenticated, user }: {
  save: SaveData | null;
  isAuthenticated: boolean;
  user: { provider: string; avatarUrl: string | null } | null;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-panel/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/8 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              指挥官档案
            </p>
            <h3 className="mt-1 text-xl font-bold tracking-tight">
              {isAuthenticated ? "认证指挥官" : "匿名幸存者"}
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              {isAuthenticated && user
                ? `${user.provider === "github" ? "GitHub" : "邮箱"} 账号`
                : "本地存档"}
            </p>
            <div className="mt-2">
              <RankBadge runs={save?.totalRuns ?? 0} />
            </div>
          </div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background">
            <Crosshair size={24} weight="bold" className="text-primary" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatCard label="出战" value={save?.totalRuns ?? 0} icon={Play} accent="#7a8f3e" />
          <StatCard label="击杀" value={save?.totalKills ?? 0} icon={Skull} accent="#b84a55" />
          <StatCard label="最佳" value={save?.bestRun?.stats.kills ?? 0} icon={Star} accent="#b87a3d" />
          <StatCard label="武器" value={save?.unlockedWeapons.length ?? 1} icon={Sword} accent="#c45c4a" />
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/50 px-3 py-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Coin size={16} weight="fill" />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">游戏币</p>
              <p className="font-mono text-lg font-bold tabular-nums">{save?.coins ?? 0}</p>
            </div>
          </div>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80 focus-ring rounded"
          >
            查看战绩 <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ModeSelector({
  selected,
  onSelect,
}: {
  selected: GameModeType;
  onSelect: (mode: GameModeType) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {MODES.filter((m) => m.featured).map((mode) => {
        const active = selected === mode.type;
        const Icon = mode.icon;
        return (
          <button
            key={mode.type}
            type="button"
            onClick={() => onSelect(mode.type)}
            className={`group inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all focus-ring ${
              active
                ? "border-primary/40 bg-primary/10 text-primary shadow-lg shadow-primary/5"
                : "border-border bg-panel/60 text-muted hover:border-muted/50 hover:text-foreground"
            }`}
          >
            <Icon
              size={16}
              weight={active ? "bold" : "regular"}
              style={{ color: active ? mode.accent : undefined }}
            />
            <span>{mode.label}</span>
            <span className="hidden text-xs text-muted sm:inline">{mode.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

function EncyclopediaRow() {
  const weapons = Object.values(DEFAULT_BALANCE.weapons);
  const enemies = Object.keys(DEFAULT_BALANCE.enemies).filter((k) => k !== "base");
  const heroes = Object.values(HERO_DEFS);

  const items = [
    {
      href: "/heroes",
      label: `${heroes.length} 位英雄`,
      sub: "干员与外观",
      icon: PaintBrush,
      accent: "#7a8f3e",
    },
    {
      href: "/armory",
      label: `${weapons.length} 种武器`,
      sub: "升级与数值",
      icon: Sword,
      accent: "#b87a3d",
    },
    {
      href: "/enemies",
      label: `${enemies.length} 类敌人`,
      sub: "威胁图鉴",
      icon: Skull,
      accent: "#b84a55",
    },
    {
      href: "/algorithms",
      label: "核心算法",
      sub: "引擎与机制",
      icon: Gear,
      accent: "#c45c4a",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col gap-2 rounded-xl border border-border bg-panel/50 p-3 transition-all hover:border-primary/30 hover:bg-panel hover:shadow-lg hover:shadow-primary/5 focus-ring"
          >
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors group-hover:scale-110"
              style={{ backgroundColor: `${item.accent}15`, color: item.accent }}
            >
              <Icon size={16} weight="bold" />
            </span>
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-xs text-muted">{item.sub}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function HomePage() {
  const [save, setSave] = useState<SaveData | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameModeType>("defense");
  const reducedMotion = useReducedMotion();
  const { user, isAuthenticated } = useAuth();
  const { announcements, loading: announcementsLoading } = useAnnouncements({ active: true, limit: 1 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const playHref =
    selectedMode === "defense"
      ? "/game?mode=defense&multiplayer=1"
      : selectedMode === "extreme-survival"
        ? "/game?mode=extreme-survival"
        : `/game?mode=${selectedMode}`;

  const announcement = announcements[0];

  return (
    <div
      ref={scrollRef}
      className="relative min-h-[100dvh] overflow-y-auto overflow-x-hidden bg-background text-foreground"
    >
      <NuclearBackground />
      <div className="noise-overlay" />

      <motion.div
        style={{ y: reducedMotion ? 0 : bgY }}
        className="pointer-events-none fixed inset-0 z-0"
      >
        <div className="absolute -right-[15%] -top-[15%] h-[80vh] w-[80vh] rounded-full bg-primary/5 blur-[140px]" />
        <div className="absolute -bottom-[15%] -left-[10%] h-[70vh] w-[70vh] rounded-full bg-accent/4 blur-[120px]" />
      </motion.div>

      {/* Navigation */}
      <motion.header
        initial={reducedMotion ? undefined : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-4 py-3"
      >
        <Link href="/" className="group flex items-center gap-2 focus-ring rounded-lg">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
            <Crosshair size={18} weight="bold" />
          </span>
          <div className="flex flex-col">
            <span className="font-mono text-sm font-bold uppercase tracking-widest">Project M</span>
            <span className="text-[10px] text-muted">L3V100</span>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {[
            { href: "/leaderboard", label: "战绩", icon: Trophy },
            { href: "/heroes", label: "商店", icon: PaintBrush },
            { href: "/help", label: "指南", icon: Question },
            { href: "/about", label: "关于", icon: Info },
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
          <AuthButton />
        </nav>
      </motion.header>

      {/* Announcement */}
      {announcement && !announcementsLoading && (
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative z-20 mx-auto max-w-7xl px-4"
        >
          <Link
            href="/landing"
            className="flex items-center gap-2 rounded-xl border border-accent/15 bg-accent/5 px-4 py-2.5 text-xs text-accent transition-colors hover:bg-accent/8"
          >
            <Pulse size={14} weight="bold" className="animate-pulse" />
            <span className="font-medium">{announcement.title}</span>
            <span className="hidden text-muted sm:inline">
              {announcement.content.slice(0, 60)}...
            </span>
            <ArrowRight size={12} className="ml-auto shrink-0" />
          </Link>
        </motion.div>
      )}

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 md:py-24 lg:py-32">
        <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left: Title + CTA */}
          <div className="flex flex-col justify-center lg:col-span-7">
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/20 bg-warning/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-warning">
                <Radioactive size={10} weight="fill" className="animate-spin-slow" />
                辐射区在线
              </span>

              <h1 className="mt-4 text-[clamp(2.25rem,6vw,4rem)] font-bold leading-[0.9] tracking-tight">
                守住据点
                <br />
                <span className="text-primary">杀穿敌潮</span>
              </h1>

              <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted md:text-base">
                旗舰版多模式融合：据点防守、极限生存、肉鸽构筑与赛季挑战。
                动态天气系统与诅咒祝福双选，每一局都是独一无二的战役。
              </p>
            </motion.div>

            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Link
                href={playHref}
                className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-6 text-sm font-bold text-background shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 focus-ring active:scale-[0.97] md:h-14 md:text-base"
              >
                <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
                <Play size={20} weight="fill" />
                <span className="whitespace-nowrap">立即开始</span>
                <CaretRight size={16} weight="bold" />
              </Link>
              <Link
                href="/game?multiplayer=1"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-panel/80 px-5 text-sm font-semibold backdrop-blur-sm transition-all hover:border-accent/40 hover:bg-panel focus-ring active:scale-[0.97] md:h-14"
              >
                <Users size={18} />
                <span className="whitespace-nowrap">组队大厅</span>
              </Link>
            </motion.div>

            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6"
            >
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                选择任务类型
              </p>
              <ModeSelector selected={selectedMode} onSelect={setSelectedMode} />
            </motion.div>
          </div>

          {/* Right: Player Profile */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <PlayerProfileCard
              save={save}
              isAuthenticated={isAuthenticated}
              user={user}
            />
          </motion.div>
        </div>
      </section>

      {/* Quick Stats Row */}
      <GSAPScrollReveal direction="up" className="relative z-10 mx-auto max-w-7xl px-4 pb-8">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "英雄", value: Object.keys(HERO_DEFS).length, icon: PaintBrush, accent: "#7a8f3e" },
            { label: "武器", value: Object.keys(DEFAULT_BALANCE.weapons).length, icon: Sword, accent: "#b87a3d" },
            { label: "敌人", value: Object.keys(DEFAULT_BALANCE.enemies).filter((k) => k !== "base").length, icon: Skull, accent: "#b84a55" },
            { label: "模式", value: getModeList().length, icon: Target, accent: "#c45c4a" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1 rounded-xl border border-border bg-panel/40 p-3 text-center"
              >
                <Icon size={16} weight="bold" style={{ color: stat.accent }} />
                <span className="font-mono text-lg font-bold tabular-nums">{stat.value}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted">{stat.label}</span>
              </div>
            );
          })}
        </div>
      </GSAPScrollReveal>

      {/* Bento Mode Grid */}
      <GSAPScrollReveal direction="up" className="relative z-10 mx-auto max-w-7xl px-4 pb-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">作战模式</h2>
            <p className="mt-0.5 text-xs text-muted">选择你的战场，每一种模式都是截然不同的体验</p>
          </div>
          <Link
            href="/modes"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-foreground focus-ring rounded"
          >
            全部模式 <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-flow-dense grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const href =
              mode.type === "defense"
                ? "/game?mode=defense&multiplayer=1"
                : mode.type === "extreme-survival"
                  ? "/game?mode=extreme-survival"
                  : mode.type === "deathmatch"
                    ? "/game?mode=deathmatch"
                    : mode.type === "peak-challenge"
                      ? "/game?mode=peak-challenge"
                      : `/game?mode=${mode.type}`;

            return (
              <Link
                key={mode.type}
                href={href}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-panel/60 p-4 transition-all hover:border-primary/30 hover:bg-panel hover:shadow-xl hover:shadow-primary/5 focus-ring ${mode.span}`}
                style={{ borderColor: mode.featured ? `${mode.accent}25` : undefined }}
              >
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-40"
                  style={{ backgroundColor: mode.accent }}
                />
                {mode.featured && (
                  <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.8),transparent_70%)]" />
                )}

                <div className="relative">
                  <div className="flex items-start justify-between">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${mode.accent}15`, color: mode.accent }}
                    >
                      <Icon size={20} weight="bold" />
                    </span>
                    {mode.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        <Sparkle size={10} weight="fill" />
                        主打
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <h3 className="text-base font-bold tracking-tight md:text-lg">{mode.label}</h3>
                    <p className="mt-1 text-xs text-muted">{mode.desc}</p>
                  </div>
                </div>

                <div className="relative mt-4 flex items-center gap-2 text-xs text-muted">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-panel-raised">
                    <CaretRight size={10} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="opacity-0 transition-opacity group-hover:opacity-100">进入战场</span>
                </div>
              </Link>
            );
          })}
        </div>
      </GSAPScrollReveal>

      {/* GSAP Card Stack - Mode Features */}
      <GSAPScrollReveal direction="up" className="relative z-10 mx-auto max-w-7xl px-4 pb-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">核心特性</h2>
          <p className="mt-0.5 text-xs text-muted">探索旗舰版的深度机制与玩法创新</p>
        </div>
      </GSAPScrollReveal>

      <section className="relative z-10">
        <GSAPCardStack cards={modeCardStack} className="mb-4" />
      </section>

      {/* Encyclopedia Row */}
      <GSAPScrollReveal direction="up" className="relative z-10 mx-auto max-w-7xl px-4 pb-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">资料库</h2>
          <p className="mt-0.5 text-xs text-muted">完整的武器、敌人、英雄与算法数据</p>
        </div>
        <EncyclopediaRow />
      </GSAPScrollReveal>

      {/* Quick Action Row */}
      <GSAPScrollReveal direction="up" className="relative z-10 mx-auto max-w-7xl px-4 pb-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/leaderboard"
            className="group flex items-center gap-4 rounded-2xl border border-border bg-panel/50 p-4 transition-all hover:border-primary/30 hover:bg-panel focus-ring"
          >
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <Trophy size={24} weight="bold" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">全球排行榜</p>
              <p className="text-xs text-muted">查看最高击杀与生存时长记录</p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/settings"
            className="group flex items-center gap-4 rounded-2xl border border-border bg-panel/50 p-4 transition-all hover:border-accent/30 hover:bg-panel focus-ring"
          >
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Gear size={24} weight="bold" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">游戏设置</p>
              <p className="text-xs text-muted">音效、画面与操作偏好调整</p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </GSAPScrollReveal>

      {/* Footer CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-panel/60 p-8 shadow-2xl shadow-black/20 md:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/6 blur-3xl" />

          <div className="relative flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/20 bg-warning/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-warning">
              <Radioactive size={10} weight="fill" />
              准备就绪
            </span>

            <h2 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
              一人一枪，杀穿辐射区
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              公平竞技，无付费加成。浏览器打开即玩，你的战绩与解锁进度将同步至云端。
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={playHref}
                className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-6 text-sm font-bold text-background shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 focus-ring active:scale-[0.97]"
              >
                <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
                <Play size={18} weight="fill" />
                立即开始
              </Link>
              <Link
                href="/about"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-panel/80 px-5 text-sm font-semibold backdrop-blur-sm transition-all hover:border-accent/40 hover:bg-panel focus-ring active:scale-[0.97]"
              >
                <Info size={18} />
                了解更多
              </Link>
            </div>
          </div>
        </div>

        <footer className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted sm:flex-row">
          <p>公平竞技 · 无付费加成 · Project M L3V100</p>
          <div className="flex gap-4">
            <Link href="/about" className="transition-colors hover:text-foreground focus-ring rounded">
              关于
            </Link>
            <Link href="/settings" className="transition-colors hover:text-foreground focus-ring rounded">
              设置
            </Link>
            <Link href="/help" className="transition-colors hover:text-foreground focus-ring rounded">
              指南
            </Link>
          </div>
        </footer>
      </section>
    </div>
  );
}