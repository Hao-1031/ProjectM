export interface NetworkSnapshot {
  latencyMs: number;
  jitterMs: number;
  packetLossPercent: number;
  serverTime: number;
  clientTime: number;
}

export interface EntityState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  timestamp: number;
}

export interface PredictedState {
  x: number;
  y: number;
  confidence: number;
  extrapolationMs: number;
  reconciliationNeeded: boolean;
}

export interface NetworkReport {
  latencyMs: number;
  jitterMs: number;
  packetLossPercent: number;
  recommendedInterpolationMs: number;
  clockSkewMs: number;
  quality: "excellent" | "good" | "fair" | "poor" | "critical";
}

const LATENCY_EXCELLENT = 50;
const LATENCY_GOOD = 100;
const LATENCY_FAIR = 180;
const JITTER_THRESHOLD = 30;
const PACKET_LOSS_THRESHOLD = 2;

/**
 * 评估网络质量并推荐客户端插值延迟。
 */
export function evaluateNetwork(snapshot: NetworkSnapshot): NetworkReport {
  const { latencyMs, jitterMs, packetLossPercent } = snapshot;

  const clockSkewMs = snapshot.clientTime - snapshot.serverTime;

  // 推荐插值 = 当前延迟 + 2*抖动，给予足够缓冲
  const recommendedInterpolationMs = Math.min(500, latencyMs + jitterMs * 2 + 20);

  let quality: NetworkReport["quality"] = "critical";
  if (latencyMs <= LATENCY_EXCELLENT && jitterMs < JITTER_THRESHOLD && packetLossPercent < 0.5) {
    quality = "excellent";
  } else if (latencyMs <= LATENCY_GOOD && jitterMs < JITTER_THRESHOLD && packetLossPercent < PACKET_LOSS_THRESHOLD) {
    quality = "good";
  } else if (latencyMs <= LATENCY_FAIR && jitterMs < JITTER_THRESHOLD * 2 && packetLossPercent < PACKET_LOSS_THRESHOLD * 2) {
    quality = "fair";
  } else if (latencyMs <= 300 && packetLossPercent < 5) {
    quality = "poor";
  }

  return {
    latencyMs: round2(latencyMs),
    jitterMs: round2(jitterMs),
    packetLossPercent: round2(packetLossPercent),
    recommendedInterpolationMs: round2(recommendedInterpolationMs),
    clockSkewMs: round2(clockSkewMs),
    quality,
  };
}

/**
 * 基于上一帧状态进行客户端预测/外推。
 * 高延迟时增加预测步长，但降低置信度。
 */
export function predictEntityState(
  lastAuthoritative: EntityState,
  snapshot: NetworkSnapshot,
  options: { maxExtrapolationMs?: number; speedLimit?: number } = {}
): PredictedState {
  const { maxExtrapolationMs = 250, speedLimit = 500 } = options;

  const now = snapshot.serverTime;
  const elapsedMs = Math.max(0, now - lastAuthoritative.timestamp);
  const extrapolationMs = Math.min(elapsedMs + snapshot.latencyMs / 2, maxExtrapolationMs);

  const speed = Math.hypot(lastAuthoritative.vx, lastAuthoritative.vy);
  const clampedSpeed = Math.min(speed, speedLimit);
  const speedRatio = clampedSpeed / Math.max(1, speed);

  const dx = lastAuthoritative.vx * (extrapolationMs / 1000) * speedRatio;
  const dy = lastAuthoritative.vy * (extrapolationMs / 1000) * speedRatio;

  // 置信度随外推时间与抖动下降
  const jitterPenalty = clamp(snapshot.jitterMs / 100, 0, 0.4);
  const lossPenalty = clamp(snapshot.packetLossPercent / 10, 0, 0.5);
  const timePenalty = clamp(extrapolationMs / maxExtrapolationMs, 0, 1);
  const confidence = clamp(1 - timePenalty * 0.5 - jitterPenalty - lossPenalty, 0, 1);

  // 当客户端预测与服务端差距过大时需要和解
  const reconciliationNeeded =
    snapshot.latencyMs > LATENCY_FAIR || snapshot.packetLossPercent > PACKET_LOSS_THRESHOLD;

  return {
    x: round2(lastAuthoritative.x + dx),
    y: round2(lastAuthoritative.y + dy),
    confidence: round2(confidence),
    extrapolationMs: round2(extrapolationMs),
    reconciliationNeeded,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
