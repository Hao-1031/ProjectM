import Layout from "@/components/Layout";

export default function LeaderboardPage() {
  return (
    <Layout title="排行榜">
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-16 text-center md:py-24">
        <div className="rounded-2xl border border-border bg-panel p-8 md:p-12">
          <h2 className="text-3xl font-bold">排行榜</h2>
          <p className="mt-3 text-muted">第一版为纯本地体验，排行榜功能将在后续版本开放。</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Coming Soon
          </div>
        </div>
      </div>
    </Layout>
  );
}
