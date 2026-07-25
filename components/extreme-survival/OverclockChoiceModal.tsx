import { motion, useReducedMotion } from "framer-motion";
import { Lightning, ArrowRight, Skull, Warning } from "@phosphor-icons/react";
import Button from "@/components/ui/Button";

export type OverclockChoice = "overclock" | "continue";

interface OverclockChoiceModalProps {
  onChoose: (choice: OverclockChoice) => void;
}

export default function OverclockChoiceModal({ onChoose }: OverclockChoiceModalProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-md">
      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-panel shadow-2xl"
      >
        <div className="relative overflow-hidden bg-danger/10 p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-danger/20 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/15 text-danger">
              <Warning size={28} weight="bold" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight">第 25 波检查点</h2>
              <p className="text-xs text-muted">极限生存模式 - 分支选择</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-5">
          <p className="text-sm leading-relaxed text-muted">
            你已抵达前半段终点。接下来可以选择进入后半段「超频极限」，敌人强度将陡增，但奖励提升至 1.7 倍并计入排行榜；或继续以普通曲线作战，仅获得基础奖励。
          </p>

          <Button
            variant="danger"
            size="lg"
            className="w-full"
            leftIcon={<Lightning size={20} weight="fill" />}
            rightIcon={<ArrowRight size={16} weight="bold" />}
            onClick={() => onChoose("overclock")}
          >
            进入超频极限
          </Button>

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            leftIcon={<Skull size={20} />}
            onClick={() => onChoose("continue")}
          >
            继续普通生存
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
