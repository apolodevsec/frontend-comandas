import { afterAll, afterEach, beforeAll } from "vitest";
import type { Comanda } from "@/domain/tipos";
import { servidorDeMock } from "@/mocks/server";
import { resetarEstado } from "@/mocks/store";

/**
 * Harness do seam 3: sobe o MSW em Node e exercita os handlers por HTTP real.
 * Os handlers usam caminhos relativos, como o app em producao; o MSW resolve
 * contra a origem, por isso a base aqui e a origem do jsdom.
 */
export const API = window.location.origin;

export const comoGarcom = { "content-type": "application/json", "x-papel": "garcom" };
export const comoCaixa = { "content-type": "application/json", "x-papel": "caixa" };
export const comoCozinha = { "content-type": "application/json", "x-papel": "cozinha" };
export const comoBar = { "content-type": "application/json", "x-papel": "bar" };

export function prepararContrato(): void {
  beforeAll(() => servidorDeMock.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    servidorDeMock.resetHandlers();
    resetarEstado();
  });
  afterAll(() => servidorDeMock.close());
}

export function abrirComandaNaMesa(mesaId: string | null): Promise<Response> {
  return fetch(`${API}/api/comandas`, {
    method: "POST",
    headers: comoGarcom,
    body: JSON.stringify({ mesaId, garcomId: "u-1" }),
  });
}

export interface ItemParaLancar {
  itemDoCardapioId: string;
  quantidade: number;
  observacao?: string | null;
}

export function lancarRodada(comandaId: string, itens: ItemParaLancar[]): Promise<Response> {
  return fetch(`${API}/api/comandas/${comandaId}/pedidos`, {
    method: "POST",
    headers: comoGarcom,
    body: JSON.stringify({ itens }),
  });
}

export function fecharComandaNaApi(comandaId: string): Promise<Response> {
  return fetch(`${API}/api/comandas/${comandaId}/fechar`, {
    method: "POST",
    headers: comoCaixa,
  });
}

/**
 * Comanda com 2 chopps (c-1, R$ 18,90) + 1 porcao (c-7, R$ 32,50).
 * Consumo 70,30; com taxa de 10%, total 77,33. Numeros conferidos a mao.
 */
export async function comandaComConsumo(mesaId = "mesa-5"): Promise<Comanda> {
  const aberta: Comanda = await (await abrirComandaNaMesa(mesaId)).json();
  const resposta = await lancarRodada(aberta.id, [
    { itemDoCardapioId: "c-1", quantidade: 2, observacao: null },
    { itemDoCardapioId: "c-7", quantidade: 1, observacao: "sem sal" },
  ]);
  return resposta.json();
}
