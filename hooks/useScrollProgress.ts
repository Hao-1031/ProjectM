import { useEffect, useRef } from "react";
import { useMotionValue, useTransform, MotionValue } from "framer-motion";

interface ScrollProgressOptions {
  target?: React.RefObject<HTMLElement> | null;
  axis?: "y" | "x";
}

export function useScrollProgress(options: ScrollProgressOptions = {}): {
  progress: MotionValue<number>;
  scrollX: MotionValue<number>;
  scrollY: MotionValue<number>;
  scrollXProgress: MotionValue<number>;
  scrollYProgress: MotionValue<number>;
} {
  const { target, axis = "y" } = options;
  const scrollX = useMotionValue(0);
  const scrollY = useMotionValue(0);
  const scrollXProgress = useMotionValue(0);
  const scrollYProgress = useMotionValue(0);

  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = target?.current ?? (typeof window !== "undefined" ? window : null);
    if (!element) return;
    targetRef.current = target?.current ?? null;

    const updateProgress = () => {
      if (!element) return;

      if (element === window) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const docWidth = document.documentElement.scrollWidth - window.innerWidth;
        const y = window.scrollY;
        const x = window.scrollX;
        scrollY.set(y);
        scrollX.set(x);
        scrollYProgress.set(docHeight > 0 ? y / docHeight : 0);
        scrollXProgress.set(docWidth > 0 ? x / docWidth : 0);
      } else {
        const el = element as HTMLElement;
        const maxY = el.scrollHeight - el.clientHeight;
        const maxX = el.scrollWidth - el.clientWidth;
        scrollY.set(el.scrollTop);
        scrollX.set(el.scrollLeft);
        scrollYProgress.set(maxY > 0 ? el.scrollTop / maxY : 0);
        scrollXProgress.set(maxX > 0 ? el.scrollLeft / maxX : 0);
      }
    };

    updateProgress();
    element.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });

    return () => {
      element.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [target, scrollX, scrollY, scrollXProgress, scrollYProgress]);

  const progress = useTransform(axis === "y" ? scrollYProgress : scrollXProgress, (value) => value);

  return {
    progress,
    scrollX,
    scrollY,
    scrollXProgress,
    scrollYProgress,
  };
}
