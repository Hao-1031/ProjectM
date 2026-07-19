import Layout from "@/components/Layout";
import { useAppStore } from "@/lib/store";

export default function SettingsPage() {
  const {
    settings,
    setAudioEnabled,
    setVolume,
    setBgmVolume,
    setVibrationEnabled,
    setReducedMotion,
  } = useAppStore();

  return (
    <Layout title="系统设置">
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        <h2 className="text-3xl font-bold">系统设置</h2>
        <p className="mt-1 text-muted">所有设置均保存在本地，不会上传</p>

        <div className="mt-8 space-y-4 rounded-2xl border border-border bg-panel p-6">
          <label className="flex items-center justify-between">
            <span>音效</span>
            <input
              type="checkbox"
              checked={settings.audioEnabled}
              onChange={(e) => setAudioEnabled(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
          </label>

          <div>
            <div className="flex justify-between text-sm">
              <span>音量</span>
              <span className="font-mono text-muted">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => setVolume(Number.parseFloat(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span>背景音乐</span>
              <span className="font-mono text-muted">{Math.round(settings.bgmVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.bgmVolume}
              onChange={(e) => setBgmVolume(Number.parseFloat(e.target.value))}
              className="mt-2 w-full accent-primary"
            />
          </div>

          <label className="flex items-center justify-between">
            <span>震动反馈</span>
            <input
              type="checkbox"
              checked={settings.vibrationEnabled}
              onChange={(e) => setVibrationEnabled(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
          </label>

          <label className="flex items-center justify-between">
            <span>减少动画</span>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
          </label>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-panel p-4 text-sm text-muted">
          <p>提示：减少动画会遵循系统 prefers-reduced-motion 设置，并弱化界面转场效果。</p>
        </div>
      </div>
    </Layout>
  );
}
