export interface ServerRelayOptions {
  /** 中继服务器 URL */
  relayServerUrl: string;
  /** 本地 peer ID */
  localPeerId: string;
  /** 玩家名称 */
  playerName: string;
  /** 收到消息回调 */
  onMessage?: (peerId: string, data: unknown) => void;
  /** 连接成功回调 */
  onConnected?: () => void;
  /** 连接断开回调 */
  onDisconnected?: () => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
  /** 重连间隔 (ms) */
  reconnectInterval?: number;
  /** 最大重连次数 */
  maxReconnectAttempts?: number;
}

export interface RelayConnection {
  status: "disconnected" | "connecting" | "connected" | "reconnecting";
  ping: number;
  bytesSent: number;
  bytesReceived: number;
  reconnectAttempts: number;
  connectedAt: number | null;
}

interface RelayMessage {
  type: "relay_data" | "relay_connect" | "relay_disconnect" | "relay_ping" | "relay_pong";
  from: string;
  to?: string;
  roomCode: string;
  payload?: unknown;
  timestamp: number;
}

const DEFAULT_RECONNECT_INTERVAL = 3000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 5;
const RELAY_PING_INTERVAL = 10000;

export class ServerRelay {
  private relayServerUrl: string;
  private localPeerId: string;
  private playerName: string;
  private onMessage?: (peerId: string, data: unknown) => void;
  private onConnected?: () => void;
  private onDisconnected?: () => void;
  private onError?: (error: Error) => void;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private ws: WebSocket | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connection: RelayConnection;

  constructor(options: ServerRelayOptions) {
    this.relayServerUrl = options.relayServerUrl;
    this.localPeerId = options.localPeerId;
    this.playerName = options.playerName;
    this.onMessage = options.onMessage;
    this.onConnected = options.onConnected;
    this.onDisconnected = options.onDisconnected;
    this.onError = options.onError;
    this.reconnectInterval = options.reconnectInterval ?? DEFAULT_RECONNECT_INTERVAL;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS;

    this.connection = {
      status: "disconnected",
      ping: 0,
      bytesSent: 0,
      bytesReceived: 0,
      reconnectAttempts: 0,
      connectedAt: null,
    };
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.connection.status = "connecting";
    try {
      this.ws = new WebSocket(this.relayServerUrl);
    } catch (err) {
      this.connection.status = "disconnected";
      this.onError?.(err instanceof Error ? err : new Error(String(err)));
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.connection.status = "connected";
      this.connection.connectedAt = Date.now();
      this.connection.reconnectAttempts = 0;
      this.sendRelayMessage("relay_connect", this.localPeerId, undefined, {
        peerId: this.localPeerId,
        playerName: this.playerName,
      });
      this.startPing();
      this.onConnected?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: RelayMessage = JSON.parse(event.data as string);
        this.handleRelayMessage(msg);
        this.connection.bytesReceived += new TextEncoder().encode(event.data as string).length;
      } catch {
        // 忽略无效消息
      }
    };

    this.ws.onclose = () => {
      this.connection.status = "disconnected";
      this.stopPing();
      this.ws = null;
      this.onDisconnected?.();
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.connection.status = "disconnected";
      this.stopPing();
      this.ws?.close();
      this.ws = null;
    };
  }

  private handleRelayMessage(msg: RelayMessage): void {
    switch (msg.type) {
      case "relay_data":
        if (msg.from !== this.localPeerId) {
          this.onMessage?.(msg.from, msg.payload);
        }
        break;
      case "relay_pong":
        if (this.connection.connectedAt) {
          this.connection.ping = Date.now() - this.connection.connectedAt;
        }
        break;
      case "relay_connect":
      case "relay_disconnect":
        break;
    }
  }

  send(targetPeerId: string, data: unknown): void {
    this.sendRelayMessage("relay_data", this.localPeerId, targetPeerId, data);
  }

  private sendRelayMessage(
    type: RelayMessage["type"],
    from: string,
    to?: string,
    payload?: unknown
  ): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const msg: RelayMessage = {
      type,
      from,
      to,
      roomCode: "",
      payload,
      timestamp: Date.now(),
    };
    const text = JSON.stringify(msg);
    this.connection.bytesSent += new TextEncoder().encode(text).length;
    this.ws.send(text);
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.sendRelayMessage("relay_ping", this.localPeerId);
    }, RELAY_PING_INTERVAL);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    if (this.connection.reconnectAttempts >= this.maxReconnectAttempts) {
      this.onError?.(new Error("中继服务器重连失败，已超过最大尝试次数"));
      return;
    }

    this.connection.status = "reconnecting";
    this.connection.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(1.5, this.connection.reconnectAttempts - 1);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  getConnection(): RelayConnection {
    return { ...this.connection };
  }

  isConnected(): boolean {
    return this.connection.status === "connected";
  }

  disconnect(): void {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.connection.reconnectAttempts = this.maxReconnectAttempts + 1;
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
    this.connection.status = "disconnected";
  }
}