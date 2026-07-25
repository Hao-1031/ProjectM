import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Robot,
  Shield,
  Users,
  MapTrifold,
  Sparkle,
  Coin,
  Gift,
  WaveSine,
  WifiHigh,
  Play,
  ArrowRight,
  BracketsCurly,
  CheckCircle,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import Button from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
  ALGORITHM_REGISTRY,
  adjustDefenseWave,
  combineRisk,
  buildBalancedSquad,
  analyzeMapBalance,
  rankContent,
  adjustDropRates,
  recommendRewards,
  optimizeSpawns,
  evaluateNetwork,
  predictEntityState,
  type AlgorithmId,
} from "@/lib/algorithms";

const ICONS: Record<AlgorithmId, typeof Robot> = {
  dda: Robot,
  ace: Shield,
  matchmaking: Users,
  "map-balance": MapTrifold,
  "content-recommendation": Sparkle,
  "economy-balance": Coin,
  "reward-recommendation": Gift,
  "spawn-optimizer": WaveSine,
  "network-prediction": WifiHigh,
};

const DEMO_RUNNERS: Record<
  AlgorithmId,
  { label: string; run: () => unknown }
> = {
  dda: {
    label: "模拟波次调整",
    run: () =>
      adjustDefenseWave(
        { index: 3, enemyCount: 24, eliteCount: 3 },
        {
          players: [
            {
              historicalWinRate: 0.72,
              averageDps: 210,
              accuracy: 0.86,
              averageDeathsPerRun: 1.2,
              totalRuns: 80,
            },
            {
              historicalWinRate: 0.34,
              averageDps: 75,
              accuracy: 0.52,
              averageDeathsPerRun: 3.8,
              totalRuns: 12,
            },
          ],
          averageLatencyMs: 65,
        }
      ),
  },
  ace: {
    label: "模拟风险判定",
    run: () =>
      combineRisk(
        {
          averageReactionTimeMs: 65,
          aimConsistencyScore: 0.985,
          microCorrectionCountPerMinute: 130,
          memoryChecksumMismatch: true,
          debuggedProcessCount: 2,
          unknownModuleCount: 4,
          framesPerSecond: 60,
        },
        [
          { type: "damage", value: 3200, expectedMax: 800, timestamp: 0 },
          { type: "movement", value: 95, expectedMax: 42, timestamp: 1 },
        ]
      ),
  },
  matchmaking: {
    label: "模拟组队",
    run: () =>
      buildBalancedSquad(
        [
          { id: "p1", skillScore: 0.9, latencyMs: 45, preferredRole: "tank" },
          { id: "p2", skillScore: 0.75, latencyMs: 60, preferredRole: "dps" },
          { id: "p3", skillScore: 0.6, latencyMs: 80, preferredRole: "support" },
          { id: "p4", skillScore: 0.85, latencyMs: 55, preferredRole: "dps" },
          { id: "p5", skillScore: 0.5, latencyMs: 320 },
        ],
        { maxSize: 4 }
      ),
  },
  "map-balance": {
    label: "模拟审计",
    run: () =>
      analyzeMapBalance([
        { variantId: "工业区-西侧据点", matches: 240, wins: 118, avgDurationSec: 620 },
        { variantId: "工业区-东侧据点", matches: 210, wins: 168, avgDurationSec: 510 },
        { variantId: "工业区-中央高地", matches: 28, wins: 11, avgDurationSec: 700 },
      ]),
  },
  "content-recommendation": {
    label: "模拟推荐",
    run: () =>
      rankContent(
        [
          {
            id: "c1",
            title: "据点防守狙击点位",
            tags: ["sniper", "defense"],
            createdAt: Date.now() - 3600000,
            likes: 12,
            views: 180,
          },
          {
            id: "c2",
            title: "新人通关指南",
            tags: ["guide"],
            createdAt: Date.now() - 86400000 * 2,
            likes: 86,
            views: 1200,
          },
          {
            id: "c3",
            title: "新皮肤：辐射涂装",
            tags: ["cosmetic"],
            createdAt: Date.now() - 1800000,
            likes: 0,
            views: 12,
          },
        ],
        [
          { tag: "sniper", weight: 0.85 },
          { tag: "defense", weight: 0.5 },
        ]
      ),
  },
  "economy-balance": {
    label: "模拟掉落调整",
    run: () =>
      adjustDropRates(
        [
          { id: "common", baseWeight: 50, value: 5 },
          { id: "rare", baseWeight: 15, value: 50 },
          { id: "legendary", baseWeight: 2, value: 200 },
        ],
        {
          playerPlaytimeMinutes: 60,
          playerRecentDrops: ["common", "common", "common", "common", "common", "common", "common", "common", "common", "common"],
          globalDropCounts: { common: 1200, rare: 180, legendary: 12 },
        },
        { targetValuePerHour: 150 }
      ),
  },
  "reward-recommendation": {
    label: "模拟奖励推荐",
    run: () =>
      recommendRewards(
        [
          { id: "w1", name: "散射脉冲", type: "weapon", tags: ["area", "multishot"], rarity: "rare" },
          { id: "p1", name: "纳米再生", type: "passive", tags: ["regen"], rarity: "epic" },
          { id: "w2", name: "穿甲磁轨", type: "weapon", tags: ["pierce", "bossDamage"], rarity: "legendary" },
          { id: "p2", name: "动能护盾", type: "passive", tags: ["shield"], rarity: "common" },
        ],
        { weapons: ["plasma"], passives: ["speed"], heroId: "nitrogen", healthPercent: 0.3 },
        { variants: ["tank", "elite"], eliteRatio: 0.35, bossPresent: true }
      ),
  },
  "spawn-optimizer": {
    label: "模拟刷怪调度",
    run: () =>
      optimizeSpawns(
        [
          { variant: "walker", baseWeight: 40, baseIntervalSec: 1.2 },
          { variant: "runner", baseWeight: 20, baseIntervalSec: 1.5 },
          { variant: "tank", baseWeight: 10, baseIntervalSec: 3 },
          { variant: "spitter", baseWeight: 12, baseIntervalSec: 2.5 },
          { variant: "elite", baseWeight: 6, baseIntervalSec: 5 },
          { variant: "boss", baseWeight: 1, baseIntervalSec: 12 },
        ],
        {
          playerHealthPercent: 0.35,
          coreHealthPercent: 0.6,
          activeEnemyCount: 42,
          maxEnemyCount: 60,
          elapsedWaveSec: 45,
          waveDurationSec: 120,
          recentDamageTaken: 180,
        }
      ),
  },
  "network-prediction": {
    label: "模拟网络补偿",
    run: () => {
      const snapshot = {
        latencyMs: 145,
        jitterMs: 22,
        packetLossPercent: 1.2,
        serverTime: 1000,
        clientTime: 1150,
      };
      return {
        network: evaluateNetwork(snapshot),
        predicted: predictEntityState(
          { x: 120, y: 80, vx: 240, vy: -60, timestamp: 950 },
          snapshot
        ),
      };
    },
  },
};

