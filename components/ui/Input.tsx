import { cn } from "@/lib/utils";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { WarningCircle } from "@phosphor-icons/react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={
              [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined
            }
            className={cn(
              "h-10 w-full rounded-xl border bg-background px-3 text-sm text-foreground placeholder:text-muted",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "active:border-primary/50",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-danger/50 focus-visible:ring-danger"
                : "border-border focus-visible:ring-primary",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              {rightIcon}
            </span>
          )}
          {error && (
            <WarningCircle
              size={16}
              weight="fill"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-danger"
              aria-hidden="true"
            />
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 flex items-center gap-1 text-xs text-danger" role="alert">
            <WarningCircle size={12} weight="fill" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-xs text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export default Input;
