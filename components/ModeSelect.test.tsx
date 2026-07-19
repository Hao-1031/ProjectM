import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ModeSelect from "./ModeSelect";
import { getModeList } from "@/lib/game/modes";

describe("ModeSelect", () => {
  const modes = getModeList();

  it("renders mode cards", () => {
    render(<ModeSelect modes={modes} onSelect={vi.fn()} />);
    for (const mode of modes) {
      expect(screen.getByText(mode.name)).toBeInTheDocument();
      expect(screen.getByText(mode.description)).toBeInTheDocument();
    }
  });

  it("calls onSelect with the clicked mode", () => {
    const onSelect = vi.fn();
    render(<ModeSelect modes={modes} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("据点防守"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("defense");
  });

  it("highlights defense mode when selected", () => {
    render(<ModeSelect modes={modes} selected="defense" onSelect={vi.fn()} />);
    const defenseCard = screen.getByTestId("mode-card-defense");
    expect(defenseCard).toHaveClass("border-primary");
    expect(defenseCard).toHaveClass("bg-primary/10");
  });

  it("does not highlight unselected modes", () => {
    render(<ModeSelect modes={modes} selected="defense" onSelect={vi.fn()} />);
    const campaignCard = screen.getByTestId("mode-card-campaign");
    expect(campaignCard).not.toHaveClass("border-primary");
  });
});
