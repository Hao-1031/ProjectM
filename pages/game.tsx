import { useRouter } from "next/router";
import { useCallback } from "react";
import GameCanvas from "@/components/GameCanvas";

export default function GamePage() {
  const router = useRouter();
  const multiplayer = router.query.multiplayer === "1" || router.query.room !== undefined;

  const handleExit = useCallback(() => {
    if (router.pathname === "/") return;
    void router.push("/");
  }, [router]);

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-background">
      <GameCanvas onExit={handleExit} multiplayer={multiplayer} />
    </div>
  );
}
