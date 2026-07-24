import { motion, useReducedMotion } from "framer-motion";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className = "",
}: SectionHeaderProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`${align === "center" ? "text-center" : ""} ${className}`}
    >
      {eyebrow && (
        <span className="inline-block rounded bg-primary/10 px-2 py-1 font-mono text-xs uppercase tracking-widest text-primary">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-2 text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
      {subtitle && (
        <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-muted md:text-sm">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
