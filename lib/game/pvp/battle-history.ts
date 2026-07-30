import type { PvPBattleRecord, PvPPlayerStats, PvPHeroId, PvPWeaponId, PvPMapId, PvPDuelMode, PvPRoundFormat } from "./types";
import { getPvPHeroName } from "./pvp-heroes";
import { getPvPWeaponName } from "./pvp-weapons";
import { getPvPMapName } from "./pvp-maps";

const BATTLE_HISTORY_KEY = "pvp_battle_history";
const PLAYER_STATS_KEY = "pvp_player_stats";
const MAX_HISTORY_SIZE = 100;

function generateRecordId(): string {
  return `REC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function createBattleRecord(params: {
  duelId: string;
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
}): PvPBattleRecord {
  return {
    id: generateRecordId(),
    duelId: params.duelId,
    date: Date.now(),
    mode: params.mode,
    format: params.format,
    playerName: params.playerName,
    opponentName: params.opponentName,
    playerHero: params.playerHero,
    opponentHero: params.opponentHero,
    playerWeapon: params.playerWeapon,
    opponentWeapon: params.opponentWeapon,
    mapId: params.mapId,
    result: params.result,
    roundsWon: params.roundsWon,
    roundsLost: params.roundsLost,
    ratingChange: params.ratingChange,
    duration: params.duration,
  };
}

export function saveBattleRecord(record: PvPBattleRecord): void {
  if (typeof localStorage === "undefined") return;
  try {
    const history = getBattleHistory();
    history.unshift(record);
    if (history.length > MAX_HISTORY_SIZE) {
      history.length = MAX_HISTORY_SIZE;
    }
    localStorage.setItem(BATTLE_HISTORY_KEY, JSON.stringify(history));
    updatePlayerStats(record);
  } catch {
    // 忽略存储错误
  }
}

export function getBattleHistory(): PvPBattleRecord[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(BATTLE_HISTORY_KEY);
    return raw ? JSON.parse(raw) as PvPBattleRecord[] : [];
  } catch {
    return [];
  }
}

export function getBattleRecord(id: string): PvPBattleRecord | undefined {
  return getBattleHistory().find((r) => r.id === id);
}

export function getRecentBattles(count: number = 10): PvPBattleRecord[] {
  return getBattleHistory().slice(0, count);
}

export function clearBattleHistory(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(BATTLE_HISTORY_KEY);
    localStorage.removeItem(PLAYER_STATS_KEY);
  } catch {
    // 忽略清理错误
  }
}

function getDefaultStats(): PvPPlayerStats {
  return {
    totalMatches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    rating: 1200,
    highestRating: 1200,
    favoriteHero: null,
    favoriteWeapon: null,
    bestMap: null,
    currentStreak: 0,
    longestStreak: 0,
    seasonRank: "未定级",
  };
}

function updatePlayerStats(record: PvPBattleRecord): void {
  if (typeof localStorage === "undefined") return;
  try {
    const stats = getPlayerStats();
    stats.totalMatches++;

    if (record.result === "win") {
      stats.wins++;
      stats.currentStreak = Math.max(0, stats.currentStreak) + 1;
    } else if (record.result === "loss") {
      stats.losses++;
      stats.currentStreak = Math.min(0, stats.currentStreak) - 1;
    } else {
      stats.draws++;
    }

    stats.winRate = stats.totalMatches > 0 ? stats.wins / stats.totalMatches : 0;
    stats.rating += record.ratingChange;
    stats.rating = Math.max(0, stats.rating);
    stats.highestRating = Math.max(stats.highestRating, stats.rating);
    stats.longestStreak = Math.max(stats.longestStreak, Math.abs(stats.currentStreak));

    stats.favoriteHero = record.playerHero;
    stats.favoriteWeapon = record.playerWeapon;
    stats.bestMap = record.mapId;

    stats.seasonRank = getRankFromRating(stats.rating);

    localStorage.setItem(PLAYER_STATS_KEY, JSON.stringify(stats));
  } catch {
    // 忽略存储错误
  }
}

export function getPlayerStats(): PvPPlayerStats {
  if (typeof localStorage === "undefined") return getDefaultStats();
  try {
    const raw = localStorage.getItem(PLAYER_STATS_KEY);
    return raw ? { ...getDefaultStats(), ...JSON.parse(raw) } : getDefaultStats();
  } catch {
    return getDefaultStats();
  }
}

export function getRankFromRating(rating: number): string {
  if (rating >= 2200) return "传说";
  if (rating >= 2000) return "大师";
  if (rating >= 1800) return "钻石";
  if (rating >= 1600) return "铂金";
  if (rating >= 1400) return "黄金";
  if (rating >= 1200) return "白银";
  return "青铜";
}

export function getRankColor(rating: number): string {
  if (rating >= 2200) return "#FF4500";
  if (rating >= 2000) return "#FFD700";
  if (rating >= 1800) return "#00BFFF";
  if (rating >= 1600) return "#00CED1";
  if (rating >= 1400) return "#FFD700";
  if (rating >= 1200) return "#C0C0C0";
  return "#CD7F32";
}

export function formatBattleRecordForDisplay(record: PvPBattleRecord): {
  date: string;
  result: string;
  resultColor: string;
  heroName: string;
  opponentHeroName: string;
  weaponName: string;
  opponentWeaponName: string;
  mapName: string;
  scoreDisplay: string;
  ratingChangeDisplay: string;
  durationDisplay: string;
} {
  const date = new Date(record.date);
  const resultMap = { win: "胜利", loss: "失败", draw: "平局" };
  const resultColorMap = { win: "#22C55E", loss: "#EF4444", draw: "#9CA3AF" };

  const ratingSign = record.ratingChange >= 0 ? "+" : "";
  const ratingColor = record.ratingChange >= 0 ? "#22C55E" : "#EF4444";

  const minutes = Math.floor(record.duration / 60000);
  const seconds = Math.floor((record.duration % 60000) / 1000);

  return {
    date: `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`,
    result: resultMap[record.result],
    resultColor: resultColorMap[record.result],
    heroName: getPvPHeroName(record.playerHero),
    opponentHeroName: getPvPHeroName(record.opponentHero),
    weaponName: getPvPWeaponName(record.playerWeapon),
    opponentWeaponName: getPvPWeaponName(record.opponentWeapon),
    mapName: getPvPMapName(record.mapId),
    scoreDisplay: `${record.roundsWon} : ${record.roundsLost}`,
    ratingChangeDisplay: `${ratingSign}${record.ratingChange}`,
    durationDisplay: `${minutes}:${seconds.toString().padStart(2, "0")}`,
  };
}