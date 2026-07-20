import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HeroSelect from "./HeroSelect";
import { HERO_DEFS } from "@/lib/game/heroes";

describe("HeroSelect", () => {
  const heroes = Object.values(HERO_DEFS);

  it("renders hero cards", () => {
    render(<HeroSelect heroes={heroes} onSelect={vi.fn()} />);
    for (const hero of heroes) {
      expect(screen.getByText(hero.name)).toBeInTheDocument();
      expect(screen.getByText(hero.description)).toBeInTheDocument();
    }
  });

  it("calls onSelect with the clicked hero id", () => {
    const onSelect = vi.fn();
    render(<HeroSelect heroes={heroes} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("液氮"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("nitrogen");
  });

  it("highlights selected hero", () => {
    render(<HeroSelect heroes={heroes} selected="twilight" onSelect={vi.fn()} />);
    const twilightCard = screen.getByTestId("hero-card-twilight");
    expect(twilightCard).toHaveClass("border-primary");
  });

  it("does not highlight unselected heroes", () => {
    render(<HeroSelect heroes={heroes} selected="twilight" onSelect={vi.fn()} />);
    const reconCard = screen.getByTestId("hero-card-recon");
    expect(reconCard).not.toHaveClass("border-primary");
  });
});
