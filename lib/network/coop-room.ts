import { SignalingChannel } from "./signaling";
import { PeerConnection } from "./peer";
import type { NetworkMessage, NetworkRole } from "./types";
import type { SerializedGameState, InputState, HeroId } from "@/lib/game/types";
import { uid } from "@/lib/game/math";

export interface CoopRoomOptions {
  playerName: string;
  role: "host" | "guest";
  heroId: HeroId;
  onStateUpdate?: (state: SerializedGameState) => void;
  onPartnerConnect?: (playerName: string) => void;
  onPartnerDisconnect?: () => void;
  onGameStart?: (seed: number) => void;
  onError?: (error: Error) => void;
  onRoomCodeReady?: (roomCode: string) => void;
}

export class CoopRoom {
  private roomCode: string;
  private role: "host" | "guest";
  private localPeerId: string;
  private playerName: string;
  private heroId: HeroId;
  private partnerPeerId: string | null = null;
  private partnerName: string | null = null;
  private partnerHeroId: HeroId | null = null;
  private signaling: SignalingChannel;
  private peer: PeerConnection | null = null;
  private status: "waiting" | "ready" | "playing" | "finished" = "waiting";
  private sequence = 0;
  private onStateUpdate?: (state: SerializedGameState) => void;
  private onPartnerConnect?: (playerName: string) => void;
  private onPartnerDisconnect?: () => void;
  private onGameStart?: (seed: number) => void;
  private onError?: (error: Error) => void;
  private onRoomCodeReady?: (roomCode: string) => void;

  constructor(options: CoopRoomOptions) {
    this.playerName = options.playerName;
    this.role = options.role;
    this.heroId = options.heroId;
    this.onStateUpdate = options.onStateUpdate;
    this.onPartnerConnect = options.onPartnerConnect;
    this.onPartnerDisconnect = options.onPartnerDisconnect;
    this.onGameStart = options.onGameStart;
    this.onError = options.onError;
    this.onRoomCodeReady = options.onRoomCodeReady;
    this.localPeerId = uid("coop");
    this.roomCode = options.role === "host" ? generateCoopRoomCode() : "";

    const signalingUrl =
      typeof process !== "undefined"
        ? (process.env as Record<string, string | undefined>).NEXT_PUBLIC_SIGNALING_URL
        : undefined;

    this.signaling = new SignalingChannel({
      roomCode: this.roomCode,
      localPeerId: this.localPeerId,
      playerName: this.playerName,
      signalingServerUrl: signalingUrl,
      onOffer: (peerId, offer) => this.handleOffer(peerId, offer),
      onAnswer: (peerId, answer) => this.handleAnswer(peerId, answer),
      onDiscovery: (roomCode, hostId, playerName) =>
        this.handleDiscovery(roomCode, hostId, playerName),
      onDiscoveryResponse: (roomCode, hostId, playerName) =>
        this.handleDiscoveryResponse(roomCode, hostId, playerName),
      onPeerListChange: (peers) => this.handlePeerListChange(peers),
    });
  }

  async createRoom(): Promise<string> {
    if (this.role !== "host") throw new Error("Only host can create room");
    this.roomCode = generateCoopRoomCode();
    this.signaling.setRoomCode(this.roomCode);
    await this.signaling.open();
    this.onRoomCodeReady?.(this.roomCode);
    return this.roomCode;
  }

  async joinRoom(roomCode: string): Promise<void> {
    if (this.role !== "guest") throw new Error("Only guest can join room");
    this.roomCode = roomCode;
    this.signaling.setRoomCode(roomCode);
    await this.signaling.open();
    this.signaling.sendDiscovery(roomCode, "host", this.playerName);
  }

  setReady(): void {
    this.status = "ready";
    this.sendMessage({ type: "coop_ready", heroId: this.heroId });
  }

  startGame(seed: number): void {
    this.status = "playing";
    this.sendMessage({ type: "coop_start", seed });
    this.onGameStart?.(seed);
  }

  sendInput(input: InputState): void {
    if (!this.peer || !this.peer.connected) return;
    this.sendMessage({
      type: "coop_input",
      input,
      sequence: this.sequence++,
    });
  }

  sendState(state: SerializedGameState): void {
    if (!this.peer || !this.peer.connected) return;
    this.sendMessage({
      type: "coop_state",
      state,
      sequence: this.sequence++,
    });
  }

