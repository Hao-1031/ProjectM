import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Hud from "./Hud";
import { GameEngine } from "@/lib/game/engine";

describe("Hud", () => {
  vi.clearAllMocks();

  function renderHud(state = new GameEngine().state, paused = false) {
    return render(
      <Hud state={state} paused={paused} onPauseToggle={vi.fn()} extractionTimer={0} />
    );
  }

  it("renders HUD with state", () => {
    const state = new GameEngine().state;
    renderHud(state);
    expect(screen.getByText(Math.ceil(state.player.health).toString())).toBeInTheDocument();
    expect(screen.getByText(state.stats.kills.toString())).toBeInTheDocument();
    expect(screen.getByLabelText("暂停")).toBeInTheDocument();
  });

  it("shows paused state", () => {
    const state = new GameEngine().state;
    renderHud(state, true);
    expect(screen.getByLabelText("继续")).toBeInTheDocument();
  });

  it("shows defense stats in defense mode", () => {
    const engine = new GameEngine({}, "defense", 12345);
    engine.resize(800, 600);
    engine.start();
    engine.state.defenseState!.energy = 42;
    renderHud(engine.state);
    expect(screen.getByText("波次")).toBeInTheDocument();
    expect(screen.getByText(/剩余敌人/)).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("health value reflects player health", () => {
    const state = new GameEngine().state;
    state.player.health = 50;
    state.player.maxHealth = 100;
    renderHud(state);
    expect(screen.getByText("50")).toBeInTheDocument();
  });
});
