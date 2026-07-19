import { motion, useReducedMotion, useInView } from "framer-motion";
import { useRef } from "react";

interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  once?: boolean;
  splitBy?: "word" | "char";
}

export default function TextReveal({
  children,
  className = "",
  delay = 0,
  duration = 0.5,
  stagger = 0.03,
  once = true,
  splitBy = "word",
}: TextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once, margin: "-60px 0px" });
  const reducedMotion = useReducedMotion();

  const items = splitBy === "char" ? children.split("") : children.split(/(\s+)/);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reducedMotion ? 0 : stagger,
        delayChildren: reducedMotion ? 0 : delay,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: "110%" },
    visible: {
      opacity: 1,
      y: "0%",
      transition: {
        duration: reducedMotion ? 0 : duration,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  return (
    <motion.span
      ref={ref}
      className={`inline-block overflow-hidden ${className}`}
      initial={reducedMotion ? undefined : "hidden"}
      animate={reducedMotion ? "visible" : isInView ? "visible" : "hidden"}
      variants={containerVariants}
      aria-label={children}
    >
      {items.map((item, index) => (
        <span key={index} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            variants={itemVariants}
            style={{ willChange: "transform, opacity" }}
          >
            {item === " " ? "\u00A0" : item}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

interface LineRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
}

export function LineReveal({
  children,
  className = "",
  delay = 0,
  duration = 0.55,
  once = true,
}: LineRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-60px 0px" });
  const reducedMotion = useReducedMotion();

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0, y: "100%" }}
        animate={
          reducedMotion
            ? { opacity: 1, y: "0%" }
            : isInView
              ? { opacity: 1, y: "0%" }
              : { opacity: 0, y: "100%" }
        }
        transition={{
          duration: reducedMotion ? 0 : duration,
          delay: reducedMotion ? 0 : delay,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ willChange: "transform, opacity" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
