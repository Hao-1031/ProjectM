import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Crosshair,
  Sword,
  Users,
  Trophy,
  ClockCounterClockwise,
  ArrowRight,
  Broadcast,
  House,
  UserPlus,
  Rss,
  Shield,
  Fire,
  Lightning,
  Planet,
} from "@phosphor-icons/react";
import { VERSION_WATERMARK, DESIGN_SYSTEM } from "@/lib/version";

const pvp = DESIGN_SYSTEM.pvp;
const pvpColors = pvp.colors;

const PVP_MODES = [
  {
    id: "matchmaking",
    title: "休闲匹配",
    description: "随机匹配同段位对手，BO3/BO5 积分决斗。",
    icon: Users,
    href: "/pvp/matchmaking",
    color: pvpColors.primary,
    available: true,
  },
  {
    id: "custom",
    title: "自定义房间",
    description: "创建或加入自定义房间，与好友切磋。",
    icon: House,
    href: "/pvp/custom-room",
    color: pvpColors.accent,
    available: true,
  },
  {
    id: "ranked",
    title: "天梯排位",
    description: "高强度的积分排位赛，冲击传说段位。",
    icon: Trophy,
    href: "/pvp/ranked",
    color: "#22C55E",
    available: false,
  },
];

const QUICK_STATS = [
  { label: "今日对局", value: "--", icon: Sword },
  { label: "在线玩家", value: "--", icon: Rss },
  { label: "当前段位", value: "未定级", icon: Shield },
  { label: "胜率", value: "--%", icon: Fire },
];

export default function PvPIndex() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden" style={{ background: pvpColors.background, color: pvpColors.foreground }}>
      <div className="noise-overlay" />
      <div className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, ${pvpColors.primary}15 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2 group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <Planet size={20} weight="bold" style={{ color: pvpColors.primary }} />
            <span className="font-mono text-sm font-bold uppercase tracking-widest" style={{ color: pvpColors.foreground }}>多重宇宙</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/pvp/matchmaking" className="text-sm font-medium text-white/60 hover:text-white transition-colors">匹配</Link>
            <Link href="/pvp/custom-room" className="text-sm font-medium text-white/60 hover:text-white transition-colors">自定义</Link>
            <Link href="/pvp/history" className="text-sm font-medium text-white/60 hover:text-white transition-colors">战绩</Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-24">
        {/* Hero */}
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${pvpColors.primary})` }} />
            <Fire size={24} weight="fill" style={{ color: pvpColors.primary }} />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">工业擂台</span>
            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${pvpColors.primary}, transparent)` }} />
          </div>

          <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[0.95] tracking-tight">
            <span style={{ color: pvpColors.foreground }}>一人一擂</span>
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${pvpColors.primary}, ${pvpColors.accent})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              决出胜负
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-white/50">
            1v1 积分决斗，BO3/BO5 赛制。选择你的英雄与武器，在 8 张竞技地图中证明实力。
            休闲匹配、自定义房间、天梯排位 —— 三重模式任你选择。
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {QUICK_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border p-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <stat.icon size={18} weight="bold" style={{ color: pvpColors.primary }} />
              <p className="mt-2 font-mono text-2xl font-bold" style={{ color: pvpColors.foreground }}>{stat.value}</p>
              <p className="text-xs text-white/40">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Mode Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {PVP_MODES.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {mode.available ? (
                <Link
                  href={mode.href}
                  className="group block rounded-xl border p-6 transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ background: `${mode.color}15` }}>
                      <mode.icon size={22} weight="bold" style={{ color: mode.color }} />
                    </div>
                    <ArrowRight size={18} className="text-white/20 group-hover:text-white/60 transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: pvpColors.foreground }}>{mode.title}</h3>
                  <p className="mt-2 text-sm text-white/40">{mode.description}</p>
                </Link>
              ) : (
                <div
                  className="block rounded-xl border p-6 opacity-50 cursor-not-allowed"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    borderColor: "rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ background: `${mode.color}10` }}>
                      <mode.icon size={22} weight="bold" style={{ color: mode.color }} />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/20">即将推出</span>
                  </div>
                  <h3 className="text-lg font-bold text-white/40">{mode.title}</h3>
                  <p className="mt-2 text-sm text-white/20">{mode.description}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-4 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/15">{VERSION_WATERMARK} · 工业擂台</p>
      </footer>
    </div>
  );
}