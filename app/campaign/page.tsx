"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen, Play, Lock, Check, CaretRight, Star, Crown,
  Crosshair, Shield, Scroll, Coin, Sparkle, Sword, Skull,
  ArrowRight, ArrowsClockwise, Trophy, Clock, Fire,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import DimensionBackground from "@/components/effects/DimensionBackground";
import {
  CAMPAIGN_CHAPTERS,
  getChapterProgress,
  isChapterComplete,
  canStartChapter,
  isNodeUnlocked,
  getNextUnlockedNode,
  type CampaignProgress,
  type CampaignNode,
  DEFAULT_CAMPAIGN_PROGRESS,
} from "@/lib/game/campaign";
import { loadSave, type SaveData } from "@/lib/game/save";

const NODE_TYPE_ICONS: Record<string, typeof BookOpen> = {
  story: BookOpen,
  battle: Crosshair,
  boss: Skull,
  reward: Coin,
  shop: Coin,
};

const NODE_TYPE_LABELS: Record<string, string> = {
  story: "剧情",
  battle: "战斗",
  boss: "首领",
  reward: "奖励",
  shop: "商店",
};

const NODE_TYPE_COLORS: Record<string, string> = {
  story: "var(--anchor)",
  battle: "var(--primary)",
  boss: "var(--caution)",
  reward: "var(--accent)",
  shop: "var(--orbital)",
};

function CampaignNodeCard({
  node,
  chapter,
  progress,
  isNext,
  onSelect,
}: {
  node: CampaignNode;
  chapter: string;
  progress: CampaignProgress;
  isNext: boolean;
  onSelect: (node: CampaignNode) => void;
}) {
  const unlocked = isNodeUnlocked(node, CAMPAIGN_CHAPTERS.find((c) => c.id === chapter)!, progress);
  const completed = progress.completedNodes.includes(node.id);
  const Icon = NODE_TYPE_ICONS[node.type] ?? BookOpen;
  const color = NODE_TYPE_COLORS[node.type] ?? "var(--primary)";

  return (
    <motion.button
      type="button"
      onClick={() => unlocked && onSelect(node)}
      disabled={!unlocked}
      className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all ${
        completed
          ? "border-success/20 bg-success/5"
          : isNext
            ? "border-primary/30 bg-primary-subtle animate-pulse"
            : unlocked
              ? "border-primary/10 bg-panel/60 hover:border-primary/30 hover:bg-panel"
              : "border-primary/5 bg-panel/30 opacity-40 cursor-not-allowed"
      }`}
      style={{ minWidth: "140px" }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${color}18` }}
      >
        {completed ? (
          <Check size={22} weight="bold" className="text-success" />
        ) : unlocked ? (
          <Icon size={22} weight="bold" style={{ color }} />
        ) : (
          <Lock size={18} weight="bold" className="text-muted" />
        )}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>
        {NODE_TYPE_LABELS[node.type]}
      </span>
      <span className="text-[11px] font-medium text-center leading-tight">{node.title}</span>
      {completed && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-success text-[10px] font-bold text-white">
          <Check size={10} weight="bold" />
        </span>
      )}
      {isNext && !completed && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-background">
          <ArrowRight size={10} weight="bold" />
        </span>
      )}
    </motion.button>
  );
}

