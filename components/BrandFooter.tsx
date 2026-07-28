import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { BRAND_TAGLINE, BRAND_URL, VERSION_LABEL } from "@/lib/version";

interface BrandFooterProps {
  /** 额外的导航链接 */
  links?: { href: string; label: string }[];
  /** 额外的品牌信息 */
  extraInfo?: string;
}

const DEFAULT_LINKS = [
  { href: "/", label: "首页" },
  { href: "/about", label: "关于" },
  { href: "/settings", label: "设置" },
  { href: "/help", label: "指南" },
];

export default function BrandFooter({
  links = DEFAULT_LINKS,
  extraInfo,
}: BrandFooterProps) {
  return (
    <footer className="relative z-10 border-t border-primary/10 bg-background/60 py-4 text-center text-[10px] text-muted">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 md:flex-row">
        <div className="flex items-center gap-2">
          <BrandLogo size={14} variant="icon" className="text-muted" />
          <p>
            多重宇宙 · {VERSION_LABEL} · {BRAND_TAGLINE}
          </p>
          {extraInfo && (
            <>
              <span className="text-muted/40">·</span>
              <span>{extraInfo}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-primary focus-ring rounded"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={`https://${BRAND_URL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-muted/50 transition-colors hover:text-primary"
          >
            {BRAND_URL}
          </a>
        </div>
      </div>
    </footer>
  );
}