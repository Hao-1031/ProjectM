"use client";

import Image from "next/image";
import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Crosshair,
  Target,
  Lightning,
  Fire,
  Snowflake,
  Magnet,
  Sparkle,
  Swap,
  Coin,
  Lock,
  Check,
  Plus,
  Minus,
  ShoppingCart,
  Shield,
  Gauge,
  WarningCircle,
  ArrowsOut,
  ArrowsClockwise,
  Waves,
  Sword,
  Rocket,
  Drone,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import { DEFAULT_BALANCE } from "@/lib/game/balance";
import type { WeaponBalance, WeaponStatBlock } from "@/lib/game/balance";
import type { WeaponId } from "@/lib/game/types";
import { loadSave, buyWeapon, equipWeapon, unequipWeapon, type SaveData } from "@/lib/game/save";

const WEAPON_IMAGES: Record<string, string> = {
  pulse: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20close-up%20of%20a%20futuristic%20pulse%20rifle%2C%20cyan%20blue%20energy%20accents%2C%20sleek%20industrial%20design%2C%20dark%20armory%20background%2C%20low%20saturation%2C%20metallic%20texture%2C%20no%20text&image_size=landscape_16_9",
  railgun: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20close-up%20of%20a%20heavy%20railgun%20sniper%20weapon%2C%20blue%20lightning%20accents%2C%20long%20barrel%2C%20industrial%20design%2C%20dark%20wasteland%2C%20low%20saturation%2C%20metallic%2C%20no%20text&image_size=landscape_16_9",
  laser: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20close-up%20of%20a%20high-tech%20laser%20weapon%2C%20purple%20energy%20beam%2C%20precision%20optics%2C%20dark%20laboratory%20background%2C%20low%20saturation%2C%20metallic%2C%20no%20text&image_size=landscape_16_9",
  rocket: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20close-up%20of%20a%20heavy%20rocket%20launcher%2C%20red%20orange%20thermal%20accents%2C%20military%20industrial%20design%2C%20dark%20battlefield%2C%20low%20saturation%2C%20metallic%2C%20no%20text&image_size=landscape_16_9",
  gravityWell: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20close-up%20of%20a%20gravity%20distortion%20weapon%2C%20indigo%20violet%20energy%20vortex%2C%20experimental%20design%2C%20dark%20physics%20lab%2C%20low%20saturation%2C%20metallic%2C%20no%20text&image_size=landscape_16_9",
  plasmaBlade: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20close-up%20of%20a%20plasma%20energy%20blade%20sword%2C%20pink%20purple%20glowing%20edge%2C%20futuristic%20melee%20weapon%2C%20dark%20forge%20background%2C%20low%20saturation%2C%20no%20text&image_size=landscape_16_9",
};

const CATEGORIES: { id: string; label: string; icon: typeof Crosshair }[] = [
  { id: "all", label: "全部", icon: Sparkle },
  { id: "kinetic", label: "动能", icon: Target },
  { id: "energy", label: "能量", icon: Lightning },
  { id: "thermal", label: "热能", icon: Fire },
  { id: "cryo", label: "冰冻", icon: Snowflake },
  { id: "gravity", label: "重力", icon: Magnet },
  { id: "melee", label: "近战", icon: Sword },
  { id: "special", label: "特殊", icon: Drone },
];

const WEAPON_CATEGORY: Record<string, string> = {
  pulse: "kinetic", shotgun: "kinetic", seekerRifle: "kinetic", shardRepeater: "kinetic",
  laser: "energy", plasma: "energy", railgun: "energy", gauss: "energy", arcCaster: "energy",
  rocket: "thermal", flame: "thermal",
  cryoLauncher: "cryo", naniteSwarm: "cryo",
  gravityWell: "gravity", vortexCannon: "gravity",
  shortBlade: "melee", spear: "melee", greatsword: "melee", gauntlet: "melee", plasmaBlade: "melee",
  drone: "special", swarm: "special",
};

