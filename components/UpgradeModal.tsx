import type { UpgradeOption } from "@/lib/game/types";

interface UpgradeModalProps {
  options: UpgradeOption[];
  onSelect: (option: UpgradeOption) => void;
}

function typeLabel(type: UpgradeOption["type"]) {
  switch (type) {
    case "weapon":
      return "武器";
    case "passive":
      return "被动";
    default:
      return "属性";
  }
}

export default function UpgradeModal({ options, onSelect }: UpgradeModalProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 rounded-2xl border border-border bg-panel p-6 shadow-2xl duration-200 md:p-8">
        <h2 className="text-center text-2xl font-bold">升级选择</h2>
        <p className="mt-1 text-center text-sm text-muted">选择一项强化以继续战斗</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option)}
              className="group flex flex-col items-start rounded-xl border border-border bg-background p-5 text-left transition-all hover:-translate-y-1 hover:border-primary/60 hover:bg-panel hover:shadow-lg hover:shadow-primary/10 focus-ring active:scale-95"
            >
              <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary transition-colors group-hover:bg-primary/20">
                {typeLabel(option.type)}
              </span>
              <h3 className="mt-3 text-lg font-bold">{option.name}</h3>
              <p className="mt-1 flex-1 text-sm text-muted">{option.description}</p>
              {option.level > 0 && (
                <p className="mt-3 font-mono text-xs text-muted">
                  Lv.{option.level} / {option.maxLevel}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
