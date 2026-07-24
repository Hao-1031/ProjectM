import { motion, useReducedMotion } from "framer-motion";
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
}

const ENEMY_ENTRIES: EnemyEntry[] = [
  {
    id: "walker",
    name: "步行者",
    role: "基础单位",
    description: "受核污染影响最浅的机械步行者，数量庞大但个体脆弱，是敌潮的主力填充。",
    threat: "低",
    tactic: "成群推进，利用范围武器快速清理。",
  },
  {
    id: "runner",
    name: "疾行者",
    role: "快速骚扰",
    description: "绿色涂装的轻型单位，移动速度快但血量低，擅长突破防线干扰后排。",
    threat: "中",
    tactic: "保持移动，优先用高射速武器点杀。",
  },
  {
    id: "tank",
    name: "重装者",
    role: "肉盾",
    description: "厚重装甲的地面单位，移动缓慢但生命值极高，能吸收大量火力。",
    threat: "中",
    tactic: "使用高穿透或百分比伤害武器集火。",
  },
  {
    id: "spitter",
    name: "酸液喷吐者",
    role: "远程",
    description: "在远距离喷射腐蚀性酸液的单位，对核心和玩家造成持续伤害。",
    threat: "中",
    tactic: "优先清除，避免酸液堆积。",
  },
  {
    id: "drone",
    name: "侦察无人机",
    role: "飞行骚扰",
    description: "小型飞行单位，速度快且难以命中，常伴随精英单位出现。",
    threat: "低",
    tactic: "使用追踪或范围攻击武器应对。",
  },
  {
    id: "sentinel",
    name: "哨兵",
    role: "均衡步兵",
    description: "装备轻型护甲的机械哨兵，攻防均衡，是中期波次的常见敌人。",
    threat: "中",
    tactic: "正常集火即可，注意不要被其吸引火力。",
  },
  {
    id: "crusher",
    name: "碾压者",
    role: "重型突击",
    description: "体型巨大的近战单位，能对核心造成毁灭性打击，需要立刻处理。",
    threat: "高",
    tactic: "使用控制技能减速或冻结，集中爆发输出。",
  },
  {
    id: "sniper",
    name: "狙击者",
    role: "远程精准",
    description: "在远处发射高伤害弹丸的敌人，血量低但威胁巨大。",
    threat: "高",
    tactic: "发现后优先击杀，避免长时间暴露。",
  },
  {
    id: "stalker",
    name: "潜行者",
    role: "高速突袭",
    description: "擅长绕后突袭玩家的高速单位，出现后会在短时间内贴近目标。",
    threat: "高",
    tactic: "保持移动，使用位移或控制技能拉开距离。",
  },
  {
    id: "shielder",
    name: "护盾者",
    role: "防御支援",
    description: "携带能量护盾的敌人，能为自己和周围单位减免伤害。",
    threat: "中",
    tactic: "优先击破护盾，再处理周围单位。",
  },
  {
    id: "harvester",
    name: "收割者",
    role: "资源掠夺",
    description: "专门收集战场能量碎片的敌人，若不及时击杀会强化其他单位。",
    threat: "中",
    tactic: "出现后立即转火，阻止其收集资源。",
  },
  {
    id: "artillery",
    name: "炮兵",
    role: "远程轰炸",
    description: "从远处发射抛物线炮弹的重型单位，对核心区域构成严重威胁。",
    threat: "高",
    tactic: "快速接近或使用远程武器提前击杀。",
  },
  {
    id: "disruptor",
    name: "干扰者",
    role: "控制",
    description: "释放电磁脉冲干扰玩家武器冷却和移动，削弱持续输出能力。",
    threat: "中",
    tactic: "在干扰范围外输出，或迅速击杀。",
  },
  {
    id: "scorcher",
    name: "焚烧者",
    role: "范围燃烧",
    description: "喷射高温火焰的敌人，能造成大范围持续燃烧伤害。",
    threat: "高",
    tactic: "保持安全距离，暮蝶及时治疗燃烧减益。",
  },
  {
    id: "bomber",
    name: "自爆者",
    role: "自杀冲锋",
    description: "接近目标后引爆自身的单位，爆炸会造成高额范围伤害。",
    threat: "高",
    tactic: "在接近前远程击杀，避免被多个同时引爆。",
  },
  {
    id: "leech",
    name: "吸血者",
    role: "生命窃取",
    description: "攻击玩家时恢复自身生命，拖得越久越难处理。",
    threat: "中",
    tactic: "快速爆发击杀，避免消耗战。",
  },
  {
    id: "constructor",
    name: "建造者",
    role: "召唤支援",
    description: "在战场中修复其他机械单位并召唤小型无人机的工程型敌人。",
    threat: "高",
    tactic: "优先击杀，否则会导致敌潮无限再生。",
  },
  {
    id: "raptor",
    name: "猎禽",
    role: "极速猎杀",
    description: "机动性极高的突击单位，会迅速穿越战场直冲玩家。",
    threat: "高",
    tactic: "预判走位，使用范围控制技能限制其移动。",
  },
];

