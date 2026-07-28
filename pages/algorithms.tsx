import { useState, useCallback } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
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
  Crosshair,
  Target,
  Play,
  BracketsCurly,
  CheckCircle,
  CaretDown,
  CaretUp,
  Brain,
  Eye,
  Gauge,
  Atom,
  Globe,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import StatCard from "@/components/StatCard";
import Button from "@/components/ui/Button";
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
  calculateEnemyMovement,
  calculateBotAI,
  calculateProgressionCurve,
  findPath,
  assignTeamRoles,
  coordinateTargets,
  generateAdaptiveSpawnCurve,
  type AlgorithmId,
} from "@/lib/algorithms";
import { VERSION_DISPLAY } from "@/lib/version";

const ENGINE_GROUPS = {
  alpha: {
    id: "alpha",
    name: "α 玩家引擎",
    icon: Brain,
    description: "适配玩家能力 · 优化成长体验 · 守护公平竞技",
    color: "var(--primary)",
    bgColor: "var(--primary)",
    algorithmIds: ["dda", "ace", "matchmaking", "content-recommendation", "economy-balance", "reward-recommendation", "progression"] as AlgorithmId[],
  },
  beta: {
    id: "beta",
    name: "β 敌对引擎",
    icon: Eye,
    description: "动态敌潮调度 · 智能走位决策 · 战术行为模拟",
    color: "var(--entropy)",
    bgColor: "var(--entropy)",
    algorithmIds: ["spawn-optimizer", "enemy-movement", "bot-ai", "pathfinding", "team-coordination", "adaptive-spawn"] as AlgorithmId[],
  },
  gamma: {
    id: "gamma",
    name: "γ 基础设施",
    icon: Atom,
    description: "地图平衡审计 · 网络预测补偿 · 系统稳定性",
    color: "var(--quantum)",
    bgColor: "var(--quantum)",
    algorithmIds: ["map-balance", "network-prediction"] as AlgorithmId[],
  },
} as const;

const ENGINE_ICONS: Record<AlgorithmId, typeof Robot> = {
  dda: Robot,
  ace: Shield,
  matchmaking: Users,
  "map-balance": MapTrifold,
  "content-recommendation": Sparkle,
  "economy-balance": Coin,
  "reward-recommendation": Gift,
  "spawn-optimizer": WaveSine,
  "network-prediction": WifiHigh,
  "enemy-movement": Crosshair,
  "bot-ai": Target,
  progression: Gauge,
  pathfinding: Globe,
  "team-coordination": Users,
  "adaptive-spawn": Atom,
};

