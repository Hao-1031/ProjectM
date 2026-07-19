import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CoreHealthBar from "./CoreHealthBar";

describe("CoreHealthBar", () => {
  it("renders health and label", () => {
    render(<CoreHealthBar health={75} maxHealth={100} />);
    expect(screen.getByText("核心耐久")).toBeInTheDocument();
    expect(screen.getByText("75 / 100")).toBeInTheDocument();
  });

  it("renders custom label", () => {
    render(<CoreHealthBar health={50} maxHealth={100} label="基地护盾" />);
    expect(screen.getByText("基地护盾")).toBeInTheDocument();
  });

  it("clamps health display", () => {
    render(<CoreHealthBar health={150} maxHealth={100} />);
    expect(screen.getByText("150 / 100")).toBeInTheDocument();
  });
});
