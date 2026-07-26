import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Play, ArrowRight, Crown, Shield } from "@phosphor-icons/react";

const HERO_IMAGE =
  "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cinematic%20wide%20shot%20of%20a%20lone%20commander%20standing%20on%20a%20fortified%20outpost%20under%20a%20stormy%20ash%20sky%2C%20glowing%20teal%20defense%20grid%20lines%20pulsing%20across%20the%20ground%2C%20distant%20mechanical%20horde%20silhouettes%2C%20embers%20and%20dust%20particles%2C%20muted%20teal%20and%20amber%20accent%20lights%2C%20epic%20narrative%20atmosphere%2C%20low%20saturation%2C%20no%20text%2C%20premium%20game%20cinematography&image_size=landscape_16_9";

export default function Hero() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-6 pt-4 md:pb-10 md:pt-6">
      <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-6">
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="order-2 lg:order-1 lg:col-span-6 lg:pr-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-subtle px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
            <Crown size={12} weight="bold" />
            L3V100 旗舰版
          </div>

          <h1 className="mt-5 text-[clamp(2.25rem,6vw,4.5rem)] font-bold leading-[0.95] tracking-tight">
            守住最后一座
            <br />
            <span className="text-gradient">人类据点</span>
          </h1>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-300 md:text-base">
            辐射区正在吞噬一切。召集小队，部署防线，在无尽敌潮中守护核心。
            每一局都是独一无二的史诗战役。
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/game?mode=defense"
              className="group relative inline-flex h-11 items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-primary px-6 text-sm font-bold text-background shadow-lg shadow-primary/15 transition-all hover:bg-primary/90 hover:shadow-primary/25 focus-ring active:scale-[0.98]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Play size={20} weight="fill" />
              <span className="whitespace-nowrap">立即开战</span>
            </Link>
            <Link
              href="/modes"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-panel px-5 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-panel-raised focus-ring active:scale-[0.98]"
            >
              <Shield size={18} weight="bold" />
              <span className="whitespace-nowrap">选择模式</span>
              <ArrowRight size={14} className="text-muted" />
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-5 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-2 w-2 rounded-full bg-success" />
              无付费加成
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
              据点合作
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
              旗舰极限模式
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="order-1 lg:order-2 lg:col-span-6 lg:col-start-7"
        >
          <div className="relative">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-accent/10 blur-2xl" />
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-border bg-panel shadow-2xl shadow-black/30">
              <img
                src={HERO_IMAGE}
                alt="Project M 旗舰版史诗战场：指挥官守护人类最后据点"
                className="h-full w-full object-cover"
                loading="eager"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-background/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-border/60 bg-background/80 p-3 backdrop-blur-md">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">据点完整度</span>
                  <span className="font-mono text-primary">100%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-primary to-accent" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
