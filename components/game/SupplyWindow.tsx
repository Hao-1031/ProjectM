import { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  Lightning,
  ShoppingCart,
  X,
  ArrowRight,
  Coins,
  Broom,
  FastForward,
  Heart,
  Shield,
  Sword,
  Fire,
  FirstAid,
  Plus,
} from "@phosphor-icons/react";

export interface SupplyWindowProps {
  /** 是否处于波次间歇（补给窗口） */
  inBreak: boolean;
  /** 补给窗口剩余秒数 */
  breakTimer: number;
  /** 当前波次 */
  currentWave: number;
  /** 总波次 */
  totalWaves: number;
  /** 玩家资源数 */
  resources: number;
  /** 是否手动打开商店 */
  shopOpen: boolean;
  /** 切换商店开关 */
  onToggleShop: () => void;
  /** 跳过补给窗口，立即开始下一波 */
  onSkipBreak: () => void;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: typeof Heart;
  maxPurchases?: number;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: "health_pack",
    name: "急救包",
    description: "恢复 30% 最大生命值",
    cost: 25,
    icon: FirstAid,
  },
  {
    id: "armor_plate",
    name: "护甲板",
    description: "获得临时护盾，吸收 50 点伤害",
    cost: 30,
    icon: Shield,
  },
  {
    id: "damage_boost",
    name: "过载弹头",
    description: "下波次伤害 +25%，持续 60 秒",
    cost: 40,
    icon: Sword,
    maxPurchases: 2,
  },
  {
    id: "speed_boost",
    name: "加速剂",
    description: "下波次移动速度 +30%，持续 60 秒",
    cost: 20,
    icon: Lightning,
    maxPurchases: 2,
  },
  {
    id: "core_repair",
    name: "核心修复",
    description: "修复据点核心 15% 耐久",
    cost: 50,
    icon: Fire,
  },
  {
    id: "heal_aura",
    name: "治疗立场",
    description: "部署治疗光环，每秒恢复 2% 生命，持续 30 秒",
    cost: 60,
    icon: Heart,
    maxPurchases: 1,
  },
];

export default function SupplyWindow({
  inBreak,
  breakTimer,
  currentWave,
  totalWaves,
  resources,
  shopOpen,
  onToggleShop,
  onSkipBreak,
}: SupplyWindowProps) {
  const [purchased, setPurchased] = useState<Record<string, number>>({});

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        onToggleShop();
      }
      if (e.key === "Escape") {
        if (shopOpen) {
          e.preventDefault();
          onToggleShop();
        }
      }
    },
    [onToggleShop, shopOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset purchases when new break starts
  useEffect(() => {
    if (inBreak) {
      setPurchased({});
    }
  }, [inBreak]);

  return (
    <AnimatePresence>
      {inBreak && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto absolute bottom-4 right-4 z-30 flex flex-col gap-2"
        >
          {/* 补给窗口主面板 */}
          <div className="flex items-center gap-2 rounded-2xl border border-success/20 bg-panel/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
            {/* 波次信息 */}
            <div className="flex flex-col items-center gap-0.5 rounded-xl bg-success/10 px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-success">
                波次 {currentWave + 1}/{totalWaves}
              </span>
              <span className="font-mono text-2xl font-bold tabular-nums text-success">
                {Math.ceil(breakTimer)}
              </span>
              <span className="text-[10px] text-muted">秒</span>
            </div>

            {/* 分隔 */}
            <div className="h-12 w-px bg-border" />

            {/* 补给标题 */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <Broom size={14} weight="bold" className="text-success" />
                <span className="text-xs font-bold text-success">补给窗口</span>
              </div>
              <p className="max-w-[180px] text-[10px] leading-relaxed text-muted">
                波次肃清。收集资源，强化装备，准备迎接下一波敌潮。
              </p>
            </div>

            {/* 操作按钮组 */}
            <div className="flex items-center gap-1.5">
              {/* 商店按钮 */}
              <button
                type="button"
                onClick={onToggleShop}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-panel-raised px-3 py-2 text-xs font-medium transition-all hover:border-primary/40 hover:text-primary focus-ring active:scale-95"
                title="打开补给商店 (B)"
              >
                <ShoppingCart size={14} weight="bold" />
                <span className="hidden sm:inline">商店</span>
                <kbd className="hidden rounded bg-background px-1 py-0.5 text-[10px] text-muted sm:inline">
                  B
                </kbd>
              </button>

              {/* 快速下一波 */}
              <button
                type="button"
                onClick={onSkipBreak}
                className="flex items-center gap-1.5 rounded-xl bg-success/10 px-3 py-2 text-xs font-bold text-success transition-all hover:bg-success hover:text-background focus-ring active:scale-95"
                title="快速下一波"
              >
                <FastForward size={14} weight="bold" />
                <span className="hidden sm:inline">下一波</span>
              </button>
            </div>
          </div>

          {/* 商店面板 */}
          <AnimatePresence>
            {shopOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-border bg-panel/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={16} weight="bold" className="text-primary" />
                    <span className="text-sm font-bold">波次补给站</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-lg border border-border bg-panel-raised px-2 py-1">
                      <Coins size={14} weight="bold" className="text-accent" />
                      <span className="font-mono text-xs font-bold">{resources}</span>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleShop}
                      className="rounded-lg p-1.5 text-muted transition-colors hover:text-foreground focus-ring"
                      title="关闭 (ESC)"
                    >
                      <X size={14} weight="bold" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {SHOP_ITEMS.map((item) => {
                    const count = purchased[item.id] ?? 0;
                    const maxed = item.maxPurchases !== undefined && count >= item.maxPurchases;
                    const canAfford = resources >= item.cost;
                    const disabled = maxed || !canAfford;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          if (!disabled) {
                            setPurchased((prev) => ({
                              ...prev,
                              [item.id]: (prev[item.id] ?? 0) + 1,
                            }));
                          }
                        }}
                        className="flex items-start gap-3 rounded-xl border border-border bg-panel-raised p-3 text-left transition-all hover:border-primary/40 hover:bg-panel focus-ring disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <item.icon size={18} weight="bold" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold">{item.name}</span>
                            <span className="flex shrink-0 items-center gap-0.5 font-mono text-[10px] font-bold tabular-nums text-accent">
                              <Coins size={10} weight="bold" />
                              {item.cost}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
                            {item.description}
                          </p>
                          {maxed && (
                            <span className="mt-1 inline-flex items-center gap-0.5 rounded-full border border-success/30 bg-success/10 px-1.5 py-0.5 text-[8px] font-bold text-success">
                              已购满
                            </span>
                          )}
                          {count > 0 && !maxed && (
                            <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-muted">
                              已购 {count}/{item.maxPurchases ?? "∞"}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <p className="text-[10px] text-muted">
                    购买后即刻生效，资源在波次间收集
                  </p>
                  <button
                    type="button"
                    onClick={onSkipBreak}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-background transition-all hover:bg-primary/90 focus-ring active:scale-95"
                  >
                    <FastForward size={14} weight="bold" />
                    快速下一波
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}