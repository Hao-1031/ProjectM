import type { ConnectionQuality, NetworkMessage, NetworkPlayer } from "./types";
import { PeerConnection } from "./peer";
import { SignalingChannel } from "./signaling";
import { LanDiscovery, type LanRoom } from "./lan-discovery";
import { RoomCodeConnection, type RoomCodeSession } from "./room-code";
import { ServerRelay, type RelayConnection } from "./server-relay";
import { ConnectionMonitor, AdaptiveSync } from "./quality";
import { DeltaEncoder, DeltaDecoder } from "./delta";
import { NetworkPrediction, StateInterpolation } from "./prediction";
import { JitterBuffer, InputReplay } from "./jitter";
import type { SerializedGameState, InputState, GameModeType } from "@/lib/game/types";

export type ConnectionMode = "lan" | "room_code" | "server_relay";

export interface MultiplayerV2Options {
  playerName: string;
  connectionMode: ConnectionMode;
  relayServerUrl?: string;
  onPeerConnect?: (peerId: string) => void;
  onPeerDisconnect?: (peerId: string) => void;
  onNetworkMessage?: (peerId: string, message: NetworkMessage) => void;
  onGameStart?: (seed: number, mode: GameModeType) => void;
  onError?: (error: Error, peerId?: string) => void;
  onPlayerListChange?: (players: NetworkPlayer[]) => void;
  onReconnecting?: (peerId: string) => void;
  onReconnected?: (peerId: string) => void;
  onConnectionQualityChange?: (peerId: string, quality: ConnectionQuality) => void;
  onLanRoomFound?: (room: LanRoom) => void;
  onLanRoomLost?: (roomCode: string) => void;
}

export interface HybridConnectionState {
  mode: ConnectionMode;
  localPeerId: string;
  roomCode: string;
  connected: boolean;
  peerCount: number;
  relayStatus: RelayConnection | null;
  roomSession: RoomCodeSession | null;
  lanRooms: LanRoom[];
}

const HEARTBEAT_INTERVAL = 2000;
const HEARTBEAT_TIMEOUT = 8000;
const PING_INTERVAL = 1000;
const DEFAULT_BATCH_INTERVAL = 50;
const MAX_BATCH_SIZE = 16;

export class MultiplayerV2 {
  private options: MultiplayerV2Options;
  private connectionMode: ConnectionMode;
  private localPeerId: string;
  private roomCode = "";
  private players: NetworkPlayer[] = [];
  private peers = new Map<string, PeerConnection>();
  private signaling: SignalingChannel | null = null;
  private lanDiscovery: LanDiscovery;
  private roomCodeConnection: RoomCodeConnection | null = null;
  private serverRelay: ServerRelay | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private batchTimer: ReturnType<typeof setInterval> | null = null;
  private lastSeen = new Map<string, number>();
  private connectionQuality = new Map<string, ConnectionQuality>();
  private stateBatchQueue: SerializedGameState[] = [];
  private stateBatchFrames: number[] = [];
  private batchInterval: number;
  private connectionMonitor = new ConnectionMonitor();
  private adaptiveSync = new AdaptiveSync();
  private deltaEncoder = new DeltaEncoder();
  private deltaDecoder = new DeltaDecoder();
  private prediction = new NetworkPrediction();
  private interpolation = new StateInterpolation();
  private jitterBuffer = new JitterBuffer();
  private inputReplay = new InputReplay();
  private frameSequence = 0;
  private bytesSentTotal = 0;
  private bytesReceivedTotal = 0;
  private localReady = false;
  private connected = false;

