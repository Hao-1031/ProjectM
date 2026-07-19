import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SettlementScreen, { type SettlementStat } from "./SettlementScreen";

const baseStats: SettlementStat[] = [
  { label: "伤害输出", value: 12400 },
  { label: "承受伤害", value: 3400, suffix: " HP" },
  { label: "资源收集", value: 850 },
];

const baseRewards = [
  { id: "c1", name: "战备积分", amount: 120, type: "credit" as const },
  { id: "t1", name: "天赋点数", amount: 2, type: "token" as const },
];

describe("SettlementScreen", () => {
  it("renders victory state", () => {
    render(
      <SettlementScreen
        result="victory"
        modeName="据点防守 - 废墟"
        durationSeconds={185}
        kills={42}
        waves={5}
        stats={baseStats}
        rewards={baseRewards}
        onRestart={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText("任务完成")).toBeInTheDocument();
    expect(screen.getByText("据点防守 - 废墟")).toBeInTheDocument();
    expect(screen.getByText("03:05")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders defeat state", () => {
    render(
      <SettlementScreen
        result="defeat"
        modeName="据点防守 - 废墟"
        durationSeconds={90}
        kills={12}
        waves={2}
        stats={baseStats}
        rewards={[]}
        onRestart={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText("任务失败")).toBeInTheDocument();
    expect(screen.getByText("重整旗鼓")).toBeInTheDocument();
  });

  it("calls onRestart when primary action clicked", () => {
    const onRestart = vi.fn();
    render(
      <SettlementScreen
        result="victory"
        modeName="据点防守 - 废墟"
        durationSeconds={60}
        kills={10}
        waves={1}
        stats={baseStats}
        rewards={baseRewards}
        onRestart={onRestart}
        onExit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("继续推进"));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it("calls onExit when return home clicked", () => {
    const onExit = vi.fn();
    render(
      <SettlementScreen
        result="defeat"
        modeName="据点防守 - 废墟"
        durationSeconds={60}
        kills={10}
        waves={1}
        stats={baseStats}
        rewards={[]}
        onRestart={vi.fn()}
        onExit={onExit}
      />
    );

    fireEvent.click(screen.getByText("返回主页"));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("shows new record badge", () => {
    render(
      <SettlementScreen
        result="victory"
        modeName="据点防守 - 废墟"
        durationSeconds={60}
        kills={10}
        waves={1}
        stats={baseStats}
        rewards={baseRewards}
        newRecord
        onRestart={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText("新纪录")).toBeInTheDocument();
  });

  it("renders empty reward placeholder", () => {
    render(
      <SettlementScreen
        result="defeat"
        modeName="据点防守 - 废墟"
        durationSeconds={60}
        kills={10}
        waves={1}
        stats={baseStats}
        rewards={[]}
        onRestart={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText("本次没有额外奖励")).toBeInTheDocument();
  });
});
