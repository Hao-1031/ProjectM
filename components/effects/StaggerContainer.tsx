import { motion, useReducedMotion } from "framer-motion";

interface StaggerContainerProps {
  children: React.ReactNode;
  stagger?: number;
  delay?: number;
  className?: string;
  as?: "div" | "ul" | "ol" | "section";
}

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export default function StaggerContainer({
  children,
  stagger = 0.08,
  delay = 0,
  className = "",
  as = "div",
}: StaggerContainerProps) {
  const reducedMotion = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      initial={reducedMotion ? undefined : "hidden"}
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reducedMotion ? 0 : stagger,
            delayChildren: reducedMotion ? 0 : delay,
          },
        },
      }}
    >
      {children}
    </Tag>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}

export function StaggerItem({ children, className = "", as = "div" }: StaggerItemProps) {
  const reducedMotion = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      variants={staggerItemVariants}
      transition={{
        duration: reducedMotion ? 0 : 0.45,
        ease: [0.22, 1, 0.36, 1] as const,
      }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </Tag>
  );
}
