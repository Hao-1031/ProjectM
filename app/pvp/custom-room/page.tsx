"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  House,
  Copy,
  UserPlus,
  Sword,
  Lightning,
  MapPin,
  ClockCounterClockwise,
  Link as LinkIcon,
  Play,
  Planet,
  Info,
} from "@phosphor-icons/react";
import Link from "next/link";
import { DESIGN_SYSTEM } from "@/lib/version";
import { listPvPHeroIds, getPvPHero, getPvPHeroName } from "@/lib/game/pvp/pvp-heroes";
import { listPvPWeaponIds, getPvPWeapon, getPvPWeaponName } from "@/lib/game/pvp/pvp-weapons";
import { listPvPMapIds, getPvPMap, getPvPMapName } from "@/lib/game/pvp/pvp-maps";
import { createCustomRoom, joinRoom, setPlayerReady, selectHero, selectWeapon, selectMap, selectFormat, startFighting, getRoomSummary } from "@/lib/game/pvp/custom-room";
import type { PvPHeroId, PvPWeaponId, PvPMapId, PvPRoundFormat, PvPCustomRoom, PvPCustomRoomPlayer } from "@/lib/game/pvp/types";

const pvpColors = DESIGN_SYSTEM.colors;

const HERO_IDS = listPvPHeroIds();
const WEAPON_IDS = listPvPWeaponIds();
const MAP_IDS = listPvPMapIds();

type RoomPhase = "create" | "lobby" | "fighting";

