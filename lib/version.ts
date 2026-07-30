/** 版本代号「涅槃」- 全站版本常量 */
export const VERSION_CODE = "DR-REBIRTH" as const;
export const VERSION_DISPLAY = "涅槃" as const;
export const VERSION_LABEL = `${VERSION_DISPLAY} (${VERSION_CODE})` as const;
export const VERSION_META_GENERATOR = `多重宇宙 ${VERSION_LABEL}` as const;
export const VERSION_WATERMARK = VERSION_DISPLAY;

/** 上一个版本代号 */
export const PREV_VERSION_CODE = "DR-DUALITY" as const;
export const PREV_VERSION_DISPLAY = "双生" as const;

/** 品牌常量 */
export const BRAND_NAME = "多重宇宙" as const;
export const BRAND_NAME_EN = "Multiverse" as const;
export const BRAND_TAGLINE = "深空探索 · 公平竞技 · 无付费加成" as const;
export const BRAND_URL = "multiverse.game" as const;

/** 涅槃版本 — 统一亮色现代游戏平台设计系统 */
export const DESIGN_SYSTEM = {
  knobs: {
    DESIGN_VARIANCE: 7,
    MOTION_INTENSITY: 6,
    VISUAL_DENSITY: 5,
  },
  colors: {
    background: "#F8F7F4",
    foreground: "#18181B",
    primary: "#2563EB",
    accent: "#F97316",
    secondary: "#6B7280",
    muted: "#9CA3AF",
    border: "#E5E3DF",
    panel: "#FFFFFF",
    "panel-raised": "#F5F4F0",
    success: "#10B981",
    danger: "#EF4444",
    warning: "#F59E0B",
  },
  visualMode: "亮色游戏平台" as const,
  fonts: {
    sans: "Geist Sans",
    mono: "Geist Mono",
  },
} as const;