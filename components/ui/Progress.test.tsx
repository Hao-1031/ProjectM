import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Progress from "./Progress";

describe("Progress", () => {
  it("renders progressbar role", () => {
    render(<Progress value={50} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("displays label and percentage", () => {
    render(<Progress value={75} label="加载进度" showValue />);
    expect(screen.getByText("加载进度")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("clamps value between 0 and 100", () => {
    render(<Progress value={150} showValue />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("applies variant class", () => {
    render(<Progress value={40} variant="danger" />);
    expect(screen.getByRole("progressbar").querySelector("div > div")).toHaveClass("bg-danger");
  });

  it("sets aria values correctly", () => {
    render(<Progress value={30} max={60} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "30");
    expect(bar).toHaveAttribute("aria-valuemax", "60");
  });
});
