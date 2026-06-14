import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Zikra brend ranglari
        brand: {
          DEFAULT: "#534AB7", // binafsha — asosiy
          50: "#EEEDF8",
          100: "#DCDAF1",
          200: "#B9B5E3",
          300: "#9690D5",
          400: "#736BC7",
          500: "#534AB7",
          600: "#433B92",
          700: "#322C6E",
          800: "#221D49",
          900: "#110F25",
        },
        success: {
          DEFAULT: "#1D9E75", // yashil — o'rganish/muvaffaqiyat
          50: "#E8F6F1",
          100: "#D1EDE3",
          500: "#1D9E75",
          600: "#17805F",
          700: "#116047",
        },
        accent: {
          DEFAULT: "#D85A30", // to'q sariq-qizil — muhim harakatlar
          50: "#FBEDE7",
          100: "#F7DBCF",
          500: "#D85A30",
          600: "#B14826",
          700: "#86371D",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-hover": "0 10px 30px -12px rgba(83,74,183,0.25)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
