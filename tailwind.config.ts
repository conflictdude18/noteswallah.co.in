import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#ff2d3d",
          redDark: "#b9101d",
          dark: "#050607",
          panel: "#0b0f14",
          card: "#10151c",
          border: "rgba(255,255,255,0.10)",
          muted: "#9ca3af",
        },
      },
      boxShadow: {
        glow: "0 0 35px rgba(255, 45, 61, 0.28)",
        card: "0 20px 80px rgba(0, 0, 0, 0.45)",
      },
      backgroundImage: {
        "premium-radial":
          "radial-gradient(circle at top right, rgba(255,45,61,0.18), transparent 35%), radial-gradient(circle at bottom left, rgba(255,45,61,0.10), transparent 30%)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;