import { create } from "zustand";
import type { ItemDoCardapio } from "@/domain/tipos";

/**
 * Rodada em montagem: estado de UI, local e descartavel, por isso Zustand e nao
 * React Query. Fica fora do servidor até o Garcom tocar em "Lancar rodada".
 */
export interface LinhaDaRodada {
  item: ItemDoCardapio;
  quantidade: number;
  observacao: string;
}

interface EstadoDaRodada {
  comandaId: string | null;
  linhas: LinhaDaRodada[];
  comecar: (comandaId: string) => void;
  adicionar: (item: ItemDoCardapio) => void;
  remover: (itemId: string) => void;
  definirObservacao: (itemId: string, observacao: string) => void;
  limpar: () => void;
}

export const useRodada = create<EstadoDaRodada>((set) => ({
  comandaId: null,
  linhas: [],

  /** Trocar de comanda descarta o que estava em montagem, para nao lancar na mesa errada. */
  comecar: (comandaId) =>
    set((estado) => (estado.comandaId === comandaId ? estado : { comandaId, linhas: [] })),

  adicionar: (item) =>
    set((estado) => {
      const existente = estado.linhas.find((linha) => linha.item.id === item.id);
      if (existente === undefined) {
        return { linhas: [...estado.linhas, { item, quantidade: 1, observacao: "" }] };
      }
      return {
        linhas: estado.linhas.map((linha) =>
          linha.item.id === item.id ? { ...linha, quantidade: linha.quantidade + 1 } : linha,
        ),
      };
    }),

  remover: (itemId) =>
    set((estado) => ({
      linhas: estado.linhas.flatMap((linha) => {
        if (linha.item.id !== itemId) return [linha];
        return linha.quantidade > 1 ? [{ ...linha, quantidade: linha.quantidade - 1 }] : [];
      }),
    })),

  definirObservacao: (itemId, observacao) =>
    set((estado) => ({
      linhas: estado.linhas.map((linha) =>
        linha.item.id === itemId ? { ...linha, observacao } : linha,
      ),
    })),

  limpar: () => set({ linhas: [] }),
}));
