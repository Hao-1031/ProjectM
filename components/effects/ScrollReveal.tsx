import { motion, useReducedMotion, useInView } from "framer-motion";
import { useRef } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}

export default function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.55,
  distance = 28,
  once = true,
  className = "",
  as = "div",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-80px 0px" });
  const reducedMotion = useReducedMotion();

  const getInitial = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: distance };
      case "down":
        return { opacity: 0, y: -distance };
      case "left":
        return { opacity: 0, x: distance };
      case "right":
        return { opacity: 0, x: -distance };
    }
  };

  const initial = getInitial();
  const Tag = motion[as];

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={className}
      initial={reducedMotion ? undefined : initial}
      animate={
        reducedMotion ? { opacity: 1, x: 0, y: 0 } : isInView ? { opacity: 1, x: 0, y: 0 } : initial
      }
      transition={{
        duration: reducedMotion ? 0 : duration,
        delay: reducedMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1] as const,
      }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </Tag>
  );
}