const CATEGORY_ICON: Record<string, typeof Crosshair> = {
  kinetic: Target, energy: Lightning, thermal: Fire, cryo: Snowflake,
  gravity: Magnet, melee: Sword, special: Drone,
};

const CATEGORY_COLOR: Record<string, string> = {
  kinetic: "#94a3b8", energy: "var(--orbital)", thermal: "var(--caution)", cryo: "var(--orbital)",
  gravity: "var(--primary)", melee: "var(--caution)", special: "var(--success)",
};

function WeaponTag({ label, icon: Icon, color }: { label: string; icon: typeof Crosshair; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
      style={{ backgroundColor: `${color}18`, color }}>
      <Icon size={10} weight="bold" />{label}
    </span>
  );
}

function StatMini({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Shield; color: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-primary/10 bg-background/50 px-2 py-1.5">
      <Icon size={12} weight="bold" style={{ color }} />
      <div><p className="text-[9px] uppercase tracking-wider text-muted">{label}</p><p className="text-[11px] font-bold tabular-nums">{value}</p></div>
    </div>
  );
}

function CoinBadge({ coins, unlocked, equipped, total, maxEquip }: { coins: number; unlocked: number; equipped: number; total: number; maxEquip: number }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-xl border border-warning/20 bg-warning/10 px-3 py-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15 text-warning">
        <Coin size={14} weight="fill" />
      </span>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">游戏币</p>
        <p className="font-mono text-base font-bold text-warning tabular-nums">{coins}</p>
      </div>
      <div className="flex flex-col border-l border-warning/20 pl-2.5 text-[10px] text-muted">
        <span className="inline-flex items-center gap-1">
          <Check size={10} weight="bold" className="text-success" />
          {unlocked}/{total}
        </span>
        <span className="inline-flex items-center gap-1">
          <Crosshair size={10} weight="bold" className="text-primary" />
          {equipped}/{maxEquip}
        </span>
      </div>
    </div>
  );
}

function getWeaponTags(stats: WeaponStatBlock) {
  const tags: { label: string; icon: typeof Crosshair; color: string }[] = [];
  if (stats.isMelee) {
    tags.push({ label: "近战", icon: Sword, color: "var(--caution)" });
    if (stats.meleeShape === "arc") tags.push({ label: "横扫", icon: Waves, color: "var(--accent)" });
    if (stats.meleeShape === "thrust") tags.push({ label: "刺击", icon: Target, color: "var(--orbital)" });
    if (stats.comboCount && stats.comboCount > 1) tags.push({ label: `${stats.comboCount}连击`, icon: ArrowsClockwise, color: "var(--accent)" });
  } else {
    tags.push({ label: "远程", icon: Target, color: "var(--orbital)" });
  }
  if (stats.homing) tags.push({ label: "追踪", icon: Crosshair, color: "var(--success)" });
  if (stats.pierce > 1) tags.push({ label: `穿透×${stats.pierce}`, icon: ArrowsOut, color: "var(--accent)" });
  if (stats.chainCount) tags.push({ label: "连锁", icon: Lightning, color: "var(--orbital)" });
  if (stats.burnDuration) tags.push({ label: "灼烧", icon: Fire, color: "var(--caution)" });
  if (stats.freezeDuration) tags.push({ label: "冰冻", icon: Snowflake, color: "var(--orbital)" });
  if (stats.gravityRadius) tags.push({ label: "重力", icon: Magnet, color: "var(--primary)" });
  if (stats.swarmCount) tags.push({ label: "蜂群", icon: Drone, color: "var(--success)" });
  return tags;
}

