import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import StatCard from "@/components/StatCard";
import FeatureCard from "@/components/FeatureCard";
import { motion, useReducedMotion } from "framer-motion";
import {
  Crosshair,
  Skull,
  Sword,
  Target,
  Trophy,
  Check,
  Lock,
  ArrowsOut,
  Scan,
  Rocket,
  Fire,
  Drone,
  Play,
} from "@phosphor-icons/react";
import { loadSave, type SaveData } from "@/lib/game/save";
import { formatTime } from "@/lib/game/math";
import { HERO_DEFS } from "@/lib/game/heroes";
import { DEFAULT_BALANCE } from "@/lib/game/balance";
import type { WeaponId } from "@/lib/game/types";

const weaponIcons: Record<string, React.ComponentType<any>> = {
  pulse: Crosshair,
  shotgun: ArrowsOut,
  laser: Scan,
  rocket: Rocket,
  flame: Fire,
  drone: Drone,
};

const modeNames: Record<string, string> = {
  campaign: "战役模式",
  endless: "无尽生存",
  daily: "每日挑战",
  roguelike: "冒险模式",
  defense: "据点防守",
};

export default function BasePage() {
  const [save, setSave] = useState<SaveData | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const best = save?.bestRun;
  const heroes = Object.values(HERO_DEFS);
  const weapons = Object.entries(DEFAULT_BALANCE.weapons).map(([id, cfg]) => ({
    id: id as WeaponId,
    name: cfg.name,
    description: cfg.description,
    color: cfg.color,
    unlocked: save?.unlockedWeapons.includes(id as WeaponId) ?? false,
  }));

  return (
    <Layout title="幸存者基地">
      <div className="relative mx-auto max-w-7xl px-4 pt-10 md:pt-16">
        <div className="grid gap-10 md:grid-cols-12">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="md:col-span-4"
          >
            <span className="inline-block rounded bg-success/10 px-2 py-1 font-mono text-xs uppercase tracking-widest text-success">
              幸存者基地
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
              战绩、武器与英雄。
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted md:text-base">
              这里是你在废墟中积累的一切：累计数据、最佳撤离记录、已解锁武器与可用英雄。
            </p>
            <div className="mt-8">
              <Link
                href="/game"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-background shadow-lg shadow-primary/15 transition-all hover:bg-primary/90 focus-ring active:scale-95"
              >
                <Play size={18} weight="fill" />
                <span className="whitespace-nowrap">再次部署</span>
              </Link>
            </div>
          </motion.div>

          <div className="md:col-span-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                value={save?.totalRuns ?? 0}
                label="总出战次数"
                icon={<Target size={20} />}
                variant="primary"
              />
              <StatCard
                value={save?.totalKills ?? 0}
                label="累计击杀"
                icon={<Skull size={20} />}
                variant="muted"
              />
              <StatCard
                value={best?.stats.kills ?? 0}
                label="最佳击杀"
                icon={<Trophy size={20} />}
                variant="accent"
              />
              <StatCard
                value={best?.stats.bossesKilled ?? 0}
                label="首领击杀"
                icon={<Sword size={20} />}
                variant="success"
              />
            </div>

            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-panel p-6"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
              <p className="relative font-mono text-xs uppercase tracking-widest text-muted">
                最佳撤离记录
              </p>
              {best ? (
                <div className="relative mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted">结果</p>
                    <p
                      className={`mt-1 text-lg font-bold ${best.victory ? "text-success" : "text-danger"}`}
                    >
                      {best.victory ? "撤离成功" : "任务失败"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">模式</p>
                    <p className="mt-1 text-lg font-bold">{modeNames[best.mode] ?? best.mode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">存活时间</p>
                    <p className="mt-1 font-mono text-lg font-bold">{formatTime(best.elapsed)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">完成任务</p>
                    <p className="mt-1 text-lg font-bold">{best.completedMissions}</p>
                  </div>
                </div>
              ) : (
                <p className="relative mt-4 text-sm text-muted">
                  暂无最佳记录。完成第一次部署后，这里会显示你的个人巅峰。
                </p>
              )}
            </motion.div>
          </div>
        </div>

        <section className="mt-20">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">已解锁武器</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {weapons.map((weapon) => {
              const Icon = weaponIcons[weapon.id] ?? Crosshair;
              return (
                <FeatureCard
                  key={weapon.id}
                  icon={
                    <Icon
                      size={24}
                      weight="bold"
                      className={weapon.unlocked ? "text-foreground" : "text-muted"}
                      style={weapon.unlocked ? { color: weapon.color } : undefined}
                    />
                  }
                  title={weapon.name}
                  description={weapon.unlocked ? weapon.description : "通关战役模式后解锁"}
                  meta={
                    weapon.unlocked ? (
                      <span className="inline-flex items-center gap-1 text-success">
                        <Check size={12} weight="bold" /> 已解锁
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted">
                        <Lock size={12} weight="bold" /> 锁定
                      </span>
                    )
                  }
                  variant={weapon.unlocked ? "primary" : "muted"}
                />
              );
            })}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">英雄档案</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {heroes.map((hero) => (
              <FeatureCard
                key={hero.id}
                icon={
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `${hero.color}20`,
                      border: `1px solid ${hero.color}40`,
                    }}
                  >
                    <Crosshair size={20} weight="bold" style={{ color: hero.color }} />
                  </div>
                }
                title={hero.name}
                description={hero.description}
                meta={hero.skill.name}
                variant="muted"
              >
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                  <span className="rounded-md border border-border bg-background px-2 py-1">
                    冷却 {hero.skill.cooldown}s
                  </span>
                  <span className="rounded-md border border-border bg-background px-2 py-1">
                    持续 {hero.skill.duration}s
                  </span>
                </div>
              </FeatureCard>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
