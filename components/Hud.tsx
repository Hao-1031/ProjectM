import { useEffect, useState } from "react";
import type { GameState } from "@/lib/game/types";
import { useAppStore } from "@/lib/store";
import HudDesktop from "@/components/game/HudDesktop";
import HudMobile from "@/components/game/HudMobile";
import type { KillFeedEntry } from "@/components/game/KillFeed";

interface HudProps {
  state: GameState;
  paused: boolean;
  onPauseToggle: () => void;
  extractionTimer: number;
  onUseSkill?: () => void;
  onUseUltimate?: () => void;
  onSurrender?: () => void;
  killFeed?: KillFeedEntry[];
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const detect = () => {
      const hasPointerCoarse = window.matchMedia("(pointer: coarse)").matches;
      const hasHover = window.matchMedia("(hover: hover)").matches;
      const shortEdge = Math.min(window.innerWidth, window.innerHeight);
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      setIsMobile((isTouch || hasPointerCoarse) && (!hasHover || shortEdge < 1024));
    };

    detect();
    window.addEventListener("resize", detect);
    return () => window.removeEventListener("resize", detect);
  }, []);

  return isMobile;
}

export default function Hud(props: HudProps) {
  const isMobile = useIsMobile();
  const hudScale = useAppStore((s) => s.settings.hudScale);

  return (
    <div
      className="absolute inset-0"
      style={{ transform: `scale(${hudScale})`, transformOrigin: "top left" }}
    >
      {isMobile ? (
        <HudMobile
          state={props.state}
          paused={props.paused}
          onPauseToggle={props.onPauseToggle}
          onUseSkill={props.onUseSkill}
          onUseUltimate={props.onUseUltimate}
          onSurrender={props.onSurrender}
        />
      ) : (
        <HudDesktop
          state={props.state}
          paused={props.paused}
          onPauseToggle={props.onPauseToggle}
          extractionTimer={props.extractionTimer}
          onUseSkill={props.onUseSkill}
          onUseUltimate={props.onUseUltimate}
          onSurrender={props.onSurrender}
          killFeed={props.killFeed}
        />
      )}
    </div>
  );
}