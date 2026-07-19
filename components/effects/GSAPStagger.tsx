import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import { gsap, registerGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

export interface GSAPStaggerProps {
  children: React.ReactNode;
  className?: string;
  childClassName?: string;
  stagger?: number;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  once?: boolean;
  start?: string;
  as?: "div" | "ul" | "ol" | "section";
  childAs?: "div" | "li" | "article";
}

export default function GSAPStagger({
  children,
  className,
  childClassName,
  stagger = 0.08,
  delay = 0,
  duration = 0.55,
  direction = "up",
  distance = 24,
  once = true,
  start = "top 85%",
  as: Tag = "div",
  childAs: ChildTag = "div",
}: GSAPStaggerProps) {
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

      const items = ref.current.querySelectorAll(".gsap-stagger__item");
      if (items.length === 0) return;

      const initial = getInitial();
      gsap.fromTo(items, initial, {
        opacity: 1,
        x: 0,
        y: 0,
        duration,
        delay,
        stagger,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start,
          toggleActions: once ? "play none none none" : "play reverse play reverse",
        },
      });
    },
    { scope: ref, dependencies: [reducedMotion] }
  );

  const wrappedChildren = (Array.isArray(children) ? children : [children]).map((child, index) => (
    <ChildTag
      key={index}
      className={cn("gsap-stagger__item", childClassName)}
      style={{ opacity: reducedMotion ? undefined : 0 }}
    >
      {child}
    </ChildTag>
  ));

  return (
    <Tag ref={ref as React.RefObject<never>} className={cn(className)}>
      {wrappedChildren}
    </Tag>
  );
}
