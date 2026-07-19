import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sheet from "./Sheet";

describe("Sheet", () => {
  it("renders when open", () => {
    render(
      <Sheet open title="侧边栏" onClose={vi.fn()}>
        内容
      </Sheet>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("侧边栏")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <Sheet open={false} title="侧边栏" onClose={vi.fn()}>
        内容
      </Sheet>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(
      <Sheet open title="侧边栏" onClose={onClose}>
        内容
      </Sheet>
    );
    fireEvent.click(screen.getByLabelText("关闭"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders description when provided", () => {
    render(
      <Sheet open title="标题" description="描述文字" onClose={vi.fn()}>
        内容
      </Sheet>
    );
    expect(screen.getByText("描述文字")).toBeInTheDocument();
  });
});
