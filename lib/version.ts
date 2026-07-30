/** 版本代号「飞升」- 全站版本常量 */
export const VERSION_CODE = "DR-ASCENSION" as const;
export const VERSION_DISPLAY = "飞升" as const;
export const VERSION_LABEL = `${VERSION_DISPLAY} (${VERSION_CODE})` as const;
export const VERSION_META_GENERATOR = `多重宇宙 ${VERSION_LABEL}` as const;
export const VERSION_WATERMARK = VERSION_DISPLAY;

/** 上一个版本代号 */
export const PREV_VERSION_CODE = "DR-REBIRTH" as const;
export const PREV_VERSION_DISPLAY = "涅槃" as const;

/** 品牌常量 */
export const BRAND_NAME = "多重宇宙" as const;
export const BRAND_NAME_EN = "Multiverse" as const;
export const BRAND_TAGLINE = "深空探索 · 公平竞技 · 无付费加成" as const;
export const BRAND_URL = "multiverse.game" as const;

/** 飞升版本 — 深化亮色现代游戏平台设计系统 */
export const DESIGN_SYSTEM = {
  knobs: {
    DESIGN_VARIANCE: 9,
    MOTION_INTENSITY: 6,
    VISUAL_DENSITY: 5,
  },
  colors: {
    background: "#FAF9F6",
    foreground: "#0D0D10",
    primary: "#1A56DB",
    accent: "#EA580C",
    secondary: "#5B6372",
    muted: "#787680",
    border: "#E2E0DA",
    "border-strong": "#C8C5BE",
    panel: "#FFFFFF",
    "panel-raised": "#F2F1EC",
    "panel-subtle": "#F8F7F3",
    success: "#059669",
    danger: "#DC2626",
    warning: "#D97706",
    info: "#0891B2",
    neutral: {
      50: "#FAFAF8",
      100: "#F2F1EC",
      200: "#E2E0DA",
      300: "#C8C5BE",
      400: "#A09C94",
      500: "#787670",
      600: "#575551",
      700: "#3D3B38",
      800: "#242320",
      900: "#121110",
    },
  },
  typography: {
    "heading-track": "-0.02em",
    "body-track": "-0.01em",
    "mono-track": "0.02em",
    "heading-weight": "700",
    "body-weight": "400",
    "label-weight": "600",
  },
  visualMode: "亮色游戏平台" as const,
  fonts: {
    sans: "Geist Sans",
    mono: "Geist Mono",
  },
} as const;