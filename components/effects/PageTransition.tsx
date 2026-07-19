import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
  mode?: "fade" | "slide" | "scale";
  duration?: number;
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.01 },
  },
};

export default function PageTransition({
  children,
  mode = "fade",
  duration = 0.3,
}: PageTransitionProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [route, setRoute] = useState(router.asPath);

  useEffect(() => {
    const handleRouteChange = (url: string) => setRoute(url);
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router]);

  const transition = {
    duration: reducedMotion ? 0 : duration,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={route}
        initial={reducedMotion ? undefined : variants[mode].initial}
        animate={variants[mode].animate}
        exit={reducedMotion ? undefined : variants[mode].exit}
        transition={transition}
        style={{ willChange: "transform, opacity" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
