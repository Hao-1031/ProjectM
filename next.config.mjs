import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // Windows 本地构建 standalone 因 pnpm symlink 极易阻塞；Linux 生产部署仍输出 standalone
  output: process.platform === "win32" ? undefined : "standalone",
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(test|spec)\.(tsx|ts|jsx|js)$/,
      loader: "./loaders/ignore-loader.js",
    });
    return config;
  },
};

const hasSentryAuthToken = Boolean(process.env.SENTRY_AUTH_TOKEN);

const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  sourcemaps: {
    disable: !hasSentryAuthToken,
  },
};

// 本地/未配置 Sentry 时跳过 Sentry 构建包装，避免上传插件阻塞构建
export default hasSentryAuthToken
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
