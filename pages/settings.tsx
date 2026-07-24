import Layout from "@/components/Layout";
import SettingsPanel from "@/components/SettingsPanel";
import FeatureCard from "@/components/FeatureCard";
import { motion, useReducedMotion } from "framer-motion";
import { PersonSimpleRun, Ear, Trophy } from "@phosphor-icons/react";

export default function SettingsPage() {
  const reducedMotion = useReducedMotion();

  return (
    <Layout title="系统设置">
      <div className="relative mx-auto max-w-5xl px-4 py-4 md:py-6">
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid gap-4 md:grid-cols-12 md:gap-6"
        >
          <div className="md:col-span-4">
            <span className="inline-block rounded bg-primary/10 px-2 py-1 font-mono text-xs uppercase tracking-widest text-primary">
              系统设置
            </span>
            <h1 className="mt-2 text-2xl font-bold leading-[1.1] tracking-tight md:text-4xl">
              音频、画质与偏好。
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              调整音频、画质与可访问性偏好。设置会随当前设备保存。
            </p>
          </div>

          <div className="md:col-span-8">
            <SettingsPanel />

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <FeatureCard
                icon={<Trophy size={20} weight="bold" className="text-primary" />}
                title="公平竞技"
                description="无付费加成。所有武器、英雄与属性均通过游戏内战斗解锁。"
                variant="muted"
              />
              <FeatureCard
                icon={<PersonSimpleRun size={20} weight="bold" className="text-warning" />}
                title="减少动画"
                description="启用后会弱化界面转场，并尊重系统 prefers-reduced-motion。"
                variant="muted"
              />
              <FeatureCard
                icon={<Ear size={20} weight="bold" className="text-accent" />}
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
