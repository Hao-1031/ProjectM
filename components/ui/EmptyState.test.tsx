import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EmptyState from "./EmptyState";

describe("EmptyState", () => {
  it("renders default title and description", () => {
    render(<EmptyState />);
    expect(screen.getByText("暂无数据")).toBeInTheDocument();
    expect(screen.getByText("当前列表为空，稍后再来看看。")).toBeInTheDocument();
  });

  it("renders custom title and description", () => {
    render(<EmptyState title="没有结果" description="尝试更换筛选条件。" />);
    expect(screen.getByText("没有结果")).toBeInTheDocument();
    expect(screen.getByText("尝试更换筛选条件。")).toBeInTheDocument();
  });

  it("renders action", () => {
    render(<EmptyState action={<button>刷新</button>} />);
    expect(screen.getByRole("button", { name: "刷新" })).toBeInTheDocument();
  });

  it("has status role", () => {
    render(<EmptyState />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
