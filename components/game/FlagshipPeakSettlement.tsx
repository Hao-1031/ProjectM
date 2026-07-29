import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform } from "framer-motion";
import {
  Rocket,
  Shield,
  Skull,
  Trophy,
  Lightning,
  Crown,
  Star,
  Gauge,
  Fire,
  Hexagon,
  Target,
  Warning,
  CheckCircle,
  XCircle,
  ArrowRight,
  Clock,
  Crosshair,
  Sword,
  Heartbeat,
  Coins,
  Medal,
  Lock,
  Sparkle,
  Circle,
  EyeSlash,
  Spade,
} from "@phosphor-icons/react";
import type {
  FlagshipPeakSettlement as FlagshipPeakSettlementType,
  FlagshipPeakRadarScore,
  FlagshipPeakAchievement,
  FlagshipPeakMilestone,
  FlagshipPeakPhaseReward,
} from "@/lib/game/types";
import { getFlagshipPeakSpeedRankName, getFlagshipPeakSeasonRankName } from "@/lib/game/flagship-peak";

type SettlementStage = "animation" | "ratings" | "rewards";

interface FlagshipPeakSettlementProps {
  settlement: FlagshipPeakSettlementType;
  onContinue: () => void;
}

// ========================================================================
// 阶段主题 — 三阶段视觉身份
// ========================================================================

const PHASE_THEME: Record<string, {
  bg: string;
  accent: string;
  glow: string;
  label: string;
  particleColor: string;
  secondaryGlow: string;
  vignette: string;
}> = {
  standard: {
    bg: "from-[#F5F2ED] via-[#E8E4DB] to-[#DDD7CC]",
    accent: "var(--primary)",
    glow: "rgba(11, 29, 58, 0.35)",
    label: "标准巡航",
    particleColor: "rgba(11,29,58,0.6)",
    secondaryGlow: "rgba(11, 29, 58, 0.2)",
    vignette: "radial-gradient(ellipse at center, transparent 50%, rgba(245,242,237,0.85) 100%)",
  },
  overclock: {
    bg: "from-[#F5F2ED] via-[#E8E4DB] to-[#DDD7CC]",
    accent: "var(--caution)",
    glow: "rgba(200, 74, 74, 0.45)",
    label: "超频增压",
    particleColor: "rgba(200,74,74,0.6)",
    secondaryGlow: "rgba(200, 74, 74, 0.2)",
    vignette: "radial-gradient(ellipse at center, transparent 50%, rgba(245,242,237,0.85) 100%)",
  },
  hell: {
    bg: "from-[#F5F2ED] via-[#E8E4DB] to-[#DDD7CC]",
    accent: "var(--orbital)",
    glow: "rgba(168, 85, 247, 0.5)",
    label: "地狱终局",
    particleColor: "rgba(168,85,247,0.6)",
    secondaryGlow: "rgba(192, 132, 252, 0.2)",
    vignette: "radial-gradient(ellipse at center, transparent 45%, rgba(245,242,237,0.9) 100%)",
  },
  abyss: {
    bg: "from-[#F5F2ED] via-[#E8E4DB] to-[#DDD7CC]",
    accent: "#333333",
    glow: "rgba(51, 51, 51, 0.55)",
    label: "深渊",
    particleColor: "rgba(51,51,51,0.5)",
    secondaryGlow: "rgba(85, 85, 85, 0.15)",
    vignette: "radial-gradient(ellipse at center, transparent 40%, rgba(245,242,237,0.95) 100%)",
  },
  void: {
    bg: "from-[#F5F2ED] via-[#E8E4DB] to-[#DDD7CC]",
    accent: "#e2e8f0",
    glow: "rgba(226, 232, 240, 0.45)",
    label: "虚空",
    particleColor: "rgba(226,232,240,0.5)",
    secondaryGlow: "rgba(248, 250, 252, 0.15)",
    vignette: "radial-gradient(ellipse at center, transparent 50%, rgba(245,242,237,0.85) 100%)",
  },
  genesis: {
    bg: "from-[#F5F2ED] via-[#E8E4DB] to-[#DDD7CC]",
    accent: "#00ffcc",
    glow: "rgba(0, 255, 204, 0.6)",
    label: "创世",
    particleColor: "rgba(0,255,204,0.6)",
    secondaryGlow: "rgba(0, 255, 204, 0.15)",
    vignette: "radial-gradient(ellipse at center, transparent 45%, rgba(245,242,237,0.9) 100%)",
  },
  victory: {
    bg: "from-[#F5F2ED] via-[#E8E4DB] to-[#DDD7CC]",
    accent: "var(--success)",
    glow: "rgba(34, 197, 94, 0.45)",
    label: "胜利",
    particleColor: "rgba(34,197,94,0.5)",
    secondaryGlow: "rgba(74, 222, 128, 0.2)",
    vignette: "radial-gradient(ellipse at center, transparent 50%, rgba(245,242,237,0.85) 100%)",
  },
  defeat: {
    bg: "from-[#F5F2ED] via-[#E8E4DB] to-[#DDD7CC]",
    accent: "var(--caution)",
    glow: "rgba(200, 74, 74, 0.25)",
    label: "失败",
    particleColor: "rgba(200,74,74,0.4)",
    secondaryGlow: "rgba(200, 74, 74, 0.1)",
    vignette: "radial-gradient(ellipse at center, transparent 50%, rgba(245,242,237,0.9) 100%)",
  },
};

