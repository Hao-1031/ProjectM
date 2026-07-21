import { describe, it, expect } from "vitest";
import {
  DEFAULT_DEFENSE_MAP_ID,
  getMapById,
  getMapName,
  getMapDescription,
  listMapIds,
} from "./maps";

describe("map registry", () => {
  it("lists available maps", () => {
    const ids = listMapIds();
    expect(ids).toContain("industrial-ruins");
    expect(ids).toContain("abandoned-refinery");
  });

  it("returns a valid map config by id", () => {
    const map = getMapById("abandoned-refinery");
    expect(map.width).toBeGreaterThan(0);
    expect(map.height).toBeGreaterThan(0);
    expect(map.theme).toBe("wasteland");
    expect(map.obstacles.length).toBeGreaterThan(0);
    expect(map.hazards.length).toBeGreaterThan(0);
  });

  it("provides names and descriptions", () => {
    expect(getMapName("abandoned-refinery")).toBe("废弃精炼厂");
    expect(getMapDescription("abandoned-refinery").length).toBeGreaterThan(0);
  });

  it("has a sensible default map", () => {
    const map = getMapById(DEFAULT_DEFENSE_MAP_ID);
    expect(map.theme).toBe("industrial");
  });

  it("throws on unknown map id", () => {
    expect(() => getMapById("unknown" as never)).toThrow();
  });
});
