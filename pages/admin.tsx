import { useEffect, useState } from "react";
import Head from "next/head";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  LockKey,
  SignIn,
  Megaphone,
  Trophy,
  Plus,
  PencilSimple,
  Trash,
  Check,
  X,
  Eye,
  EyeSlash,
  FloppyDisk,
  ArrowClockwise,
  Warning,
} from "@phosphor-icons/react";
import Layout from "@/components/Layout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { useAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/hooks/useAnnouncements";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import type { AnnouncementRow } from "@/lib/supabase/api";

const MODE_OPTIONS = [
  { value: "", label: "全部模式" },
  { value: "survival", label: "生存模式" },
  { value: "defense", label: "据点防守" },
  { value: "deathmatch", label: "个人死斗" },
  { value: "campaign", label: "战役模式" },
  { value: "endless", label: "无尽生存" },
  { value: "daily", label: "每日挑战" },
  { value: "roguelike", label: "冒险模式" },
];

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function AdminLogin({ onLogin }: { onLogin: (key: string) => void }) {
  const [key, setKey] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const reducedMotion = useReducedMotion();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError("请输入管理员密钥");
      return;
    }
    setError("");
    onLogin(key.trim());
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-panel p-8 shadow-2xl"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LockKey size={28} weight="bold" />
        </div>
        <h1 className="mt-5 text-center text-2xl font-bold tracking-tight">管理员后台</h1>
        <p className="mt-2 text-center text-sm text-muted">输入环境变量 ADMIN_KEY 对应的密钥以继续</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="relative">
            <Input
              type={visible ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="管理员密钥"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              aria-label={visible ? "隐藏密钥" : "显示密钥"}
            >
              {visible ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" leftIcon={<SignIn size={18} weight="bold" />} className="w-full">
            进入后台
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

function AnnouncementEditor({
  initial,
  adminKey,
  onSaved,
  onCancel,
}: {
  initial?: AnnouncementRow | null;
  adminKey: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [priority, setPriority] = useState(initial?.priority ?? 0);
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { title, content, priority, active };
      if (initial) {
        await updateAnnouncement(initial.id, payload, adminKey);
      } else {
        await createAnnouncement(payload, adminKey);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-panel-raised p-5">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">标题</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="公告标题" maxLength={120} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">内容</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="公告内容，支持纯文本"
          maxLength={4000}
          rows={5}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">优先级 (0-100)</label>
          <Input
            type="number"
            min={0}
            max={100}
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setActive((v) => !v)}
            className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors ${
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-panel text-muted hover:text-foreground"
            }`}
          >
            {active ? <Check size={16} weight="bold" /> : <X size={16} weight="bold" />}
            {active ? "已启用" : "已停用"}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" loading={saving} leftIcon={<FloppyDisk size={16} weight="bold" />}>
          保存
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          取消
        </Button>
      </div>
    </form>
  );
}

function AnnouncementManager({ adminKey }: { adminKey: string }) {
  const { announcements, loading, error, refetch } = useAnnouncements({ active: false, limit: 100 });
  const [editing, setEditing] = useState<AnnouncementRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这条公告？")) return;
    setDeletingId(id);
    try {
      await deleteAnnouncement(id, adminKey);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Megaphone size={22} weight="bold" className="text-accent" />
          公告管理
        </h2>
        <Button size="sm" leftIcon={<Plus size={16} weight="bold" />} onClick={() => setEditing({} as AnnouncementRow)}>
          新建公告
        </Button>
      </div>

      {editing && (
        <AnnouncementEditor
          initial={editing.id ? editing : null}
          adminKey={adminKey}
          onSaved={() => {
            setEditing(null);
            refetch();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {loading && <Skeleton count={3} className="h-24" />}
      {error && <ErrorState error={error} onRetry={refetch} />}
      {!loading && !error && announcements.length === 0 && (
        <EmptyState title="暂无公告" description="点击右上角新建公告" />
      )}

      <AnimatePresence mode="popLayout">
        {!loading &&
          announcements.map((a) => (
            <motion.div
              key={a.id}
              layout={!reducedMotion}
              initial={reducedMotion ? undefined : itemVariants.hidden}
              animate={itemVariants.visible}
              exit={reducedMotion ? undefined : { opacity: 0 }}
              className="rounded-2xl border border-border bg-panel p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold">{a.title}</h3>
                    {a.active ? (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">显示中</span>
                    ) : (
                      <span className="rounded-full bg-muted/10 px-2 py-0.5 text-[10px] font-bold text-muted">已隐藏</span>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{a.content}</p>
                  <p className="mt-3 text-xs text-muted">
                    优先级 {a.priority} · {formatDate(a.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<PencilSimple size={14} weight="bold" />}
                    onClick={() => setEditing(a)}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={deletingId === a.id}
                    leftIcon={<Trash size={14} weight="bold" />}
                    onClick={() => handleDelete(a.id)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
      </AnimatePresence>
    </section>
  );
}

function LeaderboardBrowser() {
  const [mode, setMode] = useState("");
  const { entries, loading, error, refetch } = useLeaderboard({ mode: mode || undefined, limit: 50 });

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Trophy size={22} weight="bold" className="text-warning" />
          排行榜浏览
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {MODE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Button variant="secondary" size="sm" leftIcon={<ArrowClockwise size={14} weight="bold" />} onClick={refetch}>
            刷新
          </Button>
        </div>
      </div>

      {loading && <Skeleton count={5} className="h-14" />}
      {error && <ErrorState error={error} onRetry={refetch} />}
      {!loading && !error && entries.length === 0 && <EmptyState title="暂无记录" description="该模式下还没有玩家提交成绩" />}

      {!loading && !error && entries.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-panel-raised text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">排名</th>
                <th className="px-4 py-3">玩家</th>
                <th className="px-4 py-3">模式</th>
                <th className="px-4 py-3 text-right">击杀</th>
                <th className="px-4 py-3 text-right">波次</th>
                <th className="px-4 py-3 text-right">分数</th>
                <th className="px-4 py-3 text-right">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry, index) => (
                <tr key={entry.id} className="bg-panel hover:bg-panel-raised/50">
                  <td className="px-4 py-3 font-mono font-bold">{index + 1}</td>
                  <td className="px-4 py-3 font-medium">{entry.player_name}</td>
                  <td className="px-4 py-3 text-muted">{MODE_OPTIONS.find((o) => o.value === entry.mode)?.label ?? entry.mode}</td>
                  <td className="px-4 py-3 text-right font-mono">{entry.kills}</td>
                  <td className="px-4 py-3 text-right font-mono">{entry.waves}</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">{entry.score.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-muted">{entry.duration}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("project_m_admin_key") : null;
    if (saved) setAdminKey(saved);
  }, []);

  const handleLogin = async (key: string) => {
    setAuthError("");
    const res = await fetch("/api/announcements?active=false&limit=1", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.status === 401 || res.status === 403) {
      setAuthError("密钥无效或管理员功能未配置");
      return;
    }
    if (!res.ok) {
      setAuthError("无法验证密钥，请检查 Supabase 配置");
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("project_m_admin_key", key);
    }
    setAdminKey(key);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("project_m_admin_key");
    }
    setAdminKey(null);
  };

  if (!adminKey) {
    return (
      <Layout title="管理员后台" showNav>
        <Head>
          <title>管理员后台 - Project M</title>
        </Head>
        <AdminLogin onLogin={handleLogin} />
        {authError && (
          <p className="mx-auto mt-4 max-w-md text-center text-xs text-danger">
            <Warning size={12} className="inline" /> {authError}
          </p>
        )}
      </Layout>
    );
  }

  return (
    <Layout title="管理员后台" showNav>
      <Head>
        <title>管理员后台 - Project M</title>
      </Head>
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">管理员后台</h1>
            <p className="mt-1 text-sm text-muted">管理公告与查看排行榜数据</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            退出登录
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <AnnouncementManager adminKey={adminKey} />
          </div>
          <div className="lg:col-span-5">
            <LeaderboardBrowser />
          </div>
        </div>
      </div>
    </Layout>
  );
}
