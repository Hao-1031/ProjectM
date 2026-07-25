"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Snowflake,
  Butterfly,
  PawPrint,
  Lightning,
  Crosshair,
  CaretRight,
  Sparkle,
  Sword,
  Fire,
  Target,
  Skull,
  AirplaneTilt,
  CastleTurret,
  Coin,
  Lock,
  Check,
  ShoppingCart,
  Star,
  Crown,
  PaintBrush,
  WarningCircle,
  Smiley,
  UserCircle,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import { HERO_DEFS } from "@/lib/game/heroes";
import type { HeroTalent, HeroId } from "@/lib/game/types";
import {
  loadSave,
  buyHero,
  buyCosmetic,
  equipSkin,
  isHeroUnlocked,
  isCosmeticOwned,
  getEquippedSkin,
  setSelectedHero,
  type SaveData,
} from "@/lib/game/save";
import {
  COSMETICS,
  getHeroCost,
  getSkinsForHero,
  getCosmeticsByType,
  type CosmeticType,
  type CosmeticItem,
} from "@/lib/game/cosmetics";

const ICONS: Record<string, typeof Snowflake> = {
  nitrogen: Snowflake,
  twilight: Butterfly,
  leopard: PawPrint,
  recon: Crosshair,
  viper: Skull,
  falcon: AirplaneTilt,
  bastion: CastleTurret,
};

const TABS: { id: "heroes" | "skins" | "emotes" | "badges"; label: string; icon: typeof UserCircle }[] = [
  { id: "heroes", label: "英雄", icon: UserCircle },
  { id: "skins", label: "皮肤", icon: PaintBrush },
  { id: "emotes", label: "表情", icon: Smiley },
  { id: "badges", label: "徽章", icon: Crown },
];

const TYPE_LABELS: Record<CosmeticType, string> = {
  skin: "皮肤",
  emote: "表情",
  badge: "徽章",
};

function TalentCard({ talent, index }: { talent: HeroTalent; index: number }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="flex items-start gap-1.5 rounded-lg border border-border bg-panel/60 p-1.5"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-panel-raised text-[10px] font-bold text-muted">
        {index + 1}
      </span>
      <div>
        <p className="text-[11px] font-semibold">{talent.name}</p>
        <p className="text-[10px] leading-relaxed text-muted">{talent.description}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">
          最高等级 {talent.maxLevel}
        </p>
      </div>
    </motion.div>
  );
}

function CoinBadge({ coins }: { coins: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/10 px-3 py-1.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-warning/15 text-warning">
        <Coin size={14} weight="fill" />
      </span>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">游戏币</p>
        <p className="font-mono text-sm font-bold text-warning">{coins}</p>
      </div>
    </div>
  );
}

interface Toast {
  message: string;
  type: "success" | "error";
}

function ToastMessage({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 2200);
    return () => clearTimeout(id);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className={`fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium shadow-lg ${
        toast.type === "success"
          ? "border-success/30 bg-success/10 text-success"
          : "border-danger/30 bg-danger/10 text-danger"
      }`}
    >
      {toast.type === "success" ? <Check size={14} weight="bold" /> : <WarningCircle size={14} weight="bold" />}
      {toast.message}
    </motion.div>
  );
}

