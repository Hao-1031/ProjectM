import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { Play, GameController, Trophy, Crosshair } from "@phosphor-icons/react";

const FOOTER_LINKS = [
  { label: "游戏首页", href: "/" },
  { label: "战绩榜", href: "/leaderboard" },
  { label: "关于", href: "/about" },
];

const FOOTER_IMAGE =
  "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Epic%20cinematic%20footer%20call%20to%20action%2C%20glowing%20teal%20crosshair%20symbol%20floating%20over%20ash%20wasteland%2C%20distant%20fortified%20outpost%2C%20embers%20and%20dust%20particles%2C%20deep%20charcoal%20and%20muted%20teal%20ambient%20light%2C%20minimalist%20composition%2C%20no%20text&image_size=landscape_16_9";

export default function FooterCTA() {
  const reducedMotion = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <footer className="relative mx-auto max-w-7xl px-4 pb-4 pt-4 md:pb-5 md:pt-5">
      <motion.div
        ref={ref}
        initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
        animate={isInView || reducedMotion ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[2rem] border border-border bg-panel"
      >
        <img
          src={FOOTER_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/90 to-panel/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-panel/80 via-transparent to-panel/40" />
        <div className="absolute inset-0 hazard-stripes opacity-20" />

        <div className="relative flex min-h-[200px] flex-col items-start justify-between p-4 md:p-5 lg:flex-row lg:items-end">
          <div className="max-w-xl">
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">
              下一座据点
              <br />
              <span className="text-gradient">由你守护</span>
            </h2>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">
              L3V100 旗舰版已上线。无需下载，浏览器即玩。公平竞技，只拼操作与策略。
            </p>
          </div>

          <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row lg:mt-0 lg:w-auto">
            <Link
              href="/game?mode=defense"
              className="group relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-5 text-sm font-bold text-background shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 focus-ring active:scale-95"
            >
              <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
              <Play size={16} weight="fill" />
              <span className="whitespace-nowrap">立即开战</span>
            </Link>
            <Link
              href="/modes"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-background/80 px-4 text-xs font-semibold backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-background focus-ring active:scale-95"
            >
              <GameController size={14} />
              <span className="whitespace-nowrap">全部模式</span>
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Crosshair size={12} weight="bold" />
          </span>
          <span className="font-mono font-bold uppercase tracking-widest text-foreground">
            Project M
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground focus-ring rounded"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground focus-ring rounded"
          >
            <Trophy size={12} />
            排行榜
          </Link>
        </div>
        <p className="text-center sm:text-right">
          公平竞技 · 无付费加成
        </p>
      </div>
    </footer>
  );
}
