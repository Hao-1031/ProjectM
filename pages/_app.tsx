import "@/styles/globals.css";
import type { AppProps } from "next/app";
import localFont from "next/font/local";
import Head from "next/head";
import { useEffect } from "react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

function useUnregisterServiceWorkerInDev() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (typeof navigator === "undefined" || !navigator.serviceWorker) return;
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        void registration.unregister();
      }
    });
  }, []);
}

export default function App({ Component, pageProps }: AppProps) {
  useUnregisterServiceWorkerInDev();

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#03040a" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </Head>
      <div className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <Component {...pageProps} />
      </div>
    </>
  );
}
