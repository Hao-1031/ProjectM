import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoadoutModal from "./LoadoutModal";
import { saveSave } from "@/lib/game/save";

function createSaveWithSkin() {
  saveSave({
    version: 5,
    bestRun: null,
    totalKills: 0,
    totalRuns: 0,
    coins: 1000,
    unlockedWeapons: ["pulse"],
    equippedWeapons: ["pulse"],
    selectedHero: "recon",
    unlockedHeroes: ["recon", "nitrogen"],
    ownedSkins: ["skin-wasteland", "skin-nitrogen-deep-freeze"],
    equippedSkin: null,
    ownedEmotes: [],
    ownedBadges: [],
    runHistory: [],
    settings: {
      audioEnabled: true,
      volume: 0.8,
      vibrationEnabled: true,
      reducedMotion: true,
    },
  });
}

describe("LoadoutModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders hero selection and default appearance", () => {
    createSaveWithSkin();
    render(
      <LoadoutModal
        mode="defense"
        initialHero="recon"
        initialWeapons={["pulse"]}
        onConfirm={() => {}}
      />
    );

    expect(screen.getByText("选择干员与装备")).toBeInTheDocument();
    expect(screen.getByText("默认外观")).toBeInTheDocument();
    expect(screen.getByText("废土行者")).toBeInTheDocument();
  });

  it("only shows skins usable by the selected hero", () => {
    createSaveWithSkin();
    render(
      <LoadoutModal
        mode="defense"
        initialHero="recon"
        initialWeapons={["pulse"]}
        onConfirm={() => {}}
      />
    );

    expect(screen.getByText("废土行者")).toBeInTheDocument();
    expect(screen.queryByText("深寒")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("液氮"));
    expect(screen.getByText("深寒")).toBeInTheDocument();
  });

  it("equips selected skin on confirm", () => {
    createSaveWithSkin();
    const onConfirm = vi.fn();
    render(
      <LoadoutModal
        mode="defense"
        initialHero="recon"
        initialWeapons={["pulse"]}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByText("废土行者"));
    fireEvent.click(screen.getByText("部署"));

    const raw = localStorage.getItem("project_m_save_v5");
    expect(raw).toBeTruthy();
    const save = JSON.parse(raw!);
    expect(save.equippedSkin).toBe("skin-wasteland");
    expect(onConfirm).toHaveBeenCalledWith({ heroId: "recon", weaponIds: ["pulse"] });
  });

  it("falls back to default appearance when switching away from hero-specific skin", () => {
    createSaveWithSkin();
    render(
      <LoadoutModal
        mode="defense"
        initialHero="nitrogen"
        initialWeapons={["pulse"]}
        onConfirm={() => {}}
      />
    );

    fireEvent.click(screen.getByText("深寒"));
    expect(screen.getByText("深寒")).toBeInTheDocument();

    fireEvent.click(screen.getByText("侦查"));
    expect(screen.getByText("默认外观")).toBeInTheDocument();
  });
});
