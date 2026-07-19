import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import SectionHeader from "@/components/SectionHeader";
import FeatureCard from "@/components/FeatureCard";
import { useReducedMotion } from "framer-motion";
import {
  Keyboard,
  DeviceMobile,
  Crosshair,
  Flag,
  Sword,
  Heart,
  Cube,
  Star,
  Check,
  GameController,
  Target,
} from "@phosphor-icons/react";
import { HERO_DEFS } from "@/lib/game/heroes";
import { getModeList } from "@/lib/game/modes";
import { DEFAULT_BALANCE, PASSIVE_BALANCE_DEFS } from "@/lib/game/balance";

const sections = [
  { id: "controls", label: "基本操作", icon: Keyboard },
  { id: "missions", label: "任务与撤离", icon: Flag },
  { id: "modes", label: "作战模式", icon: Crosshair },
  { id: "heroes", label: "英雄与技能", icon: GameController },
  { id: "progression", label: "成长与掉落", icon: Star },
  { id: "tips", label: "实战技巧", icon: Target },
];

const controls = [
  { keys: "W A S D / 方向键", action: "移动角色，躲避敌人和危险区域" },
  { keys: "鼠标 / 触屏拖动", action: "调整朝向；武器会自动瞄准最近目标" },
  { keys: "Esc / P", action: "暂停或继续游戏" },
  { keys: "触屏虚拟摇杆", action: "在移动设备上控制移动方向" },
];

const tips = [
  {
    title: "不要站桩",
    description: "武器自动射击，你的主要操作是走位。保持移动能显著降低被包围的概率。",
  },
  {
    title: "优先完成当前任务",
    description: "战役模式的撤离点只会在 4 项任务完成后激活，不要为了清怪偏离目标。",
  },
  {
    title: "利用英雄技能",
    description: "侦察信标提升团队暴击，冲锋护盾阻挡弹幕，治疗无人机和炮塔能改变据点防守的局势。",
  },
  {
    title: "升级要有侧重",
    description: "近战武器优先堆范围和冷却，远程武器优先伤害与穿透，根据当前敌群类型调整。",
  },
];

