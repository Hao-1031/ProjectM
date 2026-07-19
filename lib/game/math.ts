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
