import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WelcomeOverlay from "./WelcomeOverlay";

describe("WelcomeOverlay", () => {
  it("renders welcome content when open", () => {
    render(<WelcomeOverlay open onComplete={vi.fn()} />);

    expect(screen.getByText(/欢迎来到，/i)).toBeInTheDocument();
    expect(screen.getByText(/Project-M/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /进入指挥终端/i })).toBeInTheDocument();
  });

  it("calls onComplete when primary button clicked", () => {
    const onComplete = vi.fn();
    render(<WelcomeOverlay open onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: /进入指挥终端/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("calls onComplete when skip text clicked", () => {
    const onComplete = vi.fn();
    render(<WelcomeOverlay open onComplete={onComplete} />);

    fireEvent.click(screen.getByText(/按任意键跳过/i));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("auto-advances after delay", async () => {
    const onComplete = vi.fn();
    render(<WelcomeOverlay open onComplete={onComplete} autoAdvanceDelay={50} />);

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), { timeout: 1000 });
  });

  it("displays loading skeleton when loading", () => {
    render(<WelcomeOverlay open onComplete={vi.fn()} loading />);

    expect(screen.getByText(/正在同步作战数据/i)).toBeInTheDocument();
    expect(screen.queryByText(/欢迎来到，/i)).not.toBeInTheDocument();
  });

  it("displays error state when error is provided", () => {
    render(<WelcomeOverlay open onComplete={vi.fn()} error="连接超时，请重试。" />);

    expect(screen.getByText(/连接异常/i)).toBeInTheDocument();
    expect(screen.getByText(/连接超时，请重试。/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /跳过并继续/i })).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<WelcomeOverlay open={false} onComplete={vi.fn()} />);

    expect(screen.queryByText(/欢迎来到，/i)).not.toBeInTheDocument();
  });

  it("renders personalized message with player name", () => {
    render(<WelcomeOverlay open onComplete={vi.fn()} playerName="Echo-7" />);

    expect(screen.getByText(/Echo-7，据点防线已部署完毕/i)).toBeInTheDocument();
  });
});
