import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Dialog from "./Dialog";

describe("Dialog", () => {
  it("renders when open", () => {
    render(
      <Dialog open title="标题" onClose={vi.fn()}>
        对话框内容
      </Dialog>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("标题")).toBeInTheDocument();
    expect(screen.getByText("对话框内容")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <Dialog open={false} title="标题" onClose={vi.fn()}>
        内容
      </Dialog>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(
      <Dialog open title="标题" onClose={onClose}>
        内容
      </Dialog>
    );
    fireEvent.click(screen.getByLabelText("关闭"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("hides close button when hideCloseButton is true", () => {
    render(
      <Dialog open hideCloseButton onClose={vi.fn()}>
        内容
      </Dialog>
    );
    expect(screen.queryByLabelText("关闭")).not.toBeInTheDocument();
  });
});
