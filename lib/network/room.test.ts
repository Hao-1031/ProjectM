import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GameRoomManager } from "./room";
import { setupWebRTCMocks, MockRTCPeerConnection } from "./webrtc-mock";

describe("GameRoomManager", () => {
  let mocks: ReturnType<typeof setupWebRTCMocks>;

  beforeEach(() => {
    mocks = setupWebRTCMocks();
  });

  afterEach(() => {
    mocks.restore();
  });

  function createHost() {
    return new GameRoomManager({
      playerName: "Host",
      role: "host",
      maxPlayers: 4,
      onPeerConnect: vi.fn(),
      onPeerDisconnect: vi.fn(),
      onNetworkMessage: vi.fn(),
      onGameStart: vi.fn(),
      onAllReady: vi.fn(),
      onError: vi.fn(),
    });
  }

  function createClient() {
    return new GameRoomManager({
      playerName: "Client",
      role: "client",
      maxPlayers: 4,
      onPeerConnect: vi.fn(),
      onPeerDisconnect: vi.fn(),
      onNetworkMessage: vi.fn(),
      onGameStart: vi.fn(),
      onAllReady: vi.fn(),
      onError: vi.fn(),
    });
  }

  it("host creates room with code", async () => {
    const room = createHost();
    const code = await room.createRoom();
    expect(code).toBeTruthy();
    expect(code.length).toBe(6);
    room.close();
  });

  it("client joins room with code", async () => {
    const room = createClient();
    await room.joinRoom("ROOM12");
    expect(room.roomCode).toBe("ROOM12");
    room.close();
  });

  it("only host can create room", async () => {
    const room = createClient();
    await expect(room.createRoom()).rejects.toThrow();
    room.close();
  });

  it("only client can join room", async () => {
    const room = createHost();
    await expect(room.joinRoom("ROOM12")).rejects.toThrow();
    room.close();
  });

  it("handles offer from peer", async () => {
    const room = createHost();
    await room.createRoom();
    await room.handleOffer("peer_2", {
      sdp: "remote-offer",
      type: "offer",
      candidates: [{ candidate: "c1" }],
    });
    expect(MockRTCPeerConnection.instances.length).toBeGreaterThan(0);
    room.close();
  });

  it("limits peer count", async () => {
    const room = createHost();
    await room.createRoom();
    room["peers"].set("p1", { close: vi.fn() } as never);
    room["peers"].set("p2", { close: vi.fn() } as never);
    room["peers"].set("p3", { close: vi.fn() } as never);
    await room.handleOffer("p4", { sdp: "remote-offer", type: "offer", candidates: [] });
    expect(MockRTCPeerConnection.instances.length).toBe(0);
    room.close();
  });

  it("handles answer from peer", async () => {
    const room = createClient();
    await room.joinRoom("ROOM12");
    await room.connectToHost("host_1");
    await room.handleAnswer("host_1", {
      sdp: "remote-answer",
      type: "answer",
      candidates: [{ candidate: "c1" }],
    });
    const pc = MockRTCPeerConnection.instances[MockRTCPeerConnection.instances.length - 1];
    expect(pc.addedCandidates.length).toBeGreaterThan(0);
    room.close();
  });

  it("client connects to host", async () => {
    const room = createClient();
    await room.joinRoom("ROOM12");
    await room.connectToHost("host_1");
    expect(MockRTCPeerConnection.instances.length).toBeGreaterThan(0);
    room.close();
  });

  it("broadcasts messages to all peers", async () => {
    const room = createHost();
    await room.createRoom();
    await room.handleOffer("peer_2", { sdp: "remote-offer", type: "offer", candidates: [] });

    const pc = MockRTCPeerConnection.instances[0];
    const dc = pc.dataChannels[0];
    dc.simulateOpen();

    room.broadcast({ type: "ping", timestamp: 1 });
    expect(dc.sent.length).toBeGreaterThan(0);
    room.close();
  });

  it("sends message to specific peer", async () => {
    const room = createHost();
    await room.createRoom();
    await room.handleOffer("peer_2", { sdp: "remote-offer", type: "offer", candidates: [] });

    const pc = MockRTCPeerConnection.instances[0];
    const dc = pc.dataChannels[0];
    dc.simulateOpen();

    room.sendTo("peer_2", { type: "ping", timestamp: 1 });
    expect(dc.sent.length).toBeGreaterThan(0);
    room.close();
  });

  it("handles hello message", async () => {
    const room = createHost();
    await room.createRoom();
    room["handleMessage"]("peer_2", {
      type: "hello",
      peerId: "peer_2",
      playerName: "Player2",
      timestamp: Date.now(),
    });
    expect(room.players.some((p) => p.peerId === "peer_2" && p.playerName === "Player2")).toBe(
      true
    );
    room.close();
  });

  it("handles ready message and checks all ready", async () => {
    const onAllReady = vi.fn();
    const room = new GameRoomManager({
      playerName: "Host",
      role: "host",
      maxPlayers: 4,
      onAllReady,
    });
    await room.createRoom();
    room["handleMessage"]("peer_2", {
      type: "hello",
      peerId: "peer_2",
      playerName: "Player2",
      timestamp: Date.now(),
    });
    room["handleMessage"]("peer_2", { type: "ready", peerId: "peer_2", ready: true });
    room.setReady(true);
    expect(onAllReady).toHaveBeenCalled();
    room.close();
  });

  it("host starts game", async () => {
    const onGameStart = vi.fn();
    const room = new GameRoomManager({
      playerName: "Host",
      role: "host",
      maxPlayers: 4,
      onGameStart,
    });
    await room.createRoom();
    await room.handleOffer("peer_2", { sdp: "remote-offer", type: "offer", candidates: [] });

    const pc = MockRTCPeerConnection.instances[0];
    const dc = pc.dataChannels[0];
    dc.simulateOpen();

    room.startGame(12345, "campaign");
    expect(onGameStart).toHaveBeenCalledWith(12345, "campaign");
    expect(dc.sent.length).toBeGreaterThan(0);
    room.close();
  });

  it("client receives start game message", async () => {
    const onGameStart = vi.fn();
    const room = new GameRoomManager({
      playerName: "Client",
      role: "client",
      maxPlayers: 4,
      onGameStart,
    });
    await room.joinRoom("ROOM12");
    room["handleMessage"]("host_1", {
      type: "start",
      seed: 12345,
      mode: "campaign",
      timestamp: Date.now(),
    });
    expect(onGameStart).toHaveBeenCalledWith(12345, "campaign");
    room.close();
  });

  it("forwards state input event ping pong messages", async () => {
    const onNetworkMessage = vi.fn();
    const room = new GameRoomManager({
      playerName: "Host",
      role: "host",
      maxPlayers: 4,
      onNetworkMessage,
    });
    await room.createRoom();
    room["handleMessage"]("peer_2", { type: "state", state: {} as never, timestamp: 1, frame: 1 });
    room["handleMessage"]("peer_2", { type: "input", input: {} as never, timestamp: 1, frame: 1 });
    room["handleMessage"]("peer_2", { type: "event", event: "test", data: null });
    room["handleMessage"]("peer_2", { type: "ping", timestamp: 1 });
    room["handleMessage"]("peer_2", { type: "pong", timestamp: 1 });
    expect(onNetworkMessage).toHaveBeenCalledTimes(5);
    room.close();
  });

  it("closes all peers", async () => {
    const room = createHost();
    await room.createRoom();
    await room.handleOffer("peer_2", { sdp: "remote-offer", type: "offer", candidates: [] });
    room.close();
    expect(room["peers"].size).toBe(0);
    expect(room.players.length).toBe(0);
  });

  it("syncs player list to clients", () => {
    const onPlayerListChange = vi.fn();
    const room = new GameRoomManager({
      playerName: "Host",
      role: "host",
      maxPlayers: 4,
      onPlayerListChange,
    });
    room["handleMessage"]("peer_2", {
      type: "hello",
      peerId: "peer_2",
      playerName: "Player2",
      timestamp: Date.now(),
    });
    expect(onPlayerListChange).toHaveBeenCalled();
    room.close();
  });

  it("client applies player list", () => {
    const onPlayerListChange = vi.fn();
    const room = new GameRoomManager({
      playerName: "Client",
      role: "client",
      maxPlayers: 4,
      onPlayerListChange,
    });
    room["localPeerId"] = "host";
    room["handleMessage"]("host", {
      type: "player_list",
      players: [
        { peerId: "host", playerName: "Host", ready: false, latency: 0, lastInputFrame: 0 },
        { peerId: "peer_2", playerName: "Player2", ready: true, latency: 0, lastInputFrame: 0 },
      ],
      timestamp: Date.now(),
    });
    expect(room.players.length).toBe(1);
    expect(room.players[0].peerId).toBe("peer_2");
    room.close();
  });

  it("host peer id is fixed to host", async () => {
    const room = createHost();
    expect(room.getLocalPeerId()).toBe("host");
    room.close();
  });

  it("handles kick message for local peer", () => {
    const onError = vi.fn();
    const room = new GameRoomManager({
      playerName: "Client",
      role: "client",
      maxPlayers: 4,
      onError,
    });
    room["localPeerId"] = "peer_victim";
    room["handleMessage"]("host", {
      type: "kick",
      peerId: "peer_victim",
      reason: "test",
      timestamp: Date.now(),
    });
    expect(onError).toHaveBeenCalled();
    room.close();
  });

  it("host can kick a player", async () => {
    const room = createHost();
    await room.createRoom();
    await room.handleOffer("peer_2", { sdp: "remote-offer", type: "offer", candidates: [] });
    room.kickPlayer("peer_2");
    expect(room["peers"].size).toBe(0);
    room.close();
  });

  it("client handles reconnect flow", () => {
    const onReconnecting = vi.fn();
    const room = new GameRoomManager({
      playerName: "Client",
      role: "client",
      maxPlayers: 4,
      onReconnecting,
    });
    room["peers"].set("host", { close: vi.fn() } as never);
    room["handlePeerClose"]("host");
    expect(onReconnecting).toHaveBeenCalledWith("host");
    room.close();
  });
});
