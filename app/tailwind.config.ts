import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Semantic colors for SoloPilot finance UI
        confirmed: {
          DEFAULT: "hsl(var(--confirmed))",
          foreground: "hsl(var(--confirmed-foreground))",
          soft: "hsl(var(--confirmed-soft))",
          line: "hsl(var(--confirmed-line))",
        },
        probable: {
          DEFAULT: "hsl(var(--probable))",
          foreground: "hsl(var(--probable-foreground))",
          soft: "hsl(var(--probable-soft))",
          line: "hsl(var(--probable-line))",
        },
        hypothetical: {
          DEFAULT: "hsl(var(--hypothetical))",
          foreground: "hsl(var(--hypothetical-foreground))",
          soft: "hsl(var(--hypothetical-soft))",
          line: "hsl(var(--hypothetical-line))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          soft: "hsl(var(--warning-soft))",
          line: "hsl(var(--warning-line))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))",
          soft: "hsl(var(--danger-soft))",
          line: "hsl(var(--danger-line))",
        },
        hot: {
          DEFAULT: "hsl(var(--hot))",
          foreground: "hsl(var(--hot-foreground))",
          soft: "hsl(var(--hot-soft))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 6px)",
      },
      fontFamily: {
        // Strawford is the display face; JetBrains Mono powers eyebrows + numerals
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Editorial micro-type scale — one source of truth, no more text-[10px] / text-[11px].
        // `meta` is the smallest tier (kbd, captions); `eyebrow` is the section-label tier.
        meta: ["0.625rem", { lineHeight: "1.2", letterSpacing: "0.04em" }],
        eyebrow: ["0.6875rem", { lineHeight: "1", letterSpacing: "0.08em" }],
      },
      letterSpacing: {
        // Fedelo editorial tracking scale
        tightest: "-0.04em",
        tighter: "-0.025em",
        snug: "-0.01em",
        wide: "0.08em",
      },
      boxShadow: {
        // Calm Fedelo-style elevation. `card` is the canonical resting state for surfaces.
        sm: "0 1px 0 0 hsl(var(--foreground) / 0.06)",
        card: "0 1px 2px 0 hsl(var(--foreground) / 0.04)",
        md: "0 8px 24px -12px hsl(var(--foreground) / 0.18)",
        lg: "0 1px 0 0 hsl(var(--foreground) / 0.06), 0 30px 80px -40px hsl(var(--foreground) / 0.20)",
        hot: "0 0 0 1px hsl(var(--hot) / 0.22), 0 12px 32px -10px hsl(var(--hot) / 0.45)",
        // Focus ring helper for non-button interactive surfaces (cards, list rows)
        focus: "0 0 0 2px hsl(var(--ring) / 0.5)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.25s cubic-bezier(0.2, 0.7, 0.2, 1)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
