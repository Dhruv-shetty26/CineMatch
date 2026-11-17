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
        // Deep Charcoal Black palette
        charcoal: {
          950: "#07090e",
          900: "#0b0e14",
          850: "#10141d",
          800: "#161b26",
          700: "#222a3a",
          600: "#323d52",
        },
        // Fiery Amber Gold palette
        amber: {
          50: "#fffbeb",
          100: "#fef3c7",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },
        // Cool Cyan Blue palette
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
        },
        // Crimson Red palette
        crimson: {
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
        },
      },
    },
  },
  plugins: [],
};
export default config;
