"use client";

import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { motion, useReducedMotion } from "framer-motion";
import {
  Globe,
  Radioactive,
  Atom,
  EyeSlash,
  Leaf,
  Calendar,
  MagnifyingGlass,
  Sword,
  User,
  Wrench,
  Star,
  Clock,
  Quotes,
  Users,
  Flashlight,
  Faders,
} from "@phosphor-icons/react";
import { DIMENSIONS, CHRONICLES, type DimensionEntry, type ChronicleEntry } from "@/lib/game/chronicles";
import { HERO_DEFS } from "@/lib/game/heroes";
import type { HeroId } from "@/lib/game/types";

const CATEGORY_CONFIG: Record<ChronicleEntry["category"], { label: string; color: string; bg: string; border: string; icon: typeof Calendar }> = {
  event: { label: "事件", color: "var(--quantum)", bg: "var(--quantum-subtle)", border: "rgba(11,29,58,0.25)", icon: Calendar },
  discovery: { label: "发现", color: "var(--success)", bg: "rgba(74,154,110,0.1)", border: "rgba(74,154,110,0.25)", icon: MagnifyingGlass },
  battle: { label: "战役", color: "var(--entropy)", bg: "var(--entropy-subtle)", border: "rgba(200,74,74,0.25)", icon: Sword },
  character: { label: "角色", color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)", icon: User },
  technology: { label: "科技", color: "var(--anchor)", bg: "var(--anchor-subtle)", border: "rgba(200,164,92,0.25)", icon: Wrench },
};

const DIMENSION_ICONS: Record<string, typeof Globe> = {
  original: Globe,
  entropy: Radioactive,
  quantum: Atom,
  void: EyeSlash,
  bio: Leaf,
};

const THREAT_CONFIG: Record<DimensionEntry["threatLevel"], { label: string; color: string; bg: string }> = {
  low: { label: "低威胁", color: "var(--success)", bg: "rgba(74,154,110,0.1)" },
  medium: { label: "中威胁", color: "var(--warning)", bg: "var(--anchor-subtle)" },
  high: { label: "高威胁", color: "var(--entropy)", bg: "var(--entropy-subtle)" },
  extreme: { label: "极端威胁", color: "var(--caution)", bg: "rgba(200,74,74,0.08)" },
  unknown: { label: "威胁未知", color: "var(--quantum)", bg: "var(--quantum-subtle)" },
};

function DimensionCard({ dim, index }: { dim: DimensionEntry; index: number }) {
  const reducedMotion = useReducedMotion();
  const Icon = DIMENSION_ICONS[dim.id] ?? Globe;
  const threat = THREAT_CONFIG[dim.threatLevel];

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group station-panel orbital-scan p-4 transition-all hover:border-primary/25 hover:bg-panel"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-35"
        style={{ backgroundColor: dim.color }}
      />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${dim.color}15`, border: `1px solid ${dim.color}30` }}
            >
              <Icon size={20} weight="bold" style={{ color: dim.color }} />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold">{dim.name}</h3>
              <p className="font-mono text-[10px] text-muted">{dim.energySignature}</p>
            </div>
          </div>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold"
            style={{ color: threat.color, backgroundColor: threat.bg }}
          >
            {threat.label}
          </span>
        </div>

        <p className="mt-2.5 text-[11px] leading-relaxed text-muted line-clamp-2">{dim.description}</p>

        <div className="mt-3 flex items-center gap-2 font-mono tabular-nums text-[10px] text-muted">
          <Clock size={11} weight="bold" className="opacity-60" />
          <span>{dim.discoveredAt}</span>
        </div>

        <div className="mt-2.5 space-y-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">关键事件</p>
          <div className="flex flex-wrap gap-1">
            {dim.keyEvents.map((ev) => (
              <span
                key={ev}
                className="rounded-md border border-primary/10 bg-background/60 px-1.5 py-0.5 text-[9px] text-muted"
              >
                {ev}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[9px] text-muted">
          <span className="flex items-center gap-1">
            <Users size={10} weight="bold" className="opacity-60" />
            居民:
          </span>
          {dim.inhabitants.map((inh) => (
            <span key={inh} className="rounded-md border border-primary/10 bg-background/60 px-1.5 py-0.5 text-muted">
              {inh}
            </span>
          ))}
        </div>

        <div
          className="mt-2.5 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${dim.color}40, transparent)` }}
        />
      </div>
    </motion.div>
  );
}

