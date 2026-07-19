import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ModesPage from "./modes";

vi.mock("@/components/Layout", () => ({
  default: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="layout" data-title={title}>
      {children}
    </div>
  ),
}));

describe("ModesPage", () => {
  it("renders mode selection title", () => {
    render(<ModesPage />);
    expect(screen.getByText("作战模式")).toBeInTheDocument();
    expect(screen.getByText("选择你的战场")).toBeInTheDocument();
  });

  it("lists active game modes", () => {
    render(<ModesPage />);
    expect(screen.getByText("战役模式")).toBeInTheDocument();
    expect(screen.getByText("无尽生存")).toBeInTheDocument();
    expect(screen.getByText("据点防守")).toBeInTheDocument();
    expect(screen.queryByText("每日挑战")).not.toBeInTheDocument();
    expect(screen.queryByText("冒险模式")).not.toBeInTheDocument();
  });

  it("highlights defense mode as featured", () => {
    render(<ModesPage />);
    expect(screen.getByText("主打")).toBeInTheDocument();
  });
});