const DEMO_RUNNERS: Record<AlgorithmId, { label: string; run: () => unknown }> = {
  dda: {
    label: "模拟波次调整",
    run: () => adjustDefenseWave(
      { index: 3, enemyCount: 24, eliteCount: 3 },
      { players: [
        { historicalWinRate: 0.72, averageDps: 210, accuracy: 0.86, averageDeathsPerRun: 1.2, totalRuns: 80 },
        { historicalWinRate: 0.34, averageDps: 75, accuracy: 0.52, averageDeathsPerRun: 3.8, totalRuns: 12 },
      ], averageLatencyMs: 65 }
    ),
  },
  ace: {
    label: "模拟风险判定",
    run: () => combineRisk(
      { averageReactionTimeMs: 65, aimConsistencyScore: 0.985, microCorrectionCountPerMinute: 130, memoryChecksumMismatch: true, debuggedProcessCount: 2, unknownModuleCount: 4, framesPerSecond: 60 },
      [{ type: "damage", value: 3200, expectedMax: 800, timestamp: 0 }, { type: "movement", value: 95, expectedMax: 42, timestamp: 1 }]
    ),
  },
  matchmaking: {
    label: "模拟组队",
    run: () => buildBalancedSquad(
      [{ id: "p1", skillScore: 0.9, latencyMs: 45, preferredRole: "tank" }, { id: "p2", skillScore: 0.75, latencyMs: 60, preferredRole: "dps" }, { id: "p3", skillScore: 0.6, latencyMs: 80, preferredRole: "support" }, { id: "p4", skillScore: 0.85, latencyMs: 55, preferredRole: "dps" }, { id: "p5", skillScore: 0.5, latencyMs: 320 }],
      { maxSize: 4 }
    ),
  },
  "map-balance": {
    label: "模拟审计",
    run: () => analyzeMapBalance([
      { variantId: "工业区-西侧据点", matches: 240, wins: 118, avgDurationSec: 620 },
      { variantId: "工业区-东侧据点", matches: 210, wins: 168, avgDurationSec: 510 },
      { variantId: "工业区-中央高地", matches: 28, wins: 11, avgDurationSec: 700 },
    ]),
  },
  "content-recommendation": {
    label: "模拟推荐",
    run: () => rankContent(
      [{ id: "c1", title: "据点防守狙击点位", tags: ["sniper", "defense"], createdAt: Date.now() - 3600000, likes: 12, views: 180 }, { id: "c2", title: "新人通关指南", tags: ["guide"], createdAt: Date.now() - 86400000 * 2, likes: 86, views: 1200 }, { id: "c3", title: "新皮肤：辐射涂装", tags: ["cosmetic"], createdAt: Date.now() - 1800000, likes: 0, views: 12 }],
      [{ tag: "sniper", weight: 0.85 }, { tag: "defense", weight: 0.5 }]
    ),
  },
  "economy-balance": {
    label: "模拟掉落调整",
    run: () => adjustDropRates(
      [{ id: "common", baseWeight: 50, value: 5 }, { id: "rare", baseWeight: 15, value: 50 }, { id: "legendary", baseWeight: 2, value: 200 }],
      { playerPlaytimeMinutes: 60, playerRecentDrops: Array(10).fill("common"), globalDropCounts: { common: 1200, rare: 180, legendary: 12 } },
      { targetValuePerHour: 150 }
    ),
  },
  "reward-recommendation": {
    label: "模拟奖励推荐",
    run: () => recommendRewards(
      [{ id: "w1", name: "散射脉冲", type: "weapon", tags: ["area", "multishot"], rarity: "rare" }, { id: "p1", name: "纳米再生", type: "passive", tags: ["regen"], rarity: "epic" }, { id: "w2", name: "穿甲磁轨", type: "weapon", tags: ["pierce", "bossDamage"], rarity: "legendary" }, { id: "p2", name: "动能护盾", type: "passive", tags: ["shield"], rarity: "common" }],
      { weapons: ["plasma"], passives: ["speed"], heroId: "nitrogen", healthPercent: 0.3 },
      { variants: ["tank", "elite"], eliteRatio: 0.35, bossPresent: true }
    ),
  },
  "spawn-optimizer": {
    label: "模拟刷怪调度",
    run: () => optimizeSpawns(
      [{ variant: "walker", baseWeight: 40, baseIntervalSec: 1.2 }, { variant: "runner", baseWeight: 20, baseIntervalSec: 1.5 }, { variant: "tank", baseWeight: 10, baseIntervalSec: 3 }, { variant: "spitter", baseWeight: 12, baseIntervalSec: 2.5 }, { variant: "elite", baseWeight: 6, baseIntervalSec: 5 }, { variant: "boss", baseWeight: 1, baseIntervalSec: 12 }],
      { playerHealthPercent: 0.35, coreHealthPercent: 0.6, activeEnemyCount: 42, maxEnemyCount: 60, elapsedWaveSec: 45, waveDurationSec: 120, recentDamageTaken: 180 }
    ),
  },
  "network-prediction": {
    label: "模拟网络补偿",
    run: () => {
      const snapshot = { latencyMs: 145, jitterMs: 22, packetLossPercent: 1.2, serverTime: 1000, clientTime: 1150 };
      return { network: evaluateNetwork(snapshot), predicted: predictEntityState({ x: 120, y: 80, vx: 240, vy: -60, timestamp: 950 }, snapshot) };
    },
  },
  "enemy-movement": {
    label: "模拟移动走位",
    run: () => calculateEnemyMovement({
      entity: { id: "runner_01", position: { x: 200, y: 200 }, radius: 16, speed: 140, variant: "runner", health: 80, maxHealth: 100 },
      target: { position: { x: 500, y: 220 }, velocity: { x: 120, y: 0 }, type: "player" },
      allies: [{ id: "runner_02", position: { x: 190, y: 210 }, radius: 16 }, { id: "runner_03", position: { x: 210, y: 190 }, radius: 16 }],
      obstacles: [{ id: "crate", x: 350, y: 180, width: 60, height: 60 }],
      bounds: { width: 1200, height: 800 },
      coordinateMode: "vector",
      config: { behavior: "flank", flankAngle: Math.PI / 5, time: 12.5 },
    }),
  },
  "bot-ai": {
    label: "模拟 Bot 战术决策",
    run: () => calculateBotAI({
      self: { id: "bot_alpha", x: 200, y: 200, radius: 16, speed: 180, maxHealth: 120, health: 120, teamId: "red", weapon: { id: "pulse", range: 320, damage: 24, cooldown: 0.4, projectileSpeed: 500 } },
      targets: [{ id: "player_1", x: 600, y: 220, radius: 16, speed: 180, maxHealth: 100, health: 60, teamId: "blue", weapon: { id: "shotgun", range: 260, damage: 36, cooldown: 0.8 }, velocity: { x: 80, y: 0 } }],
      allies: [{ id: "bot_beta", x: 190, y: 210, radius: 16, speed: 180, maxHealth: 100, health: 100, teamId: "red", weapon: { id: "pulse", range: 320, damage: 24, cooldown: 0.4 } }],
      obstacles: [{ id: "barrier", x: 400, y: 210, width: 80, height: 80 }],
      bounds: { width: 1200, height: 800 },
      time: 12.5, dt: 0.016, rngSeed: 42,
      config: { difficulty: { aggression: 0.7, botAccuracy: 0.82, botReactionDelay: 0.14 } },
    }),
  },
  progression: {
    label: "模拟渐进曲线",
    run: () => calculateProgressionCurve({
      totalWaves: 12,
      startDifficulty: 0.15,
      peakDifficulty: 0.85,
      curveType: "sigmoid",
      bossWaveInterval: 4,
      specialEventWaves: [3, 7],
      playerSkillScore: 0.65,
      teamSize: 2,
    }),
  },
  pathfinding: {
    label: "模拟寻路",
    run: () => findPath(
      { x: 50, y: 50 },
      { x: 700, y: 500 },
      { width: 800, height: 600 },
      [{ x: 300, y: 200, width: 80, height: 80 }, { x: 500, y: 350, width: 60, height: 120 }],
      16,
      { allowDiagonal: true, smoothPath: true }
    ),
  },
  "team-coordination": {
    label: "模拟团队协同",
    run: () => {
      const members = assignTeamRoles([
        { id: "bot_1", health: 100, maxHealth: 120, skillScore: 0.85 },
        { id: "bot_2", health: 60, maxHealth: 100, skillScore: 0.72 },
        { id: "bot_3", health: 90, maxHealth: 100, skillScore: 0.65 },
      ]);
      return coordinateTargets(
        members.map((m) => ({
          id: m.memberId, x: 400 + Math.random() * 100, y: 300 + Math.random() * 100,
          health: m.memberId === "bot_2" ? 60 : 90,
          maxHealth: 100, role: m.role, targetId: null, skillScore: 0.7,
        })),
        [
          { id: "enemy_1", x: 600, y: 320, health: 80, maxHealth: 100, threatScore: 0.7, isHighValue: true, lockedByCount: 0 },
          { id: "enemy_2", x: 580, y: 280, health: 30, maxHealth: 100, threatScore: 0.5, isHighValue: false, lockedByCount: 0 },
          { id: "enemy_3", x: 620, y: 350, health: 100, maxHealth: 100, threatScore: 0.3, isHighValue: false, lockedByCount: 0 },
        ]
      );
    },
  },
  "adaptive-spawn": {
    label: "模拟自适应曲线",
    run: () => {
      const waves = calculateProgressionCurve({
        totalWaves: 8, startDifficulty: 0.1, peakDifficulty: 0.8,
        curveType: "exponential", bossWaveInterval: 4, specialEventWaves: [2, 5],
        playerSkillScore: 0.6, teamSize: 1,
      });
      return generateAdaptiveSpawnCurve(
        waves.waves,
        waves.waves.map((_, i) => i === 0 ? null : ({
          dps: 80 + i * 15, damageTakenPerSec: 5 + i * 3,
          skillAccuracy: 0.7, healthPercent: Math.max(0.2, 1 - i * 0.08),
          killRate: 0.3 + i * 0.05, mobilityScore: 0.5 + i * 0.04,
        })),
        { playerHealthPercent: 0.6, coreHealthPercent: 0.8, activeEnemyCount: 15, maxEnemyCount: 40, elapsedWaveSec: 10, waveDurationSec: 45, recentDamageTaken: 50 },
        { phaseStrategy: "balanced", stickiness: 0.7 }
      );
    },
  },
};

