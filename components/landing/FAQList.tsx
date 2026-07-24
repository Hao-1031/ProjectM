import { motion, useReducedMotion, useInView } from "framer-motion";
import { useRef } from "react";
import { GameController, Coins, Cloud, Users, Target } from "@phosphor-icons/react";

const FAQS = [
  {
    icon: Target,
    q: "Project M 2.0 是什么类型游戏？",
    a: "一款由 α/β 独家算法驱动的横屏动作射击 Web 游戏。主打据点合作防守、生存割草与英雄技能构建，浏览器打开即玩。",
  },
  {
    icon: GameController,
    q: "需要下载客户端吗？",
    a: "不需要。基于 Next.js 与 PWA 技术，浏览器访问即可游玩，也支持添加到主屏幕离线启动。",
  },
  {
    icon: Coins,
    q: "游戏收费吗？",
    a: "完全免费游玩。商店只出售外观皮肤、特效与便利功能，不提供任何影响数值的付费道具。",
  },
  {
    icon: Cloud,
    q: "数据会保存在哪里？",
    a: "本地进度保存在浏览器本地存储中；全球排行榜、公告等在线功能通过 Supabase 云端同步。",
  },
  {
    icon: Users,
    q: "支持联机吗？",
    a: "支持。据点防守与个人死斗模式可通过 P2P 联机或本地同屏进行多人对战。",
  },
];

export default function FAQList() {
  const reducedMotion = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="mx-auto max-w-7xl px-4 py-4 md:py-6">
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
          animate={isInView || reducedMotion ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-4"
        >
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">
            常见
            <br />
            <span className="text-gradient">问题</span>
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-neutral-400">
            如果还有其他疑问，欢迎通过游戏内反馈或关于页面联系我们。
          </p>
        </motion.div>

        <div className="space-y-2 lg:col-span-8">
          {FAQS.map((faq, i) => {
            const Icon = faq.icon;
            return (
              <motion.div
                key={faq.q}
                initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                animate={isInView || reducedMotion ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group flex gap-3 rounded-2xl border border-border bg-panel/50 p-3 transition-all hover:border-primary/20 hover:bg-panel"
              >
                <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon size={16} weight="bold" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{faq.q}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-400">{faq.a}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
