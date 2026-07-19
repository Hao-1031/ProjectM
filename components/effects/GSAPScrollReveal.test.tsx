import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GSAPScrollReveal from "./GSAPScrollReveal";

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

describe("GSAPScrollReveal", () => {
  it("renders children", () => {
    render(
      <GSAPScrollReveal>
        <div data-testid="child">Revealed content</div>
      </GSAPScrollReveal>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Revealed content")).toBeInTheDocument();
  });

  it("accepts custom element via as prop", () => {
    render(
      <GSAPScrollReveal as="section">
        <span>Content</span>
      </GSAPScrollReveal>
    );
    expect(screen.getByText("Content").closest("section")).toBeInTheDocument();
  });
});
