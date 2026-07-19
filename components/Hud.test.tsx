import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Hud from "./Hud";
import { GameEngine } from "@/lib/game/engine";

describe("Hud", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderHud(state = new GameEngine().state, paused = false) {
    return render(
      <Hud state={state} paused={paused} onPauseToggle={vi.fn()} extractionTimer={0} />
    );
  }

  it("renders HUD with state", () => {
    const state = new GameEngine().state;
    renderHud(state);
    expect(screen.getByText("生命")).toBeInTheDocument();
    expect(screen.getByText("击杀")).toBeInTheDocument();
    expect(screen.getAllByText(state.stats.kills.toString()).length).toBeGreaterThan(0);
    expect(screen.getByText("暂停")).toBeInTheDocument();
  });

  it("shows paused state", () => {
    const state = new GameEngine().state;
    renderHud(state, true);
    expect(screen.getByText("继续")).toBeInTheDocument();
  });

  it("shows defense stats in defense mode", () => {
    const engine = new GameEngine({}, "defense", 12345);
    engine.resize(800, 600);
    engine.start();
    renderHud(engine.state);
    expect(screen.getByText(/核心/)).toBeInTheDocument();
    expect(screen.getByText("能量")).toBeInTheDocument();
    expect(screen.getAllByText("波次").length).toBeGreaterThan(0);
  });

  it("health bar reflects player health", () => {
    const state = new GameEngine().state;
    state.player.health = 50;
    state.player.maxHealth = 100;
    const { container } = renderHud(state);
    const healthBar = container.querySelector(".bg-danger");
    expect(healthBar).toBeInTheDocument();
    expect(healthBar).toHaveStyle({ width: "50%" });
  });
});
