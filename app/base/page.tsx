"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import { motion, useReducedMotion } from "framer-motion";
import {
  Crosshair,
  Skull,
  Sword,
  Target,
  Trophy,
  Lock,
  ArrowsOut,
  Scan,
  Rocket,
  Fire,
  Drone,
  Play,
  Snowflake,
  Butterfly,
  PawPrint,
  Circle,
  CaretRight,
  Clock,
  Lightning,
  Coin,
  Star,
  Users,
  Shield,
  FlagBanner,
  Timer,
  ShieldCheck,
  Gauge,
  Medal,
  Crown,
  Atom,
  UserCircle,
  CastleTurret,
  AirplaneTilt,
  Globe,
  ArrowRight,
  Sparkle,
  Hexagon,
  Pulse,
  Planet,
  Broadcast,
} from "@phosphor-icons/react";
import { loadSave, type SaveData } from "@/lib/game/save";
import { formatTime } from "@/lib/game/math";
import { HERO_DEFS } from "@/lib/game/heroes";
import type { HeroId } from "@/lib/game/types";
import { DEFAULT_BALANCE } from "@/lib/game/balance";
import type { WeaponId } from "@/lib/game/types";

const HERO_ICONS: Record<string, typeof Snowflake> = {
  nitrogen: Snowflake, twilight: Butterfly, leopard: PawPrint,
  recon: Crosshair, viper: Skull, falcon: AirplaneTilt, bastion: CastleTurret,
};

const WEAPON_ICONS: Record<string, typeof Crosshair> = {
  pulse: Crosshair, shotgun: ArrowsOut, laser: Scan, rocket: Rocket,
  flame: Fire, drone: Drone, plasma: Lightning, railgun: Target,
  gauss: Gauge, arcCaster: Lightning, seekerRifle: Crosshair,
  shardRepeater: ArrowsOut, cryoLauncher: Snowflake, naniteSwarm: Atom,
  gravityWell: Circle, vortexCannon: Circle, shortBlade: Sword,
  spear: Sword, greatsword: Sword, gauntlet: Sword, plasmaBlade: Sword, swarm: Drone,
};

const MODE_NAMES: Record<string, string> = {
  campaign: "战役模式", endless: "无尽生存", daily: "每日挑战",
  roguelike: "冒险模式", defense: "据点防守", deathmatch: "个人死斗",
  survival: "生存模式", "extreme-survival": "极限生存",
  "peak-challenge": "巅峰挑战", flagship: "旗舰模式", "flagship-peak": "旗舰巅峰",
};

function ResourceBar({ coins, seasonCurrency }: { coins: number; seasonCurrency: number }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="flex flex-wrap gap-2"
    >
      <div className="station-panel flex items-center gap-2 px-3 py-1.5">
        <div className="orbital-ring flex h-7 w-7 items-center justify-center">
          <Coin size={14} weight="fill" className="text-accent" />
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted">金币</p>
          <p className="font-mono text-sm font-bold tabular-nums">{coins.toLocaleString()}</p>
        </div>
      </div>
      <div className="station-panel flex items-center gap-2 px-3 py-1.5">
        <div className="orbital-ring flex h-7 w-7 items-center justify-center">
          <Star size={14} weight="fill" className="text-primary" />
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted">赛季币</p>
          <p className="font-mono text-sm font-bold tabular-nums">{seasonCurrency.toLocaleString()}</p>
        </div>
      </div>
    </motion.div>
  );
}

