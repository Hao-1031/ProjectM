import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { MagnifyingGlass, House, GameController } from "@phosphor-icons/react";

export default function NotFoundPage() {
  return (
    <Layout title="页面未找到" showNav={false}>
      <Head>
        <meta name="theme-color" content="#F5F2ED" />
      </Head>
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute left-1/3 top-0 h-full w-px bg-primary/20" />
          <div className="absolute left-2/3 top-0 h-full w-px bg-primary/10" />
          <div className="absolute left-0 top-1/3 h-px w-full bg-primary/10" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-lg"
        >
          <div className="station-panel orbital-scan station-glow p-8 shadow-2xl md:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="orbital-ring flex h-16 w-16 items-center justify-center">
                <MagnifyingGlass size={32} weight="bold" className="text-primary" />
              </div>
              <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">404 - 信号丢失</h1>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
                该坐标在地图上没有标记，可能已被感染者占领或从未存在。
              </p>

              <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/10 bg-panel-raised px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-panel focus-ring active:scale-95"
                >
                  <House size={16} weight="bold" />
                  返回指挥部
                </Link>
                <Link
                  href="/game"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-background transition-all hover:brightness-110 active:scale-95 focus-ring"
                >
                  <GameController size={16} weight="bold" />
                  直接部署
                </Link>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center font-mono text-xs tracking-wider text-muted">Project M · 公平竞技 · 无付费加成</p>
        </motion.div>
      </div>
    </Layout>
  );
}