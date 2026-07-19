import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Tooltip from "./Tooltip";

describe("Tooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children", () => {
    render(
      <Tooltip content="提示内容">
        <button>悬停我</button>
      </Tooltip>
    );
    expect(screen.getByRole("button", { name: "悬停我" })).toBeInTheDocument();
  });

  it("shows tooltip on hover after delay", async () => {
    render(
      <Tooltip content="提示内容" delay={0}>
        <button>悬停我</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toHaveTextContent("提示内容");
    });
  });

  it("does not show tooltip when disabled", () => {
    render(
      <Tooltip content="提示内容" disabled>
        <button>悬停我</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByRole("button"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