function BestRunCard({ best }: { best: SaveData["bestRun"] | null | undefined }) {
  const reducedMotion = useReducedMotion();

  if (!best) {
    return (
      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="station-panel orbital-scan p-4 station-glow"
      >
        <div className="station-panel-header -mx-4 -mt-4 mb-3">
          <div className="flex items-center gap-2 px-4 pt-4">
            <Broadcast size={14} weight="bold" className="text-primary status-pulse" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">最佳出航记录</span>
          </div>
        </div>
        <p className="text-sm text-muted">暂无记录。完成第一次部署后，这里会显示你的深空探索巅峰。</p>
        <Link
          href="/game"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
        >
          <Play size={12} weight="fill" />
          开始部署
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="station-panel orbital-scan p-4 station-glow"
    >
      <div className="station-panel-header -mx-4 -mt-4 mb-3">
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-2">
            <Broadcast size={14} weight="bold" className="text-primary status-pulse" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">最佳出航记录</span>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
              best.victory ? "bg-success/10 text-success" : "bg-caution/10 text-caution"
            }`}
          >
            {best.victory ? <Shield size={12} weight="bold" /> : <Crosshair size={12} weight="bold" />}
            {best.victory ? "胜利" : "失败"}
          </span>
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <p className={`font-display text-lg font-bold ${best.victory ? "text-success" : "text-caution"}`}>
            {best.victory ? "出航成功" : "任务失败"}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {MODE_NAMES[best.mode] ?? best.mode} · {formatTime(best.elapsed)}
          </p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "击杀", value: best.stats.kills, icon: Skull, color: "text-caution" },
          { label: "伤害", value: Math.floor(best.stats.damageDealt).toLocaleString(), icon: Sword, color: "text-orbital" },
          { label: "存活", value: formatTime(best.elapsed), icon: Clock, color: "text-primary" },
          { label: "任务", value: best.completedMissions, icon: Target, color: "text-accent" },
        ].map((stat) => (
          <div key={stat.label} className="station-panel p-2">
            <dt className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted">
              <stat.icon size={10} weight="bold" className={stat.color} />
              {stat.label}
            </dt>
            <dd className="mt-0.5 font-mono text-sm font-bold tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </motion.div>
  );
}

function StatMiniCard({
  value, label, icon: Icon, color, delay,
}: {
  value: React.ReactNode; label: string; icon: typeof Crosshair; color: string; delay: number;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="station-panel group relative p-3 transition-all hover:border-primary/30 station-glow"
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-25" style={{ backgroundColor: color }} />
      <div className="relative flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">{label}</p>
        <Icon size={16} weight="bold" className="opacity-50" style={{ color }} />
      </div>
      <p className="relative font-display text-xl font-bold tabular-nums">{value}</p>
    </motion.div>
  );
}

function HeroRoster({ save, selectedHero }: { save: SaveData | null; selectedHero: string }) {
  const reducedMotion = useReducedMotion();
  const heroes = useMemo(() => {
    const order = Object.keys(HERO_DEFS) as HeroId[];
    return order.map((hid) => {
      const def = HERO_DEFS[hid];
      if (!def) return null;
      const { id: _id, ...rest } = def;
      return {
        id: hid, ...rest,
        unlocked: save ? save.unlockedHeroes.includes(hid) : hid === "recon",
        isSelected: hid === selectedHero,
      };
    }).filter(Boolean) as Array<{
      id: string; name: string; description: string; color: string;
      skill: { name: string; cooldown: number; duration: number };
      unlocked: boolean; isSelected: boolean;
    }>;
  }, [save, selectedHero]);

  return (
    <div className="station-panel p-4">
      <div className="station-panel-header -mx-4 -mt-4 mb-3">
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-2">
            <Users size={16} weight="bold" className="text-primary" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-[0.15em]">船员名录</h3>
          </div>
          <Link href="/heroes" className="flex items-center gap-1 text-[11px] font-medium text-muted transition-colors hover:text-primary">
            全部 <CaretRight size={11} weight="bold" />
          </Link>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
        {heroes.map((hero, i) => {
          const Icon = HERO_ICONS[hero.id] ?? Crosshair;
          return (
            <motion.div
              key={hero.id}
              initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`group relative w-[200px] flex-none snap-start overflow-hidden rounded-xl border p-2.5 transition-all ${
                hero.isSelected
                  ? "border-primary/30 bg-primary-subtle"
                  : hero.unlocked
                    ? "border-primary/10 bg-panel/60 hover:border-primary/20 hover:bg-panel"
                    : "border-primary/5 bg-panel/40 opacity-60"
              }`}
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl transition-opacity group-hover:opacity-60" style={{ backgroundColor: hero.unlocked ? `${hero.color}10` : "transparent" }} />
              <div className="relative flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: hero.unlocked ? `${hero.color}18` : "transparent", border: `1px solid ${hero.unlocked ? hero.color : "transparent"}30` }}>
                  {hero.unlocked ? <Icon size={20} weight="bold" style={{ color: hero.color }} /> : <Lock size={16} weight="bold" className="text-muted" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs font-bold">{hero.name}</p>
                    {hero.isSelected && <span className="shrink-0 rounded-full bg-primary-subtle px-1.5 py-0.5 text-[9px] font-bold text-primary">出战</span>}
                  </div>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted line-clamp-2">{hero.description}</p>
                  {hero.unlocked && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[9px]">
                      <span className="rounded-md border border-primary/10 bg-background/60 px-1.5 py-0.5 text-muted">{hero.skill.name}</span>
                      <span className="font-mono tabular-nums rounded-md border border-primary/10 bg-background/60 px-1.5 py-0.5 text-muted">CD {hero.skill.cooldown}s</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function WeaponArmory({ save, equippedWeapons }: { save: SaveData | null; equippedWeapons: WeaponId[] }) {
  const reducedMotion = useReducedMotion();
  const weapons = useMemo(() => {
    return Object.entries(DEFAULT_BALANCE.weapons).map(([id, cfg]) => {
      const wid = id as WeaponId;
      return {
        id: wid, name: cfg.name, description: cfg.description, color: cfg.color,
        unlocked: save?.unlockedWeapons.includes(wid) ?? false,
        equipped: equippedWeapons.includes(wid),
      };
    });
  }, [save, equippedWeapons]);

  const equipped = weapons.filter((w) => w.equipped);
  const unlocked = weapons.filter((w) => w.unlocked && !w.equipped).slice(0, 4);

  return (
    <div className="station-panel p-4">
      <div className="station-panel-header -mx-4 -mt-4 mb-3">
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-2">
            <Sword size={16} weight="bold" className="text-primary" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-[0.15em]">武器阵列</h3>
          </div>
          <Link href="/armory" className="flex items-center gap-1 text-[11px] font-medium text-muted transition-colors hover:text-primary">
            军械库 <CaretRight size={11} weight="bold" />
          </Link>
        </div>
      </div>

      {equipped.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
          {equipped.map((weapon, i) => {
            const Icon = WEAPON_ICONS[weapon.id] ?? Crosshair;
            return (
              <motion.div
                key={weapon.id}
                initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="station-panel group relative w-[180px] flex-none snap-start p-2.5 station-glow"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl transition-opacity group-hover:opacity-60" style={{ backgroundColor: `${weapon.color}10` }} />
                <div className="relative flex items-center gap-2">
                  <div className="orbital-ring flex h-8 w-8 shrink-0 items-center justify-center">
                    <Icon size={14} weight="bold" style={{ color: weapon.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold">{weapon.name}</p>
                    <p className="mt-0.5 text-[10px] text-muted line-clamp-1">{weapon.description}</p>
                  </div>
                </div>
                <div className="relative mt-2 flex items-center gap-1">
                  <ShieldCheck size={10} weight="bold" className="text-primary status-pulse" />
                  <span className="text-[9px] font-medium text-primary">已装配</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {unlocked.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
          {unlocked.map((weapon, i) => {
            const Icon = WEAPON_ICONS[weapon.id] ?? Crosshair;
            return (
              <motion.div
                key={weapon.id}
                initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="station-panel group relative w-[160px] flex-none snap-start p-2.5 transition-all hover:border-primary/20"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-3xl transition-opacity group-hover:opacity-60" style={{ backgroundColor: `${weapon.color}08` }} />
                <div className="relative flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${weapon.color}18`, border: `1px solid ${weapon.color}30` }}>
                    <Icon size={12} weight="bold" style={{ color: weapon.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold">{weapon.name}</p>
                    <p className="mt-0.5 text-[10px] text-muted line-clamp-1">{weapon.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {equipped.length === 0 && unlocked.length === 0 && (
        <div className="station-panel border-dashed border-primary/10 bg-panel/40 p-5 text-center">
          <Crosshair size={22} weight="bold" className="mx-auto text-muted" />
          <p className="mt-2 text-xs text-muted">暂无武器。完成战役模式解锁新武器。</p>
        </div>
      )}
    </div>
  );
}

function QuickActions() {
  const reducedMotion = useReducedMotion();
  const actions = [
    { href: "/game", label: "开始部署", icon: Play, color: "var(--primary)", desc: "进入战场" },
    { href: "/armory", label: "军械库", icon: Sword, color: "var(--accent)", desc: "武器管理" },
    { href: "/heroes", label: "船员", icon: Users, color: "var(--orbital)", desc: "船员选择" },
    { href: "/leaderboard", label: "排行榜", icon: Trophy, color: "var(--caution)", desc: "全球排名" },
    { href: "/modes", label: "星图", icon: Planet, color: "var(--orbital)", desc: "导航选择" },
    { href: "/world", label: "世界观", icon: Globe, color: "var(--secondary)", desc: "维度故事" },
  ];

  return (
    <div className="station-panel p-4">
      <div className="station-panel-header -mx-4 -mt-4 mb-3">
        <div className="flex items-center gap-2 px-4 pt-4">
          <Lightning size={16} weight="bold" className="text-primary" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.15em]">快捷操作</h3>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.href}
              initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Link
                href={action.href}
                className="station-panel group flex flex-col items-center gap-1.5 p-3 transition-all hover:border-primary/30 station-glow"
              >
                <div className="orbital-ring flex h-9 w-9 items-center justify-center transition-transform group-hover:scale-110">
                  <Icon size={18} weight="bold" style={{ color: action.color }} />
                </div>
                <span className="text-[11px] font-medium">{action.label}</span>
                <span className="text-[9px] text-muted">{action.desc}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function RecentHistory({ save }: { save: SaveData | null }) {
  const reducedMotion = useReducedMotion();
  const history = useMemo(() => {
    if (!save?.runHistory) return [];
    return save.runHistory.slice(-5).reverse();
  }, [save]);

  if (history.length === 0) {
    return (
      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="station-panel border-dashed border-primary/10 bg-panel/40 p-5 text-center"
      >
        <Clock size={22} weight="bold" className="mx-auto text-muted" />
        <p className="mt-2 text-xs text-muted">暂无航行记录。完成一次部署后这里会显示历史。</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="station-panel p-4"
    >
      <div className="station-panel-header -mx-4 -mt-4 mb-3">
        <div className="flex items-center gap-2 px-4 pt-4">
          <Clock size={16} weight="bold" className="text-primary" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.15em]">航行记录</h3>
        </div>
      </div>
      <div className="space-y-1.5">
        {history.map((entry, i) => (
          <motion.div
            key={i}
            initial={reducedMotion ? undefined : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="station-panel flex items-center gap-2.5 p-2.5 transition-all hover:border-primary/20"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${entry.victory ? "bg-success/10" : "bg-caution/10"}`}>
              {entry.victory ? <Shield size={14} weight="bold" className="text-success" /> : <Skull size={14} weight="bold" className="text-caution" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold">{MODE_NAMES[entry.mode] ?? entry.mode}</p>
                <span className={`text-[9px] font-medium ${entry.victory ? "text-success" : "text-caution"}`}>
                  {entry.victory ? "胜利" : "失败"}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 font-mono text-[9px] text-muted tabular-nums">
                <span className="flex items-center gap-1"><Timer size={9} weight="bold" /> {formatTime(entry.elapsed)}</span>
                <span className="flex items-center gap-1"><Coin size={9} weight="bold" /> +{entry.reward}</span>
              </div>
            </div>
            <CaretRight size={12} weight="bold" className="text-muted" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function BasePage() {
  const [save, setSave] = useState<SaveData | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const best = save?.bestRun;
  const selectedHero = save?.selectedHero ?? "recon";
  const equippedWeapons = save?.equippedWeapons ?? [];

  return (
    <Layout title="深空前哨站">
      <div className="relative mx-auto max-w-7xl px-4 py-6 md:py-8">
        <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-4"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-subtle px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Planet size={10} weight="fill" className="status-pulse" />
              深空前哨站
            </div>
            <h1 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.25rem)] font-extrabold leading-[0.95] tracking-tight">
              航行数据
              <br />
              <span className="text-gradient">武器与船员</span>
            </h1>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">
              累计航行数据、最佳出航记录、已解锁武器与可用船员。前哨站是你的深空锚点。
            </p>
            <div className="mt-4">
              <Link
                href="/game"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-background shadow-lg shadow-primary/10 transition-all hover:bg-primary/90 focus-ring active:scale-95"
              >
                <Rocket size={16} weight="fill" />
                <span className="whitespace-nowrap">再次出航</span>
              </Link>
            </div>
            <div className="mt-4">
              <ResourceBar coins={save?.coins ?? 0} seasonCurrency={save?.seasonCurrency ?? 0} />
            </div>
          </motion.div>

          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatMiniCard value={save?.totalRuns ?? 0} label="总出航" icon={Target} color="var(--orbital)" delay={0.05} />
              <StatMiniCard value={save?.totalKills ?? 0} label="累计击杀" icon={Skull} color="var(--caution)" delay={0.1} />
              <StatMiniCard value={best?.stats.kills ?? 0} label="最佳击杀" icon={Trophy} color="var(--accent)" delay={0.15} />
              <StatMiniCard value={best?.stats.bossesKilled ?? 0} label="首领击杀" icon={Crown} color="var(--primary)" delay={0.2} />
            </div>
            <div className="mt-3">
              <BestRunCard best={best} />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <HeroRoster save={save} selectedHero={selectedHero} />
          <RecentHistory save={save} />
        </div>

        <div className="mt-5">
          <WeaponArmory save={save} equippedWeapons={equippedWeapons} />
        </div>

        <div className="mt-5">
          <QuickActions />
        </div>
      </div>
    </Layout>
  );
}