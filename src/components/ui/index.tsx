import * as Dialog from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { Loader2, X } from "lucide-react";
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { estilosDeBotao } from "./estilos";

/** Primitivos de UI no estilo shadcn: o codigo fica no repo, nao numa dependencia. */

export interface PropsDoBotao
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof estilosDeBotao> {
  carregando?: boolean;
}

export function Botao({
  className,
  variante,
  tamanho,
  largura,
  carregando = false,
  disabled,
  children,
  ...resto
}: PropsDoBotao) {
  return (
    <button
      className={cn(estilosDeBotao({ variante, tamanho, largura }), className)}
      disabled={disabled === true || carregando}
      {...resto}
    >
      {carregando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function Cartao({ className, ...resto }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-borda bg-superficie shadow-sm", className)}
      {...resto}
    />
  );
}

const estilosDeEtiqueta = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      tom: {
        neutro: "bg-fundo text-texto-suave border border-borda",
        pendente: "bg-pendente/15 text-pendente",
        preparo: "bg-preparo/15 text-preparo",
        pronto: "bg-pronto/15 text-pronto",
        perigo: "bg-perigo/15 text-perigo",
      },
    },
    defaultVariants: { tom: "neutro" },
  },
);

export interface PropsDaEtiqueta
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof estilosDeEtiqueta> {}

export function Etiqueta({ className, tom, ...resto }: PropsDaEtiqueta) {
  return <span className={cn(estilosDeEtiqueta({ tom }), className)} {...resto} />;
}

export interface PropsDoCampo extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  erro?: string | null;
}

export function Campo({ etiqueta, erro = null, className, id, ...resto }: PropsDoCampo) {
  const identificador = id ?? `campo-${etiqueta.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={identificador} className="text-sm font-medium text-texto">
        {etiqueta}
      </label>
      <input
        id={identificador}
        className={cn(
          "min-h-toque rounded-lg border border-borda bg-superficie px-3 text-base text-texto placeholder:text-texto-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria",
          erro !== null && "border-perigo",
          className,
        )}
        aria-invalid={erro !== null}
        {...resto}
      />
      {erro !== null ? (
        <p role="alert" className="text-sm text-perigo">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

export interface PropsDoModal {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
}

export function Modal({ aberto, aoFechar, titulo, descricao, children }: PropsDoModal) {
  return (
    <Dialog.Root open={aberto} onOpenChange={(estado) => (estado ? undefined : aoFechar())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-borda bg-superficie p-5 shadow-lg">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-texto">{titulo}</Dialog.Title>
              {descricao !== undefined ? (
                <Dialog.Description className="mt-1 text-sm text-texto-suave">
                  {descricao}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close asChild>
              <Botao variante="fantasma" tamanho="sm" aria-label="Fechar">
                <X className="size-4" aria-hidden />
              </Botao>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Carregando({ rotulo = "Carregando..." }: { rotulo?: string }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 py-10 text-sm text-texto-suave"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {rotulo}
    </div>
  );
}

export function Vazio({ titulo, descricao }: { titulo: string; descricao?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
      <p className="font-medium text-texto">{titulo}</p>
      {descricao !== undefined ? <p className="text-sm text-texto-suave">{descricao}</p> : null}
    </div>
  );
}

export function AvisoDeErro({ mensagem, aoTentarNovamente }: { mensagem: string; aoTentarNovamente?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-perigo/40 bg-perigo/10 p-4 text-sm">
      <p className="font-medium text-perigo">{mensagem}</p>
      {aoTentarNovamente !== undefined ? (
        <Botao variante="secundaria" tamanho="sm" className="mt-3" onClick={aoTentarNovamente}>
          Tentar novamente
        </Botao>
      ) : null}
    </div>
  );
}
