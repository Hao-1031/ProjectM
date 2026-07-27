"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Skull,
  Crown,
  CaretRight,
  Radioactive,
  Warning,
  Shield,
  Crosshair,
  Lightning,
  Fire,
  Snowflake,
  Bug,
  Gear,
  Heartbeat,
  Gauge,
  Sword,
  ArrowUp,
  Target,
  Sparkle,
  ArrowsOut,
  PersonSimpleRun,
  Eye,
  Rocket,
  Drone,
  Robot,
  Barbell,
  Binoculars,
  Atom,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import { DEFAULT_BALANCE } from "@/lib/game/balance";
import NuclearBackground from "@/components/effects/NuclearBackground";
import type { EnemyVariant, BossId } from "@/lib/game/types";

interface EnemyEntry {
  id: EnemyVariant | "base";
  name: string;
  role: string;
  description: string;
  threat: "低" | "中" | "高" | "极高";
  tactic: string;
  category: string;
}

const ENEMY_CATEGORIES: { id: string; label: string; icon: typeof Skull }[] = [
  { id: "all", label: "全部", icon: Sparkle },
  { id: "basic", label: "基础", icon: Robot },
  { id: "fast", label: "快速", icon: PersonSimpleRun },
  { id: "heavy", label: "重型", icon: Barbell },
  { id: "ranged", label: "远程", icon: Binoculars },
  { id: "flying", label: "飞行", icon: Drone },
  { id: "special", label: "特殊", icon: Atom },
];

const ENEMY_ENTRIES: EnemyEntry[] = [
  { id: "walker", name: "步行者", role: "基础单位", description: "受核污染影响最浅的机械步行者，数量庞大但个体脆弱，是敌潮的主力填充。", threat: "低", tactic: "成群推进，利用范围武器快速清理。", category: "basic" },
  { id: "sentinel", name: "哨兵", role: "均衡步兵", description: "装备轻型护甲的机械哨兵，攻防均衡，是中期波次的常见敌人。", threat: "中", tactic: "正常集火即可，注意不要被其吸引火力。", category: "basic" },
  { id: "runner", name: "疾行者", role: "快速骚扰", description: "绿色涂装的轻型单位，移动速度快但血量低，擅长突破防线干扰后排。", threat: "中", tactic: "保持移动，优先用高射速武器点杀。", category: "fast" },
  { id: "raptor", name: "猎禽", role: "极速猎杀", description: "机动性极高的突击单位，会迅速穿越战场直冲玩家。", threat: "高", tactic: "预判走位，使用范围控制技能限制其移动。", category: "fast" },
  { id: "stalker", name: "潜行者", role: "高速突袭", description: "擅长绕后突袭玩家的高速单位，出现后会在短时间内贴近目标。", threat: "高", tactic: "保持移动，使用位移或控制技能拉开距离。", category: "fast" },
  { id: "tank", name: "重装者", role: "肉盾", description: "厚重装甲的地面单位，移动缓慢但生命值极高，能吸收大量火力。", threat: "中", tactic: "使用高穿透或百分比伤害武器集火。", category: "heavy" },
  { id: "crusher", name: "碾压者", role: "重型突击", description: "体型巨大的近战单位，能对核心造成毁灭性打击，需要立刻处理。", threat: "高", tactic: "使用控制技能减速或冻结，集中爆发输出。", category: "heavy" },
  { id: "spitter", name: "酸液喷吐者", role: "远程", description: "在远距离喷射腐蚀性酸液的单位，对核心和玩家造成持续伤害。", threat: "中", tactic: "优先清除，避免酸液堆积。", category: "ranged" },
  { id: "sniper", name: "狙击者", role: "远程精准", description: "在远处发射高伤害弹丸的敌人，血量低但威胁巨大。", threat: "高", tactic: "发现后优先击杀，避免长时间暴露。", category: "ranged" },
  { id: "artillery", name: "炮兵", role: "远程轰炸", description: "从远处发射抛物线炮弹的重型单位，对核心区域构成严重威胁。", threat: "高", tactic: "快速接近或使用远程武器提前击杀。", category: "ranged" },
  { id: "drone", name: "侦察无人机", role: "飞行骚扰", description: "小型飞行单位，速度快且难以命中，常伴随精英单位出现。", threat: "低", tactic: "使用追踪或范围攻击武器应对。", category: "flying" },
  { id: "shielder", name: "护盾者", role: "防御支援", description: "携带能量护盾的敌人，能为自己和周围单位减免伤害。", threat: "中", tactic: "优先击破护盾，再处理周围单位。", category: "special" },
  { id: "harvester", name: "收割者", role: "资源掠夺", description: "专门收集战场能量碎片的敌人，若不及时击杀会强化其他单位。", threat: "中", tactic: "出现后立即转火，阻止其收集资源。", category: "special" },
  { id: "disruptor", name: "干扰者", role: "控制", description: "释放电磁脉冲干扰玩家武器冷却和移动，削弱持续输出能力。", threat: "中", tactic: "在干扰范围外输出，或迅速击杀。", category: "special" },
  { id: "scorcher", name: "焚烧者", role: "范围燃烧", description: "喷射高温火焰的敌人，能造成大范围持续燃烧伤害。", threat: "高", tactic: "保持安全距离，暮蝶及时治疗燃烧减益。", category: "special" },
  { id: "bomber", name: "自爆者", role: "自杀冲锋", description: "接近目标后引爆自身的单位，爆炸会造成高额范围伤害。", threat: "高", tactic: "在接近前远程击杀，避免被多个同时引爆。", category: "special" },
  { id: "leech", name: "吸血者", role: "生命窃取", description: "攻击玩家时恢复自身生命，拖得越久越难处理。", threat: "中", tactic: "快速爆发击杀，避免消耗战。", category: "special" },
  { id: "constructor", name: "建造者", role: "召唤支援", description: "在战场中修复其他机械单位并召唤小型无人机的工程型敌人。", threat: "高", tactic: "优先击杀，否则会导致敌潮无限再生。", category: "special" },
];

