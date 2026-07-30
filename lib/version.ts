/** 版本代号「双生」- 全站版本常量 */
export const VERSION_CODE = "DR-DUALITY" as const;
export const VERSION_DISPLAY = "双生" as const;
export const VERSION_LABEL = `${VERSION_DISPLAY} (${VERSION_CODE})` as const;
export const VERSION_META_GENERATOR = `多重宇宙 ${VERSION_LABEL}` as const;
export const VERSION_WATERMARK = VERSION_DISPLAY;

/** 上一个版本代号 */
export const PREV_VERSION_CODE = "DR-DAYBREAK" as const;
export const PREV_VERSION_DISPLAY = "破晓" as const;

/** 品牌常量 */
export const BRAND_NAME = "多重宇宙" as const;
export const BRAND_NAME_EN = "Multiverse" as const;
export const BRAND_TAGLINE = "深空探索 · 公平竞技 · 无付费加成" as const;
export const BRAND_URL = "multiverse.game" as const;

/** PvE 视觉设计常量 — 米白色中国航天风 */
export const DESIGN_SYSTEM = {
  pve: {
    knobs: {
      DESIGN_VARIANCE: 9,
      MOTION_INTENSITY: 4,
      VISUAL_DENSITY: 3,
    },
    colors: {
      background: "#F5F2ED",
      foreground: "#0B1D3A",
      primary: "#0B1D3A",
      accent: "#C8A45C",
      orbital: "#3B7DD8",
    },
    visualMode: "深空空间站" as const,
  },
  pvp: {
    knobs: {
      DESIGN_VARIANCE: 7,
      MOTION_INTENSITY: 8,
      VISUAL_DENSITY: 5,
    },
    colors: {
      background: "#1A1A1E",
      foreground: "#F0EDE8",
      primary: "#E8652C",
      accent: "#FFB84D",
      secondary: "#4A5568",
    },
    visualMode: "工业擂台" as const,
  },
  fonts: {
    sans: "Geist Sans",
    mono: "Geist Mono",
  },
} as const;