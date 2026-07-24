import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { GithubLogo, User, SignOut, Spinner, Check } from "@phosphor-icons/react";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import Sheet from "@/components/ui/Sheet";
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

function Avatar({ url }: { url: string | null }) {
  if (url) {
    return (
      <div className="relative h-8 w-8 overflow-hidden rounded-full border border-border">
        <Image src={url} alt="用户头像" fill unoptimized className="object-cover" sizes="32px" />
      </div>
    );
  }

  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-panel-raised text-muted">
      <User size={16} weight="bold" />
    </span>
  );
}

function providerLabel(provider: string): string {
  if (provider === "lark") return "飞书";
  if (provider === "github") return "GitHub";
  if (provider === "email") return "邮箱";
  return provider;
}

export default function AuthButton() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    setMenuOpen(false);
    void router.push("/login");
  }

  if (isLoading) {
    return (
      <div className="inline-flex h-9 w-9 animate-pulse items-center justify-center rounded-full bg-panel-raised">
        <Spinner size={18} weight="bold" className="animate-spin text-muted" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="group flex items-center gap-2 rounded-full border border-border bg-panel p-0.5 pr-3 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="打开用户菜单"
        >
          <Avatar url={user.avatarUrl} />
          <span className="hidden max-w-[8rem] truncate text-xs font-medium text-foreground md:inline">
            {providerLabel(user.provider)}
          </span>
        </button>

        <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} side="right" title="账号" className="max-w-xs">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-panel p-4">
              <Avatar url={user.avatarUrl} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{providerLabel(user.provider)} 用户</p>
                <p className="truncate text-xs text-muted">ID: {user.id.slice(0, 8)}</p>
              </div>
              <Check size={16} weight="bold" className="ml-auto text-success" />
            </div>

            <Button
              variant="secondary"
              size="md"
              loading={signingOut}
              leftIcon={<SignOut size={18} weight="bold" />}
              onClick={handleSignOut}
              className="w-full"
            >
              退出登录
            </Button>
          </div>
        </Sheet>
      </>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void router.push(`/login?redirectedFrom=${encodeURIComponent(router.asPath)}`)}
      leftIcon={<User size={16} weight="bold" />}
    >
      登录
    </Button>
  );
}
