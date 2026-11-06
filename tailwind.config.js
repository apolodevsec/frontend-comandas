import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        borda: "hsl(var(--borda))",
        fundo: "hsl(var(--fundo))",
        superficie: "hsl(var(--superficie))",
        texto: "hsl(var(--texto))",
        "texto-suave": "hsl(var(--texto-suave))",
        primaria: "hsl(var(--primaria))",
        "primaria-texto": "hsl(var(--primaria-texto))",
        pendente: "hsl(var(--pendente))",
        preparo: "hsl(var(--preparo))",
        pronto: "hsl(var(--pronto))",
        perigo: "hsl(var(--perigo))",
      },
      borderRadius: { lg: "0.625rem", xl: "0.875rem" },
      /** Alvo de toque confortavel para o Garcom em celular. */
      minHeight: { toque: "2.75rem" },
    },
  },
  plugins: [animate],
};
