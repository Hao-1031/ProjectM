const SIGNALING_PREFIX = "pm_signal_";
const SIGNALING_TTL = 30000;
const DISCOVERY_PREFIX = "pm_discovery_";
const WS_RECONNECT_BASE_MS = 1000;
const WS_RECONNECT_MAX_MS = 30000;
const WS_PING_INTERVAL = 10000;

export interface SignalingOptions {
  roomCode: string;
  localPeerId: string;
  playerName?: string;
  /** WebSocket 信令服务器 URL，用于跨设备组队。为空则仅使用本地信令 */
  signalingServerUrl?: string;
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
  onPeerListChange?: (peers: { peerId: string; playerName: string }[]) => void;
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

/** WebSocket 信令服务器消息格式 */
interface WsSignalingMessage {
  type: "offer" | "answer" | "discover" | "discover_response" | "register" | "ping" | "pong";
  from: string;
  to?: string;
  roomCode: string;
  playerName?: string;
  payload?: unknown;
  timestamp: number;
}

export class SignalingChannel {
  private roomCode: string;
  private localPeerId: string;
  private playerName: string;
  private signalingServerUrl?: string;
  private onOffer?: SignalingOptions["onOffer"];
  private onAnswer?: SignalingOptions["onAnswer"];
  private onDiscovery?: SignalingOptions["onDiscovery"];
  private onDiscoveryResponse?: SignalingOptions["onDiscoveryResponse"];
  private onPeerListChange?: SignalingOptions["onPeerListChange"];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private discoveryChannel: BroadcastChannel | null = null;
  private processedMessages = new Set<string>();
  private ws: WebSocket | null = null;
  private wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private wsPingTimer: ReturnType<typeof setInterval> | null = null;
  private wsReconnectAttempts = 0;
  private wsConnected = false;

  constructor(options: SignalingOptions) {
    this.roomCode = options.roomCode;
    this.localPeerId = options.localPeerId;
    this.playerName = options.playerName || options.localPeerId;
    this.signalingServerUrl = options.signalingServerUrl;
    this.onOffer = options.onOffer;
    this.onAnswer = options.onAnswer;
    this.onDiscovery = options.onDiscovery;
    this.onDiscoveryResponse = options.onDiscoveryResponse;
    this.onPeerListChange = options.onPeerListChange;
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

    if (this.signalingServerUrl) {
      this.connectWebSocket();
    }
  }

  private connectWebSocket(): void {
    if (!this.signalingServerUrl) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

    try {
      this.ws = new WebSocket(this.signalingServerUrl);
    } catch {
      this.scheduleWsReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.wsConnected = true;
      this.wsReconnectAttempts = 0;
      this.registerWithServer();
      this.startWsPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WsSignalingMessage = JSON.parse(event.data as string);
        this.handleWsMessage(msg);
      } catch {
        // 忽略无效消息
      }
    };

    this.ws.onclose = () => {
      this.wsConnected = false;
      this.stopWsPing();
      this.ws = null;
      this.scheduleWsReconnect();
    };

    this.ws.onerror = () => {
      this.wsConnected = false;
      this.stopWsPing();
      this.ws?.close();
      this.ws = null;
    };
  }

  private registerWithServer(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const msg: WsSignalingMessage = {
      type: "register",
      from: this.localPeerId,
      roomCode: this.roomCode,
      playerName: this.playerName,
      timestamp: Date.now(),
    };
    this.ws.send(JSON.stringify(msg));
  }

  private startWsPing(): void {
    this.stopWsPing();
    this.wsPingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: "ping",
          from: this.localPeerId,
          roomCode: this.roomCode,
          timestamp: Date.now(),
        }));
      }
    }, WS_PING_INTERVAL);
  }

  private stopWsPing(): void {
    if (this.wsPingTimer) {
      clearInterval(this.wsPingTimer);
      this.wsPingTimer = null;
    }
  }

  private scheduleWsReconnect(): void {
    if (this.wsReconnectTimer) return;
    const delay = Math.min(
      WS_RECONNECT_BASE_MS * Math.pow(2, this.wsReconnectAttempts),
      WS_RECONNECT_MAX_MS
    );
    this.wsReconnectAttempts++;
    this.wsReconnectTimer = setTimeout(() => {
      this.wsReconnectTimer = null;
      this.connectWebSocket();
    }, delay);
  }

  private handleWsMessage(msg: WsSignalingMessage): void {
    if (msg.from === this.localPeerId) return;

    if (msg.type === "register") {
      const peers = msg.payload as { peerId: string; playerName: string }[] | undefined;
      if (peers) {
        this.onPeerListChange?.(peers.filter((p) => p.peerId !== this.localPeerId));
      }
      return;
    }

    if (msg.type === "discover_response") {
      this.onDiscoveryResponse?.(msg.roomCode, msg.from, msg.playerName || "Unknown");
      return;
    }

    if (msg.type === "offer" && msg.payload) {
      const id = `${msg.from}_offer_${msg.timestamp}`;
      if (this.processedMessages.has(id)) return;
      this.processedMessages.add(id);
      this.onOffer?.(
        msg.from,
        msg.payload as RTCSessionDescriptionInit & { candidates: RTCIceCandidateInit[] }
      );
      return;
    }

    if (msg.type === "answer" && msg.payload) {
      const id = `${msg.from}_answer_${msg.timestamp}`;
      if (this.processedMessages.has(id)) return;
      this.processedMessages.add(id);
      this.onAnswer?.(
        msg.from,
        msg.payload as RTCSessionDescriptionInit & { candidates: RTCIceCandidateInit[] }
      );
      return;
    }
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

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const wsMsg: WsSignalingMessage = {
        type: kind,
        from: this.localPeerId,
        to,
        roomCode: this.roomCode,
        payload,
        timestamp: Date.now(),
      };
      this.ws.send(JSON.stringify(wsMsg));
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

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const wsMsg: WsSignalingMessage = {
        type: "discover",
        from: this.localPeerId,
        roomCode,
        playerName,
        timestamp: Date.now(),
      };
      this.ws.send(JSON.stringify(wsMsg));
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

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const wsMsg: WsSignalingMessage = {
        type: "discover_response",
        from: this.localPeerId,
        to: hostId,
        roomCode,
        playerName,
        timestamp: Date.now(),
      };
      this.ws.send(JSON.stringify(wsMsg));
    }
  }

  close(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.stopWsPing();
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = null;
    }
    this.wsReconnectAttempts = 0;
    this.broadcastChannel?.close();
    this.discoveryChannel?.close();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
    this.wsConnected = false;
  }
}
