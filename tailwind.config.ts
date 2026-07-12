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
        // Zikra brend ranglari — logo "Z" ning teal/yashil rangi
        brand: {
          DEFAULT: "#12A594", // teal — asosiy (logo)
          50: "#E9FBF6",
          100: "#C9F4EA",
          200: "#98E9D9",
          300: "#5FD7C4",
          400: "#2CC1AC",
          500: "#12A594",
          600: "#0E8578",
          700: "#0C6961",
          800: "#0D544E",
          900: "#0B403B",
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
          DEFAULT: "#C99A2E", // oltin — logo "Z" ning oltin nuri (muhim harakatlar)
          50: "#FAF3E1",
          100: "#F3E4B8",
          500: "#C99A2E",
          600: "#A67F26",
          700: "#7D5F1D",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "card-hover": "0 10px 30px -12px rgba(18,165,148,0.28)",
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
