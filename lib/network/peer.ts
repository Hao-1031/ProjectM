import type { NetworkMessage, NetworkRole } from "@/lib/game/types";

export interface PeerOptions {
  peerId: string;
  role: NetworkRole;
  onMessage?: (message: NetworkMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
}

export class PeerConnection {
  peerId: string;
  role: NetworkRole;
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private onMessage?: (message: NetworkMessage) => void;
  private onOpen?: () => void;
  private onClose?: () => void;
  onError?: (error: Error) => void;
  private iceCandidates: RTCIceCandidateInit[] = [];
  private messageQueue: NetworkMessage[] = [];
  connected = false;

  constructor(options: PeerOptions) {
    this.peerId = options.peerId;
    this.role = options.role;
    this.onMessage = options.onMessage;
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;
    this.onError = options.onError;
  }

  createConnection() {
    if (typeof RTCPeerConnection === "undefined") {
      this.onError?.(new Error("WebRTC is not supported in this environment"));
      return;
    }

    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.iceCandidates.push(event.candidate.toJSON());
      }
    };

    this.pc.onconnectionstatechange = () => {
      if (this.pc?.connectionState === "connected") {
        this.connected = true;
      } else if (
        this.pc?.connectionState === "disconnected" ||
        this.pc?.connectionState === "failed"
      ) {
        this.connected = false;
        this.onClose?.();
      }
    };

    if (this.role === "host") {
      this.dc = this.pc.createDataChannel("game", {
        ordered: false,
        maxRetransmits: 0,
      });
      this.setupDataChannel();
    } else {
      this.pc.ondatachannel = (event) => {
        this.dc = event.channel;
        this.setupDataChannel();
      };
    }
  }

  private setupDataChannel() {
    if (!this.dc) return;
    this.dc.binaryType = "arraybuffer";
    this.dc.onopen = () => {
      this.connected = true;
      this.flushMessageQueue();
      this.onOpen?.();
    };
    this.dc.onclose = () => {
      this.connected = false;
      this.onClose?.();
    };
    this.dc.onerror = () => {
      this.onError?.(new Error("Data channel error"));
    };
    this.dc.onmessage = (event) => {
      try {
        const text =
          typeof event.data === "string" ? event.data : new TextDecoder().decode(event.data);
        const message = JSON.parse(text) as NetworkMessage;
        this.onMessage?.(message);
      } catch (err) {
        this.onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    };
  }

  async createOffer(): Promise<{
    sdp: string;
    type: RTCSdpType;
    candidates: RTCIceCandidateInit[];
  }> {
    if (!this.pc) throw new Error("PeerConnection not initialized");
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    await this.waitForIceGathering();
    return {
      sdp: this.pc.localDescription?.sdp ?? "",
      type: this.pc.localDescription?.type as RTCSdpType,
      candidates: this.iceCandidates,
    };
  }

  async acceptOffer(offer: {
    sdp: string;
    type: RTCSdpType;
    candidates: RTCIceCandidateInit[];
  }): Promise<{ sdp: string; type: RTCSdpType; candidates: RTCIceCandidateInit[] }> {
    if (!this.pc) throw new Error("PeerConnection not initialized");
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    await this.waitForIceGathering();
    return {
      sdp: this.pc.localDescription?.sdp ?? "",
      type: this.pc.localDescription?.type as RTCSdpType,
      candidates: this.iceCandidates,
    };
  }

  async acceptAnswer(answer: {
    sdp: string;
    type: RTCSdpType;
    candidates: RTCIceCandidateInit[];
  }): Promise<void> {
    if (!this.pc) throw new Error("PeerConnection not initialized");
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
    for (const candidate of answer.candidates) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  async addIceCandidates(candidates: RTCIceCandidateInit[]): Promise<void> {
    if (!this.pc) return;
    for (const candidate of candidates) {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  private waitForIceGathering(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.pc) return resolve();
      if (this.pc.iceGatheringState === "complete") return resolve();
      const check = () => {
        if (this.pc?.iceGatheringState === "complete") {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      setTimeout(() => resolve(), 2000);
      check();
    });
  }

  send(message: NetworkMessage): void {
    if (!this.connected || !this.dc || this.dc.readyState !== "open") {
      this.messageQueue.push(message);
      return;
    }
    const text = JSON.stringify(message);
    this.dc.send(text);
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) this.send(message);
    }
  }

  close(): void {
    this.dc?.close();
    this.pc?.close();
    this.connected = false;
  }

  getStats(): Promise<RTCStatsReport | null> {
    return this.pc?.getStats() ?? Promise.resolve(null);
  }
}
