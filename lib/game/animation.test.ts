import { describe, it, expect } from "vitest";
import {
  updateAnimation,
  getCurrentFrameIndex,
  transitionAnimation,
  isAnimationFinished,
  setFacing,
} from "./animation";
import type { RenderableEntity, SpriteSheet } from "./types";

function createEntity(overrides: Partial<RenderableEntity> = {}): RenderableEntity {
  return {
    x: 100,
    y: 100,
    radius: 14,
    facing: 0,
    animation: "idle",
    animationTimer: 0,
    ...overrides,
  };
}

function createSheet(): SpriteSheet {
  return {
    id: "test",
    image: null,
    dataUri: "",
    frameWidth: 64,
    frameHeight: 64,
    animations: {
      idle: [
        { x: 0, y: 0, width: 64, height: 64 },
        { x: 64, y: 0, width: 64, height: 64 },
      ],
      move: [
        { x: 0, y: 64, width: 64, height: 64 },
        { x: 64, y: 64, width: 64, height: 64 },
        { x: 128, y: 64, width: 64, height: 64 },
        { x: 192, y: 64, width: 64, height: 64 },
      ],
      attack: [
        { x: 0, y: 128, width: 64, height: 64 },
        { x: 64, y: 128, width: 64, height: 64 },
        { x: 128, y: 128, width: 64, height: 64 },
      ],
      hit: [
        { x: 0, y: 192, width: 64, height: 64 },
        { x: 64, y: 192, width: 64, height: 64 },
      ],
      death: [
        { x: 0, y: 256, width: 64, height: 64 },
        { x: 64, y: 256, width: 64, height: 64 },
        { x: 128, y: 256, width: 64, height: 64 },
        { x: 192, y: 256, width: 64, height: 64 },
      ],
    },
  };
}

describe("animation", () => {
  describe("updateAnimation", () => {
    it("increments animation timer", () => {
      const entity = createEntity();
      updateAnimation(entity, 0.1);
      expect(entity.animationTimer).toBe(0.1);
    });

    it("transitions to forced state", () => {
      const entity = createEntity({ animation: "idle" });
      updateAnimation(entity, 0.1, createSheet(), "move");
      expect(entity.animation).toBe("move");
      expect(entity.animationTimer).toBe(0);
    });

    it("does not reset timer when forced state is current", () => {
      const entity = createEntity({ animation: "move", animationTimer: 0.2 });
      updateAnimation(entity, 0.1, createSheet(), "move");
      expect(entity.animationTimer).toBeCloseTo(0.3, 5);
    });

    it("loops non-death animations", () => {
      const entity = createEntity({ animation: "idle", animationTimer: 10 });
      updateAnimation(entity, 0.1, createSheet());
      expect(entity.animation).toBe("idle");
      expect(entity.animationTimer).toBeLessThan(10);
    });

    it("freezes death animation at end", () => {
      const entity = createEntity({ animation: "death", animationTimer: 10 });
      updateAnimation(entity, 0.1, createSheet());
      expect(entity.animation).toBe("death");
      expect(entity.animationTimer).toBeLessThan(10);
    });
  });

  describe("getCurrentFrameIndex", () => {
    it("returns 0 at start", () => {
      const entity = createEntity({ animation: "move" });
      const sheet = createSheet();
      expect(getCurrentFrameIndex(entity, sheet)).toBe(0);
    });

    it("advances frames based on fps", () => {
      const entity = createEntity({ animation: "move", animationTimer: 0.25 });
      const sheet = createSheet();
      expect(getCurrentFrameIndex(entity, sheet)).toBe(2);
    });

    it("caps at last frame", () => {
      const entity = createEntity({ animation: "move", animationTimer: 10 });
      const sheet = createSheet();
      expect(getCurrentFrameIndex(entity, sheet)).toBe(3);
    });

    it("returns 0 for empty animation", () => {
      const entity = createEntity({ animation: "idle" });
      const sheet = { ...createSheet(), animations: { ...createSheet().animations, idle: [] } };
      expect(getCurrentFrameIndex(entity, sheet)).toBe(0);
    });
  });

  describe("transitionAnimation", () => {
    it("changes animation state", () => {
      const entity = createEntity({ animation: "idle" });
      transitionAnimation(entity, "attack");
      expect(entity.animation).toBe("attack");
      expect(entity.animationTimer).toBe(0);
    });

    it("does not change when already in state", () => {
      const entity = createEntity({ animation: "idle", animationTimer: 0.5 });
      transitionAnimation(entity, "idle");
      expect(entity.animationTimer).toBe(0.5);
    });

    it("resets timer when reset option is set", () => {
      const entity = createEntity({ animation: "idle", animationTimer: 0.5 });
      transitionAnimation(entity, "idle", { reset: true });
      expect(entity.animationTimer).toBe(0);
    });
  });

  describe("isAnimationFinished", () => {
    it("returns false for non-death animation", () => {
      const entity = createEntity({ animation: "move", animationTimer: 10 });
      const sheet = createSheet();
      expect(isAnimationFinished(entity, sheet)).toBe(false);
    });

    it("returns false when death animation not finished", () => {
      const entity = createEntity({ animation: "death", animationTimer: 0.1 });
      const sheet = createSheet();
      expect(isAnimationFinished(entity, sheet)).toBe(false);
    });

    it("returns true when death animation finished", () => {
      const entity = createEntity({ animation: "death", animationTimer: 1 });
      const sheet = createSheet();
      expect(isAnimationFinished(entity, sheet)).toBe(true);
    });
  });

  describe("setFacing", () => {
    it("sets facing toward target", () => {
      const entity = createEntity({ x: 0, y: 0 });
      setFacing(entity, 10, 0);
      expect(entity.facing).toBe(0);
    });

    it("sets facing downward", () => {
      const entity = createEntity({ x: 0, y: 0 });
      setFacing(entity, 0, 10);
      expect(entity.facing).toBeCloseTo(Math.PI / 2);
    });

    it("does not change facing when target is same position", () => {
      const entity = createEntity({ x: 5, y: 5, facing: 1 });
      setFacing(entity, 5, 5);
      expect(entity.facing).toBe(1);
    });
  });
});
