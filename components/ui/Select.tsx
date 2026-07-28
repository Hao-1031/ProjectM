import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CaretDown, Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-8 text-xs",
  md: "h-10 text-sm",
  lg: "h-12 text-base",
};

const iconSizes = { sm: 14, md: 16, lg: 18 };

export default function Select({
  options,
  value,
  onChange,
  placeholder = "请选择",
  label,
  error,
  disabled = false,
  size = "md",
  className,
}: SelectProps) {
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setActiveIndex(-1);
      return;
    }
    const idx = options.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : -1);
  }, [open, options, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => {
            let next = prev + 1;
            while (next < options.length && options[next].disabled) next++;
            if (next >= options.length) next = 0;
            return next;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => {
            let next = prev - 1;
            while (next >= 0 && options[next].disabled) next--;
            if (next < 0) next = options.length - 1;
            return next;
          });
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (activeIndex >= 0 && !options[activeIndex].disabled) {
            onChange(options[activeIndex].value);
            setOpen(false);
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
        case "Tab":
          setOpen(false);
          break;
      }
    },
    [open, activeIndex, options, onChange]
  );

  useEffect(() => {
    if (open && activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open
            ? "border-primary bg-panel-raised"
            : error
            ? "border-danger bg-background"
            : "border-border bg-background hover:border-primary/50",
          sizes[size],
          size === "sm" ? "px-2.5" : "px-3"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label ?? placeholder}
      >
        <span className={cn(selectedOption ? "text-foreground" : "text-muted", "truncate")}>
          {selectedOption?.label ?? placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-muted shrink-0"
        >
          <CaretDown size={iconSizes[size]} weight="bold" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            role="listbox"
            aria-label={label ?? placeholder}
            initial={reducedMotion ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-auto rounded-xl border border-border bg-panel p-1 shadow-2xl shadow-black/30 backdrop-blur-xl"
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled}
                onClick={() => {
                  if (!option.disabled) {
                    onChange(option.value);
                    setOpen(false);
                  }
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors",
                  option.disabled && "cursor-not-allowed opacity-40",
                  index === activeIndex && "bg-panel-raised",
                  option.value === value && "bg-primary/10 text-primary",
                  size === "sm" ? "text-xs" : "text-sm"
                )}
              >
                <span className="flex-1 truncate">
                  {option.label}
                  {option.description && (
                    <span className="ml-2 text-[10px] text-muted">{option.description}</span>
                  )}
                </span>
                {option.value === value && (
                  <Check size={iconSizes[size]} weight="bold" className="shrink-0" />
                )}
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-muted">无可用选项</li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-1 text-[10px] text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}