export default function AlgorithmsPage() {
  const [active, setActive] = useState<AlgorithmId>("dda");
  const [result, setResult] = useState<unknown | null>(null);
  const [running, setRunning] = useState(false);
  const reducedMotion = useReducedMotion();

  function handleRun(id: AlgorithmId) {
    setRunning(true);
    try {
      const output = DEMO_RUNNERS[id].run();
      setResult(output);
    } finally {
      setRunning(false);
    }
  }

  const activeMeta = ALGORITHM_REGISTRY.find((a) => a.id === active)!;
  const ActiveIcon = ICONS[active];

  return (
    <Layout title="算法实验室">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <SectionHeader
          eyebrow="Project M L3V100"
          title="独家算法公开实验室"
          subtitle="所有核心算法逻辑、输入输出与实时演示均在此公开。我们信奉可验证、可审计、可迭代的数据驱动设计。"
          align="left"
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-4"
          >
            <div className="rounded-2xl border border-border bg-panel p-3">
              <Tabs value={active} onValueChange={(v) => setActive(v as AlgorithmId)}>
                <TabsList className="mb-3 w-full flex-col items-stretch md:flex-row">
                  {ALGORITHM_REGISTRY.map((algo) => {
                    const Icon = ICONS[algo.id];
                    return (
                      <TabsTrigger
                        key={algo.id}
                        value={algo.id}
                        className="justify-start gap-2 text-left md:justify-center"
                      >
                        <Icon size={14} weight="bold" />
                        <span className="truncate">{algo.name}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {ALGORITHM_REGISTRY.map((algo) => (
                  <TabsContent key={algo.id} value={algo.id}>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          {(() => {
                            const Icon = ICONS[algo.id];
                            return <Icon size={20} weight="bold" />;
                          })()}
                        </span>
                        <div>
                          <h3 className="font-bold">{algo.name}</h3>
                          <p className="text-xs text-muted">{algo.tagline}</p>
                        </div>
                      </div>

                      <p className="text-sm leading-relaxed text-foreground/90">
                        {algo.description}
                      </p>

                      <div className="grid gap-2 text-xs">
                        <div className="rounded-xl border border-border bg-background/50 p-2.5">
                          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">输入</p>
                          <p className="mt-1 text-foreground">{algo.inputs.join(" · ")}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-background/50 p-2.5">
                          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">输出</p>
                          <p className="mt-1 text-foreground">{algo.outputs.join(" · ")}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {algo.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <Button
                        loading={running && active === algo.id}
                        leftIcon={<Play size={16} weight="fill" />}
                        onClick={() => handleRun(algo.id)}
                        className="w-full"
                      >
                        {DEMO_RUNNERS[algo.id].label}
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </motion.div>

          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-8"
          >
            <div className="relative h-full min-h-[420px] overflow-hidden rounded-2xl border border-border bg-panel p-4 md:p-6">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary/50" />

              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BracketsCurly size={18} className="text-primary" weight="bold" />
                  <h3 className="font-mono text-xs uppercase tracking-widest text-muted">实时输出</h3>
                </div>
                {result !== null && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                    <CheckCircle size={10} weight="fill" />
                    运行完成
                  </span>
                )}
              </div>

              {result !== null ? (
                <motion.div
                  initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={active}
                  className="overflow-x-auto rounded-xl border border-border bg-background/60 p-3"
                >
                  <pre className="text-xs leading-relaxed text-foreground md:text-sm">
                    <code>{JSON.stringify(result, null, 2)}</code>
                  </pre>
                </motion.div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/40 text-center">
                  <ActiveIcon size={40} className="text-muted/40" weight="bold" />
                  <p className="text-sm text-muted">点击左侧「{DEMO_RUNNERS[active].label}」查看 {activeMeta.name} 的实时输出</p>
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  label="算法数量"
                  value={ALGORITHM_REGISTRY.length}
                  sub="已公开"
                  variant="primary"
                />
                <StatCard
                  label="核心目标"
                  value="55%"
                  sub="DDA 目标通关率"
                  variant="accent"
                />
                <StatCard
                  label="验证方式"
                  value="双向"
                  sub="ACE 客户端 + 服务端"
                  variant="success"
                />
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-8 rounded-2xl border border-border bg-panel p-4 md:p-6"
        >
          <h3 className="text-lg font-bold">实验平台接入</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            所有算法均已封装为纯函数，可直接在游戏逻辑、后台服务或 API 中调用。
            你也可以通过 <code className="rounded bg-background px-1 py-0.5 text-primary">POST /api/algorithms/run</code> 在线运行任意算法。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <code className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground">
              algorithm: &quot;dda&quot; | &quot;ace&quot; | &quot;matchmaking&quot; ...
            </code>
            <code className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground">
              input: object
            </code>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
