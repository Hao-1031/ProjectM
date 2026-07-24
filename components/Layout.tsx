import Link from "next/link";
import { useRouter } from "next/router";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  House,
  Trophy,
  Users,
  Question,
  Info,
  Gear,
  Crosshair,
  GameController,
  Sword,
  Globe,
  Shield,
  List,
  X,
} from "@phosphor-icons/react";
import AuthButton from "@/components/AuthButton";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showNav?: boolean;
}

const NAV = [
  { href: "/", label: "指挥终端", icon: House },
  { href: "/landing", label: "官网", icon: Globe },
  { href: "/modes", label: "模式", icon: GameController },
  { href: "/heroes", label: "英雄", icon: Users },
  { href: "/armory", label: "军械库", icon: Sword },
  { href: "/base", label: "基地", icon: Crosshair },
  { href: "/leaderboard", label: "战绩", icon: Trophy },
  { href: "/help", label: "指南", icon: Question },
  { href: "/about", label: "关于", icon: Info },
  { href: "/settings", label: "设置", icon: Gear },
  { href: "/admin", label: "后台", icon: Shield },
];

const MOBILE_NAV = [
  { href: "/", label: "首页", icon: House },
  { href: "/modes", label: "模式", icon: GameController },
  { href: "/heroes", label: "英雄", icon: Users },
  { href: "/leaderboard", label: "战绩", icon: Trophy },
  { href: "/settings", label: "设置", icon: Gear },
];

export default function Layout({ children, title, showNav = true }: LayoutProps) {
  const router = useRouter();
  const isIndex = router.pathname === "/";
  const reducedMotion = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

            <div className="flex items-center gap-2">
              <AuthButton />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary/40 hover:text-foreground focus-ring md:hidden"
                aria-label="打开菜单"
              >
                <List size={20} weight="bold" />
              </button>
            </div>
          </div>
        </motion.header>
      )}

      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>

      {showNav && !isIndex && (
        <footer className="border-t border-border py-3 text-center text-xs text-muted md:py-4">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 md:flex-row">
            <p>Project M · 公平竞技 · 无付费加成</p>
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

      {showNav && !isIndex && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/90 backdrop-blur-md md:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
            {MOBILE_NAV.map((item) => {
              const active = router.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors focus-ring ${
                    active ? "text-primary" : "text-muted"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={22} weight={active ? "fill" : "regular"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-md md:hidden"
          >
            <div className="flex h-full flex-col p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm uppercase tracking-widest text-primary">Project M</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary/40 hover:text-foreground focus-ring"
                  aria-label="关闭菜单"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
              <nav className="mt-8 grid gap-2">
                {NAV.map((item) => {
                  const active = router.pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-panel-raised"
                      }`}
                    >
                      <Icon size={20} weight={active ? "bold" : "regular"} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
