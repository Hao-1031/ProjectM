import { withSentryConfig } from "@sentry/nextjs";
import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  output: "standalone",
};

const pwaEnabled = process.env.NODE_ENV === "production";

const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: !pwaEnabled,
  buildExcludes: [/middleware-manifest\.json$/],
})(nextConfig);

export default withSentryConfig(withPWAConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
  sourcemaps: {
    // 本地未配置 Sentry token 时跳过 sourcemap 上传，避免构建挂起
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
