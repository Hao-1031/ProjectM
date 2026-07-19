import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Badge from "./Badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>新消息</Badge>);
    expect(screen.getByText("新消息")).toBeInTheDocument();
  });

  it("renders left and right icons", () => {
    render(
      <Badge
        leftIcon={<span data-testid="left">L</span>}
        rightIcon={<span data-testid="right">R</span>}
      >
        标签
      </Badge>
    );
    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
  });

  it("applies variant class", () => {
    const { container } = render(<Badge variant="danger">危险</Badge>);
    expect(container.querySelector("span")).toHaveClass("text-danger");
  });

  it("applies size class", () => {
    const { container } = render(<Badge size="sm">小</Badge>);
    expect(container.querySelector("span")).toHaveClass("text-[10px]");
  });
});
