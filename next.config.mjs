import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // Windows 本地构建 standalone 因 pnpm symlink 极易阻塞；Linux 生产部署仍输出 standalone
  output: process.platform === "win32" ? undefined : "standalone",
  // 低配/Windows 本地构建时页面数据收集易超时，放宽至 5 分钟
  staticPageGenerationTimeout: 300,
  // 性能优化：实验性配置
  experimental: {
    optimizePackageImports: [
      "@phosphor-icons/react",
      "framer-motion",
      "gsap",
    ],
    turbo: {
      rules: {
        "*.svg": { loaders: ["@svgr/webpack"], as: "*.js" },
      },
    },
  },
  // 模块分包策略
  modularizeImports: {
    "@phosphor-icons/react": {
      transform: "@phosphor-icons/react/dist/icons/{{member}}",
    },
  },
  webpack: (config, { isServer }) => {
    // 忽略测试文件
    config.module.rules.push({
      test: /\.(test|spec)\.(tsx|ts|jsx|js)$/,
      loader: "./loaders/ignore-loader.js",
    });

    // 性能优化：splitChunks 分包
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: "all",
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          // 游戏引擎核心
          gameEngine: {
            test: /[\\/]lib[\\/]game[\\/](?!.*\.test)/,
            name: "game-engine",
            priority: 30,
            reuseExistingChunk: true,
          },
          // 算法库
          algorithms: {
            test: /[\\/]lib[\\/]algorithms[\\/]/,
            name: "algorithms",
            priority: 25,
            reuseExistingChunk: true,
          },
          // 网络层
          network: {
            test: /[\\/]lib[\\/]network[\\/]/,
            name: "network",
            priority: 20,
            reuseExistingChunk: true,
          },
          // UI 组件库
          uiComponents: {
            test: /[\\/]components[\\/]/,
            name: "ui-components",
            priority: 15,
            reuseExistingChunk: true,
          },
          // 动画库
          animation: {
            test: /[\\/]node_modules[\\/](framer-motion|gsap|motion)[\\/]/,
            name: "animation-vendor",
            priority: 10,
            reuseExistingChunk: true,
          },
          // 图标库
          icons: {
            test: /[\\/]node_modules[\\/]@phosphor-icons[\\/]/,
            name: "icons-vendor",
            priority: 10,
            reuseExistingChunk: true,
          },
          // 通用 vendor
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendor",
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }

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
