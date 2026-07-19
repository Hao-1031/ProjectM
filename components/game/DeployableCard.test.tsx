import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DeployableCard from "./DeployableCard";
import type { Deployable } from "@/lib/game/types";

function makeDeployable(type: Deployable["type"]): Deployable {
  return {
    id: "d1",
    x: 0,
    y: 0,
    radius: 10,
    type,
    ownerId: "p1",
    health: 60,
    maxHealth: 100,
    timer: 8,
    maxTimer: 20,
    color: "#fff",
  };
}

describe("DeployableCard", () => {
  it("renders turret deployable", () => {
    render(<DeployableCard deployable={makeDeployable("turret")} />);
    expect(screen.getByText("自动炮塔")).toBeInTheDocument();
    expect(screen.getByText("耐久")).toBeInTheDocument();
    expect(screen.getByText("剩余时间")).toBeInTheDocument();
  });

  it("renders shield deployable", () => {
    render(<DeployableCard deployable={makeDeployable("shield")} />);
    expect(screen.getByText("护盾塔")).toBeInTheDocument();
  });

  it("renders mine deployable", () => {
    render(<DeployableCard deployable={makeDeployable("mine")} />);
    expect(screen.getByText("地雷")).toBeInTheDocument();
  });
});
