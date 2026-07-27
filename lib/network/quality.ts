// Connection quality monitoring with packet loss, jitter, and bandwidth estimation
// Replaces hardcoded quality values in room.ts with real measurements

export interface QualityMetrics {
  rtt: number;
  packetLoss: number;
  jitter: number;
  bandwidthEstimate: number;
  score: "good" | "fair" | "poor" | "unknown";
  lastUpdate: number;
}

export interface QualityConfig {
  windowSize: number;
  goodRttThreshold: number;
  fairRttThreshold: number;
  goodLossThreshold: number;
  fairLossThreshold: number;
  qualityUpdateInterval: number;
}

const DEFAULT_QUALITY_CONFIG: QualityConfig = {
  windowSize: 60,
  goodRttThreshold: 80,
  fairRttThreshold: 200,
  goodLossThreshold: 0.02,
  fairLossThreshold: 0.08,
  qualityUpdateInterval: 2000,
};

export class ConnectionMonitor {
  private config: QualityConfig;
  private sentPackets = 0;
  private receivedPackets = 0;
  private lostPackets = 0;
  private rttSamples: number[] = [];
  private jitterSamples: number[] = [];
  private lastRtt = 0;
  private lastJitter = 0;
  private bytesReceived = 0;
  private bytesSent = 0;
  private lastBandwidthCalc = 0;
  private bandwidthEstimate = 0;
  private lastQualityUpdate = 0;
  private currentScore: QualityMetrics["score"] = "unknown";
  private sequenceBuffer: number[] = [];
  private lastSequence = -1;

  constructor(config: Partial<QualityConfig> = {}) {
    this.config = { ...DEFAULT_QUALITY_CONFIG, ...config };
  }

  recordSent(): void {
    this.sentPackets++;
  }

  recordReceived(sequence: number, size: number, timestamp: number): void {
    this.receivedPackets++;
    this.bytesReceived += size;

    if (this.lastSequence >= 0) {
      const gap = sequence - this.lastSequence - 1;
      if (gap > 0) {
        this.lostPackets += gap;
      }
    }
    this.lastSequence = sequence;

    this.sequenceBuffer.push(sequence);
    while (this.sequenceBuffer.length > this.config.windowSize * 2) {
      this.sequenceBuffer.shift();
    }
  }

  recordRtt(rtt: number): void {
    this.rttSamples.push(rtt);
    while (this.rttSamples.length > this.config.windowSize) {
      this.rttSamples.shift();
    }

    if (this.lastRtt > 0) {
      const jitter = Math.abs(rtt - this.lastRtt);
      this.jitterSamples.push(jitter);
      while (this.jitterSamples.length > this.config.windowSize) {
        this.jitterSamples.shift();
      }
      this.lastJitter = this.average(this.jitterSamples);
    }
    this.lastRtt = rtt;
  }

  recordBytesSent(bytes: number): void {
    this.bytesSent += bytes;
  }

  updateBandwidth(): void {
    const now = Date.now();
    if (this.lastBandwidthCalc === 0) {
      this.lastBandwidthCalc = now;
      this.bytesReceived = 0;
      this.bytesSent = 0;
      return;
    }

    const elapsed = (now - this.lastBandwidthCalc) / 1000;
    if (elapsed < 1) return;

    const bandwidthIn = (this.bytesReceived * 8) / elapsed;
    const bandwidthOut = (this.bytesSent * 8) / elapsed;
    this.bandwidthEstimate = Math.max(bandwidthIn, bandwidthOut);

    this.bytesReceived = 0;
    this.bytesSent = 0;
    this.lastBandwidthCalc = now;
  }

  getMetrics(): QualityMetrics {
    const now = Date.now();
    if (now - this.lastQualityUpdate > this.config.qualityUpdateInterval) {
      this.currentScore = this.calculateScore();
      this.lastQualityUpdate = now;
    }

    const totalPackets = this.sentPackets + this.receivedPackets;
    const packetLoss = totalPackets > 0
      ? this.lostPackets / totalPackets
      : 0;

    return {
      rtt: this.average(this.rttSamples),
      packetLoss,
      jitter: this.lastJitter,
      bandwidthEstimate: this.bandwidthEstimate,
      score: this.currentScore,
      lastUpdate: now,
    };
  }

  private calculateScore(): QualityMetrics["score"] {
    const avgRtt = this.average(this.rttSamples);
    const totalPackets = this.sentPackets + this.receivedPackets;
    const lossRate = totalPackets > 0 ? this.lostPackets / totalPackets : 0;

    if (avgRtt === 0) return "unknown";
    if (avgRtt < this.config.goodRttThreshold && lossRate < this.config.goodLossThreshold) {
      return "good";
    }
    if (avgRtt < this.config.fairRttThreshold && lossRate < this.config.fairLossThreshold) {
      return "fair";
    }
    return "poor";
  }

  private average(samples: number[]): number {
    if (samples.length === 0) return 0;
    return samples.reduce((a, b) => a + b, 0) / samples.length;
  }

  reset(): void {
    this.sentPackets = 0;
    this.receivedPackets = 0;
    this.lostPackets = 0;
    this.rttSamples = [];
    this.jitterSamples = [];
    this.lastRtt = 0;
    this.lastJitter = 0;
    this.bytesReceived = 0;
    this.bytesSent = 0;
    this.lastBandwidthCalc = 0;
    this.bandwidthEstimate = 0;
    this.lastQualityUpdate = 0;
    this.currentScore = "unknown";
    this.sequenceBuffer = [];
    this.lastSequence = -1;
  }
}

export interface AdaptiveSyncConfig {
  minSendInterval: number;
  maxSendInterval: number;
  qualityWeights: {
    rtt: number;
    loss: number;
    jitter: number;
  };
}

const DEFAULT_ADAPTIVE_CONFIG: AdaptiveSyncConfig = {
  minSendInterval: 16,
  maxSendInterval: 100,
  qualityWeights: {
    rtt: 0.5,
    loss: 0.3,
    jitter: 0.2,
  },
};

export class AdaptiveSync {
  private config: AdaptiveSyncConfig;
  private currentInterval: number;

  constructor(config: Partial<AdaptiveSyncConfig> = {}) {
    this.config = { ...DEFAULT_ADAPTIVE_CONFIG, ...config };
    this.currentInterval = this.config.minSendInterval;
  }

  adjustInterval(metrics: QualityMetrics): number {
    const { rtt, packetLoss, jitter } = metrics;
    const { rtt: rttW, loss: lossW, jitter: jitterW } = this.config.qualityWeights;

    const rttFactor = Math.min(1, rtt / 500);
    const lossFactor = Math.min(1, packetLoss * 10);
    const jitterFactor = Math.min(1, jitter / 100);

    const qualityFactor = rttFactor * rttW + lossFactor * lossW + jitterFactor * jitterW;

    const range = this.config.maxSendInterval - this.config.minSendInterval;
    this.currentInterval = this.config.minSendInterval + range * qualityFactor;

    return this.currentInterval;
  }

  getCurrentInterval(): number {
    return this.currentInterval;
  }

  reset(): void {
    this.currentInterval = this.config.minSendInterval;
  }
}