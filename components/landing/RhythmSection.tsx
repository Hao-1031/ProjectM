import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import { gsap, registerGSAP } from "@/lib/gsap";
import { WaveSine, Brain, ChartLineUp, Shield } from "@phosphor-icons/react";

const RHYTHM_STEPS = [
  {
    icon: Shield,
    title: "读取你的防守数据",
    desc: "击杀效率、承伤比率、节点控制、资源收集——α 算法实时读取多维表现。",
  },
  {
    icon: Brain,
    title: "动态调整难度曲线",
    desc: "Sigmoid 基础曲线叠加呼吸因子，Boss 波次自动放大或缓和压迫感。",
  },
  {
    icon: WaveSine,
    title: "生成独一无二的敌潮",
    desc: "敌人生成间隔、血量、速度、伤害随节律实时变化，没有两局相同。",
  },
  {
    icon: ChartLineUp,
    title: "AI 行为同步升级",
    desc: "β 智能行为套件接收难度信号，敌人更狡猾、Boss 更具压迫感。",
  },
];

const SECTION_IMAGE =
  "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Abstract%20dark%20tactical%20data%20visualization%20with%20cyan%20waveform%20graphs%2C%20amber%20alert%20nodes%2C%20and%20minimal%20neural%20network%20lines%20on%20deep%20charcoal%20background%2C%20low%20saturation%20sci-fi%20military%20style%2C%20premium%20product%20render&image_size=landscape_16_9";

export default function RhythmSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      registerGSAP();
      if (reducedMotion || !sectionRef.current || !pinnedRef.current) return;

      const ctx = gsap.context(() => {
        gsap.fromTo(
          pinnedRef.current,
          { scale: 0.92, opacity: 0.6 },
          {
            scale: 1,
            opacity: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
              end: "top 30%",
              scrub: 1,
            },
          }
        );

        gsap.utils.toArray<HTMLElement>(".rhythm-step").forEach((step, i) => {
          gsap.fromTo(
            step,
            { opacity: 0, x: i % 2 === 0 ? -24 : 24 },
            {
              opacity: 1,
              x: 0,
              duration: 0.6,
              ease: "power3.out",
              scrollTrigger: {
                trigger: step,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        });
      }, sectionRef);

      return () => ctx.revert();
    },
    { scope: sectionRef, dependencies: [reducedMotion] }
  );

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto max-w-7xl px-4 py-20 md:py-32"
    >
      <div
        ref={pinnedRef}
        className="relative overflow-hidden rounded-[2rem] border border-border bg-panel"
      >
        <div className="dot-grid absolute inset-0 opacity-20" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative grid lg:grid-cols-2">
          <div className="p-6 md:p-10 lg:p-12">
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">
              闭环节律
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              从数据到敌潮
              <br />
              <span className="text-gradient">只需 4 步</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              α 动态节律不是静态数值表，而是一套实时感知、决策、输出、反馈的完整闭环。
            </p>

            <div className="mt-10 space-y-4">
              {RHYTHM_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="rhythm-step group flex gap-4 rounded-2xl border border-border bg-background/40 p-4 transition-colors hover:border-primary/20 hover:bg-background/60"
                  >
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                      <Icon size={20} weight="bold" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative hidden min-h-[480px] lg:block">
            <img
              src={SECTION_IMAGE}
              alt="节律算法数据可视化"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-panel via-panel/40 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
