import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameModeType, NetworkPlayer } from "@/lib/game/types";
import { GameRoomManager } from "@/lib/network/room";
import {
  Plus,
  SignIn,
  WifiHigh,
  X,
  Copy,
  Check,
  Users,
  GameController,
  Crown,
  CheckCircle,
  Circle,
  Warning,
  ArrowsClockwise,
  Target,
  Infinity,
  Calendar,
  TreeStructure,
} from "@phosphor-icons/react";

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

const MODES: { id: GameModeType; name: string; description: string; icon: typeof Target }[] = [
  { id: "campaign", name: "战役撤离", description: "完成 4 项任务后抵达撤离点", icon: Target },
  { id: "endless", name: "无尽生存", description: "无限波次，挑战极限存活时间", icon: Infinity },
  { id: "daily", name: "每日挑战", description: "固定种子与每日修饰符", icon: Calendar },
  { id: "roguelike", name: "Roguelike", description: "分阶段推进，选择奖励节点", icon: TreeStructure },
];

const TABS = [
  { id: "create" as const, label: "创建", icon: Plus },
  { id: "join" as const, label: "加入", icon: SignIn },
  { id: "lan" as const, label: "局域网", icon: WifiHigh },
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
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem("pm_player_name") : null;
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
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/88 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <GameController size={18} weight="bold" />
            </div>
            <div>
              <h2 className="text-lg font-bold">联机合作</h2>
              <p className="text-xs text-muted">P2P 直连 · 局域网 / 好友邀请</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border p-2 text-muted transition-colors hover:border-primary/40 hover:text-foreground focus-ring active:scale-95"
            aria-label="关闭"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-5 mt-4 overflow-hidden rounded-lg border border-danger/30 bg-danger/10"
            >
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-danger">
                <Warning size={14} weight="bold" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isInRoom ? (
          <div className="p-5">
            <div className="mb-4 flex rounded-xl border border-border bg-[var(--panel-raised)] p-1">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors focus-ring ${
                      active ? "text-primary" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="lobby-tab"
                        className="absolute inset-0 rounded-lg bg-primary/10"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon size={14} weight="bold" />
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <label className="mb-4 block">
              <span className="text-xs text-muted">玩家名称</span>
              <input
                type="text"
                value={playerName}
                onChange={(e) => handleNameChange(e.target.value)}
                maxLength={12}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="输入你的代号"
              />
            </label>

            <AnimatePresence mode="wait">
              {tab === "create" && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="mb-2 text-xs text-muted">选择游戏模式</p>
                  <div className="mb-4 grid grid-flow-dense gap-2">
                    {MODES.map((mode) => {
                      const Icon = mode.icon;
                      const active = selectedMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setSelectedMode(mode.id)}
                          className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all focus-ring ${
                            active
                              ? "border-primary/50 bg-primary/10"
                              : "border-border bg-[var(--panel-raised)] hover:border-primary/30 hover:bg-panel"
                          }`}
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background ${
                              active ? "text-primary" : "text-muted"
                            }`}
                          >
                            <Icon size={18} weight="bold" />
                          </div>
                          <div>
                            <span className="block text-sm font-bold">{mode.name}</span>
                            <span className="text-xs text-muted">{mode.description}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!playerName.trim()}
                    className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-background transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 focus-ring"
                  >
                    创建房间
                  </button>
                </motion.div>
              )}

              {tab === "join" && (
                <motion.div
                  key="join"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="mb-4 block">
                    <span className="text-xs text-muted">房间代码</span>
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono uppercase tracking-[0.2em] outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="XXXXXX"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={!playerName.trim() || roomCode.length !== 6}
                    className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-background transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 focus-ring"
                  >
                    加入房间
                  </button>
                </motion.div>
              )}

              {tab === "lan" && (
                <motion.div
                  key="lan"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="mb-3 text-xs text-muted">
                    在同一局域网或同一浏览器的标签页间自动发现房间
                  </p>
                  <button
                    type="button"
                    onClick={onDiscoverRooms}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-[var(--panel-raised)] py-2.5 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-panel focus-ring active:scale-95"
                  >
                    <ArrowsClockwise size={16} weight="bold" />
                    刷新房间列表
                  </button>
                  {discoveredRooms.length === 0 && (
                    <p className="mt-4 text-center text-xs text-muted">未发现房间</p>
                  )}
                  <div className="mt-3 space-y-2">
                    {discoveredRooms.map((r) => (
                      <button
                        key={r.roomCode}
                        type="button"
                        onClick={() => {
                          setRoomCode(r.roomCode);
                          setTab("join");
                        }}
                        className="flex w-full items-center justify-between rounded-xl border border-border bg-[var(--panel-raised)] px-3 py-3 text-left transition-colors hover:border-primary/50 hover:bg-panel focus-ring"
                      >
                        <div>
                          <p className="text-sm font-bold">{r.playerName} 的房间</p>
                          <p className="font-mono text-xs text-primary">{r.roomCode}</p>
                        </div>
                        <span className="text-xs text-muted">点击加入</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-[var(--panel-raised)] px-3 py-3">
              <div>
                <p className="text-xs text-muted">房间代码</p>
                <p className="font-mono text-lg font-bold tracking-widest text-primary">
                  {room.roomCode}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyInvite}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/40 hover:text-primary focus-ring active:scale-95"
              >
                {copied ? <Check size={14} weight="bold" className="text-success" /> : <Copy size={14} weight="bold" />}
                {copied ? "已复制" : "复制邀请"}
              </button>
            </div>

            {isReconnecting && (
              <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                <div className="flex items-center gap-2">
                  <ArrowsClockwise size={14} weight="bold" className="animate-spin" />
                  连接中断，正在重连... (尝试 {reconnectAttempts} / 5)
                </div>
              </div>
            )}

            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-muted">
                <Users size={14} weight="bold" />
                玩家列表
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} weight="bold" className="text-success" />
                    <span className="text-sm font-medium">{playerName}</span>
                    {isHost && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-accent/15 px-1.5 py-0.5 text-[10px] text-accent">
                        <Crown size={10} weight="bold" />
                        房主
                      </span>
                    )}
                  </div>
                  <span className={`text-xs ${localReady ? "text-success" : "text-muted"}`}>
                    {localReady ? "已准备" : "未准备"}
                  </span>
                </div>
                {players.map((p) => (
                  <div
                    key={p.peerId}
                    className="flex items-center justify-between rounded-xl border border-border bg-[var(--panel-raised)] px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      {p.ready ? (
                        <CheckCircle size={14} weight="bold" className="text-success" />
                      ) : (
                        <Circle size={14} weight="bold" className="text-muted" />
                      )}
                      <span className="text-sm">{p.playerName}</span>
                    </div>
                    <span className={`text-xs ${p.ready ? "text-success" : "text-muted"}`}>
                      {p.ready ? "已准备" : "未准备"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {!gameStarted && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReady}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all focus-ring active:scale-95 ${
                    localReady
                      ? "border border-success/50 bg-success/10 text-success hover:bg-success/15"
                      : "bg-primary text-background hover:scale-[1.01]"
                  }`}
                >
                  {localReady ? "取消准备" : "准备就绪"}
                </button>
                {isHost && (
                  <button
                    type="button"
                    onClick={onStartGame}
                    disabled={!canStart}
                    className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-bold text-background transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 focus-ring"
                  >
                    开始游戏
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onLeaveRoom}
              className="mt-3 w-full rounded-xl border border-danger/30 py-2 text-xs text-danger transition-colors hover:bg-danger/10 focus-ring active:scale-95"
            >
              离开房间
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
