import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  GithubLogo,
  Envelope,
  Lock,
  Eye,
  EyeSlash,
  Warning,
  CheckCircle,
  Crosshair,
  Shield,
  Radioactive,
} from "@phosphor-icons/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

function LarkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn("h-5 w-5", className)}>
      <path d="M21.362 5.354H11.69a.38.38 0 0 0-.38.38v.574c0 .21.17.38.38.38h9.673a.38.38 0 0 0 .38-.38v-.574a.38.38 0 0 0-.38-.38zM18.64 8.97H9.005a.38.38 0 0 0-.38.38v.574c0 .21.17.38.38.38H18.64a.38.38 0 0 0 .38-.38v-.574a.38.38 0 0 0-.38-.38z" />
      <path d="M21.362 12.585h-6.34a.38.38 0 0 0-.38.38v.574c0 .21.17.38.38.38h6.34a.38.38 0 0 0 .38-.38v-.574a.38.38 0 0 0-.38-.38z" />
      <path d="M21.362 16.2H2.638a.38.38 0 0 0-.38.38v.574c0 .21.17.38.38.38h18.724a.38.38 0 0 0 .38-.38v-.574a.38.38 0 0 0-.38-.38z" />
      <path d="M5.36 8.97H2.638a.38.38 0 0 0-.38.38v.574c0 .21.17.38.38.38H5.36a.38.38 0 0 0 .38-.38v-.574a.38.38 0 0 0-.38-.38z" />
    </svg>
  );
}

