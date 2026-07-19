import Layout from "@/components/Layout";
import SettingsPanel from "@/components/SettingsPanel";
import FeatureCard from "@/components/FeatureCard";
import { motion, useReducedMotion } from "framer-motion";
import { HardDrives, PersonSimpleRun, Ear } from "@phosphor-icons/react";

export default function SettingsPage() {
  const reducedMotion = useReducedMotion();

  return (
    <Layout title="系统设置">
      <div className="relative mx-auto max-w-5xl px-4 pt-10 md:pt-16">
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid gap-10 md:grid-cols-12"
        >
          <div className="md:col-span-4">
            <span className="inline-block rounded bg-primary/10 px-2 py-1 font-mono text-xs uppercase tracking-widest text-primary">
              系统设置
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-[1.1] tracking-tight md:text-4xl">
              音频、画质与偏好。
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              所有设置仅保存在本地浏览器。切换设备不会同步，清理浏览器数据将重置这些选项。
            </p>
          </div>

          <div className="md:col-span-8">
            <SettingsPanel />

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <FeatureCard
                icon={<HardDrives size={22} weight="bold" className="text-primary" />}
                title="本地存储"
                description="设置与存档使用浏览器本地存储，不上传服务器。"
                variant="muted"
              />
              <FeatureCard
                icon={<PersonSimpleRun size={22} weight="bold" className="text-warning" />}
                title="减少动画"
                description="启用后会弱化界面转场，并尊重系统 prefers-reduced-motion。"
                variant="muted"
              />
              <FeatureCard
                icon={<Ear size={22} weight="bold" className="text-accent" />}
                title="音频独立控制"
                description="音效、背景音乐与主音量可分别调节，随时静音。"
                variant="muted"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
