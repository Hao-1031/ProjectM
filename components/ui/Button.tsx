import type { ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { Spinner } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

const variants = {
  primary:
    "bg-primary text-background hover:bg-primary/90 active:bg-primary/80 focus-visible:ring-primary",
  secondary:
    "bg-panel-raised text-foreground hover:bg-panel-raised/80 active:bg-panel-raised/60 border border-border",
  outline:
    "border border-border text-foreground hover:bg-panel-raised/50 active:bg-panel-raised/30 focus-visible:ring-primary",
  ghost:
    "text-foreground hover:bg-panel-raised/50 active:bg-panel-raised/30 focus-visible:ring-primary",
  danger: "bg-danger text-white hover:bg-danger/90 active:bg-danger/80 focus-visible:ring-danger",
};

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const reducedMotion = useReducedMotion();
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      whileTap={reducedMotion || isDisabled ? undefined : { scale: 0.96 }}
      whileHover={reducedMotion || isDisabled ? undefined : { scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-xl font-bold",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner
            size={size === "lg" ? 20 : size === "sm" ? 14 : 16}
            weight="bold"
            className="animate-spin"
          />
        </span>
      )}
      <span className={cn("inline-flex items-center gap-inherit", loading && "opacity-0")}>
        {leftIcon}
        {children}
        {rightIcon}
      </span>
    </motion.button>
  );
}
