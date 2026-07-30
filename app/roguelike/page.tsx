"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sword,
  Skull,
  Shield,
  Lightning,
  CaretRight,
  House,
  Play,
  Flag,
  Sparkle,
  Star,
  Crown,
  DotsThree,
  DiceSix,
  ArrowLeft,
  CheckCircle,
  Circle,
  Lock,
  Heartbeat,
  ShootingStar,
  Eye,
  Fire,
  TreeStructure,
  Broom,
  Coins,
  ArrowURightUp,
} from "@phosphor-icons/react";
import BrandLogo from "@/components/BrandLogo";
import DimensionBackground from "@/components/effects/DimensionBackground";
import { createRoguelikeRun, getCurrentStage, advanceStage, generateRewardOptions, applyReward, shouldOfferReward, shouldOfferCurseBlessing, generateCurseBlessingOptions, applyCurseBlessingChoice, isFinalStage, isStageComplete, markCurrentStageComplete, getRunProgress, resetRoguelikeRun, type RoguelikeRunState } from "@/lib/game/roguelike";
import type { RoguelikeStage, Player, SpriteAnimationState } from "@/lib/game/types";
import type { RoguelikeRewardBalance } from "@/lib/game/balance";
import type { CurseBlessingPair } from "@/lib/game/curseBlessing";
import type { Icon } from "@phosphor-icons/react";

const STAGE_ICONS: Record<string, Icon> = {
  combat: Sword,
  elite: Fire,
  boss: Skull,
  reward: Sparkle,
};

const STAGE_COLORS: Record<string, string> = {
  combat: "var(--primary)",
  elite: "var(--accent)",
  boss: "var(--danger)",
  reward: "var(--success)",
};

const STAGE_LABELS: Record<string, string> = {
  combat: "战斗",
  elite: "精英",
  boss: "首领",
  reward: "补给",
};

const REWARD_ICONS = [Heartbeat, Sword, Shield, ShootingStar, Sparkle, Lightning];

function createMockPlayer(): Player {
  return {
    id: "mock_player",
    x: 0,
    y: 0,
    radius: 16,
    health: 100,
    maxHealth: 100,
    speed: 200,
    damage: 10,
    armor: 0,
    weapons: [],
    passives: [],
    level: 1,
    xp: 0,
    xpToNext: 100,
    heroId: "recon",
    invincible: 0,
    magnetRange: 80,
    critChance: 0.05,
    cooldownReduction: 0,
    areaMultiplier: 1,
    regen: 0,
    activeSkill: null,
    skillTimer: 0,
    ultimateSkill: null,
    ultimateTimer: 0,
    deployableUpgrades: {},
    talentLevels: {},
    leopardFrenzyTimer: 0,
    leopardFrenzyActive: false,
    leopardPounceSpeedTimer: 0,
    leopardBloodlustStacks: 0,
    leopardBloodlustTimer: 0,
    twilightCocoonTimer: 0,
    knockbackX: 0,
    knockbackY: 0,
    burnDuration: 0,
    burnDamage: 0,
    attackSpeed: 1,
    lifesteal: 0,
    skillDamageMul: 1,
    critMultiplier: 1.5,
    dashCooldown: 0,
    explosionOnKill: 0,
    thorns: 0,
    multishotChance: 0,
    periodicShield: 0,
    healingReceivedMul: 1,
    bloodPactDrain: 0,
    rangeMul: 1,
    missChance: 0,
    luckPenalty: 0,
    maxDashes: 1,
    threatRadiusMul: 1,
    facing: 0,
    animation: "idle" as SpriteAnimationState,
    animationTimer: 0,
  };
}

