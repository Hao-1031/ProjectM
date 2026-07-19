import { describe, it, expect, vi } from "vitest";
import {
  clamp,
  distance,
  length,
  normalize,
  lerp,
  angleBetween,
  randomRange,
  circleCollision,
  circleRectCollision,
  pointInRect,
  randomPointOnBorder,
  randomPointInBounds,
  randomChoice,
  weightedRandom,
  uid,
  formatTime,
} from "./math";

describe("math utilities", () => {
  describe("clamp", () => {
    it("returns value within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it("clamps to min", () => {
      expect(clamp(-3, 0, 10)).toBe(0);
    });

    it("clamps to max", () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe("distance", () => {
    it("calculates euclidean distance", () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });

    it("returns 0 for same point", () => {
      expect(distance({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0);
    });
  });

  describe("length", () => {
    it("calculates vector length", () => {
      expect(length({ x: 6, y: 8 })).toBe(10);
    });
  });

  describe("normalize", () => {
    it("returns unit vector", () => {
      const result = normalize({ x: 10, y: 0 });
      expect(result.x).toBeCloseTo(1);
      expect(result.y).toBeCloseTo(0);
    });

    it("returns zero vector for zero input", () => {
      expect(normalize({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    });
  });

  describe("lerp", () => {
    it("interpolates between values", () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
    });

    it("returns start at t=0", () => {
      expect(lerp(0, 10, 0)).toBe(0);
    });

    it("returns end at t=1", () => {
      expect(lerp(0, 10, 1)).toBe(10);
    });
  });

  describe("angleBetween", () => {
    it("calculates horizontal angle", () => {
      expect(angleBetween({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(0);
    });

    it("calculates vertical angle", () => {
      expect(angleBetween({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(Math.PI / 2);
    });
  });

  describe("randomRange", () => {
    it("returns value within range", () => {
      const value = randomRange(5, 10);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(10);
    });
  });

  describe("circleCollision", () => {
    it("detects overlapping circles", () => {
      expect(circleCollision({ x: 0, y: 0, radius: 5 }, { x: 8, y: 0, radius: 5 })).toBe(true);
    });

    it("returns false for separated circles", () => {
      expect(circleCollision({ x: 0, y: 0, radius: 2 }, { x: 10, y: 0, radius: 2 })).toBe(false);
    });

    it("detects tangent circles", () => {
      expect(circleCollision({ x: 0, y: 0, radius: 5 }, { x: 10, y: 0, radius: 5 })).toBe(true);
    });
  });

  describe("circleRectCollision", () => {
    it("detects circle inside rectangle", () => {
      expect(
        circleRectCollision({ x: 0, y: 0, radius: 2 }, { x: 0, y: 0, width: 10, height: 10 })
      ).toBe(true);
    });

    it("detects circle overlapping rectangle corner", () => {
      expect(
        circleRectCollision({ x: 6, y: 6, radius: 3 }, { x: 0, y: 0, width: 10, height: 10 })
      ).toBe(true);
    });

    it("returns false for distant circle", () => {
      expect(
        circleRectCollision({ x: 20, y: 20, radius: 2 }, { x: 0, y: 0, width: 10, height: 10 })
      ).toBe(false);
    });
  });

  describe("pointInRect", () => {
    it("returns true for point inside rectangle", () => {
      expect(pointInRect({ x: 0, y: 0 }, { x: 0, y: 0, width: 10, height: 10 })).toBe(true);
    });

    it("returns false for point outside rectangle", () => {
      expect(pointInRect({ x: 10, y: 10 }, { x: 0, y: 0, width: 10, height: 10 })).toBe(false);
    });
  });

  describe("randomPointOnBorder", () => {
    it("returns point outside bounds", () => {
      const point = randomPointOnBorder(100, 100);
      expect(point.x < 0 || point.x > 100 || point.y < 0 || point.y > 100).toBe(true);
    });
  });

  describe("randomPointInBounds", () => {
    it("returns point within margins", () => {
      const point = randomPointInBounds(1000, 1000, 100);
      expect(point.x).toBeGreaterThanOrEqual(100);
      expect(point.x).toBeLessThanOrEqual(900);
      expect(point.y).toBeGreaterThanOrEqual(100);
      expect(point.y).toBeLessThanOrEqual(900);
    });
  });

  describe("randomChoice", () => {
    it("selects an item from array", () => {
      const items = ["a", "b", "c"];
      expect(items).toContain(randomChoice(items));
    });
  });

  describe("weightedRandom", () => {
    it("respects weights deterministically", () => {
      const items = [
        { item: "a", weight: 0 },
        { item: "b", weight: 1 },
      ];
      expect(weightedRandom(items)).toBe("b");
    });

    it("selects from weighted items", () => {
      const items = [
        { item: "a", weight: 1 },
        { item: "b", weight: 1 },
      ];
      expect(["a", "b"]).toContain(weightedRandom(items));
    });
  });

  describe("uid", () => {
    it("generates unique ids", () => {
      const a = uid("test");
      const b = uid("test");
      expect(a).not.toBe(b);
      expect(a.startsWith("test_")).toBe(true);
    });
  });

  describe("formatTime", () => {
    it("formats minutes and seconds", () => {
      expect(formatTime(125)).toBe("02:05");
    });

    it("pads single digits", () => {
      expect(formatTime(9)).toBe("00:09");
    });
  });
});