const AFFIX_INFO: Record<string, { name: string; description: string; icon: typeof Lightning; threat: string }> = {
  shielded: { name: "护盾", description: "获得额外护盾，首次受击时减免伤害", icon: Shield, threat: "中" },
  splitting: { name: "分裂", description: "死亡时分裂为多个小型单位", icon: Bug, threat: "高" },
  explosive: { name: "易爆", description: "死亡时引发小范围爆炸", icon: Fire, threat: "中" },
  swift: { name: "迅捷", description: "移动速度大幅提升", icon: Lightning, threat: "高" },
  corrosive: { name: "腐蚀", description: "攻击附带腐蚀效果，降低护甲", icon: Skull, threat: "中" },
  regenerating: { name: "再生", description: "持续恢复生命值", icon: Gear, threat: "高" },
  freezing: { name: "冰冻", description: "攻击减速目标", icon: Snowflake, threat: "中" },
  taunting: { name: "嘲讽", description: "体型增大并吸引火力", icon: Crosshair, threat: "低" },
};

const BOSS_ORDER: BossId[] = [
  "overlord", "plaguebringer", "titan", "ravager", "siren",
  "colossus", "dreadnought", "juggernaut", "annihilator", "hive",
];

const THREAT_COLOR: Record<string, string> = {
  低: "#5e8c6a", 中: "#c9a34e", 高: "#b87a3d", 极高: "#b84a55",
};