export default function RoguelikePage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [run, setRun] = useState<RoguelikeRunState | null>(null);
  const [player, setPlayer] = useState<Player>(createMockPlayer);
  const [selectedStage, setSelectedStage] = useState<number>(0);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showCurseModal, setShowCurseModal] = useState(false);
  const [rewardOptions, setRewardOptions] = useState<RoguelikeRewardBalance[]>([]);
  const [curseOptions, setCurseOptions] = useState<CurseBlessingPair[]>([]);
  const [seedInput, setSeedInput] = useState(String(Date.now() % 100000));

  const startRun = useCallback(() => {
    const seed = Number.parseInt(seedInput, 10) || Date.now();
    const newRun = createRoguelikeRun(seed);
    setRun(newRun);
    setPlayer(createMockPlayer());
    setSelectedStage(0);
    setShowRewardModal(false);
    setShowCurseModal(false);
  }, [seedInput]);

  const currentStage = useMemo(() => (run ? getCurrentStage(run) : null), [run]);
  const progress = useMemo(() => (run ? getRunProgress(run) : 0), [run]);

  const handleStageClick = useCallback((index: number) => {
    if (!run) return;
    if (index > run.currentIndex) return;
    setSelectedStage(index);
  }, [run]);

  const handleCompleteStage = useCallback(() => {
    if (!run || !currentStage || !player) return;
    markCurrentStageComplete(run);

    if (shouldOfferCurseBlessing(run)) {
      const pairs = generateCurseBlessingOptions(run);
      setCurseOptions(pairs);
      setShowCurseModal(true);
      return;
    }

    if (shouldOfferReward(run)) {
      const options = generateRewardOptions(run, player, 3);
      setRewardOptions(options);
      setShowRewardModal(true);
      return;
    }

    advanceStage(run);
    setRun({ ...run });
    if (run.completed) {
      setShowRewardModal(false);
      setShowCurseModal(false);
    }
  }, [run, currentStage, player]);

  const handleSelectCurse = useCallback((pairIndex: number) => {
    if (!run || !player) return;
    applyCurseBlessingChoice(run, pairIndex, player);
    setPlayer({ ...player });
    setShowCurseModal(false);

    if (shouldOfferReward(run)) {
      const options = generateRewardOptions(run, player, 3);
      setRewardOptions(options);
      setShowRewardModal(true);
      return;
    }

    advanceStage(run);
    setRun({ ...run });
  }, [run, player]);

  const handleSelectReward = useCallback((rewardId: string) => {
    if (!run || !player) return;
    applyReward(run, player, rewardId);
    setPlayer({ ...player });
    setShowRewardModal(false);
    advanceStage(run);
    setRun({ ...run });
  }, [run, player]);

  const handleReset = useCallback(() => {
    setRun(null);
    setPlayer(createMockPlayer());
    setSelectedStage(0);
    setShowRewardModal(false);
    setShowCurseModal(false);
    setSeedInput(String(Date.now() % 100000));
  }, []);

  const handleStartGame = useCallback(() => {
    if (!run) return;
    const seed = run.seed;
    router.push(`/game?mode=roguelike&seed=${seed}`);
  }, [run, router]);

  if (!run) {
    return (
      <div className="relative flex min-h-[100dvh] flex-col bg-background text-foreground">
        <DimensionBackground intensity="subtle" />

        <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 rounded-lg text-sm font-medium text-muted transition-colors hover:text-foreground">
            <ArrowLeft size={18} weight="bold" />
            返回指挥部
          </Link>
          <BrandLogo size={24} variant="icon" className="text-primary" />
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center px-4">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg"
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

              <div className="p-8 text-center">
                <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
                  <DiceSix size={40} weight="bold" className="text-primary" />
                </div>
                <h1 className="font-bold text-3xl tracking-tight">冒险模式</h1>
                <p className="mt-3 mx-auto max-w-sm text-sm text-muted leading-relaxed">
                  程序化生成关卡树，每层随机遭遇。战斗后选择祝福与诅咒，在风险与收益中抵达终点。
                </p>
              </div>

              <div className="border-t border-border px-8 pb-8">
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-border bg-panel-raised p-4">
                    <div className="flex items-center gap-3 text-sm text-muted">
                      <TreeStructure size={18} weight="bold" className="text-primary" />
                      <span>6层关卡 · 战斗-精英-补给-首领</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-panel-raised p-4">
                    <div className="flex items-center gap-3 text-sm text-muted">
                      <Broom size={18} weight="bold" className="text-accent" />
                      <span>12种祝福 · 12种诅咒 · 风险收益抉择</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-panel-raised p-4">
                    <div className="flex items-center gap-3 text-sm text-muted">
                      <Coins size={18} weight="bold" className="text-success" />
                      <span>6种强化奖励 · 叠加至运行结束</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="mb-2 block text-xs font-medium text-muted">种子 (留空随机)</label>
                  <input
                    type="text"
                    value={seedInput}
                    onChange={(e) => setSeedInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="随机种子"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <button
                  onClick={startRun}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
                >
                  <Play size={20} weight="bold" />
                  开始冒险
                </button>
              </div>
            </div>
          </motion.div>
        </main>

        <footer className="relative z-10 border-t border-border py-4 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            公平竞技 · 无付费加成 · 多重宇宙
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background text-foreground">
      <DimensionBackground intensity="subtle" />

      <header className="relative z-20 border-b border-border bg-panel/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <button onClick={handleReset} className="flex items-center gap-2 rounded-lg text-sm font-medium text-muted transition-colors hover:text-foreground">
            <ArrowLeft size={18} weight="bold" />
            放弃冒险
          </button>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-muted">种子 #{run.seed}</span>
            <span className="font-mono text-xs font-bold text-primary">
              {run.currentIndex + 1}/{run.stages.length}
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-muted mb-2">
            <span>探索进度</span>
            <span className="font-mono">{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {/* Stage Map */}
        <div className="mb-8">
          <h2 className="mb-4 font-bold text-sm uppercase tracking-[0.15em] text-muted">关卡路线</h2>
          <div className="relative flex items-center gap-3 overflow-x-auto pb-2">
            {run.stages.map((stage, index) => {
              const StageIcon = STAGE_ICONS[stage.type] || Sword;
              const isPast = index < run.currentIndex;
              const isCurrent = index === run.currentIndex;
              const isFuture = index > run.currentIndex;
              const isSelected = index === selectedStage;

              return (
                <div key={stage.id} className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleStageClick(index)}
                    disabled={isFuture}
                    className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${
                      isPast
                        ? "border-success/30 bg-success/5 cursor-pointer hover:border-success/50"
                        : isCurrent
                          ? "border-primary/40 bg-primary/5 ring-2 ring-primary/20 cursor-pointer"
                          : "border-border/50 bg-panel-raised/50 opacity-40 cursor-not-allowed"
                    } ${isSelected ? "ring-2 ring-primary/30" : ""}`}
                    style={{ minWidth: "100px" }}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                      isPast
                        ? "border-success/30 bg-success/10 text-success"
                        : isCurrent
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-background text-muted"
                    }`}>
                      {isPast ? (
                        <CheckCircle size={22} weight="bold" />
                      ) : isFuture ? (
                        <Lock size={18} weight="bold" />
                      ) : (
                        <StageIcon size={22} weight="bold" />
                      )}
                    </div>
                    <span className={`text-xs font-bold ${isFuture ? "text-muted" : "text-foreground"}`}>
                      {stage.name}
                    </span>
                    <span className={`font-mono text-[10px] ${isFuture ? "text-muted" : "text-muted"}`}>
                      {STAGE_LABELS[stage.type]}
                    </span>
                    {isCurrent && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                        <Play size={8} weight="fill" className="text-white" />
                      </span>
                    )}
                  </button>

                  {index < run.stages.length - 1 && (
                    <div className={`h-px w-6 ${index < run.currentIndex ? "bg-success/30" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Stage Info */}
        {currentStage && (
          <motion.div
            key={currentStage.id}
            initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-border bg-panel p-6 shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
                  {(() => {
                    const Icon = STAGE_ICONS[currentStage.type] || Sword;
                    return <Icon size={28} weight="bold" className="text-primary" />;
                  })()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-xl">{currentStage.name}</h2>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary uppercase">
                      {STAGE_LABELS[currentStage.type]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{currentStage.mission.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(currentStage.mission.progress / currentStage.mission.target) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-muted">
                      {currentStage.mission.progress}/{currentStage.mission.target}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {!isStageComplete(currentStage) && (
                <button
                  onClick={handleCompleteStage}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
                >
                  <Flag size={18} weight="bold" />
                  完成关卡
                </button>
              )}

              {isStageComplete(currentStage) && !run.completed && (
                <button
                  onClick={() => {
                    advanceStage(run);
                    setRun({ ...run });
                  }}
                  className="flex items-center gap-2 rounded-xl bg-success px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-success/20 transition-all hover:bg-success/90 active:scale-[0.98]"
                >
                  <CaretRight size={18} weight="bold" />
                  进入下一关
                </button>
              )}

              {run.completed && (
                <button
                  onClick={handleStartGame}
                  className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.98]"
                >
                  <Play size={18} weight="bold" />
                  开始战斗
                </button>
              )}

              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted transition-all hover:border-primary/30 hover:text-foreground active:scale-[0.98]"
              >
                <ArrowURightUp size={18} weight="bold" />
                重新开始
              </button>
            </div>
          </motion.div>
        )}

        {/* Active Blessings & Curses */}
        {run.curseBlessing.activeBlessings.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-success">
                <Sparkle size={14} weight="bold" />
                祝福 ({run.curseBlessing.activeBlessings.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {run.curseBlessing.activeBlessings.map((id) => (
                  <span key={id} className="rounded-lg bg-success/10 px-2.5 py-1 font-mono text-[10px] font-bold text-success">
                    {id}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-danger">
                <Skull size={14} weight="bold" />
                诅咒 ({run.curseBlessing.activeCurses.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {run.curseBlessing.activeCurses.map((id) => (
                  <span key={id} className="rounded-lg bg-danger/10 px-2.5 py-1 font-mono text-[10px] font-bold text-danger">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rewards Selected */}
        {run.selectedRewards.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-panel-raised p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-muted">
              <Star size={14} weight="bold" />
              已选强化 ({run.selectedRewards.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {run.selectedRewards.map((id) => (
                <span key={id} className="rounded-lg bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold text-primary">
                  {id}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Curse/Blessing Modal */}
      <AnimatePresence>
        {showCurseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

              <div className="p-6 text-center md:p-8">
                <h2 className="font-bold text-2xl tracking-tight md:text-3xl">诅咒与祝福</h2>
                <p className="mt-2 mx-auto max-w-md text-sm text-muted">
                  每场战斗后必须选择一组。祝福带来永久增益，诅咒带来永久减益。
                </p>
              </div>

              <div className="space-y-3 px-6 pb-8 md:px-8">
                {curseOptions.map((pair, index) => (
                  <motion.button
                    key={pair.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectCurse(index)}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-panel-raised p-5 text-left transition-all hover:border-accent/50 hover:bg-panel"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-success/20 bg-success/5 text-success">
                      <Sparkle size={24} weight="bold" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-success">{pair.blessing.name}</h3>
                      <p className="mt-1 text-xs text-muted leading-relaxed">{pair.blessing.description}</p>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-danger/20 bg-danger/5 text-danger">
                      <Skull size={20} weight="bold" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-danger">{pair.curse.name}</h3>
                      <p className="mt-1 text-xs text-muted leading-relaxed">{pair.curse.description}</p>
                    </div>

                    <CaretRight size={18} weight="bold" className="shrink-0 text-muted transition-all group-hover:translate-x-1 group-hover:text-accent" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reward Modal */}
      <AnimatePresence>
        {showRewardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-success/40 to-transparent" />

              <div className="p-6 text-center md:p-8">
                <h2 className="font-bold text-2xl tracking-tight md:text-3xl">补给站</h2>
                <p className="mt-2 mx-auto max-w-md text-sm text-muted">
                  选择一项强化以继续探索。奖励效果会持续到本次冒险结束。
                </p>
              </div>

              <div className="space-y-3 px-6 pb-8 md:px-8">
                {rewardOptions.map((option, index) => {
                  const Icon = REWARD_ICONS[index % REWARD_ICONS.length];
                  const rarityStyles = [
                    { border: "border-border", bg: "bg-panel-raised", badge: "common" },
                    { border: "border-primary/30", bg: "bg-primary/5", badge: "rare" },
                    { border: "border-accent/30", bg: "bg-accent/5", badge: "epic" },
                  ][index % 3];

                  return (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelectReward(option.id)}
                      className={`group flex w-full items-center gap-4 rounded-2xl border ${rarityStyles.border} ${rarityStyles.bg} p-5 text-left transition-all hover:border-accent/50 hover:bg-panel`}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-accent transition-colors group-hover:border-accent/40">
                        <Icon size={24} weight="bold" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{option.name}</h3>
                          <span className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                            {rarityStyles.badge}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-muted">{option.description}</p>
                      </div>

                      <CaretRight size={18} weight="bold" className="shrink-0 text-muted transition-all group-hover:translate-x-1 group-hover:text-accent" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="relative z-10 border-t border-border py-4 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          公平竞技 · 无付费加成 · 多重宇宙
        </p>
      </footer>
    </div>
  );
}