interface FormState {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const redirectedFrom = typeof router.query.redirectedFrom === "string" ? router.query.redirectedFrom : "/";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (router.query.auth_error) {
      setError(typeof router.query.auth_error === "string" ? router.query.auth_error : "登录失败");
    }
  }, [router.query.auth_error]);

  function handleInputChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.email.trim() || !form.password) {
      setError("请填写邮箱和密码");
      return;
    }

    if (mode === "register" && form.password.length < 6) {
      setError("密码长度至少 6 位");
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/signin" : "/api/auth/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok || data.error) {
        throw new Error(data.error || "请求失败");
      }

      if (mode === "register") {
        setSuccess("注册成功，正在进入据点...");
      }

      setTimeout(() => {
        void router.push(redirectedFrom);
      }, 400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }

  const oauthNext = encodeURIComponent(redirectedFrom);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-background text-foreground lg:flex-row">
      {/* Texture overlays */}
      <div className="noise-overlay" />
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-30" />

      {/* Ambient glow */}
      <div className="pointer-events-none fixed -left-[10%] -top-[10%] h-[60vh] w-[60vh] rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-[10%] -right-[10%] h-[50vh] w-[50vh] rounded-full bg-accent/5 blur-[100px]" />

      {/* Left: brand panel */}
      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col justify-between border-b border-border bg-panel/30 p-6 lg:w-[45%] lg:border-b-0 lg:border-r lg:p-10"
      >
        <div>
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
              <Crosshair size={20} weight="bold" />
            </span>
            <div className="flex flex-col">
              <span className="font-mono text-sm font-bold uppercase tracking-widest">Project M</span>
              <span className="text-[10px] text-muted">L3V100 创世版</span>
            </div>
          </Link>
        </div>

        <div className="my-8 lg:my-0">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/20 bg-warning/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-warning">
              <Radioactive size={10} weight="fill" />
              辐射区准入认证
            </span>
            <h1 className="mt-4 text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[0.95] tracking-tight">
              一人一枪
              <br />
              <span className="text-primary">杀穿辐射区</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              登录后即可进入据点防守、生存模式与组队大厅。战绩、解锁进度与外观将跟随账号同步。
            </p>
          </motion.div>

          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
          >
            {[
              { icon: Shield, label: "据点防守", desc: "2-4 人合作守核芯" },
              { icon: Crosshair, label: "战绩同步", desc: "击杀、波次全记录" },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-panel/60 p-3"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon size={18} weight="bold" />
                </span>
                <div>
                  <p className="text-sm font-bold">{feature.label}</p>
                  <p className="text-xs text-muted">{feature.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="text-xs text-muted">公平竞技 · 无付费加成 · Project M</p>
      </motion.div>

      {/* Right: auth form */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-4 lg:p-10">
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border bg-panel p-6 shadow-2xl shadow-black/20 lg:p-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-danger opacity-60" />

            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight">欢迎回来</h2>
              <p className="mt-1 text-xs text-muted">选择登录方式进入作战指挥系统</p>
            </div>

            <Tabs value={mode} onValueChange={(value) => setMode(value as "login" | "register")}>
              <TabsList className="mb-6 w-full">
                <TabsTrigger value="login" className="flex-1">
                  登录
                </TabsTrigger>
                <TabsTrigger value="register" className="flex-1">
                  注册
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <AuthForm
                  mode="login"
                  form={form}
                  showPassword={showPassword}
                  loading={loading}
                  error={error}
                  success={success}
                  onInputChange={handleInputChange}
                  onTogglePassword={() => setShowPassword((prev) => !prev)}
                  onSubmit={handleSubmit}
                />
              </TabsContent>

              <TabsContent value="register">
                <AuthForm
                  mode="register"
                  form={form}
                  showPassword={showPassword}
                  loading={loading}
                  error={error}
                  success={success}
                  onInputChange={handleInputChange}
                  onTogglePassword={() => setShowPassword((prev) => !prev)}
                  onSubmit={handleSubmit}
                />
              </TabsContent>
            </Tabs>

            <div className="mt-6">
              <div className="relative flex items-center py-2">
                <div className="flex-1 border-t border-border" />
                <span className="px-3 text-[10px] font-medium uppercase tracking-wider text-muted">
                  或使用
                </span>
                <div className="flex-1 border-t border-border" />
              </div>

              <div className="mt-4 grid gap-3">
                <a
                  href={`/api/auth/github?next=${oauthNext}`}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold",
                    "transition-all hover:bg-panel-raised hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "active:scale-[0.98]"
                  )}
                >
                  <GithubLogo size={18} weight="fill" />
                  GitHub
                </a>
                <a
                  href={`/api/auth/lark?next=${oauthNext}`}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold",
                    "transition-all hover:bg-[#3370FF] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "active:scale-[0.98]"
                  )}
                >
                  <LarkIcon />
                  飞书
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface AuthFormProps {
  mode: "login" | "register";
  form: FormState;
  showPassword: boolean;
  loading: boolean;
  error: string | null;
  success: string | null;
  onInputChange: (field: keyof FormState, value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

function AuthForm({
  mode,
  form,
  showPassword,
  loading,
  error,
  success,
  onInputChange,
  onTogglePassword,
  onSubmit,
}: AuthFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          <Warning size={16} weight="fill" className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-sm text-success"
        >
          <CheckCircle size={16} weight="fill" className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </motion.div>
      )}

      <div className="space-y-1">
        <label htmlFor={`${mode}-email`} className="text-xs font-medium text-muted">
          邮箱
        </label>
        <div className="relative">
          <Envelope
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            id={`${mode}-email`}
            type="email"
            placeholder="commander@project-m.local"
            value={form.email}
            onChange={(e) => onInputChange("email", e.target.value)}
            className="pl-9"
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor={`${mode}-password`} className="text-xs font-medium text-muted">
          密码
        </label>
        <div className="relative">
          <Lock
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            id={`${mode}-password`}
            type={showPassword ? "text" : "password"}
            placeholder={mode === "register" ? "至少 6 位" : "输入密码"}
            value={form.password}
            onChange={(e) => onInputChange("password", e.target.value)}
            className="pl-9 pr-10"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
            aria-label={showPassword ? "隐藏密码" : "显示密码"}
          >
            {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <Button type="submit" loading={loading} className="mt-1 w-full">
        {mode === "login" ? "登录" : "注册"}
      </Button>
    </form>
  );
}
