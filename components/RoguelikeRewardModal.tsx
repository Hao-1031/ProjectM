import { motion } from "framer-motion";
import type { RoguelikeRewardBalance } from "@/lib/game/balance";
import {
  Heartbeat,
  Sword,
  ShieldCheck,
  ShootingStar,
  Sparkle,
  CaretRight,
} from "@phosphor-icons/react";

interface RoguelikeRewardModalProps {
  options: RoguelikeRewardBalance[];
  onSelect: (rewardId: string) => void;
}

const ICONS = [Sword, Heartbeat, ShieldCheck, ShootingStar, Sparkle];

const RARITY_STYLES = [
  { border: "border-border", bg: "bg-panel-raised", badge: "common" },
  { border: "border-primary/30", bg: "bg-primary/5", badge: "rare" },
  { border: "border-accent/30", bg: "bg-accent/5", badge: "epic" },
];

export default function RoguelikeRewardModal({ options, onSelect }: RoguelikeRewardModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-background/88 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

        <div className="p-6 text-center md:p-8">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">补给站</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            选择一项强化以继续探索。奖励效果会持续到本次 Roguelike 运行结束。
          </p>
        </div>

        <div className="space-y-3 px-6 pb-8 md:px-8">
          {options.map((option, index) => {
            const Icon = ICONS[index % ICONS.length];
            const rarity = RARITY_STYLES[index % RARITY_STYLES.length];

            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: index * 0.08,
                  duration: 0.28,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelect(option.id)}
                className={`group flex w-full items-center gap-4 rounded-2xl border ${rarity.border} ${rarity.bg} p-4 text-left transition-all hover:border-accent/50 hover:bg-panel focus-ring md:p-5`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-accent transition-colors group-hover:border-accent/40">
                  <Icon size={24} weight="bold" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{option.name}</h3>
                    <span className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                      {rarity.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{option.description}</p>
                </div>

                <CaretRight
                  size={18}
                  weight="bold"
                  className="shrink-0 text-muted transition-all group-hover:translate-x-1 group-hover:text-accent"
                />
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
