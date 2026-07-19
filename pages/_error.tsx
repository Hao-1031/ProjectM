import Link from "next/link";
import { motion } from "framer-motion";
import { Warning, House, ArrowClockwise } from "@phosphor-icons/react";

interface ErrorPageProps {
  statusCode?: number;
}

export default function ErrorPage({ statusCode }: ErrorPageProps) {
  const title = statusCode ? `错误 ${statusCode}` : "客户端错误";
  const message =
    statusCode === 404
      ? "目标页面未找到。"
      : statusCode
        ? "服务器处理请求时出现问题。"
        : "浏览器端发生未知错误，请刷新重试。";

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute left-1/4 top-0 h-full w-px bg-primary/20" />
        <div className="absolute left-2/3 top-0 h-full w-px bg-primary/10" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-primary/10" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-panel p-8 text-center shadow-2xl"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-danger/30 bg-danger/10">
          <Warning size={32} weight="bold" className="text-danger" />
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted">{message}</p>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-[var(--panel-raised)] focus-ring active:scale-95"
          >
            <House size={16} weight="bold" />
            返回指挥部
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-background transition-all hover:scale-[1.02] active:scale-95 focus-ring"
          >
            <ArrowClockwise size={16} weight="bold" />
            刷新页面
          </button>
        </div>
      </motion.div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: { res?: { statusCode: number }; err?: { statusCode?: number } }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
