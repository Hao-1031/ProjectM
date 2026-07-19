import { useAppStore, type GraphicsQuality } from "@/lib/store";
import { motion } from "framer-motion";
import {
  SpeakerHigh,
  SpeakerX,
  MusicNotes,
  Vibrate,
  PersonSimpleRun,
  Monitor,
  ArrowCounterClockwise,
  Check,
} from "@phosphor-icons/react";

const QUALITIES: { value: GraphicsQuality; label: string; description: string }[] = [
  { value: "high", label: "高", description: "全粒子与后期效果" },
  { value: "medium", label: "中", description: "平衡性能与画质" },
  { value: "low", label: "低", description: "优先流畅度" },
];

export interface SettingsPanelProps {
  className?: string;
}

export default function SettingsPanel({ className = "" }: SettingsPanelProps) {
  const {
    settings,
    setAudioEnabled,
    setVolume,
    setBgmVolume,
    setVibrationEnabled,
    setReducedMotion,
    setGraphicsQuality,
  } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border border-border bg-panel p-5 shadow-2xl md:p-6 ${className}`}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <div className="flex items-center gap-2">
            {settings.audioEnabled ? (
              <SpeakerHigh size={18} weight="bold" className="text-primary" />
            ) : (
              <SpeakerX size={18} weight="bold" className="text-muted" />
            )}
            <h3 className="text-sm font-semibold">音效</h3>
          </div>
          <p className="mt-1 text-xs text-muted">开关所有战斗与环境音效</p>
          <button
            type="button"
            onClick={() => setAudioEnabled(!settings.audioEnabled)}
            aria-pressed={settings.audioEnabled}
            className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all focus-ring active:scale-95 ${
              settings.audioEnabled
                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
                : "border-border bg-[var(--panel-raised)] text-muted hover:border-primary/30 hover:text-foreground"
            }`}
          >
            <Check
              size={14}
              weight="bold"
              className={`transition-transform ${settings.audioEnabled ? "scale-100" : "scale-0"}`}
            />
            {settings.audioEnabled ? "已开启" : "已关闭"}
          </button>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <MusicNotes size={18} weight="bold" className="text-accent" />
            <h3 className="text-sm font-semibold">背景音乐</h3>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted">
              <span>BGM 音量</span>
              <span className="font-mono">{Math.round(settings.bgmVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.bgmVolume}
              onChange={(e) => setBgmVolume(Number.parseFloat(e.target.value))}
              className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded bg-border accent-primary focus-ring"
              style={{ accentColor: "var(--primary)" }}
            />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <SpeakerHigh size={18} weight="bold" className="text-primary" />
            <h3 className="text-sm font-semibold">主音量</h3>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted">
              <span>总体音量</span>
              <span className="font-mono">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => setVolume(Number.parseFloat(e.target.value))}
              className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded bg-border accent-primary focus-ring"
              style={{ accentColor: "var(--primary)" }}
            />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <Vibrate
              size={18}
              weight="bold"
              className={settings.vibrationEnabled ? "text-success" : "text-muted"}
            />
            <h3 className="text-sm font-semibold">震动反馈</h3>
          </div>
          <p className="mt-1 text-xs text-muted">受击、任务完成与撤离就绪时震动</p>
          <button
            type="button"
            onClick={() => setVibrationEnabled(!settings.vibrationEnabled)}
            aria-pressed={settings.vibrationEnabled}
            className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all focus-ring active:scale-95 ${
              settings.vibrationEnabled
                ? "border-success/40 bg-success/10 text-success hover:bg-success/15"
                : "border-border bg-[var(--panel-raised)] text-muted hover:border-success/30 hover:text-foreground"
            }`}
          >
            <Check
              size={14}
              weight="bold"
              className={`transition-transform ${settings.vibrationEnabled ? "scale-100" : "scale-0"}`}
            />
            {settings.vibrationEnabled ? "已开启" : "已关闭"}
          </button>
        </section>

        <section className="md:col-span-2">
          <div className="flex items-center gap-2">
            <PersonSimpleRun size={18} weight="bold" className="text-warning" />
            <h3 className="text-sm font-semibold">减少动画</h3>
          </div>
          <p className="mt-1 text-xs text-muted">
            弱化界面转场，并尊重系统 prefers-reduced-motion 设置
          </p>
          <button
            type="button"
            onClick={() => setReducedMotion(!settings.reducedMotion)}
            aria-pressed={settings.reducedMotion}
            className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all focus-ring active:scale-95 ${
              settings.reducedMotion
                ? "border-warning/40 bg-warning/10 text-warning hover:bg-warning/15"
                : "border-border bg-[var(--panel-raised)] text-muted hover:border-warning/30 hover:text-foreground"
            }`}
          >
            <Check
              size={14}
              weight="bold"
              className={`transition-transform ${settings.reducedMotion ? "scale-100" : "scale-0"}`}
            />
            {settings.reducedMotion ? "已启用" : "跟随系统"}
          </button>
        </section>

        <section className="md:col-span-2">
          <div className="flex items-center gap-2">
            <Monitor size={18} weight="bold" className="text-primary" />
            <h3 className="text-sm font-semibold">画面质量</h3>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {QUALITIES.map((q) => (
              <button
                key={q.value}
                type="button"
                onClick={() => setGraphicsQuality(q.value)}
                aria-pressed={settings.graphicsQuality === q.value}
                className={`rounded-xl border p-3 text-left transition-all focus-ring active:scale-95 ${
                  settings.graphicsQuality === q.value
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-[var(--panel-raised)] hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-bold ${settings.graphicsQuality === q.value ? "text-primary" : "text-foreground"}`}
                  >
                    {q.label}
                  </span>
                  {settings.graphicsQuality === q.value && (
                    <Check size={14} weight="bold" className="text-primary" />
                  )}
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-muted">{q.description}</p>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-border bg-[var(--panel-raised)] p-3 text-xs text-muted">
        <ArrowCounterClockwise size={16} weight="bold" className="mt-0.5 shrink-0 text-primary" />
        <p>所有设置均保存在本地浏览器，切换设备不会同步。</p>
      </div>
    </motion.div>
  );
}
