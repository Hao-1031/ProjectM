"use client";

import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Shield, Skull, Radioactive, MapPin, ArrowRight, Sparkle,
  Users, Crosshair, Heartbeat, Gauge, Sword, ArrowsOut,
  Globe, Calendar, Warning, Atom, Fire, Lightning, Gear, Crown,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import NuclearBackground from "@/components/effects/NuclearBackground";

const LORE_CHAPTERS = [
  { id: "fall", title: "陨落", year: "2147", desc: "核冬天降临后的第三十年，地表被灰烬与辐射覆盖。城市沦为废墟，人类退回地下据点与移动堡垒。", icon: Radioactive },
  { id: "machines", title: "机械觉醒", year: "2151", desc: "旧时代自动防御网络在辐射干扰下失控。它们不再区分敌我，只遵循一个底层指令：清除所有移动目标。", icon: Skull },
  { id: "outpost", title: "最后据点", year: "2159", desc: "幸存者建立起以能量核心为中心的据点网络。每一座核心都是灯塔，也是磁铁，吸引着无尽敌潮。", icon: MapPin },
  { id: "commanders", title: "据点指挥官", year: "2163", desc: "你是指挥官。带领小队守护核心、回收资源、击退浪潮。据点若失守，人类的最后光点又将熄灭一座。", icon: Shield },
];

const FACTIONS = [
  { id: "survivors", name: "幸存者联盟", desc: "由各据点指挥官组成的松散联盟，共享资源与情报。你是联盟的第七位指挥官。", icon: Users, color: "#22d3ee" },
  { id: "engineers", name: "工程师议会", desc: "负责维护核心能量系统的技术团队，掌握着废土上最珍贵的技术遗产。", icon: Gear, color: "#f59e0b" },
  { id: "scouts", name: "侦察先锋", desc: "深入辐射区的前线部队，负责绘制地图、标记敌潮路线并回收战前科技。", icon: Crosshair, color: "#34d399" },
];

const WORLD_STATS = [
  { label: "幸存据点", value: "7", icon: MapPin, color: "#22d3ee" },
  { label: "已知敌人", value: "18", icon: Skull, color: "#f43f5e" },
  { label: "首领级威胁", value: "10", icon: Crown, color: "#b84a55" },
  { label: "英雄指挥官", value: "7", icon: Users, color: "#f59e0b" },
];

const HERO_IMAGE =
  "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Epic%20cinematic%20wasteland%20landscape%2C%20destroyed%20city%20silhouettes%20under%20stormy%20ash%20sky%2C%20glowing%20teal%20energy%20core%20in%20distant%20fortified%20outpost%2C%20radioactive%20dust%20and%20embers%2C%20muted%20teal%20and%20amber%20accent%20lights%2C%20low%20saturation%2C%20no%20text&image_size=landscape_16_9";

export default function WorldPage() {
  const reducedMotion = useReducedMotion();

  return (
    <Layout title="世界观">
      <Head>
        <title>Project M 旗舰版 - 世界观：灰烬纪元</title>
        <meta name="description" content="Project M 旗舰版世界观：核冬天后的废土、失控的机械防御网络与最后的人类据点。" />
      </Head>

      <div className="relative min-h-[100dvh]">
        <NuclearBackground />
        <div className="noise-overlay" />
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute -right-[15%] top-[5%] h-[55vh] w-[55vh] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute -left-[10%] bottom-[10%] h-[45vh] w-[45vh] rounded-full bg-secondary/5 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-3 md:py-6">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 md:mb-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
                  <Radioactive weight="duotone" size={14} />世界观
                </span>
                <h1 className="mt-2 text-[clamp(1.5rem,4vw,2.5rem)] font-bold leading-[0.95] tracking-tight">
                  灰烬纪元<br /><span className="text-gradient">最后据点</span>
                </h1>
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">
                  这不是一场战争，而是一场关于生存的漫长防守。核冬天后的废土上，每一座能量核心都是人类最后的灯塔。
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-3 md:grid-cols-12 md:grid-flow-dense">
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="md:col-span-7"
            >
              <div className="group relative overflow-hidden rounded-3xl border border-border bg-panel shadow-2xl shadow-black/20 transition-all hover:border-primary/30">
                <img src={HERO_IMAGE} alt="灰烬纪元：核冬天后的废土与最后据点" className="h-56 w-full object-cover md:h-72" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-panel via-panel/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">当前纪元</p>
                  <p className="text-2xl font-bold tracking-tight">灰烬纪元 2163</p>
                  <p className="mt-1 text-xs text-muted">核冬天后的第三十一年，人类最后的据点在废土上闪烁</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="md:col-span-5"
            >
              <div className="grid grid-cols-2 gap-2">
                {WORLD_STATS.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div key={stat.label}
                      initial={reducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.2 + index * 0.06 }}
                      className="relative overflow-hidden rounded-2xl border border-border bg-panel p-2.5 transition-all hover:border-primary/20 hover:bg-panel-raised">
                      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl opacity-20" style={{ backgroundColor: stat.color }} />
                      <div className="relative">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${stat.color}18`, color: stat.color }}>
                          <Icon size={16} weight="bold" />
                        </span>
                        <p className="mt-2 font-mono text-2xl font-bold tabular-nums tracking-tight">{stat.value}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted">{stat.label}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
                <Calendar size={12} weight="duotone" />时间线
              </span>
            </div>
            <div className="grid gap-2 md:grid-cols-4">
              {LORE_CHAPTERS.map((chapter, index) => {
                const Icon = chapter.icon;
                return (
                  <motion.div key={chapter.id}
                    initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.08 }}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-panel p-2.5 transition-all hover:border-primary/20 hover:bg-panel-raised">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-primary/20 transition-colors group-hover:bg-primary/40" />
                    <div className="relative">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon size={14} weight="bold" />
                        </span>
                        <span className="font-mono text-[10px] text-muted">{chapter.year}</span>
                      </div>
                      <h3 className="mt-1.5 text-sm font-bold tracking-tight">{chapter.title}</h3>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">{chapter.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
                <Users size={12} weight="duotone" />废土势力
              </span>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {FACTIONS.map((faction, index) => {
                const Icon = faction.icon;
                return (
                  <motion.div key={faction.id}
                    initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.08 }}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-panel p-2.5 transition-all hover:border-primary/20 hover:bg-panel-raised">
                    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-15 transition-opacity group-hover:opacity-30" style={{ backgroundColor: faction.color }} />
                    <div className="relative">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${faction.color}18`, color: faction.color }}>
                        <Icon size={16} weight="bold" />
                      </span>
                      <h3 className="mt-1.5 text-sm font-bold tracking-tight">{faction.name}</h3>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">{faction.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="relative mt-4 overflow-hidden rounded-3xl border border-border bg-panel p-4"
          >
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
            <div className="relative grid items-center gap-4 md:grid-cols-2">
              <div>
                <h2 className="text-lg font-bold tracking-tight">准备进入辐射区？</h2>
                <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">
                  据点正在等待指挥官。选择你的英雄，部署防线，在无尽敌潮中守护核心。
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
                <Link href="/game?mode=defense"
                  className="group relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-5 text-sm font-bold text-background shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 focus-ring active:scale-95">
                  <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
                  <Shield size={16} weight="bold" />
                  <span className="whitespace-nowrap">据点防守</span>
                </Link>
                <Link href="/heroes"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-panel px-5 text-sm font-semibold transition-all hover:border-primary/30 hover:bg-panel-raised focus-ring active:scale-95">
                  英雄档案
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}