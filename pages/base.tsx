import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Crosshair,
  Skull,
  Sword,
  Target,
  Trophy,
  Check,
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
} from "@phosphor-icons/react";
import { loadSave, type SaveData } from "@/lib/game/save";
import { formatTime } from "@/lib/game/math";
import { HERO_DEFS } from "@/lib/game/heroes";
import type { HeroId } from "@/lib/game/types";
import { DEFAULT_BALANCE } from "@/lib/game/balance";
import type { WeaponId } from "@/lib/game/types";

const HERO_ICONS: Record<string, typeof Snowflake> = {
  nitrogen: Snowflake,
  twilight: Butterfly,
  leopard: PawPrint,
  recon: Crosshair,
  viper: Skull,
  falcon: AirplaneTilt,
  bastion: CastleTurret,
};

const WEAPON_ICONS: Record<string, typeof Crosshair> = {
  pulse: Crosshair,
  shotgun: ArrowsOut,
  laser: Scan,
  rocket: Rocket,
  flame: Fire,
  drone: Drone,
  plasma: Lightning,
  railgun: Target,
  gauss: Gauge,
  arcCaster: Lightning,
  seekerRifle: Crosshair,
  shardRepeater: ArrowsOut,
  cryoLauncher: Snowflake,
  naniteSwarm: Atom,
  gravityWell: Circle,
  vortexCannon: Circle,
  shortBlade: Sword,
  spear: Sword,
  greatsword: Sword,
  gauntlet: Sword,
  plasmaBlade: Sword,
  swarm: Drone,
};

const WEAPON_CATEGORY_ICONS: Record<string, typeof Crosshair> = {
  kinetic: Crosshair,
  energy: Lightning,
  thermal: Fire,
  cryo: Snowflake,
  gravity: Circle,
  melee: Sword,
  special: Atom,
};

