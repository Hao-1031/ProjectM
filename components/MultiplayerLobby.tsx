import { useState, useEffect, useCallback } from "react";
import type { GameModeType, NetworkPlayer } from "@/lib/game/types";
import { GameRoomManager } from "@/lib/network/room";

interface DiscoveredRoom {
  roomCode: string;
  hostId: string;
  playerName: string;
}

interface MultiplayerLobbyProps {
  room: GameRoomManager | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (playerName: string, mode: GameModeType) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  onDiscoverRooms: () => void;
  onReadyToggle: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onCopyInvite: () => void;
  discoveredRooms: DiscoveredRoom[];
  players: NetworkPlayer[];
  isReconnecting: boolean;
  reconnectAttempts: number;
  error: string | null;
  gameStarted: boolean;
}

const MODES: { id: GameModeType; name: string; description: string }[] = [
  { id: "campaign", name: "战役撤离", description: "完成 4 项任务后抵达撤离点" },
  { id: "endless", name: "无尽生存", description: "无限波次，挑战极限存活时间" },
  { id: "daily", name: "每日挑战", description: "固定种子与每日修饰符" },
  { id: "roguelike", name: "Roguelike", description: "分阶段推进，选择奖励节点" },
];

export default function MultiplayerLobby({
  room,
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  onDiscoverRooms,
  onReadyToggle,
  onStartGame,
  onLeaveRoom,
  onCopyInvite,
  discoveredRooms,
  players,
  isReconnecting,
  reconnectAttempts,
  error,
  gameStarted,
}: MultiplayerLobbyProps) {
  const [tab, setTab] = useState<"create" | "join" | "lan">("create");
  const [playerName, setPlayerName] = useState("幸存者");
  const [roomCode, setRoomCode] = useState("");
  const [selectedMode, setSelectedMode] = useState<GameModeType>("campaign");
  const [copied, setCopied] = useState(false);
  const [localReady, setLocalReady] = useState(false);

  useEffect(() => {
    const saved =
      typeof localStorage !== "undefined" ? localStorage.getItem("pm_player_name") : null;
    if (saved) setPlayerName(saved);
  }, []);

  useEffect(() => {
    if (room?.isLocalReady()) {
      setLocalReady(room.isLocalReady());
    }
  }, [room]);

  const handleNameChange = (value: string) => {
    setPlayerName(value);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("pm_player_name", value);
    }
  };

  const handleCreate = () => {
    if (!playerName.trim()) return;
    onCreateRoom(playerName.trim(), selectedMode);
  };

  const handleJoin = () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  const handleCopyInvite = useCallback(() => {
    onCopyInvite();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopyInvite]);

  const handleReady = () => {
    const next = !localReady;
    setLocalReady(next);
    onReadyToggle();
  };

  if (!isOpen) return null;

  const isHost = room?.isHost() ?? false;
  const isInRoom = room?.roomCode && (players.length > 0 || isHost);
  const canStart = isHost && players.length > 0 && players.every((p) => p.ready);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-bold">联机合作</h2>
            <p className="text-xs text-muted">P2P 直连 · 局域网 / 好友邀请</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:bg-background focus-ring"
          >
            关闭
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}

        {!isInRoom ? (
          <div className="p-5">
            <div className="mb-4 flex rounded-lg border border-border bg-background p-1">
              {(
                [
                  { id: "create", label: "创建房间" },
                  { id: "join", label: "加入房间" },
                  { id: "lan", label: "局域网" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors focus-ring ${
                    tab === t.id ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <label className="mb-4 block">
              <span className="text-xs text-muted">玩家名称</span>
              <input
                type="text"
                value={playerName}
                onChange={(e) => handleNameChange(e.target.value)}
                maxLength={12}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="输入你的代号"
              />
            </label>

            {tab === "create" && (
              <div>
                <p className="mb-2 text-xs text-muted">选择游戏模式</p>
                <div className="mb-4 grid gap-2">
                  {MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id)}
                      className={`rounded-lg border px-3 py-2.5 text-left transition-colors focus-ring ${
                        selectedMode === mode.id
                          ? "border-primary/50 bg-primary/10"
                          : "border-border bg-background hover:border-primary/30"
                      }`}
                    >
                      <span className="block text-sm font-bold">{mode.name}</span>
                      <span className="text-xs text-muted">{mode.description}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleCreate}
                  disabled={!playerName.trim()}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-background transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 focus-ring"
                >
                  创建房间
                </button>
              </div>
            )}

            {tab === "join" && (
              <div>
                <label className="mb-4 block">
                  <span className="text-xs text-muted">房间代码</span>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono uppercase tracking-widest outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="XXXXXX"
                  />
                </label>
                <button
                  onClick={handleJoin}
                  disabled={!playerName.trim() || roomCode.length !== 6}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-background transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 focus-ring"
                >
                  加入房间
                </button>
              </div>
            )}

            {tab === "lan" && (
              <div>
                <p className="mb-3 text-xs text-muted">
                  在同一局域网或同一浏览器的标签页间自动发现房间
                </p>
                <button
                  onClick={onDiscoverRooms}
                  className="w-full rounded-lg border border-border bg-background py-2.5 text-sm font-medium transition-colors hover:border-primary/50 focus-ring"
                >
                  刷新房间列表
                </button>
                {discoveredRooms.length === 0 && (
                  <p className="mt-4 text-center text-xs text-muted">未发现房间</p>
                )}
                <div className="mt-3 space-y-2">
                  {discoveredRooms.map((r) => (
                    <button
                      key={r.roomCode}
                      onClick={() => {
                        setRoomCode(r.roomCode);
                        setTab("join");
                      }}
                      className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/50 focus-ring"
                    >
                      <div>
                        <p className="text-sm font-bold">{r.playerName} 的房间</p>
                        <p className="font-mono text-xs text-primary">{r.roomCode}</p>
                      </div>
                      <span className="text-xs text-muted">点击加入</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
              <div>
                <p className="text-xs text-muted">房间代码</p>
                <p className="font-mono text-lg font-bold tracking-widest text-primary">
                  {room.roomCode}
                </p>
              </div>
              <button
                onClick={handleCopyInvite}
                className="rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:bg-panel focus-ring"
              >
                {copied ? "已复制" : "复制邀请"}
              </button>
            </div>

            {isReconnecting && (
              <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                连接中断，正在重连... (尝试 {reconnectAttempts} / 5)
              </div>
            )}

            <div className="mb-4">
              <p className="mb-2 text-xs text-muted">玩家列表</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-success" />
                    <span className="text-sm font-medium">{playerName}</span>
                    {isHost && (
                      <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent">
                        房主
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-success">{localReady ? "已准备" : "未准备"}</span>
                </div>
                {players.map((p) => (
                  <div
                    key={p.peerId}
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          p.ready ? "bg-success" : "bg-muted"
                        }`}
                      />
                      <span className="text-sm">{p.playerName}</span>
                    </div>
                    <span className="text-xs text-muted">{p.ready ? "已准备" : "未准备"}</span>
                  </div>
                ))}
              </div>
            </div>

            {!gameStarted && (
              <div className="flex gap-3">
                <button
                  onClick={handleReady}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-transform active:scale-95 focus-ring ${
                    localReady
                      ? "border border-success/50 bg-success/10 text-success hover:bg-success/20"
                      : "bg-primary text-background hover:scale-[1.02]"
                  }`}
                >
                  {localReady ? "取消准备" : "准备"}
                </button>
                {isHost && (
                  <button
                    onClick={onStartGame}
                    disabled={!canStart}
                    className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-bold text-background transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 focus-ring"
                  >
                    开始游戏
                  </button>
                )}
              </div>
            )}

            <button
              onClick={onLeaveRoom}
              className="mt-3 w-full rounded-lg border border-danger/30 py-2 text-xs text-danger transition-colors hover:bg-danger/10 focus-ring"
            >
              离开房间
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
