import { useAppStore, type GraphicsQuality, type JoystickSize } from "@/lib/store";
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
  Crosshair,
  Target,
  Lightning,
  GameController,
  Sliders,
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
    setAimAssistEnabled,
    setAutoFireEnabled,
    setSmartSkillHintsEnabled,
    setJoystickSize,
    setJoystickOpacity,
    setHudScale,
  } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border border-border bg-panel p-4 shadow-2xl ${className}`}
    >
      <div className="grid gap-4 md:grid-cols-2">
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
                : "border-border bg-panel-raised text-muted hover:border-primary/30 hover:text-foreground"
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
                : "border-border bg-panel-raised text-muted hover:border-success/30 hover:text-foreground"
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
                : "border-border bg-panel-raised text-muted hover:border-warning/30 hover:text-foreground"
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
          <div className="mt-2 grid grid-cols-3 gap-2">
            {QUALITIES.map((q) => (
              <button
                key={q.value}
                type="button"
                onClick={() => setGraphicsQuality(q.value)}
                aria-pressed={settings.graphicsQuality === q.value}
                className={`rounded-xl border p-2 text-left transition-all focus-ring active:scale-95 ${
                  settings.graphicsQuality === q.value
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-panel-raised hover:border-primary/30"
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

        <section className="md:col-span-2">
          <div className="flex items-center gap-2">
            <GameController size={18} weight="bold" className="text-accent" />
            <h3 className="text-sm font-semibold">移动操控辅助</h3>
          </div>
          <p className="mt-1 text-xs text-muted">仅影响触屏设备，不影响键鼠操作</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <ToggleButton
              label="辅助瞄准"
              description="轻微磁性吸附"
              icon={<Crosshair size={18} weight="bold" className="text-primary" />}
              pressed={settings.aimAssistEnabled}
              onClick={() => setAimAssistEnabled(!settings.aimAssistEnabled)}
            />
            <ToggleButton
              label="自动开火"
              description="进入射程自动射击"
              icon={<Target size={18} weight="bold" className="text-danger" />}
              pressed={settings.autoFireEnabled}
              onClick={() => setAutoFireEnabled(!settings.autoFireEnabled)}
            />
            <ToggleButton
              label="技能建议"
              description="高价值目标提示"
              icon={<Lightning size={18} weight="bold" className="text-warning" />}
              pressed={settings.smartSkillHintsEnabled}
              onClick={() => setSmartSkillHintsEnabled(!settings.smartSkillHintsEnabled)}
            />
          </div>
        </section>

        <section className="md:col-span-2">
          <div className="flex items-center gap-2">
            <Sliders size={18} weight="bold" className="text-success" />
            <h3 className="text-sm font-semibold">摇杆与 HUD</h3>
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="flex justify-between text-xs text-muted">
                <span>摇杆大小</span>
                <span className="font-mono">{settings.joystickSize}</span>
              </div>
              <div className="mt-2 flex gap-2">
                {(["small", "medium", "large"] as JoystickSize[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setJoystickSize(size)}
                    aria-pressed={settings.joystickSize === size}
                    className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-all focus-ring active:scale-95 ${
                      settings.joystickSize === size
                        ? "border-success/50 bg-success/10 text-success"
                        : "border-border bg-panel-raised text-muted hover:border-success/30"
                    }`}
                  >
                    {size === "small" ? "小" : size === "medium" ? "中" : "大"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted">
                <span>摇杆透明度</span>
                <span className="font-mono">{Math.round(settings.joystickOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={settings.joystickOpacity}
                onChange={(e) => setJoystickOpacity(Number.parseFloat(e.target.value))}
                className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded bg-border accent-success focus-ring"
                style={{ accentColor: "var(--success)" }}
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted">
                <span>HUD 缩放</span>
                <span className="font-mono">{Math.round(settings.hudScale * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.75}
                max={1.25}
                step={0.05}
                value={settings.hudScale}
                onChange={(e) => setHudScale(Number.parseFloat(e.target.value))}
                className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded bg-border accent-success focus-ring"
                style={{ accentColor: "var(--success)" }}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-panel-raised p-3 text-xs text-muted">
        <ArrowCounterClockwise size={16} weight="bold" className="mt-0.5 shrink-0 text-primary" />
        <p>设置会随当前设备保存。需要跨设备同步请手动导出备份。</p>
      </div>
    </motion.div>
  );
}

interface ToggleButtonProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  pressed: boolean;
  onClick: () => void;
}

function ToggleButton({ label, description, icon, pressed, onClick }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all focus-ring active:scale-95 ${
        pressed
          ? "border-primary/40 bg-primary/10"
          : "border-border bg-panel-raised hover:border-primary/30"
      }`}
    >
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-bold ${pressed ? "text-primary" : "text-foreground"}`}>{label}</div>
        <p className="text-[10px] text-muted">{description}</p>
      </div>
      <div
        className={`shrink-0 rounded-full border p-1 transition-colors ${
          pressed ? "border-primary bg-primary text-background" : "border-border text-muted"
        }`}
      >
        <Check size={12} weight="bold" className={`transition-transform ${pressed ? "scale-100" : "scale-0"}`} />
      </div>
    </button>
  );
}
