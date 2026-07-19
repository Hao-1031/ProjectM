import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GSAPCardStack from "./GSAPCardStack";

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

const cards = [
  {
    id: "c1",
    title: "Card One",
    description: "First stacked card.",
    meta: "Phase 01",
    color: "primary" as const,
  },
  {
    id: "c2",
    title: "Card Two",
    description: "Second stacked card.",
    meta: "Phase 02",
    color: "accent" as const,
  },
  {
    id: "c3",
    title: "Card Three",
    description: "Third stacked card.",
    meta: "Phase 03",
    color: "danger" as const,
  },
];

describe("GSAPCardStack", () => {
  it("renders all cards", () => {
    render(<GSAPCardStack cards={cards} />);
    expect(screen.getByText("Card One")).toBeInTheDocument();
    expect(screen.getByText("Card Two")).toBeInTheDocument();
    expect(screen.getByText("Card Three")).toBeInTheDocument();
  });

  it("renders meta labels", () => {
    render(<GSAPCardStack cards={cards} />);
    expect(screen.getByText("Phase 01")).toBeInTheDocument();
    expect(screen.getByText("Phase 02")).toBeInTheDocument();
    expect(screen.getByText("Phase 03")).toBeInTheDocument();
  });
});