function CategoryFilter({
  selected,
  onSelect,
  counts,
}: {
  selected: ChronicleEntry["category"] | null;
  onSelect: (cat: ChronicleEntry["category"] | null) => void;
  counts: Record<ChronicleEntry["category"], number>;
}) {
  const reducedMotion = useReducedMotion();
  const categories = Object.entries(CATEGORY_CONFIG) as [ChronicleEntry["category"], (typeof CATEGORY_CONFIG)[ChronicleEntry["category"]]][];

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-wrap items-center gap-2"
    >
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all focus-ring ${
          selected === null
            ? "border-primary/30 bg-primary-subtle text-primary"
            : "border border-primary/10 bg-panel/60 text-muted hover:border-primary/20 hover:text-foreground"
        }`}
      >
        <Faders size={13} weight="bold" />
        全部
        <span className="ml-0.5 font-mono tabular-nums text-[10px] opacity-60">{CHRONICLES.length}</span>
      </button>
      {categories.map(([cat, cfg]) => {
        const Icon = cfg.icon;
        const active = selected === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelect(active ? null : cat)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all focus-ring ${
              active
                ? "border text-foreground"
                : "border border-primary/10 bg-panel/60 text-muted hover:border-primary/20 hover:text-foreground"
            }`}
            style={active ? { borderColor: cfg.border, backgroundColor: cfg.bg, color: cfg.color } : undefined}
          >
            <Icon size={13} weight="bold" style={{ color: active ? cfg.color : undefined }} />
            {cfg.label}
            <span className="ml-0.5 font-mono tabular-nums text-[10px] opacity-60">{counts[cat]}</span>
          </button>
        );
      })}
    </motion.div>
  );
}