const ENEMY_IMAGES: Record<string, string> = {
  walker: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20close-up%20of%20a%20mechanical%20walker%20robot%2C%20rusted%20metal%2C%20orange%20glowing%20eyes%2C%20post-apocalyptic%20wasteland%2C%20dark%20atmosphere%2C%20low%20saturation%2C%20industrial%20design%2C%20no%20text&image_size=landscape_16_9",
  crusher: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20close-up%20of%20a%20giant%20mechanical%20crusher%20robot%2C%20massive%20arms%2C%20green%20toxic%20glow%2C%20destroyed%20city%2C%20dark%20atmosphere%2C%20low%20saturation%2C%20no%20text&image_size=landscape_16_9",
  sniper: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20close-up%20of%20a%20robotic%20sniper%20unit%2C%20long%20barrel%2C%20red%20laser%20sight%2C%20dark%20industrial%20background%2C%20low%20saturation%2C%20menacing%20design%2C%20no%20text&image_size=landscape_16_9",
  shielder: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20close-up%20of%20a%20mechanical%20shield%20robot%2C%20energy%20barrier%2C%20purple%20glow%2C%20defensive%20stance%2C%20dark%20industrial%2C%20low%20saturation%2C%20no%20text&image_size=landscape_16_9",
  overlord: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20portrait%20of%20a%20massive%20mechanical%20overlord%20boss%2C%20red%20glowing%20core%2C%20multiple%20weapons%2C%20dark%20stormy%20sky%2C%20apocalyptic%2C%20low%20saturation%2C%20no%20text&image_size=landscape_16_9",
  titan: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20portrait%20of%20a%20colossal%20mechanical%20titan%20boss%2C%20golden%20amber%20energy%2C%20gigantic%20size%2C%20destroyed%20cityscape%2C%20dark%20atmosphere%2C%20low%20saturation%2C%20no%20text&image_size=landscape_16_9",
};

function ThreatBadge({ threat }: { threat: string }) {
  const color = THREAT_COLOR[threat] ?? THREAT_COLOR["低"];
  return (
    <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ borderColor: `${color}40`, color, backgroundColor: `${color}10` }}>
      威胁 {threat}
    </span>
  );
}

function StatMini({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Shield; color: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background/50 px-2 py-1.5">
      <Icon size={12} weight="bold" style={{ color }} />
      <div><p className="text-[9px] uppercase tracking-wider text-muted">{label}</p><p className="text-[11px] font-bold tabular-nums">{value}</p></div>
    </div>
  );
}

