import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  "default" | "primary" | "accent" | "danger" | "success" | "warning" | "outline";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-panel-raised text-foreground border border-border",
  primary: "bg-primary/10 text-primary border border-primary/20",
  accent: "bg-accent/10 text-accent border border-accent/20",
  danger: "bg-danger/10 text-danger border border-danger/20",
  success: "bg-success/10 text-success border border-success/20",
  warning: "bg-warning/10 text-warning border border-warning/20",
  outline: "border border-border text-muted",
};

const sizes = {
  sm: "px-1.5 py-0.5 text-[10px] gap-1",
  md: "px-2 py-0.5 text-xs gap-1.5",
};

export default function Badge({
  children,
  variant = "default",
  size = "md",
  leftIcon,
  rightIcon,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-bold",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </span>
  );
}
