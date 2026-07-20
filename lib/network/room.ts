import type { GameModeType, SerializedGameState } from "@/lib/game/types";
import type { ConnectionQuality, NetworkMessage, NetworkPlayer, NetworkRole } from "./types";
import { PeerConnection } from "./peer";
import { SignalingChannel } from "./signaling";

export interface RoomOptions {
  playerName: string;
  role: NetworkRole;
  maxPlayers?: number;
  batchInterval?: number;
  onPeerConnect?: (peerId: string) => void;
  onPeerDisconnect?: (peerId: string) => void;
  onNetworkMessage?: (peerId: string, message: NetworkMessage) => void;
  onGameStart?: (seed: number, mode: GameModeType) => void;
  onAllReady?: () => void;
  onError?: (error: Error, peerId?: string) => void;
  onPlayerListChange?: (players: NetworkPlayer[]) => void;
  onReconnecting?: (peerId: string) => void;
  onReconnected?: (peerId: string) => void;
  onHostMigrated?: (newHostId: string) => void;
  onConnectionQualityChange?: (peerId: string, quality: ConnectionQuality) => void;
}

interface ReconnectState {
  peerId: string;
  playerName: string;
  attempts: number;
  timer: ReturnType<typeof setTimeout> | null;
}

interface PendingPing {
  peerId: string;
  timestamp: number;
}

const HEARTBEAT_INTERVAL = 2000;
const HEARTBEAT_TIMEOUT = 8000;
const RECONNECT_BASE_INTERVAL = 1000;
const MAX_RECONNECT_ATTEMPTS = 5;
const PING_INTERVAL = 1000;
const DEFAULT_BATCH_INTERVAL = 50;
const MAX_BATCH_SIZE = 16;

export class GameRoomManager {
  roomCode: string;
  role: NetworkRole;
  hostId: string;
  localPeerId: string;
  playerName: string;
  maxPlayers: number;
  players: NetworkPlayer[] = [];
  private peers = new Map<string, PeerConnection>();
  private signaling: SignalingChannel;
  private localReady = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private batchTimer: ReturnType<typeof setInterval> | null = null;
  private lastSeen = new Map<string, number>();
  private reconnectStates = new Map<string, ReconnectState>();
  private pendingPings = new Map<string, PendingPing>();
  private connectionQuality = new Map<string, ConnectionQuality>();
  private stateBatchQueue: SerializedGameState[] = [];
  private stateBatchFrames: number[] = [];
  private batchInterval: number;
  private onDiscoveryResponse?: (roomCode: string, hostId: string, playerName: string) => void;

  private onPeerConnect?: (peerId: string) => void;
  private onPeerDisconnect?: (peerId: string) => void;
  private onNetworkMessage?: (peerId: string, message: NetworkMessage) => void;
  private onGameStart?: (seed: number, mode: GameModeType) => void;
  private onAllReady?: () => void;
  private onError?: (error: Error, peerId?: string) => void;
  private onPlayerListChange?: (players: NetworkPlayer[]) => void;
  private onReconnecting?: (peerId: string) => void;
  private onReconnected?: (peerId: string) => void;
  private onHostMigrated?: (newHostId: string) => void;
  private onConnectionQualityChange?: (peerId: string, quality: ConnectionQuality) => void;

