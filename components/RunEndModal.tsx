import { useRouter } from "next/router";
import type { RunResult } from "@/lib/game/types";
import { formatTime } from "@/lib/game/math";

interface RunEndModalProps {
  result: RunResult;
  onRestart: () => void;
  onExit?: () => void;
}

export default function RunEndModal({ result, onRestart, onExit }: RunEndModalProps) {
  const router = useRouter();

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-border bg-panel p-8 text-center shadow-2xl">
        <h2 className={`text-3xl font-bold ${result.victory ? "text-success" : "text-danger"}`}>
          {result.victory ? "撤离成功" : "任务失败"}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {result.victory ? "你已完成全部任务并安全撤离。" : "信号中断，等待下一次部署。"}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted">击杀</p>
            <p className="font-mono text-xl font-bold">{result.stats.kills}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted">存活时间</p>
            <p className="font-mono text-xl font-bold">{formatTime(result.elapsed)}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted">造成伤害</p>
            <p className="font-mono text-xl font-bold">{Math.floor(result.stats.damageDealt)}</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted">完成任务</p>
            <p className="font-mono text-xl font-bold">{result.completedMissions}</p>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={onRestart}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-background transition-transform hover:scale-105 focus-ring active:scale-95"
          >
            再次部署
          </button>
          <button
            onClick={onExit ?? (() => router.push("/"))}
            className="rounded-lg border border-border px-6 py-3 text-sm transition-colors hover:bg-panel focus-ring active:scale-95"
          >
            返回指挥部
          </button>
        </div>
      </div>
    </div>
  );
}
