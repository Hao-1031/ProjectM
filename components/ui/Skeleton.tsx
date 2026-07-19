import { cn } from "@/lib/utils";

export interface SkeletonProps {
  className?: string;
  circle?: boolean;
  width?: string | number;
  height?: string | number;
  count?: number;
}

export default function Skeleton({ className, circle, width, height, count = 1 }: SkeletonProps) {
  const style = {
    width,
    height,
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "animate-pulse bg-border/70",
            circle ? "rounded-full" : "rounded-lg",
            className
          )}
          style={style}
          aria-hidden="true"
          data-testid="skeleton"
        />
      ))}
    </>
  );
}
