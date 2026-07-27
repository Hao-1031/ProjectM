import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Skull, Crosshair, Sword } from "@phosphor-icons/react";

export interface KillFeedEntry {
  id: string;
  killerName: string;
  victimName: string;
  weaponName?: string;
  timestamp: number;
}

interface KillFeedProps {
  entries: KillFeedEntry[];
  maxVisible?: number;
}

export default function KillFeed({ entries, maxVisible = 5 }: KillFeedProps) {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState<KillFeedEntry[]>([]);
  const prevLen = useRef(0);

  useEffect(() => {
    if (entries.length <= prevLen.current) {
      setVisible(entries.slice(-maxVisible));
      prevLen.current = entries.length;
      return;
    }
    const newEntries = entries.slice(prevLen.current);
    setVisible((prev) => {
      const combined = [...prev, ...newEntries];
      return combined.slice(-maxVisible);
    });
    prevLen.current = entries.length;
  }, [entries, maxVisible]);

  return (
    <div className="pointer-events-none flex flex-col-reverse gap-1" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {visible.map((entry) => (
          <motion.div
            key={entry.id}
            layout={!reducedMotion}
            initial={reducedMotion ? undefined : { opacity: 0, x: 24, height: 0 }}
            animate={{ opacity: 1, x: 0, height: "auto" }}
            exit={reducedMotion ? undefined : { opacity: 0, x: 16, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-panel/80 px-2 py-1 text-xs backdrop-blur-sm">
              <Skull size={10} weight="bold" className="shrink-0 text-danger" />
              <span className="font-bold text-foreground truncate max-w-[80px]">
                {entry.killerName}
              </span>
              {entry.weaponName ? (
                <Sword size={10} weight="bold" className="shrink-0 text-muted" />
              ) : (
                <Crosshair size={10} weight="bold" className="shrink-0 text-muted" />
              )}
              <span className="text-muted truncate max-w-[80px]">
                {entry.victimName}
              </span>
              {entry.weaponName && (
                <span className="text-[10px] text-muted/60 hidden sm:inline">
                  [{entry.weaponName}]
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}