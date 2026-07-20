import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  Play,
  Users,
  Target,
  Clock,
  Shield,
  ArrowRight,
  Sword,
  Skull,
  Trophy,
  Gear,
  Question,
  Info,
  Crown,
  Crosshair,
  CaretRight,
  Coin,
  Radioactive,
  Warning,
  Plus,
  Megaphone,
} from "@phosphor-icons/react";
import { loadSave, type SaveData } from "@/lib/game/save";
import { getModeList } from "@/lib/game/modes";
import type { GameModeType } from "@/lib/game/types";
import { HERO_DEFS } from "@/lib/game/heroes";
import { DEFAULT_BALANCE } from "@/lib/game/balance";
import NuclearBackground from "@/components/effects/NuclearBackground";
import { useAnnouncements } from "@/hooks/useAnnouncements";

const MODES: {
  type: GameModeType;
  label: string;
  icon: typeof Target;
  accent: string;
  desc: string;
}[] = [
  { type: "survival", label: "生存模式", icon: Skull, accent: "#b84a55", desc: "15 分钟割草" },
  { type: "defense", label: "据点防守", icon: Shield, accent: "#7a8f3e", desc: "2-4 人合作" },
  { type: "campaign", label: "战役模式", icon: Target, accent: "#b87a3d", desc: "连续任务" },
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

function RadiationBadge() {
  return (
    <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-warning">
      <Radioactive size={12} weight="fill" className="animate-spin-slow" />
      辐射区在线
    </span>
  );
}

function AnnouncementBanner() {
  const { announcements, loading, error } = useAnnouncements({ active: true, limit: 1 });
  if (loading || error || announcements.length === 0) return null;
  const announcement = announcements[0];
  return (
    <Link
      href="/landing"
      className="mx-auto flex max-w-7xl items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-2.5 text-xs text-accent transition-colors hover:bg-accent/10"
    >
      <Megaphone size={14} weight="bold" />
      <span className="font-medium">{announcement.title}</span>
      <span className="hidden text-muted sm:inline">{announcement.content.slice(0, 60)}...</span>
      <ArrowRight size={12} className="ml-auto shrink-0" />
    </Link>
  );
}

export default function HomePage() {
  const [save, setSave] = useState<SaveData | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameModeType>("defense");
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const modes = getModeList();
  const heroes = Object.values(HERO_DEFS);
  const weapons = Object.values(DEFAULT_BALANCE.weapons);
  const bossNames = Object.values(DEFAULT_BALANCE.bosses).map((b) => b.name);

  const playHref =
    selectedMode === "defense" ? "/game?mode=defense&multiplayer=1" : `/game?mode=${selectedMode}`;

  return (
    <div
      ref={scrollRef}
      className="relative min-h-[100dvh] overflow-y-auto overflow-x-hidden bg-background text-foreground"
    >
      <NuclearBackground />
      <div className="noise-overlay" />

      {/* Parallax ambient glow */}
      <motion.div
        style={{ y: reducedMotion ? 0 : bgY }}
        className="pointer-events-none fixed inset-0 z-0"
      >
        <div className="absolute -right-[20%] -top-[10%] h-[70vh] w-[70vh] rounded-full bg-primary/6 blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] h-[60vh] w-[60vh] rounded-full bg-accent/5 blur-[100px]" />
      </motion.div>

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

      <div className="relative z-20 px-4 pt-3">
        <AnnouncementBanner />
      </div>

      {/* Hero section */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-4 md:pt-6">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left: title + play */}
          <div className="flex flex-col justify-center lg:col-span-7">
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <RadiationBadge />
              <h1 className="mt-6 text-[clamp(2.75rem,8vw,6rem)] font-bold leading-[0.92] tracking-tight">
                一人一枪
                <br />
                <span className="text-primary">杀穿辐射区</span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted md:text-base">
                Project M 2.0 主打生存割草：自动攻击、自由移动、构建流派。在 15 分钟限时内
                抵御无尽敌潮，挑战最高击杀纪录。
              </p>
            </motion.div>

            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <Link
                href={playHref}
                className="group relative inline-flex h-16 items-center justify-center gap-3 overflow-hidden rounded-2xl bg-primary px-10 text-lg font-bold text-background shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 focus-ring active:scale-95 md:h-20 md:text-xl"
              >
                <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
                <Play size={28} weight="fill" />
                <span className="whitespace-nowrap">立即开始</span>
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
              initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8"
            >
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
                选择任务类型
              </p>
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
            </motion.div>
          </div>

          {/* Right: player profile */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <div className="relative overflow-hidden rounded-3xl border border-border bg-panel p-6 shadow-2xl shadow-black/20 md:p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-danger opacity-60" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-muted">
                      指挥官档案
                    </p>
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
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                        游戏币
                      </p>
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

        {/* Bento mode tiles */}
        <motion.section
          initial={reducedMotion ? undefined : { opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 md:mt-20"
        >
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">快速进入</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight">作战模式</h2>
            </div>
            <Link
              href="/modes"
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground focus-ring rounded"
            >
              全部模式 <ArrowRight size={12} />
            </Link>
          </div>
          <motion.div
            variants={reducedMotion ? undefined : containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-flow-dense grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const featured = mode.type === "survival";
              return (
                <motion.div
                  key={mode.type}
                  variants={itemVariants}
                  className={featured ? "sm:col-span-2 lg:col-span-2 lg:row-span-2" : ""}
                >
                  <Link
                    href={
                      mode.type === "defense"
                        ? "/game?mode=defense&multiplayer=1"
                        : `/game?mode=${mode.type}`
                    }
                    className="group relative flex h-full min-h-[160px] flex-col justify-between overflow-hidden rounded-2xl border bg-panel p-5 transition-all hover:border-primary/40 hover:bg-panel-raised focus-ring"
                    style={{ borderColor: featured ? `${mode.accent}30` : undefined }}
                  >
                    <div
                      className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-opacity duration-500 opacity-30 group-hover:opacity-60"
                      style={{ backgroundColor: mode.accent }}
                    />
                    {featured && (
                      <div className="pointer-events-none absolute inset-0 hazard-stripes opacity-40" />
                    )}
                    <div className="relative flex items-start justify-between">
                      <div
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${mode.accent}15`, color: mode.accent }}
                      >
                        <Icon size={22} weight="bold" />
                      </div>
                      {featured && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                          <Warning size={10} weight="fill" />
                          主打
                        </span>
                      )}
                    </div>
                    <div className="relative mt-8">
                      <h3 className="text-lg font-bold tracking-tight">{mode.label}</h3>
                      <p className="mt-1 text-xs text-muted">
                        {modes.find((m) => m.type === mode.type)?.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>

        {/* Encyclopedia shortcuts */}
        <motion.section
          initial={reducedMotion ? undefined : { opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/heroes"
              className="group flex items-center gap-4 rounded-2xl border border-border bg-panel p-4 transition-all hover:border-primary/40 hover:bg-panel-raised focus-ring"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users size={20} weight="bold" />
              </div>
              <div>
                <p className="font-semibold">{heroes.length} 位英雄</p>
                <p className="text-xs text-muted">查看技能与天赋</p>
              </div>
              <CaretRight
                size={16}
                className="ml-auto text-muted transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/armory"
              className="group flex items-center gap-4 rounded-2xl border border-border bg-panel p-4 transition-all hover:border-accent/40 hover:bg-panel-raised focus-ring"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Sword size={20} weight="bold" />
              </div>
              <div>
                <p className="font-semibold">{weapons.length} 种武器</p>
                <p className="text-xs text-muted">升级路线与数值</p>
              </div>
              <CaretRight
                size={16}
                className="ml-auto text-muted transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/enemies"
              className="group flex items-center gap-4 rounded-2xl border border-border bg-panel p-4 transition-all hover:border-danger/40 hover:bg-panel-raised focus-ring"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
                <Skull size={20} weight="bold" />
              </div>
              <div>
                <p className="font-semibold">
                  {Object.keys(DEFAULT_BALANCE.enemies).length - 1} 类敌人
                </p>
                <p className="text-xs text-muted">威胁图鉴与机制</p>
              </div>
              <CaretRight
                size={16}
                className="ml-auto text-muted transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </motion.section>

        {/* Nuclear warning strip */}
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-10 overflow-hidden rounded-2xl border border-warning/20 bg-warning/5"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <Radioactive size={20} weight="bold" className="shrink-0 text-warning" />
            <p className="text-xs leading-relaxed text-muted sm:text-sm">
              2.0 生存模式已上线：15 分钟限时挑战，全球排行榜记录你的最高击杀。
            </p>
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.footer
          initial={reducedMotion ? undefined : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-border pt-6 text-xs text-muted sm:flex-row"
        >
          <p>公平竞技 · 无付费加成 · Project M</p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-foreground focus-ring rounded">
              关于
            </Link>
            <Link href="/settings" className="hover:text-foreground focus-ring rounded">
              设置
            </Link>
          </div>
        </motion.footer>
      </main>
    </div>
  );
}
