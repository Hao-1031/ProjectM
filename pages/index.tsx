import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
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
  PaintBrush,
  Lightning,
  Target,
  Question,
  Info,
  Gear,
  Clock,
  Star,
  Sparkle,
  Globe,
  Anchor,
  WifiHigh,
  BatteryCharging,
  Pulse,
  Broadcast,
  Planet,
  Rocket,
  Warning,
  CheckCircle,
  Fire,
  Hexagon,
} from "@phosphor-icons/react";
import { loadSave, type SaveData } from "@/lib/game/save";
import { getModeList } from "@/lib/game/modes";
import type { GameModeType } from "@/lib/game/types";
import { HERO_DEFS } from "@/lib/game/heroes";
import { DEFAULT_BALANCE } from "@/lib/game/balance";
import DimensionBackground from "@/components/effects/DimensionBackground";
import BrandLogo from "@/components/BrandLogo";
import GSAPScrollReveal from "@/components/effects/GSAPScrollReveal";
import GSAPCardStack, { type GSAPCardStackCard } from "@/components/effects/GSAPCardStack";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useAuth } from "@/hooks/useAuth";
import AuthButton from "@/components/AuthButton";

const MODES: {
  type: GameModeType;
  label: string;
  subtitle: string;
  icon: typeof Shield;
  accent: string;
  desc: string;
  featured: boolean;
  span: string;
}[] = [
  {
    type: "flagship-peak",
    label: "旗舰巅峰",
    subtitle: "创世维度",
    icon: Rocket,
    accent: "primary",
    desc: "三阶段25波 · 双轨挑战 · 双维度评级 · 六维雷达",
    featured: true,
    span: "lg:col-span-6 lg:row-span-2",
  },
  {
    type: "defense",
    label: "据点防守",
    subtitle: "锚点维度",
    icon: Shield,
    accent: "success",
    desc: "2-4人合作守护核心锚点",
    featured: true,
    span: "lg:col-span-3",
  },
  {
    type: "extreme-survival",
    label: "极限生存",
    subtitle: "压力维度",
    icon: Lightning,
    accent: "danger",
    desc: "满配超频极限挑战",
    featured: true,
    span: "lg:col-span-3 lg:row-span-2",
  },
  {
    type: "survival",
    label: "生存模式",
    subtitle: "混沌维度",
    icon: Skull,
    accent: "orbital",
    desc: "15分钟割草突围",
    featured: false,
    span: "lg:col-span-3",
  },
  {
    type: "campaign",
    label: "战役模式",
    subtitle: "叙事维度",
    icon: Target,
    accent: "accent",
    desc: "连续任务推进",
    featured: false,
    span: "lg:col-span-3",
  },
  {
    type: "deathmatch",
    label: "个人死斗",
    subtitle: "冲突维度",
    icon: Sword,
    accent: "caution",
    desc: "PvP竞技对抗",
    featured: false,
    span: "lg:col-span-3",
  },
  {
    type: "peak-challenge",
    label: "巅峰挑战",
    subtitle: "竞技维度",
    icon: Trophy,
    accent: "accent",
    desc: "全球排行榜竞速",
    featured: false,
    span: "lg:col-span-3",
  },
];

const modeCardStack: GSAPCardStackCard[] = [
  {
    id: "defense",
    title: "据点防守",
    description: "与队友协同守卫核芯锚点。分工明确：前线承伤、远程输出、治疗支援。每波敌人强度递增，Boss战需要精确配合。",
    meta: "旗舰模式",
    color: "success",
  },
  {
    id: "extreme",
    title: "极限生存",
    description: "满配开局，超频武器火力全开。面对5倍密度敌潮，每一秒都是生存考验。只有最强者能撑过维度风暴。",
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
    title: "维度天气",
    description: "辐射风暴、酸雨、沙尘暴实时影响战场。视野受限、移速降低、持续伤害，维度环境本身就是你的敌人。",
    meta: "沉浸体验",
    color: "accent",
  },
];

