import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crosshair,
  Shield,
  Heart,
  Wrench,
  Eye,
  Bomb,
  Check,
  Lightning,
  CaretRight,
  Sword,
  Users,
} from "@phosphor-icons/react";
import { HERO_DEFS } from "@/lib/game/heroes";
import { DEFAULT_BALANCE } from "@/lib/game/balance";
import type { WeaponId, HeroId, GameModeType } from "@/lib/game/types";
import { saveLoadout } from "@/lib/game/save";

const HERO_ICONS: Record<HeroId, typeof Shield> = {
  assault: Shield,
  medic: Heart,
  engineer: Wrench,
  scout: Eye,
  vanguard: Bomb,
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
  const weapons = Object.entries(DEFAULT_BALANCE.weapons) as [WeaponId, (typeof DEFAULT_BALANCE.weapons)[WeaponId]][];

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
    <div className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-background/92 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.99, y: 12 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-5xl rounded-3xl border border-border bg-panel p-5 shadow-2xl md:p-8"
      >
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-primary">
              <Crosshair size={14} weight="duotone" />
              任务准备
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-4xl">选择干员与装备</h2>
            <p className="mt-1 max-w-xl text-sm text-muted">
              {isTouch
                ? "确认英雄与出战武器后进入战场。战斗中仍可通过升级获得更多武器。"
                : "确认英雄与出战武器后进入战场。战斗中仍可通过升级获得更多武器。"}
            </p>
          </div>
          <div className="text-xs text-muted">
            模式: <span className="font-medium text-foreground">{modeName(mode)}</span>
          </div>
        </div>

        {/* Heroes */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
            <Users size={12} weight="bold" />
            干员
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {heroes.map((hero) => {
              const Icon = HERO_ICONS[hero.id];
              const active = selectedHero === hero.id;
              return (
                <button
                  key={hero.id}
                  type="button"
                  onClick={() => setSelectedHero(hero.id)}
                  className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all focus-ring ${
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
                  <span
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${hero.color}18`, color: hero.color }}
                  >
                    <Icon size={22} weight="bold" />
                  </span>
                  <span className="text-sm font-bold">{hero.name}</span>
                  <span className="mt-1 text-xs text-muted line-clamp-2">{hero.description}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted">
                    <Lightning size={10} weight="bold" />
                    {hero.skill.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Weapons */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
              <Sword size={12} weight="bold" />
              出战武器
            </div>
            <span className="text-xs text-muted">
              已选 <span className="font-bold text-foreground">{selectedWeapons.length}</span> / {maxWeapons}
            </span>
          </div>

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
                  <div className="mt-2 flex flex-wrap gap-1">
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
        </section>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
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
  };
  return names[mode] ?? mode;
}