export default function AlgorithmsPage() {
  const [activeEngine, setActiveEngine] = useState<string>("alpha");
  const [activeAlgo, setActiveAlgo] = useState<AlgorithmId>("dda");
  const [result, setResult] = useState<unknown | null>(null);
  const [running, setRunning] = useState(false);
  const [expandedEngine, setExpandedEngine] = useState<string>("alpha");
  const reducedMotion = useReducedMotion();

  const handleRun = useCallback((id: AlgorithmId) => {
    setRunning(true);
    try {
      const output = DEMO_RUNNERS[id].run();
      setResult(output);
    } finally {
      setRunning(false);
    }
  }, []);

  const activeMeta = ALGORITHM_REGISTRY.find((a) => a.id === activeAlgo);
  const engine = ENGINE_GROUPS[activeEngine as keyof typeof ENGINE_GROUPS];

  return (
    <Layout title="算法实验室">
      <div className="relative min-h-[100dvh]">
        <div className="noise-overlay" />
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -right-[15%] top-[5%] h-[50vh] w-[50vh] rounded-full bg-primary/4 blur-[100px]" />
          <div className="absolute -left-[10%] bottom-[10%] h-[40vh] w-[40vh] rounded-full bg-quantum/4 blur-[80px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 md:py-12">
          {/* Header */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
              <Atom weight="duotone" size={14} />{VERSION_DISPLAY} · 算法实验室
            </span>
            <h1 className="mt-2 text-[clamp(1.5rem,4vw,2.5rem)] font-bold leading-[0.95] tracking-tight">
              三引擎<br /><span className="text-gradient">维度架构</span>
            </h1>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">
              15 个核心算法分布于 α 玩家引擎、β 敌对引擎与 γ 基础设施引擎。
              所有算法逻辑、输入输出与实时演示均在此公开，信奉可验证、可审计、可迭代的数据驱动设计。
            </p>
          </motion.div>

          {/* Three Engine Dashboard */}
          <div className="grid gap-4 lg:grid-cols-3">
            {Object.values(ENGINE_GROUPS).map((engineGroup, index) => {
              const EngineIcon = engineGroup.icon;
              const isActive = expandedEngine === engineGroup.id;
              const algos = engineGroup.algorithmIds.map((id) => ALGORITHM_REGISTRY.find((a) => a.id === id)!).filter(Boolean);

              return (
                <motion.div
                  key={engineGroup.id}
                  initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="relative overflow-hidden bridge-panel holo-scan"
                >
                  {/* Engine Header */}
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedEngine(isActive ? "" : engineGroup.id);
                      setActiveEngine(engineGroup.id);
                      if (engineGroup.algorithmIds.length > 0) {
                        setActiveAlgo(engineGroup.algorithmIds[0]);
                      }
                    }}
                    className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-panel/40"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${engineGroup.bgColor}15`, color: engineGroup.color }}
                      >
                        <EngineIcon size={20} weight="bold" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold">{engineGroup.name}</h3>
                        <p className="text-[10px] text-muted">{engineGroup.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-primary/10 bg-background/50 holo-scan px-2 py-0.5 font-mono text-[10px] text-muted">
                        {algos.length} 算法
                      </span>
                      {isActive ? <CaretUp size={14} /> : <CaretDown size={14} />}
                    </div>
                  </button>

                  {/* Engine Status Indicator */}
                  <div className="mx-4 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

                  <div className="flex items-center gap-2 px-4 py-3">
                    <span
                      className="inline-flex h-2 w-2 rounded-full"
                      style={{ backgroundColor: engineGroup.color }}
                    />
                    <span
                      className="inline-flex h-2 w-2 rounded-full opacity-60"
                      style={{ backgroundColor: engineGroup.color }}
                    />
                    <span
                      className="inline-flex h-2 w-2 rounded-full opacity-30"
                      style={{ backgroundColor: engineGroup.color }}
                    />
                    <span className="ml-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                      {engineGroup.id === "alpha" ? "实时运行" : engineGroup.id === "beta" ? "实时运行" : "监控中"}
                    </span>
                  </div>

                  {/* Algorithm List (collapsed) */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-1.5">
                          {algos.map((algo) => {
                            const AlgoIcon = ENGINE_ICONS[algo.id];
                            const isSelected = activeAlgo === algo.id && activeEngine === engineGroup.id;
                            return (
                              <button
                                key={algo.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveEngine(engineGroup.id);
                                  setActiveAlgo(algo.id);
                                }}
                                className={`flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left text-xs transition-all ${
                                  isSelected
                                    ? "border border-primary/20 bg-primary/5"
                                    : "border border-transparent hover:bg-panel/40"
                                }`}
                              >
                                <AlgoIcon size={14} weight="bold" style={{ color: engineGroup.color }} />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium">{algo.name}</p>
                                  <p className="truncate text-[10px] text-muted">{algo.tagline}</p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveEngine(engineGroup.id);
                                    setActiveAlgo(algo.id);
                                    handleRun(algo.id);
                                  }}
                                  loading={running && activeAlgo === algo.id}
                                  leftIcon={<Play size={12} weight="fill" />}
                                >
                                  运行
                                </Button>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Output Panel */}
          {activeMeta && (
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-4 bridge-panel holo-scan p-4 md:p-6"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${engine.color}15`, color: engine.color }}
                  >
                    {(() => {
                      const Icon = ENGINE_ICONS[activeAlgo];
                      return <Icon size={18} weight="bold" />;
                    })()}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold">{activeMeta.name}</h3>
                    <p className="text-[10px] text-muted">{activeMeta.tagline}</p>
                  </div>
                </div>
                {result !== null && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                    <CheckCircle size={10} weight="fill" />
                    运行完成
                  </span>
                )}
              </div>

              <p className="mb-4 text-xs leading-relaxed text-foreground/80">{activeMeta.description}</p>

              <div className="mb-4 grid gap-2 text-xs sm:grid-cols-2">
                <div className="rounded-xl border border-primary/10 bg-background/50 holo-scan p-2.5">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">输入参数</p>
                  <p className="mt-1 text-foreground">{activeMeta.inputs.join(" · ")}</p>
                </div>
                <div className="rounded-xl border border-primary/10 bg-background/50 holo-scan p-2.5">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">输出结果</p>
                  <p className="mt-1 text-foreground">{activeMeta.outputs.join(" · ")}</p>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-1.5">
                {activeMeta.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-primary/10 bg-background px-2 py-0.5 text-[10px] font-medium text-muted">
                    {tag}
                  </span>
                ))}
              </div>

              {result !== null ? (
                <motion.div
                  initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={activeAlgo}
                  className="overflow-x-auto rounded-xl border border-primary/10 bg-background/60 holo-scan p-3"
                >
                  <pre className="text-xs leading-relaxed text-foreground md:text-sm">
                    <code>{JSON.stringify(result, null, 2)}</code>
                  </pre>
                </motion.div>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-primary/10 bg-background/40 holo-scan text-center">
                  <BracketsCurly size={32} className="text-muted/30" />
                  <p className="text-xs text-muted">点击引擎卡片中的「运行」按钮查看实时输出</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Stats & API */}
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-4 grid gap-3 sm:grid-cols-3"
          >
            <StatCard label="算法总数" value={ALGORITHM_REGISTRY.length} sub="已公开可审计" variant="primary" />
            <StatCard label="核心目标" value="55%" sub="DDA 目标通关率" variant="accent" />
            <StatCard label="验证方式" value="双向" sub="ACE 客户端 + 服务端" variant="success" />
          </motion.div>

          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="mt-4 bridge-panel holo-scan p-4 md:p-6"
          >
            <div className="flex items-center gap-2">
              <Globe size={16} weight="bold" className="text-primary" />
              <h3 className="text-sm font-bold">实验平台接入</h3>
            </div>
            <p className="mt-1 max-w-2xl text-xs text-muted">
              所有算法均已封装为纯函数，可直接在游戏逻辑、后台服务或 API 中调用。
              也可通过 <code className="rounded bg-background px-1 py-0.5 text-primary">POST /api/algorithms/run</code> 在线运行任意算法。
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}