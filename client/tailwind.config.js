/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        xxs: "10px",
      },
      colors: {
        brand: {
          50: "#FBF7EC",
          100: "#F5EBD0",
          200: "#E9D4A0",
          300: "#DBB86D",
          400: "#C89B45",
          500: "#A97D2F",
          600: "#8C6424",
          700: "#6E4E1D",
          800: "#513917",
          900: "#3A2812",
        },
        console: {
          bg: "#F5F6F8",
          surface: "#FFFFFF",
          border: "#E4E7EC",
          text: "#0F172A",
          muted: "#5B6472",
        },
        success: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#059669",
          600: "#047857",
          700: "#065F46",
        },
        danger: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#DC2626",
          600: "#B91C1C",
          700: "#991B1B",
        },
        warning: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          500: "#D97706",
          600: "#B45309",
          700: "#92400E",
        },
        info: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
        },
      },
      boxShadow: {
        console: "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.06)",
        "console-lg": "0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 10px 15px -3px rgba(15, 23, 42, 0.08)",
        glass: "0 1px 1px 0 rgba(15, 23, 42, 0.03), 0 8px 24px -8px rgba(15, 23, 42, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)",
        "glass-lg": "0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 24px 48px -12px rgba(15, 23, 42, 0.18), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)",
        "glass-dark": "0 1px 0 0 rgba(255, 255, 255, 0.06) inset, 0 20px 40px -12px rgba(0, 0, 0, 0.45)",
        "glow-brand": "0 8px 24px -8px rgba(140, 100, 36, 0.45)",
      },
      borderRadius: {
        console: "10px",
        glass: "20px",
        "glass-sm": "14px",
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(6px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "highlight-fade": {
          "0%": {
            boxShadow: "0 0 0 4px rgba(140, 100, 36, 0.35)",
            backgroundColor: "rgba(251, 247, 236, 0.9)",
          },
          "65%": {
            boxShadow: "0 0 0 4px rgba(140, 100, 36, 0.35)",
            backgroundColor: "rgba(251, 247, 236, 0.9)",
          },
          "100%": {
            boxShadow: "0 0 0 0 rgba(140, 100, 36, 0)",
            backgroundColor: "rgba(255, 255, 255, 0)",
          },
        },
      },
      animation: {
        shimmer: "shimmer 2.4s linear infinite",
        "fade-scale-in": "fade-scale-in 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
        "highlight-fade": "highlight-fade 2.4s ease-out",
      },
    },
  },
  plugins: [],
};
