import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0a0f1e",
          deep: "#050811",
          light: "#121a30",
          lighter: "#1c294a",
          border: "#23355e",
        },
        gold: {
          DEFAULT: "#f0a500",
          dim: "#b87f00",
          bright: "#ffc129",
          glow: "rgba(240, 165, 0, 0.15)",
        },
        rust: {
          DEFAULT: "#c0392b",
          dim: "#962d22",
          bright: "#e74c3c",
          glow: "rgba(192, 57, 43, 0.15)",
        },
        parchment: {
          DEFAULT: "#e4dcd3",
          dark: "#c7bba8",
          light: "#faf6f0",
        },
        slate: {
          950: "#070b13",
        }
      },
      fontFamily: {
        mono: ["var(--font-mono)", "Courier New", "Courier", "monospace"],
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
        cinzel: ["var(--font-cinzel)", "Georgia", "serif"],
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(240, 165, 0, 0.2)',
        'rust-glow': '0 0 15px rgba(192, 57, 43, 0.2)',
        'cyber-border': 'inset 0 0 8px rgba(35, 53, 94, 0.5)',
      },
    },
  },
  plugins: [],
};

export default config;
