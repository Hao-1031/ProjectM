import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crosshair,
  Shield,
  FirstAid,
  Coins,
  X,
  ArrowsClockwise,
  Warning,
  ShoppingCart,
} from "@phosphor-icons/react";

export type ShopItemType = "weapon" | "passive" | "consumable";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: ShopItemType;
  cost: number;
  level?: number;
  maxLevel?: number;
}

interface ShopModalProps {
  isOpen: boolean;
  resources: number;
  items: ShopItem[];
  onPurchase: (id: string) => void;
  onClose: () => void;
  onReroll?: () => void;
  loading?: boolean;
}

const TYPE_META: Record<ShopItemType, { label: string; icon: typeof Crosshair; color: string }> = {
  weapon: { label: "武器", icon: Crosshair, color: "text-primary" },
  passive: { label: "被动", icon: Shield, color: "text-success" },
  consumable: { label: "消耗", icon: FirstAid, color: "text-danger" },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panelVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 8 },
};

export default function ShopModal({
  isOpen,
  resources,
  items,
  onPurchase,
  onClose,
  onReroll,
  loading = false,
}: ShopModalProps) {
  const affordable = useMemo(
    () => new Set(items.filter((i) => i.cost <= resources).map((i) => i.id)),
    [items, resources]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute inset-0 z-40 flex items-center justify-center bg-background/88 p-4 backdrop-blur-md"
        >
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <header className="flex items-start justify-between border-b border-border p-5 md:p-6">
              <div>
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} weight="bold" className="text-primary" />
                  <h2 className="text-xl font-bold md:text-2xl">波次补给站</h2>
                </div>
                <p className="mt-1 max-w-md text-xs text-muted md:text-sm">
                  利用收集的资源强化装备，迎接下一波敌人。
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-xl border border-border bg-[var(--panel-raised)] px-3 py-1.5">
                  <Coins size={16} weight="bold" className="text-accent" />
                  <span className="font-mono text-sm font-bold">{resources}</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border p-2 text-muted transition-colors hover:border-primary/40 hover:text-foreground focus-ring active:scale-95"
                  aria-label="关闭商店"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
                <Warning size={40} weight="bold" className="text-muted" />
                <p className="text-sm text-muted">当前没有可购买的补给</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-background transition-transform hover:scale-[1.02] active:scale-95 focus-ring"
                >
                  返回战场
                </button>
              </div>
            ) : (
              <>
                <div className="p-5 md:p-6">
                  <div className="grid grid-flow-dense grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                    {items.map((item, index) => {
                      const meta = TYPE_META[item.type];
                      const Icon = meta.icon;
                      const canAfford = affordable.has(item.id);
                      const isFeatured = index === 0 && items.length > 1;

                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: index * 0.05,
                            duration: 0.25,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className={`group relative flex flex-col rounded-2xl border border-border bg-[var(--panel-raised)] p-4 transition-all hover:border-primary/40 hover:bg-panel md:p-5 ${
                            isFeatured
                              ? "col-span-2 row-span-2 md:col-span-2 md:row-span-2"
                              : "col-span-1"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div
                              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-background ${meta.color}`}
                            >
                              <Icon size={22} weight="bold" />
                            </div>
                            <span className="rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[10px] text-muted">
                              {meta.label}
                            </span>
                          </div>

                          <h3 className="mt-4 text-base font-bold md:text-lg">{item.name}</h3>
                          <p className="mt-1 flex-1 text-xs leading-relaxed text-muted md:text-sm">
                            {item.description}
                          </p>

                          {item.level !== undefined &&
                            item.maxLevel !== undefined &&
                            item.maxLevel > 0 && (
                              <p className="mt-3 font-mono text-[10px] text-muted">
                                Lv.{item.level} / {item.maxLevel}
                              </p>
                            )}

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div
                              className={`flex items-center gap-1 font-mono text-sm font-bold ${canAfford ? "text-accent" : "text-muted"}`}
                            >
                              <Coins size={14} weight="bold" />
                              {item.cost}
                            </div>
                            <button
                              type="button"
                              onClick={() => onPurchase(item.id)}
                              disabled={!canAfford || loading}
                              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all focus-ring active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                                canAfford && !loading
                                  ? "bg-primary text-background hover:scale-105 hover:shadow-lg hover:shadow-primary/15"
                                  : "border border-border bg-background text-muted"
                              }`}
                            >
                              {loading ? "处理中" : canAfford ? "购买" : "资源不足"}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <footer className="flex items-center justify-between border-t border-border bg-[var(--panel-raised)] px-5 py-3 md:px-6">
                  <p className="text-xs text-muted">资源仅在当前运行中有效</p>
                  <div className="flex items-center gap-2">
                    {onReroll && (
                      <button
                        type="button"
                        onClick={onReroll}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition-all hover:border-primary/40 hover:text-foreground focus-ring active:scale-95 disabled:opacity-50"
                      >
                        <ArrowsClockwise size={14} weight="bold" />
                        刷新列表
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-panel focus-ring active:scale-95"
                    >
                      关闭
                    </button>
                  </div>
                </footer>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
