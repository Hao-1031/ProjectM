import { useEffect, useRef, useState, useCallback } from "react";
import { GameEngine } from "@/lib/game/engine";
import { InputManager } from "@/lib/game/input";
import { audio } from "@/lib/game/audio";
import type {
  UpgradeOption,
  RunResult,
  GameModeType,
  NetworkPlayer,
  NetworkMessage,
} from "@/lib/game/types";
import type { RoguelikeRewardBalance } from "@/lib/game/balance";
import { useAppStore } from "@/lib/store";
import { recordRun } from "@/lib/game/save";
import { GameRoomManager } from "@/lib/network/room";
import UpgradeModal from "./UpgradeModal";
import RoguelikeRewardModal from "./RoguelikeRewardModal";
import Hud from "./Hud";
import RunEndModal from "./RunEndModal";
import MultiplayerLobby from "./MultiplayerLobby";

interface GameCanvasProps {
  onExit?: () => void;
  multiplayer?: boolean;
}

interface DiscoveredRoom {
  roomCode: string;
  hostId: string;
  playerName: string;
}

export default function GameCanvas({ onExit, multiplayer = false }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const inputRef = useRef<InputManager | null>(null);
  const rafRef = useRef<number>(0);
  const roomRef = useRef<GameRoomManager | null>(null);
  const inputFrameRef = useRef(0);
  const [frame, setFrame] = useState(0);
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[] | null>(null);
  const [roguelikeRewardOptions, setRoguelikeRewardOptions] = useState<
    RoguelikeRewardBalance[] | null
  >(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [lobbyOpen, setLobbyOpen] = useState(multiplayer);
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState<NetworkPlayer[]>([]);
  const [discoveredRooms, setDiscoveredRooms] = useState<DiscoveredRoom[]>([]);
  const [netError, setNetError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameModeType>("campaign");
  const settings = useAppStore((s) => s.settings);

  useEffect(() => {
    audio?.setEnabled(settings.audioEnabled);
    audio?.setVolume(settings.volume);
    audio?.setBgmVolume(settings.bgmVolume ?? 0.35);
  }, [settings.audioEnabled, settings.volume, settings.bgmVolume]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const engine = new GameEngine({
      onLevelUp: (options) => setUpgradeOptions(options),
      onVictory: (result) => {
        setRunResult(result);
        recordRun(result);
        audio?.stopBgm();
      },
      onDefeat: (result) => {
        setRunResult(result);
        recordRun(result);
        audio?.stopBgm();
      },
      onMissionComplete: () => {
        if (settings.vibrationEnabled && navigator.vibrate) {
          navigator.vibrate(150);
        }
      },
      onExtractionReady: () => {
        if (settings.vibrationEnabled && navigator.vibrate) {
          navigator.vibrate(300);
        }
      },
      onEventStart: () => {
        if (settings.vibrationEnabled && navigator.vibrate) {
          navigator.vibrate(150);
        }
      },
      onRoguelikeRewardOffer: (options) => {
        setRoguelikeRewardOptions(options);
      },
    });
    engineRef.current = engine;

    const input = new InputManager(container);
    input.onPause(() => engine.pause());
    inputRef.current = input;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      engine.resize(canvas.width / dpr, canvas.height / dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const loop = (now: number) => {
      input.update();
      engine.update(input.state, now);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        engine.draw(ctx);
      }

      const intensity =
        engine.state.enemies.length / 25 +
        (1 - engine.state.player.health / engine.state.player.maxHealth) * 0.4;
      audio?.setIntensity(Math.min(1, intensity));

      if (roomRef.current && engine.state.status === "running") {
        const room = roomRef.current;
        inputFrameRef.current++;
        room.broadcast({
          type: "input",
          input: {
            move: input.state.move,
            aim: input.state.aim,
            fire: false,
            pause: false,
          },
          timestamp: Date.now(),
          frame: inputFrameRef.current,
        });
      }

      setFrame((f) => f + 1);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      input.unbind();
      roomRef.current?.close();
    };
  }, [settings.vibrationEnabled]);

  useEffect(() => {
    if (!multiplayer) return;
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get("room");
    if (joinCode && joinCode.length === 6) {
      setRoomCode(joinCode.toUpperCase());
      setLobbyOpen(true);
    }
  }, [multiplayer]);

  const handleNetworkMessage = useCallback((peerId: string, message: NetworkMessage) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (message.type === "state") {
      if (roomRef.current?.isHost() === false) {
        engine.applySerialized(message.state);
      }
    } else if (message.type === "input") {
      if (roomRef.current?.isHost()) {
        engine.updateRemotePlayerInput(peerId, message.input, 1 / 60);
      }
    } else if (message.type === "start") {
      setGameStarted(true);
      setLobbyOpen(false);
      engine.restart(message.mode, message.seed);
      setTimeout(() => {
        engine.start();
        audio?.startBgm();
        setIsStarted(true);
      }, 100);
    }
  }, []);

  const createRoom = useCallback(
    async (playerName: string, mode: GameModeType) => {
      setNetError(null);
      setSelectedMode(mode);
      const room: GameRoomManager = new GameRoomManager({
        playerName,
        role: "host",
        maxPlayers: 4,
        onPlayerListChange: (list) =>
          setPlayers(list.filter((p) => p.peerId !== room.getLocalPeerId())),
        onNetworkMessage: handleNetworkMessage,
        onError: (err) => setNetError(err.message),
        onReconnecting: () => setIsReconnecting(true),
        onReconnected: () => {
          setIsReconnecting(false);
          setReconnectAttempts(0);
        },
      });
      roomRef.current = room;
      try {
        const code = await room.createRoom();
        setRoomCode(code);
        updateInviteUrl(code);
      } catch (err) {
        setNetError(err instanceof Error ? err.message : "创建房间失败");
      }
    },
    [handleNetworkMessage]
  );

  const joinRoom = useCallback(
    async (code: string, playerName: string) => {
      setNetError(null);
      const room: GameRoomManager = new GameRoomManager({
        playerName,
        role: "client",
        maxPlayers: 4,
        onPlayerListChange: (list) =>
          setPlayers(list.filter((p) => p.peerId !== room.getLocalPeerId())),
        onNetworkMessage: handleNetworkMessage,
        onGameStart: (seed, mode) => {
          setGameStarted(true);
          setLobbyOpen(false);
        },
        onError: (err) => setNetError(err.message),
        onReconnecting: (peerId) => {
          setIsReconnecting(true);
          setReconnectAttempts((a) => a + 1);
        },
        onReconnected: () => {
          setIsReconnecting(false);
          setReconnectAttempts(0);
        },
      });
      roomRef.current = room;
      try {
        await room.joinRoom(code);
        await room.connectToHost("host");
        updateInviteUrl(code);
      } catch (err) {
        setNetError(err instanceof Error ? err.message : "加入房间失败");
      }
    },
    [handleNetworkMessage]
  );

  const discoverRooms = useCallback(() => {
    setDiscoveredRooms([]);
    const room = new GameRoomManager({
      playerName: "探测者",
      role: "client",
      maxPlayers: 1,
    });
    room.setDiscoveryResponse((code, hostId, name) => {
      setDiscoveredRooms((prev) => {
        if (prev.some((r) => r.roomCode === code)) return prev;
        return [...prev, { roomCode: code, hostId, playerName: name }];
      });
    });
    room.discoverRooms();
    setTimeout(() => room.close(), 3000);
  }, []);

  const updateInviteUrl = (code: string) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("room", code);
    window.history.replaceState({}, "", url.toString());
  };

  const copyInvite = useCallback(() => {
    if (typeof window === "undefined" || !roomCode) return;
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomCode);
    navigator.clipboard?.writeText(url.toString());
  }, [roomCode]);

  const leaveRoom = useCallback(() => {
    roomRef.current?.close();
    roomRef.current = null;
    setPlayers([]);
    setRoomCode("");
    setGameStarted(false);
    setIsReconnecting(false);
    setReconnectAttempts(0);
    setLobbyOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("room");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const handleReadyToggle = useCallback(() => {
    roomRef.current?.setReady(!roomRef.current.isLocalReady());
  }, []);

  const handleStartGame = useCallback(() => {
    const room = roomRef.current;
    const engine = engineRef.current;
    if (!room || !engine || !room.isHost()) return;
    const seed = Math.floor(Math.random() * 1000000);
    room.startGame(seed, selectedMode);
  }, [selectedMode]);

  const handleStart = useCallback(() => {
    engineRef.current?.start();
    audio?.startBgm();
    setIsStarted(true);
  }, []);

  const handlePauseToggle = useCallback(() => {
    engineRef.current?.pause();
    setFrame((f) => f + 1);
  }, []);

  const handleUpgrade = useCallback((option: UpgradeOption) => {
    engineRef.current?.selectUpgrade(option);
    setUpgradeOptions(null);
  }, []);

  const handleRoguelikeReward = useCallback((rewardId: string) => {
    engineRef.current?.selectRoguelikeReward(rewardId);
    setRoguelikeRewardOptions(null);
  }, []);

  const handleRestart = useCallback(() => {
    setRunResult(null);
    setUpgradeOptions(null);
    setRoguelikeRewardOptions(null);
    setIsStarted(false);
    engineRef.current?.restart();
    setTimeout(() => {
      engineRef.current?.start();
      setIsStarted(true);
    }, 100);
  }, []);

  const engine = engineRef.current;
  const status = engine?.state.status ?? "idle";
  const paused = status === "paused";
  const isTouch = typeof window !== "undefined" && "ontouchstart" in window;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-background">
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none outline-none"
        tabIndex={0}
        aria-label="游戏画布"
      />

      {engine && (
        <Hud
          state={engine.state}
          paused={paused}
          onPauseToggle={handlePauseToggle}
          extractionTimer={engine.state.extractionTimer}
        />
      )}

      {multiplayer && (
        <button
          onClick={() => setLobbyOpen((v) => !v)}
          className="pointer-events-auto absolute right-3 top-3 z-10 rounded-lg border border-border bg-panel/90 px-3 py-1.5 text-xs backdrop-blur-sm transition-colors hover:bg-panel focus-ring"
        >
          {lobbyOpen ? "关闭大厅" : "联机大厅"}
        </button>
      )}

      {multiplayer && (
        <MultiplayerLobby
          room={roomRef.current}
          isOpen={lobbyOpen}
          onClose={() => setLobbyOpen(false)}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onDiscoverRooms={discoverRooms}
          onReadyToggle={handleReadyToggle}
          onStartGame={handleStartGame}
          onLeaveRoom={leaveRoom}
          onCopyInvite={copyInvite}
          discoveredRooms={discoveredRooms}
          players={players}
          isReconnecting={isReconnecting}
          reconnectAttempts={reconnectAttempts}
          error={netError}
          gameStarted={gameStarted}
        />
      )}

      {isTouch && inputRef.current?.joystick.active && (
        <div
          className="pointer-events-none absolute rounded-full border-2 border-primary/40 bg-primary/10"
          style={{
            left: inputRef.current.joystick.origin.x - 40,
            top: inputRef.current.joystick.origin.y - 40,
            width: 80,
            height: 80,
          }}
        />
      )}
      {isTouch && inputRef.current?.joystick.active && (
        <div
          className="pointer-events-none absolute rounded-full bg-primary/40"
          style={{
            left: inputRef.current.joystick.current.x - 16,
            top: inputRef.current.joystick.current.y - 16,
            width: 32,
            height: 32,
          }}
        />
      )}

      {!isStarted && status === "idle" && !lobbyOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="max-w-md rounded-2xl border border-border bg-panel p-6 text-center shadow-2xl sm:p-8">
            <h2 className="text-2xl font-bold">准备部署</h2>
            <p className="mt-2 text-sm text-muted">
              {isTouch
                ? "在屏幕左侧拖动虚拟摇杆移动，武器自动射击。完成所有任务后抵达撤离点。"
                : "WASD / 方向键移动，武器自动射击。完成所有任务后抵达撤离点。"}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={handleStart}
                className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-background transition-transform hover:scale-105 focus-ring active:scale-95"
              >
                开始任务
              </button>
              {onExit && (
                <button
                  onClick={onExit}
                  className="rounded-lg border border-border px-6 py-3 text-sm transition-colors hover:bg-panel focus-ring active:scale-95"
                >
                  返回
                </button>
              )}
            </div>
            {isTouch && (
              <p className="mt-4 text-xs text-muted">
                提示：横屏体验更佳。点击浏览器菜单可安装到主屏幕离线游玩。
              </p>
            )}
          </div>
        </div>
      )}

      {paused && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="rounded-2xl border border-border bg-panel p-8 text-center">
            <h2 className="text-2xl font-bold">已暂停</h2>
            <p className="mt-2 text-sm text-muted">按 Esc 或点击下方按钮继续</p>
            <button
              onClick={handlePauseToggle}
              className="mt-6 rounded-lg bg-primary px-8 py-3 text-sm font-bold text-background transition-transform hover:scale-105 focus-ring active:scale-95"
            >
              继续
            </button>
          </div>
        </div>
      )}

      {upgradeOptions && <UpgradeModal options={upgradeOptions} onSelect={handleUpgrade} />}
      {roguelikeRewardOptions && (
        <RoguelikeRewardModal options={roguelikeRewardOptions} onSelect={handleRoguelikeReward} />
      )}
      {runResult && <RunEndModal result={runResult} onRestart={handleRestart} onExit={onExit} />}
    </div>
  );
}
