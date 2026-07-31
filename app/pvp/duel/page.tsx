"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Sword,
  Shield,
  Lightning,
  Fire,
  Trophy,
  Skull,
  Heart,
  Crosshair,
  Planet,
  CaretDown,
  Pause,
  Play,
} from "@phosphor-icons/react";
import Link from "next/link";
import { DESIGN_SYSTEM } from "@/lib/version";
import { getPvPHero, getPvPHeroName } from "@/lib/game/pvp/pvp-heroes";
import { getPvPWeapon, getPvPWeaponName } from "@/lib/game/pvp/pvp-weapons";
import { getPvPMap, getPvPMapName } from "@/lib/game/pvp/pvp-maps";
import { createDuel, startDuel, startRound, endRound, dealDamage, getDuelRoundSummary, isDuelFinished, getDuelWinner, getDuelLoser } from "@/lib/game/pvp/duel";
import type { PvPDuel, PvPHeroId, PvPWeaponId, PvPMapId, PvPRoundFormat } from "@/lib/game/pvp/types";

const pvpColors = DESIGN_SYSTEM.colors;

type DuelPhase = "loading" | "countdown" | "fighting" | "round_result" | "match_result";

export default function PvPDuelPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [duel, setDuel] = useState<PvPDuel | null>(null);
  const [phase, setPhase] = useState<DuelPhase>("loading");
  const [countdown, setCountdown] = useState(3);
  const [error, setError] = useState<string | null>(null);

  const player1HeroId: PvPHeroId = "iron_fist";
  const player1WeaponId: PvPWeaponId = "brass_knuckles";
  const player2HeroId: PvPHeroId = "shadow_assassin";
  const player2WeaponId: PvPWeaponId = "crossbow";
  const duelMapId: PvPMapId = "forge_arena";
  const duelFormat: PvPRoundFormat = "BO3";

  const initializeDuel = useCallback(() => {
    const newDuel = createDuel(
      "casual",
      duelFormat,
      duelMapId,
      { peerId: "player1", playerName: "铁拳格斗家", heroId: player1HeroId, weaponId: player1WeaponId },
      { peerId: "player2", playerName: "暗影刺客", heroId: player2HeroId, weaponId: player2WeaponId }
    );
    const started = startDuel(newDuel);
    const withRound = startRound(started);
    setDuel(withRound);
    startCountdown();
  }, [duelFormat, duelMapId, player1HeroId, player1WeaponId, player2HeroId, player2WeaponId]);

  useEffect(() => {
    setMounted(true);
    initializeDuel();
  }, [initializeDuel]);

  function startCountdown() {
    setPhase("countdown");
    setCountdown(3);
    let count = 3;
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        setPhase("fighting");
      }
    }, 1000);
  }

  function handleDealDamage(target: "player1" | "player2") {
    if (!duel || phase !== "fighting") return;
    const attackerId = target === "player1" ? "player2" : "player1";
    const targetId = target === "player1" ? "player1" : "player2";
    const targetPlayer = duel[target];
    const attacker = duel[target === "player1" ? "player2" : "player1"];
    const attackerHero = getPvPHero(attacker.heroId);
    const attackerWeapon = getPvPWeapon(attacker.weaponId);
    const damage = attackerWeapon.damage + Math.floor(Math.random() * 40);

    const updated = dealDamage(duel, targetId, damage, attackerId);

    if (updated.status === "round_end" || updated.status === "finished") {
      setDuel(updated);
      setPhase(updated.status === "finished" ? "match_result" : "round_result");
    } else {
      setDuel(updated);
    }
  }

  function handleNextRound() {
    if (!duel) return;
    const updated = startRound(duel);
    setDuel(updated);
    startCountdown();
  }

  function handleRematch() {
    initializeDuel();
  }

  if (!mounted) return null;
  if (!duel) {
    return (
      <div className="relative min-h-[100dvh] overflow-hidden flex items-center justify-center" style={{ background: pvpColors.background, color: pvpColors.foreground }}>
        <div className="pvp-empty-state">
          <div className="h-16 w-16 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: pvpColors.primary }} />
          <p className="mt-4 text-sm">加载对决中...</p>
        </div>
      </div>
    );
  }

  const player1Hero = getPvPHero(duel.player1.heroId);
  const player2Hero = getPvPHero(duel.player2.heroId);
  const map = getPvPMap(duel.mapId);
  const summary = getDuelRoundSummary(duel);
  const finished = isDuelFinished(duel);

  const p1HealthPct = (duel.player1.health / duel.player1.maxHealth) * 100;
  const p2HealthPct = (duel.player2.health / duel.player2.maxHealth) * 100;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground">

      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-8">
          <Link href="/pvp" className="flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors">
            <ArrowLeft size={16} />
            <span className="text-xs font-medium">退出</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-white/30">{map.name}</span>
            <span className="font-mono text-xs text-white/20">{duel.format}</span>
          </div>
          <button className="text-white/30 hover:text-white/50 transition-colors">
            <Pause size={16} />
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 lg:px-8">
        {/* Scoreboard */}
        <div className="mb-6 flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: player1Hero.color }}>{player1Hero.name}</p>
            <div className="mt-1 flex justify-center gap-1.5">
              {Array.from({ length: summary.roundsToWin }).map((_, i) => (
                <div
                  key={i}
                  className={`pvp-round-dot ${i < summary.player1Score ? "won" : ""}`}
                />
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="font-mono text-2xl font-bold" style={{ color: pvpColors.primary }}>
              {summary.player1Score} : {summary.player2Score}
            </p>
            <p className="text-[10px] text-white/20">第 {duel.currentRound} 回合</p>
          </div>

          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: player2Hero.color }}>{player2Hero.name}</p>
            <div className="mt-1 flex justify-center gap-1.5">
              {Array.from({ length: summary.roundsToWin }).map((_, i) => (
                <div
                  key={i}
                  className={`pvp-round-dot ${i < summary.player2Score ? "won" : ""}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Fight Arena */}
        <div className="relative mb-6 rounded-xl border overflow-hidden"
          style={{
            background: map.backgroundColor,
            borderColor: map.borderColor,
            minHeight: "400px",
          }}
        >
          {/* Arena background */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="font-mono text-6xl font-bold opacity-5" style={{ color: map.borderColor }}>{map.name}</p>
              <p className="mt-2 font-mono text-xs opacity-10" style={{ color: map.borderColor }}>{map.theme}</p>
            </div>
          </div>

          {/* Countdown overlay */}
          {phase === "countdown" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
              <motion.p
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="font-mono text-8xl font-bold"
                style={{ color: pvpColors.primary }}
              >
                {countdown}
              </motion.p>
            </div>
          )}

          {/* Round result overlay */}
          {phase === "round_result" && duel && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                <Trophy size={48} weight="fill" style={{ color: pvpColors.accent }} />
                <p className="mt-4 text-2xl font-bold">
                  {duel.rounds[duel.rounds.length - 1]?.winner === "player1" ? player1Hero.name : player2Hero.name} 获胜！
                </p>
                <button
                  onClick={handleNextRound}
                  className="pvp-btn pvp-btn-primary mt-6"
                >
                  <Play size={16} weight="fill" />
                  下一回合
                </button>
              </motion.div>
            </div>
          )}

          {/* Match result overlay */}
          {phase === "match_result" && duel && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full mx-auto"
                  style={{ background: `${pvpColors.accent}15`, border: `2px solid ${pvpColors.accent}` }}
                >
                  <Trophy size={40} weight="fill" style={{ color: pvpColors.accent }} />
                </div>
                <p className="text-3xl font-bold">
                  {getDuelWinner(duel)?.playerName === "铁拳格斗家" ? player1Hero.name : player2Hero.name}
                </p>
                <p className="mt-1 text-lg text-white/40">获得胜利</p>
                <p className="mt-2 font-mono text-sm text-white/30">
                  {summary.player1Score} : {summary.player2Score}
                </p>
                <div className="mt-6 flex gap-3 justify-center">
                  <button
                    onClick={handleRematch}
                    className="pvp-btn pvp-btn-ghost"
                  >
                    再来一局
                  </button>
                  <Link
                    href="/pvp"
                    className="pvp-btn pvp-btn-primary"
                  >
                    返回大厅
                  </Link>
                </div>
              </motion.div>
            </div>
          )}

          {/* Fighters */}
          <div className="relative z-0 flex items-center justify-between px-8 py-12" style={{ minHeight: "400px" }}>
            {/* Player 1 */}
            <motion.button
              onClick={() => handleDealDamage("player1")}
              disabled={phase !== "fighting"}
              initial={reducedMotion ? undefined : { opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-3 group"
              style={{ opacity: phase === "fighting" ? 1 : 0.5 }}
            >
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl text-3xl font-bold transition-transform group-hover:scale-110 group-active:scale-95"
                  style={{ background: `${player1Hero.color}20`, color: player1Hero.color, border: `2px solid ${player1Hero.color}30` }}
                >
                  {player1Hero.name[0]}
                </div>
                {phase === "fighting" && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                    <Crosshair size={16} weight="bold" className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#EF4444" }} />
                  </div>
                )}
              </div>
              <p className="text-sm font-bold" style={{ color: player1Hero.color }}>{player1Hero.name}</p>
              <p className="text-[10px] text-white/30">{player1Hero.tagline}</p>
              <div className="pvp-health-bar w-40">
                <div
                  className="pvp-health-bar-fill"
                  style={{
                    width: `${p1HealthPct}%`,
                    background: p1HealthPct > 50 ? "#22C55E" : p1HealthPct > 25 ? pvpColors.accent : "#EF4444",
                  }}
                />
              </div>
              <p className="font-mono text-xs text-white/40">{duel.player1.health} / {duel.player1.maxHealth}</p>
            </motion.button>

            {/* VS */}
            <div className="flex flex-col items-center gap-2">
              <div className="font-mono text-4xl font-bold opacity-10" style={{ color: pvpColors.primary }}>VS</div>
              <div className="flex gap-1.5">
                {Array.from({ length: summary.roundsToWin }).map((_, i) => (
                  <div key={i} className="flex gap-1.5">
                    <div className={`pvp-round-dot ${i < summary.player1Score ? "won" : ""}`} />
                    <div className={`pvp-round-dot ${i < summary.player2Score ? "won" : ""}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Player 2 */}
            <motion.button
              onClick={() => handleDealDamage("player2")}
              disabled={phase !== "fighting"}
              initial={reducedMotion ? undefined : { opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-3 group"
              style={{ opacity: phase === "fighting" ? 1 : 0.5 }}
            >
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl text-3xl font-bold transition-transform group-hover:scale-110 group-active:scale-95"
                  style={{ background: `${player2Hero.color}20`, color: player2Hero.color, border: `2px solid ${player2Hero.color}30` }}
                >
                  {player2Hero.name[0]}
                </div>
                {phase === "fighting" && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                    <Crosshair size={16} weight="bold" className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#EF4444" }} />
                  </div>
                )}
              </div>
              <p className="text-sm font-bold" style={{ color: player2Hero.color }}>{player2Hero.name}</p>
              <p className="text-[10px] text-white/30">{player2Hero.tagline}</p>
              <div className="pvp-health-bar w-40">
                <div
                  className="pvp-health-bar-fill"
                  style={{
                    width: `${p2HealthPct}%`,
                    background: p2HealthPct > 50 ? "#22C55E" : p2HealthPct > 25 ? pvpColors.accent : "#EF4444",
                  }}
                />
              </div>
              <p className="font-mono text-xs text-white/40">{duel.player2.health} / {duel.player2.maxHealth}</p>
            </motion.button>
          </div>
        </div>

        {/* Hero Info Panels */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Player 1 Info */}
          <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold" style={{ background: `${player1Hero.color}20`, color: player1Hero.color }}>
                {player1Hero.name[0]}
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: player1Hero.color }}>{player1Hero.name}</h3>
                <p className="text-[10px] text-white/30">{player1Hero.role}</p>
              </div>
            </div>
            <div className="space-y-2">
              {player1Hero.skills.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: skill.color }} />
                    <span className="text-xs font-medium">{skill.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-white/20">{skill.cooldown}s</span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: `${player1Hero.ultimate.color}10` }}>
                <div className="flex items-center gap-2">
                  <Fire size={12} weight="fill" style={{ color: player1Hero.ultimate.color }} />
                  <span className="text-xs font-medium" style={{ color: player1Hero.ultimate.color }}>{player1Hero.ultimate.name}</span>
                </div>
                <span className="font-mono text-[10px] text-white/20">{player1Hero.ultimate.cooldown}s</span>
              </div>
            </div>
          </div>

          {/* Player 2 Info */}
          <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold" style={{ background: `${player2Hero.color}20`, color: player2Hero.color }}>
                {player2Hero.name[0]}
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: player2Hero.color }}>{player2Hero.name}</h3>
                <p className="text-[10px] text-white/30">{player2Hero.role}</p>
              </div>
            </div>
            <div className="space-y-2">
              {player2Hero.skills.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: skill.color }} />
                    <span className="text-xs font-medium">{skill.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-white/20">{skill.cooldown}s</span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: `${player2Hero.ultimate.color}10` }}>
                <div className="flex items-center gap-2">
                  <Fire size={12} weight="fill" style={{ color: player2Hero.ultimate.color }} />
                  <span className="text-xs font-medium" style={{ color: player2Hero.ultimate.color }}>{player2Hero.ultimate.name}</span>
                </div>
                <span className="font-mono text-[10px] text-white/20">{player2Hero.ultimate.cooldown}s</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}