function formatUpgradeDescription(upgrade: import("@/lib/game/balance").WeaponUpgradeStep): string {
  const parts: string[] = [];
  if (upgrade.damageMul !== undefined)
    parts.push(`伤害 ${upgrade.damageMul > 1 ? "+" : ""}${Math.round((upgrade.damageMul - 1) * 100)}%`);
  if (upgrade.cooldownMul !== undefined)
    parts.push(`冷却 ${upgrade.cooldownMul < 1 ? "-" : "+"}${Math.round(Math.abs(1 - upgrade.cooldownMul) * 100)}%`);
  if (upgrade.rangeMul !== undefined)
    parts.push(`射程 ${upgrade.rangeMul > 1 ? "+" : ""}${Math.round((upgrade.rangeMul - 1) * 100)}%`);
  if (upgrade.countAdd) parts.push(`弹丸 +${upgrade.countAdd}`);
  if (upgrade.pierceAdd) parts.push(`穿透 +${upgrade.pierceAdd}`);
  if (upgrade.areaMul !== undefined)
    parts.push(`范围 ${upgrade.areaMul > 1 ? "+" : ""}${Math.round((upgrade.areaMul - 1) * 100)}%`);
  if (upgrade.burnAdd) parts.push(`灼烧 +${upgrade.burnAdd}s`);
  if (upgrade.chainCountAdd) parts.push(`连锁 +${upgrade.chainCountAdd}`);
  if (upgrade.freezeDurationAdd) parts.push(`冰冻 +${upgrade.freezeDurationAdd}s`);
  if (upgrade.gravityRadiusMul !== undefined)
    parts.push(`重力范围 +${Math.round((upgrade.gravityRadiusMul - 1) * 100)}%`);
  if (upgrade.pullStrengthMul !== undefined)
    parts.push(`牵引 +${Math.round((upgrade.pullStrengthMul - 1) * 100)}%`);
  if (upgrade.swarmCountAdd) parts.push(`无人机 +${upgrade.swarmCountAdd}`);
  if (parts.length === 0) return `等级 ${upgrade.level} 强化`;
  return `等级 ${upgrade.level}: ${parts.join("，")}`;
}

interface Toast { message: string; type: "success" | "error"; }

function ToastMessage({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => { const id = setTimeout(onDismiss, 2200); return () => clearTimeout(id); }, [onDismiss]);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
      className={`fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium shadow-lg ${
        toast.type === "success" ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger"
      }`}>
      {toast.type === "success" ? <Check size={14} weight="bold" /> : <WarningCircle size={14} weight="bold" />}
      {toast.message}
    </motion.div>
  );
}

