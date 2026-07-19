import { motion, useReducedMotion } from "framer-motion";
import {
  Target,
  Shield,
  Heart,
  Wrench,
  Lightning,
  Crosshair,
  CaretRight,
  Sparkle,
  Sword,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import { HERO_DEFS } from "@/lib/game/heroes";
import type { HeroTalent } from "@/lib/game/types";

const ICONS: Record<string, typeof Target> = {
  scout: Crosshair,
  assault: Shield,
  medic: Heart,
  engineer: Wrench,
};

const COLOR_RING: Record<string, string> = {
  scout: "ring-primary/40",
  assault: "ring-accent/40",
  medic: "ring-success/40",
  engineer: "ring-warning/40",
};

const BG_GLOW: Record<string, string> = {
  scout: "bg-primary/10",
  assault: "bg-accent/10",
  medic: "bg-success/10",
  engineer: "bg-warning/10",
};

function TalentCard({ talent, index }: { talent: HeroTalent; index: number }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="flex items-start gap-3 rounded-xl border border-border bg-panel/60 p-3"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-panel-raised text-xs font-bold text-muted">
        {index + 1}
      </span>
      <div>
        <p className="text-sm font-semibold">{talent.name}</p>
        <p className="text-xs leading-relaxed text-muted">{talent.description}</p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-muted">
          最高等级 {talent.maxLevel}
        </p>
      </div>
    </motion.div>
  );
}

export default function HeroesPage() {
  const reducedMotion = useReducedMotion();
  const heroes = Object.values(HERO_DEFS);

  return (
    <Layout title="英雄档案">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-20">
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-10 md:mb-16"
        >
          <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
            <Sparkle weight="duotone" size={14} />
            英雄档案
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
            据点防守作战单位
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            四位定位分明的英雄构成防守小队核心。侦察提供视野与暴击，突击吸收伤害，
            医疗维持战线，工程部署炮台与维修核心。
          </p>
        </motion.div>

        <div className="space-y-16 md:space-y-24">
          {heroes.map((hero, heroIndex) => {
            const Icon = ICONS[hero.id] ?? Target;
            const isEven = heroIndex % 2 === 0;
            return (
              <motion.section
                key={hero.id}
                initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className={`grid gap-8 md:grid-cols-12 md:items-start ${
                  isEven ? "" : "md:grid-flow-dense"
                }`}
              >
                <div
                  className={`md:col-span-5 ${
                    isEven ? "md:col-start-1" : "md:col-start-8"
                  }`}
                >
                  <div
                    className={`relative overflow-hidden rounded-2xl border border-border bg-panel p-6 ring-1 ${COLOR_RING[hero.id]} ${BG_GLOW[hero.id]}`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className="flex h-14 w-14 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${hero.color}18`, color: hero.color }}
                      >
                        <Icon size={32} weight="duotone" />
                      </span>
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight">{hero.name}</h2>
                        <p className="text-xs font-mono uppercase tracking-widest text-muted">
                          {hero.id === "scout" && "侦察 / 暴击支援"}
                          {hero.id === "assault" && "突击 / 正面抗压"}
                          {hero.id === "medic" && "医疗 / 持续续航"}
                          {hero.id === "engineer" && "工程 / 部署维修"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-5 text-sm leading-relaxed text-muted">
                      {hero.description}
                    </p>

                    <div className="mt-6 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Lightning size={16} weight="duotone" className="text-primary" />
                        <span className="font-medium">主动技能</span>
                        <span className="text-muted">-</span>
                        <span>{hero.skill.name}</span>
                      </div>
                      <p className="pl-6 text-xs leading-relaxed text-muted">
                        {hero.skill.description}，冷却 {hero.skill.cooldown}s，持续{" "}
                        {hero.skill.duration}s。
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <Sword size={16} weight="duotone" className="text-accent" />
                        <span className="font-medium">被动加成</span>
                      </div>
                      <ul className="space-y-1 pl-6 text-xs text-muted">
                        {hero.passive.maxHealthMul && (
                          <li className="flex items-center gap-1.5">
                            <CaretRight size={10} />
                            最大生命 +{Math.round((hero.passive.maxHealthMul - 1) * 100)}%
                          </li>
                        )}
                        {hero.passive.speedMul && (
                          <li className="flex items-center gap-1.5">
                            <CaretRight size={10} />
                            移动速度 +{Math.round((hero.passive.speedMul - 1) * 100)}%
                          </li>
                        )}
                        {hero.passive.armorAdd !== undefined && hero.passive.armorAdd > 0 && (
                          <li className="flex items-center gap-1.5">
                            <CaretRight size={10} />
                            护甲 +{Math.round(hero.passive.armorAdd * 100)}%
                          </li>
                        )}
                        {hero.passive.critAdd !== undefined && hero.passive.critAdd > 0 && (
                          <li className="flex items-center gap-1.5">
                            <CaretRight size={10} />
                            暴击率 +{Math.round(hero.passive.critAdd * 100)}%
                          </li>
                        )}
                        {hero.passive.regenAdd !== undefined && hero.passive.regenAdd > 0 && (
                          <li className="flex items-center gap-1.5">
                            <CaretRight size={10} />
                            生命回复 +{hero.passive.regenAdd}/s
                          </li>
                        )}
                        {hero.passive.cooldownReductionAdd !== undefined &&
                          hero.passive.cooldownReductionAdd > 0 && (
                            <li className="flex items-center gap-1.5">
                              <CaretRight size={10} />
                              冷却缩减 +{Math.round(hero.passive.cooldownReductionAdd * 100)}%
                            </li>
                          )}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className={`md:col-span-7 ${isEven ? "md:col-start-6" : "md:col-start-1"}`}>
                  <h3 className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
                    <Sparkle size={12} />
                    天赋树
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {hero.talents.map((talent, index) => (
                      <TalentCard key={talent.id} talent={talent} index={index} />
                    ))}
                  </div>
                </div>
              </motion.section>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
