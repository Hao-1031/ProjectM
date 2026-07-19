import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GSAPStagger from "./GSAPStagger";

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

describe("GSAPStagger", () => {
  it("renders and wraps children with stagger item class", () => {
    render(
      <GSAPStagger>
        <div data-testid="item-1">One</div>
        <div data-testid="item-2">Two</div>
      </GSAPStagger>
    );
    expect(screen.getByTestId("item-1")).toBeInTheDocument();
    expect(screen.getByTestId("item-2")).toBeInTheDocument();
  });

  it("supports list rendering via childAs", () => {
    render(
      <GSAPStagger as="ul" childAs="li">
        <span>One</span>
        <span>Two</span>
      </GSAPStagger>
    );
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBe(2);
  });
});
