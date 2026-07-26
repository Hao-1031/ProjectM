import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Shield, Skull, Radioactive, MapPin, ArrowRight } from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import NuclearBackground from "@/components/effects/NuclearBackground";

const LORE_CHAPTERS = [
  {
    id: "fall",
    title: "陨落",
    year: "2147",
    desc: "核冬天降临后的第三十年，地表被灰烬与辐射覆盖。城市沦为废墟，人类退回地下据点与移动堡垒。",
    icon: Radioactive,
  },
  {
    id: "machines",
    title: "机械觉醒",
    year: "2151",
    desc: "旧时代自动防御网络在辐射干扰下失控。它们不再区分敌我，只遵循一个底层指令：清除所有移动目标。",
    icon: Skull,
  },
  {
    id: "outpost",
    title: "最后据点",
    year: "2159",
    desc: "幸存者建立起以能量核心为中心的据点网络。每一座核心都是灯塔，也是 magnet，吸引着无尽敌潮。",
    icon: MapPin,
  },
  {
    id: "commanders",
    title: "据点指挥官",
    year: "2163",
    desc: "你是指挥官。带领小队守护核心、回收资源、击退浪潮。据点若失守，人类的最后光点又将熄灭一座。",
    icon: Shield,
  },
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

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-3 md:py-4">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-3 md:mb-4"
          >
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
              <Radioactive weight="duotone" size={14} />
              世界观
            </span>
            <h1 className="mt-2 text-xl font-bold tracking-tight md:text-3xl">
              灰烬纪元
              <span className="text-gradient"> · 最后据点</span>
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">
              这不是一场战争，而是一场关于生存的漫长防守。核冬天后的废土上，每一座能量核心都是人类最后的灯塔。
            </p>
          </motion.div>

          <div className="grid gap-3 lg:grid-cols-12">
            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-7"
            >
              <div className="relative overflow-hidden rounded-3xl border border-border bg-panel shadow-2xl shadow-black/20">
                <img
                  src={HERO_IMAGE}
                  alt="灰烬纪元：核冬天后的废土与最后据点"
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-panel via-panel/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">当前纪元</p>
                  <p className="text-2xl font-bold tracking-tight">灰烬纪元 2163</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={reducedMotion ? undefined : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-2 lg:col-span-5"
            >
              {LORE_CHAPTERS.map((chapter, index) => {
                const Icon = chapter.icon;
                return (
                  <div
                    key={chapter.id}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-panel p-3 transition-all hover:border-primary/20 hover:bg-panel-raised"
                  >
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                        <Icon size={16} weight="bold" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold tracking-tight">{chapter.title}</h3>
                          <span className="font-mono text-[10px] text-muted">{chapter.year}</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted">{chapter.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>

          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
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
                <Link
                  href="/game?mode=defense"
                  className="group relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-5 text-sm font-bold text-background shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 focus-ring active:scale-95"
                >
                  <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
                  <Shield size={16} weight="bold" />
                  <span className="whitespace-nowrap">据点防守</span>
                </Link>
                <Link
                  href="/heroes"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-panel px-5 text-sm font-semibold transition-all hover:border-primary/30 hover:bg-panel-raised focus-ring active:scale-95"
                >
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
