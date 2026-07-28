import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./pages/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        panel: "var(--panel)",
        "panel-raised": "var(--panel-raised)",
        border: "var(--border)",
        primary: {
          DEFAULT: "var(--primary)",
          muted: "var(--primary-muted)",
          subtle: "var(--primary-subtle)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          muted: "var(--accent-muted)",
          subtle: "var(--accent-subtle)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          muted: "var(--secondary-muted)",
          subtle: "var(--secondary-subtle)",
        },
        quantum: {
          DEFAULT: "var(--quantum)",
          muted: "var(--quantum-muted)",
          subtle: "var(--quantum-subtle)",
        },
        anchor: {
          DEFAULT: "var(--anchor)",
          muted: "var(--anchor-muted)",
          subtle: "var(--anchor-subtle)",
        },
        entropy: {
          DEFAULT: "var(--entropy)",
          muted: "var(--entropy-muted)",
          subtle: "var(--entropy-subtle)",
        },
        void: {
          DEFAULT: "var(--void)",
          muted: "var(--void-muted)",
        },
        danger: "var(--danger)",
        success: "var(--success)",
        warning: "var(--warning)",
        muted: "var(--muted)",
        neutral: {
          50: "var(--neutral-50)",
          100: "var(--neutral-100)",
          200: "var(--neutral-200)",
          300: "var(--neutral-300)",
          400: "var(--neutral-400)",
          500: "var(--neutral-500)",
          600: "var(--neutral-600)",
          700: "var(--neutral-700)",
          800: "var(--neutral-800)",
          900: "var(--neutral-900)",
        },
      },
      fontFamily: {
        display: ["var(--font-cabinet)", "system-ui", "sans-serif"],
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "holo-scan": "holoScan 4s linear infinite",
        drift: "drift 12s ease-in-out infinite",
        geiger: "geiger 2.4s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "bridge-pulse": "bridgePulse 3s ease-in-out infinite",
        "rift-open": "riftOpen 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "anchor-rotate": "anchorRotate 20s linear infinite",
        "data-stream": "dataStream 1s linear infinite",
        "status-pulse": "statusPulse 2s ease-in-out infinite",
        "projection-flicker": "projectionFlicker 3s ease-in-out infinite",
      },
      keyframes: {
        holoScan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(12px, -18px)" },
        },
        geiger: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.9" },
          "52%": { opacity: "0.3" },
          "54%": { opacity: "0.85" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        bridgePulse: {
          "0%, 100%": { opacity: "0.4", boxShadow: "0 0 20px rgba(196,77,255,0.15)" },
          "50%": { opacity: "0.8", boxShadow: "0 0 40px rgba(196,77,255,0.3)" },
        },
        riftOpen: {
          "0%": { opacity: "0", transform: "scaleX(0)" },
          "100%": { opacity: "1", transform: "scaleX(1)" },
        },
        anchorRotate: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        dataStream: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 100%" },
        },
        statusPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        projectionFlicker: {
          "0%, 100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "93%": { opacity: "0.85" },
          "94%": { opacity: "1" },
          "96%": { opacity: "0.9" },
          "97%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;