export interface LanDiscoveryOptions {
  /** 本地 peer ID */
  localPeerId: string;
  /** 玩家名称 */
  playerName: string;
  /** 发现到房间时的回调 */
  onRoomFound?: (room: LanRoom) => void;
  /** 房间消失时的回调 */
  onRoomLost?: (roomCode: string) => void;
  /** 广播间隔 (ms) */
  broadcastInterval?: number;
  /** 房间过期时间 (ms) */
  roomTtl?: number;
}

export interface LanRoom {
  roomCode: string;
  hostId: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  mode: string;
  discoveredAt: number;
  lastSeen: number;
  localAddress: string;
}

interface LanBroadcast {
  type: "lan_broadcast" | "lan_response";
  roomCode: string;
  hostId: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  mode: string;
  timestamp: number;
}

const LAN_MULTICAST_ADDRESS = "224.0.0.167";
const LAN_PORT = 41234;
const DEFAULT_BROADCAST_INTERVAL = 3000;
const DEFAULT_ROOM_TTL = 10000;

export class LanDiscovery {
  private localPeerId: string;
  private playerName: string;
  private onRoomFound?: (room: LanRoom) => void;
  private onRoomLost?: (roomCode: string) => void;
  private broadcastInterval: number;
  private roomTtl: number;
  private rooms = new Map<string, LanRoom>();
  private broadcastTimer: ReturnType<typeof setInterval> | null = null;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private isHost = false;
  private roomCode = "";
  private playerCount = 0;
  private maxPlayers = 2;
  private mode = "pvp_duel";
  private socket: WebSocket | null = null;

  constructor(options: LanDiscoveryOptions) {
    this.localPeerId = options.localPeerId;
    this.playerName = options.playerName;
    this.onRoomFound = options.onRoomFound;
    this.onRoomLost = options.onRoomLost;
    this.broadcastInterval = options.broadcastInterval ?? DEFAULT_BROADCAST_INTERVAL;
    this.roomTtl = options.roomTtl ?? DEFAULT_ROOM_TTL;
  }

  async start(): Promise<void> {
    this.cleanupTimer = setInterval(() => this.cleanupRooms(), 5000);

    if (this.isHost) {
      this.startBroadcast();
    }
  }

  startHosting(roomCode: string, playerCount: number, maxPlayers: number, mode: string): void {
    this.isHost = true;
    this.roomCode = roomCode;
    this.playerCount = playerCount;
    this.maxPlayers = maxPlayers;
    this.mode = mode;
    this.startBroadcast();
  }

  stopHosting(): void {
    this.isHost = false;
    this.stopBroadcast();
  }

  private startBroadcast(): void {
    if (this.broadcastTimer) return;
    this.broadcastTimer = setInterval(() => this.sendBroadcast(), this.broadcastInterval);
  }

  private stopBroadcast(): void {
    if (this.broadcastTimer) {
      clearInterval(this.broadcastTimer);
      this.broadcastTimer = null;
    }
  }

  private sendBroadcast(): void {
    if (typeof window === "undefined") return;
    const message: LanBroadcast = {
      type: "lan_broadcast",
      roomCode: this.roomCode,
      hostId: this.localPeerId,
      hostName: this.playerName,
      playerCount: this.playerCount,
      maxPlayers: this.maxPlayers,
      mode: this.mode,
      timestamp: Date.now(),
    };

    try {
      const data = JSON.stringify(message);
      localStorage.setItem(`lan_discovery_${this.localPeerId}_${Date.now()}`, data);
      window.dispatchEvent(
        new CustomEvent("lan_discovery", { detail: message })
      );
    } catch {
      // Local storage may be unavailable
    }
  }

  receiveBroadcast(message: LanBroadcast): void {
    if (message.hostId === this.localPeerId) return;

    const now = Date.now();
    if (now - message.timestamp > this.roomTtl) return;

    const existing = this.rooms.get(message.roomCode);
    if (existing) {
      existing.lastSeen = now;
      existing.playerCount = message.playerCount;
      return;
    }

    const room: LanRoom = {
      roomCode: message.roomCode,
      hostId: message.hostId,
      hostName: message.hostName,
      playerCount: message.playerCount,
      maxPlayers: message.maxPlayers,
      mode: message.mode,
      discoveredAt: now,
      lastSeen: now,
      localAddress: "lan",
    };

    this.rooms.set(message.roomCode, room);
    this.onRoomFound?.(room);
  }

  private cleanupRooms(): void {
    const now = Date.now();
    for (const [roomCode, room] of this.rooms) {
      if (now - room.lastSeen > this.roomTtl) {
        this.rooms.delete(roomCode);
        this.onRoomLost?.(roomCode);
      }
    }
  }

  getRooms(): LanRoom[] {
    return Array.from(this.rooms.values()).sort((a, b) => b.discoveredAt - a.discoveredAt);
  }

  getRoom(roomCode: string): LanRoom | undefined {
    return this.rooms.get(roomCode);
  }

  stop(): void {
    this.stopBroadcast();
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.rooms.clear();
  }
}