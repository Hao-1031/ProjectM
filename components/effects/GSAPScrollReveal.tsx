import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import { gsap, registerGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right";

export interface GSAPScrollRevealProps {
  children: React.ReactNode;
  direction?: Direction;
  distance?: number;
  duration?: number;
  delay?: number;
  once?: boolean;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "span";
  start?: string;
  ease?: string;
  scrub?: boolean | number;
}

export default function GSAPScrollReveal({
  children,
  direction = "up",
  distance = 32,
  duration = 0.7,
  delay = 0,
  once = true,
  className,
  as: Tag = "div",
  start = "top 85%",
  ease = "power3.out",
  scrub = false,
}: GSAPScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
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

  useGSAP(
    () => {
      registerGSAP();
      if (reducedMotion || !ref.current) return;

      const initial = getInitial();
      gsap.fromTo(ref.current, initial, {
        opacity: 1,
        x: 0,
        y: 0,
        duration,
        delay,
        ease,
        scrollTrigger: {
          trigger: ref.current,
          start,
          toggleActions: once ? "play none none none" : "play reverse play reverse",
          scrub,
        },
      });
    },
    { scope: ref, dependencies: [reducedMotion] }
  );

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={cn(className)}
      style={{ opacity: reducedMotion ? undefined : 0 }}
    >
      {children}
    </Tag>
  );
}
