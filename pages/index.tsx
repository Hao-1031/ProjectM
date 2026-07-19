import Link from "next/link";
import { useEffect, useState } from "react";
import { loadSave, type SaveData } from "@/lib/game/save";

export default function HomePage() {
  const [save, setSave] = useState<SaveData | null>(null);

  useEffect(() => {
    setSave(loadSave());
  }, []);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute left-1/4 top-0 h-full w-px bg-primary/30" />
        <div className="absolute left-2/3 top-0 h-full w-px bg-primary/20" />
        <div className="absolute left-0 top-1/3 h-px w-full bg-primary/20" />
        <div className="absolute left-0 top-3/4 h-px w-full bg-primary/10" />
      </div>

      <div className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col justify-between px-4 py-8 md:py-12">
        <header className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
              末世幸存者指挥终端
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight md:text-6xl">
              Project <span className="text-primary">M</span>
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted md:text-base">
              冷色调科技末日 · 自动射击 · 任务撤离
            </p>
          </div>
          <div className="hidden rounded border border-border bg-panel px-4 py-3 text-right md:block">
            <p className="font-mono text-xs text-muted">系统状态</p>
            <p className="text-sm font-medium text-success">在线</p>
          </div>
        </header>

        <section className="grid gap-4 py-8 md:grid-cols-12 md:grid-rows-2 md:gap-6">
          <Link
            href="/game"
            className="group relative col-span-12 flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-panel p-6 transition-all hover:border-primary/50 hover:bg-panel/80 focus-ring md:col-span-7 md:p-8"
          >
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-70" />
            <div>
              <span className="inline-block rounded bg-primary/10 px-2 py-1 font-mono text-xs text-primary">
                主要行动
              </span>
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">进入战场</h2>
              <p className="mt-2 max-w-md text-sm text-muted">
                移动 + 自动射击。完成 4 项任务后前往撤离点。支持键鼠与触屏操作。
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-primary">
              <span className="text-sm font-medium">立即部署</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>

          <Link
            href="/game?multiplayer=1"
            className="group relative col-span-12 flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-panel p-6 transition-all hover:border-accent/50 hover:bg-panel/80 focus-ring md:col-span-5 md:p-8"
          >
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent/10 blur-3xl transition-opacity group-hover:opacity-70" />
            <div>
              <span className="inline-block rounded bg-accent/10 px-2 py-1 font-mono text-xs text-accent">
                联机合作
              </span>
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">组队生存</h2>
              <p className="mt-2 max-w-md text-sm text-muted">
                P2P 直连。创建房间、局域网发现或好友邀请链接，与队友一起撤离。
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-accent">
              <span className="text-sm font-medium">创建或加入</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>

          <Link
            href="/base"
            className="group col-span-12 flex flex-col justify-between rounded-2xl border border-border bg-panel p-5 transition-all hover:border-accent/50 focus-ring md:col-span-5"
          >
            <div>
              <span className="font-mono text-xs text-accent">基地</span>
              <h3 className="mt-1 text-xl font-bold">幸存者基地</h3>
              <p className="text-sm text-muted">查看战绩、解锁武器与累计数据</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-mono text-2xl font-bold">{save?.totalRuns ?? 0}</span>
              <span className="text-xs text-muted">出战次数</span>
            </div>
          </Link>

          <Link
            href="/leaderboard"
            className="group col-span-12 flex flex-col justify-between rounded-2xl border border-border bg-panel p-5 transition-all hover:border-primary/50 focus-ring md:col-span-3"
          >
            <span className="font-mono text-xs text-primary">排行</span>
            <h3 className="mt-1 text-xl font-bold">排行榜</h3>
            <p className="text-sm text-muted">Coming Soon</p>
          </Link>

          <Link
            href="/settings"
            className="group col-span-12 flex flex-col justify-between rounded-2xl border border-border bg-panel p-5 transition-all hover:border-muted focus-ring md:col-span-2"
          >
            <span className="font-mono text-xs text-muted">系统</span>
            <h3 className="mt-1 text-xl font-bold">设置</h3>
          </Link>

          <div className="col-span-12 grid grid-cols-2 gap-4 md:col-span-7 md:grid-cols-3">
            <Link
              href="/about"
              className="rounded-xl border border-border bg-panel p-4 text-sm transition-colors hover:border-primary/40 focus-ring"
            >
              关于 Project M
            </Link>
            <Link
              href="/help"
              className="rounded-xl border border-border bg-panel p-4 text-sm transition-colors hover:border-primary/40 focus-ring"
            >
              操作指南
            </Link>
            <Link
              href="/game"
              className="rounded-xl border border-border bg-panel p-4 text-sm transition-colors hover:border-primary/40 focus-ring md:col-span-1"
            >
              快速重开
            </Link>
          </div>
        </section>

        <footer className="flex flex-col justify-between gap-4 border-t border-border pt-6 text-xs text-muted md:flex-row md:items-center">
          <div className="flex gap-4">
            <span>击杀累计: {save?.totalKills ?? 0}</span>
            <span>最佳击杀: {save?.bestRun?.stats.kills ?? 0}</span>
          </div>
          <p>数据仅存于本地浏览器 · 不上传服务器</p>
        </footer>
      </div>
    </div>
  );
}