export default function EnemiesPage() {
  const reducedMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSection, setActiveSection] = useState<"enemies" | "bosses" | "affixes">("enemies");

  const filteredEnemies = useMemo(() => {
    if (activeCategory === "all") return ENEMY_ENTRIES;
    return ENEMY_ENTRIES.filter((e) => e.category === activeCategory);
  }, [activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ENEMY_ENTRIES.length };
    for (const e of ENEMY_ENTRIES) {
      counts[e.category] = (counts[e.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  const bosses = BOSS_ORDER.map((id) => ({ id, ...DEFAULT_BALANCE.bosses[id] }));
  const affixes = Object.entries(AFFIX_INFO);
  const largeEnemyIds = new Set(["walker", "crusher", "sniper", "shielder"]);
  const largeBossIds = new Set(["overlord", "titan"]);

  return (
    <Layout title="威胁图鉴">
      <div className="relative min-h-[100dvh]">
        <NuclearBackground />
        <div className="noise-overlay" />
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -right-[10%] top-[8%] h-[50vh] w-[50vh] rounded-full bg-danger/5 blur-[120px]" />
          <div className="absolute -left-[10%] top-[40%] h-[45vh] w-[45vh] rounded-full bg-primary/4 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-3 md:py-6">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 md:mb-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-danger">
                  <Skull weight="duotone" size={14} />威胁图鉴
                </span>
                <h1 className="mt-2 text-[clamp(1.5rem,4vw,2.5rem)] font-bold leading-[0.95] tracking-tight">
                  识别<br /><span className="text-gradient">辐射区敌人</span>
                </h1>
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">
                  核污染催生了大量机械变异体。了解每种敌人的行为模式，是在废土中存活的关键。
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-4 flex gap-1 overflow-x-auto pb-1"
            role="tablist"
          >
            {[
              { id: "enemies" as const, label: "常规敌人", icon: Radioactive },
              { id: "bosses" as const, label: "首领单位", icon: Crown },
              { id: "affixes" as const, label: "精英词缀", icon: Warning },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeSection === tab.id;
              return (
                <button key={tab.id} type="button" role="tab" aria-selected={active}
                  onClick={() => setActiveSection(tab.id)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold transition-all focus-ring active:scale-95 ${active ? "border-danger bg-danger/10 text-danger" : "border-border bg-panel text-muted hover:border-muted/60 hover:text-foreground"}`}>
                  <Icon size={14} weight={active ? "bold" : "regular"} />{tab.label}
                </button>
              );
            })}
          </motion.div>

          <AnimatePresence mode="wait">
            {activeSection === "enemies" && (
              <motion.div key="enemies" initial={reducedMotion ? undefined : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
                <motion.div
                  initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.05 }}
                  className="mb-3 flex gap-1 overflow-x-auto pb-1"
                  role="tablist"
                >
                  {ENEMY_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const active = activeCategory === cat.id;
                    const count = categoryCounts[cat.id] ?? 0;
                    return (
                      <button key={cat.id} type="button" role="tab" aria-selected={active}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all focus-ring active:scale-95 ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-panel text-muted hover:border-muted/60 hover:text-foreground"}`}>
                        <Icon size={13} weight={active ? "bold" : "regular"} />
                        {cat.label}
                        <span className="ml-0.5 rounded-md bg-border/50 px-1 py-0.5 text-[10px] font-mono">{count}</span>
                      </button>
                    );
                  })}
                </motion.div>

                <div className="grid gap-3 md:grid-cols-12 md:grid-flow-dense">
                  {filteredEnemies.map((enemy, index) => {
                    const stats = DEFAULT_BALANCE.enemies[enemy.id];
                    const isLarge = largeEnemyIds.has(enemy.id);
                    const threatColor = THREAT_COLOR[enemy.threat];
                    return (
                      <motion.article key={enemy.id}
                        initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
                        className={`group relative overflow-hidden rounded-3xl border border-border bg-panel transition-all hover:border-danger/30 hover:bg-panel-raised ${isLarge ? "md:col-span-7" : "md:col-span-5"}`}>
                        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-45" style={{ backgroundColor: stats?.color ?? "#6e7870" }} />
                        <div className="relative p-2.5 md:p-3">
                          {isLarge && ENEMY_IMAGES[enemy.id] && (
                            <div className="relative mb-3 overflow-hidden rounded-2xl">
                              <img src={ENEMY_IMAGES[enemy.id]} alt={enemy.name} className="h-40 w-full object-cover md:h-48" />
                              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-panel via-panel/30 to-transparent" />
                              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold tracking-tight md:text-2xl">{enemy.name}</h2>
                                    <ThreatBadge threat={enemy.threat} />
                                  </div>
                                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{enemy.role}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          {(!isLarge || !ENEMY_IMAGES[enemy.id]) && (
                            <div className="flex items-center gap-3 mb-2">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${stats?.color ?? "#6e7870"}18`, color: stats?.color ?? "#6e7870" }}>
                                <Skull size={22} weight="duotone" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h2 className="text-base font-bold tracking-tight">{enemy.name}</h2>
                                  <ThreatBadge threat={enemy.threat} />
                                </div>
                                <p className="text-[11px] leading-relaxed text-muted mt-0.5">{enemy.role}</p>
                              </div>
                            </div>
                          )}
                          <p className="text-[11px] leading-relaxed text-muted">{enemy.description}</p>

                          <div className="mt-1.5 flex items-start gap-2 rounded-lg border border-border bg-panel-raised p-1.5">
                            <CaretRight size={11} className="mt-0.5 shrink-0 text-primary" />
                            <p className="text-[10px] leading-relaxed text-muted">{enemy.tactic}</p>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <StatMini label="生命" value={stats?.healthMul ? `×${stats.healthMul}` : "-"} icon={Heartbeat} color={stats?.color ?? "#6e7870"} />
                            <StatMini label="伤害" value={stats?.damage?.toString() ?? "-"} icon={Sword} color={threatColor} />
                            <StatMini label="移速" value={stats?.speed?.toString() ?? "-"} icon={Gauge} color={stats?.color ?? "#6e7870"} />
                            <StatMini label="半径" value={stats?.radius?.toString() ?? "-"} icon={ArrowsOut} color={stats?.color ?? "#6e7870"} />
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeSection === "bosses" && (
              <motion.div key="bosses" initial={reducedMotion ? undefined : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
                <div className="grid gap-3 md:grid-cols-12 md:grid-flow-dense">
                  {bosses.map((boss, index) => {
                    const isLarge = largeBossIds.has(boss.id);
                    return (
                      <motion.article key={boss.id}
                        initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
                        className={`group relative overflow-hidden rounded-3xl border border-border bg-panel transition-all hover:border-danger/30 hover:bg-panel-raised ${isLarge ? "md:col-span-7" : "md:col-span-5"}`}>
                        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40" style={{ backgroundColor: boss.color }} />
                        <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: boss.color }} />
                        <div className="relative p-2.5 md:p-3">
                          {isLarge && ENEMY_IMAGES[boss.id] && (
                            <div className="relative mb-3 overflow-hidden rounded-2xl">
                              <img src={ENEMY_IMAGES[boss.id]} alt={boss.name} className="h-40 w-full object-cover md:h-48" />
                              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-panel via-panel/30 to-transparent" />
                              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold tracking-tight md:text-2xl">{boss.name}</h2>
                                    <ThreatBadge threat="极高" />
                                  </div>
                                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">首领</p>
                                </div>
                              </div>
                            </div>
                          )}
                          {(!isLarge || !ENEMY_IMAGES[boss.id]) && (
                            <div className="flex items-center gap-3 mb-2">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${boss.color}18`, color: boss.color }}>
                                <Crown size={22} weight="duotone" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h2 className="text-base font-bold tracking-tight">{boss.name}</h2>
                                  <ThreatBadge threat="极高" />
                                </div>
                                <p className="text-[11px] leading-relaxed text-muted mt-0.5">首领</p>
                              </div>
                            </div>
                          )}
                          <p className="text-[11px] leading-relaxed text-muted">{boss.description}</p>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <StatMini label="生命" value={boss.health.toLocaleString()} icon={Heartbeat} color={boss.color} />
                            <StatMini label="伤害" value={boss.damage.toString()} icon={Sword} color="#b84a55" />
                            <StatMini label="移速" value={boss.speed.toString()} icon={Gauge} color={boss.color} />
                          </div>

                          <div className="mt-2 border-t border-border pt-1.5">
                            <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                              <ArrowUp size={10} />首领阶段
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {boss.phases.map((phase, phaseIndex) => (
                                <div key={phaseIndex} className="flex items-center gap-1.5 rounded-lg border border-border bg-panel-raised px-2 py-1.5 transition-colors hover:border-danger/20">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: `${boss.color}20`, color: boss.color }}>
                                    {phaseIndex + 1}
                                  </span>
                                  <span className="text-[10px] font-semibold text-foreground">{phase.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeSection === "affixes" && (
              <motion.div key="affixes" initial={reducedMotion ? undefined : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
                <div className="grid gap-3 md:grid-cols-12 md:grid-flow-dense">
                  {affixes.map(([id, info], index) => {
                    const Icon = info.icon;
                    const threatColor = THREAT_COLOR[info.threat] ?? THREAT_COLOR["中"];
                    const isLarge = index === 0 || index === 4;
                    return (
                      <motion.div key={id}
                        initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.35), ease: [0.22, 1, 0.36, 1] }}
                        className={`group relative overflow-hidden rounded-3xl border border-border bg-panel p-2.5 transition-all hover:border-danger/30 hover:bg-panel-raised ${isLarge ? "md:col-span-7" : "md:col-span-5"}`}>
                        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40" style={{ backgroundColor: threatColor }} />
                        <div className="relative">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${threatColor}18`, color: threatColor }}>
                                <Icon size={22} weight="bold" />
                              </span>
                              <div>
                                <h3 className="text-base font-bold tracking-tight">{info.name}</h3>
                                <p className="text-[11px] leading-relaxed text-muted mt-0.5">{info.description}</p>
                              </div>
                            </div>
                            <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                              style={{ borderColor: `${threatColor}40`, color: threatColor, backgroundColor: `${threatColor}10` }}>
                              威胁 {info.threat}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}