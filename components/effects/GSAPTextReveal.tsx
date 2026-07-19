import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import { gsap, registerGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

export interface GSAPTextRevealProps {
  children: string;
  className?: string;
  splitBy?: "word" | "char" | "line";
  delay?: number;
  duration?: number;
  stagger?: number;
  once?: boolean;
  start?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export default function GSAPTextReveal({
  children,
  className,
  splitBy = "word",
  delay = 0,
  duration = 0.55,
  stagger = 0.03,
  once = true,
  start = "top 85%",
  as: Tag = "span",
}: GSAPTextRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const items =
    splitBy === "char"
      ? children.split("")
      : splitBy === "line"
        ? children.split("\n")
        : children.split(/(\s+)/);

  useGSAP(
    () => {
      registerGSAP();
      if (reducedMotion || !ref.current) return;

      const targets = ref.current.querySelectorAll(".gsap-text-reveal__item");
      if (targets.length === 0) return;

      gsap.fromTo(
        targets,
        { opacity: 0, y: "110%" },
        {
          opacity: 1,
          y: "0%",
          duration,
          delay,
          stagger,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ref.current,
            start,
            toggleActions: once ? "play none none none" : "play reverse play reverse",
          },
        }
      );
    },
    { scope: ref, dependencies: [reducedMotion] }
  );

  if (reducedMotion) {
    return <Tag className={cn(className)}>{children}</Tag>;
  }

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={cn("inline-block", className)}
      aria-label={children}
    >
      {items.map((item, index) => (
        <span
          key={index}
          className="gsap-text-reveal__item inline-block overflow-hidden align-bottom"
          style={{ opacity: 0 }}
        >
          <span className="inline-block">
            {item === " " ? "\u00A0" : item === "" ? <>&nbsp;</> : item}
          </span>
        </span>
      ))}
    </Tag>
  );
}
