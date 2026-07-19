import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GSAPTextReveal from "./GSAPTextReveal";

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

describe("GSAPTextReveal", () => {
  it("renders text split into words", () => {
    render(<GSAPTextReveal>Hello world</GSAPTextReveal>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("world")).toBeInTheDocument();
  });

  it("uses aria-label with full text", () => {
    render(<GSAPTextReveal>Accessible text</GSAPTextReveal>);
    expect(screen.getByLabelText("Accessible text")).toBeInTheDocument();
  });

  it("renders custom heading element", () => {
    render(<GSAPTextReveal as="h2">Heading</GSAPTextReveal>);
    expect(screen.getByRole("heading", { name: "Heading" })).toBeInTheDocument();
  });
});
