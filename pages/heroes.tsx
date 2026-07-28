"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Snowflake, Butterfly, PawPrint, Lightning, Crosshair, CaretRight,
  Sparkle, Sword, Fire, Target, Skull, AirplaneTilt, CastleTurret,
  Coin, Lock, Check, ShoppingCart, Star, Crown, PaintBrush,
  WarningCircle, Smiley, UserCircle, Shield, Heartbeat, Gauge, ShieldCheck,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import { HERO_DEFS } from "@/lib/game/heroes";
import type { HeroTalent, HeroId } from "@/lib/game/types";
import {
  loadSave, buyHero, buyCosmetic, equipSkin, isHeroUnlocked,
  isCosmeticOwned, getEquippedSkin, setSelectedHero, type SaveData,
} from "@/lib/game/save";
import { COSMETICS, getHeroCost, getSkinsForHero, getCosmeticsByType, type CosmeticType } from "@/lib/game/cosmetics";

const ICONS: Record<string, typeof Snowflake> = {
  nitrogen: Snowflake, twilight: Butterfly, leopard: PawPrint,
  recon: Crosshair, viper: Skull, falcon: AirplaneTilt, bastion: CastleTurret,
};

const HERO_IMAGES: Record<string, string> = {
  nitrogen: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20portrait%20of%20a%20cryo%20engineer%20in%20heavy%20winter%20gear%2C%20frost%20crystals%2C%20icy%20blue%20palette%2C%20industrial%20wasteland%2C%20dark%20atmosphere%2C%20low%20saturation%2C%20no%20text&image_size=portrait_4_3",
  twilight: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20portrait%20of%20a%20combat%20medic%20with%20bioluminescent%20butterfly%20motif%2C%20healing%20auras%2C%20purple%20palette%2C%20dark%20wasteland%2C%20low%20saturation%2C%20ethereal%20glow%2C%20no%20text&image_size=portrait_4_3",
  leopard: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20portrait%20of%20an%20agile%20warrior%20with%20feline%20motifs%2C%20orange%20amber%20palette%2C%20dynamic%20pose%2C%20claw%20marks%2C%20dark%20industrial%2C%20low%20saturation%2C%20no%20text&image_size=portrait_4_3",
  recon: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20portrait%20of%20a%20tactical%20scout%20with%20drone%2C%20green%20emerald%20palette%2C%20high-tech%20goggles%2C%20dark%20wasteland%2C%20low%20saturation%2C%20precision%20aesthetic%2C%20no%20text&image_size=portrait_4_3",
  viper: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20portrait%20of%20a%20toxic%20assault%20specialist%20with%20snake%20motifs%2C%20green%20toxic%20palette%2C%20venom%20weapons%2C%20hazard%20stripes%2C%20dark%20industrial%2C%20low%20saturation%2C%20no%20text&image_size=portrait_4_3",
  falcon: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20portrait%20of%20high-mobility%20aerial%20scout%20with%20falcon%20motifs%2C%20golden%20amber%20palette%2C%20jet%20thrusters%2C%20dark%20stormy%20sky%2C%20low%20saturation%2C%20no%20text&image_size=portrait_4_3",
  bastion: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20portrait%20of%20heavy%20fortification%20engineer%20in%20thick%20armor%2C%20concrete%20steel%20motifs%2C%20brown%20bronze%20palette%2C%20dark%20industrial%2C%20low%20saturation%2C%20no%20text&image_size=portrait_4_3",
};

const TABS: { id: "heroes" | "skins" | "emotes" | "badges"; label: string; icon: typeof UserCircle }[] = [
  { id: "heroes", label: "英雄", icon: UserCircle },
  { id: "skins", label: "皮肤", icon: PaintBrush },
  { id: "emotes", label: "表情", icon: Smiley },
  { id: "badges", label: "徽章", icon: Crown },
];

