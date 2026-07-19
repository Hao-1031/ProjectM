import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GSAPCounter from "./GSAPCounter";

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

describe("GSAPCounter", () => {
  it("displays formatted value", () => {
    render(<GSAPCounter value={1234} />);
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("renders prefix and suffix", () => {
    render(<GSAPCounter value={99} prefix="+" suffix="%" />);
    expect(screen.getByText("+99%")).toBeInTheDocument();
  });

  it("formats decimals", () => {
    render(<GSAPCounter value={12.5} decimals={2} />);
    expect(screen.getByText("12.50")).toBeInTheDocument();
  });
});
