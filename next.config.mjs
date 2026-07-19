import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  output: "standalone",
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

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