export default function HeroesPage() {
  const reducedMotion = useReducedMotion();
  const [save, setSave] = useState<SaveData | null>(null);
  const [activeTab, setActiveTab] = useState<"heroes" | "skins" | "emotes" | "badges">("heroes");
  const [selectedHeroId, setSelectedHeroId] = useState<HeroId>("recon");
  const [toast, setToast] = useState<Toast | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const data = loadSave();
    setSave(data);
    setSelectedHeroId(data.selectedHero);
  }, [refreshKey]);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const heroes = useMemo(() => Object.values(HERO_DEFS), []);
  const selectedHero = useMemo(() => HERO_DEFS[selectedHeroId], [selectedHeroId]);

  const handleBuyHero = useCallback(
    (heroId: HeroId) => {
      const success = buyHero(heroId);
      if (success) {
        refresh();
        showToast("英雄已解锁", "success");
      } else {
        showToast("游戏币不足", "error");
      }
    },
    [refresh, showToast]
  );

  const handleSelectHero = useCallback(
    (heroId: HeroId) => {
      setSelectedHero(heroId);
      setSelectedHeroId(heroId);
      refresh();
      showToast("出战英雄已切换", "success");
    },
    [refresh, showToast]
  );

  const handleBuyCosmetic = useCallback(
    (id: string) => {
      const success = buyCosmetic(id);
      if (success) {
        refresh();
        const cosmetic = COSMETICS.find((c) => c.id === id);
        showToast(`${cosmetic?.name ?? "物品"} 已购买`, "success");
      } else {
        showToast("游戏币不足", "error");
      }
    },
    [refresh, showToast]
  );

  const handleEquipSkin = useCallback(
    (id: string | null) => {
      equipSkin(id);
      refresh();
      showToast(id ? "皮肤已装备" : "已恢复默认外观", "success");
    },
    [refresh, showToast]
  );

  const heroSkins = useMemo(() => getSkinsForHero(selectedHeroId), [selectedHeroId]);
  const emotes = useMemo(() => getCosmeticsByType("emote"), []);
  const badges = useMemo(() => getCosmeticsByType("badge"), []);

  return (
    <Layout title="英雄档案">
      <div className="mx-auto min-h-[100dvh] max-w-7xl px-4 py-3 md:py-4">
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-3 md:mb-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
                <Sparkle weight="duotone" size={14} />
                英雄档案
              </span>
              <h1 className="mt-2 text-xl font-bold tracking-tight md:text-3xl">据点防守作战单位</h1>
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">
                解锁英雄与外观，用局内资源兑换永久收藏。所有物品只改变外观，不影响战斗数值。
              </p>
            </div>
            <CoinBadge coins={save?.coins ?? 0} />
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-3 flex gap-1 overflow-x-auto pb-1"
          role="tablist"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold transition-all focus-ring active:scale-95 ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-panel text-muted hover:border-muted/60 hover:text-foreground"
                }`}
              >
                <Icon size={14} weight={active ? "bold" : "regular"} />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === "heroes" && (
            <motion.div
              key="heroes"
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory"
            >
              {heroes.map((hero) => {
                const Icon = ICONS[hero.id] ?? Target;
                const unlocked = isHeroUnlocked(hero.id);
                const cost = getHeroCost(hero.id);
                const canAfford = (save?.coins ?? 0) >= cost;
                const isSelected = save?.selectedHero === hero.id;

                return (
                  <motion.section
                    key={hero.id}
                    initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-[300px] flex-none snap-start md:w-[340px]"
                  >
                    <div className="grid h-full gap-1.5">
                      <div
                        className="relative overflow-hidden rounded-2xl border border-border bg-panel p-2.5"
                        style={{
                          boxShadow: `inset 0 1px 0 0 ${hero.color}15`,
                        }}
                      >
                        <div
                          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-30"
                          style={{ backgroundColor: hero.color }}
                        />
                        <div className="relative">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="flex h-9 w-9 items-center justify-center rounded-xl"
                              style={{ backgroundColor: `${hero.color}18`, color: hero.color }}
                            >
                              <Icon size={20} weight="duotone" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <h2 className="text-base font-bold tracking-tight">{hero.name}</h2>
                              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
                                {hero.role}
                              </p>
                            </div>
                            {isSelected && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                <Check size={10} weight="bold" />
                                出战
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{hero.description}</p>

                          <div className="mt-1.5 space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Lightning size={11} weight="duotone" className="text-primary" />
                              <span className="font-medium">主动技能</span>
                              <span className="text-muted">-</span>
                              <span>{hero.skill.name}</span>
                            </div>
                            <p className="pl-5 text-[11px] leading-relaxed text-muted">
                              {hero.skill.description}，冷却 {hero.skill.cooldown}s，持续{" "}
                              {hero.skill.duration}s。
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Fire size={11} weight="duotone" className="text-danger" />
                              <span className="font-medium">终极技能</span>
                              <span className="text-muted">-</span>
                              <span>{hero.ultimate.name}</span>
                            </div>
                            <p className="pl-5 text-[11px] leading-relaxed text-muted">
                              {hero.ultimate.description}，冷却 {hero.ultimate.cooldown}s
                              {hero.ultimate.duration > 0 ? `，持续 ${hero.ultimate.duration}s。` : "。"}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Sword size={11} weight="duotone" className="text-accent" />
                              <span className="font-medium">被动加成</span>
                            </div>
                            <ul className="space-y-0.5 pl-5 text-[11px] text-muted">
                              {hero.passive.maxHealthMul && (
                                <li className="flex items-center gap-1">
                                  <CaretRight size={8} />
                                  最大生命 +{Math.round((hero.passive.maxHealthMul - 1) * 100)}%
                                </li>
                              )}
                              {hero.passive.speedMul && (
                                <li className="flex items-center gap-1">
                                  <CaretRight size={8} />
                                  移动速度 +{Math.round((hero.passive.speedMul - 1) * 100)}%
                                </li>
                              )}
                              {hero.passive.armorAdd !== undefined && hero.passive.armorAdd > 0 && (
                                <li className="flex items-center gap-1">
                                  <CaretRight size={8} />
                                  护甲 +{Math.round(hero.passive.armorAdd * 100)}%
                                </li>
                              )}
                              {hero.passive.critAdd !== undefined && hero.passive.critAdd > 0 && (
                                <li className="flex items-center gap-1">
                                  <CaretRight size={8} />
                                  暴击率 +{Math.round(hero.passive.critAdd * 100)}%
                                </li>
                              )}
                              {hero.passive.regenAdd !== undefined && hero.passive.regenAdd > 0 && (
                                <li className="flex items-center gap-1">
                                  <CaretRight size={8} />
                                  生命回复 +{hero.passive.regenAdd}/s
                                </li>
                              )}
                              {hero.passive.cooldownReductionAdd !== undefined &&
                                hero.passive.cooldownReductionAdd > 0 && (
                                  <li className="flex items-center gap-1">
                                    <CaretRight size={8} />
                                    冷却缩减 +{Math.round(hero.passive.cooldownReductionAdd * 100)}%
                                  </li>
                                )}
                            </ul>
                          </div>

                          <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
                            {unlocked ? (
                              <button
                                type="button"
                                onClick={() => handleSelectHero(hero.id)}
                                disabled={isSelected}
                                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all focus-ring active:scale-95 ${
                                  isSelected
                                    ? "cursor-not-allowed border border-border bg-panel text-muted"
                                    : "bg-primary text-background hover:bg-primary/90"
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <Check size={12} weight="bold" />
                                    已出战
                                  </>
                                ) : (
                                  <>
                                    <Target size={12} weight="bold" />
                                    设为出战
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleBuyHero(hero.id)}
                                disabled={!canAfford}
                                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all focus-ring active:scale-95 ${
                                  canAfford
                                    ? "bg-warning text-background hover:bg-warning/90"
                                    : "cursor-not-allowed border border-border bg-panel text-muted"
                                }`}
                              >
                                {canAfford ? <ShoppingCart size={12} weight="bold" /> : <Lock size={12} weight="bold" />}
                                <Coin size={12} weight="bold" />
                                {cost}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                          <Sparkle size={10} />
                          天赋树
                        </h3>
                        <div className="grid gap-1 sm:grid-cols-2">
                          {hero.talents.map((talent, index) => (
                            <TalentCard key={talent.id} talent={talent} index={index} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.section>
                );
              })}
            </motion.div>
          )}

          {activeTab === "skins" && (
            <motion.div
              key="skins"
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {/* Hero selector for skins */}
              <div className="flex flex-wrap gap-2">
                {heroes.map((hero) => {
                  const Icon = ICONS[hero.id] ?? Target;
                  const active = selectedHeroId === hero.id;
                  return (
                    <button
                      key={hero.id}
                      type="button"
                      onClick={() => setSelectedHeroId(hero.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all focus-ring active:scale-95 ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-panel text-muted hover:border-muted/60 hover:text-foreground"
                      }`}
                    >
                      <Icon size={14} style={{ color: active ? hero.color : undefined }} />
                      {hero.name}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {/* Default skin option */}
                <div
                  className={`relative flex flex-col justify-between rounded-2xl border p-3 transition-all ${
                    getEquippedSkin() === null
                      ? "border-primary bg-primary/10"
                      : "border-border bg-panel hover:border-primary/30 hover:bg-panel-raised"
                  }`}
                >
                  <div>
                    <div
                      className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${selectedHero.color}18`, color: selectedHero.color }}
                    >
                      <UserCircle size={22} weight="bold" />
                    </div>
                    <h3 className="text-sm font-bold">默认外观</h3>
                    <p className="text-[11px] text-muted">{selectedHero.name} 原始配色</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEquipSkin(null)}
                    disabled={getEquippedSkin() === null}
                    className={`mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all focus-ring active:scale-95 ${
                      getEquippedSkin() === null
                        ? "cursor-not-allowed border border-border bg-panel text-muted"
                        : "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
                    }`}
                  >
                    {getEquippedSkin() === null ? (
                      <>
                        <Check size={12} weight="bold" />
                        已装备
                      </>
                    ) : (
                      <>
                        <Target size={12} weight="bold" />
                        装备默认
                      </>
                    )}
                  </button>
                </div>

                {heroSkins.map((cosmetic) => {
                  const owned = isCosmeticOwned(cosmetic.id);
                  const equipped = getEquippedSkin() === cosmetic.id;
                  const canAfford = (save?.coins ?? 0) >= cosmetic.cost;

                  return (
                    <motion.div
                      key={cosmetic.id}
                      initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      className={`relative flex flex-col justify-between rounded-2xl border p-3 transition-all ${
                        equipped
                          ? "border-primary bg-primary/10"
                          : "border-border bg-panel hover:border-primary/30 hover:bg-panel-raised"
                      }`}
                    >
                      <div>
                        <div
                          className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${cosmetic.color}18`, color: cosmetic.color }}
                        >
                          <PaintBrush size={22} weight="bold" />
                        </div>
                        <h3 className="text-sm font-bold">{cosmetic.name}</h3>
                        <p className="text-[11px] text-muted">{cosmetic.description}</p>
                      </div>
                      <div className="mt-2">
                        {owned ? (
                          <button
                            type="button"
                            onClick={() => handleEquipSkin(cosmetic.id)}
                            disabled={equipped}
                            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all focus-ring active:scale-95 ${
                              equipped
                                ? "cursor-not-allowed border border-border bg-panel text-muted"
                                : "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
                            }`}
                          >
                            {equipped ? (
                              <>
                                <Check size={12} weight="bold" />
                                已装备
                              </>
                            ) : (
                              <>
                                <Target size={12} weight="bold" />
                                装备
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBuyCosmetic(cosmetic.id)}
                            disabled={!canAfford}
                            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all focus-ring active:scale-95 ${
                              canAfford
                                ? "bg-warning text-background hover:bg-warning/90"
                                : "cursor-not-allowed border border-border bg-panel text-muted"
                            }`}
                          >
                            {canAfford ? <ShoppingCart size={12} weight="bold" /> : <Lock size={12} weight="bold" />}
                            <Coin size={12} weight="bold" />
                            {cosmetic.cost}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {(activeTab === "emotes" || activeTab === "badges") && (
            <motion.div
              key={activeTab}
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
            >
              {(activeTab === "emotes" ? emotes : badges).map((cosmetic) => {
                const owned = isCosmeticOwned(cosmetic.id);
                const canAfford = (save?.coins ?? 0) >= cosmetic.cost;

                return (
                  <motion.div
                    key={cosmetic.id}
                    initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    className={`relative flex flex-col justify-between rounded-2xl border p-3 transition-all ${
                      owned
                        ? "border-success/30 bg-success/5"
                        : "border-border bg-panel hover:border-primary/30 hover:bg-panel-raised"
                    }`}
                  >
                    <div>
                      <div
                        className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${cosmetic.color}18`, color: cosmetic.color }}
                      >
                        {activeTab === "emotes" ? <Smiley size={22} weight="bold" /> : <Crown size={22} weight="bold" />}
                      </div>
                      <h3 className="text-sm font-bold">{cosmetic.name}</h3>
                      <p className="text-[11px] text-muted">{cosmetic.description}</p>
                    </div>
                    <div className="mt-2">
                      {owned ? (
                        <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-xs font-bold text-success">
                          <Check size={12} weight="bold" />
                          已拥有
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBuyCosmetic(cosmetic.id)}
                          disabled={!canAfford}
                          className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all focus-ring active:scale-95 ${
                            canAfford
                              ? "bg-warning text-background hover:bg-warning/90"
                              : "cursor-not-allowed border border-border bg-panel text-muted"
                          }`}
                        >
                          {canAfford ? <ShoppingCart size={12} weight="bold" /> : <Lock size={12} weight="bold" />}
                          <Coin size={12} weight="bold" />
                          {cosmetic.cost}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>{toast && <ToastMessage toast={toast} onDismiss={() => setToast(null)} />}</AnimatePresence>
      </div>
    </Layout>
  );
}