  constructor(options: RoomOptions) {
    this.playerName = options.playerName;
    this.role = options.role;
    this.maxPlayers = options.maxPlayers ?? 4;
    this.batchInterval = options.batchInterval ?? DEFAULT_BATCH_INTERVAL;
    this.localPeerId =
      this.role === "host" ? "host" : `peer_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.hostId = this.role === "host" ? this.localPeerId : "host";
    this.roomCode = this.role === "host" ? generateRoomCode() : "";
    this.onPeerConnect = options.onPeerConnect;
    this.onPeerDisconnect = options.onPeerDisconnect;
    this.onNetworkMessage = options.onNetworkMessage;
    this.onGameStart = options.onGameStart;
    this.onAllReady = options.onAllReady;
    this.onError = options.onError;
    this.onPlayerListChange = options.onPlayerListChange;
    this.onReconnecting = options.onReconnecting;
    this.onReconnected = options.onReconnected;
    this.onHostMigrated = options.onHostMigrated;
    this.onConnectionQualityChange = options.onConnectionQualityChange;

    this.signaling = this.createSignalingChannel();
  }

  private createSignalingChannel(): SignalingChannel {
    return new SignalingChannel({
      roomCode: this.roomCode,
      localPeerId: this.localPeerId,
      onOffer: (peerId, offer) => this.handleOffer(peerId, offer),
      onAnswer: (peerId, answer) => this.handleAnswer(peerId, answer),
      onDiscovery: (roomCode, hostId, playerName) =>
        this.handleDiscovery(roomCode, hostId, playerName),
      onDiscoveryResponse: (roomCode, hostId, playerName) =>
        this.handleDiscoveryResponse(roomCode, hostId, playerName),
    });
  }

  async createRoom(): Promise<string> {
    if (this.role !== "host") throw new Error("Only host can create room");
    await this.signaling.open();
    this.startHeartbeat();
    this.startPingTimer();
    this.startBatchTimer();
    return this.roomCode;
  }

  async joinRoom(roomCode: string): Promise<void> {
    if (this.role !== "client") throw new Error("Only client can join room");
    this.roomCode = roomCode;
    this.signaling.setRoomCode(roomCode);
    await this.signaling.open();
    this.startHeartbeat();
    this.startPingTimer();
    this.startBatchTimer();
  }

  discoverRooms(): void {
    this.signaling.sendDiscovery(this.roomCode || "*", this.localPeerId, this.playerName);
  }

  setDiscoveryResponse(
    callback: (roomCode: string, hostId: string, playerName: string) => void
  ): void {
    this.onDiscoveryResponse = callback;
  }

  private handleDiscovery(roomCode: string, hostId: string, playerName: string): void {
    if (this.role !== "host") return;
    if (roomCode !== "*" && roomCode !== this.roomCode) return;
    this.signaling.sendDiscoveryResponse(this.roomCode, this.localPeerId, this.playerName);
  }

  private handleDiscoveryResponse(roomCode: string, hostId: string, playerName: string): void {
    if (this.role !== "client") return;
    this.onDiscoveryResponse?.(roomCode, hostId, playerName);
  }

  async handleOffer(
    peerId: string,
    offer: RTCSessionDescriptionInit & { candidates: RTCIceCandidateInit[] }
  ): Promise<void> {
    if (this.peers.size >= this.maxPlayers - 1) return;

    let peer = this.peers.get(peerId);
    if (!peer) {
      peer = new PeerConnection({
        peerId,
        role: "client",
        onMessage: (msg) => this.handleMessage(peerId, msg),
        onOpen: () => this.handlePeerOpen(peerId),
        onClose: () => this.handlePeerClose(peerId),
        onError: (err) => this.handlePeerError(peerId, err),
      });
      peer.createConnection();
      this.peers.set(peerId, peer);
    }

    const normalizedOffer = { ...offer, sdp: offer.sdp ?? "" };
    const answer = await peer.acceptOffer(normalizedOffer);
    await peer.addIceCandidates(offer.candidates);
    this.signaling.sendAnswer(peerId, answer);
  }

  async handleAnswer(
    peerId: string,
    answer: RTCSessionDescriptionInit & { candidates: RTCIceCandidateInit[] }
  ): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      const normalizedAnswer = { ...answer, sdp: answer.sdp ?? "" };
      await peer.acceptAnswer(normalizedAnswer);
      await peer.addIceCandidates(answer.candidates);
    }
  }

  async connectToHost(hostPeerId: string): Promise<void> {
    if (this.role !== "client") return;
    const peer = new PeerConnection({
      peerId: hostPeerId,
      role: "host",
      onMessage: (msg) => this.handleMessage(hostPeerId, msg),
      onOpen: () => this.handlePeerOpen(hostPeerId),
      onClose: () => this.handlePeerClose(hostPeerId),
      onError: (err) => this.handlePeerError(hostPeerId, err),
    });
    peer.createConnection();
    this.peers.set(hostPeerId, peer);
    const offer = await peer.createOffer();
    this.signaling.sendOffer(hostPeerId, offer);
  }

  setReady(ready: boolean): void {
    this.localReady = ready;
    this.broadcast({ type: "ready", peerId: this.localPeerId, ready });
    this.checkAllReady();
  }

  isLocalReady(): boolean {
    return this.localReady;
  }

  private handlePeerOpen(peerId: string): void {
    this.lastSeen.set(peerId, Date.now());
    this.onPeerConnect?.(peerId);

    const reconnectState = this.reconnectStates.get(peerId);
    if (reconnectState) {
      this.clearReconnectTimer(reconnectState);
      this.reconnectStates.delete(peerId);
      this.onReconnected?.(peerId);
    }

    if (this.role === "host") {
      this.broadcastPlayerList();
      this.broadcast({
        type: "hello",
        peerId: this.localPeerId,
        playerName: this.playerName,
        timestamp: Date.now(),
      });
    }
  }

  private handlePeerClose(peerId: string): void {
    const wasConnected = this.peers.has(peerId);
    this.peers.delete(peerId);
    this.lastSeen.delete(peerId);
    this.pendingPings.delete(peerId);

    const player = this.players.find((p) => p.peerId === peerId);
    if (player) {
      player.ready = false;
    }

    this.onPeerDisconnect?.(peerId);
    this.broadcastPlayerList();

    if (wasConnected && this.role === "client" && peerId === this.hostId) {
      const migrated = this.tryMigrateHost();
      if (!migrated) {
        this.startReconnect(peerId);
      }
    } else if (wasConnected && this.role === "client") {
      this.startReconnect(peerId);
    }
  }

  private handlePeerError(peerId: string, error: Error): void {
    this.onError?.(error, peerId);
  }

  private handleMessage(peerId: string, message: NetworkMessage): void {
    this.lastSeen.set(peerId, Date.now());

    switch (message.type) {
      case "hello":
        this.updatePlayerInfo(message.peerId, message.playerName);
        break;
      case "ready":
        this.updatePlayerReady(message.peerId, message.ready);
        break;
      case "start":
        this.onGameStart?.(message.seed, message.mode);
        break;
      case "state":
      case "input":
      case "event":
      case "state_batch":
      case "host_migration":
      case "quality":
        this.onNetworkMessage?.(peerId, message);
        break;
      case "ping":
        this.sendTo(peerId, { type: "pong", timestamp: message.timestamp });
        this.onNetworkMessage?.(peerId, message);
        break;
      case "pong":
        this.handlePong(peerId, message.timestamp);
        this.onNetworkMessage?.(peerId, message);
        break;
      case "heartbeat":
        if (this.role === "host") {
          this.lastSeen.set(message.peerId, Date.now());
        }
        break;
      case "reconnect":
        if (this.role === "host") {
          this.updatePlayerInfo(message.peerId, message.playerName);
          this.broadcastPlayerList();
        }
        break;
      case "player_list":
        if (this.role === "client") {
          this.syncPlayerList(message.players);
        }
        break;
      case "kick":
        if (message.peerId === this.localPeerId) {
          this.onError?.(new Error(`你被房主移出房间: ${message.reason}`));
          this.close();
        }
        break;
      case "discovery":
      case "discovery_response":
        break;
    }
  }

  private updatePlayerInfo(peerId: string, playerName: string): void {
    let player = this.players.find((p) => p.peerId === peerId);
    if (!player) {
      player = {
        peerId,
        playerName,
        ready: false,
        latency: 0,
        lastInputFrame: 0,
      };
      this.players.push(player);
    } else {
      player.playerName = playerName;
    }
    this.broadcastPlayerList();
    this.onPlayerListChange?.(this.players);
  }

  private updatePlayerReady(peerId: string, ready: boolean): void {
    const player = this.players.find((p) => p.peerId === peerId);
    if (player) {
      player.ready = ready;
    }
    this.broadcastPlayerList();
    this.onPlayerListChange?.(this.players);
    this.checkAllReady();
  }

  private syncPlayerList(players: NetworkPlayer[]): void {
    this.players = players.filter((p) => p.peerId !== this.localPeerId);
    this.onPlayerListChange?.(this.players);
  }

  private broadcastPlayerList(): void {
    if (this.role !== "host") return;
    const list: NetworkPlayer[] = [
      {
        peerId: this.localPeerId,
        playerName: this.playerName,
        ready: this.localReady,
        latency: 0,
        lastInputFrame: 0,
      },
      ...this.players,
    ];
    this.broadcast({ type: "player_list", players: list, timestamp: Date.now() });
  }

  private checkAllReady(): void {
    if (this.role !== "host") return;
    const allReady =
      this.players.length > 0 && this.players.every((p) => p.ready) && this.localReady;
    if (allReady && this.onAllReady) {
      this.onAllReady();
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      this.broadcast({ type: "heartbeat", peerId: this.localPeerId, timestamp: now });

      if (this.role === "host") {
        for (const [peerId, lastSeen] of this.lastSeen.entries()) {
          if (now - lastSeen > HEARTBEAT_TIMEOUT) {
            const peer = this.peers.get(peerId);
            if (peer?.connected) {
              peer.close();
              this.handlePeerClose(peerId);
            }
          }
        }
      }
    }, HEARTBEAT_INTERVAL);
  }

  private startPingTimer(): void {
    if (this.pingTimer) return;
    this.pingTimer = setInterval(() => {
      const now = Date.now();
      for (const peerId of this.peers.keys()) {
        this.pendingPings.set(peerId, { peerId, timestamp: now });
        this.sendTo(peerId, { type: "ping", timestamp: now });
      }
    }, PING_INTERVAL);
  }

  private handlePong(peerId: string, timestamp: number): void {
    const pending = this.pendingPings.get(peerId);
    if (!pending || pending.timestamp !== timestamp) return;
    const rtt = Date.now() - timestamp;
    const latency = Math.round(rtt / 2);
    this.updatePeerLatency(peerId, latency, rtt);
    this.pendingPings.delete(peerId);
  }

  private updatePeerLatency(peerId: string, latency: number, rtt: number): void {
    const player = this.players.find((p) => p.peerId === peerId);
    if (player) {
      player.latency = latency;
    }

    const score: ConnectionQuality["score"] = rtt < 100 ? "good" : rtt < 250 ? "fair" : "poor";
    const quality: ConnectionQuality = {
      rtt,
      packetLoss: 0,
      jitter: 0,
      score,
    };
    this.connectionQuality.set(peerId, quality);
    this.onConnectionQualityChange?.(peerId, quality);
  }

  getConnectionQuality(peerId: string): ConnectionQuality {
    return (
      this.connectionQuality.get(peerId) ?? {
        rtt: 0,
        packetLoss: 0,
        jitter: 0,
        score: "unknown",
      }
    );
  }

  private startBatchTimer(): void {
    if (this.batchTimer) return;
    this.batchTimer = setInterval(() => this.flushBatchedState(), this.batchInterval);
  }

  queueBatchedState(state: SerializedGameState, frame: number): void {
    if (this.role !== "host") return;
    this.stateBatchQueue.push(state);
    this.stateBatchFrames.push(frame);
    if (this.stateBatchQueue.length >= MAX_BATCH_SIZE) {
      this.flushBatchedState();
    }
  }

  flushBatchedState(): void {
    if (this.role !== "host" || this.stateBatchQueue.length === 0) return;
    const message: NetworkMessage = {
      type: "state_batch",
      states: [...this.stateBatchQueue],
      frameStart: this.stateBatchFrames[0] ?? 0,
      frameEnd: this.stateBatchFrames[this.stateBatchFrames.length - 1] ?? 0,
      timestamp: Date.now(),
    };
    this.broadcast(message);
    this.stateBatchQueue.length = 0;
    this.stateBatchFrames.length = 0;
  }

  private tryMigrateHost(): boolean {
    const candidates = [this.localPeerId, ...this.players.map((p) => p.peerId)].filter(
      (id) => id !== this.hostId
    );
    candidates.sort();

    if (candidates.length === 0) return false;

    const newHostId = candidates[0];
    if (newHostId === this.localPeerId) {
      this.promoteToHost();
      return true;
    }

    return false;
  }

  private promoteToHost(): void {
    this.role = "host";
    this.hostId = this.localPeerId;
    this.signaling.close();
    this.signaling = this.createSignalingChannel();
    this.signaling.open().catch((err) => this.onError?.(err));
    this.broadcast({
      type: "host_migration",
      newHostId: this.localPeerId,
      newHostPeerId: this.localPeerId,
      timestamp: Date.now(),
    });
    this.onHostMigrated?.(this.localPeerId);
  }

  private startReconnect(peerId: string): void {
    if (this.reconnectStates.has(peerId)) return;

    const state: ReconnectState = {
      peerId,
      playerName: this.playerName,
      attempts: 0,
      timer: null,
    };
    this.reconnectStates.set(peerId, state);
    this.onReconnecting?.(peerId);
    this.scheduleReconnectAttempt(state);
  }

  private scheduleReconnectAttempt(state: ReconnectState): void {
    if (state.attempts >= MAX_RECONNECT_ATTEMPTS) {
      this.reconnectStates.delete(state.peerId);
      this.onError?.(new Error("断线重连失败，已超过最大尝试次数"));
      return;
    }

    const delay = RECONNECT_BASE_INTERVAL * Math.pow(2, state.attempts);
    state.timer = setTimeout(() => this.attemptReconnect(state), delay);
  }

  private attemptReconnect(state: ReconnectState): void {
    state.attempts++;
    if (state.attempts > MAX_RECONNECT_ATTEMPTS) {
      this.clearReconnectTimer(state);
      this.reconnectStates.delete(state.peerId);
      this.onError?.(new Error("断线重连失败，已超过最大尝试次数"));
      return;
    }

    this.broadcast({
      type: "reconnect",
      peerId: this.localPeerId,
      playerName: this.playerName,
      timestamp: Date.now(),
    });
    this.onReconnecting?.(state.peerId);
    this.scheduleReconnectAttempt(state);
  }

  private clearReconnectTimer(state: ReconnectState): void {
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = null;
    }
  }

  broadcast(message: NetworkMessage): void {
    for (const peer of this.peers.values()) {
      peer.send(message);
    }
  }

  sendTo(peerId: string, message: NetworkMessage): void {
    this.peers.get(peerId)?.send(message);
  }

  startGame(seed: number, mode: GameModeType): void {
    const startMsg: NetworkMessage = {
      type: "start",
      seed,
      mode,
      timestamp: Date.now(),
    };
    this.broadcast(startMsg);
    this.onGameStart?.(seed, mode);
  }

  kickPlayer(peerId: string, reason = "被房主移出房间"): void {
    if (this.role !== "host") return;
    this.broadcast({ type: "kick", peerId, reason, timestamp: Date.now() });
    const peer = this.peers.get(peerId);
    peer?.close();
    this.handlePeerClose(peerId);
  }

  getLatency(peerId: string): number {
    return this.players.find((p) => p.peerId === peerId)?.latency ?? 0;
  }

  getLocalPeerId(): string {
    return this.localPeerId;
  }

  isHost(): boolean {
    return this.role === "host";
  }

  getRoomState(): {
    roomCode: string;
    hostId: string;
    players: NetworkPlayer[];
    maxPlayers: number;
    status: "lobby" | "starting" | "playing";
    seed: number;
    mode: GameModeType;
    localPeerId: string;
    role: NetworkRole;
  } {
    return {
      roomCode: this.roomCode,
      hostId: this.hostId,
      players: [...this.players],
      maxPlayers: this.maxPlayers,
      status: "lobby",
      seed: 0,
      mode: "campaign",
      localPeerId: this.localPeerId,
      role: this.role,
    };
  }

  close(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    for (const state of this.reconnectStates.values()) {
      this.clearReconnectTimer(state);
    }
    this.reconnectStates.clear();
    this.pendingPings.clear();
    this.connectionQuality.clear();
    this.peers.forEach((peer) => peer.close());
    this.peers.clear();
    this.players = [];
    this.signaling.close();
  }
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
