import { motion } from "framer-motion";
import type { UpgradeOption } from "@/lib/game/types";
import { Crosshair, Shield, TrendUp, Star } from "@phosphor-icons/react";

interface UpgradeModalProps {
  options: UpgradeOption[];
  onSelect: (option: UpgradeOption) => void;
}

function typeMeta(type: UpgradeOption["type"]) {
  switch (type) {
    case "weapon":
      return { label: "武器", Icon: Crosshair, color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" };
    case "passive":
      return { label: "被动", Icon: Shield, color: "text-success", bg: "bg-success/10", border: "border-success/30" };
    case "heroTalent":
      return { label: "天赋", Icon: Star, color: "text-accent", bg: "bg-accent/10", border: "border-accent/30" };
    default:
      return { label: "属性", Icon: TrendUp, color: "text-foreground", bg: "bg-[var(--panel-raised)]", border: "border-border" };
  }
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panelVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 12 },
};

export default function UpgradeModal({ options, onSelect }: UpgradeModalProps) {
  return (
    <motion.div
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute inset-0 z-40 flex items-center justify-center bg-background/88 p-4 backdrop-blur-md"
    >
      <motion.div
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="p-6 text-center md:p-8">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">升级选择</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            选择一项强化以继续战斗。同一能力可叠加至最大等级。
          </p>
        </div>

        <div className="px-6 pb-8 md:px-8">
          <div className="grid grid-flow-dense grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {options.map((option, index) => {
              const meta = typeMeta(option.type);
              const Icon = meta.Icon;
              const isFeatured = index === 0 && options.length > 1;

              return (
                <motion.button
                  key={option.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.06,
                    duration: 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(option)}
                  className={`group relative flex flex-col items-start overflow-hidden rounded-2xl border bg-[var(--panel-raised)] p-5 text-left transition-colors hover:bg-panel focus-ring ${
                    meta.border
                  } ${isFeatured ? "sm:col-span-2 md:col-span-2 md:row-span-2 md:p-6" : "col-span-1"}`}
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg ${meta.bg} px-2 py-1 font-mono text-[10px] font-bold ${meta.color}`}
                    >
                      <Icon size={12} weight="bold" />
                      {meta.label}
                    </span>
                    {option.level > 0 && (
                      <span className="font-mono text-[10px] text-muted">
                        Lv.{option.level} / {option.maxLevel}
                      </span>
                    )}
                  </div>

                  <h3
                    className={`mt-4 font-bold ${
                      isFeatured ? "text-xl md:text-2xl" : "text-lg"
                    }`}
                  >
                    {option.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {option.description}
                  </p>

                  <div className="mt-5 flex w-full items-center justify-between">
                    <span className="text-xs text-muted">点击选择</span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all group-hover:border-primary/50 group-hover:bg-primary/10 ${meta.border} ${meta.color}`}
                    >
                      <Icon size={12} weight="bold" />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