function RankBadge({ runs }: { runs: number }) {
  const ranks = [
    { min: 0, name: "维度行者", color: "#8A8578" },
    { min: 5, name: "锚定者", color: "#4A8C5A" },
    { min: 20, name: "维度卫士", color: "#3B7DD8" },
    { min: 50, name: "维度领主", color: "#C8A45C" },
    { min: 100, name: "多元锚主", color: "#C4554A" },
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
    <div className="group relative overflow-hidden rounded-xl border border-border bg-panel/60 p-3 transition-all hover:border-primary/20 hover:bg-panel hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight tabular-nums">
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
    <div className="station-panel orbital-scan relative overflow-hidden rounded-2xl p-5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/[0.03] blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              维度行者档案
            </p>
            <h3 className="mt-1 font-display text-xl font-bold tracking-tight">
              {isAuthenticated ? "认证维度行者" : "匿名穿越者"}
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              {isAuthenticated && user
                ? `${user.provider === "github" ? "GitHub" : "邮箱"} 锚定`
                : "本地维度存档"}
            </p>
            <div className="mt-2">
              <RankBadge runs={save?.totalRuns ?? 0} />
            </div>
          </div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background">
            <BrandLogo size={24} variant="icon" className="text-primary" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatCard label="维度穿越" value={save?.totalRuns ?? 0} icon={Play} accent="var(--primary)" />
          <StatCard label="消灭" value={save?.totalKills ?? 0} icon={Skull} accent="var(--danger)" />
          <StatCard label="最佳记录" value={save?.bestRun?.stats.kills ?? 0} icon={Star} accent="var(--accent)" />
          <StatCard label="武器" value={save?.unlockedWeapons.length ?? 1} icon={Sword} accent="var(--orbital)" />
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/50 px-3 py-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Coin size={16} weight="fill" />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">锚点碎片</p>
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

function HoloModeSelector({
  selected,
  onSelect,
}: {
  selected: GameModeType;
  onSelect: (mode: GameModeType) => void;
}) {
  const [hoveredMode, setHoveredMode] = useState<GameModeType | null>(null);
  const reducedMotion = useReducedMotion();

  const selectedMode = MODES.find((m) => m.type === selected) ?? MODES[0];
  const SelectedIcon = selectedMode.icon;

  const orbitModes = MODES.filter((m) => m.type !== selected);
  const orbitRadius = 140;

  return (
    <div className="station-panel orbital-scan relative flex flex-col items-center justify-center rounded-2xl p-6">
      <div className="station-panel-header absolute inset-x-0 top-0" />

      <div className="relative flex h-[320px] w-[320px] items-center justify-center sm:h-[360px] sm:w-[360px]">
        {/* Outer orbital rings */}
        <motion.div
          className="orbital-ring absolute inset-0"
          animate={reducedMotion ? {} : { rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="orbital-ring absolute inset-4"
          style={{ opacity: 0.5 }}
          animate={reducedMotion ? {} : { rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="orbital-ring absolute inset-8"
          style={{ opacity: 0.25 }}
          animate={reducedMotion ? {} : { rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />

        <div className="pointer-events-none absolute inset-12 rounded-full border border-dashed border-primary/8" />

        {/* Orbiting mode nodes */}
        {orbitModes.map((mode, index) => {
          const total = orbitModes.length;
          const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * orbitRadius;
          const y = Math.sin(angle) * orbitRadius;
          const Icon = mode.icon;
          const isHovered = hoveredMode === mode.type;

          return (
            <motion.button
              key={mode.type}
              type="button"
              onClick={() => onSelect(mode.type)}
              onMouseEnter={() => setHoveredMode(mode.type)}
              onMouseLeave={() => setHoveredMode(null)}
              className="absolute flex flex-col items-center gap-1 focus-ring rounded-full"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: "translate(-50%, -50%)",
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <AnimatePresence>
                {isHovered && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="pointer-events-none absolute -top-7 whitespace-nowrap rounded-md border border-border bg-panel px-2 py-0.5 font-mono text-[10px] text-primary shadow-lg"
                  >
                    {mode.label}
                  </motion.span>
                )}
              </AnimatePresence>
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all hover:shadow-lg"
                style={{
                  borderColor: `var(--${mode.accent})30`,
                  backgroundColor: `var(--${mode.accent})08`,
                  color: `var(--${mode.accent})`,
                  boxShadow: isHovered ? `0 0 16px var(--${mode.accent})20` : undefined,
                }}
              >
                <Icon size={18} weight="bold" />
              </span>
            </motion.button>
          );
        })}

        {/* Center - selected mode holographic projection */}
        <motion.div
          key={selected}
          initial={reducedMotion ? undefined : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex flex-col items-center gap-2"
        >
          <div
            className="relative flex h-20 w-20 items-center justify-center rounded-full"
            style={{
              background: `radial-gradient(circle, var(--${selectedMode.accent})15 0%, transparent 70%)`,
              boxShadow: `0 0 40px var(--${selectedMode.accent})10, 0 0 80px var(--${selectedMode.accent})05`,
            }}
          >
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all"
              style={{
                borderColor: `var(--${selectedMode.accent})40`,
                backgroundColor: `var(--${selectedMode.accent})10`,
                color: `var(--${selectedMode.accent})`,
              }}
            >
              <SelectedIcon size={28} weight="fill" />
            </span>
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ borderColor: `var(--${selectedMode.accent})20` }}
              animate={reducedMotion ? {} : { scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="block h-full w-full rounded-full border" style={{ borderColor: "inherit" }} />
            </motion.span>
          </div>
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              {selectedMode.subtitle}
            </p>
            <p className="font-display text-lg font-bold tracking-tight">{selectedMode.label}</p>
            <p className="text-xs text-muted">{selectedMode.desc}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DimensionJumpStatus() {
  const reducedMotion = useReducedMotion();
  const [energyLevel, setEnergyLevel] = useState(78);
  const [stability, setStability] = useState(94.2);
  const [fleetStatus, setFleetStatus] = useState<"deployed" | "standby" | "maintenance">("deployed");

  useEffect(() => {
    const interval = setInterval(() => {
      setEnergyLevel((prev) => {
        const delta = (Math.random() - 0.5) * 4;
        return Math.min(100, Math.max(0, Math.round(prev + delta)));
      });
      setStability((prev) => {
        const delta = (Math.random() - 0.5) * 0.8;
        return Math.min(100, Math.max(85, +(prev + delta).toFixed(1)));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const fleetIcon =
    fleetStatus === "deployed" ? CheckCircle : fleetStatus === "standby" ? Clock : Warning;
  const fleetColor =
    fleetStatus === "deployed" ? "var(--success)" : fleetStatus === "standby" ? "var(--accent)" : "var(--danger)";
  const fleetLabel =
    fleetStatus === "deployed" ? "已部署" : fleetStatus === "standby" ? "待命中" : "维护中";

  return (
    <div className="station-panel orbital-scan relative overflow-hidden rounded-2xl p-5">
      <div className="station-panel-header absolute inset-x-0 top-0" />
      <div className="relative mt-1">
        <div className="mb-3 flex items-center gap-2">
          <Rocket size={18} weight="bold" className="text-primary" />
          <h3 className="font-display text-sm font-bold uppercase tracking-wider">维度跃迁状态</h3>
          <span className="ml-auto inline-flex h-1.5 w-1.5 rounded-full bg-success status-pulse" />
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                <BatteryCharging size={12} weight="bold" />
                能量读数
              </span>
              <span className="font-mono text-sm font-bold tabular-nums" style={{ color: energyLevel > 60 ? "var(--primary)" : "var(--danger)" }}>
                {energyLevel}%
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-primary/8">
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${energyLevel}%`,
                  background: `linear-gradient(90deg, var(--primary), var(--accent))`,
                }}
                animate={{ width: `${energyLevel}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
                <Pulse size={12} weight="bold" />
                维度稳定性
              </span>
              <span className="font-mono text-sm font-bold tabular-nums" style={{ color: stability > 90 ? "var(--success)" : "var(--accent)" }}>
                {stability}%
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-success/8">
              <motion.div
                className="h-full rounded-full bg-success"
                style={{ width: `${stability}%` }}
                animate={{ width: `${stability}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
              <Planet size={12} weight="bold" />
              舰队部署
            </span>
            <span
              className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold"
              style={{ color: fleetColor }}
            >
              {React.createElement(fleetIcon, { size: 12, weight: "bold" })}
              {fleetLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OnlinePlayersPulse() {
  const [playerCount, setPlayerCount] = useState(12847);
  const [dimensions, setDimensions] = useState(327);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => {
      setPlayerCount((prev) => {
        const delta = Math.floor((Math.random() - 0.45) * 50);
        return Math.max(12000, prev + delta);
      });
      setDimensions((prev) => {
        const delta = Math.floor((Math.random() - 0.5) * 10);
        return Math.max(300, prev + delta);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="station-panel orbital-scan relative overflow-hidden rounded-2xl p-5">
      <div className="station-panel-header absolute inset-x-0 top-0" />
      <div className="relative mt-1">
        <div className="mb-3 flex items-center gap-2">
          <Users size={18} weight="bold" className="text-orbital" />
          <h3 className="font-display text-sm font-bold uppercase tracking-wider">在线维度行者</h3>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: "var(--success)", opacity: 0.12 }}
              animate={reducedMotion ? {} : { scale: [1, 1.8, 1], opacity: [0.12, 0, 0.12] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: "var(--success)", opacity: 0.08 }}
              animate={reducedMotion ? {} : { scale: [1, 1.4, 1], opacity: [0.08, 0, 0.08] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            />
            <span className="relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-success/15">
              <span className="inline-flex h-3 w-3 rounded-full bg-success status-pulse" />
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <motion.span
                key={playerCount}
                className="font-display text-2xl font-bold tabular-nums"
                initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {playerCount.toLocaleString()}
              </motion.span>
              <span className="text-xs text-muted">在线</span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1">
                <WifiHigh size={10} weight="bold" className="text-success" />
                <span className="font-mono tabular-nums">{dimensions}</span> 活跃维度
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BridgeBroadcast({ announcements, loading }: {
  announcements: { title: string; content: string }[];
  loading: boolean;
}) {
  const reducedMotion = useReducedMotion();

  if (loading) {
    return (
      <div className="station-panel orbital-scan relative mx-auto max-w-7xl overflow-hidden rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Broadcast size={14} weight="bold" className="text-primary animate-pulse" />
          <div className="h-3 w-64 animate-pulse rounded bg-primary/5" />
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="station-panel orbital-scan relative mx-auto max-w-7xl overflow-hidden rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Broadcast size={14} weight="bold" />
          <span className="font-mono">轨道广播待命中...</span>
        </div>
      </div>
    );
  }

  const items = announcements.length === 1
    ? [...announcements, ...announcements]
    : announcements;

  return (
    <div className="station-panel orbital-scan relative mx-auto max-w-7xl overflow-hidden rounded-xl">
      <div className="data-stream flex items-center gap-3 px-4 py-2.5">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/12 bg-primary/4 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
          <Broadcast size={10} weight="bold" />
          轨道广播
        </span>
        <div className="relative flex-1 overflow-hidden">
          <motion.div
            className="flex gap-12 whitespace-nowrap"
            animate={reducedMotion ? {} : { x: ["0%", "-50%"] }}
            transition={{ duration: items.length * 8, repeat: Infinity, ease: "linear" }}
          >
            {items.map((item, i) => (
              <span key={i} className="inline-flex items-center gap-2 text-xs">
                <span className="font-medium text-accent">{item.title}</span>
                <span className="text-muted">{item.content}</span>
                <span className="mx-2 text-primary/20">|</span>
              </span>
            ))}
            {items.map((item, i) => (
              <span key={`dup-${i}`} className="inline-flex items-center gap-2 text-xs">
                <span className="font-medium text-accent">{item.title}</span>
                <span className="text-muted">{item.content}</span>
                <span className="mx-2 text-primary/20">|</span>
              </span>
            ))}
          </motion.div>
        </div>
      </div>
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
      sub: "维度行者",
      icon: PaintBrush,
      accent: "var(--success)",
    },
    {
      href: "/armory",
      label: `${weapons.length} 种武器`,
      sub: "维度武装",
      icon: Sword,
      accent: "var(--accent)",
    },
    {
      href: "/enemies",
      label: `${enemies.length} 类敌人`,
      sub: "维度威胁",
      icon: Skull,
      accent: "var(--danger)",
    },
    {
      href: "/algorithms",
      label: "核心算法",
      sub: "维度引擎",
      icon: Gear,
      accent: "var(--orbital)",
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
            className="station-panel orbital-scan group flex flex-col gap-2 rounded-xl p-3 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 focus-ring"
          >
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors group-hover:scale-110"
              style={{ backgroundColor: `${item.accent}10`, color: item.accent }}
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
  const { announcements, loading: announcementsLoading } = useAnnouncements({ active: true, limit: 5 });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const playHref =
    selectedMode === "defense"
      ? "/game?mode=defense&multiplayer=1"
      : selectedMode === "extreme-survival"
        ? "/game?mode=extreme-survival"
        : `/game?mode=${selectedMode}`;

  const broadcastAnnouncements = announcements.map((a) => ({
    title: a.title,
    content: (a.content ?? "").slice(0, 80),
  }));

  return (
    <div
      ref={scrollRef}
      className="relative min-h-[100dvh] overflow-y-auto overflow-x-hidden bg-background text-foreground"
    >
      <DimensionBackground intensity="medium" />
      <div className="noise-overlay" />

      {/* Navigation */}
      <motion.header
        initial={reducedMotion ? undefined : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-4 py-3"
      >
        <Link href="/" className="group flex items-center gap-2 focus-ring rounded-lg">
          <BrandLogo size={28} variant="icon" className="text-primary" />
          <BrandLogo size={28} variant="wordmark" />
        </Link>
        <nav className="flex items-center gap-1">
          {[
            { href: "/leaderboard", label: "战绩", icon: Trophy },
            { href: "/heroes", label: "英雄", icon: PaintBrush },
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

      {/* Orbit Broadcast System */}
      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative z-20 px-4 pb-2"
      >
        <BridgeBroadcast
          announcements={broadcastAnnouncements}
          loading={announcementsLoading}
        />
      </motion.div>

      {/* Hero Section - Orbit Command Deck */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-8 md:pt-12">
        <div className="grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: HoloModeSelector + Title */}
          <div className="flex flex-col gap-6 lg:col-span-7">
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/12 bg-primary/4 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                <Globe size={10} weight="fill" />
                维度锚点在线 · 梦想家
              </span>

              <h1 className="mt-4 font-display text-[clamp(2.25rem,6vw,4rem)] font-extrabold leading-[0.9] tracking-tight">
                守住锚点
                <br />
                <span className="text-gradient">穿越维度</span>
              </h1>

              <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted md:text-base">
                旗舰版多维度融合：据点防守、极限生存、肉鸽构筑与赛季挑战。
                动态维度天气与诅咒祝福双选，每一局都是独一无二的维度穿越。
              </p>
            </motion.div>

            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Link
                href={playHref}
                className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-6 text-sm font-bold text-background shadow-lg shadow-primary/12 transition-all hover:bg-primary/90 hover:shadow-primary/20 focus-ring active:scale-[0.97] md:h-14 md:text-base"
              >
                <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
                <Play size={20} weight="fill" />
                <span className="whitespace-nowrap">穿越维度</span>
                <CaretRight size={16} weight="bold" />
              </Link>
              <Link
                href="/game?multiplayer=1"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-panel/80 px-5 text-sm font-semibold backdrop-blur-sm transition-all hover:border-accent/30 hover:bg-panel focus-ring active:scale-[0.97] md:h-14"
              >
                <Users size={18} />
                <span className="whitespace-nowrap">组队锚点</span>
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Player Profile */}
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

      {/* Command Deck Dashboard */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="sm:col-span-2"
          >
            <div className="mb-2 flex items-center gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">全息模式选择器</p>
              <span className="inline-flex h-1 w-1 rounded-full bg-primary status-pulse" />
            </div>
            <HoloModeSelector selected={selectedMode} onSelect={setSelectedMode} />
          </motion.div>

          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-4"
          >
            <OnlinePlayersPulse />
            <DimensionJumpStatus />
          </motion.div>
        </div>
      </section>

      {/* Quick Stats Row */}
      <GSAPScrollReveal direction="up" className="relative z-10 mx-auto max-w-7xl px-4 pb-8">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "英雄", value: Object.keys(HERO_DEFS).length, icon: PaintBrush, accent: "var(--success)" },
            { label: "武器", value: Object.keys(DEFAULT_BALANCE.weapons).length, icon: Sword, accent: "var(--accent)" },
            { label: "敌人", value: Object.keys(DEFAULT_BALANCE.enemies).filter((k) => k !== "base").length, icon: Skull, accent: "var(--danger)" },
            { label: "维度", value: getModeList().length, icon: Target, accent: "var(--orbital)" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="station-panel orbital-scan flex flex-col items-center gap-1 rounded-xl p-3 text-center transition-all hover:border-primary/15"
              >
                <Icon size={16} weight="bold" style={{ color: stat.accent }} />
                <span className="font-display text-lg font-bold tabular-nums">{stat.value}</span>
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
            <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">维度网络</h2>
            <p className="mt-0.5 text-xs text-muted">选择你的维度，每一种都是截然不同的穿越体验</p>
          </div>
          <Link
            href="/modes"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-foreground focus-ring rounded"
          >
            全部维度 <ArrowRight size={12} />
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
                      : mode.type === "flagship-peak"
                        ? "/game?mode=flagship-peak"
                        : `/game?mode=${mode.type}`;

            return (
              <Link
                key={mode.type}
                href={href}
                className={`station-panel orbital-scan group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 transition-all hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 focus-ring ${mode.span}`}
                style={{ borderColor: mode.featured ? `var(--${mode.accent})20` : undefined }}
              >
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-25"
                  style={{ backgroundColor: `var(--${mode.accent})` }}
                />
                {mode.featured && (
                  <div className="pointer-events-none absolute inset-0 opacity-[0.01] bg-[radial-gradient(circle_at_70%_30%,rgba(11,29,58,0.5),transparent_70%)]" />
                )}
                {mode.type === "flagship-peak" && (
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/[0.03] blur-3xl" />
                    <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-danger/[0.02] blur-3xl" />
                  </div>
                )}

                <div className="relative">
                  <div className="flex items-start justify-between">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `var(--${mode.accent})10`, color: `var(--${mode.accent})` }}
                    >
                      <Icon size={20} weight="bold" />
                    </span>
                    {mode.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/12 bg-primary/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        <Sparkle size={10} weight="fill" />
                        {mode.type === "flagship-peak" ? "创世" : "主打"}
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted">
                      {mode.subtitle}
                    </p>
                    <h3 className="mt-1 font-display text-base font-bold tracking-tight md:text-lg">
                      {mode.label}
                    </h3>
                    <p className="mt-1 text-xs text-muted">{mode.desc}</p>
                  </div>
                  {mode.type === "flagship-peak" && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {[
                        { label: "标准巡航", color: "#3B7DD8" },
                        { label: "超频增压", color: "#C4554A" },
                        { label: "地狱终局", color: "#8B7038" },
                      ].map((p) => (
                        <span
                          key={p.label}
                          className="inline-flex items-center rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                          style={{ borderColor: `${p.color}30`, color: p.color, backgroundColor: `${p.color}08` }}
                        >
                          {p.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative mt-4 flex items-center gap-2 text-xs text-muted">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-panel-raised">
                    <CaretRight size={10} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="opacity-0 transition-opacity group-hover:opacity-100">穿越维度</span>
                </div>
              </Link>
            );
          })}
        </div>
      </GSAPScrollReveal>

      {/* GSAP Card Stack */}
      <GSAPScrollReveal direction="up" className="relative z-10 mx-auto max-w-7xl px-4 pb-8">
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">核心特性</h2>
          <p className="mt-0.5 text-xs text-muted">探索旗舰版的深度机制与维度创新</p>
        </div>
      </GSAPScrollReveal>

      <section className="relative z-10">
        <GSAPCardStack cards={modeCardStack} className="mb-4" />
      </section>

      {/* Encyclopedia Row */}
      <GSAPScrollReveal direction="up" className="relative z-10 mx-auto max-w-7xl px-4 pb-8">
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">维度档案库</h2>
          <p className="mt-0.5 text-xs text-muted">完整的武器、敌人、英雄与维度引擎数据</p>
        </div>
        <EncyclopediaRow />
      </GSAPScrollReveal>

      {/* Quick Action Row */}
      <GSAPScrollReveal direction="up" className="relative z-10 mx-auto max-w-7xl px-4 pb-8">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/leaderboard"
            className="station-panel orbital-scan group flex items-center gap-4 rounded-2xl p-4 transition-all hover:border-primary/20 focus-ring"
          >
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Trophy size={24} weight="bold" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">维度行者榜</p>
              <p className="text-xs text-muted">查看所有维度行者的最高记录</p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/settings"
            className="station-panel orbital-scan group flex items-center gap-4 rounded-2xl p-4 transition-all hover:border-accent/20 focus-ring"
          >
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Gear size={24} weight="bold" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">锚点设置</p>
              <p className="text-xs text-muted">音效、画面与操作偏好调整</p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </GSAPScrollReveal>

      {/* Footer CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="station-panel orbital-scan relative overflow-hidden rounded-3xl p-8 station-glow md:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/[0.03] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/[0.03] blur-3xl" />

          <div className="relative flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/12 bg-primary/4 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              <Anchor size={10} weight="fill" />
              锚点就绪
            </span>

            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight md:text-3xl">
              一人一枪，穿越维度网络
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              公平竞技，无付费加成。浏览器打开即玩，你的战绩与解锁进度将锚定至多元宇宙网络。
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={playHref}
                className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-6 text-sm font-bold text-background shadow-lg shadow-primary/12 transition-all hover:bg-primary/90 hover:shadow-primary/20 focus-ring active:scale-[0.97]"
              >
                <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
                <Play size={18} weight="fill" />
                穿越维度
              </Link>
              <Link
                href="/about"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-panel/80 px-5 text-sm font-semibold backdrop-blur-sm transition-all hover:border-accent/30 hover:bg-panel focus-ring active:scale-[0.97]"
              >
                <Info size={18} />
                了解更多
              </Link>
            </div>
          </div>
        </div>

        <footer className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted sm:flex-row">
          <div className="flex items-center gap-2">
            <BrandLogo size={14} variant="icon" />
            <span>公平竞技 · 无付费加成 · 多重宇宙 · 梦想家</span>
          </div>
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

      <div className="version-watermark">破晓 v3.0</div>
    </div>
  );
}