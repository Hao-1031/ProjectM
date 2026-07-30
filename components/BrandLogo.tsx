import { motion } from "framer-motion";

interface BrandLogoProps {
  size?: number;
  animated?: boolean;
  variant?: "full" | "icon" | "wordmark";
  className?: string;
}

export default function BrandLogo({
  size = 32,
  animated = false,
  variant = "icon",
  className = "",
}: BrandLogoProps) {
  const iconMark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer ring — orbital boundary */}
      <motion.circle
        cx="24" cy="24" r="22"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeOpacity="0.2"
        fill="none"
        initial={animated ? { pathLength: 0, opacity: 0 } : undefined}
        animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Inner hexagon — space station geometry */}
      <motion.path
        d="M24 10L36 16V28L24 34L12 28V16L24 10Z"
        stroke="currentColor"
        strokeWidth="1.0"
        strokeOpacity="0.5"
        fill="none"
        initial={animated ? { pathLength: 0, opacity: 0 } : undefined}
        animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* M letterform — clean geometric */}
      <motion.path
        d="M17 14L17 34"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeOpacity="0.9"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={animated ? { pathLength: 1 } : undefined}
        transition={{ duration: 0.4, delay: 0.8, ease: "easeOut" }}
      />
      <motion.path
        d="M17 14L24 26L31 14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.9"
        fill="none"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={animated ? { pathLength: 1 } : undefined}
        transition={{ duration: 0.5, delay: 1.0, ease: "easeOut" }}
      />
      <motion.path
        d="M31 14L31 34"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeOpacity="0.9"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={animated ? { pathLength: 1 } : undefined}
        transition={{ duration: 0.4, delay: 1.2, ease: "easeOut" }}
      />
      {/* Center anchor dot */}
      <motion.circle
        cx="24" cy="26" r="2.5"
        fill="currentColor"
        fillOpacity="0.8"
        initial={animated ? { scale: 0 } : undefined}
        animate={animated ? { scale: 1 } : undefined}
        transition={{ duration: 0.3, delay: 1.5, ease: "easeOut" }}
      />
      {/* Bottom anchor point */}
      <motion.circle
        cx="24" cy="34" r="1.5"
        fill="currentColor"
        fillOpacity="0.4"
        initial={animated ? { scale: 0 } : undefined}
        animate={animated ? { scale: 1 } : undefined}
        transition={{ duration: 0.3, delay: 1.7, ease: "easeOut" }}
      />
    </svg>
  );

  const wordmark = (
    <div className="flex flex-col">
      <span
        className="font-sans font-bold uppercase tracking-[0.25em]"
        style={{ fontSize: size * 0.4 }}
      >
        多重宇宙
      </span>
      <span
        className="text-[10px] tracking-[0.3em] text-muted"
        style={{ fontSize: size * 0.22 }}
      >
        双生
      </span>
    </div>
  );

  if (variant === "icon") return iconMark;
  if (variant === "wordmark") return wordmark;
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {iconMark}
      {wordmark}
    </div>
  );
}