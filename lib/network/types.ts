import type { SerializedGameState, InputState, GameModeType, GameEvent } from "@/lib/game/types";

export type NetworkRole = "host" | "client";

export interface NetworkPlayer {
  peerId: string;
  playerName: string;
  ready: boolean;
  latency: number;
  lastInputFrame: number;
}

export interface GameRoom {
  roomCode: string;
  hostId: string;
  players: NetworkPlayer[];
  maxPlayers: number;
  status: "lobby" | "starting" | "playing";
  seed: number;
  mode: GameModeType;
}

export interface StateBatchMessage {
  type: "state_batch";
  states: SerializedGameState[];
  frameStart: number;
  frameEnd: number;
  timestamp: number;
}

export interface HostMigrationMessage {
  type: "host_migration";
  newHostId: string;
  newHostPeerId: string;
  timestamp: number;
}

export interface QualityMessage {
  type: "quality";
  peerId: string;
  quality: ConnectionQuality;
  timestamp: number;
}

export type NetworkMessage =
  | { type: "hello"; peerId: string; playerName: string; timestamp: number }
  | { type: "state"; state: SerializedGameState; timestamp: number; frame: number }
  | { type: "input"; input: InputState; timestamp: number; frame: number }
  | { type: "ready"; peerId: string; ready: boolean }
  | { type: "start"; seed: number; mode: GameModeType; timestamp: number }
  | { type: "event"; event: string; data: unknown }
  | { type: "ping"; timestamp: number }
  | { type: "pong"; timestamp: number }
  | { type: "heartbeat"; peerId: string; timestamp: number }
  | { type: "reconnect"; peerId: string; playerName: string; timestamp: number }
  | { type: "player_list"; players: NetworkPlayer[]; timestamp: number }
  | { type: "kick"; peerId: string; reason: string; timestamp: number }
  | {
      type: "discovery";
      roomCode: string;
      hostId: string;
      playerName: string;
      timestamp: number;
    }
  | {
      type: "discovery_response";
      roomCode: string;
      hostId: string;
      playerName: string;
      timestamp: number;
    }
  | StateBatchMessage
  | HostMigrationMessage
  | QualityMessage;

export interface ConnectionQuality {
  rtt: number;
  packetLoss: number;
  jitter: number;
  score: "good" | "fair" | "poor" | "unknown";
}

export interface PeerConnectionState {
  peerId: string;
  role: NetworkRole;
  connected: boolean;
  latency: number;
  quality: ConnectionQuality;
}

export interface RoomState {
  roomCode: string;
  hostId: string;
  players: NetworkPlayer[];
  maxPlayers: number;
  status: "lobby" | "starting" | "playing";
  seed: number;
  mode: GameModeType;
  localPeerId: string;
  role: NetworkRole;
}
