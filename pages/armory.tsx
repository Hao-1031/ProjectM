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
  CaretRight,
  Swap,
  Coin,
  Lock,
  Check,
  Plus,
  Minus,
  ShoppingCart,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import { DEFAULT_BALANCE } from "@/lib/game/balance";
import type { WeaponBalance, WeaponStatBlock } from "@/lib/game/balance";
import type { WeaponId } from "@/lib/game/types";
import { loadSave, buyWeapon, equipWeapon, unequipWeapon, type SaveData } from "@/lib/game/save";

const TAG_ICONS: Record<string, typeof Crosshair> = {
  kinetic: Target,
  energy: Lightning,
  thermal: Fire,
  cryo: Snowflake,
  gravity: Magnet,
};

function WeaponTag({
  label,
  icon: Icon,
  color,
}: {
  label: string;
  icon: typeof Crosshair;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
      style={{ backgroundColor: `${color}18`, color }}
    >
      <Icon size={10} weight="bold" />
      {label}
    </span>
  );
}

function StatBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, Math.max(4, (value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted">
        <span>{label}</span>
        <span>{value.toFixed(value < 10 ? 1 : 0)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function getWeaponTags(id: string, stats: WeaponStatBlock) {
  const tags: { label: string; icon: typeof Crosshair; color: string }[] = [];
  if (stats.isMelee) tags.push({ label: "近战", icon: Crosshair, color: "#f43f5e" });
  else tags.push({ label: "远程", icon: Target, color: "#22d3ee" });

  if (id.includes("plasma") || id.includes("arc") || id.includes("laser")) {
    tags.push({ label: "能量", icon: Lightning, color: "#38bdf8" });
  } else if (id.includes("flame") || id.includes("thermal")) {
    tags.push({ label: "热能", icon: Fire, color: "#f97316" });
  } else if (id.includes("cryo") || stats.freezeDuration) {
    tags.push({ label: "冰冻", icon: Snowflake, color: "#60a5fa" });
  } else if (id.includes("gravity") || stats.gravityRadius) {
    tags.push({ label: "重力", icon: Magnet, color: "#a855f7" });
  } else {
    tags.push({ label: "动能", icon: Target, color: "#94a3b8" });
  }

  if (stats.homing) tags.push({ label: "追踪", icon: Crosshair, color: "#34d399" });
  if (stats.pierce > 1) tags.push({ label: "穿透", icon: Crosshair, color: "#f59e0b" });
  if (stats.chainCount) tags.push({ label: "连锁", icon: Lightning, color: "#e879f9" });

  return tags;
}

function formatUpgradeDescription(upgrade: import("@/lib/game/balance").WeaponUpgradeStep): string {
  const parts: string[] = [];
  if (upgrade.damageMul !== undefined)
    parts.push(
      `伤害 ${upgrade.damageMul > 1 ? "+" : ""}${Math.round((upgrade.damageMul - 1) * 100)}%`
    );
  if (upgrade.cooldownMul !== undefined)
    parts.push(
      `冷却 ${upgrade.cooldownMul < 1 ? "-" : "+"}${Math.round(Math.abs(1 - upgrade.cooldownMul) * 100)}%`
    );
  if (upgrade.rangeMul !== undefined)
    parts.push(
      `射程 ${upgrade.rangeMul > 1 ? "+" : ""}${Math.round((upgrade.rangeMul - 1) * 100)}%`
    );
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

interface WeaponCardProps {
  id: WeaponId;
  weapon: WeaponBalance;
  index: number;
  save: SaveData;
  canAfford: boolean;
  onBuy: (id: WeaponId) => void;
  onEquip: (id: WeaponId) => void;
  onUnequip: (id: WeaponId) => void;
}

function WeaponCard({
  id,
  weapon,
  index,
  save,
  canAfford,
  onBuy,
  onEquip,
  onUnequip,
}: WeaponCardProps) {
  const reducedMotion = useReducedMotion();
  const stats = weapon.base;
  const tags = getWeaponTags(id, stats);
  const unlocked = save.unlockedWeapons.includes(id);
  const equipped = save.equippedWeapons.includes(id);
  const maxWeapons = DEFAULT_BALANCE.progression.maxWeapons;
  const atCapacity = save.equippedWeapons.length >= maxWeapons;
  const totalDamage = stats.damage * stats.count;

  return (
    <motion.article
      initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="group flex flex-col rounded-2xl border border-border bg-panel p-5 transition-colors hover:bg-panel-raised md:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight">{weapon.name}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">{weapon.description}</p>
        </div>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${weapon.color}18`, color: weapon.color }}
        >
          <Crosshair size={20} weight="duotone" />
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <WeaponTag key={tag.label} {...tag} />
        ))}
        {stats.count > 1 && (
          <WeaponTag label={`×${stats.count}`} icon={Crosshair} color={weapon.color} />
        )}
      </div>

      <div className="mt-5 grid gap-3">
        {stats.count > 1 ? (
          <>
            <StatBar label="单发伤害" value={stats.damage} max={180} color={weapon.color} />
            <StatBar label="总伤害" value={totalDamage} max={180} color={weapon.color} />
          </>
        ) : (
          <StatBar label="伤害" value={stats.damage} max={180} color={weapon.color} />
        )}
        <StatBar label="射速" value={1 / (stats.cooldown || 0.1)} max={12} color={weapon.color} />
        <StatBar label="射程" value={stats.range} max={500} color={weapon.color} />
        <StatBar label="弹速" value={stats.projectileSpeed} max={700} color={weapon.color} />
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted">
          <Swap size={10} />
          升级路线
        </p>
        <ul className="space-y-1.5">
          {weapon.upgrades.slice(0, 3).map((upgrade, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-muted">
              <CaretRight size={10} className="mt-0.5 shrink-0 text-primary" />
              <span>{formatUpgradeDescription(upgrade)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pt-5">
        {unlocked ? (
          equipped ? (
            <button
              type="button"
              onClick={() => onUnequip(id)}
              disabled={save.equippedWeapons.length <= 1}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-[var(--panel-raised)] py-2.5 text-sm font-medium transition-all hover:border-danger/40 hover:bg-danger/10 hover:text-danger focus-ring active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Minus size={16} weight="bold" />
              卸下
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onEquip(id)}
              disabled={atCapacity}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-background transition-all hover:bg-primary/90 focus-ring active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Plus size={16} weight="bold" />
              装备
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={() => onBuy(id)}
            disabled={!canAfford}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all focus-ring active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            style={{
              backgroundColor: canAfford ? `${weapon.color}18` : undefined,
              color: canAfford ? weapon.color : undefined,
              border: `1px solid ${canAfford ? `${weapon.color}40` : "var(--border)"}`,
            }}
          >
            {canAfford ? (
              <ShoppingCart size={16} weight="bold" />
            ) : (
              <Lock size={16} weight="bold" />
            )}
            {weapon.cost}
            <Coin size={14} weight="fill" />
          </button>
        )}
      </div>
    </motion.article>
  );
}

export default function ArmoryPage() {
  const reducedMotion = useReducedMotion();
  const [save, setSave] = useState<SaveData | null>(null);
  const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const fallbackSave = useMemo(() => loadSave(), []);

  const showNotice = useCallback((message: string, type: "success" | "error") => {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 2200);
  }, []);

  const handleBuy = useCallback(
    (id: WeaponId) => {
      const ok = buyWeapon(id);
      if (ok) {
        setSave(loadSave());
        showNotice("武器已解锁", "success");
      } else {
        showNotice("游戏币不足", "error");
      }
    },
    [showNotice]
  );

  const handleEquip = useCallback(
    (id: WeaponId) => {
      const ok = equipWeapon(id);
      if (ok) {
        setSave(loadSave());
      } else {
        showNotice("装备槽已满", "error");
      }
    },
    [showNotice]
  );

  const handleUnequip = useCallback(
    (id: WeaponId) => {
      const ok = unequipWeapon(id);
      if (ok) {
        setSave(loadSave());
      } else {
        showNotice("至少需要保留一把武器", "error");
      }
    },
    [showNotice]
  );

  const weapons = Object.entries(DEFAULT_BALANCE.weapons) as [WeaponId, WeaponBalance][];
  const maxWeapons = DEFAULT_BALANCE.progression.maxWeapons;
  const coins = save?.coins ?? 0;

  return (
    <Layout title="军械库">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-20">
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-10 md:mb-16"
        >
          <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
            <Crosshair weight="duotone" size={14} />
            军械库
          </span>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">武器与装备</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
                用任务奖励的游戏币解锁武器，并装配到出战栏位。合理搭配是据点防守胜利的关键。
              </p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-border bg-panel px-4 py-3 sm:self-auto">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <Coin size={18} weight="fill" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted">游戏币</p>
                <p className="font-mono text-xl font-bold">{coins}</p>
              </div>
            </div>
          </div>

          {save && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1 rounded-lg bg-panel px-2 py-1">
                <Check size={12} weight="bold" className="text-success" />
                已解锁 {save.unlockedWeapons.length} / {weapons.length}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-panel px-2 py-1">
                <Crosshair size={12} weight="bold" className="text-primary" />
                已装备 {save.equippedWeapons.length} / {maxWeapons}
              </span>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mb-6 rounded-xl border px-4 py-3 text-sm font-medium ${
                notice.type === "success"
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-danger/30 bg-danger/10 text-danger"
              }`}
            >
              {notice.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weapons.map(([id, weapon], index) => (
            <WeaponCard
              key={id}
              id={id}
              weapon={weapon}
              index={index}
              save={save ?? fallbackSave}
              canAfford={(save?.coins ?? 0) >= weapon.cost}
              onBuy={handleBuy}
              onEquip={handleEquip}
              onUnequip={handleUnequip}
            />
          ))}
        </div>

        <motion.section
          initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="mt-16 rounded-2xl border border-border bg-panel p-6 md:p-8"
        >
          <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
            <Sparkle size={12} />
            武器搭配建议
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-panel-raised p-4">
              <p className="font-semibold">近战 + 控制</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                等离子刃配合冰冻发射器可清理贴脸敌人并封锁通道，适合突击与工程。
              </p>
            </div>
            <div className="rounded-xl border border-border bg-panel-raised p-4">
              <p className="font-semibold">远程 + 群体</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                磁轨炮点杀精英，榴弹发射器处理杂兵潮，侦察与医疗常用组合。
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </Layout>
  );
}
