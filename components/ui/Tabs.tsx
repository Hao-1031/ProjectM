import type { ReactNode } from "react";
import { createContext, useContext, useState, useMemo, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be used within <Tabs>");
  return context;
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const controlled = value !== undefined;
  const activeValue = controlled ? value : internalValue;

  const setValue = useCallback(
    (next: string) => {
      if (!controlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange]
  );

  const contextValue = useMemo(() => ({ value: activeValue, setValue }), [activeValue, setValue]);

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn("flex flex-col gap-3", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-border bg-panel p-1",
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
  const { value: activeValue, setValue } = useTabs();
  const isActive = activeValue === value;
  const reducedMotion = useReducedMotion();

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => setValue(value)}
      className={cn(
        "relative rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-40",
        isActive ? "text-background" : "text-muted hover:text-foreground",
        className
      )}
    >
      {isActive && (
        <motion.div
          layoutId="tabs-active"
          transition={
            reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }
          }
          className="absolute inset-0 rounded-lg bg-primary"
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: activeValue } = useTabs();
  const isActive = activeValue === value;
  const reducedMotion = useReducedMotion();

  if (!isActive) return null;

  return (
    <motion.div
      role="tabpanel"
      initial={reducedMotion ? undefined : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn("outline-none", className)}
      tabIndex={0}
    >
      {children}
    </motion.div>
  );
}
