import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ArmoryPage from "./armory";

vi.mock("@/components/Layout", () => ({
  default: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="layout" data-title={title}>
      {children}
    </div>
  ),
}));

describe("ArmoryPage", () => {
  it("renders armory title", () => {
    render(<ArmoryPage />);
    expect(screen.getByText("军械库")).toBeInTheDocument();
    expect(screen.getByText("武器与装备")).toBeInTheDocument();
  });

  it("renders starter and advanced weapons", () => {
    render(<ArmoryPage />);
    expect(screen.getByText("脉冲步枪")).toBeInTheDocument();
    expect(screen.getAllByText("升级路线").length).toBeGreaterThanOrEqual(1);
  });

  it("shows weapon loadout suggestions", () => {
    render(<ArmoryPage />);
    expect(screen.getByText("武器搭配建议")).toBeInTheDocument();
    expect(screen.getByText("近战 + 控制")).toBeInTheDocument();
  });
});
