import type { PvPCustomRoom, PvPCustomRoomPlayer, PvPRoundFormat, PvPMapId, PvPHeroId, PvPWeaponId } from "./types";
import { getPvPMapName } from "./pvp-maps";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createCustomRoom(
  hostId: string,
  hostName: string,
  format: PvPRoundFormat = "BO3",
  mapId: PvPMapId = "forge_arena"
): PvPCustomRoom {
  return {
    roomCode: generateRoomCode(),
    hostId,
    hostName,
    format,
    mapId,
    maxPlayers: 2,
    players: [
      {
        peerId: hostId,
        playerName: hostName,
        ready: false,
        heroId: null,
        weaponId: null,
      },
    ],
    status: "waiting",
    createdAt: Date.now(),
  };
}

export function joinRoom(room: PvPCustomRoom, player: PvPCustomRoomPlayer): PvPCustomRoom {
  if (room.players.length >= room.maxPlayers) return room;
  if (room.players.find((p) => p.peerId === player.peerId)) return room;
  return {
    ...room,
    players: [...room.players, player],
  };
}

export function leaveRoom(room: PvPCustomRoom, peerId: string): PvPCustomRoom {
  const players = room.players.filter((p) => p.peerId !== peerId);
  if (players.length === 0) {
    return { ...room, players, status: "waiting" };
  }
  if (peerId === room.hostId && players.length > 0) {
    return {
      ...room,
      hostId: players[0].peerId,
      hostName: players[0].playerName,
      players,
      status: "waiting",
    };
  }
  return { ...room, players, status: "waiting" };
}

export function setPlayerReady(
  room: PvPCustomRoom,
  peerId: string,
  ready: boolean
): PvPCustomRoom {
  const players = room.players.map((p) =>
    p.peerId === peerId ? { ...p, ready } : p
  );

  const allReady = players.length === 2 && players.every((p) => p.ready);

  return {
    ...room,
    players,
    status: allReady ? "ready" : "waiting",
  };
}

export function selectHero(
  room: PvPCustomRoom,
  peerId: string,
  heroId: PvPHeroId
): PvPCustomRoom {
  const players = room.players.map((p) =>
    p.peerId === peerId ? { ...p, heroId } : p
  );
  return { ...room, players };
}

export function selectWeapon(
  room: PvPCustomRoom,
  peerId: string,
  weaponId: PvPWeaponId
): PvPCustomRoom {
  const players = room.players.map((p) =>
    p.peerId === peerId ? { ...p, weaponId } : p
  );
  return { ...room, players };
}

export function selectMap(room: PvPCustomRoom, mapId: PvPMapId): PvPCustomRoom {
  return { ...room, mapId };
}

export function selectFormat(room: PvPCustomRoom, format: PvPRoundFormat): PvPCustomRoom {
  return { ...room, format };
}

export function startFighting(room: PvPCustomRoom): PvPCustomRoom {
  if (room.status !== "ready") return room;
  return { ...room, status: "fighting" };
}

export function getRoomSummary(room: PvPCustomRoom): {
  roomCode: string;
  hostName: string;
  format: string;
  mapName: string;
  playerCount: number;
  maxPlayers: number;
  status: string;
  elapsed: number;
} {
  return {
    roomCode: room.roomCode,
    hostName: room.hostName,
    format: room.format,
    mapName: getPvPMapName(room.mapId),
    playerCount: room.players.length,
    maxPlayers: room.maxPlayers,
    status: room.status,
    elapsed: Date.now() - room.createdAt,
  };
}