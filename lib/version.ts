/** 版本代号「梦想家」- 全站版本常量 */
export const VERSION_CODE = "DR-DREAMER" as const;
export const VERSION_DISPLAY = "梦想家" as const;
export const VERSION_LABEL = `${VERSION_DISPLAY} (${VERSION_CODE})` as const;
export const VERSION_META_GENERATOR = `多重宇宙 ${VERSION_LABEL}` as const;
export const VERSION_WATERMARK = VERSION_DISPLAY;

/** 品牌常量 */
export const BRAND_NAME = "多重宇宙" as const;
export const BRAND_NAME_EN = "Multiverse" as const;
export const BRAND_TAGLINE = "深空探索 · 公平竞技 · 无付费加成" as const;
export const BRAND_URL = "multiverse.game" as const;

/** 视觉设计常量 — 米白色中国航天风 */
export const DESIGN_SYSTEM = {
  /** 设计旋钮 */
  knobs: {
    DESIGN_VARIANCE: 9,
    MOTION_INTENSITY: 4,
    VISUAL_DENSITY: 3,
  },
  /** 配色 */
  colors: {
    background: "#F5F2ED",
    foreground: "#0B1D3A",
    primary: "#0B1D3A",
    accent: "#C8A45C",
    orbital: "#3B7DD8",
  },
  /** 字体 */
  fonts: {
    sans: "Geist Sans",
    mono: "Geist Mono",
  },
  /** 视觉模式 */
  visualMode: "深空空间站" as const,
} as const;