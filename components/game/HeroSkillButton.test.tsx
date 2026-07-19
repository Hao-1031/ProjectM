import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HeroSkillButton from "./HeroSkillButton";

describe("HeroSkillButton", () => {
  it("renders ready skill", () => {
    render(<HeroSkillButton name="闪电突袭" cooldown={10} remaining={0} />);
    expect(screen.getByLabelText("闪电突袭 已就绪")).toBeInTheDocument();
  });

  it("renders cooldown skill", () => {
    render(<HeroSkillButton name="闪电突袭" cooldown={10} remaining={4.5} />);
    expect(screen.getByLabelText("闪电突袭 冷却中 4.5 秒")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("calls onClick when ready", () => {
    const onClick = vi.fn();
    render(<HeroSkillButton name="闪电突袭" cooldown={10} remaining={0} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled during cooldown", () => {
    render(<HeroSkillButton name="闪电突袭" cooldown={10} remaining={5} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
