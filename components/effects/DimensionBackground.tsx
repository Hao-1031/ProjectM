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
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);

  const voidOpacity = intensity === "subtle" ? 0.03 : intensity === "high" ? 0.08 : 0.05;
  const orbitalOpacity = intensity === "subtle" ? 0.02 : intensity === "high" ? 0.06 : 0.04;

  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        style={{ y: reducedMotion ? 0 : bgY }}
        className="absolute inset-0"
      >
        {/* Deep space blue — top right */}
        <div
          className="absolute -right-[5%] -top-[5%] h-[60vh] w-[60vh] rounded-full blur-[140px]"
          style={{ backgroundColor: "var(--void)", opacity: voidOpacity }}
        />
        {/* Orbital blue — center left */}
        <div
          className="absolute -left-[8%] top-[20%] h-[50vh] w-[50vh] rounded-full blur-[120px]"
          style={{ backgroundColor: "var(--orbital)", opacity: orbitalOpacity }}
        />
        {/* Astro gold — bottom right */}
        <div
          className="absolute -bottom-[6%] -right-[6%] h-[45vh] w-[45vh] rounded-full blur-[100px]"
          style={{ backgroundColor: "var(--anchor)", opacity: orbitalOpacity * 0.7 }}
        />
        {/* Subtle orbital glow — center */}
        <div
          className="absolute left-[30%] top-[40%] h-[30vh] w-[30vh] rounded-full blur-[90px]"
          style={{ backgroundColor: "var(--orbital)", opacity: orbitalOpacity * 0.4 }}
        />

        {/* Orbital path lines */}
        <svg
          className="absolute inset-0 h-full w-full"
          style={{ opacity: voidOpacity * 0.6 }}
        >
          <defs>
            <linearGradient id="orbitGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--void)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--void)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--orbital)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="orbitGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--anchor)" stopOpacity="0" />
              <stop offset="40%" stopColor="var(--anchor)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--void)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0%" y1="12%" x2="70%" y2="12%" stroke="url(#orbitGrad1)" strokeWidth="0.5" />
          <line x1="25%" y1="30%" x2="100%" y2="30%" stroke="url(#orbitGrad1)" strokeWidth="0.3" />
          <line x1="0%" y1="68%" x2="60%" y2="68%" stroke="url(#orbitGrad2)" strokeWidth="0.4" />
          <line x1="40%" y1="85%" x2="100%" y2="85%" stroke="url(#orbitGrad1)" strokeWidth="0.3" />
          <line x1="88%" y1="0%" x2="88%" y2="55%" stroke="url(#orbitGrad1)" strokeWidth="0.3" />
          <line x1="15%" y1="45%" x2="15%" y2="100%" stroke="url(#orbitGrad2)" strokeWidth="0.3" />
        </svg>
      </motion.div>
    </div>
  );
}