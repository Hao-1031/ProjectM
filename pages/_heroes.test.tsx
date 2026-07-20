import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HeroesPage from "./heroes";

vi.mock("@/components/Layout", () => ({
  default: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="layout" data-title={title}>
      {children}
    </div>
  ),
}));

describe("HeroesPage", () => {
  it("renders hero archive title", () => {
    render(<HeroesPage />);
    expect(screen.getByText("英雄档案")).toBeInTheDocument();
    expect(screen.getByText("据点防守作战单位")).toBeInTheDocument();
  });

  it("displays all four heroes", () => {
    render(<HeroesPage />);
    expect(screen.getByText("液氮")).toBeInTheDocument();
    expect(screen.getByText("暮蝶")).toBeInTheDocument();
    expect(screen.getByText("豹")).toBeInTheDocument();
    expect(screen.getByText("侦查")).toBeInTheDocument();
  });

  it("shows hero skills and talents", () => {
    render(<HeroesPage />);
    expect(screen.getByText("冰冻手雷")).toBeInTheDocument();
    expect(screen.getByText("治疗脉冲")).toBeInTheDocument();
    expect(screen.getByText("猛扑")).toBeInTheDocument();
    expect(screen.getByText("侦察无人机")).toBeInTheDocument();
    expect(screen.getAllByText("天赋树").length).toBeGreaterThanOrEqual(1);
  });
});
