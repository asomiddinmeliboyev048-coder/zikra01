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
        // Zikra premium palitrasi — chuqur emerald/teal + nazokatli oltin
        brand: {
          DEFAULT: "#0B9B88",
          50: "#ECFDF8",
          100: "#D1FAEF",
          200: "#A7F3DF",
          300: "#6EE7CE",
          400: "#34CFB7",
          500: "#0B9B88",
          600: "#087D70",
          700: "#07645B",
          800: "#084F49",
          900: "#083F3B",
        },
        success: {
          DEFAULT: "#168A62",
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#168A62",
          600: "#107451",
          700: "#0D5D43",
        },
        accent: {
          DEFAULT: "#C99332",
          50: "#FFFAEB",
          100: "#FDF0C4",
          500: "#C99332",
          600: "#A97524",
          700: "#80581C",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(8,63,59,0.03), 0 8px 24px -12px rgba(8,63,59,0.16), inset 0 1px 0 rgba(255,255,255,0.7)",
        "card-hover": "0 22px 55px -24px rgba(7,100,91,0.42), 0 10px 24px -18px rgba(8,63,59,0.26), inset 0 1px 0 rgba(255,255,255,0.85)",
        premium: "0 30px 80px -32px rgba(7,100,91,0.38), 0 12px 32px -20px rgba(8,63,59,0.22)",
        glow: "0 0 0 1px rgba(11,155,136,0.10), 0 12px 35px -15px rgba(11,155,136,0.45)",
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
