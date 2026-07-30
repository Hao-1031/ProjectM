"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Layout from "@/components/Layout";
import {
  Sparkle,
  Snowflake,
  Butterfly,
  PawPrint,
  Crosshair,
  Skull,
  AirplaneTilt,
  CastleTurret,
  Quotes,
  Shield,
  Atom,
  Fire,
  Circle,
  Robot,
  Heartbeat,
  Handshake,
  Sword,
  Lightning,
  GraduationCap,
  UserCircle,
  Heart,
  Palette,
  Target,
  Info,
  Star,
} from "@phosphor-icons/react";
import { HERO_LORE, type HeroLore, type HeroRelationship, type HeroAbilityLore } from "@/lib/game/hero-lore";
import { HERO_DEFS } from "@/lib/game/heroes";
import type { HeroId } from "@/lib/game/types";

const HERO_ORDER: HeroId[] = [
  "nitrogen",
  "twilight",
  "leopard",
  "recon",
  "viper",
  "falcon",
  "bastion",
];

const HERO_ICONS: Record<string, typeof Snowflake> = {
  nitrogen: Snowflake,
  twilight: Butterfly,
  leopard: PawPrint,
  recon: Crosshair,
  viper: Skull,
  falcon: AirplaneTilt,
  bastion: CastleTurret,
};

const FACTION_LABELS: Record<string, string> = {
  original: "原点阵营",
  entropy: "熵能阵营",
  quantum: "量子阵营",
  void: "虚空阵营",
  bio: "生物阵营",
  mech: "机械阵营",
};

const FACTION_ICONS: Record<string, typeof Shield> = {
  original: Shield,
  entropy: Fire,
  quantum: Atom,
  void: Circle,
  bio: Heartbeat,
  mech: Robot,
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  ally: "盟友",
  rival: "对手",
  mentor: "导师",
  student: "学生",
  family: "家人",
};

const RELATIONSHIP_ICONS: Record<string, typeof Handshake> = {
  ally: Handshake,
  rival: Sword,
  mentor: GraduationCap,
  student: UserCircle,
  family: Heart,
};

const ABILITY_TYPE_LABELS: Record<string, string> = {
  skill: "技能",
  ultimate: "终极",
  passive: "被动",
};

const ABILITY_TYPE_COLORS: Record<string, string> = {
  skill: "var(--orbital)",
  ultimate: "var(--accent)",
  passive: "var(--primary)",
};

function HeroHeader() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6 md:mb-10"
    >
      <div className="flex flex-col gap-2">
        <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
          <Sparkle weight="duotone" size={14} />
          船员档案
        </span>
        <h1 className="mt-1 font-display text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[0.95] tracking-tight">
          船员名录
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
          深空前哨站 - 每一位船员都有属于自己的故事。从科考站的极寒废墟到维度裂痕的核心，这些船员用生命守护着深空前哨站的每一寸土地。
        </p>
      </div>
    </motion.div>
  );
}

