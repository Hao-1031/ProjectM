import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";

describe("Tabs", () => {
  function renderTabs() {
    return render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">标签 A</TabsTrigger>
          <TabsTrigger value="b">标签 B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">内容 A</TabsContent>
        <TabsContent value="b">内容 B</TabsContent>
      </Tabs>
    );
  }

  it("renders tab triggers", () => {
    renderTabs();
    expect(screen.getByRole("tab", { name: "标签 A" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "标签 B" })).toBeInTheDocument();
  });

  it("shows default tab content", () => {
    renderTabs();
    expect(screen.getByText("内容 A")).toBeInTheDocument();
    expect(screen.queryByText("内容 B")).not.toBeInTheDocument();
  });

  it("switches tab content on click", () => {
    renderTabs();
    fireEvent.click(screen.getByRole("tab", { name: "标签 B" }));
    expect(screen.getByText("内容 B")).toBeInTheDocument();
    expect(screen.queryByText("内容 A")).not.toBeInTheDocument();
  });

  it("calls onValueChange when controlled", () => {
    const onValueChange = vi.fn();
    render(
      <Tabs value="a" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
      </Tabs>
    );
    fireEvent.click(screen.getByRole("tab", { name: "B" }));
    expect(onValueChange).toHaveBeenCalledWith("b");
  });
});
