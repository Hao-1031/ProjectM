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
  Robot,
  Radioactive,
  Lightning,
  Calendar,
  CastleTurret,
  Atom,
} from "@phosphor-icons/react";
import AuthButton from "@/components/AuthButton";
import BrandLogo from "@/components/BrandLogo";
import BrandFooter from "@/components/BrandFooter";
import DimensionBackground from "@/components/effects/DimensionBackground";
import { VERSION_WATERMARK } from "@/lib/version";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showNav?: boolean;
}

const NAV = [
  { href: "/", label: "指挥终端", icon: House },
  { href: "/landing", label: "官网", icon: Globe },
  { href: "/world", label: "世界观", icon: Radioactive },
  { href: "/guild", label: "公会", icon: CastleTurret },
  { href: "/peak-challenge", label: "巅峰挑战", icon: Lightning },
  { href: "/season", label: "赛季", icon: Calendar },
  { href: "/algorithms", label: "算法", icon: Atom },
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
  { href: "/game", label: "战场", icon: Crosshair },
  { href: "/modes", label: "模式", icon: GameController },
  { href: "/heroes", label: "英雄", icon: Users },
  { href: "/leaderboard", label: "战绩", icon: Trophy },
];

export default function Layout({ children, title, showNav = true }: LayoutProps) {
  const router = useRouter();
  const isIndex = router.pathname === "/";
  const reducedMotion = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-background text-foreground">
      <DimensionBackground intensity="subtle" />
      <div className="noise-overlay pointer-events-none fixed inset-0 z-0" />

      {showNav && !isIndex && (
        <motion.header
          initial={reducedMotion ? undefined : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
            <Link
              href="/"
              className="group flex items-center gap-2 transition-opacity hover:opacity-80 focus-ring rounded-lg"
            >
              <BrandLogo size={28} variant="icon" className="text-foreground" />
              <BrandLogo size={28} variant="wordmark" />
            </Link>

            {title && (
              <div className="hidden items-center gap-2 md:flex">
                <span className="h-4 w-px bg-border" />
                <h1 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                  {title}
                </h1>
              </div>
            )}

            <nav className="hidden items-center gap-0.5 lg:flex">
              {NAV.map((item) => {
                const active = router.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-medium transition-all focus-ring ${
                      active
                        ? "bg-primary-subtle text-primary"
                        : "text-muted hover:bg-panel-raised hover:text-foreground"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon size={14} weight={active ? "bold" : "regular"} />
                    <span className="hidden xl:inline">{item.label}</span>
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-2 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary/30 hover:text-foreground focus-ring lg:hidden"
                aria-label="打开菜单"
              >
                <List size={20} weight="bold" />
              </button>
            </div>
          </div>
        </motion.header>
      )}

      <main className="relative z-10 flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>

      <div className="version-watermark">{VERSION_WATERMARK}</div>

      {showNav && !isIndex && (
        <BrandFooter />
      )}

      {showNav && !isIndex && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
            {MOBILE_NAV.map((item) => {
              const active = router.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors focus-ring ${
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
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex h-full flex-col p-4">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2"
                >
                  <BrandLogo size={24} variant="icon" className="text-foreground" />
                  <BrandLogo size={24} variant="wordmark" />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary/30 hover:text-foreground focus-ring"
                  aria-label="关闭菜单"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
              <nav className="mt-8 grid gap-1.5">
                {NAV.map((item) => {
                  const active = router.pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                        active
                          ? "bg-primary-subtle text-primary"
                          : "text-foreground hover:bg-panel-raised"
                      }`}
                    >
                      <Icon size={20} weight={active ? "bold" : "regular"} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-auto pb-4">
                <div className="rounded-2xl border border-border bg-panel/60 p-4">
                  <p className="text-xs font-medium text-primary">多重宇宙 · 梦想家</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    深空探索 · 公平竞技 · 无付费加成
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}