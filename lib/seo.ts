import { BRAND_NAME, BRAND_TAGLINE, VERSION_META_GENERATOR } from "@/lib/version";

export interface SEOMeta {
  title: string;
  description: string;
  canonical?: string;
  ogImage: string;
  ogType: "website" | "article";
  noIndex?: boolean;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://multiverse.game";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
const DEFAULT_DESCRIPTION = `${BRAND_NAME} - ${BRAND_TAGLINE}。据点防守、极限生存、肉鸽构筑与赛季挑战。`;

export function buildSEOMeta(meta: Partial<SEOMeta> = {}): SEOMeta {
  const title = meta.title ? `${meta.title} | ${BRAND_NAME}` : BRAND_NAME;
  const description = meta.description ?? DEFAULT_DESCRIPTION;
  const ogImage = meta.ogImage ?? DEFAULT_OG_IMAGE;
  const ogType = meta.ogType ?? "website";

  return {
    title,
    description,
    ogImage,
    ogType,
    canonical: meta.canonical,
    noIndex: meta.noIndex ?? false,
  };
}

export function generateSEOTags(meta: SEOMeta): Record<string, string> {
  const tags: Record<string, string> = {
    "description": meta.description,
    "generator": VERSION_META_GENERATOR,
    "og:title": meta.title,
    "og:description": meta.description,
    "og:image": meta.ogImage,
    "og:type": meta.ogType,
    "og:site_name": BRAND_NAME,
    "og:locale": "zh_CN",
    "twitter:card": "summary_large_image",
    "twitter:title": meta.title,
    "twitter:description": meta.description,
    "twitter:image": meta.ogImage,
  };

  if (meta.noIndex) {
    tags["robots"] = "noindex, nofollow";
  } else {
    tags["robots"] = "index, follow";
  }

  return tags;
}