import type { Vec2 } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function length(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function angleBetween(a: Vec2, b: Vec2): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomPointOnBorder(width: number, height: number, margin = 80): Vec2 {
  const side = Math.floor(Math.random() * 4);
  switch (side) {
    case 0:
      return { x: randomRange(-margin, width + margin), y: -margin };
    case 1:
      return { x: width + margin, y: randomRange(-margin, height + margin) };
    case 2:
      return { x: randomRange(-margin, width + margin), y: height + margin };
    default:
      return { x: -margin, y: randomRange(-margin, height + margin) };
  }
}

export function circleCollision(
  a: { x: number; y: number; radius: number },
  b: { x: number; y: number; radius: number }
): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const r = a.radius + b.radius;
  return dx * dx + dy * dy <= r * r;
}

export function circleRectCollision(
  circle: { x: number; y: number; radius: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  const closestX = clamp(circle.x, rect.x - rect.width / 2, rect.x + rect.width / 2);
  const closestY = clamp(circle.y, rect.y - rect.height / 2, rect.y + rect.height / 2);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

export interface RectBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function rectBounds(rect: { x: number; y: number; width: number; height: number }): RectBounds {
  return {
    left: rect.x - rect.width / 2,
    right: rect.x + rect.width / 2,
    top: rect.y - rect.height / 2,
    bottom: rect.y + rect.height / 2,
  };
}

export function rectOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  padding = 0
): boolean {
  const ab = rectBounds(a);
  const bb = rectBounds(b);
  return (
    ab.left < bb.right + padding &&
    ab.right > bb.left - padding &&
    ab.top < bb.bottom + padding &&
    ab.bottom > bb.top - padding
  );
}

const EPSILON = 0.001;

/**
 * Resolve a circle-vs-rectangle collision by returning the minimal displacement
 * vector needed to push the circle out of the rectangle. Handles the case where
 * the circle center is inside the rectangle (the original `resolveObstacleCollisions`
 * would get stuck because closest point equals center and dist == 0).
 */
export function resolveCircleRectCollision(
  circle: { x: number; y: number; radius: number },
  rect: { x: number; y: number; width: number; height: number }
): { x: number; y: number } | null {
  const bounds = rectBounds(rect);
  const inside =
    circle.x >= bounds.left && circle.x <= bounds.right && circle.y >= bounds.top && circle.y <= bounds.bottom;

  if (inside) {
    // Center is inside rectangle. Push out through the nearest edge so the
    // circle no longer collides (radius + small epsilon past the edge).
    const toLeft = circle.x - bounds.left;
    const toRight = bounds.right - circle.x;
    const toTop = circle.y - bounds.top;
    const toBottom = bounds.bottom - circle.y;
    const min = Math.min(toLeft, toRight, toTop, toBottom);

    if (min === toLeft) return { x: bounds.left - circle.radius - EPSILON - circle.x, y: 0 };
    if (min === toRight) return { x: bounds.right + circle.radius + EPSILON - circle.x, y: 0 };
    if (min === toTop) return { y: bounds.top - circle.radius - EPSILON - circle.y, x: 0 };
    return { y: bounds.bottom + circle.radius + EPSILON - circle.y, x: 0 };
  }

  // Center is outside. Compute closest point on rectangle and push along normal.
  const closestX = clamp(circle.x, bounds.left, bounds.right);
  const closestY = clamp(circle.y, bounds.top, bounds.bottom);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distSq = dx * dx + dy * dy;
  const radiusSq = circle.radius * circle.radius;

  if (distSq === 0) {
    // Circle center is exactly on an edge/corner but not inside. Use rectangle normal.
    const toLeft = Math.abs(circle.x - bounds.left);
    const toRight = Math.abs(circle.x - bounds.right);
    const toTop = Math.abs(circle.y - bounds.top);
    const toBottom = Math.abs(circle.y - bounds.bottom);
    const min = Math.min(toLeft, toRight, toTop, toBottom);

    if (min === toLeft) return { x: -(circle.radius + EPSILON), y: 0 };
    if (min === toRight) return { x: circle.radius + EPSILON, y: 0 };
    if (min === toTop) return { y: -(circle.radius + EPSILON), x: 0 };
    return { y: circle.radius + EPSILON, x: 0 };
  }

  if (distSq > radiusSq) return null;

  const dist = Math.sqrt(distSq);
  const penetration = circle.radius - dist + EPSILON;
  return {
    x: (dx / dist) * penetration,
    y: (dy / dist) * penetration,
  };
}

export function pointInRect(
  point: Vec2,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x - rect.width / 2 &&
    point.x <= rect.x + rect.width / 2 &&
    point.y >= rect.y - rect.height / 2 &&
    point.y <= rect.y + rect.height / 2
  );
}

export function randomPointInBounds(width: number, height: number, margin = 100): Vec2 {
  return {
    x: randomRange(margin, width - margin),
    y: randomRange(margin, height - margin),
  };
}

export function randomChoice<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function weightedRandom<T>(items: { item: T; weight: number }[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * total;
  for (const entry of items) {
    roll -= entry.weight;
    if (roll <= 0) return entry.item;
  }
  return items[items.length - 1].item;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36).slice(-4)}`;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}
