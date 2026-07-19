import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "./Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>确认</Button>);
    expect(screen.getByRole("button", { name: "确认" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>点击</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>禁用</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows loading state and disables button", () => {
    render(<Button loading>加载中</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders left and right icons", () => {
    render(
      <Button
        leftIcon={<span data-testid="left">L</span>}
        rightIcon={<span data-testid="right">R</span>}
      >
        内容
      </Button>
    );
    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    const { container } = render(<Button variant="danger">危险</Button>);
    expect(container.querySelector("button")).toHaveClass("bg-danger");
  });
});
