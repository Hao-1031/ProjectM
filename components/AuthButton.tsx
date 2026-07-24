import { useState } from "react";
import Image from "next/image";
import { GithubLogo, DiscordLogo, User, SignOut, Spinner, Check } from "@phosphor-icons/react";
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

const PROVIDERS = [
  {
    id: "github" as const,
    label: "GitHub",
    icon: <GithubLogo className="h-5 w-5" />,
    href: "/api/auth/github",
    color: "hover:bg-neutral-700 hover:text-white",
  },
  {
    id: "discord" as const,
    label: "Discord",
    icon: <DiscordLogo className="h-5 w-5" />,
    href: "/api/auth/discord",
    color: "hover:bg-[#5865F2] hover:text-white",
  },
  {
    id: "lark" as const,
    label: "飞书",
    icon: <LarkIcon className="h-5 w-5" />,
    href: "/api/auth/lark",
    color: "hover:bg-[#3370FF] hover:text-white",
  },
];

function Avatar({ url }: { url: string | null }) {
  if (url) {
    return (
      <div className="relative h-8 w-8 overflow-hidden rounded-full border border-border">
        <Image
          src={url}
          alt="用户头像"
          fill
          unoptimized
          className="object-cover"
          sizes="32px"
        />
      </div>
    );
  }

  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-panel-raised text-muted">
      <User size={16} weight="bold" />
    </span>
  );
}

function ProviderButton({
  label,
  icon,
  href,
  color,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-panel px-4 py-3 text-sm font-medium text-foreground transition-all",
        "hover:border-transparent hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        color
      )}
    >
      {icon}
      <span>使用 {label} 登录</span>
    </a>
  );
}

export default function AuthButton() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    setMenuOpen(false);
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
            {user.provider === "lark" ? "飞书用户" : user.provider}
          </span>
        </button>

        <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} side="right" title="账号" className="max-w-xs">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-panel p-4">
              <Avatar url={user.avatarUrl} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {user.provider === "lark" ? "飞书用户" : user.provider}
                </p>
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
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setMenuOpen(true)}
        leftIcon={<User size={16} weight="bold" />}
      >
        登录
      </Button>

      <Sheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        side="right"
        title="选择登录方式"
        description="使用第三方账号快速登录，不强制绑定手机号。"
        className="max-w-xs"
      >
        <div className="flex flex-col gap-3">
          {PROVIDERS.map((provider) => (
            <ProviderButton
              key={provider.id}
              label={provider.label}
              icon={provider.icon}
              href={provider.href}
              color={provider.color}
              onClick={() => setMenuOpen(false)}
            />
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          登录即表示同意仅用于识别玩家身份与同步战绩。
        </p>
      </Sheet>
    </>
  );
}
