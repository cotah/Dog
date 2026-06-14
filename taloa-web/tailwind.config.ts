import type { Config } from "tailwindcss";

// Branding oficial aprovado (azul petroleo + laranja). Substitui o verde antigo.
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
          primary: "#1A3A5C", // azul petroleo escuro (cor principal)
          secondary: "#2E86C1", // azul medio
          accent: "#E67E22", // laranja (destaque / call-to-action)
          alert: "#C0392B", // vermelho — perigo / pet perdido (mantido)
          warning: "#E67E22", // laranja — avisos (alinhado ao accent)
          info: "#2E86C1", // azul informativo (alinhado a secundaria)
          dark: "#0D1F2D", // background escuro
          light: "#FFFFFF", // texto claro
          bg: "#F6F8FB", // fundo claro neutro (sem tom esverdeado)
          admin: "#EEF2F6", // cinza-azulado do painel admin
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
