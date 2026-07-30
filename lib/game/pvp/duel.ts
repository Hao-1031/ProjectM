import type { PvPDuel, PvPDuelPlayer, PvPRound, PvPDuelMode, PvPRoundFormat, PvPDuelStatus, PvPHeroId, PvPWeaponId, PvPMapId } from "./types";
import { getPvPHero } from "./pvp-heroes";
import { getPvPWeapon } from "./pvp-weapons";
import { getPvPMap } from "./pvp-maps";

function generateDuelId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "DUEL-";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function createDuelPlayer(
  peerId: string,
  playerName: string,
  heroId: PvPHeroId,
  weaponId: PvPWeaponId
): PvPDuelPlayer {
  const hero = getPvPHero(heroId);
  return {
    peerId,
    playerName,
    heroId,
    weaponId,
    health: hero.health,
    maxHealth: hero.health,
    score: 0,
    roundsWon: 0,
    latency: 0,
    ready: false,
  };
}

export function createDuel(
  mode: PvPDuelMode,
  format: PvPRoundFormat,
  mapId: PvPMapId,
  player1: { peerId: string; playerName: string; heroId: PvPHeroId; weaponId: PvPWeaponId },
  player2: { peerId: string; playerName: string; heroId: PvPHeroId; weaponId: PvPWeaponId }
): PvPDuel {
  return {
    id: generateDuelId(),
    mode,
    format,
    status: "ready",
    player1: createDuelPlayer(player1.peerId, player1.playerName, player1.heroId, player1.weaponId),
    player2: createDuelPlayer(player2.peerId, player2.playerName, player2.heroId, player2.weaponId),
    rounds: [],
    currentRound: 0,
    mapId,
    startTime: Date.now(),
    endTime: null,
    winner: null,
    ratingChange: null,
  };
}

export function startDuel(duel: PvPDuel): PvPDuel {
  if (duel.status !== "ready") return duel;
  return { ...duel, status: "fighting", startTime: Date.now() };
}

export function startRound(duel: PvPDuel): PvPDuel {
  const roundNumber = duel.rounds.length + 1;
  const round: PvPRound = {
    roundNumber,
    status: "fighting",
    winner: null,
    duration: 0,
    damageDealt: { [duel.player1.peerId]: 0, [duel.player2.peerId]: 0 },
    startTime: Date.now(),
    endTime: null,
  };

  return {
    ...duel,
    status: "fighting",
    currentRound: roundNumber,
    rounds: [...duel.rounds, round],
    player1: { ...duel.player1, health: duel.player1.maxHealth, ready: false },
    player2: { ...duel.player2, health: duel.player2.maxHealth, ready: false },
  };
}

export function endRound(duel: PvPDuel, winnerPeerId: string): PvPDuel {
  const rounds = [...duel.rounds];
  const currentRound = rounds[rounds.length - 1];
  if (!currentRound || currentRound.status !== "fighting") return duel;

  currentRound.status = "finished";
  currentRound.winner = winnerPeerId;
  currentRound.endTime = Date.now();
  currentRound.duration = currentRound.endTime - currentRound.startTime;

  const winnerPlayer = winnerPeerId === duel.player1.peerId ? duel.player1 : duel.player2;
  const loserPlayer = winnerPeerId === duel.player1.peerId ? duel.player2 : duel.player1;

  const updatedWinner = { ...winnerPlayer, roundsWon: winnerPlayer.roundsWon + 1, score: winnerPlayer.score + 100 };

  const roundsToWin = duel.format === "BO3" ? 2 : 3;
  const duelFinished = updatedWinner.roundsWon >= roundsToWin;

  return {
    ...duel,
    status: duelFinished ? "finished" : "round_end",
    player1: duel.player1.peerId === winnerPeerId ? updatedWinner : { ...duel.player1 },
    player2: duel.player2.peerId === winnerPeerId ? updatedWinner : { ...duel.player2 },
    rounds,
    winner: duelFinished ? winnerPeerId : null,
    endTime: duelFinished ? Date.now() : null,
  };
}

export function dealDamage(duel: PvPDuel, targetPeerId: string, damage: number, attackerPeerId: string): PvPDuel {
  const isPlayer1 = targetPeerId === duel.player1.peerId;
  const target = isPlayer1 ? duel.player1 : duel.player2;
  const newHealth = Math.max(0, target.health - damage);

  const rounds = [...duel.rounds];
  const currentRound = rounds[rounds.length - 1];
  if (currentRound && currentRound.status === "fighting") {
    currentRound.damageDealt[attackerPeerId] = (currentRound.damageDealt[attackerPeerId] ?? 0) + damage;
  }

  const updatedPlayer = { ...target, health: newHealth };

  if (newHealth <= 0) {
    const killerPeerId = attackerPeerId;
    const updated: PvPDuel = {
      ...duel,
      [isPlayer1 ? "player1" : "player2"]: updatedPlayer,
      rounds,
      status: "round_end",
    };
    return endRound(updated, killerPeerId);
  }

  return {
    ...duel,
    [isPlayer1 ? "player1" : "player2"]: updatedPlayer,
    rounds,
  };
}

export function calculateRatingChange(
  winnerRating: number,
  loserRating: number,
  format: PvPRoundFormat
): number {
  const k = format === "BO5" ? 32 : 24;
  const expected = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  return Math.round(k * (1 - expected));
}

export function getDuelRoundSummary(duel: PvPDuel): {
  player1Score: number;
  player2Score: number;
  totalRounds: number;
  roundsToWin: number;
} {
  return {
    player1Score: duel.player1.roundsWon,
    player2Score: duel.player2.roundsWon,
    totalRounds: duel.rounds.length,
    roundsToWin: duel.format === "BO3" ? 2 : 3,
  };
}

export function isDuelFinished(duel: PvPDuel): boolean {
  return duel.status === "finished";
}

export function getDuelDuration(duel: PvPDuel): number {
  const end = duel.endTime ?? Date.now();
  return end - duel.startTime;
}

export function getDuelWinner(duel: PvPDuel): PvPDuelPlayer | null {
  if (!duel.winner) return null;
  return duel.winner === duel.player1.peerId ? duel.player1 : duel.player2;
}

export function getDuelLoser(duel: PvPDuel): PvPDuelPlayer | null {
  if (!duel.winner) return null;
  return duel.winner === duel.player1.peerId ? duel.player2 : duel.player1;
}