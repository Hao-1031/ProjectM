import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GSAPParallax from "./GSAPParallax";

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

describe("GSAPParallax", () => {
  it("renders children", () => {
    render(
      <GSAPParallax speed={0.3}>
        <div data-testid="parallax-child">Layer</div>
      </GSAPParallax>
    );
    expect(screen.getByTestId("parallax-child")).toBeInTheDocument();
  });

  it("uses custom element via as prop", () => {
    render(
      <GSAPParallax as="section">
        <span>Content</span>
      </GSAPParallax>
    );
    expect(screen.getByText("Content").closest("section")).toBeInTheDocument();
  });
});
