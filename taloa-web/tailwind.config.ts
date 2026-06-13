import type { Config } from "tailwindcss";

// Paleta da secao 10 do brief
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        taloa: {
          primary: "#1A6B4A",
          secondary: "#2D8C5E",
          alert: "#C0392B",
          warning: "#E67E22",
          info: "#2D5F8A",
          bg: "#F8FAF9",
          admin: "#F1F5F4",
        },
      },
      borderRadius: {
        card: "12px",
        input: "8px",
        badge: "999px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
