import { describe, expect, it } from "vitest";
import { umItemDoPedido, umPedido, umaComanda } from "@/test/builders";
import { calcularTotais, estaQuitada, previaDaRodada } from "./pricing";

/** Exemplo trabalhado a mao: 2 chopps a 18,90 = 37,80; 1 porcao a 32,50. Consumo 70,30. */
const DOIS_CHOPPS_E_UMA_PORCAO = umPedido({
  itens: [
    umItemDoPedido({ id: "i1", precoUnitarioEmCentavos: 1890, quantidade: 2, destino: "bar" }),
    umItemDoPedido({ id: "i2", precoUnitarioEmCentavos: 3250, quantidade: 1, destino: "cozinha" }),
  ],
});

describe("totais de uma Comanda", () => {
  it("zera tudo numa Comanda sem consumo", () => {
    const totais = calcularTotais(umaComanda({ pedidos: [] }));

    expect(totais).toEqual({
      consumoEmCentavos: 0,
      taxaDeServicoEmCentavos: 0,
      totalEmCentavos: 0,
      pagoEmCentavos: 0,
      saldoEmCentavos: 0,
    });
  });

  it("soma o consumo e aplica 10% de taxa de servico", () => {
    const totais = calcularTotais(
      umaComanda({ pedidos: [DOIS_CHOPPS_E_UMA_PORCAO], taxaDeServicoAplicada: true }),
    );

    expect(totais.consumoEmCentavos).toBe(7030);
    expect(totais.taxaDeServicoEmCentavos).toBe(703);
    expect(totais.totalEmCentavos).toBe(7733);
  });

  it("nao cobra a taxa quando o cliente recusa", () => {
    const totais = calcularTotais(
      umaComanda({ pedidos: [DOIS_CHOPPS_E_UMA_PORCAO], taxaDeServicoAplicada: false }),
    );

    expect(totais.taxaDeServicoEmCentavos).toBe(0);
    expect(totais.totalEmCentavos).toBe(7030);
  });

  it("arredonda a taxa ao centavo mais proximo", () => {
    const umItemDe1995 = umPedido({
      itens: [umItemDoPedido({ precoUnitarioEmCentavos: 1995, quantidade: 1 })],
    });

    const totais = calcularTotais(umaComanda({ pedidos: [umItemDe1995] }));

    expect(totais.taxaDeServicoEmCentavos).toBe(200);
    expect(totais.totalEmCentavos).toBe(2195);
  });

  it("deixa Item cancelado fora do consumo", () => {
    const comItemCancelado = umPedido({
      itens: [
        umItemDoPedido({ id: "i1", precoUnitarioEmCentavos: 1890, quantidade: 2 }),
        umItemDoPedido({ id: "i2", precoUnitarioEmCentavos: 3250, cancelado: true }),
      ],
    });

    const totais = calcularTotais(
      umaComanda({ pedidos: [comItemCancelado], taxaDeServicoAplicada: false }),
    );

    expect(totais.consumoEmCentavos).toBe(3780);
  });

  it("deixa Pedido cancelado inteiro fora do consumo", () => {
    const totais = calcularTotais(
      umaComanda({
        pedidos: [DOIS_CHOPPS_E_UMA_PORCAO, umPedido({ id: "p2", cancelado: true })],
        taxaDeServicoAplicada: false,
      }),
    );

    expect(totais.consumoEmCentavos).toBe(7030);
  });

  it("desconta pagamentos parciais do saldo", () => {
    const totais = calcularTotais(
      umaComanda({
        pedidos: [DOIS_CHOPPS_E_UMA_PORCAO],
        pagamentos: [
          { id: "pg1", forma: "pix", valorEmCentavos: 4000, registradoEm: "2026-11-05T22:00:00Z" },
        ],
      }),
    );

    expect(totais.totalEmCentavos).toBe(7733);
    expect(totais.pagoEmCentavos).toBe(4000);
    expect(totais.saldoEmCentavos).toBe(3733);
  });
});

describe("quitacao", () => {
  it("esta quitada quando o saldo chega a zero ou vira troco", () => {
    expect(estaQuitada({ saldoEmCentavos: 0 })).toBe(true);
    expect(estaQuitada({ saldoEmCentavos: -267 })).toBe(true);
    expect(estaQuitada({ saldoEmCentavos: 1 })).toBe(false);
  });
});

describe("previa de uma rodada em montagem", () => {
  it("soma o que o Garcom escolheu, antes de lancar", () => {
    const previa = previaDaRodada([
      { precoUnitarioEmCentavos: 1890, quantidade: 2 },
      { precoUnitarioEmCentavos: 3250, quantidade: 1 },
    ]);

    expect(previa).toBe(7030);
  });

  it("e zero com a rodada vazia", () => {
    expect(previaDaRodada([])).toBe(0);
  });
});
