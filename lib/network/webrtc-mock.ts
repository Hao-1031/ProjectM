export interface MockPeerConnectionState {
  localDescription: RTCSessionDescriptionInit | null;
  remoteDescription: RTCSessionDescriptionInit | null;
  iceCandidates: RTCIceCandidateInit[];
  addedCandidates: RTCIceCandidateInit[];
  dataChannels: MockDataChannel[];
  connectionState: RTCPeerConnectionState;
  iceGatheringState: RTCIceGatheringState;
  onicecandidate: ((event: { candidate: RTCIceCandidate | null }) => void) | null;
  onconnectionstatechange: (() => void) | null;
  ondatachannel: ((event: { channel: MockDataChannel }) => void) | null;
}

export class MockDataChannel {
  label: string;
  readyState: RTCDataChannelState = "connecting";
  binaryType: BinaryType = "arraybuffer";
  sent: (string | ArrayBuffer)[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string | ArrayBuffer }) => void) | null = null;

  constructor(label: string) {
    this.label = label;
  }

  send(data: string | ArrayBuffer): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = "closed";
    this.onclose?.();
  }

  simulateOpen(): void {
    this.readyState = "open";
    this.onopen?.();
  }

  simulateMessage(data: string | ArrayBuffer): void {
    this.onmessage?.({ data });
  }
}

export class MockRTCPeerConnection {
  static instances: MockRTCPeerConnection[] = [];

  localDescription: RTCSessionDescriptionInit | null = null;
  remoteDescription: RTCSessionDescriptionInit | null = null;
  iceCandidates: RTCIceCandidateInit[] = [];
  addedCandidates: RTCIceCandidateInit[] = [];
  dataChannels: MockDataChannel[] = [];
  connectionState: RTCPeerConnectionState = "new";
  iceGatheringState: RTCIceGatheringState = "new";
  onicecandidate: ((event: { candidate: RTCIceCandidate | null }) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  ondatachannel: ((event: { channel: MockDataChannel }) => void) | null = null;

  constructor() {
    MockRTCPeerConnection.instances.push(this);
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    return { sdp: "mock-offer", type: "offer" };
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    return { sdp: "mock-answer", type: "answer" };
  }

  async setLocalDescription(desc?: RTCSessionDescriptionInit): Promise<void> {
    this.localDescription = desc ?? { sdp: "", type: "offer" };
    this.iceGatheringState = "complete";
  }

  async setRemoteDescription(desc: RTCSessionDescriptionInit): Promise<void> {
    this.remoteDescription = desc;
    if (this.ondatachannel) {
      const dc = new MockDataChannel("game");
      this.dataChannels.push(dc);
      this.ondatachannel({ channel: dc });
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    this.addedCandidates.push(candidate);
  }

  createDataChannel(label: string): MockDataChannel {
    const dc = new MockDataChannel(label);
    this.dataChannels.push(dc);
    return dc;
  }

  close(): void {
    this.connectionState = "closed";
  }

  getStats(): Promise<RTCStatsReport> {
    return Promise.resolve(new Map() as unknown as RTCStatsReport);
  }

  simulateIceCandidate(candidate: RTCIceCandidateInit): void {
    this.iceCandidates.push(candidate);
    this.onicecandidate?.({ candidate: candidate as unknown as RTCIceCandidate });
  }

  simulateIceComplete(): void {
    this.iceGatheringState = "complete";
    this.onicecandidate?.({ candidate: null });
  }

  simulateConnected(): void {
    this.connectionState = "connected";
    this.onconnectionstatechange?.();
  }

  simulateDataChannel(dc: MockDataChannel): void {
    this.ondatachannel?.({ channel: dc });
  }
}

export class MockRTCSessionDescription {
  constructor(public readonly init: RTCSessionDescriptionInit) {}
}

export class MockRTCIceCandidate {
  constructor(public readonly init: RTCIceCandidateInit) {}
  toJSON(): RTCIceCandidateInit {
    return this.init;
  }
}

export class MockBroadcastChannel {
  static channels = new Map<string, MockBroadcastChannel[]>();

  name: string;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  closed = false;

  constructor(name: string) {
    this.name = name;
    if (!MockBroadcastChannel.channels.has(name)) {
      MockBroadcastChannel.channels.set(name, []);
    }
    MockBroadcastChannel.channels.get(name)!.push(this);
  }

  postMessage(data: unknown): void {
    if (this.closed) return;
    const peers = MockBroadcastChannel.channels.get(this.name) ?? [];
    for (const peer of peers) {
      if (peer !== this && !peer.closed && peer.onmessage) {
        peer.onmessage({ data });
      }
    }
  }

  close(): void {
    this.closed = true;
  }

  static clear(): void {
    MockBroadcastChannel.channels.clear();
  }
}

export class MockLocalStorage {
  store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

export function setupWebRTCMocks() {
  const originalRTCPeerConnection = globalThis.RTCPeerConnection;
  const originalRTCSessionDescription = globalThis.RTCSessionDescription;
  const originalRTCIceCandidate = globalThis.RTCIceCandidate;
  const originalBroadcastChannel = globalThis.BroadcastChannel;
  const originalLocalStorage = globalThis.localStorage;

  globalThis.RTCPeerConnection = MockRTCPeerConnection as unknown as typeof RTCPeerConnection;
  globalThis.RTCSessionDescription =
    MockRTCSessionDescription as unknown as typeof RTCSessionDescription;
  globalThis.RTCIceCandidate = MockRTCIceCandidate as unknown as typeof RTCIceCandidate;
  globalThis.BroadcastChannel = MockBroadcastChannel as unknown as typeof BroadcastChannel;

  const mockStorage = new MockLocalStorage();
  Object.defineProperty(globalThis, "localStorage", {
    value: mockStorage,
    writable: true,
    configurable: true,
  });

  return {
    restore: () => {
      globalThis.RTCPeerConnection = originalRTCPeerConnection;
      globalThis.RTCSessionDescription = originalRTCSessionDescription;
      globalThis.RTCIceCandidate = originalRTCIceCandidate;
      globalThis.BroadcastChannel = originalBroadcastChannel;
      Object.defineProperty(globalThis, "localStorage", {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      });
      MockRTCPeerConnection.instances = [];
      MockBroadcastChannel.clear();
    },
    storage: mockStorage,
  };
}
