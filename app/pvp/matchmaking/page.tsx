"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, useReducedMotion } from "framer-motion";
import {
  Sword,
  Shield,
  Lightning,
  Fire,
  ClockCounterClockwise,
  ArrowLeft,
  Play,
  CaretDown,
  Planet,
} from "@phosphor-icons/react";
import Link from "next/link";
import { DESIGN_SYSTEM } from "@/lib/version";
import { listPvPHeroIds, getPvPHero, getPvPHeroName, getPvPHeroRole } from "@/lib/game/pvp/pvp-heroes";
import { listPvPWeaponIds, getPvPWeapon, getPvPWeaponName } from "@/lib/game/pvp/pvp-weapons";
import type { PvPHeroId, PvPWeaponId, PvPRoundFormat } from "@/lib/game/pvp/types";

const pvpColors = DESIGN_SYSTEM.colors;

const HERO_IDS = listPvPHeroIds();
const WEAPON_IDS = listPvPWeaponIds();

export default function PvPMatchmaking() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [selectedHero, setSelectedHero] = useState<PvPHeroId>(HERO_IDS[0]);
  const [selectedWeapon, setSelectedWeapon] = useState<PvPWeaponId>(WEAPON_IDS[0]);
  const [selectedFormat, setSelectedFormat] = useState<PvPRoundFormat>("BO3");
  const [searching, setSearching] = useState(false);
  const [queueTime, setQueueTime] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!searching) return;
    const timer = setInterval(() => setQueueTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [searching]);

  const hero = getPvPHero(selectedHero);
  const weapon = getPvPWeapon(selectedWeapon);

  function handleStartSearch() {
    setSearching(true);
    setQueueTime(0);
  }

  function handleCancelSearch() {
    setSearching(false);
    setQueueTime(0);
  }

  if (!mounted) return null;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, ${pvpColors.primary}15 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 lg:px-8">
          <Link href="/pvp" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">竞技大厅</span>
          </Link>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/30">休闲匹配</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 lg:px-8 lg:py-16">
        {!searching ? (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Hero Selection */}
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-[0.15em] text-white/40">
                <Sword size={16} weight="bold" style={{ color: pvpColors.primary }} />
                选择英雄
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {HERO_IDS.map((id) => {
                  const h = getPvPHero(id);
                  const isSelected = selectedHero === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedHero(id)}
                      className="rounded-xl border p-4 text-left transition-all hover:scale-[1.02]"
                      style={{
                        background: isSelected ? `${h.color}15` : "rgba(255,255,255,0.03)",
                        borderColor: isSelected ? h.color : "rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold" style={{ background: `${h.color}20`, color: h.color }}>
                          {h.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{h.name}</p>
                          <p className="text-[10px] text-white/40">{h.role}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Weapon Selection */}
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-[0.15em] text-white/40">
                <Lightning size={16} weight="bold" style={{ color: pvpColors.accent }} />
                选择武器
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {WEAPON_IDS.map((id) => {
                  const w = getPvPWeapon(id);
                  const isSelected = selectedWeapon === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedWeapon(id)}
                      className="rounded-xl border p-4 text-left transition-all hover:scale-[1.02]"
                      style={{
                        background: isSelected ? `${w.color}15` : "rgba(255,255,255,0.03)",
                        borderColor: isSelected ? w.color : "rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold" style={{ background: `${w.color}20`, color: w.color }}>
                          {w.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{w.name}</p>
                          <p className="text-[10px] text-white/40">{w.type === "melee" ? "近战" : w.type === "ranged" ? "远程" : "混合"}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full" style={{ background: `${pvpColors.primary}15` }}>
              <div className="h-16 w-16 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: pvpColors.primary }} />
            </div>
            <h2 className="text-2xl font-bold">寻找对手中...</h2>
            <p className="mt-2 text-white/40">
              已等待 {queueTime} 秒 · 预计匹配时间 {Math.max(0, 15 - queueTime)} 秒
            </p>
            <button
              onClick={handleCancelSearch}
              className="mt-8 rounded-xl border px-6 py-2.5 text-sm font-bold transition-all hover:scale-[1.02]"
              style={{
                borderColor: "rgba(255,255,255,0.1)",
                color: pvpColors.foreground,
              }}
            >
              取消匹配
            </button>
          </motion.div>
        )}

        {!searching && (
          <>
            {/* Format Selection */}
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8"
            >
              <h2 className="mb-4 font-mono text-sm font-bold uppercase tracking-[0.15em] text-white/40">赛制</h2>
              <div className="flex gap-3">
                {(["BO3", "BO5"] as PvPRoundFormat[]).map((format) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className="rounded-xl border px-6 py-3 font-bold transition-all"
                    style={{
                      background: selectedFormat === format ? `${pvpColors.primary}15` : "rgba(255,255,255,0.03)",
                      borderColor: selectedFormat === format ? pvpColors.primary : "rgba(255,255,255,0.06)",
                      color: selectedFormat === format ? pvpColors.primary : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {format === "BO3" ? "三局两胜" : "五局三胜"}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Selected Summary */}
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-col gap-4 rounded-xl border p-6 sm:flex-row sm:items-center sm:justify-between"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg text-lg font-bold" style={{ background: `${hero.color}20`, color: hero.color }}>
                    {hero.name[0]}
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-white/40">{hero.name}</p>
                </div>
                <Sword size={24} className="text-white/10" />
                <div className="text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg text-lg font-bold" style={{ background: `${weapon.color}20`, color: weapon.color }}>
                    {weapon.name[0]}
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-white/40">{weapon.name}</p>
                </div>
              </div>

              <button
                onClick={handleStartSearch}
                className="flex items-center gap-2 rounded-xl px-8 py-3 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: pvpColors.primary,
                  color: pvpColors.background,
                }}
              >
                <Play size={16} weight="fill" />
                开始匹配
              </button>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}