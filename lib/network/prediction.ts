// Client-side prediction and server reconciliation engine
// Implements authoritative server model with client-side prediction for responsive gameplay

import type { InputState, SerializedGameState } from "@/lib/game/types";

export interface PredictionConfig {
  maxHistoryFrames: number;
  reconciliationThreshold: number;
  inputBufferSize: number;
}

export interface FrameInput {
  frame: number;
  input: InputState;
  timestamp: number;
}

export interface PredictedState {
  frame: number;
  state: SerializedGameState;
  input: InputState;
}

export interface ReconciliationResult {
  reconciled: boolean;
  positionDelta: { x: number; y: number };
  needsCorrection: boolean;
}

const DEFAULT_CONFIG: PredictionConfig = {
  maxHistoryFrames: 120,
  reconciliationThreshold: 5,
  inputBufferSize: 60,
};

export class NetworkPrediction {
  private config: PredictionConfig;
  private inputHistory: FrameInput[] = [];
  private predictedStates: PredictedState[] = [];
  private lastServerFrame = 0;
  private lastAcknowledgedFrame = 0;

  constructor(config: Partial<PredictionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  addInput(frame: number, input: InputState): void {
    this.inputHistory.push({ frame, input, timestamp: Date.now() });
    while (this.inputHistory.length > this.config.inputBufferSize) {
      this.inputHistory.shift();
    }
  }

  recordPrediction(frame: number, state: SerializedGameState, input: InputState): void {
    this.predictedStates.push({ frame, state, input });
    while (this.predictedStates.length > this.config.maxHistoryFrames) {
      this.predictedStates.shift();
    }
  }

  reconcile(serverFrame: number, serverState: SerializedGameState): ReconciliationResult {
    this.lastServerFrame = serverFrame;
    const result: ReconciliationResult = {
      reconciled: false,
      positionDelta: { x: 0, y: 0 },
      needsCorrection: false,
    };

    const predicted = this.predictedStates.find((p) => p.frame === serverFrame);
    if (!predicted) return result;

    const serverX = serverState.player.x;
    const serverY = serverState.player.y;
    const predictedX = predicted.state.player.x;
    const predictedY = predicted.state.player.y;

    const dx = serverX - predictedX;
    const dy = serverY - predictedY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    result.reconciled = true;
    result.positionDelta = { x: dx, y: dy };
    result.needsCorrection = distance > this.config.reconciliationThreshold;

    this.lastAcknowledgedFrame = serverFrame;

    this.predictedStates = this.predictedStates.filter((p) => p.frame > serverFrame);
    this.inputHistory = this.inputHistory.filter((i) => i.frame > serverFrame);

    return result;
  }

  getUnacknowledgedInputs(): FrameInput[] {
    return this.inputHistory.filter((i) => i.frame > this.lastAcknowledgedFrame);
  }

  getLastAcknowledgedFrame(): number {
    return this.lastAcknowledgedFrame;
  }

  getLastServerFrame(): number {
    return this.lastServerFrame;
  }

  getPredictionLead(): number {
    return this.inputHistory.length > 0
      ? this.inputHistory[this.inputHistory.length - 1].frame - this.lastServerFrame
      : 0;
  }

  reset(): void {
    this.inputHistory = [];
    this.predictedStates = [];
    this.lastServerFrame = 0;
    this.lastAcknowledgedFrame = 0;
  }
}

export interface InterpolationConfig {
  bufferSize: number;
  maxBufferedStates: number;
}

export interface InterpolatedSnapshot {
  state: SerializedGameState;
  renderTime: number;
}

const DEFAULT_INTERP_CONFIG: InterpolationConfig = {
  bufferSize: 100,
  maxBufferedStates: 30,
};

export class StateInterpolation {
  private config: InterpolationConfig;
  private stateBuffer: Array<{ frame: number; state: SerializedGameState; timestamp: number }> = [];
  private lastRenderTime = 0;

  constructor(config: Partial<InterpolationConfig> = {}) {
    this.config = { ...DEFAULT_INTERP_CONFIG, ...config };
  }

  addServerState(frame: number, state: SerializedGameState, timestamp: number): void {
    this.stateBuffer.push({ frame, state, timestamp });
    this.stateBuffer.sort((a, b) => a.frame - b.frame);
    while (this.stateBuffer.length > this.config.maxBufferedStates) {
      this.stateBuffer.shift();
    }
  }

  getInterpolatedState(now: number): InterpolatedSnapshot | null {
    if (this.stateBuffer.length < 2) return null;

    const renderTime = now - this.config.bufferSize;
    this.lastRenderTime = renderTime;

    let from = this.stateBuffer[0];
    let to = this.stateBuffer[0];

    for (let i = 0; i < this.stateBuffer.length - 1; i++) {
      if (this.stateBuffer[i + 1].timestamp > renderTime) {
        from = this.stateBuffer[i];
        to = this.stateBuffer[i + 1];
        break;
      }
    }

    const range = to.timestamp - from.timestamp;
    if (range <= 0) return { state: to.state, renderTime };

    const t = Math.max(0, Math.min(1, (renderTime - from.timestamp) / range));

    const interpolated = this.lerpStates(from.state, to.state, t);
    return { state: interpolated, renderTime };
  }

  private lerpStates(
    from: SerializedGameState,
    to: SerializedGameState,
    t: number
  ): SerializedGameState {
    const lerp = (a: number, b: number) => a + (b - a) * t;

    const result = { ...to };
    result.player = {
      ...to.player,
      x: lerp(from.player.x, to.player.x),
      y: lerp(from.player.y, to.player.y),
    };

    result.enemies = to.enemies.map((enemy, i) => {
      const fromEnemy = from.enemies[i];
      if (!fromEnemy || fromEnemy.id !== enemy.id) return enemy;
      return {
        ...enemy,
        x: lerp(fromEnemy.x, enemy.x),
        y: lerp(fromEnemy.y, enemy.y),
      };
    });

    result.projectiles = to.projectiles.map((proj, i) => {
      const fromProj = from.projectiles[i];
      if (!fromProj || fromProj.id !== proj.id) return proj;
      return {
        ...proj,
        x: lerp(fromProj.x, proj.x),
        y: lerp(fromProj.y, proj.y),
      };
    });

    return result;
  }

  getBufferFill(): number {
    if (this.stateBuffer.length < 2) return 0;
    const oldest = this.stateBuffer[0].timestamp;
    const newest = this.stateBuffer[this.stateBuffer.length - 1].timestamp;
    const range = newest - oldest;
    return range > 0 ? Math.min(1, this.config.bufferSize / range) : 0;
  }

  reset(): void {
    this.stateBuffer = [];
    this.lastRenderTime = 0;
  }
}