import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Globe,
  Shield,
  Lightning,
  Brain,
  Trophy,
  Sword,
  Target,
  Anchor,
  Atom,
  CaretRight,
  Lock,
  Star,
  ArrowRight,
} from "@phosphor-icons/react";
import BrandLogo from "@/components/BrandLogo";
import DimensionBackground from "@/components/effects/DimensionBackground";

interface DimensionNode {
  id: string;
  name: string;
  subtitle: string;
  icon: typeof Shield;
  accent: string;
  x: number;
  y: number;
  unlocked: boolean;
  completed: boolean;
  href: string;
  connections: string[];
}

const DIMENSION_MAP: DimensionNode[] = [
  {
    id: "defense",
    name: "据点防守",
    subtitle: "锚点维度",
    icon: Shield,
    accent: "var(--success)",
    x: 50,
    y: 25,
    unlocked: true,
    completed: false,
    href: "/game?mode=defense&multiplayer=1",
    connections: ["extreme", "roguelike"],
  },
  {
    id: "extreme",
    name: "极限生存",
    subtitle: "压力维度",
    icon: Lightning,
    accent: "var(--entropy)",
    x: 75,
    y: 40,
    unlocked: true,
    completed: false,
    href: "/game?mode=extreme-survival",
    connections: ["defense", "peak"],
  },
  {
    id: "roguelike",
    name: "肉鸽构筑",
    subtitle: "混沌维度",
    icon: Brain,
    accent: "var(--quantum)",
    x: 25,
    y: 40,
    unlocked: true,
    completed: false,
    href: "/game?mode=survival",
    connections: ["defense", "campaign"],
  },
  {
    id: "peak",
    name: "巅峰挑战",
    subtitle: "竞技维度",
    icon: Trophy,
    accent: "var(--anchor)",
    x: 75,
    y: 60,
    unlocked: true,
    completed: false,
    href: "/game?mode=peak-challenge",
    connections: ["extreme", "deathmatch"],
  },
  {
    id: "campaign",
    name: "战役模式",
    subtitle: "叙事维度",
    icon: Target,
    accent: "var(--accent)",
    x: 25,
    y: 60,
    unlocked: true,
    completed: false,
    href: "/game?mode=campaign",
    connections: ["roguelike", "deathmatch"],
  },
  {
    id: "deathmatch",
    name: "个人死斗",
    subtitle: "冲突维度",
    icon: Sword,
    accent: "var(--danger)",
    x: 50,
    y: 75,
    unlocked: true,
    completed: false,
    href: "/game?mode=deathmatch",
    connections: ["peak", "campaign"],
  },
  {
    id: "anchor",
    name: "维度锚点",
    subtitle: "核心枢纽",
    icon: Anchor,
    accent: "var(--primary)",
    x: 50,
    y: 50,
    unlocked: true,
    completed: false,
    href: "/base",
    connections: ["defense", "extreme", "roguelike", "peak", "campaign", "deathmatch"],
  },
];

export default function WorldPage() {
  const reducedMotion = useReducedMotion();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const selected = DIMENSION_MAP.find((n) => n.id === selectedNode);

  return (
    <div className="relative min-h-[100dvh] bg-background text-foreground">
      <Head>
        <title>维度网络 - Project M</title>
        <meta name="description" content="探索Project M的多元宇宙维度网络，选择你的维度开始穿越。" />
      </Head>
      <DimensionBackground intensity="high" />
      <div className="noise-overlay" />

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo size={28} variant="icon" className="text-primary" />
          <BrandLogo size={28} variant="wordmark" />
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/" className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:text-foreground">
            返回枢纽
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            <Globe size={12} weight="bold" />
            维度网络
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
            多元宇宙<span className="text-gradient">维度地图</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            点击维度节点查看详情，选择你的穿越目的地
          </p>
        </div>

        <div className="relative mx-auto aspect-[16/10] max-w-4xl">
          {/* Connection lines */}
          <svg className="absolute inset-0 h-full w-full" style={{ zIndex: 1 }}>
            {DIMENSION_MAP.map((node) =>
              node.connections.map((targetId) => {
                const target = DIMENSION_MAP.find((n) => n.id === targetId);
                if (!target) return null;
                return (
                  <line
                    key={`${node.id}-${targetId}`}
                    x1={`${node.x}%`}
                    y1={`${node.y}%`}
                    x2={`${target.x}%`}
                    y2={`${target.y}%`}
                    stroke="var(--primary)"
                    strokeWidth="0.5"
                    strokeOpacity="0.2"
                    strokeDasharray="4 4"
                  />
                );
              })
            )}
          </svg>

          {/* Center anchor */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: "50%", top: "50%", zIndex: 2 }}
          >
            <div className="bridge-glow rounded-full p-4">
              <div className="holo-ring inline-flex h-16 w-16 items-center justify-center">
                <BrandLogo size={32} variant="icon" className="text-primary" />
              </div>
            </div>
          </div>

          {/* Dimension nodes */}
          {DIMENSION_MAP.filter((n) => n.id !== "anchor").map((node) => {
            const Icon = node.icon;
            const isSelected = selectedNode === node.id;
            return (
              <motion.button
                key={node.id}
                initial={reducedMotion ? undefined : { opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 * DIMENSION_MAP.indexOf(node) }}
                onClick={() => setSelectedNode(isSelected ? null : node.id)}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${node.x}%`, top: `${node.y}%`, zIndex: 3 }}
              >
                <div
                  className={`flex flex-col items-center gap-1.5 transition-all ${
                    isSelected ? "scale-110" : "hover:scale-105"
                  }`}
                >
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border transition-all ${
                      isSelected
                        ? "border-primary/40 bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-primary/10 bg-panel/80 hover:border-primary/20"
                    }`}
                    style={{ color: node.accent }}
                  >
                    <Icon size={20} weight="bold" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider">{node.name}</p>
                    <p className="text-[9px] text-muted">{node.subtitle}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selected node info */}
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bridge-panel holo-scan bridge-glow mx-auto mt-8 max-w-md p-5"
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${selected.accent}15`, color: selected.accent }}
              >
                {(() => { const Icon = selected.icon; return <Icon size={20} weight="bold" />; })()}
              </span>
              <div>
                <h3 className="font-display text-lg font-bold">{selected.name}</h3>
                <p className="text-xs text-muted">{selected.subtitle}</p>
              </div>
              {selected.completed && (
                <Star size={16} weight="fill" className="ml-auto text-anchor" />
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 font-mono tabular-nums text-[11px] text-muted">
              <span className="flex items-center gap-1">
                连接: {selected.connections.length} 个维度
              </span>
            </div>
            <Link
              href={selected.href}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-background transition-all hover:bg-primary/90"
            >
              穿越此维度
              <CaretRight size={14} weight="bold" />
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  );
}