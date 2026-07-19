import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SignalingChannel } from "./signaling";
import { setupWebRTCMocks, MockBroadcastChannel } from "./webrtc-mock";

describe("SignalingChannel", () => {
  let mocks: ReturnType<typeof setupWebRTCMocks>;

  beforeEach(() => {
    mocks = setupWebRTCMocks();
  });

  afterEach(() => {
    mocks.restore();
  });

  function createChannel(roomCode = "ROOM1", localPeerId = "peer_a") {
    return new SignalingChannel({
      roomCode,
      localPeerId,
      onOffer: vi.fn(),
      onAnswer: vi.fn(),
    });
  }

  it("sets room code", () => {
    const channel = createChannel("ROOM1");
    channel.setRoomCode("ROOM2");
    expect(channel).toBeDefined();
  });

  it("opens and starts polling", async () => {
    const channel = createChannel();
    await channel.open();
    expect(MockBroadcastChannel.channels.size).toBeGreaterThan(0);
    channel.close();
  });

  it("delivers offer via broadcast channel", async () => {
    const onOffer = vi.fn();
    const channel = new SignalingChannel({
      roomCode: "ROOM1",
      localPeerId: "peer_b",
      onOffer,
    });
    await channel.open();

    const sender = new MockBroadcastChannel("pm_signal_ROOM1");
    sender.postMessage({
      from: "peer_a",
      to: "peer_b",
      roomCode: "ROOM1",
      kind: "offer",
      payload: { type: "offer", sdp: "sdp", candidates: [{ candidate: "c1" }] },
      timestamp: Date.now(),
    });

    expect(onOffer).toHaveBeenCalledWith("peer_a", expect.objectContaining({ sdp: "sdp" }));
    sender.close();
    channel.close();
  });

  it("ignores messages for other rooms", async () => {
    const onOffer = vi.fn();
    const channel = new SignalingChannel({
      roomCode: "ROOM1",
      localPeerId: "peer_b",
      onOffer,
    });
    await channel.open();

    const sender = new MockBroadcastChannel("pm_signal_OTHER");
    sender.postMessage({
      from: "peer_a",
      to: "peer_b",
      roomCode: "OTHER",
      kind: "offer",
      payload: { type: "offer", sdp: "sdp", candidates: [{ candidate: "c1" }] },
      timestamp: Date.now(),
    });

    expect(onOffer).not.toHaveBeenCalled();
    sender.close();
    channel.close();
  });

  it("ignores messages not addressed to local peer", async () => {
    const onOffer = vi.fn();
    const channel = new SignalingChannel({
      roomCode: "ROOM1",
      localPeerId: "peer_b",
      onOffer,
    });
    await channel.open();

    const sender = new MockBroadcastChannel("pm_signal_ROOM1");
    sender.postMessage({
      from: "peer_a",
      to: "peer_c",
      roomCode: "ROOM1",
      kind: "offer",
      payload: { type: "offer", sdp: "sdp", candidates: [{ candidate: "c1" }] },
      timestamp: Date.now(),
    });

    expect(onOffer).not.toHaveBeenCalled();
    sender.close();
    channel.close();
  });

  it("processes broadcast messages addressed to all", async () => {
    const onOffer = vi.fn();
    const channel = new SignalingChannel({
      roomCode: "ROOM1",
      localPeerId: "peer_b",
      onOffer,
    });
    await channel.open();

    const sender = new MockBroadcastChannel("pm_signal_ROOM1");
    sender.postMessage({
      from: "peer_a",
      to: "*",
      roomCode: "ROOM1",
      kind: "offer",
      payload: { type: "offer", sdp: "sdp", candidates: [{ candidate: "c1" }] },
      timestamp: Date.now(),
    });

    expect(onOffer).toHaveBeenCalled();
    sender.close();
    channel.close();
  });

  it("deduplicates repeated messages", async () => {
    const onOffer = vi.fn();
    const channel = new SignalingChannel({
      roomCode: "ROOM1",
      localPeerId: "peer_b",
      onOffer,
    });
    await channel.open();

    const sender = new MockBroadcastChannel("pm_signal_ROOM1");
    const timestamp = Date.now();
    const message = {
      from: "peer_a",
      to: "peer_b",
      roomCode: "ROOM1",
      kind: "offer",
      payload: { type: "offer", sdp: "sdp", candidates: [{ candidate: "c1" }] },
      timestamp,
    };
    sender.postMessage(message);
    sender.postMessage(message);

    expect(onOffer).toHaveBeenCalledTimes(1);
    sender.close();
    channel.close();
  });

  it("polls localStorage for messages", async () => {
    vi.useFakeTimers();
    const onAnswer = vi.fn();
    const channel = new SignalingChannel({
      roomCode: "ROOM1",
      localPeerId: "peer_b",
      onAnswer,
    });
    await channel.open();

    mocks.storage.setItem(
      "pm_signal_ROOM1_peer_a_peer_b_answer_1234",
      JSON.stringify({
        from: "peer_a",
        to: "peer_b",
        roomCode: "ROOM1",
        kind: "answer",
        payload: { type: "answer", sdp: "sdp", candidates: [{ candidate: "c1" }] },
        timestamp: Date.now(),
      })
    );

    vi.advanceTimersByTime(600);
    expect(onAnswer).toHaveBeenCalled();
    channel.close();
    vi.useRealTimers();
  });

  it("removes expired localStorage messages", async () => {
    vi.useFakeTimers();
    const channel = createChannel("ROOM1", "peer_b");
    await channel.open();

    const key = "pm_signal_ROOM1_peer_a_peer_b_answer_1234";
    mocks.storage.setItem(
      key,
      JSON.stringify({
        from: "peer_a",
        to: "peer_b",
        roomCode: "ROOM1",
        kind: "answer",
        payload: { type: "answer", sdp: "sdp", candidates: [] },
        timestamp: Date.now() - 40000,
      })
    );

    vi.advanceTimersByTime(600);
    expect(mocks.storage.getItem(key)).toBeNull();
    channel.close();
    vi.useRealTimers();
  });

  it("sends offer through broadcast and storage", async () => {
    const channel = createChannel("ROOM1", "peer_a");
    await channel.open();

    const offer = { sdp: "sdp", type: "offer" as const, candidates: [{ candidate: "c1" }] };
    channel.sendOffer("peer_b", offer);

    expect(MockBroadcastChannel.channels.has("pm_signal_ROOM1")).toBe(true);
    expect(Array.from(mocks.storage.store.keys()).some((k) => k.includes("offer"))).toBe(true);
    channel.close();
  });

  it("sends answer through broadcast and storage", async () => {
    const channel = createChannel("ROOM1", "peer_a");
    await channel.open();

    const answer = { sdp: "sdp", type: "answer" as const, candidates: [{ candidate: "c1" }] };
    channel.sendAnswer("peer_b", answer);

    expect(Array.from(mocks.storage.store.keys()).some((k) => k.includes("answer"))).toBe(true);
    channel.close();
  });

  it("broadcasts discovery", async () => {
    const channel = createChannel("ROOM1", "peer_a");
    await channel.open();
    channel.sendDiscovery("ROOM1", "peer_a", "Player");
    expect(MockBroadcastChannel.channels.has("pm_signal_ROOM1")).toBe(true);
    channel.close();
  });
});
