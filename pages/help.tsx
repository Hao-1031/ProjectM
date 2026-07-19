import Layout from "@/components/Layout";

export default function HelpPage() {
  return (
    <Layout title="操作指南">
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <h2 className="text-3xl font-bold">操作指南</h2>

        <section className="mt-8 rounded-2xl border border-border bg-panel p-6">
          <h3 className="text-xl font-bold">基本操作</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <span className="font-mono text-foreground">WASD / 方向键</span>：移动角色
            </li>
            <li>
              <span className="font-mono text-foreground">触屏拖动</span>：虚拟摇杆移动
            </li>
            <li>
              <span className="font-mono text-foreground">Esc / P</span>：暂停 / 继续
            </li>
            <li>武器会自动瞄准并射击最近的敌人</li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-panel p-6">
          <h3 className="text-xl font-bold">任务与撤离</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>每局包含 4 个随机顺序的任务：清剿、坚守、回收、营救。</li>
            <li>完成任务后，新任务或最终撤离点会自动标记在地图上。</li>
            <li>进入撤离点即可胜利；撤离倒计时结束则失败。</li>
            <li>角色生命归零也会失败。</li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-panel p-6">
          <h3 className="text-xl font-bold">成长与掉落</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>击杀敌人掉落经验（青色）、资源（橙色）与生命（绿色）。</li>
            <li>拾取经验升级后，可从武器升级或属性强化中选择一项。</li>
            <li>通关一次后，额外武器会在升级选项中解锁。</li>
          </ul>
        </section>
      </div>
    </Layout>
  );
}
