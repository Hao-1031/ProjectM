import Link from "next/link";
import { useRouter } from "next/router";
import { motion, useReducedMotion } from "framer-motion";
import { House, Trophy, Users, Question, Info, Gear, Crosshair, GameController, Sword } from "@phosphor-icons/react";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showNav?: boolean;
}

const NAV = [
  { href: "/", label: "指挥终端", icon: House },
  { href: "/modes", label: "模式", icon: GameController },
  { href: "/heroes", label: "英雄", icon: Users },
  { href: "/armory", label: "军械库", icon: Sword },
  { href: "/base", label: "基地", icon: Crosshair },
  { href: "/leaderboard", label: "战绩", icon: Trophy },
  { href: "/help", label: "指南", icon: Question },
  { href: "/about", label: "关于", icon: Info },
  { href: "/settings", label: "设置", icon: Gear },
];

export default function Layout({ children, title, showNav = true }: LayoutProps) {
  const router = useRouter();
  const isIndex = router.pathname === "/";
  const reducedMotion = useReducedMotion();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      {showNav && !isIndex && (
        <motion.header
          initial={reducedMotion ? undefined : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link
              href="/"
              className="group flex items-center gap-2 text-primary transition-colors hover:text-foreground focus-ring rounded"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <Users size={16} weight="bold" />
              </span>
              <span className="font-mono text-sm uppercase tracking-widest">Project M</span>
            </Link>

            {title && (
              <h1 className="hidden font-mono text-sm uppercase tracking-widest text-muted md:block">
                {title}
              </h1>
            )}

            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => {
                const active = router.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all focus-ring ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted hover:bg-panel-raised hover:text-foreground"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon size={14} weight={active ? "bold" : "regular"} />
                    <span>{item.label}</span>
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-2 -bottom-1 h-px bg-primary/60"
                        transition={{ duration: 0.25 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </motion.header>
      )}

      <main className="flex-1">{children}</main>

      {showNav && !isIndex && (
        <footer className="border-t border-border py-6 text-center text-xs text-muted">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 md:flex-row">
            <p>Project M · 本地优先 · 数据永不离开浏览器</p>
            <div className="flex gap-4">
              <Link href="/" className="hover:text-foreground focus-ring rounded">
                首页
              </Link>
              <Link href="/about" className="hover:text-foreground focus-ring rounded">
                关于
              </Link>
              <Link href="/settings" className="hover:text-foreground focus-ring rounded">
                设置
              </Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
