import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Skeleton from "./Skeleton";

describe("Skeleton", () => {
  it("renders a skeleton element", () => {
    render(<Skeleton />);
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  it("renders multiple skeletons when count is provided", () => {
    render(<Skeleton count={3} />);
    expect(screen.getAllByTestId("skeleton")).toHaveLength(3);
  });

  it("renders circle variant", () => {
    const { container } = render(<Skeleton circle />);
    expect(container.querySelector("[data-testid='skeleton']")).toHaveClass("rounded-full");
  });

  it("applies width and height styles", () => {
    render(<Skeleton width={100} height={20} />);
    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveStyle({ width: "100px", height: "20px" });
  });
});
