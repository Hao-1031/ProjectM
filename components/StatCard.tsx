import { motion, useReducedMotion } from "framer-motion";

interface StatCardProps {
  value: React.ReactNode;
  label: string;
  icon?: React.ReactNode;
  sub?: string;
  variant?: "default" | "primary" | "accent" | "success" | "danger" | "muted";
  className?: string;
}

const variantBorder: Record<string, string> = {
  default: "border-border",
  primary: "border-primary/20",
  accent: "border-accent/20",
  success: "border-success/20",
  danger: "border-danger/20",
  muted: "border-border",
};

const variantGlow: Record<string, string> = {
  default: "bg-muted/5",
  primary: "bg-primary/10",
  accent: "bg-accent/10",
  success: "bg-success/10",
  danger: "bg-danger/10",
  muted: "bg-muted/5",
};

export default function StatCard({
  value,
  label,
  icon,
  sub,
  variant = "default",
  className = "",
}: StatCardProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reducedMotion ? undefined : { y: -2 }}
      className={`group relative overflow-hidden rounded-2xl border bg-panel p-2.5 transition-colors hover:bg-panel-raised md:p-3 ${variantBorder[variant]} ${className}`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl transition-opacity duration-500 ${variantGlow[variant]} opacity-30 group-hover:opacity-60`}
      />
      <div className="relative flex items-start justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
        {icon && (
          <div className="text-muted transition-colors group-hover:text-foreground">{icon}</div>
        )}
      </div>
      <p className="relative mt-1 text-xl font-bold tracking-tight md:text-2xl">{value}</p>
      {sub && <p className="relative mt-1 text-xs text-muted">{sub}</p>}
    </motion.div>
  );
}
