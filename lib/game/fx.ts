import { clamp, randomRange } from "./math";

export interface ScreenShakeOptions {
  intensity: number;
  duration: number;
  decay?: number;
  frequency?: number;
  traumaDecay?: number;
}

export interface HitStopOptions {
  duration: number;
  scale?: number;
}

export interface FlashOptions {
  duration: number;
  color: string;
  opacity?: number;
  decay?: number;
}

export interface CameraTrauma {
  trauma: number;
  shake: number;
  maxOffset: number;
  traumaDecay: number;
}

export class FXSystem {
  private shake: number;
  private shakeDecay: number;
  private shakeMax: number;
  private flash: number;
  private flashDuration: number;
  private flashColor: string;
  private flashOpacity: number;
  private hitStop: number;
  private hitStopScale: number;
  private slowMotion: number;
  private slowMotionFactor: number;
  private trauma: number;
  private traumaDecay: number;
  private time: number;
  private shakeFrequency: number;

  constructor() {
    this.shake = 0;
    this.shakeDecay = 1;
    this.shakeMax = 1;
    this.shakeFrequency = 15;
    this.flash = 0;
    this.flashDuration = 0;
    this.flashColor = "#ffffff";
    this.flashOpacity = 0;
    this.hitStop = 0;
    this.hitStopScale = 1;
    this.slowMotion = 0;
    this.slowMotionFactor = 1;
    this.trauma = 0;
    this.traumaDecay = 1.5;
    this.time = 0;
  }

  update(dt: number): void {
    this.time += dt;

    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - this.shakeDecay * dt);
    }

    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - this.traumaDecay * dt);
      const traumaShake = this.trauma * this.trauma * this.shakeMax;
      this.shake = Math.max(this.shake, traumaShake);
    }

    if (this.flash > 0) {
      this.flash = Math.max(0, this.flash - dt);
      const t = this.flashDuration > 0 ? this.flash / this.flashDuration : 0;
      this.flashOpacity = this.flashOpacity * t;
    } else {
      this.flashOpacity = 0;
    }

    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - dt);
    }

    if (this.slowMotion > 0) {
      this.slowMotion = Math.max(0, this.slowMotion - dt);
    }
  }

  addShake(intensity: number, duration: number, decay = 4): void {
    this.shake = Math.max(this.shake, intensity);
    this.shakeDecay = Math.max(this.shakeDecay, decay);
    this.shakeMax = Math.max(this.shakeMax, intensity);
  }

  addTrauma(amount: number): void {
    this.trauma = clamp(this.trauma + amount, 0, 1);
  }

  triggerShake(options: ScreenShakeOptions): void {
    const intensity = options.intensity;
    this.shake = Math.max(this.shake, intensity);
    this.shakeDecay = options.decay ?? 4;
    this.shakeFrequency = options.frequency ?? 15;
    this.shakeMax = Math.max(this.shakeMax, intensity);
    if (options.duration > 0 && options.traumaDecay) {
      this.trauma = clamp(this.trauma + intensity * 0.25, 0, 1);
      this.traumaDecay = options.traumaDecay;
    }
  }

  triggerHitStop(options: HitStopOptions): void {
    this.hitStop = Math.max(this.hitStop, options.duration);
    this.hitStopScale = clamp(options.scale ?? 0.05, 0.001, 1);
  }

  triggerSlowMotion(duration: number, factor = 0.25): void {
    this.slowMotion = Math.max(this.slowMotion, duration);
    this.slowMotionFactor = clamp(factor, 0.05, 1);
  }

  triggerFlash(options: FlashOptions): void {
    this.flash = options.duration;
    this.flashDuration = options.duration;
    this.flashColor = options.color;
    this.flashOpacity = clamp(options.opacity ?? 0.4, 0, 1);
  }

  getShakeOffset(): { x: number; y: number } {
    if (this.shake <= 0) return { x: 0, y: 0 };
    const angle = randomRange(0, Math.PI * 2);
    const offset = this.shake * 6;
    return {
      x: Math.cos(angle) * offset,
      y: Math.sin(angle) * offset,
    };
  }

  getDetailedShakeOffset(): { x: number; y: number; rotation: number } {
    if (this.shake <= 0) return { x: 0, y: 0, rotation: 0 };
    const t = this.time * this.shakeFrequency;
    const x = Math.sin(t) * this.shake * 5;
    const y = Math.cos(t * 1.3) * this.shake * 5;
    const rotation = Math.sin(t * 0.7) * this.shake * 0.02;
    return { x, y, rotation };
  }

  getTimeScale(): number {
    if (this.hitStop > 0) return this.hitStopScale;
    if (this.slowMotion > 0) return this.slowMotionFactor;
    return 1;
  }

  getFlashColor(): string {
    if (this.flash <= 0) return "transparent";
    const alpha = Math.floor(clamp(this.flashOpacity, 0, 1) * 255)
      .toString(16)
      .padStart(2, "0");
    return `${this.flashColor}${alpha}`;
  }

  getFlashState(): { active: boolean; color: string; opacity: number } {
    if (this.flash <= 0) {
      return { active: false, color: "transparent", opacity: 0 };
    }
    return {
      active: true,
      color: this.flashColor,
      opacity: clamp(this.flashOpacity, 0, 1),
    };
  }

  getTrauma(): CameraTrauma {
    return {
      trauma: this.trauma,
      shake: this.shake,
      maxOffset: this.shakeMax * 6,
      traumaDecay: this.traumaDecay,
    };
  }

  isHitStopped(): boolean {
    return this.hitStop > 0;
  }

  isSlowMotion(): boolean {
    return this.slowMotion > 0;
  }

  reset(): void {
    this.shake = 0;
    this.flash = 0;
    this.flashOpacity = 0;
    this.hitStop = 0;
    this.slowMotion = 0;
    this.trauma = 0;
  }

  drawFlash(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.flash <= 0 || this.flashOpacity <= 0) return;
    ctx.save();
    ctx.globalAlpha = clamp(this.flashOpacity, 0, 1);
    ctx.fillStyle = this.flashColor;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

export function applyScreenShake(
  ctx: CanvasRenderingContext2D,
  shake: { x: number; y: number; rotation?: number }
): void {
  if (shake.x === 0 && shake.y === 0 && (shake.rotation ?? 0) === 0) return;
  ctx.translate(shake.x, shake.y);
  if (shake.rotation) {
    ctx.rotate(shake.rotation);
  }
}