const MODE_NAMES: Record<string, string> = {
  campaign: "战役模式",
  endless: "无尽生存",
  daily: "每日挑战",
  roguelike: "冒险模式",
  defense: "据点防守",
  deathmatch: "个人死斗",
  survival: "生存模式",
  "extreme-survival": "极限生存",
  "peak-challenge": "巅峰挑战",
  "flagship": "旗舰模式",
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
      <div className="flex items-center gap-2 rounded-xl border border-border bg-panel px-3 py-1.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/10">
          <Coin size={14} weight="fill" className="text-warning" />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-muted">金币</p>
          <p className="font-mono text-sm font-bold">{coins.toLocaleString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-panel px-3 py-1.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Star size={14} weight="fill" className="text-primary" />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-muted">赛季币</p>
          <p className="font-mono text-sm font-bold">{seasonCurrency.toLocaleString()}</p>
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
        className="relative overflow-hidden rounded-2xl border border-border bg-panel p-3"
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">最佳撤离记录</p>
          <p className="mt-2 text-sm text-muted">暂无记录。完成第一次部署后，这里会显示你的个人巅峰。</p>
          <Link
            href="/game"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <Play size={12} weight="fill" />
            开始部署
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-panel p-3"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/5 blur-3xl" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">最佳撤离记录</p>
          <p className={`mt-1 text-lg font-bold ${best.victory ? "text-success" : "text-danger"}`}>
            {best.victory ? "撤离成功" : "任务失败"}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {MODE_NAMES[best.mode] ?? best.mode} · {formatTime(best.elapsed)}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
            best.victory ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          }`}
        >
          {best.victory ? <Shield size={12} weight="bold" /> : <Crosshair size={12} weight="bold" />}
          {best.victory ? "胜利" : "失败"}
        </span>
      </div>

      <dl className="relative mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-background/60 p-2">
          <dt className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-muted">
            <Skull size={10} weight="bold" /> 击杀
          </dt>
          <dd className="mt-0.5 font-mono text-sm font-bold">{best.stats.kills}</dd>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-2">
          <dt className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-muted">
            <Sword size={10} weight="bold" /> 伤害
          </dt>
          <dd className="mt-0.5 font-mono text-sm font-bold">{Math.floor(best.stats.damageDealt).toLocaleString()}</dd>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-2">
          <dt className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-muted">
            <Clock size={10} weight="bold" /> 存活
          </dt>
          <dd className="mt-0.5 font-mono text-sm font-bold">{formatTime(best.elapsed)}</dd>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-2">
          <dt className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-muted">
            <Target size={10} weight="bold" /> 任务
          </dt>
          <dd className="mt-0.5 font-mono text-sm font-bold">{best.completedMissions}</dd>
        </div>
      </dl>
    </motion.div>
  );
}

function StatMiniCard({
  value,
  label,
  icon: Icon,
  color,
  delay,
}: {
  value: React.ReactNode;
  label: string;
  icon: typeof Crosshair;
  color: string;
  delay: number;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-panel p-2.5 transition-colors hover:bg-panel-raised"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: color }}
      />
      <div className="relative flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
        <Icon size={16} weight="bold" className="text-muted transition-colors" style={{ color: `${color}80` }} />
      </div>
      <p className="relative mt-1 text-xl font-bold">{value}</p>
    </motion.div>
  );
}

function HeroRoster({
  save,
  selectedHero,
}: {
  save: SaveData | null;
  selectedHero: string;
}) {
  const reducedMotion = useReducedMotion();
  const heroes = useMemo(() => {
    const order = Object.keys(HERO_DEFS) as HeroId[];
    return order.map((hid) => {
      const def = HERO_DEFS[hid];
      if (!def) return null;
      const { id: _id, ...rest } = def;
      return {
        id: hid,
        ...rest,
        unlocked: save ? save.unlockedHeroes.includes(hid) : hid === "recon",
        isSelected: hid === selectedHero,
      };
    }).filter(Boolean) as Array<{
      id: string;
      name: string;
      description: string;
      color: string;
      skill: { name: string; cooldown: number; duration: number };
      unlocked: boolean;
      isSelected: boolean;
    }>;
  }, [save, selectedHero]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} weight="bold" className="text-primary" />
          <h3 className="text-sm font-bold">英雄档案</h3>
        </div>
        <Link
          href="/heroes"
          className="flex items-center gap-1 text-[11px] font-medium text-muted transition-colors hover:text-primary"
        >
          全部 <CaretRight size={11} weight="bold" />
        </Link>
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
                  ? "border-primary/30 bg-primary/5"
                  : hero.unlocked
                    ? "border-border bg-panel hover:border-primary/20 hover:bg-panel-raised"
                    : "border-border/50 bg-panel/50 opacity-60"
              }`}
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl transition-opacity group-hover:opacity-60"
                style={{ backgroundColor: hero.unlocked ? `${hero.color}10` : "transparent" }}
              />
              <div className="relative flex items-center gap-2.5">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: hero.unlocked ? `${hero.color}18` : "transparent",
                    border: `1px solid ${hero.unlocked ? hero.color : "transparent"}30`,
                  }}
                >
                  {hero.unlocked ? (
                    <Icon size={20} weight="bold" style={{ color: hero.color }} />
                  ) : (
                    <Lock size={16} weight="bold" className="text-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs font-bold">{hero.name}</p>
                    {hero.isSelected && (
                      <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                        出战
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted line-clamp-2">{hero.description}</p>
                  {hero.unlocked && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[9px]">
                      <span className="rounded-md border border-border bg-background/60 px-1.5 py-0.5 text-muted">
                        {hero.skill.name}
                      </span>
                      <span className="rounded-md border border-border bg-background/60 px-1.5 py-0.5 text-muted">
                        CD {hero.skill.cooldown}s
                      </span>
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

function WeaponArmory({
  save,
  equippedWeapons,
}: {
  save: SaveData | null;
  equippedWeapons: WeaponId[];
}) {
  const reducedMotion = useReducedMotion();
  const weapons = useMemo(() => {
    return Object.entries(DEFAULT_BALANCE.weapons).map(([id, cfg]) => {
      const wid = id as WeaponId;
      return {
        id: wid,
        name: cfg.name,
        description: cfg.description,
        color: cfg.color,
        unlocked: save?.unlockedWeapons.includes(wid) ?? false,
        equipped: equippedWeapons.includes(wid),
      };
    });
  }, [save, equippedWeapons]);

  const equipped = weapons.filter((w) => w.equipped);
  const unlocked = weapons.filter((w) => w.unlocked && !w.equipped).slice(0, 4);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sword size={18} weight="bold" className="text-primary" />
          <h3 className="text-sm font-bold">武器库</h3>
        </div>
        <Link
          href="/armory"
          className="flex items-center gap-1 text-[11px] font-medium text-muted transition-colors hover:text-primary"
        >
          军械库 <CaretRight size={11} weight="bold" />
        </Link>
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
                className="group relative w-[180px] flex-none snap-start overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-2.5"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl transition-opacity group-hover:opacity-60" style={{ backgroundColor: `${weapon.color}10` }} />
                <div className="relative flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${weapon.color}18`, border: `1px solid ${weapon.color}30` }}
                  >
                    <Icon size={14} weight="bold" style={{ color: weapon.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold">{weapon.name}</p>
                    <p className="mt-0.5 text-[10px] text-muted line-clamp-1">{weapon.description}</p>
                  </div>
                </div>
                <div className="relative mt-2 flex items-center gap-1">
                  <ShieldCheck size={10} weight="bold" className="text-primary" />
                  <span className="text-[9px] font-medium text-primary">已装备</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {unlocked.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
          {unlocked.map((weapon, i) => {
            const Icon = WEAPON_ICONS[weapon.id] ?? Crosshair;
            return (
              <motion.div
                key={weapon.id}
                initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="group relative w-[160px] flex-none snap-start overflow-hidden rounded-xl border border-border bg-panel p-2.5 transition-colors hover:border-primary/20 hover:bg-panel-raised"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-3xl transition-opacity group-hover:opacity-60" style={{ backgroundColor: `${weapon.color}08` }} />
                <div className="relative flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${weapon.color}18`, border: `1px solid ${weapon.color}30` }}
                  >
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
        <div className="rounded-2xl border border-dashed border-border bg-panel/50 p-4 text-center">
          <Crosshair size={20} weight="bold" className="mx-auto text-muted" />
          <p className="mt-2 text-xs text-muted">暂无武器。完成战役模式解锁新武器。</p>
        </div>
      )}
    </div>
  );
}

function QuickActions() {
  const reducedMotion = useReducedMotion();
  const actions = [
    { href: "/game", label: "开始部署", icon: Play, color: "#22d3ee", desc: "进入战场" },
    { href: "/armory", label: "军械库", icon: Sword, color: "#f59e0b", desc: "武器管理" },
    { href: "/heroes", label: "英雄", icon: Users, color: "#8b7cf0", desc: "英雄选择" },
    { href: "/leaderboard", label: "排行榜", icon: Trophy, color: "#f05a7e", desc: "全球排名" },
    { href: "/modes", label: "模式", icon: FlagBanner, color: "#34d399", desc: "模式选择" },
    { href: "/world", label: "世界观", icon: Globe, color: "#a0a8b8", desc: "废土故事" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Lightning size={18} weight="bold" className="text-primary" />
        <h3 className="text-sm font-bold">快捷操作</h3>
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
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-panel p-3 transition-all hover:border-primary/20 hover:bg-panel-raised hover:shadow-lg hover:shadow-primary/5"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${action.color}12` }}
                >
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
        className="rounded-2xl border border-dashed border-border bg-panel/50 p-4 text-center"
      >
        <Clock size={20} weight="bold" className="mx-auto text-muted" />
        <p className="mt-2 text-xs text-muted">暂无战斗记录。完成一次部署后这里会显示历史。</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2">
        <Clock size={18} weight="bold" className="text-primary" />
        <h3 className="text-sm font-bold">最近战斗</h3>
      </div>
      <div className="space-y-1.5">
        {history.map((entry, i) => (
          <motion.div
            key={i}
            initial={reducedMotion ? undefined : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-panel p-2.5 transition-colors hover:bg-panel-raised"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              entry.victory ? "bg-success/10" : "bg-danger/10"
            }`}>
              {entry.victory ? (
                <Shield size={14} weight="bold" className="text-success" />
              ) : (
                <Skull size={14} weight="bold" className="text-danger" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold">{MODE_NAMES[entry.mode] ?? entry.mode}</p>
                <span className={`text-[9px] font-medium ${entry.victory ? "text-success" : "text-danger"}`}>
                  {entry.victory ? "胜利" : "失败"}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[9px] text-muted">
                <span className="flex items-center gap-1">
                  <Timer size={9} weight="bold" /> {formatTime(entry.elapsed)}
                </span>
                <span className="flex items-center gap-1">
                  <Coin size={9} weight="bold" /> +{entry.reward}
                </span>
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
    <Layout title="幸存者基地">
      <div className="relative mx-auto max-w-7xl px-4 py-3 md:py-4">
        <div className="grid gap-3 lg:grid-cols-12 lg:gap-4">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-4"
          >
            <span className="inline-block rounded bg-success/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-success">
              幸存者基地
            </span>
            <h1 className="mt-2 text-xl font-bold leading-[1.1] tracking-tight md:text-3xl">
              战绩、武器与英雄。
            </h1>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">
              累计数据、最佳撤离记录、已解锁武器与可用英雄。基地是你的废土家园。
            </p>
            <div className="mt-3">
              <Link
                href="/game"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-background shadow-lg shadow-primary/15 transition-all hover:bg-primary/90 focus-ring active:scale-95"
              >
                <Play size={16} weight="fill" />
                <span className="whitespace-nowrap">再次部署</span>
              </Link>
            </div>

            <div className="mt-4">
              <ResourceBar coins={save?.coins ?? 0} seasonCurrency={save?.seasonCurrency ?? 0} />
            </div>
          </motion.div>

          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatMiniCard
                value={save?.totalRuns ?? 0}
                label="总出战"
                icon={Target}
                color="#22d3ee"
                delay={0.05}
              />
              <StatMiniCard
                value={save?.totalKills ?? 0}
                label="累计击杀"
                icon={Skull}
                color="#f43f5e"
                delay={0.1}
              />
              <StatMiniCard
                value={best?.stats.kills ?? 0}
                label="最佳击杀"
                icon={Trophy}
                color="#f59e0b"
                delay={0.15}
              />
              <StatMiniCard
                value={best?.stats.bossesKilled ?? 0}
                label="首领击杀"
                icon={Crown}
                color="#8b7cf0"
                delay={0.2}
              />
            </div>

            <div className="mt-3">
              <BestRunCard best={best} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <HeroRoster save={save} selectedHero={selectedHero} />
          <RecentHistory save={save} />
        </div>

        <div className="mt-4">
          <WeaponArmory save={save} equippedWeapons={equippedWeapons} />
        </div>

        <div className="mt-4">
          <QuickActions />
        </div>
      </div>
    </Layout>
  );
}