const ACHIEVEMENT_ICONS: Record<string, typeof Trophy> = {
  shield: Shield,
  lightning: Lightning,
  target: Target,
  skull: Skull,
  crown: Crown,
  star: Star,
  hexagon: Hexagon,
  eyeSlash: EyeSlash,
  circle: Circle,
  sparkle: Spade,
};

const ACHIEVEMENT_RARITY_COLORS: Record<string, string> = {
  common: "var(--primary)",
  rare: "var(--warning)",
  legendary: "var(--caution)",
};

const ACHIEVEMENT_RARITY_GLOW: Record<string, string> = {
  common: "rgba(11, 29, 58, 0.3)",
  rare: "rgba(245, 158, 11, 0.4)",
  legendary: "rgba(200, 74, 74, 0.5)",
};

// ========================================================================
// 电影级粒子系统
// ========================================================================

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  delay: number;
  drift: number;
  color: string;
}

function CinematicParticles({ color, count = 40 }: { color: string; count?: number }) {
  const particles: Particle[] = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      speed: 8 + Math.random() * 20,
      opacity: 0.15 + Math.random() * 0.35,
      delay: Math.random() * 5,
      drift: (Math.random() - 0.5) * 30,
      color,
    })),
    [color, count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.opacity,
          }}
          animate={{
            y: ["-5%", "105%"],
            x: [`${p.x}%`, `${p.x + p.drift}%`],
            opacity: [p.opacity, 0],
          }}
          transition={{
            duration: p.speed,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  );
}

// ========================================================================
// 扫描线效果
// ========================================================================

function Scanlines() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 opacity-[0.03]"
      style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(11,29,58,0.15) 2px, rgba(11,29,58,0.15) 4px)",
      }}
      aria-hidden="true"
    />
  );
}

// ========================================================================
// 六边形雷达图 — 增强版
// ========================================================================