export default function PvPCustomRoom() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<RoomPhase>("create");
  const [room, setRoom] = useState<PvPCustomRoom | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [localHero, setLocalHero] = useState<PvPHeroId>(HERO_IDS[0]);
  const [localWeapon, setLocalWeapon] = useState<PvPWeaponId>(WEAPON_IDS[0]);
  const [localReady, setLocalReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localPlayerId = "host_local";

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleCreateRoom() {
    const newRoom = createCustomRoom(localPlayerId, "我", "BO3", "forge_arena");
    setRoom(newRoom);
    setPhase("lobby");
    setError(null);
  }

  function handleJoinRoom() {
    if (!joinCode.trim()) {
      setError("请输入房间码");
      return;
    }
    const mockRoom = createCustomRoom("remote_host", "对手", "BO3", "forge_arena");
    mockRoom.roomCode = joinCode.trim().toUpperCase();
    const joined = joinRoom(mockRoom, {
      peerId: localPlayerId,
      playerName: "我",
      ready: false,
      heroId: null,
      weaponId: null,
    });
    setRoom(joined);
    setPhase("lobby");
    setError(null);
  }

  function handleCopyRoomCode() {
    if (!room) return;
    navigator.clipboard.writeText(room.roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  function handleSelectHero(heroId: PvPHeroId) {
    setLocalHero(heroId);
    if (room) {
      const updated = selectHero(room, localPlayerId, heroId);
      setRoom(updated);
    }
  }

  function handleSelectWeapon(weaponId: PvPWeaponId) {
    setLocalWeapon(weaponId);
    if (room) {
      const updated = selectWeapon(room, localPlayerId, weaponId);
      setRoom(updated);
    }
  }

  function handleSelectMap(mapId: PvPMapId) {
    if (room) {
      setRoom(selectMap(room, mapId));
    }
  }

  function handleSelectFormat(format: PvPRoundFormat) {
    if (room) {
      setRoom(selectFormat(room, format));
    }
  }

  function handleToggleReady() {
    const newReady = !localReady;
    setLocalReady(newReady);
    if (room) {
      setRoom(setPlayerReady(room, localPlayerId, newReady));
    }
  }

  function handleStartFight() {
    if (!room) return;
    const fighting = startFighting(room);
    setRoom(fighting);
    setPhase("fighting");
  }

  if (!mounted) return null;

  const playerHero = getPvPHero(localHero);
  const playerWeapon = getPvPWeapon(localWeapon);

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
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/30">自定义房间</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 lg:px-8 lg:py-16">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="pvp-error-state mb-6"
          >
            <Info size={20} style={{ color: "#EF4444" }} />
            <p className="mt-2 text-sm font-medium" style={{ color: "#EF4444" }}>{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-3 text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              关闭
            </button>
          </motion.div>
        )}

        {phase === "create" && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Create Room */}
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl border p-8"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl mb-6" style={{ background: `${pvpColors.primary}15` }}>
                <House size={24} weight="bold" style={{ color: pvpColors.primary }} />
              </div>
              <h2 className="text-2xl font-bold">创建房间</h2>
              <p className="mt-2 text-sm text-white/40">创建自定义房间，将房间码分享给好友，选择英雄和武器后开始对决。</p>
              <button
                onClick={handleCreateRoom}
                className="pvp-btn pvp-btn-primary mt-6 w-full justify-center"
              >
                <House size={16} weight="bold" />
                创建房间
              </button>
            </motion.div>

            {/* Join Room */}
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl border p-8"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl mb-6" style={{ background: `${pvpColors.accent}15` }}>
                <UserPlus size={24} weight="bold" style={{ color: pvpColors.accent }} />
              </div>
              <h2 className="text-2xl font-bold">加入房间</h2>
              <p className="mt-2 text-sm text-white/40">输入好友分享的 6 位房间码，加入他们的自定义房间。</p>
              <div className="mt-6">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="输入房间码"
                  maxLength={6}
                  className="w-full rounded-xl border px-4 py-3 font-mono text-lg font-bold uppercase tracking-[0.3em] text-center transition-all focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: pvpColors.foreground,
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleJoinRoom(); }}
                />
              </div>
              <button
                onClick={handleJoinRoom}
                className="pvp-btn pvp-btn-primary mt-4 w-full justify-center"
                style={{ background: pvpColors.accent, borderColor: pvpColors.accent }}
              >
                <LinkIcon size={16} weight="bold" />
                加入房间
              </button>
            </motion.div>
          </div>
        )}

        {phase === "lobby" && room && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Room Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold">房间大厅</h1>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <span className="font-mono text-sm font-bold tracking-[0.2em]" style={{ color: pvpColors.primary }}>{room.roomCode}</span>
                    <button
                      onClick={handleCopyRoomCode}
                      className="text-white/40 hover:text-white/80 transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  {copied && (
                    <span className="text-xs" style={{ color: pvpColors.accent }}>已复制</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setPhase("create"); setRoom(null); }}
                  className="pvp-btn pvp-btn-ghost text-sm"
                >
                  离开房间
                </button>
                <button
                  onClick={handleStartFight}
                  className="pvp-btn pvp-btn-primary"
                >
                  <Play size={16} weight="fill" />
                  开始对决
                </button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Config Panel */}
              <div className="space-y-6">
                {/* Format */}
                <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.15em] text-white/40">赛制</h3>
                  <div className="flex gap-2">
                    {(["BO3", "BO5"] as PvPRoundFormat[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => handleSelectFormat(f)}
                        className="flex-1 rounded-lg border py-2 text-sm font-bold transition-all"
                        style={{
                          background: room.format === f ? `${pvpColors.primary}15` : "transparent",
                          borderColor: room.format === f ? pvpColors.primary : "rgba(255,255,255,0.1)",
                          color: room.format === f ? pvpColors.primary : "rgba(255,255,255,0.5)",
                        }}
                      >
                        {f === "BO3" ? "三局两胜" : "五局三胜"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Map */}
                <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <h3 className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.15em] text-white/40">
                    <MapPin size={14} weight="bold" style={{ color: pvpColors.accent }} />
                    选择地图
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {MAP_IDS.map((id) => {
                      const m = getPvPMap(id);
                      const isSelected = room.mapId === id;
                      return (
                        <button
                          key={id}
                          onClick={() => handleSelectMap(id)}
                          className={`pvp-map-card ${isSelected ? "selected" : ""}`}
                          style={{ padding: "0.5rem" }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md" style={{ background: m.backgroundColor }} />
                            <div className="text-left">
                              <p className="text-xs font-bold" style={{ color: isSelected ? pvpColors.primary : pvpColors.foreground }}>{m.name}</p>
                              <p className="text-[10px] text-white/30">{m.theme}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Hero & Weapon */}
              <div className="space-y-6">
                <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <h3 className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.15em] text-white/40">
                    <Sword size={14} weight="bold" style={{ color: pvpColors.primary }} />
                    英雄
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {HERO_IDS.map((id) => {
                      const h = getPvPHero(id);
                      const isSelected = localHero === id;
                      return (
                        <button
                          key={id}
                          onClick={() => handleSelectHero(id)}
                          className={`pvp-hero-card ${isSelected ? "selected" : ""}`}
                          style={{ "--hero-color": h.color } as React.CSSProperties}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold" style={{ background: `${h.color}20`, color: h.color }}>
                              {h.name[0]}
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold">{h.name}</p>
                              <p className="text-[10px] text-white/30">{h.role}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                  <h3 className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.15em] text-white/40">
                    <Lightning size={14} weight="bold" style={{ color: pvpColors.accent }} />
                    武器
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {WEAPON_IDS.map((id) => {
                      const w = getPvPWeapon(id);
                      const isSelected = localWeapon === id;
                      return (
                        <button
                          key={id}
                          onClick={() => handleSelectWeapon(id)}
                          className={`pvp-hero-card ${isSelected ? "selected" : ""}`}
                          style={{ "--hero-color": w.color } as React.CSSProperties}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold" style={{ background: `${w.color}20`, color: w.color }}>
                              {w.name[0]}
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold">{w.name}</p>
                              <p className="text-[10px] text-white/30">{w.type === "melee" ? "近战" : w.type === "ranged" ? "远程" : "混合"}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Ready Panel */}
              <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                <h3 className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.15em] text-white/40">就绪状态</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold" style={{ background: `${playerHero.color}20`, color: playerHero.color }}>
                        {playerHero.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{playerHero.name}</p>
                        <p className="text-[10px] text-white/30">{playerWeapon.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${localReady ? "bg-green-500" : "bg-white/20"}`} />
                      <span className="text-xs text-white/30">{localReady ? "已就绪" : "未就绪"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4 opacity-40" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" }}>
                        ?
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white/30">等待对手...</p>
                        <p className="text-[10px] text-white/20">未选择</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                      <span className="text-xs text-white/20">未就绪</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleToggleReady}
                  className="pvp-btn mt-6 w-full justify-center"
                  style={{
                    background: localReady ? `${pvpColors.primary}15` : pvpColors.primary,
                    color: localReady ? pvpColors.primary : pvpColors.background,
                    borderColor: localReady ? pvpColors.primary : "transparent",
                  }}
                >
                  {localReady ? "取消就绪" : "准备就绪"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}