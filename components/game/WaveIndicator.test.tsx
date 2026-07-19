import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import WaveIndicator from "./WaveIndicator";

describe("WaveIndicator", () => {
  it("renders wave info", () => {
    render(<WaveIndicator currentWave={2} totalWaves={5} enemiesRemaining={12} />);
    expect(screen.getByText("波次")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("/ 5")).toBeInTheDocument();
    expect(screen.getByText("剩余敌人")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("shows wave timer when provided", () => {
    render(<WaveIndicator currentWave={0} totalWaves={3} enemiesRemaining={5} waveTimer={4.5} />);
    expect(screen.getByText("下一波")).toBeInTheDocument();
    expect(screen.getByText("4.5s")).toBeInTheDocument();
  });

  it("marks final wave", () => {
    render(<WaveIndicator currentWave={4} totalWaves={5} enemiesRemaining={1} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
