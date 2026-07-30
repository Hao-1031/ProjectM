import "@/styles/globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { VERSION_META_GENERATOR, BRAND_NAME, BRAND_TAGLINE } from "@/lib/version";
import Providers from "@/components/Providers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://multiverse.game";

const geistSans = localFont({
  src: "../pages/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "../pages/fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND_NAME} - ${BRAND_TAGLINE}`,
    template: `%s - ${BRAND_NAME}`,
  },
  description: `${BRAND_NAME} - ${BRAND_TAGLINE}。据点防守、极限生存、肉鸽构筑与赛季挑战。`,
  keywords: "多重宇宙,据点防守,极限生存,肉鸽,公平竞技,无氪金,免费游戏",
  authors: [{ name: BRAND_NAME }],
  generator: VERSION_META_GENERATOR,
  robots: { index: true, follow: true },
  themeColor: "#FAF9F6",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    siteName: BRAND_NAME,
    locale: "zh_CN",
    type: "website",
    images: [{ url: `${SITE_URL}/og-default.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@multiverse_game",
  },
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="canonical" href={SITE_URL} />
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500,400,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}