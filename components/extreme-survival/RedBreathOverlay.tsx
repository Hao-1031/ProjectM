import { motion, useReducedMotion } from "framer-motion";

interface RedBreathOverlayProps {
  active: boolean;
  intensity?: number;
}

export default function RedBreathOverlay({ active, intensity = 1 }: RedBreathOverlayProps) {
  const reducedMotion = useReducedMotion();

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.25, 0.45, 0.25] }}
        transition={
          reducedMotion
            ? { duration: 0.01 }
            : {
                duration: 2 / Math.max(0.5, intensity),
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, transparent 55%, rgba(184, 92, 92, ${0.35 * intensity}) 100%)`,
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-1 bg-danger/60"
        style={{ opacity: 0.5 * intensity }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1 bg-danger/60"
        style={{ opacity: 0.5 * intensity }}
      />
      <div
        className="absolute inset-y-0 left-0 w-1 bg-danger/60"
        style={{ opacity: 0.5 * intensity }}
      />
      <div
        className="absolute inset-y-0 right-0 w-1 bg-danger/60"
        style={{ opacity: 0.5 * intensity }}
      />
    </div>
  );
}
