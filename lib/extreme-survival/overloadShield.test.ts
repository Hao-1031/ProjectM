import { describe, it, expect } from "vitest";
import { createOverloadShield, canTriggerShield, triggerShield } from "./overloadShield";

describe("overload shield", () => {
  it("starts available", () => {
    const shield = createOverloadShield();
    expect(shield.available).toBe(true);
    expect(shield.triggered).toBe(false);
  });

  it("triggers when core health reaches zero", () => {
    const shield = createOverloadShield();
    expect(canTriggerShield(shield, 0, 1000)).toBe(true);

    const result = triggerShield(shield, 1000);
    expect(result.newCoreHealth).toBe(330);
    expect(result.clearRadius).toBeGreaterThan(0);
    expect(result.invincibleSec).toBeGreaterThan(0);
    expect(shield.available).toBe(false);
    expect(shield.triggered).toBe(true);
  });

  it("does not trigger twice", () => {
    const shield = createOverloadShield();
    triggerShield(shield, 1000);
    expect(canTriggerShield(shield, 0, 1000)).toBe(false);
  });
});
