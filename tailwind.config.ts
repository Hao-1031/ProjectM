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
        orbital: {
          DEFAULT: "var(--orbital)",
          muted: "var(--orbital-muted)",
          subtle: "var(--orbital-subtle)",
        },
        anchor: {
          DEFAULT: "var(--anchor)",
          muted: "var(--anchor-muted)",
          subtle: "var(--anchor-subtle)",
        },
        caution: {
          DEFAULT: "var(--caution)",
          muted: "var(--caution-muted)",
          subtle: "var(--caution-subtle)",
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
        sans: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SF Mono", "monospace"],
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
        "orbital-scan": "orbitalScan 6s linear infinite",
        drift: "drift 12s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "station-pulse": "stationPulse 3s ease-in-out infinite",
        "orbit-rotate": "orbitRotate 20s linear infinite",
        "data-stream": "dataStream 1s linear infinite",
        "status-pulse": "statusPulse 2s ease-in-out infinite",
        "beacon": "beacon 4s ease-in-out infinite",
      },
      keyframes: {
        orbitalScan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(12px, -18px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        stationPulse: {
          "0%, 100%": { opacity: "0.4", boxShadow: "0 0 30px rgba(11,29,58,0.08)" },
          "50%": { opacity: "0.8", boxShadow: "0 0 60px rgba(11,29,58,0.15)" },
        },
        orbitRotate: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        dataStream: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 100%" },
        },
        statusPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        beacon: {
          "0%, 100%": { opacity: "0.3", transform: "scale(0.95)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;