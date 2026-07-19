import type { SpriteAnimationState, SpriteSheet, RenderableEntity } from "./types";

const ANIMATION_FPS: Record<SpriteAnimationState, number> = {
  idle: 4,
  move: 8,
  attack: 12,
  hit: 12,
  death: 6,
  charge: 10,
  stun: 8,
  deploy: 8,
  recoil: 16,
  overheat: 7,
};

const LOOPING_STATES: Set<SpriteAnimationState> = new Set([
  "idle",
  "move",
  "charge",
  "stun",
  "overheat",
]);

const ONE_SHOT_STATES: Set<SpriteAnimationState> = new Set([
  "attack",
  "hit",
  "death",
  "deploy",
  "recoil",
]);

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
    if (LOOPING_STATES.has(entity.animation)) {
      entity.animationTimer %= totalDuration;
    } else {
      entity.animationTimer = totalDuration - 0.001;
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
  const frames = sheet.animations[entity.animation] ?? [];
  if (frames.length === 0) return true;
  if (LOOPING_STATES.has(entity.animation)) return false;
  const fps = ANIMATION_FPS[entity.animation] ?? 8;
  return entity.animationTimer >= frames.length / fps;
}

export function setFacing(entity: RenderableEntity, targetX: number, targetY: number): void {
  const dx = targetX - entity.x;
  const dy = targetY - entity.y;
  if (dx !== 0 || dy !== 0) {
    entity.facing = Math.atan2(dy, dx);
  }
}

// Mechanical enemy helpers
export function transitionToCharge(entity: RenderableEntity): void {
  transitionAnimation(entity, "charge");
}

export function transitionToStun(entity: RenderableEntity): void {
  transitionAnimation(entity, "stun");
}

export function transitionToOverheat(entity: RenderableEntity): void {
  transitionAnimation(entity, "overheat");
}

// Weapon recoil helper
export function triggerRecoil(entity: RenderableEntity): void {
  transitionAnimation(entity, "recoil", { reset: true });
}

// Deployable helper
export function transitionToDeploy(entity: RenderableEntity): void {
  transitionAnimation(entity, "deploy");
}

export function returnToIdleAfterDeploy(entity: RenderableEntity, sheet: SpriteSheet): boolean {
  if (entity.animation === "deploy" && isAnimationFinished(entity, sheet)) {
    transitionAnimation(entity, "idle");
    return true;
  }
  return false;
}

export function returnToMoveAfterRecoil(entity: RenderableEntity, sheet: SpriteSheet): boolean {
  if (entity.animation === "recoil" && isAnimationFinished(entity, sheet)) {
    transitionAnimation(entity, "move");
    return true;
  }
  return false;
}

export function getAnimationProgress(entity: RenderableEntity, sheet: SpriteSheet): number {
  const fps = ANIMATION_FPS[entity.animation] ?? 8;
  const frames = sheet.animations[entity.animation] ?? [];
  if (frames.length === 0) return 1;
  const totalDuration = frames.length / fps;
  return Math.min(1, entity.animationTimer / totalDuration);
}

export function isLoopingState(state: SpriteAnimationState): boolean {
  return LOOPING_STATES.has(state);
}

export function isOneShotState(state: SpriteAnimationState): boolean {
  return ONE_SHOT_STATES.has(state);
}