export default function HelpPage() {
  const [active, setActive] = useState("controls");
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
  };

  const missions = DEFAULT_BALANCE.modes.campaignMissions;
  const modes = getModeList();
  const heroes = Object.values(HERO_DEFS);
  const passives = PASSIVE_BALANCE_DEFS;

  return (
    <Layout title="操作指南">
      <div className="relative mx-auto max-w-7xl px-4 pt-10 md:pt-16">
        <div className="grid gap-8 md:grid-cols-12">
          <aside className="md:col-span-3">
            <div className="sticky top-24 space-y-1">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">目录</p>
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = active === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollTo(section.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all focus-ring ${
                      isActive
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted hover:bg-panel hover:text-foreground"
                    }`}
                  >
                    <Icon size={16} weight={isActive ? "bold" : "regular"} />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="space-y-20 md:col-span-9 md:space-y-28">
            <section id="controls">
              <SectionHeader title="基本操作" />
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {controls.map((item) => (
                  <FeatureCard
                    key={item.keys}
                    icon={<Keyboard size={22} weight="bold" className="text-primary" />}
                    title={item.keys}
                    description={item.action}
                    variant="muted"
                  />
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-border bg-panel p-5 text-sm text-muted">
                <div className="flex items-start gap-3">
                  <DeviceMobile size={20} className="mt-0.5 shrink-0 text-accent" />
                  <p>
                    在触屏设备上，左下角虚拟摇杆控制移动；角色会自动朝敌人方向开火。无需额外瞄准按钮。
                  </p>
                </div>
              </div>
            </section>

            <section id="missions">
              <SectionHeader title="任务与撤离" />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {missions.map((mission) => (
                  <FeatureCard
                    key={mission.type}
                    icon={<Flag size={22} weight="bold" className="text-accent" />}
                    title={mission.title}
                    description={mission.description}
                    meta={mission.timeLimit ? `限时 ${mission.timeLimit} 秒` : undefined}
                    variant="accent"
                  />
                ))}
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border bg-panel p-5">
                  <Check size={20} weight="bold" className="text-success" />
                  <p className="mt-3 font-semibold">完成任务</p>
                  <p className="mt-1 text-xs text-muted">
                    每局 4 个随机顺序任务，完成后撤离点激活。
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-panel p-5">
                  <Crosshair size={20} weight="bold" className="text-primary" />
                  <p className="mt-3 font-semibold">进入撤离点</p>
                  <p className="mt-1 text-xs text-muted">抵达撤离区域并存活至倒计时结束。</p>
                </div>
                <div className="rounded-2xl border border-border bg-panel p-5">
                  <Heart size={20} weight="bold" className="text-danger" />
                  <p className="mt-3 font-semibold">生命归零</p>
                  <p className="mt-1 text-xs text-muted">受到过多伤害或撤离超时即判定失败。</p>
                </div>
              </div>
            </section>

            <section id="modes">
              <SectionHeader title="作战模式" />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {modes.map((mode) => (
                  <FeatureCard
                    key={mode.type}
                    icon={<Crosshair size={22} weight="bold" className="text-primary" />}
                    title={mode.name}
                    description={mode.description}
                    variant="muted"
                  />
                ))}
              </div>
            </section>

            <section id="heroes">
              <SectionHeader title="英雄与技能" />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {heroes.map((hero) => {
                  const passiveLabels = Object.entries(hero.passive).map(([key, value]) => {
                    const map: Record<string, string> = {
                      maxHealthMul: "生命系数",
                      speedMul: "速度系数",
                      armorAdd: "护甲加成",
                      critAdd: "暴击加成",
                      regenAdd: "恢复加成",
                      cooldownReductionAdd: "冷却缩减",
                      areaMul: "范围系数",
                    };
                    return `${map[key] ?? key} ${value}`;
                  });
                  return (
                    <FeatureCard
                      key={hero.id}
                      icon={
                        <div
                          className="h-8 w-8 rounded-lg"
                          style={{
                            backgroundColor: `${hero.color}20`,
                            border: `1px solid ${hero.color}40`,
                          }}
                        >
                          <div
                            className="m-2 h-4 w-4 rounded-full"
                            style={{ backgroundColor: hero.color }}
                          />
                        </div>
                      }
                      title={hero.name}
                      description={hero.description}
                      meta={hero.skill.name}
                      variant="muted"
                    >
                      <div className="mt-3 space-y-2 text-xs text-muted">
                        <p>
                          <span className="text-foreground">主动技能：</span>
                          {hero.skill.description}（冷却 {hero.skill.cooldown} 秒）
                        </p>
                        <p>
                          <span className="text-foreground">被动：</span>
                          {passiveLabels.join("，")}
                        </p>
                      </div>
                    </FeatureCard>
                  );
                })}
              </div>
            </section>

            <section id="progression">
              <SectionHeader title="成长与掉落" />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <FeatureCard
                  icon={<Cube size={22} weight="bold" className="text-success" />}
                  title="拾取资源"
                  description="击杀敌人后掉落经验（青色）、资源（橙色）与生命（绿色）。经验用于升级，资源用于局内商店与事件。"
                  variant="muted"
                />
                <FeatureCard
                  icon={<Sword size={22} weight="bold" className="text-primary" />}
                  title="升级选项"
                  description="每次升级可从武器强化或属性被动中选择一项。武器满级后仍可获得被动加成。"
                  variant="muted"
                />
              </div>
              <div className="mt-6">
                <h3 className="mb-4 text-lg font-semibold">可用被动</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {passives.map((passive) => (
                    <div
                      key={passive.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-panel p-4 transition-colors hover:bg-panel-raised"
                    >
                      <div
                        className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: passive.color }}
                      />
                      <div>
                        <p className="text-sm font-medium">{passive.name}</p>
                        <p className="mt-0.5 text-xs text-muted">{passive.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="tips">
              <SectionHeader title="实战技巧" />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {tips.map((tip) => (
                  <FeatureCard
                    key={tip.title}
                    icon={<Target size={22} weight="bold" className="text-accent" />}
                    title={tip.title}
                    description={tip.description}
                    variant="accent"
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
