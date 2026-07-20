import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { House, Crosshair, Trophy, Question, Info, Gear } from "@phosphor-icons/react";

interface FooterProps {
  totalRuns?: number;
  totalKills?: number;
  bestKills?: number;
}

const LINKS = [
  { href: "/", label: "指挥终端", icon: House },
  { href: "/base", label: "基地", icon: Crosshair },
  { href: "/leaderboard", label: "战绩", icon: Trophy },
  { href: "/help", label: "指南", icon: Question },
  { href: "/about", label: "关于", icon: Info },
  { href: "/settings", label: "设置", icon: Gear },
];

export default function Footer({ totalRuns = 0, totalKills = 0, bestKills = 0 }: FooterProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.footer
      initial={reducedMotion ? undefined : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="border-t border-border bg-panel/30"
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-primary focus-ring rounded"
          >
            <span className="font-mono text-xs uppercase tracking-widest">Project M</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            冷色调科技末日风格的幸存者游戏。公平竞技，无付费加成。
          </p>
          <div className="mt-4 flex gap-4 text-xs text-muted">
            <span>出战 {totalRuns}</span>
            <span>击杀 {totalKills}</span>
            <span>最佳 {bestKills}</span>
          </div>
        </div>

        <nav className="grid grid-cols-2 gap-3 md:col-span-4 md:grid-cols-3">
          {LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted transition-all hover:bg-panel hover:text-foreground focus-ring"
              >
                <Icon size={16} className="transition-colors group-hover:text-primary" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="md:col-span-3">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-muted">公平竞技</h4>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            所有数值成长均通过局内升级与战斗获取。商店、通行证与外观系统不出售任何影响战局的属性或英雄。
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted md:flex-row">
          <p>公平竞技 · 无付费加成 · Project M</p>
          <p>Built with Next.js · Tailwind CSS · Framer Motion</p>
        </div>
      </div>
    </motion.footer>
  );
}
