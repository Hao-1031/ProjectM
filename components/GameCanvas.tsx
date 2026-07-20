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
  BossId,
} from "@/lib/game/types";
import type { RoguelikeRewardBalance } from "@/lib/game/balance";
import { useAppStore } from "@/lib/store";
import { recordRun, getLoadout } from "@/lib/game/save";
import { getBossTemplate } from "@/lib/game/bosses";
import { GameRoomManager } from "@/lib/network/room";
import UpgradeModal from "./UpgradeModal";
import RoguelikeRewardModal from "./RoguelikeRewardModal";
import Hud from "./Hud";
import RunEndModal from "./RunEndModal";
import MultiplayerLobby from "./MultiplayerLobby";
import NotificationToast, { type GameNotification } from "./game/NotificationToast";
import WaveAnnouncement, { type WavePhase } from "./game/WaveAnnouncement";
import LoadoutModal from "./game/LoadoutModal";
import type { HeroId, WeaponId } from "@/lib/game/types";

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
  const [surrendered, setSurrendered] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [lobbyOpen, setLobbyOpen] = useState(multiplayer);
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState<NetworkPlayer[]>([]);
  const [discoveredRooms, setDiscoveredRooms] = useState<DiscoveredRoom[]>([]);
  const [netError, setNetError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameModeType>(() => {
    if (typeof window === "undefined") return "campaign";
    const params = new URLSearchParams(window.location.search);
    const m = params.get("mode") as GameModeType | null;
    return m && ["campaign", "endless", "daily", "roguelike", "defense", "deathmatch"].includes(m)
      ? m
      : "campaign";
  });
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const [showLoadout, setShowLoadout] = useState(true);
  const [loadoutSnapshot, setLoadoutSnapshot] = useState(() => getLoadout());
  const [waveAnnouncement, setWaveAnnouncement] = useState<{
    visible: boolean;
    wave: number;
    phase: WavePhase;
    bossName?: string;
  }>({ visible: false, wave: 0, phase: "incoming" });
  const settings = useAppStore((s) => s.settings);
  const prevWaveRef = useRef<number | null>(null);
  const prevWaveInProgressRef = useRef<boolean | null>(null);
  const prevBossRef = useRef<boolean>(false);

  const addNotification = useCallback((notification: Omit<GameNotification, "id">) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setNotifications((prev) => [...prev, { ...notification, id }]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    audio?.setEnabled(settings.audioEnabled);
    audio?.setVolume(settings.volume);
    audio?.setBgmVolume(settings.bgmVolume ?? 0.35);
  }, [settings.audioEnabled, settings.volume, settings.bgmVolume]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const engine = new GameEngine(
      {
        onLevelUp: (options) => setUpgradeOptions(options),
        onVictory: (result) => {
          setRunResult(result);
          recordRun(result);
          audio?.stopBgm();
        },
        onDefeat: (result) => {
          setRunResult(result);
          if (!result.surrendered) {
            recordRun(result);
          }
          audio?.stopBgm();
        },
        onKillStreak: (count) => {
          const labels: Record<number, string> = {
            10: "连杀",
            25: "大杀特杀",
            50: "收割机器",
            100: "末日传奇",
          };
          addNotification({
            title: labels[count] ?? "连杀",
            message: `连续击杀 ${count} 个敌人`,
            variant: "warning",
            icon: "danger",
            durationMs: 2500,
          });
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
      },
      selectedMode,
      undefined,
      loadoutSnapshot
    );
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

      // Defense mode notifications and announcements
      const ds = engine.state.defenseState;
      if (ds) {
        const waveChanged = prevWaveRef.current !== ds.currentWave;
        const progressChanged = prevWaveInProgressRef.current !== ds.waveInProgress;
        const hasBoss = engine.state.enemies.some((e) => e.isBoss);
        const corePct = ds.core.health / ds.core.maxHealth;

        if (waveChanged && ds.waveInProgress) {
          const isBossWave = ds.currentWave === ds.totalWaves - 1;
          setWaveAnnouncement({
            visible: true,
            wave: ds.currentWave + 1,
            phase: isBossWave ? "boss" : "incoming",
            bossName: isBossWave ? "巨像" : undefined,
          });
          addNotification({
            title: `第 ${ds.currentWave + 1} 波开始`,
            message: isBossWave ? "侦测到首领级信号" : "敌潮已接近防线",
            variant: isBossWave ? "danger" : "warning",
            icon: isBossWave ? "danger" : "warning",
            durationMs: 3000,
          });
        }

        if (progressChanged && !ds.waveInProgress && prevWaveInProgressRef.current === true) {
          setWaveAnnouncement({
            visible: true,
            wave: ds.currentWave + 1,
            phase: "cleared",
          });
          addNotification({
            title: "波次肃清",
            message: "补给窗口已开启",
            variant: "success",
            icon: "success",
            durationMs: 3000,
          });
        }

        if (hasBoss && !prevBossRef.current) {
          const boss = engine.state.enemies.find((e) => e.isBoss);
          const bossName = boss
            ? (getBossTemplate(boss.variant as BossId)?.name ?? boss.variant)
            : "首领";
          addNotification({
            title: "首领出现",
            message: `${bossName} 进入战场`,
            variant: "danger",
            icon: "danger",
            durationMs: 4000,
          });
        }

        if (corePct <= 0.25 && (prevWaveRef.current !== ds.currentWave || Math.random() < 0.005)) {
          addNotification({
            title: "核心危急",
            message: "核心耐久低于 25%",
            variant: "danger",
            icon: "shield",
            durationMs: 2500,
          });
        }

        prevWaveRef.current = ds.currentWave;
        prevWaveInProgressRef.current = ds.waveInProgress;
        prevBossRef.current = hasBoss;
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
  }, [settings.vibrationEnabled, addNotification]);

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

  const handleLoadoutConfirm = useCallback(
    (loadout: { heroId: HeroId; weaponIds: WeaponId[] }) => {
      engineRef.current?.setLoadout(loadout);
      setShowLoadout(false);
      handleStart();
    },
    [handleStart]
  );

  const handlePauseToggle = useCallback(() => {
    engineRef.current?.pause();
    setFrame((f) => f + 1);
  }, []);

  const handleUseSkill = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.useHeroSkill();
    setFrame((f) => f + 1);
  }, []);

  const handleUseUltimate = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.useHeroUltimate();
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
    setSurrendered(false);
    setIsStarted(false);
    setShowLoadout(true);
    setLoadoutSnapshot(getLoadout());
    engineRef.current?.restart();
  }, []);

  const handleSurrender = useCallback(() => {
    if (window.confirm("确定放弃战斗？本局将直接失败，不会保存任何奖励与进度。")) {
      engineRef.current?.surrender();
      setSurrendered(true);
    }
  }, []);

  const engine = engineRef.current;
  const status = engine?.state.status ?? "idle";
  const paused = status === "paused";
  const isTouch = typeof window !== "undefined" && "ontouchstart" in window;
  const ds = engine?.state.defenseState;

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
          onSurrender={handleSurrender}
          extractionTimer={engine.state.extractionTimer}
          onUseSkill={handleUseSkill}
          onUseUltimate={handleUseUltimate}
        />
      )}

      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
        position="top-right"
      />

      <WaveAnnouncement
        wave={waveAnnouncement.wave}
        totalWaves={ds?.totalWaves}
        phase={waveAnnouncement.phase}
        bossName={waveAnnouncement.bossName}
        visible={waveAnnouncement.visible}
        onComplete={() => setWaveAnnouncement((prev) => ({ ...prev, visible: false }))}
      />

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
            left: inputRef.current.joystick.origin.x - 72,
            top: inputRef.current.joystick.origin.y - 72,
            width: 144,
            height: 144,
          }}
        />
      )}
      {isTouch && inputRef.current?.joystick.active && (
        <div
          className="pointer-events-none absolute rounded-full bg-primary/40"
          style={{
            left: inputRef.current.joystick.current.x - 20,
            top: inputRef.current.joystick.current.y - 20,
            width: 40,
            height: 40,
          }}
        />
      )}

      {showLoadout && status === "idle" && !lobbyOpen && (
        <LoadoutModal
          mode={selectedMode}
          initialHero={loadoutSnapshot.heroId}
          initialWeapons={loadoutSnapshot.weaponIds}
          onConfirm={handleLoadoutConfirm}
          onCancel={onExit}
        />
      )}

      {paused && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-panel p-6 text-center sm:p-8">
            <h2 className="text-2xl font-bold">已暂停</h2>
            <p className="mt-2 text-sm text-muted">按 Esc 或点击下方按钮继续</p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handlePauseToggle}
                className="rounded-lg bg-primary px-8 py-3 text-sm font-bold text-background transition-transform hover:scale-105 focus-ring active:scale-95"
              >
                继续
              </button>
              <button
                onClick={handleSurrender}
                className="rounded-lg border border-danger/40 bg-danger/10 px-8 py-3 text-sm font-bold text-danger transition-transform hover:scale-105 focus-ring active:scale-95"
              >
                放弃战斗
              </button>
            </div>
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
