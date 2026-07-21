import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crosshair,
  Snowflake,
  Butterfly,
  PawPrint,
  Eye,
  Check,
  Lightning,
  CaretRight,
  Sword,
  Users,
  Star,
  Person,
  Fire,
  Radioactive,
  Bird,
  Wall,
} from "@phosphor-icons/react";
import { HERO_DEFS } from "@/lib/game/heroes";
import { DEFAULT_BALANCE } from "@/lib/game/balance";
import type { WeaponId, HeroId, GameModeType } from "@/lib/game/types";
import { saveLoadout, loadSave } from "@/lib/game/save";

const HERO_ICONS: Record<HeroId, typeof Snowflake> = {
  nitrogen: Snowflake,
  twilight: Butterfly,
  leopard: PawPrint,
  recon: Eye,
  viper: Radioactive,
  falcon: Bird,
  bastion: Wall,
};

const CATEGORY_LABELS: Record<string, string> = {
  damage: "输出",
  skill: "技能",
  utility: "生存",
};

interface LoadoutModalProps {
  mode: GameModeType;
  initialHero: HeroId;
  initialWeapons: WeaponId[];
  onConfirm: (loadout: { heroId: HeroId; weaponIds: WeaponId[] }) => void;
  onCancel?: () => void;
}

export default function LoadoutModal({
  mode,
  initialHero,
  initialWeapons,
  onConfirm,
  onCancel,
}: LoadoutModalProps) {
  const [selectedHero, setSelectedHero] = useState<HeroId>(initialHero);
  const [selectedWeapons, setSelectedWeapons] = useState<WeaponId[]>(initialWeapons);
  const maxWeapons = DEFAULT_BALANCE.progression.maxWeapons;
  const heroes = Object.values(HERO_DEFS);
  const save = useMemo(() => loadSave(), []);
  const unlockedSet = useMemo(() => new Set(save.unlockedWeapons), [save]);
  const allWeapons = Object.entries(DEFAULT_BALANCE.weapons) as [
    WeaponId,
    (typeof DEFAULT_BALANCE.weapons)[WeaponId],
  ][];
  const weapons = allWeapons.filter(([id]) => unlockedSet.has(id));

  const activeHero = HERO_DEFS[selectedHero];

  const toggleWeapon = useCallback(
    (id: WeaponId) => {
      setSelectedWeapons((prev) => {
        if (prev.includes(id)) {
          if (prev.length <= 1) return prev;
          return prev.filter((w) => w !== id);
        }
        if (prev.length >= maxWeapons) return prev;
        return [...prev, id];
      });
    },
    [maxWeapons]
  );

  const handleConfirm = useCallback(() => {
    const weaponIds: WeaponId[] = selectedWeapons.length > 0 ? selectedWeapons : ["pulse"];
    saveLoadout(selectedHero, weaponIds);
    onConfirm({ heroId: selectedHero, weaponIds });
  }, [selectedHero, selectedWeapons, onConfirm]);

  const isTouch = typeof window !== "undefined" && "ontouchstart" in window;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-background/92 p-3 backdrop-blur-md sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.99, y: 12 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-6xl rounded-3xl border border-border bg-panel p-4 shadow-2xl sm:p-6 md:p-8"
      >
        {/* Header */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between md:mb-6">
          <div>
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-primary">
              <Crosshair size={14} weight="duotone" />
              任务准备
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-4xl">选择干员与装备</h2>
            <p className="mt-1 max-w-xl text-sm text-muted">
              {isTouch
                ? "确认干员与出战武器后部署。战斗中无法更换干员。"
                : "确认干员与出战武器后部署。战斗中无法更换干员。"}
            </p>
          </div>
          <div className="text-xs text-muted">
            模式: <span className="font-medium text-foreground">{modeName(mode)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr] lg:gap-6">
          {/* Hero list */}
          <section className="flex flex-col gap-2">
            <div className="mb-1 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
              <Users size={12} weight="bold" />
              干员
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {heroes.map((hero) => {
                const Icon = HERO_ICONS[hero.id];
                const active = selectedHero === hero.id;
                return (
                  <button
                    key={hero.id}
                    type="button"
                    onClick={() => setSelectedHero(hero.id)}
                    className={`group relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all focus-ring lg:p-4 ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border bg-[var(--panel-raised)] hover:border-primary/30 hover:bg-panel"
                    }`}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 lg:h-12 lg:w-12"
                      style={{ backgroundColor: `${hero.color}18`, color: hero.color }}
                    >
                      <Icon size={22} weight="bold" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold">{hero.name}</span>
                        {active && <Check size={14} weight="bold" className="text-primary" />}
                      </div>
                      <span className="block truncate text-[10px] uppercase tracking-wider text-muted">
                        {hero.role} · {hero.tagline}
                      </span>
                    </div>
                    {active && (
                      <span className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-primary lg:left-auto lg:right-0 lg:top-1/2 lg:h-8 lg:w-1 lg:-translate-y-1/2 lg:translate-x-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Detail + weapons */}
          <section className="flex flex-col gap-4 md:gap-6">
            {/* Hero detail card */}
            <div className="grid grid-cols-1 gap-4 rounded-3xl border border-border bg-[var(--panel-raised)] p-4 sm:p-5 md:grid-cols-[1fr_280px] md:p-6">
              {/* Portrait + basic info */}
              <div className="flex flex-col gap-4">
                <div
                  className="relative flex min-h-[220px] flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl sm:min-h-[260px]"
                  style={{
                    background: `radial-gradient(circle at 50% 100%, ${activeHero.color}22 0%, transparent 60%), linear-gradient(180deg, ${activeHero.color}0d 0%, transparent 100%)`,
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: `radial-gradient(${activeHero.color}33 1px, transparent 1px)`,
                      backgroundSize: "18px 18px",
                    }}
                  />
                  <div
                    className="pointer-events-none absolute -bottom-16 h-48 w-48 rounded-full blur-3xl"
                    style={{ backgroundColor: activeHero.color }}
                  />
                  {(() => {
                    const Icon = HERO_ICONS[activeHero.id];
                    return (
                      <motion.div
                        key={activeHero.id}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full border-2"
                        style={{ borderColor: activeHero.color, color: activeHero.color }}
                      >
                        <Icon size={64} weight="fill" />
                      </motion.div>
                    );
                  })()}
                  <div className="relative z-10 mt-4 text-center">
                    <h3 className="text-2xl font-bold">{activeHero.name}</h3>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span
                        className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${activeHero.color}18`,
                          color: activeHero.color,
                        }}
                      >
                        {activeHero.role}
                      </span>
                      <span className="text-xs text-muted">{activeHero.tagline}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Skill */}
                  <div className="rounded-2xl border border-border bg-panel p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `${activeHero.color}18`,
                          color: activeHero.color,
                        }}
                      >
                        <Lightning size={16} weight="bold" />
                      </span>
                      <div>
                        <p className="text-sm font-bold">{activeHero.skill.name}</p>
                        <p className="text-[10px] text-muted">冷却 {activeHero.skill.cooldown}s</p>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-muted">
                      {activeHero.skill.description}
                    </p>
                  </div>
                  {/* Ultimate */}
                  <div className="rounded-2xl border border-border bg-panel p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `${activeHero.color}18`,
                          color: activeHero.color,
                        }}
                      >
                        <Fire size={16} weight="bold" />
                      </span>
                      <div>
                        <p className="text-sm font-bold">{activeHero.ultimate.name}</p>
                        <p className="text-[10px] text-muted">
                          冷却 {activeHero.ultimate.cooldown}s
                        </p>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-muted">
                      {activeHero.ultimate.description}
                    </p>
                  </div>
                  {/* Passive */}
                  <div className="rounded-2xl border border-border bg-panel p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
                        <Person size={16} weight="bold" />
                      </span>
                      <p className="text-sm font-bold">被动特性</p>
                    </div>
                    <p className="text-xs leading-relaxed text-muted">
                      {formatPassive(activeHero.passive)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Talents preview */}
              <div className="flex flex-col rounded-2xl border border-border bg-panel p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star size={14} weight="bold" className="text-accent" />
                    <span className="text-sm font-bold">核心天赋</span>
                  </div>
                  <span className="text-[10px] text-muted">战斗中升级获得</span>
                </div>
                <div className="flex flex-col gap-2">
                  {activeHero.talents.slice(0, 5).map((talent) => (
                    <div
                      key={talent.id}
                      className="flex items-start gap-2 rounded-xl border border-border bg-[var(--panel-raised)] p-2.5"
                    >
                      <span
                        className="mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor:
                            talent.category === "damage"
                              ? "rgba(224,90,106,0.12)"
                              : talent.category === "skill"
                                ? "rgba(168,85,247,0.12)"
                                : "rgba(52,211,153,0.12)",
                          color:
                            talent.category === "damage"
                              ? "#e05a6a"
                              : talent.category === "skill"
                                ? "#a855f7"
                                : "#34d399",
                        }}
                      >
                        {CATEGORY_LABELS[talent.category]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold">{talent.name}</p>
                        <p className="text-[10px] leading-relaxed text-muted">
                          {talent.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weapons */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
                  <Sword size={12} weight="bold" />
                  出战武器
                </div>
                <span className="text-xs text-muted">
                  已选 <span className="font-bold text-foreground">{selectedWeapons.length}</span> /{" "}
                  {maxWeapons}
                </span>
              </div>

              {weapons.length === 0 ? (
                <div className="rounded-2xl border border-border bg-[var(--panel-raised)] p-6 text-center text-sm text-muted">
                  军械库中暂无可用武器
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {weapons.map(([id, weapon]) => {
                    const active = selectedWeapons.includes(id);
                    const totalDamage = weapon.base.damage * weapon.base.count;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleWeapon(id)}
                        className={`relative rounded-2xl border p-4 text-left transition-all focus-ring ${
                          active
                            ? "border-primary bg-primary/10"
                            : "border-border bg-[var(--panel-raised)] hover:border-primary/30 hover:bg-panel"
                        }`}
                      >
                        {active && (
                          <span className="absolute right-3 top-3 rounded-full bg-primary p-1 text-background">
                            <Check size={12} weight="bold" />
                          </span>
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold">{weapon.name}</span>
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${weapon.color}18`, color: weapon.color }}
                          >
                            <Crosshair size={16} weight="bold" />
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted">
                          {weapon.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {weapon.base.count > 1 ? (
                            <span className="rounded-md bg-border px-1.5 py-0.5 text-[10px] text-muted">
                              {weapon.base.damage} × {weapon.base.count} = {totalDamage}
                            </span>
                          ) : (
                            <span className="rounded-md bg-border px-1.5 py-0.5 text-[10px] text-muted">
                              伤害 {weapon.base.damage}
                            </span>
                          )}
                          <span className="rounded-md bg-border px-1.5 py-0.5 text-[10px] text-muted">
                            射速 {(1 / weapon.base.cooldown).toFixed(1)}/s
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </section>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end md:mt-8 md:pt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-[var(--panel-raised)] focus-ring active:scale-95"
            >
              返回
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedWeapons.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-background transition-all hover:bg-primary/90 focus-ring active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            部署
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function modeName(mode: GameModeType): string {
  const names: Record<GameModeType, string> = {
    defense: "据点防守",
    campaign: "战役模式",
    endless: "无尽生存",
    daily: "每日挑战",
    roguelike: "冒险模式",
    deathmatch: "个人死斗",
    survival: "生存模式",
  };
  return names[mode] ?? mode;
}

function formatPassive(passive: {
  maxHealthMul?: number;
  speedMul?: number;
  armorAdd?: number;
  critAdd?: number;
  regenAdd?: number;
  cooldownReductionAdd?: number;
  areaMul?: number;
}): string {
  const parts: string[] = [];
  if (passive.maxHealthMul)
    parts.push(
      `生命上限 ${passive.maxHealthMul > 1 ? "+" : ""}${Math.round((passive.maxHealthMul - 1) * 100)}%`
    );
  if (passive.speedMul) parts.push(`移动速度 +${Math.round((passive.speedMul - 1) * 100)}%`);
  if (passive.armorAdd) parts.push(`护甲 +${Math.round(passive.armorAdd * 100)}%`);
  if (passive.critAdd) parts.push(`暴击率 +${Math.round(passive.critAdd * 100)}%`);
  if (passive.regenAdd) parts.push(`生命恢复 +${passive.regenAdd}/秒`);
  if (passive.cooldownReductionAdd)
    parts.push(`冷却缩减 +${Math.round(passive.cooldownReductionAdd * 100)}%`);
  if (passive.areaMul) parts.push(`范围效果 +${Math.round((passive.areaMul - 1) * 100)}%`);
  return parts.join(" · ") || "无";
}
