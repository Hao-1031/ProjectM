import { useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Storefront,
  TShirt,
  Smiley,
  Medal,
  Sword,
  Coin,
  Star,
  CheckCircle,
  ShoppingCart,
  ArrowLeft,
  Sparkle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { buildStoreSections, type StoreItem, type StoreCategory } from "@/lib/game/store";

import type { Icon } from "@phosphor-icons/react";

const CATEGORY_ICONS: Record<StoreCategory, Icon> = {
  heroes: Sword,
  skins: TShirt,
  emotes: Smiley,
  badges: Medal,
};

export default function StorePage() {
  const reducedMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState<StoreCategory>("heroes");
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  const sections = useMemo(
    () => buildStoreSections([], [], ["recon"], null),
    []
  );

  const activeSection = useMemo(
    () => sections.find((s) => s.category === activeCategory) || sections[0],
    [sections, activeCategory]
  );

  const handlePurchase = async (item: StoreItem) => {
    setPurchasing(item.id);
    setPurchaseSuccess(null);

    try {
      const res = await fetch("/api/store/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });

      if (res.ok) {
        setPurchaseSuccess(item.id);
        setTimeout(() => setPurchaseSuccess(null), 2000);
      }
    } catch {
      // Purchase failed silently in demo
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background text-foreground">
      <div className="noise-overlay" />
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-20" />
      <div className="pointer-events-none absolute inset-0 bridge-grid opacity-30" />

      <div className="pointer-events-none fixed -left-[10%] -top-[10%] h-[40vh] w-[40vh] rounded-full bg-primary/5 blur-[100px]" />
      <div className="pointer-events-none fixed -bottom-[10%] -right-[10%] h-[40vh] w-[40vh] rounded-full bg-accent/5 blur-[100px]" />

      {/* Header */}
      <header className="relative z-10 border-b border-primary/10 bg-panel/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg font-mono text-sm font-bold uppercase tracking-[0.15em] text-primary transition-colors hover:text-primary/80"
          >
            <ArrowLeft size={18} weight="bold" />
            返回舰桥
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-xs text-muted">
              <Coin size={14} weight="fill" className="text-accent" />
              2,500
            </span>
            <span className="flex items-center gap-1.5 font-mono text-xs text-muted">
              <Star size={14} weight="fill" className="text-primary" />
              500
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-8 lg:px-8">
        {/* Hero */}
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <div className="bridge-panel holo-scan p-6 lg:p-8">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="flex items-center gap-3">
              <span className="holo-ring inline-flex h-10 w-10 items-center justify-center text-primary">
                <Storefront size={22} weight="bold" />
              </span>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
                  舰桥军械库
                </h1>
                <p className="mt-1 text-sm text-muted">
                  使用战斗获得的货币兑换外观、英雄与徽章。无付费加成，仅外观与便捷。
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {sections.map((section) => {
            const Icon = CATEGORY_ICONS[section.category];
            const isActive = activeCategory === section.category;
            return (
              <button
                key={section.category}
                onClick={() => setActiveCategory(section.category)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "border border-primary/10 text-muted hover:border-primary/20 hover:text-foreground"
                }`}
              >
                <Icon size={16} weight={isActive ? "fill" : "bold"} />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Section Info */}
        <motion.div
          key={activeCategory}
          initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <p className="text-sm text-muted">{activeSection.description}</p>
        </motion.div>

        {/* Items Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="wait">
            {activeSection.items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <StoreCard
                  item={item}
                  purchasing={purchasing === item.id}
                  success={purchaseSuccess === item.id}
                  onPurchase={() => handlePurchase(item)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {activeSection.items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <Storefront size={48} weight="thin" />
            <p className="mt-4 text-sm">该分类暂无商品</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-primary/10 py-4 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          公平竞技 · 无付费加成 · 多重宇宙
        </p>
      </footer>
    </div>
  );
}

function StoreCard({
  item,
  purchasing,
  success,
  onPurchase,
}: {
  item: StoreItem;
  purchasing: boolean;
  success: boolean;
  onPurchase: () => void;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={`bridge-panel group relative flex flex-col p-4 transition-all ${
        item.owned ? "opacity-60" : "hover:border-primary/20"
      }`}
    >
      {/* Color Preview Bar */}
      <div
        className="mb-3 h-16 w-full rounded-lg"
        style={{
          background: `linear-gradient(135deg, ${item.color}40 0%, ${item.color} 50%, ${item.color}80 100%)`,
        }}
      />

      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm">{item.name}</h3>
            <p className="mt-1 text-xs text-muted line-clamp-2">{item.description}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1 font-mono text-xs">
          {item.currency === "coins" ? (
            <Coin size={14} weight="fill" className="text-accent" />
          ) : (
            <Star size={14} weight="fill" className="text-primary" />
          )}
          <span className={item.owned ? "text-muted line-through" : "text-foreground"}>
            {item.cost}
          </span>
        </span>

        {item.owned ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-success">
            <CheckCircle size={14} weight="fill" />
            已拥有
          </span>
        ) : success ? (
          <motion.span
            initial={reducedMotion ? undefined : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1 text-xs font-semibold text-success"
          >
            <Sparkle size={14} weight="fill" />
            已购买
          </motion.span>
        ) : (
          <button
            onClick={onPurchase}
            disabled={purchasing}
            className="flex items-center gap-1.5 rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {purchasing ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            ) : (
              <ShoppingCart size={14} weight="bold" />
            )}
            购买
          </button>
        )}
      </div>
    </div>
  );
}