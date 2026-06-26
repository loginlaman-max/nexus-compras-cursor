import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          hover: "hsl(var(--primary-hover) / <alpha-value>)",
          muted: "hsl(var(--primary-muted) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        topbar: {
          DEFAULT: "hsl(var(--topbar) / <alpha-value>)",
          foreground: "hsl(var(--topbar-foreground) / <alpha-value>)",
          muted: "hsl(var(--topbar-muted) / <alpha-value>)",
        },
        surface: {
          1: "hsl(var(--surface-1) / <alpha-value>)",
          2: "hsl(var(--surface-2) / <alpha-value>)",
        },
        status: {
          ruptura: "hsl(var(--status-ruptura) / <alpha-value>)",
          critico: "hsl(var(--status-critico) / <alpha-value>)",
          baixo: "hsl(var(--status-baixo) / <alpha-value>)",
          ok: "hsl(var(--status-ok) / <alpha-value>)",
          excesso: "hsl(var(--status-excesso) / <alpha-value>)",
          "sem-giro": "hsl(var(--status-sem-giro) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "IBM Plex Sans", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
      },
      spacing: {
        "sidebar-expanded": "var(--sidebar-expanded)",
        "sidebar-collapsed": "var(--sidebar-collapsed)",
        "topbar": "var(--topbar-height)",
      },
    },
  },
  plugins: [],
};

export default config;