function StoryModal({
  content,
  title,
  onClose,
  onBattle,
}: {
  content: string;
  title: string;
  onClose: () => void;
  onBattle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg station-panel station-glow p-6"
      >
        <div className="relative">
          <div className="station-panel-header -mx-6 -mt-6 mb-4">
            <div className="flex items-center gap-2">
              <Scroll size={18} weight="bold" className="text-anchor" />
              <h3 className="font-display text-lg font-bold">{title}</h3>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted whitespace-pre-line">{content}</p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-primary/10 bg-panel/60 px-4 py-2.5 text-xs font-semibold text-muted transition-all hover:border-primary/30 hover:text-foreground focus-ring active:scale-95"
            >
              继续探索
            </button>
            <button
              type="button"
              onClick={onBattle}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-background transition-all hover:bg-primary/90 focus-ring active:scale-95 shadow-lg shadow-primary/10"
            >
              进入战斗
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CampaignPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [save, setSave] = useState<SaveData | null>(null);
  const [progress, setProgress] = useState<CampaignProgress>(DEFAULT_CAMPAIGN_PROGRESS);
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [storyModal, setStoryModal] = useState<{ content: string; title: string; nodeId: string } | null>(null);

  useEffect(() => {
    const data = loadSave();
    setSave(data);
    if (data.campaignProgress) {
      setProgress(data.campaignProgress);
    }
  }, []);

  const chapter = CAMPAIGN_CHAPTERS[selectedChapter];
  const chapterProgress = getChapterProgress(chapter, progress);
  const complete = isChapterComplete(chapter, progress);
  const canStart = canStartChapter(chapter, progress);
  const nextNode = getNextUnlockedNode(chapter, progress);

  const handleNodeSelect = useCallback((node: CampaignNode) => {
    if (node.type === "story") {
      setStoryModal({
        content: node.storyContent ?? "",
        title: node.title,
        nodeId: node.id,
      });
    } else if (node.type === "battle" || node.type === "boss") {
      const mode = node.type === "boss" ? "defense" : node.mode;
      const bossParam = node.bossId ? `&boss=${node.bossId}` : "";
      void router.push(`/game?mode=${mode}&campaignNode=${node.id}&campaignChapter=${chapter.id}${bossParam}`);
    }
  }, [router, chapter.id]);

  const handleBattle = useCallback(() => {
    setStoryModal(null);
    if (nextNode) {
      void router.push(`/game?mode=${nextNode.mode}&campaignNode=${nextNode.id}&campaignChapter=${chapter.id}`);
    }
  }, [router, nextNode, chapter.id]);

  return (
    <Layout title="星历编年史">
      <div className="relative min-h-[100dvh]">
        <DimensionBackground intensity="medium" />
        <div className="noise-overlay pointer-events-none fixed inset-0 z-0" />
        <div className="pointer-events-none fixed inset-0 z-0 station-grid opacity-40" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:py-8">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-subtle px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              <Sparkle size={10} weight="fill" />
              星历编年史
            </span>
            <h1 className="mt-3 font-display text-[clamp(1.5rem,4vw,2.5rem)] font-extrabold leading-[0.95] tracking-tight">
              星历编年史
              <br />
              <span className="text-gradient">穿越星域的旅程</span>
            </h1>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">
              跟随星历推进，探索深空航路背后的真相。每一章都是独立的故事，解锁新装备和航天员。
            </p>
          </motion.div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {CAMPAIGN_CHAPTERS.map((ch, i) => {
              const prog = getChapterProgress(ch, progress);
              const done = isChapterComplete(ch, progress);
              const available = canStartChapter(ch, progress);
              const active = i === selectedChapter;
              return (
                <motion.button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedChapter(i)}
                  initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                  disabled={!available}
                  className={`flex-none station-panel p-3 transition-all text-left focus-ring ${
                    active
                      ? "border-primary/30"
                      : available
                        ? "hover:border-primary/20"
                        : "opacity-40 cursor-not-allowed"
                  }`}
                  style={{ width: "200px" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${ch.accentColor}18` }}>
                      {done ? <Check size={16} weight="bold" className="text-success" /> : <BookOpen size={16} weight="bold" style={{ color: ch.accentColor }} />}
                    </span>
                    <div>
                      <p className="text-xs font-bold">{ch.name}</p>
                      <p className="text-[10px] text-muted">{ch.subtitle}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-primary/10">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${prog}%` }} />
                    </div>
                    <span className="text-[10px] font-mono tabular-nums text-muted">{prog}%</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {!canStart ? (
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className="station-panel orbital-scan p-8 text-center"
            >
              <Lock size={32} weight="bold" className="mx-auto text-muted" />
              <p className="mt-3 text-sm font-medium">章节未解锁</p>
              <p className="mt-1 text-xs text-muted">完成前一章节以解锁此内容</p>
            </motion.div>
          ) : (
            <motion.div
              key={selectedChapter}
              initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-4 station-panel orbital-scan station-glow p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: chapter.accentColor }}>{chapter.name}</span>
                      <span className="text-[11px] text-muted">{chapter.dimension}</span>
                    </div>
                    <h2 className="mt-1 font-display text-xl font-bold">{chapter.subtitle}</h2>
                    <p className="mt-1 text-xs text-muted">{chapter.intro}</p>
                  </div>
                  {complete && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-[11px] font-bold text-success">
                      <Check size={12} weight="bold" />
                      已完成
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-4 text-[10px] text-muted">
                  <span className="flex items-center gap-1"><Trophy size={12} weight="bold" className="text-anchor" /> 奖励: <span className="font-mono tabular-nums">{chapter.completionReward.coins.toLocaleString()}</span> 金币</span>
                  {chapter.completionReward.unlocks && (
                    <span className="flex items-center gap-1"><Star size={12} weight="bold" className="text-primary" /> 解锁: <span className="font-mono tabular-nums">{chapter.completionReward.unlocks.length}</span> 件物品</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                {chapter.nodes.map((node) => {
                  const isNext = nextNode?.id === node.id;
                  return (
                    <CampaignNodeCard
                      key={node.id}
                      node={node}
                      chapter={chapter.id}
                      progress={progress}
                      isNext={isNext}
                      onSelect={handleNodeSelect}
                    />
                  );
                })}
              </div>

              {nextNode && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleNodeSelect(nextNode)}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-background shadow-lg shadow-primary/10 transition-all hover:bg-primary/90 focus-ring active:scale-95"
                  >
                    <Play size={16} weight="fill" />
                    继续战役
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {storyModal && (
          <StoryModal
            content={storyModal.content}
            title={storyModal.title}
            onClose={() => setStoryModal(null)}
            onBattle={handleBattle}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}