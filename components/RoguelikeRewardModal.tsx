import type { RoguelikeRewardBalance } from "@/lib/game/balance";

interface RoguelikeRewardModalProps {
  options: RoguelikeRewardBalance[];
  onSelect: (rewardId: string) => void;
}

export default function RoguelikeRewardModal({ options, onSelect }: RoguelikeRewardModalProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-panel p-6 shadow-2xl sm:p-8">
        <h2 className="text-center text-2xl font-bold">补给站</h2>
        <p className="mt-2 text-center text-sm text-muted">选择一项强化以继续探索</p>
        <div className="mt-6 space-y-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className="w-full rounded-xl border border-border bg-background/50 p-4 text-left transition-colors hover:border-primary hover:bg-panel focus-ring"
            >
              <div className="font-bold text-foreground">{option.name}</div>
              <div className="mt-1 text-xs text-muted">{option.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