  constructor(options: MultiplayerV2Options) {
    this.options = options;
    this.connectionMode = options.connectionMode;
    this.localPeerId = `p2_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    this.batchInterval = DEFAULT_BATCH_INTERVAL;

    this.lanDiscovery = new LanDiscovery({
      localPeerId: this.localPeerId,
      playerName: options.playerName,
      onRoomFound: options.onLanRoomFound,
      onRoomLost: options.onLanRoomLost,
    });

    if (options.connectionMode === "room_code") {
      this.roomCodeConnection = new RoomCodeConnection({
        localPeerId: this.localPeerId,
        playerName: options.playerName,
        onConnected: (peerId) => this.handlePeerConnected(peerId),
        onDisconnected: (peerId) => options.onPeerDisconnect?.(peerId),
        onError: (err) => options.onError?.(err),
      });
    }

    if (options.connectionMode === "server_relay" && options.relayServerUrl) {
      this.serverRelay = new ServerRelay({
        relayServerUrl: options.relayServerUrl,
        localPeerId: this.localPeerId,
        playerName: options.playerName,
        onMessage: (peerId, data) => this.handleRelayMessage(peerId, data),
        onConnected: () => this.handleRelayConnected(),
        onDisconnected: () => options.onPeerDisconnect?.("relay"),
        onError: (err) => options.onError?.(err),
      });
    }
  }

  async start(): Promise<void> {
    this.signaling = new SignalingChannel({
      roomCode: this.roomCode,
      localPeerId: this.localPeerId,
      playerName: this.options.playerName,
      onOffer: (peerId, offer) => this.handleOffer(peerId, offer),
      onAnswer: (peerId, answer) => this.handleAnswer(peerId, answer),
    });

    await this.signaling.open();
    this.lanDiscovery.start();
    this.startHeartbeat();
    this.startPingTimer();
    this.startBatchTimer();
  }

  async createRoom(roomCode?: string): Promise<string> {
    this.roomCode = roomCode ?? this.generateRoomCode();

    switch (this.connectionMode) {
      case "lan":
        this.lanDiscovery.startHosting(this.roomCode, 1, 2, "pvp_duel");
        break;
      case "room_code":
        this.roomCodeConnection?.createRoom();
        break;
      case "server_relay":
        await this.serverRelay?.connect();
        break;
    }

    this.connected = true;
    return this.roomCode;
  }

  async joinRoom(roomCode: string): Promise<void> {
    this.roomCode = roomCode;

    switch (this.connectionMode) {
      case "lan":
        this.lanDiscovery.start();
        break;
      case "room_code":
        await this.roomCodeConnection?.joinRoom(roomCode);
        break;
      case "server_relay":
        await this.serverRelay?.connect();
        break;
    }
  }

  discoverLanRooms(): LanRoom[] {
    return this.lanDiscovery.getRooms();
  }

  async connectToPeer(peerId: string): Promise<void> {
    const peer = new PeerConnection({
      peerId,
      role: "host",
      onMessage: (msg) => this.handleMessage(peerId, msg),
      onOpen: () => this.handlePeerOpen(peerId),
      onClose: () => this.handlePeerClose(peerId),
      onError: (err) => this.options.onError?.(err, peerId),
    });
    peer.createConnection();
    this.peers.set(peerId, peer);

    const offer = await peer.createOffer();
    this.signaling?.sendOffer(peerId, offer);
  }

  private handleOffer(
    peerId: string,
    offer: RTCSessionDescriptionInit & { candidates: RTCIceCandidateInit[] }
  ): void {
    const peer = new PeerConnection({
      peerId,
      role: "client",
      onMessage: (msg) => this.handleMessage(peerId, msg),
      onOpen: () => this.handlePeerOpen(peerId),
      onClose: () => this.handlePeerClose(peerId),
      onError: (err) => this.options.onError?.(err, peerId),
    });
    peer.createConnection();
    this.peers.set(peerId, peer);

    peer.acceptOffer({
      sdp: offer.sdp ?? "",
      type: offer.type as RTCSdpType,
      candidates: offer.candidates,
    }).then((answer) => {
      this.signaling?.sendAnswer(peerId, answer);
    });
  }

  private handleAnswer(
    peerId: string,
    answer: RTCSessionDescriptionInit & { candidates: RTCIceCandidateInit[] }
  ): void {
    const peer = this.peers.get(peerId);
    peer?.acceptAnswer({
      sdp: answer.sdp ?? "",
      type: answer.type as RTCSdpType,
      candidates: answer.candidates,
    });
  }

  private handlePeerOpen(peerId: string): void {
    this.lastSeen.set(peerId, Date.now());
    this.options.onPeerConnect?.(peerId);
  }

  private handlePeerClose(peerId: string): void {
    this.peers.delete(peerId);
    this.lastSeen.delete(peerId);
    this.players = this.players.filter((p) => p.peerId !== peerId);
    this.options.onPeerDisconnect?.(peerId);
  }

  private handlePeerConnected(peerId: string): void {
    this.connected = true;
    this.connectToPeer(peerId);
  }

  private handleRelayMessage(peerId: string, data: unknown): void {
    if (data && typeof data === "object" && "type" in data) {
      this.handleMessage(peerId, data as NetworkMessage);
    }
  }

  private handleRelayConnected(): void {
    this.connected = true;
    this.options.onPeerConnect?.("relay");
  }

  private handleMessage(peerId: string, message: NetworkMessage): void {
    this.lastSeen.set(peerId, Date.now());
    this.connectionMonitor.recordReceived(this.frameSequence++, 0, Date.now());

    this.options.onNetworkMessage?.(peerId, message);
  }

  setReady(ready: boolean): void {
    this.localReady = ready;
    this.broadcast({ type: "ready", peerId: this.localPeerId, ready });
  }

  broadcast(message: NetworkMessage): void {
    this.connectionMonitor.recordSent();
    const text = JSON.stringify(message);
    const bytes = new TextEncoder().encode(text).length;
    this.bytesSentTotal += bytes;
    this.connectionMonitor.recordBytesSent(bytes);

    for (const peer of this.peers.values()) {
      peer.send(message);
    }

    if (this.serverRelay?.isConnected()) {
      this.serverRelay.send("*", message);
    }
  }

  sendTo(peerId: string, message: NetworkMessage): void {
    this.connectionMonitor.recordSent();
    const text = JSON.stringify(message);
    const bytes = new TextEncoder().encode(text).length;
    this.bytesSentTotal += bytes;
    this.connectionMonitor.recordBytesSent(bytes);

    this.peers.get(peerId)?.send(message);
    this.serverRelay?.send(peerId, message);
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      this.broadcast({ type: "heartbeat", peerId: this.localPeerId, timestamp: now });
      this.connectionMonitor.updateBandwidth();
      this.adjustBatchInterval();
    }, HEARTBEAT_INTERVAL);
  }

  private startPingTimer(): void {
    if (this.pingTimer) return;
    this.pingTimer = setInterval(() => {
      const now = Date.now();
      for (const peerId of this.peers.keys()) {
        this.sendTo(peerId, { type: "ping", timestamp: now });
      }
    }, PING_INTERVAL);
  }

  private startBatchTimer(): void {
    if (this.batchTimer) return;
    this.batchTimer = setInterval(() => this.flushBatchedState(), this.batchInterval);
  }

  private adjustBatchInterval(): void {
    const metrics = this.connectionMonitor.getMetrics();
    this.batchInterval = this.adaptiveSync.adjustInterval(metrics);
  }

  queueBatchedState(state: SerializedGameState, frame: number): void {
    this.stateBatchQueue.push(state);
    this.stateBatchFrames.push(frame);
    if (this.stateBatchQueue.length >= MAX_BATCH_SIZE) {
      this.flushBatchedState();
    }
  }

  flushBatchedState(): void {
    if (this.stateBatchQueue.length === 0) return;
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

  sendDeltaState(state: SerializedGameState) {
    return this.deltaEncoder.encode(state);
  }

  applyDeltaState(delta: ReturnType<DeltaEncoder["encode"]>) {
    return this.deltaDecoder.apply(delta);
  }

  addPredictionInput(frame: number, input: InputState): void {
    this.prediction.addInput(frame, input);
  }

  recordPrediction(frame: number, state: SerializedGameState, input: InputState): void {
    this.prediction.recordPrediction(frame, state, input);
  }

  reconcile(serverFrame: number, serverState: SerializedGameState) {
    return this.prediction.reconcile(serverFrame, serverState);
  }

  getUnacknowledgedInputs() {
    return this.prediction.getUnacknowledgedInputs();
  }

  getPredictionLead(): number {
    return this.prediction.getPredictionLead();
  }

  addServerState(frame: number, state: SerializedGameState, timestamp: number): void {
    this.interpolation.addServerState(frame, state, timestamp);
  }

  getInterpolatedState(now: number) {
    return this.interpolation.getInterpolatedState(now);
  }

  getInterpolationBufferFill(): number {
    return this.interpolation.getBufferFill();
  }

  bufferJitterInput(frame: number, input: InputState): void {
    this.jitterBuffer.push(frame, input, Date.now());
  }

  popJitterInput(now: number) {
    return this.jitterBuffer.pop(now);
  }

  getJitterStats() {
    return this.jitterBuffer.getStats();
  }

  getJitterInputForFrame(frame: number) {
    return this.jitterBuffer.getFrameInput(frame);
  }

  getState(): HybridConnectionState {
    return {
      mode: this.connectionMode,
      localPeerId: this.localPeerId,
      roomCode: this.roomCode,
      connected: this.connected,
      peerCount: this.peers.size,
      relayStatus: this.serverRelay?.getConnection() ?? null,
      roomSession: this.roomCodeConnection?.getSession() ?? null,
      lanRooms: this.lanDiscovery.getRooms(),
    };
  }

  getGlobalMetrics() {
    const metrics = this.connectionMonitor.getMetrics();
    return {
      rtt: metrics.rtt,
      packetLoss: metrics.packetLoss,
      jitter: metrics.jitter,
      bandwidthEstimate: metrics.bandwidthEstimate,
      score: metrics.score,
      bytesSent: this.bytesSentTotal,
      bytesReceived: this.bytesReceivedTotal,
    };
  }

  getLocalPeerId(): string {
    return this.localPeerId;
  }

  getRoomCode(): string {
    return this.roomCode;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getPeers(): string[] {
    return Array.from(this.peers.keys());
  }

  private generateRoomCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
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
    this.lanDiscovery.stop();
    this.roomCodeConnection?.close();
    this.serverRelay?.disconnect();
    this.signaling?.close();
    this.peers.forEach((peer) => peer.close());
    this.peers.clear();
    this.players = [];
    this.connected = false;
  }
}