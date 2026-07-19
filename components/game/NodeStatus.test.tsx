import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NodeStatus from "./NodeStatus";

describe("NodeStatus", () => {
  it("shows captured state", () => {
    render(
      <NodeStatus captured active={false} captureProgress={3} captureTime={3} energyValue={50} />
    );
    expect(screen.getByText("能量节点")).toBeInTheDocument();
    expect(screen.getByText("已占领 - 能量产出中")).toBeInTheDocument();
  });

  it("shows capturing progress", () => {
    render(
      <NodeStatus captured={false} active captureProgress={1.5} captureTime={3} energyValue={30} />
    );
    expect(screen.getByText("占领中 50%")).toBeInTheDocument();
  });

  it("shows inactive state", () => {
    render(
      <NodeStatus
        captured={false}
        active={false}
        captureProgress={0}
        captureTime={3}
        energyValue={30}
      />
    );
    expect(screen.getByText("未激活")).toBeInTheDocument();
  });
});
