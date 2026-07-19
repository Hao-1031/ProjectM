import type { SpriteAnimationState, SpriteSheet, RenderableEntity } from "./types";

const ANIMATION_FPS: Record<SpriteAnimationState, number> = {
  idle: 4,
  move: 8,
  attack: 12,
  hit: 12,
  death: 6,
};

export function updateAnimation(
  entity: RenderableEntity,
  dt: number,
  sheet?: SpriteSheet,
  forceState?: SpriteAnimationState
): void {
  entity.animationTimer += dt;

  if (forceState && entity.animation !== forceState) {
    entity.animation = forceState;
    entity.animationTimer = 0;
  }

  if (!sheet) return;

  const fps = ANIMATION_FPS[entity.animation] ?? 8;
  const frameDuration = 1 / fps;
  const frames = sheet.animations[entity.animation] ?? [];
  const totalDuration = frames.length * frameDuration;

  if (totalDuration > 0 && entity.animationTimer >= totalDuration) {
    if (entity.animation === "death") {
      entity.animationTimer = totalDuration - 0.001;
    } else {
      entity.animationTimer %= totalDuration;
    }
  }
}

export function getCurrentFrameIndex(entity: RenderableEntity, sheet: SpriteSheet): number {
  const fps = ANIMATION_FPS[entity.animation] ?? 8;
  const frameDuration = 1 / fps;
  const frames = sheet.animations[entity.animation] ?? [];
  if (frames.length === 0) return 0;
  return Math.min(Math.floor(entity.animationTimer / frameDuration), frames.length - 1);
}

export function transitionAnimation(
  entity: RenderableEntity,
  state: SpriteAnimationState,
  options?: { reset?: boolean }
): void {
  if (entity.animation === state && !options?.reset) return;
  entity.animation = state;
  entity.animationTimer = 0;
}

export function isAnimationFinished(entity: RenderableEntity, sheet: SpriteSheet): boolean {
  if (entity.animation === "death") {
    const fps = ANIMATION_FPS.death;
    const frames = sheet.animations.death ?? [];
    return entity.animationTimer >= frames.length / fps;
  }
  return false;
}

export function setFacing(entity: RenderableEntity, targetX: number, targetY: number): void {
  const dx = targetX - entity.x;
  const dy = targetY - entity.y;
  if (dx !== 0 || dy !== 0) {
    entity.facing = Math.atan2(dy, dx);
  }
}
