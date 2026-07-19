import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NotificationToast, { type GameNotification } from "./NotificationToast";

describe("NotificationToast", () => {
  it("renders notifications", () => {
    const notifications: GameNotification[] = [
      { id: "1", title: "波次完成", message: "补给窗口已开启", variant: "success" },
      { id: "2", title: "核心受损", variant: "danger" },
    ];

    render(<NotificationToast notifications={notifications} onDismiss={vi.fn()} />);

    expect(screen.getByText("波次完成")).toBeInTheDocument();
    expect(screen.getByText("补给窗口已开启")).toBeInTheDocument();
    expect(screen.getByText("核心受损")).toBeInTheDocument();
  });

  it("calls onDismiss when close button clicked", () => {
    const onDismiss = vi.fn();
    const notifications: GameNotification[] = [{ id: "1", title: "测试通知", variant: "info" }];

    render(<NotificationToast notifications={notifications} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByLabelText("关闭通知"));
    expect(onDismiss).toHaveBeenCalledWith("1");
  });

  it("limits visible notifications", () => {
    const notifications: GameNotification[] = Array.from({ length: 6 }, (_, i) => ({
      id: `n${i}`,
      title: `通知 ${i}`,
      variant: "info" as const,
    }));

    render(<NotificationToast notifications={notifications} onDismiss={vi.fn()} maxVisible={3} />);

    expect(screen.getByText("还有 3 条通知")).toBeInTheDocument();
  });

  it("renders empty when no notifications", () => {
    const { container } = render(<NotificationToast notifications={[]} onDismiss={vi.fn()} />);

    expect(container.firstChild?.childNodes.length).toBe(0);
  });

  it("supports custom icons", () => {
    const notifications: GameNotification[] = [
      { id: "1", title: "获得资源", icon: "credit", variant: "success" },
      { id: "2", title: "击杀精英", icon: "kill", variant: "info" },
    ];

    render(<NotificationToast notifications={notifications} onDismiss={vi.fn()} />);

    expect(screen.getByText("获得资源")).toBeInTheDocument();
    expect(screen.getByText("击杀精英")).toBeInTheDocument();
  });
});
