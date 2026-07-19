import { useRouter } from "next/router";
import { useCallback, useEffect, useState, Suspense, lazy } from "react";
import Head from "next/head";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";
import Skeleton from "@/components/ui/Skeleton";

const GameCanvas = lazy(() => import("@/components/GameCanvas"));

function GameLoading() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="w-full max-w-xs space-y-3">
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-2 w-5/6 rounded-full" />
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted">载入战场中</p>
    </div>
  );
}

export default function GamePage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const multiplayer = router.query.multiplayer === "1" || router.query.room !== undefined;

  const handleExit = useCallback(() => {
    if (router.pathname === "/") return;
    void router.push("/");
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Head>
        <title>{multiplayer ? "多人对战" : "任务行动"} - Project M</title>
        <meta name="description" content="进入 Project M 战场，抵御敌潮并完成任务。" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="theme-color" content="#070810" />
      </Head>

      <ErrorBoundary>
        <AnimatePresence mode="wait">
          {!ready ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
              className="min-h-[100dvh] w-screen"
            >
              <GameLoading />
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={reducedMotion ? undefined : { opacity: 0, scale: 0.995 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-[100dvh] w-screen overflow-hidden bg-background"
            >
              <Suspense fallback={<GameLoading />}>
                <GameCanvas onExit={handleExit} multiplayer={multiplayer} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </ErrorBoundary>
    </>
  );
}
