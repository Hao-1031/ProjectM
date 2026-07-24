import { motion, useReducedMotion } from "framer-motion";
import {
  Snowflake,
  Butterfly,
  PawPrint,
  Lightning,
  Crosshair,
  CaretRight,
  Sparkle,
  Sword,
  Fire,
  Target,
  Skull,
  AirplaneTilt,
  CastleTurret,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import { HERO_DEFS } from "@/lib/game/heroes";
import type { HeroTalent } from "@/lib/game/types";

const ICONS: Record<string, typeof Snowflake> = {
  nitrogen: Snowflake,
  twilight: Butterfly,
  leopard: PawPrint,
  recon: Crosshair,
  viper: Skull,
  falcon: AirplaneTilt,
  bastion: CastleTurret,
};

const COLOR_RING: Record<string, string> = {
  nitrogen: "ring-primary/40",
  twilight: "ring-success/40",
  leopard: "ring-accent/40",
  recon: "ring-warning/40",
  viper: "ring-success/40",
  falcon: "ring-primary/40",
  bastion: "ring-accent/40",
};

const BG_GLOW: Record<string, string> = {
  nitrogen: "bg-primary/10",
  twilight: "bg-success/10",
  leopard: "bg-accent/10",
  recon: "bg-warning/10",
  viper: "bg-success/10",
  falcon: "bg-primary/10",
  bastion: "bg-accent/10",
};

function TalentCard({ talent, index }: { talent: HeroTalent; index: number }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="flex items-start gap-2 rounded-lg border border-border bg-panel/60 p-2"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-panel-raised text-[10px] font-bold text-muted">
        {index + 1}
      </span>
      <div>
        <p className="text-xs font-semibold">{talent.name}</p>
        <p className="text-[11px] leading-relaxed text-muted">{talent.description}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">
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
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-4 md:mb-5"
        >
          <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
            <Sparkle weight="duotone" size={14} />
            英雄档案
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-4xl">据点防守作战单位</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            七位定位分明的英雄构成防守小队核心。每位英雄都有改变战局的主动技能与终极技能。
          </p>
        </motion.div>

        <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory">
          {heroes.map((hero) => {
            const Icon = ICONS[hero.id] ?? Target;
            return (
              <motion.section
                key={hero.id}
                initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-[320px] flex-none snap-start md:w-[360px]"
              >
                <div className="grid h-full gap-2">
                  <div
                    className={`relative overflow-hidden rounded-2xl border border-border bg-panel p-3 ring-1 ${COLOR_RING[hero.id]} ${BG_GLOW[hero.id]}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${hero.color}18`, color: hero.color }}
                      >
                        <Icon size={22} weight="duotone" />
                      </span>
                      <div>
                        <h2 className="text-lg font-bold tracking-tight">{hero.name}</h2>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
                          {hero.role}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted">{hero.description}</p>

                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Lightning size={12} weight="duotone" className="text-primary" />
                        <span className="font-medium">主动技能</span>
                        <span className="text-muted">-</span>
                        <span>{hero.skill.name}</span>
                      </div>
                      <p className="pl-5 text-[11px] leading-relaxed text-muted">
                        {hero.skill.description}，冷却 {hero.skill.cooldown}s，持续{" "}
                        {hero.skill.duration}s。
                      </p>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Fire size={12} weight="duotone" className="text-danger" />
                        <span className="font-medium">终极技能</span>
                        <span className="text-muted">-</span>
                        <span>{hero.ultimate.name}</span>
                      </div>
                      <p className="pl-5 text-[11px] leading-relaxed text-muted">
                        {hero.ultimate.description}，冷却 {hero.ultimate.cooldown}s
                        {hero.ultimate.duration > 0 ? `，持续 ${hero.ultimate.duration}s。` : "。"}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Sword size={12} weight="duotone" className="text-accent" />
                        <span className="font-medium">被动加成</span>
                      </div>
                      <ul className="space-y-0.5 pl-5 text-[11px] text-muted">
                        {hero.passive.maxHealthMul && (
                          <li className="flex items-center gap-1">
                            <CaretRight size={8} />
                            最大生命 +{Math.round((hero.passive.maxHealthMul - 1) * 100)}%
                          </li>
                        )}
                        {hero.passive.speedMul && (
                          <li className="flex items-center gap-1">
                            <CaretRight size={8} />
                            移动速度 +{Math.round((hero.passive.speedMul - 1) * 100)}%
                          </li>
                        )}
                        {hero.passive.armorAdd !== undefined && hero.passive.armorAdd > 0 && (
                          <li className="flex items-center gap-1">
                            <CaretRight size={8} />
                            护甲 +{Math.round(hero.passive.armorAdd * 100)}%
                          </li>
                        )}
                        {hero.passive.critAdd !== undefined && hero.passive.critAdd > 0 && (
                          <li className="flex items-center gap-1">
                            <CaretRight size={8} />
                            暴击率 +{Math.round(hero.passive.critAdd * 100)}%
                          </li>
                        )}
                        {hero.passive.regenAdd !== undefined && hero.passive.regenAdd > 0 && (
                          <li className="flex items-center gap-1">
                            <CaretRight size={8} />
                            生命回复 +{hero.passive.regenAdd}/s
                          </li>
                        )}
                        {hero.passive.cooldownReductionAdd !== undefined &&
                          hero.passive.cooldownReductionAdd > 0 && (
                            <li className="flex items-center gap-1">
                              <CaretRight size={8} />
                              冷却缩减 +{Math.round(hero.passive.cooldownReductionAdd * 100)}%
                            </li>
                          )}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                      <Sparkle size={10} />
                      天赋树
                    </h3>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {hero.talents.map((talent, index) => (
                        <TalentCard key={talent.id} talent={talent} index={index} />
                      ))}
                    </div>
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