function RadarChart({ scores, accentColor }: { scores: FlagshipPeakRadarScore[]; accentColor: string }) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 110;
  const levels = 5;
  const angleSlice = (2 * Math.PI) / scores.length;
  const reducedMotion = useReducedMotion();

  const getPoint = (i: number, r: number) => ({
    x: cx + r * Math.cos(angleSlice * i - Math.PI / 2),
    y: cy + r * Math.sin(angleSlice * i - Math.PI / 2),
  });

  const gridPolygons = Array.from({ length: levels }, (_, level) => {
    const r = (radius / levels) * (level + 1);
    return scores.map((_, i) => getPoint(i, r)).map((p) => `${p.x},${p.y}`).join(" ");
  });

  const dataPoints = scores.map((s, i) => getPoint(i, (s.score / 100) * radius));
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const totalScore = scores.reduce((s, r) => s + r.score, 0);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-full w-full drop-shadow-[0_0_30px_rgba(11,29,58,0.2)]"
      role="img"
      aria-label="六维雷达评分图"
    >
      <defs>
        <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
          <stop offset="60%" stopColor={accentColor} stopOpacity="0.08" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </radialGradient>
        <filter id="glowFilter">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 背景放射 */}
      <circle cx={cx} cy={cy} r={radius + 15} fill="url(#radarGradient)" />

      {/* 网格 */}
      {gridPolygons.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke="rgba(11,29,58,0.08)"
          strokeWidth="1"
          strokeDasharray={i === levels - 1 ? "none" : "3 3"}
        />
      ))}

      {/* 轴线 */}
      {scores.map((_, i) => {
        const p = getPoint(i, radius);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="rgba(11,29,58,0.06)"
            strokeWidth="1"
          />
        );
      })}

      {/* 数据多边形 - 动画生长 */}
      <motion.polygon
        points={gridPolygons[0]}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        fill={`${accentColor}15`}
        stroke={accentColor}
        strokeWidth="2"
        strokeOpacity="0.7"
        filter="url(#glowFilter)"
        style={{
          clipPath: `polygon(${dataPolygon})`,
        }}
      />

      {/* 数据点 - 带光晕 */}
      {dataPoints.map((p, i) => (
        <g key={i}>
          <motion.circle
            cx={p.x}
            cy={p.y}
            r="8"
            fill={`${accentColor}15`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.12, duration: 0.4 }}
          />
          <motion.circle
            cx={p.x}
            cy={p.y}
            r="4"
            fill={accentColor}
            initial={{ opacity: 0, scale: 0 }}
            animate={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: [0.7, 1, 0.7], scale: [1, 1.2, 1] }}
            transition={reducedMotion
              ? { delay: 0.6 + i * 0.12, duration: 0.3 }
              : { delay: 0.6 + i * 0.12, duration: 2, repeat: Infinity, ease: "easeInOut" }
            }
          />
        </g>
      ))}

      {/* 标签 */}
      {scores.map((s, i) => {
        const p = getPoint(i, radius + 26);
        let textAnchor: "start" | "middle" | "end" = "middle";
        if (Math.abs(p.x - cx) < 5) textAnchor = "middle";
        else if (p.x < cx) textAnchor = "end";
        else textAnchor = "start";
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor={textAnchor}
            dominantBaseline="middle"
            className="fill-muted"
            style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.05em" }}
          >
            {s.label}
          </text>
        );
      })}

      {/* 中心分数 */}
      <motion.text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={accentColor}
        style={{ fontSize: "24px", fontFamily: "monospace", fontWeight: 700 }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5, type: "spring", stiffness: 200 }}
      >
        {totalScore}
      </motion.text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted"
        style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.1em" }}
      >
        总分
      </text>
    </svg>
  );
}

// ========================================================================
// 脉冲波纹效果
// ========================================================================

function PulseRing({ color, delay = 0 }: { color: string; delay?: number }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full border-2"
      style={{ borderColor: color }}
      initial={{ opacity: 0.6, scale: 0.6 }}
      animate={{ opacity: 0, scale: 1.5 }}
      transition={{ duration: 2, delay, repeat: Infinity, ease: "easeOut" }}
      aria-hidden="true"
    />
  );
}

// ========================================================================
// 滚动数字计数器
// ========================================================================

function AnimatedCounter({ value, duration = 1.5, className = "" }: { value: number; duration?: number; className?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    const controls = count;
    const target = value;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      controls.set(eased * target);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    return () => controls.set(0);
  }, [value, duration, count]);

  return <motion.span className={className}>{rounded}</motion.span>;
}

// ========================================================================
// 主结算组件
// ========================================================================

