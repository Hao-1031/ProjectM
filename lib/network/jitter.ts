// Jitter buffer and input replay system
// Smooths out network jitter by buffering inputs and replaying them at consistent intervals

import type { InputState } from "@/lib/game/types";

export interface JitterConfig {
  targetBufferMs: number;
  maxBufferMs: number;
  minBufferMs: number;
  adjustRate: number;
}

export interface BufferedInput {
  frame: number;
  input: InputState;
  arrivalTime: number;
  scheduledTime: number;
}

export interface JitterStats {
  currentBufferMs: number;
  targetBufferMs: number;
  jitterMs: number;
  packetLoss: number;
  latePackets: number;
  totalPackets: number;
}

const DEFAULT_JITTER_CONFIG: JitterConfig = {
  targetBufferMs: 50,
  maxBufferMs: 150,
  minBufferMs: 20,
  adjustRate: 0.1,
};

export class JitterBuffer {
  private config: JitterConfig;
  private buffer: BufferedInput[] = [];
  private currentBufferMs: number;
  private jitterEstimate = 0;
  private lastArrivalTime = 0;
  private interArrivalJitter = 0;
  private latePackets = 0;
  private totalPackets = 0;
  private frameDuration = 16.67;

  constructor(frameRate = 60, config: Partial<JitterConfig> = {}) {
    this.config = { ...DEFAULT_JITTER_CONFIG, ...config };
    this.currentBufferMs = this.config.targetBufferMs;
    this.frameDuration = 1000 / frameRate;
  }

  push(frame: number, input: InputState, arrivalTime: number): void {
    this.totalPackets++;

    if (this.lastArrivalTime > 0) {
      const transit = arrivalTime - this.lastArrivalTime;
      const diff = Math.abs(transit - this.interArrivalJitter);
      this.interArrivalJitter += (diff - this.interArrivalJitter) / 16;
      this.jitterEstimate = this.interArrivalJitter;
    }
    this.lastArrivalTime = arrivalTime;

    const scheduledTime = arrivalTime + this.currentBufferMs;
    this.buffer.push({ frame, input, arrivalTime, scheduledTime });
    this.buffer.sort((a, b) => a.frame - b.frame);

    this.adjustBuffer();
  }

  pop(now: number): BufferedInput | null {
    for (let i = 0; i < this.buffer.length; i++) {
      if (this.buffer[i].scheduledTime <= now) {
        const [item] = this.buffer.splice(i, 1);
        return item;
      }
    }
    return null;
  }

  getFrameInput(frame: number): BufferedInput | null {
    const idx = this.buffer.findIndex((b) => b.frame === frame);
    if (idx < 0) return null;
    const [item] = this.buffer.splice(idx, 1);
    return item;
  }

  peekNextFrame(): number | null {
    return this.buffer.length > 0 ? this.buffer[0].frame : null;
  }

  private adjustBuffer(): void {
    const jitter = this.jitterEstimate;
    const target = this.config.targetBufferMs + jitter * 2;
    const clamped = Math.max(this.config.minBufferMs, Math.min(this.config.maxBufferMs, target));

    this.currentBufferMs += (clamped - this.currentBufferMs) * this.config.adjustRate;

    const now = Date.now();
    let removedCount = 0;
    for (const item of this.buffer) {
      if (item.scheduledTime < now - this.config.maxBufferMs) {
        removedCount++;
      }
    }
    this.latePackets += removedCount;
    this.buffer = this.buffer.filter(
      (item) => item.scheduledTime >= now - this.config.maxBufferMs
    );
  }

  getStats(): JitterStats {
    const packetLoss =
      this.totalPackets > 0
        ? (this.latePackets / this.totalPackets)
        : 0;

    return {
      currentBufferMs: this.currentBufferMs,
      targetBufferMs: this.config.targetBufferMs,
      jitterMs: this.jitterEstimate,
      packetLoss,
      latePackets: this.latePackets,
      totalPackets: this.totalPackets,
    };
  }

  reset(): void {
    this.buffer = [];
    this.currentBufferMs = this.config.targetBufferMs;
    this.jitterEstimate = 0;
    this.lastArrivalTime = 0;
    this.interArrivalJitter = 0;
    this.latePackets = 0;
    this.totalPackets = 0;
  }
}

export class InputReplay {
  private jitterBuffer: JitterBuffer;
  private replayQueue: BufferedInput[] = [];
  private lastAcknowledgedFrame = 0;

  constructor(frameRate = 60) {
    this.jitterBuffer = new JitterBuffer(frameRate);
  }

  bufferInput(frame: number, input: InputState): void {
    this.jitterBuffer.push(frame, input, Date.now());
  }

  getNextInput(now: number): BufferedInput | null {
    return this.jitterBuffer.pop(now);
  }

  getInputForFrame(frame: number): BufferedInput | null {
    return this.jitterBuffer.getFrameInput(frame);
  }

  acknowledgeFrame(frame: number): void {
    if (frame > this.lastAcknowledgedFrame) {
      this.lastAcknowledgedFrame = frame;
    }
  }

  getStats(): JitterStats {
    return this.jitterBuffer.getStats();
  }

  reset(): void {
    this.jitterBuffer.reset();
    this.replayQueue = [];
    this.lastAcknowledgedFrame = 0;
  }
}