const AFFIX_INFO: Record<string, { name: string; description: string; icon: typeof Lightning }> = {
  shielded: { name: "护盾", description: "获得额外护盾，首次受击时减免伤害", icon: Shield },
  splitting: { name: "分裂", description: "死亡时分裂为多个小型单位", icon: Bug },
  explosive: { name: "易爆", description: "死亡时引发小范围爆炸", icon: Fire },
  swift: { name: "迅捷", description: "移动速度大幅提升", icon: Lightning },
  corrosive: { name: "腐蚀", description: "攻击附带腐蚀效果，降低护甲", icon: Skull },
  regenerating: { name: "再生", description: "持续恢复生命值", icon: Gear },
  freezing: { name: "冰冻", description: "攻击减速目标", icon: Snowflake },
  taunting: { name: "嘲讽", description: "体型增大并吸引火力", icon: Crosshair },
};

const BOSS_ORDER: BossId[] = [
  "overlord",
  "plaguebringer",
  "titan",
  "ravager",
  "siren",
  "colossus",
  "dreadnought",
  "juggernaut",
  "annihilator",
  "hive",
];

const THREAT_COLOR: Record<string, string> = {
  低: "#5e8c6a",
  中: "#c9a34e",
  高: "#b87a3d",
  极高: "#b84a55",
};

function ThreatBadge({ threat }: { threat: string }) {
  const color = THREAT_COLOR[threat] ?? THREAT_COLOR["低"];
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ borderColor: `${color}40`, color: color, backgroundColor: `${color}10` }}
    >
      威胁 {threat}
    </span>
  );
}