export default function FlagshipPeakSettlement({
  settlement,
  onContinue,
}: FlagshipPeakSettlementProps) {
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState<SettlementStage>("animation");
  const [showContent, setShowContent] = useState(false);
  const [stageFlash, setStageFlash] = useState(false);

  const theme = PHASE_THEME[settlement.reachedPhase] ?? PHASE_THEME.standard;
  const speedRankName = getFlagshipPeakSpeedRankName(settlement.finalSpeedRank);
  const seasonRankName = getFlagshipPeakSeasonRankName(settlement.finalSeasonRank);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const advanceStage = useCallback(() => {
    setStageFlash(true);
    setTimeout(() => setStageFlash(false), 300);
    setTimeout(() => {
      if (stage === "animation") setStage("ratings");
      else if (stage === "ratings") setStage("rewards");
    }, 150);
  }, [stage]);

  const hasLegendary = settlement.unlockedAchievements.some((a) => a.rarity === "legendary");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* 阶段背景 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} transition-colors duration-1000`} />

      {/* 电影级粒子 */}
      <CinematicParticles color={theme.particleColor} count={settlement.reachedPhase === "hell" ? 60 : 40} />

      {/* 扫描线 */}
      <Scanlines />

      {/* 网格 */}
      <div className="pointer-events-none absolute inset-0 z-10 starfield opacity-15" />

      {/* 暗角 */}
      <div className="pointer-events-none absolute inset-0 z-10" style={{ background: theme.vignette }} />

      {/* 阶段光晕 */}
      <motion.div
        className="pointer-events-none absolute -top-[10%] left-1/2 h-[70vh] w-[70vh] -translate-x-1/2 rounded-full blur-[130px]"
        style={{ backgroundColor: `${theme.glow}15` }}
        animate={reducedMotion ? {} : { scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute top-[40%] left-[20%] h-[40vh] w-[40vh] rounded-full blur-[100px]"
        style={{ backgroundColor: theme.secondaryGlow }}
        animate={reducedMotion ? {} : { scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      {/* 阶段切换闪光 */}
      <AnimatePresence>
        {stageFlash && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-30"
            style={{ backgroundColor: theme.accent }}
            initial={{ opacity: 0.15 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-20 mx-auto w-full max-w-2xl px-4 py-6">
        <AnimatePresence mode="wait">
          {!showContent ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5"
            >
              <div className="relative inline-flex h-20 w-20 items-center justify-center">
                <PulseRing color={theme.accent} delay={0} />
                <PulseRing color={theme.accent} delay={0.6} />
                <PulseRing color={theme.accent} delay={1.2} />
                <div className="relative z-10 inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/10 bg-primary/5 backdrop-blur-sm">
                  <motion.div
                    animate={reducedMotion ? {} : { rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Rocket size={28} weight="fill" style={{ color: theme.accent }} />
                  </motion.div>
                </div>
              </div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
                结算数据加载中
              </p>
              <div className="h-0.5 w-32 overflow-hidden rounded-full bg-primary/5">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: theme.accent }}
                  animate={reducedMotion ? {} : { x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              {/* ── Stage 1: 结算动画 ── */}
              {stage === "animation" && (
                <motion.div
                  key="animation"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92, filter: "blur(8px)" }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-8 py-10"
                >
                  {/* 结果图标 */}
                  <div className="relative inline-flex h-24 w-24 items-center justify-center">
                    <PulseRing color={settlement.victory ? "var(--success)" : theme.accent} delay={0} />
                    <PulseRing color={settlement.victory ? "var(--success)" : theme.accent} delay={0.8} />
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                      className="relative z-10"
                    >
                      {settlement.victory ? (
                        <Trophy size={80} weight="fill" className="drop-shadow-[0_0_30px_rgba(34,197,94,0.5)]" style={{ color: "var(--success)" }} />
                      ) : (
                        <Skull size={80} weight="fill" className="drop-shadow-[0_0_30px_rgba(200,74,74,0.5)]" style={{ color: theme.accent }} />
                      )}
                    </motion.div>
                  </div>

                  {/* 标题 */}
                  <div className="text-center">
                    <motion.h2
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className="font-display text-[clamp(1.8rem,5vw,3rem)] font-bold leading-[1.05] tracking-tight"
                    >
                      {settlement.victory ? (
                        <span className="text-gradient">任务完成</span>
                      ) : (
                        <span style={{ color: theme.accent }}>据点失守</span>
                      )}
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                      className="mt-3 text-sm leading-relaxed text-muted"
                    >
                      {settlement.victory
                        ? `旗舰巅峰全部50波征服，抵达${theme.label}`
                        : `抵达${theme.label}阶段，${settlement.reachedPhase === "genesis" ? "于创世之巅陨落" : settlement.reachedPhase === "void" ? "于虚空之中消逝" : settlement.reachedPhase === "abyss" ? "被深渊吞噬" : settlement.reachedPhase === "hell" ? "于地狱终局陨落" : "重新集结再战"}`}
                    </motion.p>
                  </div>

                  {/* 关键数据 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1, duration: 0.5 }}
                    className="flex gap-3 sm:gap-5"
                  >
                    <div className="station-panel p-4 text-center min-w-[90px]">
                      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">总分</p>
                      <p className="mt-1.5 font-display text-2xl font-bold tabular-nums text-primary">
                        <AnimatedCounter value={settlement.totalScore} />
                      </p>
                    </div>
                    <div className="station-panel p-4 text-center min-w-[90px]">
                      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">速度评级</p>
                      <motion.p
                        className="mt-1.5 font-display text-2xl font-bold tabular-nums"
                        style={{ color: theme.accent }}
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.5, type: "spring", stiffness: 300 }}
                      >
                        {speedRankName}
                      </motion.p>
                    </div>
                    <div className="station-panel p-4 text-center min-w-[90px]">
                      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">赛季段位</p>
                      <motion.p
                        className="mt-1.5 font-display text-2xl font-bold tabular-nums"
                        style={{ color: theme.accent }}
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.7, type: "spring", stiffness: 300 }}
                      >
                        {seasonRankName}
                      </motion.p>
                    </div>
                  </motion.div>

                  {/* 传说成就提示 */}
                  {hasLegendary && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 2, type: "spring", stiffness: 200 }}
                      className="flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger-subtle px-5 py-2.5"
                    >
                      <Hexagon size={20} weight="fill" className="text-danger" />
                      <span className="text-sm font-bold text-danger">传说成就已解锁！</span>
                    </motion.div>
                  )}

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.2 }}
                    onClick={advanceStage}
                    className="group flex items-center gap-2 rounded-2xl border border-primary/10 bg-primary-subtle px-7 py-3.5 text-sm font-bold text-primary/90 backdrop-blur-sm transition-all hover:border-primary/20 hover:bg-primary/10 focus-ring active:scale-95"
                  >
                    查看详细评级
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </motion.button>
                </motion.div>
              )}

              {/* ── Stage 2: 评级展示 ── */}
              {stage === "ratings" && (
                <motion.div
                  key="ratings"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24, filter: "blur(4px)" }}
                  transition={{ duration: 0.4 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-2">
                    <Hexagon size={20} weight="fill" style={{ color: theme.accent }} />
                    <h2 className="font-display text-lg font-bold tracking-tight">六维雷达评分</h2>
                  </div>

                  {/* 雷达图 */}
                  <div className="station-panel p-5">
                    <div className="mx-auto aspect-square max-w-[300px]">
                      <RadarChart scores={settlement.radarScores} accentColor={theme.accent} />
                    </div>
                  </div>

                  {/* 维度明细 */}
                  <div className="grid grid-cols-3 gap-2">
                    {settlement.radarScores.map((dim, i) => (
                      <motion.div
                        key={dim.dimension}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 * i, duration: 0.4 }}
                        className="station-panel group p-3 text-center transition-all hover:border-primary/10"
                      >
                        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                          {dim.label}
                        </p>
                        <motion.p
                          className="mt-1.5 font-display text-xl font-bold tabular-nums"
                          style={{ color: theme.accent }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + 0.08 * i, type: "spring", stiffness: 300 }}
                        >
                          {dim.score}
                        </motion.p>
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-primary/5">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: theme.accent }}
                            initial={{ width: 0 }}
                            animate={{ width: `${dim.score}%` }}
                            transition={{ delay: 0.7 + 0.08 * i, duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                        <p className="mt-1 text-[9px] text-muted">
                          {dim.weight * 100}% · {dim.weightedScore}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex justify-center gap-3 pt-1">
                    <button
                      onClick={() => setStage("animation")}
                      className="rounded-2xl border border-primary/10 bg-primary-subtle px-5 py-2.5 text-sm font-semibold text-primary/70 transition-all hover:border-primary/20 hover:text-primary/90 focus-ring active:scale-95"
                    >
                      返回
                    </button>
                    <button
                      onClick={advanceStage}
                      className="group flex items-center gap-2 rounded-2xl border border-primary/10 bg-primary-subtle px-6 py-2.5 text-sm font-bold text-primary/90 backdrop-blur-sm transition-all hover:border-primary/20 hover:bg-primary/10 focus-ring active:scale-95"
                    >
                      查看奖励
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Stage 3: 奖励明细 ── */}
              {stage === "rewards" && (
                <motion.div
                  key="rewards"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24, filter: "blur(4px)" }}
                  transition={{ duration: 0.4 }}
                  className="space-y-5"
                >
                  {/* 隐藏成就 */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Sparkle size={18} weight="fill" style={{ color: theme.accent }} />
                      <h2 className="font-display text-lg font-bold tracking-tight">隐藏成就</h2>
                      {settlement.unlockedAchievements.length > 0 && (
                        <span className="font-mono text-xs text-muted">
                          {settlement.unlockedAchievements.length}/11
                        </span>
                      )}
                    </div>
                    {settlement.unlockedAchievements.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="station-panel flex flex-col items-center gap-2 p-6"
                      >
                        <Lock size={28} className="text-muted" />
                        <p className="text-xs text-muted">本次未解锁隐藏成就</p>
                        <p className="text-[10px] text-muted">完成特定条件以解锁成就</p>
                      </motion.div>
                    ) : (
                      <div className="grid gap-2">
                        {settlement.unlockedAchievements.map((ach, i) => {
                          const Icon = ACHIEVEMENT_ICONS[ach.icon] ?? Star;
                          const color = ACHIEVEMENT_RARITY_COLORS[ach.rarity] ?? "var(--primary)";
                          const glow = ACHIEVEMENT_RARITY_GLOW[ach.rarity] ?? "rgba(11,29,58,0.3)";
                          const isLegendary = ach.rarity === "legendary";
                          return (
                            <motion.div
                              key={ach.id}
                              initial={{ opacity: 0, x: -30, scale: 0.95 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              transition={{ delay: 0.15 * i, type: "spring", stiffness: 200, damping: 18 }}
                              className="station-panel orbital-scan relative flex items-center gap-3 overflow-hidden p-3.5"
                              style={{
                                borderColor: `${color}30`,
                                boxShadow: `0 0 20px ${glow}`,
                              }}
                            >
                              {isLegendary && (
                                <motion.div
                                  className="absolute inset-0"
                                  style={{
                                    background: `radial-gradient(ellipse at 30% 50%, ${glow}, transparent 70%)`,
                                  }}
                                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                />
                              )}
                              <div
                                className="relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                style={{ backgroundColor: `${color}15`, color }}
                              >
                                <Icon size={20} weight="fill" />
                              </div>
                              <div className="relative z-10 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold">{ach.title}</p>
                                  <motion.span
                                    className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                    style={{ backgroundColor: `${color}20`, color }}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.4 + 0.15 * i, type: "spring" }}
                                  >
                                    {ach.rarity === "legendary" ? "传说" : ach.rarity === "rare" ? "稀有" : "普通"}
                                  </motion.span>
                                </div>
                                <p className="text-[11px] text-muted">{ach.description}</p>
                              </div>
                              <motion.div
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.5 + 0.15 * i, type: "spring", stiffness: 300 }}
                              >
                                <CheckCircle size={20} weight="fill" className="text-success" />
                              </motion.div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 波次里程碑 */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Flag size={18} weight="fill" style={{ color: theme.accent }} />
                      <h2 className="font-display text-lg font-bold tracking-tight">波次里程碑</h2>
                    </div>
                    <div className="flex gap-1.5">
                      {settlement.milestonesReached.map((m, i) => {
                        const reached = m.reached;
                        return (
                          <motion.div
                            key={m.wave}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i, duration: 0.4 }}
                            className={`flex-1 station-panel p-2.5 text-center transition-all ${
                              reached ? "orbital-scan" : "opacity-30"
                            }`}
                            style={reached ? { borderColor: `${theme.accent}30` } : undefined}
                          >
                            <p className="font-mono text-[10px] font-bold tabular-nums">
                              {m.wave}波
                            </p>
                            <p className="text-[9px] text-muted">{m.label}</p>
                            {reached && (
                              <motion.p
                                className="mt-1 text-[10px] font-bold text-success"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5 + 0.1 * i, type: "spring" }}
                              >
                                +{m.xpReward}XP
                              </motion.p>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 阶段奖励 */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Trophy size={18} weight="fill" style={{ color: theme.accent }} />
                      <h2 className="font-display text-lg font-bold tracking-tight">阶段奖励</h2>
                    </div>
                    <div className="grid gap-2">
                      {settlement.phaseRewards.map((pr, i) => {
                        const phaseTheme = PHASE_THEME[pr.phase] ?? PHASE_THEME.standard;
                        return (
                          <motion.div
                            key={pr.phase}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.12 * i, duration: 0.4 }}
                            className="station-panel orbital-scan flex items-center gap-3 p-3.5"
                            style={{ borderColor: `${phaseTheme.accent}20` }}
                          >
                            <div
                              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `${phaseTheme.accent}15`, color: phaseTheme.accent }}
                            >
                              {pr.phase === "standard" ? (
                                <Shield size={16} weight="bold" />
                              ) : pr.phase === "overclock" ? (
                                <Fire size={16} weight="bold" />
                              ) : pr.phase === "hell" ? (
                                <Skull size={16} weight="bold" />
                              ) : pr.phase === "abyss" ? (
                                <EyeSlash size={16} weight="bold" />
                              ) : pr.phase === "void" ? (
                                <Circle size={16} weight="bold" />
                              ) : (
                                <Sparkle size={16} weight="bold" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold">{pr.title}</p>
                              <p className="text-[11px] text-muted">{pr.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold tabular-nums text-success">
                                +{pr.xpReward}XP
                              </p>
                              <p className="text-[10px] text-muted">
                                +{pr.currencyReward} 货币
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 总计 */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="station-panel orbital-scan p-5"
                    style={{ borderColor: `${theme.accent}20` }}
                  >
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                          总经验
                        </p>
                        <motion.p
                          className="mt-1.5 font-display text-2xl font-bold tabular-nums text-primary"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.6, type: "spring", stiffness: 250 }}
                        >
                          +<AnimatedCounter value={settlement.totalXp} duration={1} />
                        </motion.p>
                      </div>
                      <div className="text-center">
                        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                          赛季货币
                        </p>
                        <motion.p
                          className="mt-1.5 font-display text-2xl font-bold tabular-nums"
                          style={{ color: theme.accent }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.8, type: "spring", stiffness: 250 }}
                        >
                          +<AnimatedCounter value={settlement.totalCurrency} duration={1} />
                        </motion.p>
                      </div>
                      <div className="text-center">
                        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                          总积分
                        </p>
                        <motion.p
                          className="mt-1.5 font-display text-2xl font-bold tabular-nums"
                          style={{ color: theme.accent }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1, type: "spring", stiffness: 250 }}
                        >
                          <AnimatedCounter value={settlement.totalScore} duration={1} />
                        </motion.p>
                      </div>
                    </div>
                  </motion.div>

                  <div className="flex justify-center gap-3 pt-3">
                    <button
                      onClick={() => setStage("ratings")}
                      className="rounded-2xl border border-primary/10 bg-primary-subtle px-5 py-2.5 text-sm font-semibold text-primary/70 transition-all hover:border-primary/20 hover:text-primary/90 focus-ring active:scale-95"
                    >
                      返回
                    </button>
                    <motion.button
                      onClick={onContinue}
                      className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-primary px-8 py-3.5 text-sm font-bold text-background shadow-lg shadow-primary/10 transition-all hover:bg-primary/90 focus-ring active:scale-95"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
                      <Rocket size={18} weight="fill" />
                      返回空间站
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ========================================================================
// 旗帜图标 (inline SVG)
// ========================================================================

function Flag({ size, className, weight, style }: { size: number; className?: string; weight: "fill"; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M5 21V3.90002C5 3.90002 5.87465 5.2249 7.62337 4.7749C9.37209 4.3249 10.5987 4.5749 11.7997 4.5749C13.3507 4.5749 14.625 4.1749 16.5 3.1749C18.0417 2.34157 19 2.1749 19 2.1749V14.1749C19 14.1749 17.7083 14.6749 16.5 15.1749C14.9583 15.8416 13.7007 16.1749 11.7997 16.1749C10.5987 16.1749 9.37209 15.9249 7.62337 16.3749C5.87465 16.8249 5 15.5 5 15.5V21Z" />
    </svg>
  );
}