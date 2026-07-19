import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BossHealthBar from "./BossHealthBar";

describe("BossHealthBar", () => {
  it("renders boss name and phase", () => {
    render(
      <BossHealthBar
        name="泰坦巨兽"
        health={2500}
        maxHealth={5000}
        phase={1}
        phaseThresholds={[0.66, 0.33]}
      />
    );
    expect(screen.getByText("泰坦巨兽")).toBeInTheDocument();
    expect(screen.getByText("阶段 2 / 3")).toBeInTheDocument();
    expect(screen.getByText("2500 / 5000")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("marks final phase", () => {
    render(
      <BossHealthBar
        name="泰坦巨兽"
        health={500}
        maxHealth={5000}
        phase={2}
        phaseThresholds={[0.66, 0.33]}
      />
    );
    expect(screen.getByText("阶段 3 / 3")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
  });
});
