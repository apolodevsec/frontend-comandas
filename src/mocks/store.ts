import type { Comanda } from "@/domain/tipos";
import { CARDAPIO, MESAS, USUARIOS } from "./fixtures";

/**
 * O "banco" do mock. Vive em localStorage para sobreviver ao F5 e avisa as outras
 * abas por BroadcastChannel, para o fluxo Garcom -> Preparo funcionar entre telas
 * (docs/adr/0001). Nao existe equivalente disso no backend real.
 */
export interface EstadoDoMock {
  comandas: Comanda[];
  proximoNumeroDeComanda: number;
}

const CHAVE = "comandas:mock:v1";
const CANAL = "comandas:mock";

export const SEMENTE: EstadoDoMock = { comandas: [], proximoNumeroDeComanda: 1 };

export const CATALOGO = { mesas: MESAS, cardapio: CARDAPIO, usuarios: USUARIOS };

let emMemoria: EstadoDoMock = structuredClone(SEMENTE);

function canal(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  try {
    return new BroadcastChannel(CANAL);
  } catch {
    return null;
  }
}

function armazenamento(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function lerEstado(): EstadoDoMock {
  const bruto = armazenamento()?.getItem(CHAVE);
  if (bruto == null) return emMemoria;
  try {
    return JSON.parse(bruto) as EstadoDoMock;
  } catch {
    return emMemoria;
  }
}

export function gravarEstado(estado: EstadoDoMock): void {
  emMemoria = estado;
  armazenamento()?.setItem(CHAVE, JSON.stringify(estado));
  const transmissor = canal();
  if (transmissor !== null) {
    transmissor.postMessage({ tipo: "estado-alterado" });
    transmissor.close();
  }
}

export function resetarEstado(): void {
  emMemoria = structuredClone(SEMENTE);
  armazenamento()?.removeItem(CHAVE);
}

/** Avisa a aba atual quando outra aba escreve, para o React Query revalidar. */
export function observarOutrasAbas(aoAlterar: () => void): () => void {
  const receptor = canal();
  if (receptor === null) return () => undefined;
  receptor.onmessage = () => aoAlterar();
  return () => receptor.close();
}
