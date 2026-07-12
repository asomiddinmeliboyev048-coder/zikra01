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
        // Zikra brend ranglari — logotipdagi teal/mint palitra
        brand: {
          DEFAULT: "#14A08E", // teal — asosiy
          50: "#E7F7F4",
          100: "#C7ECE6",
          200: "#97DDD1",
          300: "#62CBBA",
          400: "#33B7A3",
          500: "#14A08E",
          600: "#0F8375",
          700: "#0C665B",
          800: "#0A4E46",
          900: "#073630",
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
        "card-hover": "0 10px 30px -12px rgba(20,160,142,0.28)",
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
