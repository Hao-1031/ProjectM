import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import { gsap, registerGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

export interface GSAPCardStackCard {
  id: string;
  title: string;
  description: string;
  meta?: string;
  color?: "primary" | "accent" | "danger" | "success" | "muted";
}

export interface GSAPCardStackProps {
  cards: GSAPCardStackCard[];
  className?: string;
  cardHeight?: string;
}

const colorClasses: Record<string, { border: string; glow: string; badge: string }> = {
  primary: {
    border: "border-primary/30",
    glow: "shadow-primary/10",
    badge: "bg-primary/10 text-primary",
  },
  accent: {
    border: "border-accent/30",
    glow: "shadow-accent/10",
    badge: "bg-accent/10 text-accent",
  },
  danger: {
    border: "border-danger/30",
    glow: "shadow-danger/10",
    badge: "bg-danger/10 text-danger",
  },
  success: {
    border: "border-success/30",
    glow: "shadow-success/10",
    badge: "bg-success/10 text-success",
  },
  muted: {
    border: "border-border",
    glow: "shadow-background/10",
    badge: "bg-panel-raised text-muted",
  },
};

export default function GSAPCardStack({
  cards,
  className,
  cardHeight = "min-h-[360px] md:min-h-[420px]",
}: GSAPCardStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      registerGSAP();
      if (reducedMotion || !containerRef.current || !stackRef.current) return;

      const cardEls = gsap.utils.toArray<HTMLElement>(".gsap-card-stack__card");
      if (cardEls.length === 0) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          pin: stackRef.current,
          pinSpacing: false,
        },
      });

      cardEls.forEach((card, i) => {
        tl.fromTo(
          card,
          { y: 80, opacity: 0, scale: 0.92, zIndex: i },
          { y: 0, opacity: 1, scale: 1, zIndex: i + 10, duration: 1, ease: "power2.out" },
          i
        );

        if (i < cardEls.length - 1) {
          tl.to(
            card,
            {
              scale: 0.92,
              opacity: 0.25,
              filter: "brightness(0.55)",
              duration: 1,
              ease: "power2.inOut",
            },
            i + 0.85
          );
        }
      });
    },
    { scope: containerRef, dependencies: [cards.length, reducedMotion] }
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      style={{ height: `${cards.length * 100}vh` }}
    >
      <div
        ref={stackRef}
        className="sticky top-0 flex min-h-[100dvh] items-center justify-center px-4 py-16"
      >
        <div className="relative mx-auto w-full max-w-4xl">
          {cards.map((card, index) => {
            const colors = colorClasses[card.color ?? "muted"];
            return (
              <article
                key={card.id}
                className={cn(
                  "gsap-card-stack__card absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-3xl border bg-panel p-6 shadow-2xl md:p-10",
                  cardHeight,
                  colors.border,
                  colors.glow,
                  reducedMotion && index !== cards.length - 1 ? "hidden" : ""
                )}
              >
                <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.04),transparent_50%)]" />
                <div className="relative">
                  {card.meta && (
                    <span
                      className={cn(
                        "inline-block rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-widest",
                        colors.badge
                      )}
                    >
                      {card.meta}
                    </span>
                  )}
                  <h3 className="mt-4 text-2xl font-bold tracking-tight md:text-4xl">
                    {card.title}
                  </h3>
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
                    {card.description}
                  </p>
                  <div className="mt-8 flex items-center gap-2 text-xs text-muted">
                    <span className="font-mono">{String(index + 1).padStart(2, "0")}</span>
                    <span>/</span>
                    <span className="font-mono">{String(cards.length).padStart(2, "0")}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
