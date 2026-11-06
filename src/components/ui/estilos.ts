import { cva } from "class-variance-authority";

/** Estilos do Botao num modulo proprio, para que Link possa usar a mesma aparencia. */
export const estilosDeBotao = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria focus-visible:ring-offset-2 focus-visible:ring-offset-fundo",
  {
    variants: {
      variante: {
        primaria: "bg-primaria text-primaria-texto hover:opacity-90",
        secundaria: "bg-superficie text-texto border border-borda hover:bg-fundo",
        perigo: "bg-perigo text-white hover:opacity-90",
        fantasma: "text-texto hover:bg-fundo",
      },
      tamanho: {
        sm: "h-9 px-3 text-sm",
        md: "min-h-toque px-4 text-sm",
        lg: "min-h-toque h-12 px-5 text-base",
      },
      largura: { auto: "", cheia: "w-full" },
    },
    defaultVariants: { variante: "primaria", tamanho: "md", largura: "auto" },
  },
);
