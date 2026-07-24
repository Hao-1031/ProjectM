import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

type ColorVariant = "primary" | "accent" | "success" | "danger" | "muted";

interface FeatureCardProps {
  as?: "link" | "button" | "div";
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  meta?: React.ReactNode;
  variant?: ColorVariant;
  className?: string;
  children?: React.ReactNode;
}

const variantStyles: Record<ColorVariant, string> = {
  primary:
    "border-primary/20 bg-primary/5 hover:border-primary/50 hover:bg-primary/[0.08] focus-visible:ring-primary/40",
  accent:
    "border-accent/20 bg-accent/5 hover:border-accent/50 hover:bg-accent/[0.08] focus-visible:ring-accent/40",
  success:
    "border-success/20 bg-success/5 hover:border-success/50 hover:bg-success/[0.08] focus-visible:ring-success/40",
  danger:
    "border-danger/20 bg-danger/5 hover:border-danger/50 hover:bg-danger/[0.08] focus-visible:ring-danger/40",
  muted:
    "border-border bg-panel hover:border-muted/60 hover:bg-panel-raised focus-visible:ring-muted/40",
};

const glowStyles: Record<ColorVariant, string> = {
  primary: "bg-primary/10",
  accent: "bg-accent/10",
  success: "bg-success/10",
  danger: "bg-danger/10",
  muted: "bg-muted/5",
};

export default function FeatureCard({
  as = "div",
  href,
  onClick,
  icon,
  title,
  description,
  meta,
  variant = "muted",
  className = "",
  children,
}: FeatureCardProps) {
  const reducedMotion = useReducedMotion();

  const content = (
    <>
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-opacity duration-500 ${glowStyles[variant]} opacity-40 group-hover:opacity-70`}
      />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          {icon && <div className="text-foreground/90">{icon}</div>}
          {meta && <div className="ml-auto shrink-0 text-xs text-muted">{meta}</div>}
        </div>
        <h3 className="relative mt-1.5 text-sm font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="relative mt-1 text-xs leading-relaxed text-muted">{description}</p>
        )}
        {children && <div className="relative mt-2 flex-1">{children}</div>}
      </div>
    </>
  );

  const classes = `group relative overflow-hidden rounded-2xl border p-2.5 text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background md:p-3 ${variantStyles[variant]} ${className}`;

  if (as === "link" && href) {
    return (
      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileHover={reducedMotion ? undefined : { y: -3 }}
        whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      >
        <Link href={href} className={classes}>
          {content}
        </Link>
      </motion.div>
    );
  }

  if (as === "button") {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileHover={reducedMotion ? undefined : { y: -3 }}
        whileTap={reducedMotion ? undefined : { scale: 0.98 }}
        className={classes}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={classes}
    >
      {content}
    </motion.div>
  );
}
