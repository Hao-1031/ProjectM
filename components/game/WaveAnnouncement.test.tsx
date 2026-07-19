import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import WaveAnnouncement from "./WaveAnnouncement";

describe("WaveAnnouncement", () => {
  it("renders incoming phase", () => {
    render(
      <WaveAnnouncement wave={3} totalWaves={8} phase="incoming" visible onComplete={vi.fn()} />
    );

    expect(screen.getByText("WAVE 03 / 08")).toBeInTheDocument();
    expect(screen.getByText("敌潮逼近")).toBeInTheDocument();
    expect(screen.getByText("准备接敌")).toBeInTheDocument();
  });

  it("renders boss phase with boss name", () => {
    render(
      <WaveAnnouncement
        wave={8}
        totalWaves={8}
        phase="boss"
        bossName="巨像"
        visible
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText("巨像")).toBeInTheDocument();
    expect(screen.getByText("首领出现")).toBeInTheDocument();
  });

  it("renders active phase with enemy count", () => {
    render(
      <WaveAnnouncement wave={2} phase="active" enemyCount={7} visible onComplete={vi.fn()} />
    );

    expect(screen.getByText("波次进行中")).toBeInTheDocument();
    expect(screen.getByText("肃清威胁")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders cleared phase", () => {
    render(<WaveAnnouncement wave={2} phase="cleared" visible onComplete={vi.fn()} />);

    expect(screen.getByText("区域安全")).toBeInTheDocument();
    expect(screen.getByText("补给窗口开启")).toBeInTheDocument();
  });

  it("returns null when not visible", () => {
    const { container } = render(
      <WaveAnnouncement wave={1} phase="incoming" visible={false} onComplete={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });
});
