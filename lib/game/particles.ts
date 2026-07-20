import type { Particle } from "./types";
import { uid, randomRange, clamp } from "./math";

export type ParticlePreset =
  | "explosion"
  | "trail"
  | "spark"
  | "smoke"
  | "energy"
  | "core-damage"
  | "hit"
  | "crit"
  | "kill-burst";

export interface ParticleSpawnOptions {
  x: number;
  y: number;
  color?: string;
  count?: number;
  intensity?: number;
  direction?: { x: number; y: number };
  spread?: number;
  speedMin?: number;
  speedMax?: number;
  lifeMin?: number;
  lifeMax?: number;
  radiusMin?: number;
  radiusMax?: number;
  gravity?: number;
  drag?: number;
  fade?: boolean;
  shrink?: boolean;
  glow?: boolean;
}

const PRESETS: Record<ParticlePreset, Partial<ParticleSpawnOptions>> = {
  explosion: {
    count: 12,
    speedMin: 40,
    speedMax: 180,
    lifeMin: 0.25,
    lifeMax: 0.7,
    radiusMin: 2,
    radiusMax: 6,
    spread: Math.PI * 2,
    fade: true,
    shrink: true,
    glow: true,
  },
  trail: {
    count: 1,
    speedMin: -10,
    speedMax: 10,
    lifeMin: 0.15,
    lifeMax: 0.35,
    radiusMin: 1.5,
    radiusMax: 3,
    spread: Math.PI * 2,
    fade: true,
    shrink: true,
  },
  spark: {
    count: 4,
    speedMin: 60,
    speedMax: 220,
    lifeMin: 0.08,
    lifeMax: 0.25,
    radiusMin: 0.8,
    radiusMax: 2,
    spread: Math.PI * 0.6,
    fade: true,
    shrink: false,
    glow: true,
  },
  smoke: {
    count: 6,
    speedMin: 10,
    speedMax: 50,
    lifeMin: 0.6,
    lifeMax: 1.2,
    radiusMin: 3,
    radiusMax: 10,
    spread: Math.PI * 2,
    gravity: -8,
    drag: 0.6,
    fade: true,
    shrink: false,
    glow: false,
  },
  energy: {
    count: 8,
    speedMin: 30,
    speedMax: 120,
    lifeMin: 0.3,
    lifeMax: 0.6,
    radiusMin: 1.5,
    radiusMax: 4,
    spread: Math.PI * 2,
    fade: true,
    shrink: true,
    glow: true,
  },
  "core-damage": {
    count: 16,
    speedMin: 80,
    speedMax: 260,
    lifeMin: 0.2,
    lifeMax: 0.5,
    radiusMin: 1,
    radiusMax: 3,
    spread: Math.PI * 2,
    fade: true,
    shrink: true,
    glow: true,
  },
  hit: {
    count: 6,
    speedMin: 60,
    speedMax: 160,
    lifeMin: 0.1,
    lifeMax: 0.25,
    radiusMin: 1,
    radiusMax: 2.5,
    spread: Math.PI * 2,
    fade: true,
    shrink: true,
    glow: true,
  },
  crit: {
    count: 14,
    speedMin: 90,
    speedMax: 280,
    lifeMin: 0.15,
    lifeMax: 0.35,
    radiusMin: 1.2,
    radiusMax: 3.5,
    spread: Math.PI * 2,
    fade: true,
    shrink: true,
    glow: true,
  },
  "kill-burst": {
    count: 22,
    speedMin: 80,
    speedMax: 320,
    lifeMin: 0.25,
    lifeMax: 0.7,
    radiusMin: 1.5,
    radiusMax: 5,
    spread: Math.PI * 2,
    fade: true,
    shrink: true,
    glow: true,
  },
};

export class ParticlePool {
  private pool: Particle[] = [];
  private active: Particle[] = [];
  private maxSize: number;

  constructor(maxSize = 512) {
    this.maxSize = maxSize;
  }

  private acquire(): Particle {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return {
      id: uid("particle"),
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 0,
      color: "#ffffff",
      life: 0,
      maxLife: 0,
    };
  }

  spawn(options: ParticleSpawnOptions): number {
    const intensity = clamp(options.intensity ?? 1, 0, 3);
    const count = Math.floor((options.count ?? 1) * intensity);
    const added: Particle[] = [];

    for (let i = 0; i < count; i++) {
      if (this.active.length >= this.maxSize) break;
      const p = this.acquire();
      this.resetParticle(p, options);
      added.push(p);
    }

    this.active.push(...added);
    return added.length;
  }

