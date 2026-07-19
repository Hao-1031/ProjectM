import Link from "next/link";
import { useRouter } from "next/router";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showNav?: boolean;
}

export default function Layout({ children, title, showNav = true }: LayoutProps) {
  const router = useRouter();
  const isIndex = router.pathname === "/";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      {showNav && !isIndex && (
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-primary transition-colors hover:text-foreground focus-ring rounded"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                ←
              </span>
              <span className="font-mono text-sm uppercase tracking-widest">返回指挥部</span>
            </Link>
            {title && (
              <h1 className="font-mono text-sm uppercase tracking-widest text-muted">{title}</h1>
            )}
          </div>
        </header>
      )}
      <main className="flex-1">{children}</main>
      {showNav && !isIndex && (
        <footer className="border-t border-border py-4 text-center text-xs text-muted">
          Project M · 本地优先 · 永不收集个人数据
        </footer>
      )}
    </div>
  );
}
