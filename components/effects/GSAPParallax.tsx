import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import { gsap, registerGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

export interface GSAPParallaxProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  as?: "div" | "span" | "section";
  start?: string;
  end?: string;
}

export default function GSAPParallax({
  children,
  speed = 0.2,
  className,
  as: Tag = "div",
  start = "top bottom",
  end = "bottom top",
}: GSAPParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      registerGSAP();
      if (reducedMotion || !ref.current) return;

      const distance = typeof window !== "undefined" ? window.innerHeight * speed : 120;

      gsap.fromTo(
        ref.current,
        { y: -distance * 0.5 },
        {
          y: distance * 0.5,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start,
            end,
            scrub: true,
          },
        }
      );
    },
    { scope: ref, dependencies: [reducedMotion] }
  );

  return (
    <Tag ref={ref as React.RefObject<never>} className={cn(className)}>
      {children}
    </Tag>
  );
}
