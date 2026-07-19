import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { loadSave, type SaveData } from "@/lib/game/save";
import { formatTime } from "@/lib/game/math";

export default function BasePage() {
  const [save, setSave] = useState<SaveData | null>(null);

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const best = save?.bestRun;

  return (
    <Layout title="幸存者基地">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">幸存者基地</h2>
          <p className="mt-1 text-muted">战绩、解锁与累计数据全部保存在本地</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-panel p-6">
            <p className="font-mono text-xs text-muted">总出战次数</p>
            <p className="mt-2 text-4xl font-bold">{save?.totalRuns ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-border bg-panel p-6">
            <p className="font-mono text-xs text-muted">累计击杀</p>
            <p className="mt-2 text-4xl font-bold">{save?.totalKills ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-border bg-panel p-6">
            <p className="font-mono text-xs text-muted">最佳战绩击杀</p>
            <p className="mt-2 text-4xl font-bold">{best?.stats.kills ?? 0}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-panel p-6">
            <h3 className="text-xl font-bold">最佳记录</h3>
            {best ? (
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <dt className="text-muted">结果</dt>
                  <dd className={best.victory ? "text-success" : "text-danger"}>
                    {best.victory ? "撤离成功" : "任务失败"}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <dt className="text-muted">存活时间</dt>
                  <dd className="font-mono">{formatTime(best.elapsed)}</dd>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <dt className="text-muted">造成伤害</dt>
                  <dd className="font-mono">{Math.floor(best.stats.damageDealt)}</dd>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <dt className="text-muted">完成任务</dt>
                  <dd className="font-mono">{best.completedMissions}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm text-muted">暂无记录，开始你的第一次部署。</p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-panel p-6">
            <h3 className="text-xl font-bold">已解锁武器</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
                <span className="font-bold text-primary">脉冲步枪</span>
                <span className="text-xs text-muted">初始装备</span>
              </li>
              <li
                className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                  save?.unlockedWeapons.includes("shotgun")
                    ? "border-border bg-background"
                    : "border-border/50 bg-panel/50 text-muted"
                }`}
              >
                <span className="font-bold text-accent">霰弹爆破</span>
                <span className="text-xs">
                  {save?.unlockedWeapons.includes("shotgun") ? "已解锁" : "通关后解锁"}
                </span>
              </li>
              <li
                className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                  save?.unlockedWeapons.includes("laser")
                    ? "border-border bg-background"
                    : "border-border/50 bg-panel/50 text-muted"
                }`}
              >
                <span className="font-bold text-purple-400">贯穿激光</span>
                <span className="text-xs">
                  {save?.unlockedWeapons.includes("laser") ? "已解锁" : "通关后解锁"}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
