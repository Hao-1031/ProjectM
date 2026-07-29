import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  Fingerprint,
  Hexagon,
} from "@phosphor-icons/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { emit, GameEventType, GameEventCategory, GameEventLevel } from "@/lib/game/event-bus";

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
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    setOauthLoading(false);
  }, []);

  useEffect(() => {
    const authError = router.query.auth_error;
    if (authError && typeof authError === "string") {
      setError(authError);
      emit(GameEventType.LOGIN_FAILURE, GameEventCategory.LOGIN, GameEventLevel.ERROR, { mode: "oauth_callback", error: authError }, "login");
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("auth_error");
      window.history.replaceState({}, "", cleanUrl.toString());
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
    emit(GameEventType.LOGIN_REQUEST, GameEventCategory.LOGIN, GameEventLevel.INFO, { mode, email: form.email.trim() }, "login");

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
        emit(GameEventType.LOGIN_SUCCESS, GameEventCategory.LOGIN, GameEventLevel.INFO, { mode: "register", email: form.email.trim() }, "login");
      } else {
        emit(GameEventType.LOGIN_SUCCESS, GameEventCategory.LOGIN, GameEventLevel.INFO, { mode: "login", email: form.email.trim() }, "login");
      }

      setTimeout(() => {
        void router.push(redirectedFrom);
      }, 400);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "未知错误";
      setError(errMsg);
      emit(GameEventType.LOGIN_FAILURE, GameEventCategory.LOGIN, GameEventLevel.ERROR, { mode, error: errMsg }, "login");
    } finally {
      setLoading(false);
    }
  }

  const oauthNext = encodeURIComponent(redirectedFrom);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-background text-foreground lg:flex-row">
      <div className="noise-overlay" />
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-20" />
      <div className="pointer-events-none absolute inset-0 bridge-grid opacity-30" />

      <div className="pointer-events-none fixed -left-[10%] -top-[10%] h-[60vh] w-[60vh] rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-[10%] -right-[10%] h-[50vh] w-[50vh] rounded-full bg-accent/5 blur-[100px]" />

      {/* ── Left: Bridge Welcome Panel ── */}
      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col justify-between border-b border-primary/10 bg-panel/40 p-6 lg:w-[45%] lg:border-b-0 lg:border-r lg:p-10"
      >
        <div>
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="holo-ring inline-flex h-9 w-9 items-center justify-center text-primary transition-colors">
              <Crosshair size={20} weight="bold" />
            </span>
            <div className="flex flex-col">
              <span className="font-mono text-sm font-bold uppercase tracking-widest">多重宇宙</span>
              <span className="text-[10px] text-muted">舰桥指挥终端</span>
            </div>
          </Link>
        </div>

        <div className="my-8 lg:my-0">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="bridge-panel p-5"
          >
            <div className="bridge-panel-header -mx-5 -mt-5 mb-4">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                <Radioactive size={10} weight="fill" className="status-pulse" />
                辐射区准入认证
              </span>
            </div>
            <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[0.95] tracking-tight">
              一人一枪
              <br />
              <span className="text-gradient">杀穿辐射区</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              登录后即可进入据点防守、生存模式与组队大厅。战绩、解锁进度与外观将跟随账号同步。
            </p>
          </motion.div>

          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
          >
            {[
              { icon: Shield, label: "据点防守", desc: "2-4 人合作守核芯" },
              { icon: Crosshair, label: "战绩同步", desc: "击杀、波次全记录" },
            ].map((feature) => (
              <div
                key={feature.label}
                className="bridge-panel flex items-center gap-3 p-3 bridge-glow"
              >
                <span className="holo-ring inline-flex h-9 w-9 shrink-0 items-center justify-center text-primary">
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

        <div className="bridge-panel bridge-panel-header py-3 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">公平竞技 · 无付费加成 · 多重宇宙</p>
        </div>
      </motion.div>

      {/* ── Right: Bridge Auth Terminal ── */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-4 lg:p-10">
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="bridge-panel holo-scan p-6 shadow-2xl shadow-black/30 lg:p-8">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

            <div className="bridge-panel-header -mx-6 -mt-6 mb-6 px-6 pt-6 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8">
              <div className="flex items-center gap-2">
                <Fingerprint size={18} weight="bold" className="text-primary status-pulse" />
                <h2 className="font-mono text-sm font-bold uppercase tracking-[0.15em]">舰桥认证终端</h2>
              </div>
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
                <div className="flex-1 border-t border-primary/10" />
                <span className="px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  或使用
                </span>
                <div className="flex-1 border-t border-primary/10" />
              </div>

              <div className="mt-4 grid gap-3">
                <a
                  href={`/api/auth/github?next=${oauthNext}`}
                  onClick={() => {
                    setOauthLoading(true);
                    emit(GameEventType.LOGIN_REQUEST, GameEventCategory.LOGIN, GameEventLevel.INFO, { mode: "github_oauth" }, "login");
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-primary/10 bg-background px-4 py-2.5 text-sm font-semibold transition-all hover:border-primary/30 hover:bg-panel hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
                >
                  {oauthLoading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                  ) : (
                    <GithubLogo size={18} weight="fill" />
                  )}
                  GitHub
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
  const formRef = useRef<HTMLFormElement>(null);

  function handleButtonClick() {
    if (!loading && formRef.current) {
      formRef.current.requestSubmit();
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4">
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            <Warning size={16} weight="fill" className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-start gap-2 rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-sm text-success"
          >
            <CheckCircle size={16} weight="fill" className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1">
        <label htmlFor={`${mode}-email`} className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
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
        <label htmlFor={`${mode}-password`} className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
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
            minLength={mode === "register" ? 6 : undefined}
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

      <Button type="button" loading={loading} onClick={handleButtonClick} className="mt-1 w-full">
        {mode === "login" ? "登录" : "注册"}
      </Button>
    </form>
  );
}