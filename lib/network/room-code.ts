export interface RoomCodeOptions {
  localPeerId: string;
  playerName: string;
  onConnected?: (peerId: string) => void;
  onDisconnected?: (peerId: string) => void;
  onError?: (error: Error) => void;
}

export interface RoomCodeSession {
  roomCode: string;
  hostId: string;
  guestId: string | null;
  status: "waiting" | "connecting" | "connected" | "closed";
  createdAt: number;
  connectionType: "host" | "guest";
}

const ROOM_CODE_PREFIX = "pm_room_";
const ROOM_CODE_TTL = 60000;
const ROOM_CODE_POLL_INTERVAL = 2000;

export class RoomCodeConnection {
  private localPeerId: string;
  private playerName: string;
  private onConnected?: (peerId: string) => void;
  private onDisconnected?: (peerId: string) => void;
  private onError?: (error: Error) => void;
  private session: RoomCodeSession | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private cleanupTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: RoomCodeOptions) {
    this.localPeerId = options.localPeerId;
    this.playerName = options.playerName;
    this.onConnected = options.onConnected;
    this.onDisconnected = options.onDisconnected;
    this.onError = options.onError;
  }

  async createRoom(): Promise<RoomCodeSession> {
    const roomCode = this.generateRoomCode();
    this.session = {
      roomCode,
      hostId: this.localPeerId,
      guestId: null,
      status: "waiting",
      createdAt: Date.now(),
      connectionType: "host",
    };

    this.publishRoom();
    this.pollTimer = setInterval(() => this.checkForGuest(), ROOM_CODE_POLL_INTERVAL);
    this.cleanupTimer = setTimeout(() => this.cleanup(), ROOM_CODE_TTL);

    return this.session;
  }

  async joinRoom(roomCode: string): Promise<RoomCodeSession> {
    this.session = {
      roomCode,
      hostId: "",
      guestId: this.localPeerId,
      status: "connecting",
      createdAt: Date.now(),
      connectionType: "guest",
    };

    this.announceJoin(roomCode);
    this.pollTimer = setInterval(() => this.checkForHost(), ROOM_CODE_POLL_INTERVAL);

    return this.session;
  }

  private generateRoomCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  private publishRoom(): void {
    if (!this.session) return;
    try {
      const data = {
        type: "room_host",
        roomCode: this.session.roomCode,
        hostId: this.localPeerId,
        hostName: this.playerName,
        timestamp: Date.now(),
      };
      localStorage.setItem(`${ROOM_CODE_PREFIX}${this.session.roomCode}`, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("room_code_broadcast", { detail: data }));
    } catch {
      this.onError?.(new Error("无法发布房间信息"));
    }
  }

  private announceJoin(roomCode: string): void {
    try {
      const data = {
        type: "room_join",
        roomCode,
        guestId: this.localPeerId,
        guestName: this.playerName,
        timestamp: Date.now(),
      };
      localStorage.setItem(`${ROOM_CODE_PREFIX}join_${roomCode}`, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("room_code_join", { detail: data }));
    } catch {
      this.onError?.(new Error("无法加入房间"));
    }
  }

  private checkForGuest(): void {
    if (!this.session || this.session.status === "connected") return;
    try {
      const raw = localStorage.getItem(`${ROOM_CODE_PREFIX}join_${this.session.roomCode}`);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.roomCode === this.session.roomCode && data.guestId) {
        this.session.guestId = data.guestId;
        this.session.status = "connected";
        this.stopPolling();
        this.onConnected?.(data.guestId);
      }
    } catch {
      // 忽略无效数据
    }
  }

  private checkForHost(): void {
    if (!this.session || this.session.status === "connected") return;
    try {
      const raw = localStorage.getItem(`${ROOM_CODE_PREFIX}${this.session.roomCode}`);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.roomCode === this.session.roomCode && data.hostId) {
        this.session.hostId = data.hostId;
        this.session.status = "connected";
        this.stopPolling();
        this.onConnected?.(data.hostId);
      }
    } catch {
      // 忽略无效数据
    }
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private cleanup(): void {
    if (this.session) {
      try {
        localStorage.removeItem(`${ROOM_CODE_PREFIX}${this.session.roomCode}`);
        localStorage.removeItem(`${ROOM_CODE_PREFIX}join_${this.session.roomCode}`);
      } catch {
        // 忽略清理错误
      }
    }
    this.stopPolling();
    this.session = null;
    this.onDisconnected?.("timeout");
  }

  getSession(): RoomCodeSession | null {
    return this.session;
  }

  close(): void {
    this.stopPolling();
    if (this.session) {
      this.session.status = "closed";
      this.onDisconnected?.(this.session.guestId ?? this.session.hostId);
      this.session = null;
    }
  }
}