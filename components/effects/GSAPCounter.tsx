import { useRef, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import { gsap, registerGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

export interface GSAPCounterProps {
  value: number;
  className?: string;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  start?: string;
  once?: boolean;
}

export default function GSAPCounter({
  value,
  className,
  duration = 1.2,
  delay = 0,
  prefix = "",
  suffix = "",
  decimals = 0,
  start = "top 85%",
  once = true,
}: GSAPCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reducedMotion) setDisplay(value);
  }, [value, reducedMotion]);

  useGSAP(
    () => {
      registerGSAP();
      if (reducedMotion || !ref.current) return;

      const obj = { val: 0 };
      gsap.fromTo(
        obj,
        { val: 0 },
        {
          val: value,
          duration,
          delay,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ref.current,
            start,
            toggleActions: once ? "play none none none" : "play reverse play reverse",
          },
          onUpdate: () => {
            setDisplay(Number(obj.val.toFixed(decimals)));
          },
        }
      );
    },
    { scope: ref, dependencies: [value, reducedMotion] }
  );

  const formatted =
    decimals > 0
      ? display.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : display.toLocaleString();

  return (
    <span ref={ref} className={cn(className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
