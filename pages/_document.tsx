import { Html, Head, Main, NextScript } from "next/document";
import { BRAND_NAME, BRAND_TAGLINE, VERSION_META_GENERATOR } from "@/lib/version";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://multiverse.game";

export default function Document() {
  return (
    <Html lang="zh-CN">
      <Head>
        <meta name="description" content={`${BRAND_NAME} - ${BRAND_TAGLINE}。据点防守、极限生存、肉鸽构筑与赛季挑战。`} />
        <meta name="keywords" content="多重宇宙,据点防守,极限生存,肉鸽,公平竞技,无氪金,免费游戏" />
        <meta name="author" content={BRAND_NAME} />
        <meta name="generator" content={VERSION_META_GENERATOR} />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#F5F2ED" />

        <meta property="og:site_name" content={BRAND_NAME} />
        <meta property="og:locale" content="zh_CN" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${SITE_URL}/og-default.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@multiverse_game" />

        <link rel="canonical" href={SITE_URL} />

        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500,400,300&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}