  spawnPreset(
    preset: ParticlePreset,
    x: number,
    y: number,
    color?: string,
    overrides: Partial<ParticleSpawnOptions> = {}
  ): number {
    const base = PRESETS[preset];
    const options: ParticleSpawnOptions = {
      x,
      y,
      color: color ?? "#ffffff",
      ...base,
      ...overrides,
    };
    return this.spawn(options);
  }

  addRaw(particle: Particle): void {
    if (this.active.length >= this.maxSize) return;
    this.active.push(particle);
  }

  private resetParticle(p: Particle, options: ParticleSpawnOptions): void {
    const angle = options.direction
      ? Math.atan2(options.direction.y, options.direction.x) +
        randomRange(-(options.spread ?? Math.PI * 2) / 2, (options.spread ?? Math.PI * 2) / 2)
      : randomRange(0, Math.PI * 2);
    const speed = randomRange(options.speedMin ?? 30, options.speedMax ?? 100);

    p.x = options.x + randomRange(-4, 4);
    p.y = options.y + randomRange(-4, 4);
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.radius = randomRange(options.radiusMin ?? 1, options.radiusMax ?? 3);
    p.color = options.color ?? "#ffffff";
    p.maxLife = randomRange(options.lifeMin ?? 0.2, options.lifeMax ?? 0.5);
    p.life = p.maxLife;
    (p as unknown as Record<string, number | boolean>)["__gravity"] = options.gravity ?? 0;
    (p as unknown as Record<string, number | boolean>)["__drag"] = options.drag ?? 0;
    (p as unknown as Record<string, number | boolean>)["__fade"] = options.fade ?? true;
    (p as unknown as Record<string, number | boolean>)["__shrink"] = options.shrink ?? true;
    (p as unknown as Record<string, number | boolean>)["__glow"] = options.glow ?? false;
  }

  update(dt: number): void {
    const active = this.active;
    for (let i = active.length - 1; i >= 0; i--) {
      const p = active[i];
      const meta = p as unknown as Record<string, number | boolean>;
      const gravity = (meta["__gravity"] as number) ?? 0;
      const drag = (meta["__drag"] as number) ?? 0;

      p.vx *= Math.max(0, 1 - drag * dt);
      p.vy *= Math.max(0, 1 - drag * dt);
      p.vy += gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      if (p.life <= 0) {
        this.release(active.splice(i, 1)[0]);
      }
    }
  }

  private release(p: Particle): void {
    p.vx = 0;
    p.vy = 0;
    if (this.pool.length < this.maxSize) {
      this.pool.push(p);
    }
  }

  getParticles(): Particle[] {
    return this.active;
  }

  clear(): void {
    this.pool.push(...this.active);
    this.active.length = 0;
  }

  get activeCount(): number {
    return this.active.length;
  }

  get pooledCount(): number {
    return this.pool.length;
  }
}

export function updateParticles(particles: Particle[], dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

export function spawnParticleBurst(particles: Particle[], options: ParticleSpawnOptions): number {
  const intensity = clamp(options.intensity ?? 1, 0, 3);
  const count = Math.floor((options.count ?? 1) * intensity);

  for (let i = 0; i < count; i++) {
    const angle = options.direction
      ? Math.atan2(options.direction.y, options.direction.x) +
        randomRange(-(options.spread ?? Math.PI * 2) / 2, (options.spread ?? Math.PI * 2) / 2)
      : randomRange(0, Math.PI * 2);
    const speed = randomRange(options.speedMin ?? 30, options.speedMax ?? 100);

    particles.push({
      id: uid("particle"),
      x: options.x + randomRange(-4, 4),
      y: options.y + randomRange(-4, 4),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: randomRange(options.radiusMin ?? 1, options.radiusMax ?? 3),
      color: options.color ?? "#ffffff",
      life: randomRange(options.lifeMin ?? 0.2, options.lifeMax ?? 0.5),
      maxLife: options.lifeMax ?? 0.5,
    });
  }

  return count;
}

export function getParticleAlpha(p: Particle): number {
  return clamp(p.life / p.maxLife, 0, 1);
}

export function getParticleRadius(p: Particle): number {
  return p.radius * clamp(p.life / p.maxLife, 0, 1);
}
