import Layout from "@/components/Layout";

export default function AboutPage() {
  return (
    <Layout title="关于">
      <article className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <h2 className="text-3xl font-bold">关于 Project M</h2>
        <p className="mt-4 text-muted">
          Project M 是一款冷色调科技末日风格的 Rogue-lite
          幸存者游戏。玩家只需控制移动，武器会自动索敌射击。在有限的时间内完成清剿、坚守、回收与营救任务，最终抵达撤离点。
        </p>

        <section className="mt-8 rounded-2xl border border-border bg-panel p-6">
          <h3 className="text-xl font-bold">技术栈</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
            <li>Next.js Pages Router + React + TypeScript</li>
            <li>原生 HTML5 Canvas 游戏渲染</li>
            <li>Zustand 状态管理</li>
            <li>Howler.js 程序化音效</li>
            <li>next-pwa 离线支持</li>
            <li>Sentry 错误监控</li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-panel p-6">
          <h3 className="text-xl font-bold">隐私承诺</h3>
          <p className="mt-3 text-sm text-muted">
            你的所有游戏数据（存档、设置、战绩）仅保存在本地浏览器中。Project M
            不会收集、出售或上传任何个人数据。Sentry 仅用于捕获运行时错误，不包含可识别个人信息。
          </p>
        </section>
      </article>
    </Layout>
  );
}
