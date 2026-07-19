import Layout from "@/components/Layout";
import SettingsPanel from "@/components/SettingsPanel";

export default function SettingsPage() {
  return (
    <Layout title="系统设置">
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">系统设置</h2>
          <p className="mt-1 max-w-md text-sm text-muted">
            音频、震动、画质与无障碍偏好，全部仅保存在本地。
          </p>
        </div>

        <div className="mt-8">
          <SettingsPanel />
        </div>
      </div>
    </Layout>
  );
}