function WeaponCard({
  id, weapon, index, save, canAfford, onBuy, onEquip, onUnequip, isLarge,
}: {
  id: WeaponId; weapon: WeaponBalance; index: number;
  save: SaveData; canAfford: boolean;
  onBuy: (id: WeaponId) => void; onEquip: (id: WeaponId) => void; onUnequip: (id: WeaponId) => void;
  isLarge: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const stats = weapon.base;
  const tags = getWeaponTags(stats);
  const unlocked = save.unlockedWeapons.includes(id);
  const equipped = save.equippedWeapons.includes(id);
  const maxWeapons = DEFAULT_BALANCE.progression.maxWeapons;
  const atCapacity = save.equippedWeapons.length >= maxWeapons && !equipped;
  const totalDamage = stats.damage * stats.count;
  const dps = stats.count > 0 ? (totalDamage / (stats.cooldown || 0.1)) : 0;
  const CatIcon = CATEGORY_ICON[WEAPON_CATEGORY[id]] ?? Target;
  const catColor = CATEGORY_COLOR[WEAPON_CATEGORY[id]] ?? "#94a3b8";

  return (
    <motion.section
      initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-3xl station-panel orbital-scan transition-all hover:border-primary/30 hover:bg-panel ${isLarge ? "md:col-span-7" : "md:col-span-5"}`}>
      <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full blur-3xl opacity-25 transition-opacity group-hover:opacity-50" style={{ backgroundColor: weapon.color }} />
      <div className="relative p-2.5 md:p-3">
        {isLarge && WEAPON_IMAGES[id] && (
          <div className="relative mb-3 h-40 overflow-hidden rounded-2xl md:h-48">
            <Image src={WEAPON_IMAGES[id]} alt={weapon.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 58vw" unoptimized />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-panel via-panel/30 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight md:text-2xl">{weapon.name}</h2>
                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider" style={{ backgroundColor: `${catColor}18`, color: catColor }}>
                    <CatIcon size={10} weight="bold" />{WEAPON_CATEGORY[id]}
                  </span>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{weapon.description}</p>
              </div>
              {equipped && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-[10px] font-bold text-primary">
                  <Check size={10} weight="bold" />已装备
                </span>
              )}
            </div>
          </div>
        )}
        {(!isLarge || !WEAPON_IMAGES[id]) && (
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${weapon.color}18`, color: weapon.color }}>
              <Crosshair size={22} weight="duotone" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">{weapon.name}</h2>
                <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider" style={{ backgroundColor: `${catColor}18`, color: catColor }}>
                  <CatIcon size={10} weight="bold" />{WEAPON_CATEGORY[id]}
                </span>
                {equipped && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                    <Check size={10} weight="bold" />已装备
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed text-muted mt-0.5">{weapon.description}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 4).map((tag) => (
            <WeaponTag key={tag.label} {...tag} />
          ))}
          {stats.count > 1 && (
            <WeaponTag label={`×${stats.count}`} icon={Crosshair} color={weapon.color} />
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {stats.count > 1 ? (
            <>
              <StatMini label="单发伤害" value={stats.damage.toFixed(0)} icon={Fire} color={weapon.color} />
              <StatMini label="总伤害" value={totalDamage.toFixed(0)} icon={Rocket} color={weapon.color} />
            </>
          ) : (
            <StatMini label="伤害" value={stats.damage.toFixed(0)} icon={Fire} color={weapon.color} />
          )}
          <StatMini label="射速" value={`${(1 / (stats.cooldown || 0.1)).toFixed(1)}/s`} icon={Gauge} color={weapon.color} />
          <StatMini label="射程" value={stats.range.toFixed(0)} icon={ArrowsOut} color={weapon.color} />
          <StatMini label="DPS" value={dps >= 1000 ? `${(dps / 1000).toFixed(1)}k` : dps.toFixed(0)} icon={Crosshair} color={weapon.color} />
          {stats.areaRadius && (
            <StatMini label="范围" value={stats.areaRadius.toFixed(0)} icon={Waves} color={weapon.color} />
          )}
        </div>

        <div className="mt-2 border-t border-primary/10 pt-1.5">
          <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            <Swap size={10} />升级路线
          </p>
          <div className="space-y-1">
            {weapon.upgrades.slice(0, 4).map((upgrade, i) => (
              <div key={i} className="flex items-start gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-panel">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold" style={{ backgroundColor: `${weapon.color}20`, color: weapon.color }}>
                  {upgrade.level}
                </span>
                <span className="text-[10px] leading-relaxed text-muted">{formatUpgradeDescription(upgrade)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-primary/10 pt-2">
          {unlocked ? (
            equipped ? (
              <button type="button" onClick={() => onUnequip(id)} disabled={save.equippedWeapons.length <= 1}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all focus-ring active:scale-95 disabled:opacity-50 disabled:hover:scale-100 border border-primary/10 bg-panel/60 text-muted hover:border-danger/40 hover:bg-danger/10 hover:text-danger">
                <Minus size={12} weight="bold" />卸下
              </button>
            ) : (
              <button type="button" onClick={() => onEquip(id)} disabled={atCapacity}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all focus-ring active:scale-95 bg-primary text-background hover:bg-primary/90 disabled:opacity-50 disabled:hover:scale-100">
                <Plus size={12} weight="bold" />装备
              </button>
            )
          ) : (
            <button type="button" onClick={() => onBuy(id)} disabled={!canAfford}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all focus-ring active:scale-95 ${canAfford ? "bg-warning text-background hover:bg-warning/90" : "cursor-not-allowed border border-primary/10 bg-panel/60 text-muted"}`}>
              {canAfford ? <ShoppingCart size={12} weight="bold" /> : <Lock size={12} weight="bold" />}
              <Coin size={12} weight="bold" />{weapon.cost}
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
}

export default function ArmoryPage() {
  const reducedMotion = useReducedMotion();
  const [save, setSave] = useState<SaveData | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [toast, setToast] = useState<Toast | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { setSave(loadSave()); }, [refreshKey]);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleBuy = useCallback((id: WeaponId) => {
    const ok = buyWeapon(id);
    if (ok) { refresh(); showToast("武器已解锁", "success"); }
    else { showToast("游戏币不足", "error"); }
  }, [refresh, showToast]);

  const handleEquip = useCallback((id: WeaponId) => {
    const ok = equipWeapon(id);
    if (ok) { refresh(); showToast("武器已装备", "success"); }
    else { showToast("装备槽已满", "error"); }
  }, [refresh, showToast]);

  const handleUnequip = useCallback((id: WeaponId) => {
    const ok = unequipWeapon(id);
    if (ok) { refresh(); showToast("武器已卸下", "success"); }
    else { showToast("至少需要保留一把武器", "error"); }
  }, [refresh, showToast]);

  const allWeapons = useMemo(() => Object.entries(DEFAULT_BALANCE.weapons) as [WeaponId, WeaponBalance][], []);
  const filteredWeapons = useMemo(() => {
    if (activeCategory === "all") return allWeapons;
    return allWeapons.filter(([id]) => WEAPON_CATEGORY[id] === activeCategory);
  }, [allWeapons, activeCategory]);

  const maxWeapons = DEFAULT_BALANCE.progression.maxWeapons;
  const coins = save?.coins ?? 0;
  const unlockedCount = save?.unlockedWeapons.length ?? 0;
  const equippedCount = save?.equippedWeapons.length ?? 0;
  const largeWeaponIds = new Set(["pulse", "railgun", "laser", "rocket", "gravityWell", "plasmaBlade"]);
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allWeapons.length };
    for (const [id] of allWeapons) {
      const cat = WEAPON_CATEGORY[id] ?? "other";
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  }, [allWeapons]);

  const equippedWeapons = useMemo(() => {
    return allWeapons.filter(([id]) => save?.equippedWeapons.includes(id));
  }, [allWeapons, save]);

  return (
    <Layout title="深空装备库">
      <div className="mx-auto min-h-[100dvh] max-w-7xl px-4 py-3 md:py-6">
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 md:mb-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
                <Crosshair weight="duotone" size={14} />深空装备库
              </span>
              <h1 className="mt-2 text-[clamp(1.5rem,4vw,2.5rem)] font-bold leading-[0.95] tracking-tight">
                航天装备<br /><span className="text-gradient">配置中心</span>
              </h1>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">
                解锁深空作战武器，自由搭配出战配置。所有装备仅影响战术风格，无氪金数值加成。
              </p>
            </div>
            <CoinBadge coins={coins} unlocked={unlockedCount} equipped={equippedCount} total={allWeapons.length} maxEquip={maxWeapons} />
          </div>
        </motion.div>

        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-4 flex gap-1 overflow-x-auto pb-1"
          role="tablist"
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            const count = categoryCounts[cat.id] ?? 0;
            return (
              <button key={cat.id} type="button" role="tab" aria-selected={active}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold transition-all focus-ring active:scale-95 ${active ? "border-primary bg-primary/10 text-primary" : "border-primary/10 bg-panel/60 text-muted hover:border-muted/60 hover:text-foreground"}`}>
                <Icon size={14} weight={active ? "bold" : "regular"} />
                {cat.label}
                <span className="ml-0.5 rounded-md bg-border/50 px-1.5 py-0.5 text-[10px] font-mono">{count}</span>
              </button>
            );
          })}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            {filteredWeapons.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-12 md:grid-flow-dense">
                {filteredWeapons.map(([id, weapon], index) => {
                  const isLarge = largeWeaponIds.has(id);
                  return (
                    <WeaponCard
                      key={id}
                      id={id}
                      weapon={weapon}
                      index={index}
                      save={save ?? loadSave()}
                      canAfford={coins >= weapon.cost}
                      onBuy={handleBuy}
                      onEquip={handleEquip}
                      onUnequip={handleUnequip}
                      isLarge={isLarge}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted">
                <Crosshair size={48} weight="duotone" className="opacity-30" />
                <p className="mt-4 text-sm font-medium">此分类暂无武器</p>
                <p className="mt-1 text-xs">请选择其他分类查看</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {equippedWeapons.length > 0 && (
          <motion.section
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-4 rounded-3xl station-panel orbital-scan p-2.5 md:p-3"
          >
            <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
              <Shield size={12} weight="duotone" />当前出战配置
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {equippedWeapons.map(([id, weapon]) => {
                const stats = weapon.base;
                return (
                  <div key={id} className="flex items-center gap-2.5 rounded-xl border border-primary/10 bg-panel-raised orbital-scan px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-panel">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${weapon.color}18`, color: weapon.color }}>
                      <Crosshair size={16} weight="duotone" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{weapon.name}</p>
                      <p className="text-[10px] text-muted tabular-nums">
                        伤害 {stats.damage.toFixed(0)} | 射速 {(1 / (stats.cooldown || 0.1)).toFixed(1)}/s
                      </p>
                    </div>
                    <button type="button" onClick={() => handleUnequip(id)} disabled={equippedCount <= 1}
                      className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted">
                      <Minus size={14} weight="bold" />
                    </button>
                  </div>
                );
              })}
              {Array.from({ length: Math.max(0, maxWeapons - equippedCount) }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center gap-2.5 rounded-xl border border-dashed border-primary/10/50 px-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-border/20 text-muted">
                    <Plus size={16} weight="regular" />
                  </span>
                  <p className="text-xs text-muted">空装备槽</p>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        <motion.section
          initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-4 rounded-3xl station-panel orbital-scan p-2.5 md:p-3"
        >
          <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
            <Sparkle size={12} weight="duotone" />武器搭配推荐
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded-xl border border-primary/10 bg-panel-raised orbital-scan p-2.5 transition-colors hover:border-primary/20">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--caution-subtle)", color: "var(--caution)" }}>
                  <Sword size={14} weight="bold" />
                </span>
                <p className="text-xs font-semibold">近战 + 控制</p>
              </div>
              <p className="text-[11px] leading-relaxed text-muted">
                等离子刃配合冷冻榴弹可清理贴脸敌人并封锁通道，突击与工程最优组合。
              </p>
            </div>
            <div className="rounded-xl border border-primary/10 bg-panel-raised orbital-scan p-2.5 transition-colors hover:border-primary/20">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--orbital-subtle)", color: "var(--orbital)" }}>
                  <Target size={14} weight="bold" />
                </span>
                <p className="text-xs font-semibold">远程 + 范围</p>
              </div>
              <p className="text-[11px] leading-relaxed text-muted">
                磁轨炮点杀精英，重力井投射器聚怪清杂兵潮，侦察与医疗核心搭配。
              </p>
            </div>
            <div className="rounded-xl border border-primary/10 bg-panel-raised orbital-scan p-2.5 transition-colors hover:border-primary/20">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--success-subtle)", color: "var(--success)" }}>
                  <Drone size={14} weight="bold" />
                </span>
                <p className="text-xs font-semibold">召唤 + 远程</p>
              </div>
              <p className="text-[11px] leading-relaxed text-muted">
                蜂群发射器配合高斯步枪，自动火力覆盖全场，防守模式高效守点。
              </p>
            </div>
          </div>
        </motion.section>

        <AnimatePresence>{toast && <ToastMessage toast={toast} onDismiss={() => setToast(null)} />}</AnimatePresence>
      </div>
    </Layout>
  );
}