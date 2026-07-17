import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#FAF7F2",
        cream: "#F3EDE3",
        ink: "#141210",
        smoke: "#44403C",
        gold: "#A16207",
        goldlight: "#D9A521",
        blush: "#E8D5C4",
        sage: "#8A9A7B",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        riseUp: {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slowZoom: {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.08)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        riseUp: "riseUp 0.9s cubic-bezier(0.22,1,0.36,1) both",
        fadeIn: "fadeIn 1.2s ease both",
        slowZoom: "slowZoom 14s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
