const SIGNALING_PREFIX = "pm_signal_";
const SIGNALING_TTL = 30000;
const DISCOVERY_PREFIX = "pm_discovery_";

export interface SignalingOptions {
  roomCode: string;
  localPeerId: string;
  onOffer?: (
    peerId: string,
    offer: RTCSessionDescriptionInit & { candidates: RTCIceCandidateInit[] }
  ) => void;
  onAnswer?: (
    peerId: string,
    answer: RTCSessionDescriptionInit & { candidates: RTCIceCandidateInit[] }
  ) => void;
  onDiscovery?: (roomCode: string, hostId: string, playerName: string) => void;
  onDiscoveryResponse?: (roomCode: string, hostId: string, playerName: string) => void;
}

interface SignalingMessage {
  from: string;
  to: string;
  roomCode: string;
  kind: "offer" | "answer" | "discover";
  payload: { type?: string; sdp?: string; candidates?: RTCIceCandidateInit[] };
  timestamp: number;
}

interface DiscoveryMessage {
  type: "discover" | "response";
  roomCode: string;
  hostId: string;
  playerName: string;
  from: string;
  timestamp: number;
}

export class SignalingChannel {
  private roomCode: string;
  private localPeerId: string;
  private onOffer?: SignalingOptions["onOffer"];
  private onAnswer?: SignalingOptions["onAnswer"];
  private onDiscovery?: SignalingOptions["onDiscovery"];
  private onDiscoveryResponse?: SignalingOptions["onDiscoveryResponse"];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private discoveryChannel: BroadcastChannel | null = null;
  private processedMessages = new Set<string>();

  constructor(options: SignalingOptions) {
    this.roomCode = options.roomCode;
    this.localPeerId = options.localPeerId;
    this.onOffer = options.onOffer;
    this.onAnswer = options.onAnswer;
    this.onDiscovery = options.onDiscovery;
    this.onDiscoveryResponse = options.onDiscoveryResponse;
  }

  setRoomCode(roomCode: string): void {
    this.roomCode = roomCode;
  }

  async open(): Promise<void> {
    if (typeof BroadcastChannel !== "undefined") {
      this.broadcastChannel = new BroadcastChannel(`${SIGNALING_PREFIX}${this.roomCode}`);
      this.broadcastChannel.onmessage = (event) =>
        this.handleMessage(event.data as SignalingMessage);

      this.discoveryChannel = new BroadcastChannel(DISCOVERY_PREFIX);
      this.discoveryChannel.onmessage = (event) =>
        this.handleDiscoveryMessage(event.data as DiscoveryMessage);
    }

    this.intervalId = setInterval(() => this.pollStorage(), 500);
  }

  private handleMessage(message: SignalingMessage): void {
    if (message.roomCode !== this.roomCode) return;
    if (message.to !== this.localPeerId && message.to !== "*") return;

    const id = `${message.from}_${message.kind}_${message.timestamp}`;
    if (this.processedMessages.has(id)) return;
    this.processedMessages.add(id);

    if (message.kind === "offer" && message.payload.candidates) {
      this.onOffer?.(
        message.from,
        message.payload as RTCSessionDescriptionInit & { candidates: RTCIceCandidateInit[] }
      );
    } else if (message.kind === "answer" && message.payload.candidates) {
      this.onAnswer?.(
        message.from,
        message.payload as RTCSessionDescriptionInit & { candidates: RTCIceCandidateInit[] }
      );
    }
  }

  private handleDiscoveryMessage(message: DiscoveryMessage): void {
    if (message.from === this.localPeerId) return;
    if (message.type === "discover") {
      this.onDiscovery?.(message.roomCode, message.hostId, message.playerName);
    } else if (message.type === "response") {
      this.onDiscoveryResponse?.(message.roomCode, message.hostId, message.playerName);
    }
  }

  private pollStorage(): void {
    if (typeof localStorage === "undefined") return;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(SIGNALING_PREFIX) || key?.startsWith(DISCOVERY_PREFIX)) keys.push(key);
    }

    const now = Date.now();
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const message = JSON.parse(raw) as SignalingMessage | DiscoveryMessage;
        if (now - message.timestamp > SIGNALING_TTL) {
          localStorage.removeItem(key);
          continue;
        }
        if ("kind" in message) {
          this.handleMessage(message);
        } else {
          this.handleDiscoveryMessage(message);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  }

  private send(
    kind: "offer" | "answer" | "discover",
    to: string,
    payload: SignalingMessage["payload"]
  ): void {
    const message: SignalingMessage = {
      from: this.localPeerId,
      to,
      roomCode: this.roomCode,
      kind,
      payload,
      timestamp: Date.now(),
    };

    this.broadcastChannel?.postMessage(message);

    if (typeof localStorage !== "undefined") {
      const key = `${SIGNALING_PREFIX}${this.roomCode}_${this.localPeerId}_${to}_${kind}_${Date.now()}`;
      try {
        localStorage.setItem(key, JSON.stringify(message));
      } catch {
        // Ignore storage errors
      }
    }
  }

  sendOffer(
    to: string,
    offer: RTCSessionDescriptionInit & { candidates: RTCIceCandidateInit[] }
  ): void {
    this.send("offer", to, offer);
  }

  sendAnswer(
    to: string,
    answer: RTCSessionDescriptionInit & { candidates: RTCIceCandidateInit[] }
  ): void {
    this.send("answer", to, answer);
  }

  sendDiscovery(roomCode: string, hostId: string, playerName: string): void {
    const message: DiscoveryMessage = {
      type: "discover",
      roomCode,
      hostId,
      playerName,
      from: this.localPeerId,
      timestamp: Date.now(),
    };
    this.discoveryChannel?.postMessage(message);
    if (typeof localStorage !== "undefined") {
      const key = `${DISCOVERY_PREFIX}${roomCode}_${this.localPeerId}_${Date.now()}`;
      try {
        localStorage.setItem(key, JSON.stringify(message));
      } catch {
        // Ignore storage errors
      }
    }
  }

  sendDiscoveryResponse(roomCode: string, hostId: string, playerName: string): void {
    const message: DiscoveryMessage = {
      type: "response",
      roomCode,
      hostId,
      playerName,
      from: this.localPeerId,
      timestamp: Date.now(),
    };
    this.discoveryChannel?.postMessage(message);
    if (typeof localStorage !== "undefined") {
      const key = `${DISCOVERY_PREFIX}resp_${roomCode}_${this.localPeerId}_${Date.now()}`;
      try {
        localStorage.setItem(key, JSON.stringify(message));
      } catch {
        // Ignore storage errors
      }
    }
  }

  close(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.broadcastChannel?.close();
    this.discoveryChannel?.close();
  }
}
