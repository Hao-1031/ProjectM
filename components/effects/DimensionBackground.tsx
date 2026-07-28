"use client";

import { useReducedMotion, useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";

interface DimensionBackgroundProps {
  intensity?: "subtle" | "medium" | "high";
}

export default function DimensionBackground({ intensity = "medium" }: DimensionBackgroundProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  const riftOpacity = intensity === "subtle" ? 0.04 : intensity === "high" ? 0.1 : 0.06;
  const quantumOpacity = intensity === "subtle" ? 0.03 : intensity === "high" ? 0.08 : 0.05;

  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Parallax background layer */}
      <motion.div
        style={{ y: reducedMotion ? 0 : bgY }}
        className="absolute inset-0"
      >
        {/* Quantum cyan rift - top right */}
        <div
          className="absolute -right-[10%] -top-[10%] h-[70vh] w-[70vh] rounded-full blur-[140px]"
          style={{ backgroundColor: "var(--primary)", opacity: quantumOpacity }}
        />

        {/* Anchor gold glow - bottom left */}
        <div
          className="absolute -bottom-[8%] -left-[8%] h-[60vh] w-[60vh] rounded-full blur-[120px]"
          style={{ backgroundColor: "var(--anchor)", opacity: quantumOpacity * 0.8 }}
        />

        {/* Quantum blue rift - center right */}
        <div
          className="absolute right-[15%] top-[30%] h-[40vh] w-[40vh] rounded-full blur-[100px]"
          style={{ backgroundColor: "var(--quantum)", opacity: quantumOpacity * 0.7 }}
        />

        {/* Entropy crimson - far left */}
        <div
          className="absolute left-[5%] top-[50%] h-[30vh] w-[30vh] rounded-full blur-[90px]"
          style={{ backgroundColor: "var(--entropy)", opacity: quantumOpacity * 0.3 }}
        />

        {/* Dimension rift lines */}
        <svg
          className="absolute inset-0 h-full w-full"
          style={{ opacity: riftOpacity }}
        >
          <defs>
            <linearGradient id="riftGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--quantum)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="riftGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--anchor)" stopOpacity="0" />
              <stop offset="40%" stopColor="var(--anchor)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Horizontal rift lines */}
          <line x1="0%" y1="15%" x2="65%" y2="15%" stroke="url(#riftGrad1)" strokeWidth="0.5" />
          <line x1="30%" y1="35%" x2="100%" y2="35%" stroke="url(#riftGrad1)" strokeWidth="0.3" />
          <line x1="0%" y1="72%" x2="55%" y2="72%" stroke="url(#riftGrad2)" strokeWidth="0.4" />
          <line x1="45%" y1="88%" x2="100%" y2="88%" stroke="url(#riftGrad1)" strokeWidth="0.3" />
          {/* Vertical rift lines */}
          <line x1="85%" y1="0%" x2="85%" y2="60%" stroke="url(#riftGrad1)" strokeWidth="0.3" />
          <line x1="20%" y1="40%" x2="20%" y2="100%" stroke="url(#riftGrad2)" strokeWidth="0.3" />
        </svg>
      </motion.div>
    </div>
  );
}