  close(): void {
    this.signaling.close();
    this.peer?.close();
    this.status = "finished";
  }

  getRoomCode(): string {
    return this.roomCode;
  }

  getStatus(): string {
    return this.status;
  }

  getPartnerName(): string | null {
    return this.partnerName;
  }

  getPartnerHeroId(): HeroId | null {
    return this.partnerHeroId;
  }

  isHost(): boolean {
    return this.role === "host";
  }

  private async handleOffer(
    peerId: string,
    offer: RTCSessionDescriptionInit & { candidates: RTCIceCandidateInit[] },
  ): Promise<void> {
    this.partnerPeerId = peerId;
    this.peer = new PeerConnection({
      peerId,
      role: "client",
      onMessage: (msg) => this.handleMessage(msg),
      onOpen: () => this.onPartnerConnect?.(this.partnerName || "Unknown"),
      onClose: () => this.handlePartnerDisconnect(),
      onError: (err) => this.onError?.(err),
    });
    this.peer.createConnection();
    const answer = await this.peer.acceptOffer({
      sdp: offer.sdp ?? "",
      type: offer.type as RTCSdpType,
      candidates: offer.candidates,
    });
    this.signaling.sendAnswer(peerId, answer);
  }

  private async handleAnswer(
    peerId: string,
    answer: RTCSessionDescriptionInit & { candidates: RTCIceCandidateInit[] },
  ): Promise<void> {
    if (this.peer) {
      await this.peer.acceptAnswer({
        sdp: answer.sdp ?? "",
        type: answer.type as RTCSdpType,
        candidates: answer.candidates,
      });
    }
  }

  private handleDiscovery(
    _roomCode: string,
    hostId: string,
    playerName: string,
  ): void {
    if (this.role === "host") {
      this.signaling.sendDiscoveryResponse(this.roomCode, this.localPeerId, this.playerName);
    }
  }

  private handleDiscoveryResponse(
    _roomCode: string,
    hostId: string,
    playerName: string,
  ): void {
    if (this.role === "guest") {
      this.partnerPeerId = hostId;
      this.partnerName = playerName;
      this.createPeerConnection(hostId);
    }
  }

  private handlePeerListChange(
    peers: { peerId: string; playerName: string }[],
  ): void {
    if (peers.length > 0 && !this.partnerPeerId) {
      const partner = peers[0];
      this.partnerPeerId = partner.peerId;
      this.partnerName = partner.playerName;
      this.createPeerConnection(partner.peerId);
    }
  }

  private async createPeerConnection(partnerId: string): Promise<void> {
    const peerRole: NetworkRole = this.role === "host" ? "host" : "client";
    this.peer = new PeerConnection({
      peerId: partnerId,
      role: peerRole,
      onMessage: (msg) => this.handleMessage(msg),
      onOpen: () => this.onPartnerConnect?.(this.partnerName || "Unknown"),
      onClose: () => this.handlePartnerDisconnect(),
      onError: (err) => this.onError?.(err),
    });
    this.peer.createConnection();
    const offer = await this.peer.createOffer();
    this.signaling.sendOffer(partnerId, offer);
  }

  private handleMessage(msg: NetworkMessage): void {
    if (typeof msg !== "object" || msg === null) return;

    const m = msg as Record<string, unknown>;

    if (m.type === "coop_ready" && m.heroId) {
      this.partnerHeroId = m.heroId as HeroId;
      if (this.status === "waiting") {
        this.status = "ready";
      }
    }

    if (m.type === "coop_start" && typeof m.seed === "number") {
      this.onGameStart?.(m.seed);
    }

    if (m.type === "coop_state" && m.state) {
      this.onStateUpdate?.(m.state as SerializedGameState);
    }

    if (m.type === "coop_input" && m.input) {
      this.onStateUpdate?.((m as unknown as { state: SerializedGameState }).state);
    }
  }

  private handlePartnerDisconnect(): void {
    this.partnerPeerId = null;
    this.partnerName = null;
    this.partnerHeroId = null;
    this.peer = null;
    this.onPartnerDisconnect?.();
  }

  private sendMessage(msg: Record<string, unknown>): void {
    if (this.peer && this.peer.connected) {
      this.peer.send(msg as NetworkMessage);
    }
  }
}

function generateCoopRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}