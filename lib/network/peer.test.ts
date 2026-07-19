import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PeerConnection } from "./peer";
import { setupWebRTCMocks, MockRTCPeerConnection, MockDataChannel } from "./webrtc-mock";

describe("PeerConnection", () => {
  let mocks: ReturnType<typeof setupWebRTCMocks>;

  beforeEach(() => {
    mocks = setupWebRTCMocks();
  });

  afterEach(() => {
    mocks.restore();
  });

  function createPeer(role: "host" | "client" = "host") {
    return new PeerConnection({
      peerId: "peer_1",
      role,
      onMessage: vi.fn(),
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onError: vi.fn(),
    });
  }

  it("reports error when WebRTC is not supported", () => {
    const original = globalThis.RTCPeerConnection;
    globalThis.RTCPeerConnection = undefined as unknown as typeof RTCPeerConnection;
    const peer = createPeer();
    const onError = vi.fn();
    peer.onError = onError;
    peer.createConnection();
    expect(onError).toHaveBeenCalled();
    globalThis.RTCPeerConnection = original;
  });

  it("creates data channel as host", () => {
    const peer = createPeer("host");
    peer.createConnection();
    expect(MockRTCPeerConnection.instances).toHaveLength(1);
    const pc = MockRTCPeerConnection.instances[0];
    expect(pc.dataChannels).toHaveLength(1);
  });

  it("waits for data channel as client", () => {
    const peer = createPeer("client");
    peer.createConnection();
    const pc = MockRTCPeerConnection.instances[0];
    const dc = new MockDataChannel("game");
    pc.simulateDataChannel(dc);
    expect(pc.dataChannels).toHaveLength(0);
  });

  it("creates offer with candidates", async () => {
    const peer = createPeer("host");
    peer.createConnection();
    const offer = await peer.createOffer();
    expect(offer.type).toBe("offer");
    expect(offer.sdp).toBeTruthy();
    expect(offer.candidates).toBeDefined();
  });

  it("accepts offer and creates answer", async () => {
    const peer = createPeer("client");
    peer.createConnection();
    const answer = await peer.acceptOffer({
      sdp: "remote-offer",
      type: "offer",
      candidates: [{ candidate: "c1" }],
    });
    expect(answer.type).toBe("answer");
    expect(answer.sdp).toBeTruthy();
  });

  it("accepts answer and adds candidates", async () => {
    const peer = createPeer("host");
    peer.createConnection();
    await peer.acceptAnswer({
      sdp: "remote-answer",
      type: "answer",
      candidates: [{ candidate: "c1" }, { candidate: "c2" }],
    });
    const pc = MockRTCPeerConnection.instances[0];
    expect(pc.addedCandidates).toHaveLength(2);
  });

  it("queues messages before connection opens", () => {
    const peer = createPeer("host");
    peer.createConnection();
    const pc = MockRTCPeerConnection.instances[0];
    const dc = pc.dataChannels[0];
    peer.send({ type: "ping", timestamp: 1 });
    expect(dc.sent).toHaveLength(0);
    dc.simulateOpen();
    expect(dc.sent).toHaveLength(1);
  });

  it("sends message when connected", () => {
    const peer = createPeer("host");
    peer.createConnection();
    const pc = MockRTCPeerConnection.instances[0];
    const dc = pc.dataChannels[0];
    dc.simulateOpen();
    peer.send({ type: "ping", timestamp: 1 });
    expect(dc.sent).toHaveLength(1);
    expect(JSON.parse(dc.sent[0] as string)).toEqual({ type: "ping", timestamp: 1 });
  });

  it("delivers received messages", () => {
    const onMessage = vi.fn();
    const peer = new PeerConnection({
      peerId: "peer_1",
      role: "host",
      onMessage,
    });
    peer.createConnection();
    const pc = MockRTCPeerConnection.instances[0];
    const dc = pc.dataChannels[0];
    dc.simulateOpen();
    dc.simulateMessage(JSON.stringify({ type: "pong", timestamp: 2 }));
    expect(onMessage).toHaveBeenCalledWith({ type: "pong", timestamp: 2 });
  });

  it("reports error on invalid message", () => {
    const onError = vi.fn();
    const peer = new PeerConnection({
      peerId: "peer_1",
      role: "host",
      onError,
    });
    peer.createConnection();
    const pc = MockRTCPeerConnection.instances[0];
    const dc = pc.dataChannels[0];
    dc.simulateOpen();
    dc.simulateMessage("not-json");
    expect(onError).toHaveBeenCalled();
  });

  it("decodes array buffer messages", () => {
    const onMessage = vi.fn();
    const peer = new PeerConnection({
      peerId: "peer_1",
      role: "host",
      onMessage,
    });
    peer.createConnection();
    const pc = MockRTCPeerConnection.instances[0];
    const dc = pc.dataChannels[0];
    dc.simulateOpen();
    const encoder = new TextEncoder();
    dc.simulateMessage(encoder.encode(JSON.stringify({ type: "ping", timestamp: 3 })).buffer);
    expect(onMessage).toHaveBeenCalledWith({ type: "ping", timestamp: 3 });
  });

  it("closes connections", () => {
    const peer = createPeer("host");
    peer.createConnection();
    peer.close();
    const pc = MockRTCPeerConnection.instances[0];
    expect(pc.connectionState).toBe("closed");
  });

  it("updates connected state when data channel opens", () => {
    const peer = createPeer("host");
    peer.createConnection();
    const pc = MockRTCPeerConnection.instances[0];
    const dc = pc.dataChannels[0];
    expect(peer.connected).toBe(false);
    dc.simulateOpen();
    expect(peer.connected).toBe(true);
  });

  it("updates connected state on connection state change", () => {
    const peer = createPeer("host");
    peer.createConnection();
    const pc = MockRTCPeerConnection.instances[0];
    pc.simulateConnected();
    expect(peer.connected).toBe(true);
  });
});
