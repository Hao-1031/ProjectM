import type { Vec2 } from "@/lib/game/types";

/** PvP 决斗模式 */
export type PvPDuelMode = "casual" | "ranked" | "custom";

/** 决斗回合制 */
export type PvPRoundFormat = "BO3" | "BO5";

/** PvP 英雄ID */
export type PvPHeroId =
  | "iron_fist"
  | "shadow_assassin"
  | "flame_knight"
  | "storm_ranger";

/** PvP 武器ID */
export type PvPWeaponId =
  | "brass_knuckles"
  | "crossbow"
  | "combat_blade"
  | "shock_gauntlet"
  | "tactical_bow"
  | "phase_dagger";

/** PvP 地图ID */
export type PvPMapId =
  | "forge_arena"
  | "pipeline_yard"
  | "ancient_grove"
  | "crystal_cavern"
  | "server_farm"
  | "neon_rooftop"
  | "colosseum"
  | "zen_garden";

/** PvP 地图主题分类 */
export type PvPMapTheme = "industrial" | "natural" | "tech" | "classical";

/** PvP 回合状态 */
export type PvPRoundStatus = "preparing" | "fighting" | "finished";

/** PvP 对决状态 */
export type PvPDuelStatus = "lobby" | "matchmaking" | "ready" | "fighting" | "round_end" | "finished" | "cancelled";

/** PvP 英雄定义 */
export interface PvPHeroDef {
  id: PvPHeroId;
  name: string;
  role: string;
  tagline: string;
  description: string;
  color: string;
  health: number;
  armor: number;
  speed: number;
  skills: PvPSkill[];
  ultimate: PvPSkill;
  passive: PvPHeroPassive;
}

/** PvP 技能 */
export interface PvPSkill {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  damage: number;
  range: number;
  duration: number;
  color: string;
}

/** PvP 英雄被动 */
export interface PvPHeroPassive {
  name: string;
  description: string;
  healthRegen?: number;
  damageBonus?: number;
  speedBonus?: number;
  armorBonus?: number;
}

/** PvP 武器定义 */
export interface PvPWeaponDef {
  id: PvPWeaponId;
  name: string;
  type: "melee" | "ranged" | "hybrid";
  description: string;
  damage: number;
  attackSpeed: number;
  range: number;
  knockback: number;
  special: PvPWeaponSpecial;
  color: string;
}

/** PvP 武器特殊效果 */
export interface PvPWeaponSpecial {
  name: string;
  description: string;
  cooldown: number;
  type: "combo" | "charge" | "parry" | "dash" | "burst" | "teleport";
}

/** PvP 竞技地图定义 */
export interface PvPMapDef {
  id: PvPMapId;
  name: string;
  theme: PvPMapTheme;
  description: string;
  width: number;
  height: number;
  spawnPoints: Vec2[];
  coverPositions: Vec2[];
  hazardZones: PvPHazardZone[];
  visualTheme: string;
  backgroundColor: string;
  borderColor: string;
}

/** PvP 危险区域 */
export interface PvPHazardZone {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "lava" | "spike" | "laser" | "void" | "electric";
  damage: number;
  active: boolean;
}

/** PvP 回合定义 */
export interface PvPRound {
  roundNumber: number;
  status: PvPRoundStatus;
  winner: string | null;
  duration: number;
  damageDealt: Record<string, number>;
  startTime: number;
  endTime: number | null;
}

/** PvP 对决 */
export interface PvPDuel {
  id: string;
  mode: PvPDuelMode;
  format: PvPRoundFormat;
  status: PvPDuelStatus;
  player1: PvPDuelPlayer;
  player2: PvPDuelPlayer;
  rounds: PvPRound[];
  currentRound: number;
  mapId: PvPMapId;
  startTime: number;
  endTime: number | null;
  winner: string | null;
  ratingChange: number | null;
}

/** PvP 对决玩家 */
export interface PvPDuelPlayer {
  peerId: string;
  playerName: string;
  heroId: PvPHeroId;
  weaponId: PvPWeaponId;
  health: number;
  maxHealth: number;
  score: number;
  roundsWon: number;
  latency: number;
  ready: boolean;
}

/** PvP 自定义房间 */
export interface PvPCustomRoom {
  roomCode: string;
  hostId: string;
  hostName: string;
  format: PvPRoundFormat;
  mapId: PvPMapId;
  maxPlayers: 2;
  players: PvPCustomRoomPlayer[];
  status: "waiting" | "ready" | "fighting";
  createdAt: number;
}

/** PvP 自定义房间玩家 */
export interface PvPCustomRoomPlayer {
  peerId: string;
  playerName: string;
  ready: boolean;
  heroId: PvPHeroId | null;
  weaponId: PvPWeaponId | null;
}

/** PvP 匹配队列玩家 */
export interface PvPMatchmakingPlayer {
  id: string;
  name: string;
  rating: number;
  latency: number;
  preferredFormat: PvPRoundFormat;
  queuedAt: number;
}

/** PvP 匹配结果 */
export interface PvPMatchResult {
  players: [PvPMatchmakingPlayer, PvPMatchmakingPlayer];
  format: PvPRoundFormat;
  mapId: PvPMapId;
  matchQuality: number;
  estimatedLatency: number;
}

/** PvP 战绩 */
export interface PvPBattleRecord {
  id: string;
  duelId: string;
  date: number;
  mode: PvPDuelMode;
  format: PvPRoundFormat;
  playerName: string;
  opponentName: string;
  playerHero: PvPHeroId;
  opponentHero: PvPHeroId;
  playerWeapon: PvPWeaponId;
  opponentWeapon: PvPWeaponId;
  mapId: PvPMapId;
  result: "win" | "loss" | "draw";
  roundsWon: number;
  roundsLost: number;
  ratingChange: number;
  duration: number;
}

/** PvP 玩家统计 */
export interface PvPPlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  rating: number;
  highestRating: number;
  favoriteHero: PvPHeroId | null;
  favoriteWeapon: PvPWeaponId | null;
  bestMap: PvPMapId | null;
  currentStreak: number;
  longestStreak: number;
  seasonRank: string;
}

/** PvP 网络消息扩展 */
export type PvPNetworkMessageType =
  | "pvp_duel_start"
  | "pvp_round_start"
  | "pvp_round_end"
  | "pvp_duel_end"
  | "pvp_input"
  | "pvp_hero_select"
  | "pvp_weapon_select"
  | "pvp_map_select"
  | "pvp_matchmaking_join"
  | "pvp_matchmaking_leave"
  | "pvp_matchmaking_found"
  | "pvp_custom_create"
  | "pvp_custom_join"
  | "pvp_custom_leave"
  | "pvp_custom_ready";

export interface PvPNetworkMessage {
  type: PvPNetworkMessageType;
  duelId?: string;
  playerId?: string;
  heroId?: PvPHeroId;
  weaponId?: PvPWeaponId;
  mapId?: PvPMapId;
  format?: PvPRoundFormat;
  roundNumber?: number;
  winner?: string;
  payload?: unknown;
  timestamp: number;
}