function TalentRow({ talent, heroColor }: { talent: HeroTalent; heroColor: string }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="group flex items-center gap-2 rounded-lg border border-primary/10 bg-panel/60 holo-scan px-2.5 py-2 transition-colors hover:border-primary/30 hover:bg-panel"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold" style={{ backgroundColor: `${heroColor}18`, color: heroColor }}>
        <Star size={11} weight="fill" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold">{talent.name}</p>
        <p className="text-[10px] leading-relaxed text-muted">{talent.description}</p>
      </div>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: talent.maxLevel }, (_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `${heroColor}60` }} />
        ))}
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

interface Toast { message: string; type: "success" | "error"; }

function ToastMessage({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => { const id = setTimeout(onDismiss, 2200); return () => clearTimeout(id); }, [onDismiss]);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
      className={`fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium shadow-lg ${
        toast.type === "success" ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger"
      }`}>
      {toast.type === "success" ? <Check size={14} weight="bold" /> : <WarningCircle size={14} weight="bold" />}
      {toast.message}
    </motion.div>
  );
}

function StatMini({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Shield; color: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-primary/10 bg-background/50 px-2 py-1.5">
      <Icon size={12} weight="bold" style={{ color }} />
      <div><p className="text-[9px] uppercase tracking-wider text-muted">{label}</p><p className="text-[11px] font-bold">{value}</p></div>
    </div>
  );
}