export default function EnemiesPage() {
  const reducedMotion = useReducedMotion();
  const enemies = ENEMY_ENTRIES;
  const bosses = BOSS_ORDER.map((id) => ({ id, ...DEFAULT_BALANCE.bosses[id] }));
  const affixes = Object.entries(AFFIX_INFO);

  return (
    <Layout title="威胁图鉴">
      <div className="relative">
        <NuclearBackground />
        <div className="noise-overlay" />
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -right-[10%] top-[8%] h-[50vh] w-[50vh] rounded-full bg-danger/5 blur-[120px]" />
          <div className="absolute -left-[10%] top-[40%] h-[45vh] w-[45vh] rounded-full bg-primary/4 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-4 md:py-6">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 md:mb-5"
          >
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-danger">
              <Skull weight="duotone" size={14} />
              威胁图鉴
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-4xl">识别辐射区敌人</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              核污染催生了大量机械变异体。了解每种敌人的行为模式，是在废土中存活的关键。
            </p>
          </motion.div>

          {/* Enemy grid */}
          <section className="mb-6 md:mb-8">
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="mb-3 flex items-center gap-2"
            >
              <Radioactive size={14} weight="bold" className="text-warning" />
              <h2 className="text-base font-bold tracking-tight">常规敌人</h2>
            </motion.div>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
              {enemies.map((enemy, index) => {
                const stats = DEFAULT_BALANCE.enemies[enemy.id];
                return (
                  <motion.article
                    key={enemy.id}
                    initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: Math.min(index * 0.03, 0.3),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="group relative w-[260px] flex-none snap-start overflow-hidden rounded-2xl border border-border bg-panel p-3 transition-all hover:border-danger/30 hover:bg-panel-raised md:w-[280px]"
                  >
                    <div
                      className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-30 transition-opacity group-hover:opacity-60"
                      style={{ backgroundColor: stats?.color ?? "#6e7870" }}
                    />
                    <div className="relative">
                      <div className="flex items-start justify-between">
                        <div
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: `${stats?.color ?? "#6e7870"}18`,
                            color: stats?.color ?? "#6e7870",
                          }}
                        >
                          <Skull size={18} weight="bold" />
                        </div>
                        <ThreatBadge threat={enemy.threat} />
                      </div>
                      <h3 className="mt-2 text-base font-bold tracking-tight">{enemy.name}</h3>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-muted">
                        {enemy.role}
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted">{enemy.description}</p>
                      <div className="mt-2 flex items-start gap-2 rounded-lg border border-border bg-panel-raised p-2">
                        <CaretRight size={12} className="mt-0.5 shrink-0 text-primary" />
                        <p className="text-[11px] leading-relaxed text-muted">{enemy.tactic}</p>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px] text-muted">
                        <div className="rounded-md border border-border bg-background/50 py-1">
                          <p className="font-mono font-bold text-foreground">
                            {stats?.speed ?? "-"}
                          </p>
                          <p>移速</p>
                        </div>
                        <div className="rounded-md border border-border bg-background/50 py-1">
                          <p className="font-mono font-bold text-foreground">
                            {stats?.damage ?? "-"}
                          </p>
                          <p>伤害</p>
                        </div>
                        <div className="rounded-md border border-border bg-background/50 py-1">
                          <p className="font-mono font-bold text-foreground">
                            {stats?.radius ?? "-"}
                          </p>
                          <p>半径</p>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </section>

          {/* Affixes */}
          <section className="mb-6 md:mb-8">
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="mb-3 flex items-center gap-2"
            >
              <Warning size={14} weight="bold" className="text-danger" />
              <h2 className="text-base font-bold tracking-tight">精英词缀</h2>
            </motion.div>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
              {affixes.map(([id, info], index) => {
                const Icon = info.icon;
                return (
                  <motion.div
                    key={id}
                    initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3) }}
                    className="w-[200px] flex-none snap-start rounded-2xl border border-border bg-panel p-3 transition-colors hover:border-danger/20 md:w-[220px]"
                  >
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-danger/10 text-danger">
                      <Icon size={16} weight="bold" />
                    </div>
                    <h3 className="mt-2 text-sm font-bold">{info.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{info.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Bosses */}
          <section>
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="mb-3 flex items-center gap-2"
            >
              <Crown size={14} weight="bold" className="text-danger" />
              <h2 className="text-base font-bold tracking-tight">首领单位</h2>
            </motion.div>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
              {bosses.map((boss, index) => (
                <motion.article
                  key={boss.id}
                  initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: Math.min(index * 0.03, 0.3),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="group relative w-[300px] flex-none snap-start overflow-hidden rounded-2xl border border-border bg-panel p-3 transition-all hover:border-danger/30 md:w-[340px]"
                >
                  <div
                    className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40"
                    style={{ backgroundColor: boss.color }}
                  />
                  <div
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ backgroundColor: boss.color }}
                  />
                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold tracking-tight">{boss.name}</h3>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-muted">
                          首领
                        </p>
                      </div>
                      <div
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${boss.color}18`, color: boss.color }}
                      >
                        <Crown size={16} weight="bold" />
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted">{boss.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {boss.phases.map((phase, phaseIndex) => (
                        <span
                          key={phaseIndex}
                          className="rounded-full border border-border bg-panel-raised px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted"
                        >
                          阶段 {phaseIndex + 1}: {phase.name}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px] text-muted">
                      <div className="rounded-md border border-border bg-background/50 py-1">
                        <p className="font-mono font-bold text-foreground">
                          {boss.health.toLocaleString()}
                        </p>
                        <p>生命</p>
                      </div>
                      <div className="rounded-md border border-border bg-background/50 py-1">
                        <p className="font-mono font-bold text-foreground">{boss.damage}</p>
                        <p>伤害</p>
                      </div>
                      <div className="rounded-md border border-border bg-background/50 py-1">
                        <p className="font-mono font-bold text-foreground">{boss.speed}</p>
                        <p>移速</p>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