function RelationshipBadge({ rel, heroColor }: { rel: HeroRelationship; heroColor: string }) {
  const targetHero = HERO_DEFS[rel.heroId];
  const targetName = targetHero?.name ?? rel.heroId;
  const RI = RELATIONSHIP_ICONS[rel.type] ?? Handshake;
  const label = RELATIONSHIP_LABELS[rel.type] ?? rel.type;

  return (
    <div className="group flex items-start gap-3 rounded-xl border border-primary/10 bg-background/50 p-3 transition-all hover:border-primary/30 hover:bg-panel">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${heroColor}14`, border: `1px solid ${heroColor}30` }}
      >
        <RI size={15} weight="bold" style={{ color: heroColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold">{targetName}</span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium"
            style={{ backgroundColor: `${heroColor}12`, color: heroColor }}
          >
            {label}
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">{rel.description}</p>
      </div>
    </div>
  );
}

function AbilityCard({ ability, heroColor }: { ability: HeroAbilityLore; heroColor: string }) {
  const typeColor = ABILITY_TYPE_COLORS[ability.type] ?? heroColor;
  const typeLabel = ABILITY_TYPE_LABELS[ability.type] ?? ability.type;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-primary/10 bg-background/50 p-3 transition-all hover:border-primary/30 hover:bg-panel">
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-2xl transition-opacity group-hover:opacity-60" style={{ backgroundColor: `${typeColor}10` }} />
      <div className="relative flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: `${typeColor}16`, color: typeColor }}
        >
          {typeLabel}
        </span>
        <span className="text-xs font-semibold">{ability.name}</span>
      </div>
      <p className="relative mt-1.5 text-[11px] leading-relaxed text-muted">{ability.description}</p>
      <p className="relative mt-1 text-[10px] leading-relaxed text-muted/70 italic">
        {ability.lore}
      </p>
    </div>
  );
}

function HeroPanel({ heroId, index }: { heroId: HeroId; index: number }) {
  const reducedMotion = useReducedMotion();
  const lore = HERO_LORE[heroId];
  const def = HERO_DEFS[heroId];
  const HeroIcon = HERO_ICONS[heroId] ?? Crosshair;
  const heroColor = def.color;
  const FI = FACTION_ICONS[lore.faction] ?? Shield;
  const factionLabel = FACTION_LABELS[lore.faction] ?? lore.faction;

  const isLarge = index === 0 || index === 3;

  return (
    <motion.section
      initial={reducedMotion ? undefined : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.55,
        delay: Math.min(index * 0.08, 0.5),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`group station-panel orbital-scan transition-all hover:border-primary/30 hover:bg-panel ${
        isLarge ? "md:col-span-2" : "md:col-span-1"
      }`}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: heroColor }}
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-25"
        style={{ backgroundColor: heroColor }}
      />

      <div className="relative p-4 md:p-5">
        {/* Hero Identity */}
        <div className="flex flex-wrap items-start gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: `${heroColor}16`,
              border: `2px solid ${heroColor}40`,
            }}
          >
            <HeroIcon size={32} weight="duotone" style={{ color: heroColor }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                {lore.fullName}
              </h2>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: `${heroColor}16`, color: heroColor }}
              >
                {lore.title}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted">
              {def.role} · {lore.role}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/10 bg-background/60 px-2 py-1 text-[10px] font-medium text-muted">
                <FI size={11} weight="bold" style={{ color: heroColor }} />
                {lore.dimension}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium"
                style={{ backgroundColor: `${heroColor}12`, color: heroColor }}
              >
                {factionLabel}
              </span>
              <span className="font-mono tabular-nums text-[10px] text-muted">
                {lore.age}岁 · {lore.height}
              </span>
            </div>
          </div>
        </div>

        {/* Personality */}
        <div className="mt-4 rounded-xl border border-primary/10 bg-background/50 p-3">
          <div className="flex items-center gap-2">
            <Info size={13} weight="bold" style={{ color: heroColor }} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">性格评估</span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{lore.personality}</p>
        </div>

        {/* Backstory */}
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <Sparkle size={13} weight="bold" style={{ color: heroColor }} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">航行日志</span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{lore.backstory}</p>
        </div>

        {/* Quote */}
        <div className="mt-4 relative rounded-xl border border-primary/10 bg-background/50 p-3">
          <Quotes size={18} weight="fill" className="absolute -top-2 left-3 text-muted/30" />
          <p className="pl-3 text-xs font-medium leading-relaxed italic" style={{ color: heroColor }}>
            {lore.quote}
          </p>
        </div>

        {/* Abilities */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <Star size={13} weight="bold" style={{ color: heroColor }} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">能力模块</span>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {lore.abilities.map((ability) => (
              <AbilityCard key={ability.name} ability={ability} heroColor={heroColor} />
            ))}
          </div>
        </div>

        {/* Relationships */}
        {lore.relationships.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <Handshake size={13} weight="bold" style={{ color: heroColor }} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">船员关系</span>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {lore.relationships.map((rel) => (
                <RelationshipBadge key={`${rel.heroId}-${rel.type}`} rel={rel} heroColor={heroColor} />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function ConceptArtSection() {
  const reducedMotion = useReducedMotion();

  const artEntries = useMemo(
    () =>
      HERO_ORDER.map((heroId) => {
        const lore = HERO_LORE[heroId];
        const def = HERO_DEFS[heroId];
        return {
          heroId,
          name: lore.fullName,
          title: lore.title,
          color: def.color,
          conceptArtPrompt: lore.conceptArtPrompt,
        };
      }),
    [],
  );

  return (
    <motion.section
      initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="mt-8 md:mt-12"
    >
      <div className="station-panel-header mb-4 rounded-t-xl border-t border-x border-primary/10">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <Palette size={16} weight="bold" className="text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight">视觉档案</h2>
            <p className="text-[10px] text-muted">每位船员的视觉化呈现方向</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {artEntries.map((entry, i) => {
          const HeroIcon = HERO_ICONS[entry.heroId] ?? Crosshair;
          return (
            <motion.div
              key={entry.heroId}
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="group station-panel orbital-scan p-4 transition-all hover:border-primary/30 hover:bg-panel"
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl transition-opacity group-hover:opacity-50"
                style={{ backgroundColor: `${entry.color}12` }}
              />
              <div className="relative flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${entry.color}16`, border: `1px solid ${entry.color}30` }}
                >
                  <HeroIcon size={20} weight="duotone" style={{ color: entry.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold">{entry.name}</p>
                  <p className="text-[10px] text-muted">{entry.title}</p>
                </div>
              </div>
              <div className="relative mt-3 rounded-xl border border-primary/10 bg-background/50 p-3">
                <div className="flex items-start gap-2">
                  <Palette size={13} weight="bold" className="mt-0.5 shrink-0 text-muted" />
                  <p className="text-[11px] leading-relaxed text-muted">{entry.conceptArtPrompt}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

export default function HeroArchivePage() {
  const reducedMotion = useReducedMotion();

  return (
    <Layout title="船员名录">
      <div className="relative mx-auto max-w-7xl px-4 py-6 md:py-8">
        <HeroHeader />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:grid-flow-dense">
          {HERO_ORDER.map((heroId, index) => (
            <HeroPanel key={heroId} heroId={heroId} index={index} />
          ))}
        </div>

        <ConceptArtSection />
      </div>
    </Layout>
  );
}