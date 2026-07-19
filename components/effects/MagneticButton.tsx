import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion, useTransform } from "framer-motion";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
}

export default function MagneticButton({
  children,
  className = "",
  strength = 0.25,
  onClick,
  disabled = false,
  type = "button",
  ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 250, damping: 20 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const rotateX = useTransform(springY, (value) => -value * 0.15);
  const rotateY = useTransform(springX, (value) => value * 0.15);

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = event.clientX - centerX;
    const distanceY = event.clientY - centerY;
    x.set(distanceX * strength);
    y.set(distanceY * strength);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handlePointerDown = () => setPressed(true);
  const handlePointerUp = () => setPressed(false);

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerLeave}
      style={{
        x: reducedMotion ? 0 : springX,
        y: reducedMotion ? 0 : springY,
        rotateX: reducedMotion ? 0 : rotateX,
        rotateY: reducedMotion ? 0 : rotateY,
        willChange: "transform",
      }}
      whileTap={reducedMotion ? undefined : { scale: 0.96 }}
      animate={pressed && !reducedMotion ? { scale: 0.96 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}
