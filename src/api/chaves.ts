import type { Destino, StatusComanda } from "@/domain/tipos";

/** Chaves do React Query em um lugar so, para invalidacao previsivel. */
export const chaves = {
  cardapio: ["cardapio"] as const,
  mesas: ["mesas"] as const,
  comandas: (status?: StatusComanda) => ["comandas", status ?? "todas"] as const,
  comanda: (id: string) => ["comanda", id] as const,
  preparo: (destino: Destino) => ["preparo", destino] as const,
  entregas: ["entregas"] as const,
};
