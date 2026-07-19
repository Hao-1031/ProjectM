import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TalentTree, { type Talent } from "./TalentTree";

const baseTalents: Talent[] = [
  {
    id: "t1",
    name: "伤害增幅",
    description: "提升武器伤害",
    category: "offense",
    maxRank: 3,
    currentRank: 0,
  },
  {
    id: "t2",
    name: "穿甲弹",
    description: "无视部分护甲",
    category: "offense",
    maxRank: 2,
    currentRank: 0,
    requires: ["t1"],
  },
  {
    id: "t3",
    name: "护盾强化",
    description: "提升护盾容量",
    category: "defense",
    maxRank: 3,
    currentRank: 1,
  },
  {
    id: "t4",
    name: "移动加速",
    description: "提升移动速度",
    category: "utility",
    maxRank: 2,
    currentRank: 2,
  },
];

describe("TalentTree", () => {
  it("renders hero name and available points", () => {
    render(
      <TalentTree heroName="突击兵" talents={baseTalents} availablePoints={5} onUpgrade={vi.fn()} />
    );

    expect(screen.getByText("突击兵 天赋")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("可用点数")).toBeInTheDocument();
  });

  it("calls onUpgrade when unlockable talent clicked", () => {
    const onUpgrade = vi.fn();
    render(
      <TalentTree
        heroName="突击兵"
        talents={baseTalents}
        availablePoints={3}
        onUpgrade={onUpgrade}
      />
    );

    fireEvent.click(screen.getByLabelText("伤害增幅，当前等级 0/3"));
    expect(onUpgrade).toHaveBeenCalledWith("t1");
  });

  it("does not call onUpgrade for locked talents", () => {
    const onUpgrade = vi.fn();
    render(
      <TalentTree
        heroName="突击兵"
        talents={baseTalents}
        availablePoints={3}
        onUpgrade={onUpgrade}
      />
    );

    fireEvent.click(screen.getByLabelText("穿甲弹，当前等级 0/2"));
    expect(onUpgrade).not.toHaveBeenCalled();
  });

  it("does not call onUpgrade when no points available", () => {
    const onUpgrade = vi.fn();
    render(
      <TalentTree
        heroName="突击兵"
        talents={baseTalents}
        availablePoints={0}
        onUpgrade={onUpgrade}
      />
    );

    fireEvent.click(screen.getByLabelText("伤害增幅，当前等级 0/3"));
    expect(onUpgrade).not.toHaveBeenCalled();
  });

  it("renders read only notice", () => {
    render(
      <TalentTree
        heroName="突击兵"
        talents={baseTalents}
        availablePoints={3}
        onUpgrade={vi.fn()}
        readOnly
      />
    );

    expect(screen.getByText("当前为只读预览，实际点数在波次间隙商店中分配")).toBeInTheDocument();
  });

  it("renders empty branch placeholder", () => {
    render(
      <TalentTree
        heroName="突击兵"
        talents={baseTalents.filter((t) => t.category !== "utility")}
        availablePoints={3}
        onUpgrade={vi.fn()}
      />
    );

    expect(screen.getByText("该分支暂无天赋")).toBeInTheDocument();
  });
});
