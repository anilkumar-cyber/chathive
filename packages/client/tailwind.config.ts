import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f0ff",
          100: "#e5e4ff",
          200: "#cdccff",
          300: "#aca8ff",
          400: "#8b82ff",
          500: "#6366f1",
          600: "#5548e8",
          700: "#4638cc",
          800: "#3a2fa6",
          900: "#332c83",
          950: "#1f1a4d",
        },
        accent: {
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
        },
        surface: {
          light: "#ffffff",
          dark: "#12121a",
          darkAlt: "#1a1a26",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
        glow: "0 0 24px 0 rgba(99, 102, 241, 0.35)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "pulse-dot": { "0%, 100%": { opacity: "0.3" }, "50%": { opacity: "1" } },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
