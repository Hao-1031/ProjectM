import { motion, useReducedMotion } from "framer-motion";
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
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import { DEFAULT_BALANCE } from "@/lib/game/balance";
import type { WeaponBalance, WeaponStatBlock } from "@/lib/game/balance";

const TAG_ICONS: Record<string, typeof Crosshair> = {
  kinetic: Target,
  energy: Lightning,
  thermal: Fire,
  cryo: Snowflake,
  gravity: Magnet,
};

function WeaponTag({ label, icon: Icon, color }: { label: string; icon: typeof Crosshair; color: string }) {
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

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
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

function WeaponCard({
  id,
  weapon,
  index,
}: {
  id: string;
  weapon: WeaponBalance;
  index: number;
}) {
  const reducedMotion = useReducedMotion();
  const stats = weapon.base;
  const tags = getWeaponTags(id, stats);

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
      </div>

      <div className="mt-5 grid gap-3">
        <StatBar label="伤害" value={stats.damage} max={180} color={weapon.color} />
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
    </motion.article>
  );
}

function formatUpgradeDescription(upgrade: import("@/lib/game/balance").WeaponUpgradeStep): string {
  const parts: string[] = [];
  if (upgrade.damageMul !== undefined) parts.push(`伤害 ${upgrade.damageMul > 1 ? "+" : ""}${Math.round((upgrade.damageMul - 1) * 100)}%`);
  if (upgrade.cooldownMul !== undefined) parts.push(`冷却 ${upgrade.cooldownMul < 1 ? "-" : "+"}${Math.round(Math.abs((1 - upgrade.cooldownMul)) * 100)}%`);
  if (upgrade.rangeMul !== undefined) parts.push(`射程 ${upgrade.rangeMul > 1 ? "+" : ""}${Math.round((upgrade.rangeMul - 1) * 100)}%`);
  if (upgrade.countAdd) parts.push(`弹丸 +${upgrade.countAdd}`);
  if (upgrade.pierceAdd) parts.push(`穿透 +${upgrade.pierceAdd}`);
  if (upgrade.areaMul !== undefined) parts.push(`范围 ${upgrade.areaMul > 1 ? "+" : ""}${Math.round((upgrade.areaMul - 1) * 100)}%`);
  if (upgrade.burnAdd) parts.push(`灼烧 +${upgrade.burnAdd}s`);
  if (upgrade.chainCountAdd) parts.push(`连锁 +${upgrade.chainCountAdd}`);
  if (upgrade.freezeDurationAdd) parts.push(`冰冻 +${upgrade.freezeDurationAdd}s`);
  if (upgrade.gravityRadiusMul !== undefined) parts.push(`重力范围 +${Math.round((upgrade.gravityRadiusMul - 1) * 100)}%`);
  if (upgrade.pullStrengthMul !== undefined) parts.push(`牵引 +${Math.round((upgrade.pullStrengthMul - 1) * 100)}%`);
  if (upgrade.swarmCountAdd) parts.push(`无人机 +${upgrade.swarmCountAdd}`);
  if (parts.length === 0) return `等级 ${upgrade.level} 强化`;
  return `等级 ${upgrade.level}: ${parts.join("，")}`;
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

export default function ArmoryPage() {
  const reducedMotion = useReducedMotion();
  const weapons = Object.entries(DEFAULT_BALANCE.weapons);

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
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
            武器与装备
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            从制式脉冲步枪到实验级重力井，每把武器都有独特的升级路线。合理搭配是据点防守胜利的关键。
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weapons.map(([id, weapon], index) => (
            <WeaponCard key={id} id={id} weapon={weapon} index={index} />
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