function TimelineEvent({
  entry,
  index,
}: {
  entry: ChronicleEntry;
  index: number;
  isEven: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const catCfg = CATEGORY_CONFIG[entry.category];
  const CatIcon = catCfg.icon;

  const relatedHeroNames = useMemo(() => {
    return entry.relatedHeroIds
      .map((hid) => HERO_DEFS[hid as HeroId]?.name)
      .filter(Boolean) as string[];
  }, [entry.relatedHeroIds]);

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex gap-4 md:gap-6"
    >
      {/* Date label */}
      <div className="hidden w-[90px] shrink-0 pt-1 text-right md:block">
        <span className="font-mono tabular-nums text-[10px] font-semibold tracking-wider text-muted">
          {entry.date}
        </span>
      </div>

      {/* Timeline node */}
      <div className="relative flex shrink-0 flex-col items-center">
        <div
          className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-2"
          style={{ borderColor: catCfg.border, backgroundColor: catCfg.bg }}
        >
          <motion.div
            animate={reducedMotion ? undefined : { scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="h-2 w-2 rounded-full status-pulse"
            style={{ backgroundColor: catCfg.color }}
          />
        </div>
        {/* Connector line */}
        <div className="w-px flex-1 bg-gradient-to-b from-primary/15 via-primary/10 to-transparent" style={{ minHeight: "40px" }} />
      </div>

      {/* Event card */}
      <div
        className="relative flex-1 overflow-hidden rounded-xl border bg-panel/60 p-3.5 transition-all hover:bg-panel md:p-4"
        style={{ borderColor: catCfg.border }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-15 blur-3xl"
          style={{ backgroundColor: catCfg.color }}
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-muted md:hidden">{entry.date}</span>
                <span
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{ color: catCfg.color, backgroundColor: catCfg.bg }}
                >
                  <CatIcon size={10} weight="bold" />
                  {catCfg.label}
                </span>
              </div>
              <h3 className="mt-1.5 font-display text-sm font-bold">{entry.title}</h3>
            </div>
          </div>

          <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{entry.description}</p>

          {entry.quote && (
            <div
              className="mt-2.5 rounded-lg border px-2.5 py-2"
              style={{ borderColor: `${catCfg.color}15`, backgroundColor: `${catCfg.color}06` }}
            >
              <div className="flex items-start gap-1.5">
                <Quotes size={12} weight="bold" className="mt-0.5 shrink-0" style={{ color: `${catCfg.color}80` }} />
                <div>
                  <p className="text-[10px] italic leading-relaxed text-muted">{entry.quote}</p>
                  {entry.quoteAuthor && (
                    <p className="mt-0.5 text-[9px] font-medium" style={{ color: catCfg.color }}>
                      {entry.quoteAuthor}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {relatedHeroNames.length > 0 && (
            <div className="mt-2.5 flex items-center gap-1.5">
              <Users size={10} weight="bold" className="text-muted" />
              <div className="flex flex-wrap gap-1">
                {relatedHeroNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-md border border-primary/10 bg-background/60 px-1.5 py-0.5 text-[9px] font-medium text-muted"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EmptyTimeline() {
  return (
    <div className="station-panel flex flex-col items-center justify-center py-16 text-center">
      <Flashlight size={28} weight="bold" className="text-muted" />
      <p className="mt-3 text-xs text-muted">没有匹配的编年史条目。尝试切换筛选条件。</p>
    </div>
  );
}

export default function ChroniclesPage() {
  const [selectedCategory, setSelectedCategory] = useState<ChronicleEntry["category"] | null>(null);
  const reducedMotion = useReducedMotion();

  const categoryCounts = useMemo(() => {
    const counts: Record<ChronicleEntry["category"], number> = {
      event: 0,
      discovery: 0,
      battle: 0,
      character: 0,
      technology: 0,
    };
    for (const entry of CHRONICLES) {
      counts[entry.category]++;
    }
    return counts;
  }, []);

  const filteredChronicles = useMemo(() => {
    if (!selectedCategory) return CHRONICLES;
    return CHRONICLES.filter((c) => c.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <Layout title="维度编年史">
      <div className="relative mx-auto max-w-5xl px-4 py-8 md:py-12">
        {/* Header */}
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-subtle px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Star size={10} weight="fill" />
            维度档案
          </div>
          <h1 className="mt-3 font-display text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold leading-[0.95] tracking-tight">
            维度编年史
          </h1>
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-muted">
            记录人类最后的史诗 - 从维度裂痕出现到最终战役前夕，跨越所有已知维度的完整编年记录。
          </p>
          <div className="rift-divider mt-4" />
        </motion.div>

        {/* Dimension Overview */}
        <section className="mt-8">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2.5 mb-4"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle">
              <Globe size={16} weight="bold" className="text-primary" />
            </div>
            <h2 className="font-display text-sm font-bold">维度概览</h2>
            <span className="font-mono tabular-nums text-[10px] text-muted">{DIMENSIONS.length} 个已知维度</span>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DIMENSIONS.map((dim, i) => (
              <DimensionCard key={dim.id} dim={dim} index={i} />
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="mt-10">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2.5 mb-4"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-subtle">
              <Clock size={16} weight="bold" className="text-primary" />
            </div>
            <h2 className="font-display text-sm font-bold">时间线</h2>
            <span className="font-mono tabular-nums text-[10px] text-muted">
              {CHRONICLES.length} 条记录 · {CHRONICLES[0]?.date} - {CHRONICLES[CHRONICLES.length - 1]?.date}
            </span>
          </motion.div>

          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            counts={categoryCounts}
          />

          <div className="mt-6">
            {filteredChronicles.length === 0 ? (
              <EmptyTimeline />
            ) : (
              <div className="relative pl-0 md:pl-[90px]">
                {/* Continuous vertical line behind all nodes */}
                <div className="absolute left-[9px] top-0 hidden h-full w-px bg-gradient-to-b from-primary/20 via-primary/10 to-transparent md:block" />

                <div className="space-y-0">
                  {filteredChronicles.map((entry, i) => (
                    <TimelineEvent
                      key={entry.id}
                      entry={entry}
                      index={i}
                      isEven={i % 2 === 0}
                    />
                  ))}
                </div>

                {/* End marker */}
                <motion.div
                  initial={reducedMotion ? undefined : { opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="relative mt-0 flex gap-4 md:gap-6"
                >
                  <div className="hidden w-[90px] shrink-0 md:block" />
                  <div className="flex shrink-0 flex-col items-center">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border border-primary/20 bg-primary-subtle">
                      <Star size={10} weight="fill" className="text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 py-1">
                    <p className="font-mono text-[10px] text-muted">编年史持续更新中...</p>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </section>

        {/* Footer anchor */}
        <div className="rift-divider mt-10" />
        <p className="mt-4 text-center font-mono text-[10px] text-muted">
          多重宇宙 · 梦想家 · 维度档案库 · {CHRONICLES.length} 条编年史记录
        </p>
      </div>
    </Layout>
  );
}