export default function HeroesPage() {
  const reducedMotion = useReducedMotion();
  const [save, setSave] = useState<SaveData | null>(null);
  const [activeTab, setActiveTab] = useState<"heroes" | "skins" | "emotes" | "badges">("heroes");
  const [selectedHeroId, setSelectedHeroId] = useState<HeroId>("recon");
  const [toast, setToast] = useState<Toast | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { const data = loadSave(); setSave(data); setSelectedHeroId(data.selectedHero); }, [refreshKey]);
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => { setToast({ message, type }); }, []);
  const refresh = useCallback(() => { setRefreshKey((k) => k + 1); }, []);
  const heroes = useMemo(() => Object.values(HERO_DEFS), []);

  const handleBuyHero = useCallback((heroId: HeroId) => {
    const success = buyHero(heroId);
    if (success) { refresh(); showToast("英雄已解锁", "success"); } else { showToast("游戏币不足", "error"); }
  }, [refresh, showToast]);

  const handleSelectHero = useCallback((heroId: HeroId) => {
    setSelectedHero(heroId); setSelectedHeroId(heroId); refresh(); showToast("出战英雄已切换", "success");
  }, [refresh, showToast]);

  const handleBuyCosmetic = useCallback((id: string) => {
    const success = buyCosmetic(id);
    if (success) { refresh(); const c = COSMETICS.find((x) => x.id === id); showToast(`${c?.name ?? "物品"} 已购买`, "success"); }
    else { showToast("游戏币不足", "error"); }
  }, [refresh, showToast]);

  const handleEquipSkin = useCallback((id: string | null) => {
    equipSkin(id); refresh(); showToast(id ? "皮肤已装备" : "已恢复默认外观", "success");
  }, [refresh, showToast]);

  const heroSkins = useMemo(() => getSkinsForHero(selectedHeroId), [selectedHeroId]);
  const emotes = useMemo(() => getCosmeticsByType("emote"), []);
  const badges = useMemo(() => getCosmeticsByType("badge"), []);

  const getPassiveStats = (hero: typeof HERO_DEFS[keyof typeof HERO_DEFS]) => {
    const p = hero.passive;
    const parts: { label: string; value: string; icon: typeof Shield; color: string }[] = [];
    if (p.maxHealthMul) parts.push({ label: "生命", value: `+${Math.round((p.maxHealthMul - 1) * 100)}%`, icon: Heartbeat, color: "#ef4444" });
    if (p.speedMul) parts.push({ label: "移速", value: `+${Math.round((p.speedMul - 1) * 100)}%`, icon: Gauge, color: "#f59e0b" });
    if (p.armorAdd) parts.push({ label: "护甲", value: `+${Math.round(p.armorAdd * 100)}%`, icon: ShieldCheck, color: "#6366f1" });
    if (p.critAdd) parts.push({ label: "暴击", value: `+${Math.round(p.critAdd * 100)}%`, icon: Crosshair, color: "#f97316" });
    if (p.regenAdd) parts.push({ label: "回复", value: `+${p.regenAdd}/s`, icon: Heartbeat, color: "#22c55e" });
    if (p.cooldownReductionAdd) parts.push({ label: "冷却", value: `-${Math.round(p.cooldownReductionAdd * 100)}%`, icon: Lightning, color: "#38bdf8" });
    if (p.areaMul) parts.push({ label: "范围", value: `+${Math.round((p.areaMul - 1) * 100)}%`, icon: Target, color: "#a855f7" });
    if (p.rangeMul) parts.push({ label: "射程", value: `+${Math.round((p.rangeMul - 1) * 100)}%`, icon: Target, color: "#14b8a6" });
    return parts;
  };

  return (
    <Layout title="英雄档案">
      <div className="mx-auto min-h-[100dvh] max-w-7xl px-4 py-3 md:py-6">
        <motion.div initial={reducedMotion ? undefined : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mb-4 md:mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
                <Sparkle weight="duotone" size={14} />英雄档案
              </span>
              <h1 className="mt-2 text-[clamp(1.5rem,4vw,2.5rem)] font-bold leading-[0.95] tracking-tight">
                选择你的<br /><span className="text-gradient">据点指挥官</span>
              </h1>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">
                解锁英雄与外观，用局内资源兑换永久收藏。所有物品只改变外观，不影响战斗数值。
              </p>
            </div>
            <CoinBadge coins={save?.coins ?? 0} />
          </div>
        </motion.div>

        <motion.div initial={reducedMotion ? undefined : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="mb-4 flex gap-1 overflow-x-auto pb-1" role="tablist">
          {TABS.map((tab) => {
            const Icon = tab.icon; const active = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" role="tab" aria-selected={active} onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-semibold transition-all focus-ring active:scale-95 ${active ? "border-primary bg-primary/10 text-primary" : "border-primary/10 bg-panel/60 text-muted hover:border-primary/30 hover:text-foreground"}`}>
                <Icon size={14} weight={active ? "bold" : "regular"} />{tab.label}
              </button>
            );
          })}
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === "heroes" && (
            <motion.div key="heroes" initial={reducedMotion ? undefined : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
              <div className="grid gap-3 md:grid-cols-12 md:grid-flow-dense">
                {heroes.map((hero, index) => {
                  const HeroIcon = ICONS[hero.id] ?? Target;
                  const unlocked = isHeroUnlocked(hero.id);
                  const cost = getHeroCost(hero.id);
                  const canAfford = (save?.coins ?? 0) >= cost;
                  const isSelected = save?.selectedHero === hero.id;
                  const passiveStats = getPassiveStats(hero);
                  const isLarge = index === 0 || index === 4;

                  return (
                    <motion.section key={hero.id}
                      initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.4), ease: [0.22, 1, 0.36, 1] }}
                      className={`group relative overflow-hidden rounded-3xl bridge-panel holo-scan transition-all hover:border-primary/30 hover:bg-panel ${isLarge ? "md:col-span-7" : "md:col-span-5"}`}>
                      <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full blur-3xl opacity-25 transition-opacity group-hover:opacity-50" style={{ backgroundColor: hero.color }} />
                      <div className="relative p-2.5 md:p-3">
                        {isLarge && (
                          <div className="relative mb-3 overflow-hidden rounded-2xl">
                            <img src={HERO_IMAGES[hero.id]} alt={hero.name} className="h-40 w-full object-cover md:h-52" />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-panel via-panel/30 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                              <div>
                                <h2 className="text-xl font-bold tracking-tight md:text-2xl">{hero.name}</h2>
                                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{hero.role} - {hero.tagline}</p>
                              </div>
                              {isSelected && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-[10px] font-bold text-primary">
                                  <Check size={10} weight="bold" />出战
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {!isLarge && (
                          <div className="flex items-center gap-3 mb-2">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${hero.color}18`, color: hero.color }}>
                              <HeroIcon size={22} weight="duotone" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold tracking-tight">{hero.name}</h2>
                                {isSelected && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                                    <Check size={10} weight="bold" />出战
                                  </span>
                                )}
                              </div>
                              <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{hero.role}</p>
                            </div>
                          </div>
                        )}
                        <p className="text-[11px] leading-relaxed text-muted">{hero.description}</p>

                        {passiveStats.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {passiveStats.map((stat) => (
                              <StatMini key={stat.label} {...stat} />
                            ))}
                          </div>
                        )}

                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Lightning size={11} weight="duotone" className="text-primary" />
                            <span className="font-medium">{hero.skill.name}</span>
                            <span className="text-muted">- CD {hero.skill.cooldown}s</span>
                          </div>
                          <p className="pl-5 text-[11px] leading-relaxed text-muted">{hero.skill.description}</p>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Fire size={11} weight="duotone" className="text-danger" />
                            <span className="font-medium">{hero.ultimate.name}</span>
                            <span className="text-muted">- CD {hero.ultimate.cooldown}s</span>
                          </div>
                          <p className="pl-5 text-[11px] leading-relaxed text-muted">{hero.ultimate.description}</p>
                        </div>

                        {hero.talents.length > 0 && (
                          <div className="mt-2">
                            <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                              <Sparkle size={10} />天赋树
                            </p>
                            <div className="grid gap-1 sm:grid-cols-2">
                              {hero.talents.map((talent) => (
                                <TalentRow key={talent.id} talent={talent} heroColor={hero.color} />
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-2 border-t border-primary/10 pt-2">
                          {unlocked ? (
                            <button type="button" onClick={() => handleSelectHero(hero.id)} disabled={isSelected}
                              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all focus-ring active:scale-95 ${isSelected ? "cursor-not-allowed border border-primary/10 bg-panel/60 text-muted" : "bg-primary text-background hover:bg-primary/90"}`}>
                              {isSelected ? <><Check size={12} weight="bold" />已出战</> : <><Target size={12} weight="bold" />设为出战</>}
                            </button>
                          ) : (
                            <button type="button" onClick={() => handleBuyHero(hero.id)} disabled={!canAfford}
                              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all focus-ring active:scale-95 ${canAfford ? "bg-warning text-background hover:bg-warning/90" : "cursor-not-allowed border border-primary/10 bg-panel/60 text-muted"}`}>
                              {canAfford ? <ShoppingCart size={12} weight="bold" /> : <Lock size={12} weight="bold" />}
                              <Coin size={12} weight="bold" />{cost}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.section>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === "skins" && (
            <motion.div key="skins" initial={reducedMotion ? undefined : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {heroes.map((hero) => {
                  const Icon = ICONS[hero.id] ?? Target; const active = selectedHeroId === hero.id;
                  return (
                    <button key={hero.id} type="button" onClick={() => setSelectedHeroId(hero.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all focus-ring active:scale-95 ${active ? "border-primary bg-primary/10 text-primary" : "border-primary/10 bg-panel/60 text-muted hover:border-primary/30 hover:text-foreground"}`}>
                      <Icon size={14} style={{ color: active ? hero.color : undefined }} />{hero.name}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div className={`relative flex flex-col justify-between rounded-2xl border p-3 transition-all ${getEquippedSkin() === null ? "border-primary bg-primary/10" : "border-primary/10 bg-panel hover:border-primary/30 hover:bg-panel-raised"}`}>
                  <div>
                    <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${HERO_DEFS[selectedHeroId]?.color ?? "#94a3b8"}18`, color: HERO_DEFS[selectedHeroId]?.color ?? "#94a3b8" }}>
                      <UserCircle size={22} weight="bold" />
                    </div>
                    <h3 className="text-sm font-bold">默认外观</h3>
                    <p className="text-[11px] text-muted">{HERO_DEFS[selectedHeroId]?.name ?? ""} 原始配色</p>
                  </div>
                  <button type="button" onClick={() => handleEquipSkin(null)} disabled={getEquippedSkin() === null}
                    className={`mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all focus-ring active:scale-95 ${getEquippedSkin() === null ? "cursor-not-allowed border border-primary/10 bg-panel/60 text-muted" : "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"}`}>
                    {getEquippedSkin() === null ? <><Check size={12} weight="bold" />已装备</> : <><Target size={12} weight="bold" />装备默认</>}
                  </button>
                </div>
                {heroSkins.map((cosmetic) => {
                  const owned = isCosmeticOwned(cosmetic.id); const equipped = getEquippedSkin() === cosmetic.id; const canAfford = (save?.coins ?? 0) >= cosmetic.cost;
                  return (
                    <motion.div key={cosmetic.id} initial={reducedMotion ? undefined : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
                      className={`relative flex flex-col justify-between rounded-2xl border p-3 transition-all ${equipped ? "border-primary bg-primary/10" : "border-primary/10 bg-panel hover:border-primary/30 hover:bg-panel-raised"}`}>
                      <div>
                        <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${cosmetic.color}18`, color: cosmetic.color }}>
                          <PaintBrush size={22} weight="bold" />
                        </div>
                        <h3 className="text-sm font-bold">{cosmetic.name}</h3>
                        <p className="text-[11px] text-muted">{cosmetic.description}</p>
                      </div>
                      <div className="mt-2">
                        {owned ? (
                          <button type="button" onClick={() => handleEquipSkin(cosmetic.id)} disabled={equipped}
                            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all focus-ring active:scale-95 ${equipped ? "cursor-not-allowed border border-primary/10 bg-panel/60 text-muted" : "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"}`}>
                            {equipped ? <><Check size={12} weight="bold" />已装备</> : <><Target size={12} weight="bold" />装备</>}
                          </button>
                        ) : (
                          <button type="button" onClick={() => handleBuyCosmetic(cosmetic.id)} disabled={!canAfford}
                            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all focus-ring active:scale-95 ${canAfford ? "bg-warning text-background hover:bg-warning/90" : "cursor-not-allowed border border-primary/10 bg-panel/60 text-muted"}`}>
                            {canAfford ? <ShoppingCart size={12} weight="bold" /> : <Lock size={12} weight="bold" />}
                            <Coin size={12} weight="bold" />{cosmetic.cost}
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
            <motion.div key={activeTab} initial={reducedMotion ? undefined : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(activeTab === "emotes" ? emotes : badges).map((cosmetic) => {
                const owned = isCosmeticOwned(cosmetic.id); const canAfford = (save?.coins ?? 0) >= cosmetic.cost;
                return (
                  <motion.div key={cosmetic.id} initial={reducedMotion ? undefined : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
                    className={`relative flex flex-col justify-between rounded-2xl border p-3 transition-all ${owned ? "border-success/30 bg-success/5" : "border-primary/10 bg-panel hover:border-primary/30 hover:bg-panel-raised"}`}>
                    <div>
                      <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${cosmetic.color}18`, color: cosmetic.color }}>
                        {activeTab === "emotes" ? <Smiley size={22} weight="bold" /> : <Crown size={22} weight="bold" />}
                      </div>
                      <h3 className="text-sm font-bold">{cosmetic.name}</h3>
                      <p className="text-[11px] text-muted">{cosmetic.description}</p>
                    </div>
                    <div className="mt-2">
                      {owned ? (
                        <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-xs font-bold text-success">
                          <Check size={12} weight="bold" />已拥有
                        </span>
                      ) : (
                        <button type="button" onClick={() => handleBuyCosmetic(cosmetic.id)} disabled={!canAfford}
                          className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all focus-ring active:scale-95 ${canAfford ? "bg-warning text-background hover:bg-warning/90" : "cursor-not-allowed border border-primary/10 bg-panel/60 text-muted"}`}>
                          {canAfford ? <ShoppingCart size={12} weight="bold" /> : <Lock size={12} weight="bold" />}
                          <Coin size={12} weight="bold" />{cosmetic.cost}
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