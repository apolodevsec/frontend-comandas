import { describe, expect, it } from "vitest";
import { umItemDoPedido, umPedido, umaComanda } from "@/test/builders";
import {
  aplicarTaxaDeServico,
  avancarPreparo,
  cancelarComanda,
  cancelarPedido,
  comTotais,
  fecharComanda,
  lancarPedido,
  marcarEntregue,
  reabrirComanda,
  registrarPagamento,
  statusDaMesa,
  statusDoPedido,
} from "./estados";

describe("fechar uma Comanda", () => {
  it("leva a Comanda aberta para fechada", () => {
    const resultado = fecharComanda(umaComanda({ status: "aberta" }));

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.status).toBe("fechada");
    expect(resultado.valor.fechadaEm).not.toBeNull();
  });

  it("recusa uma Comanda que nao esta aberta", () => {
    const resultado = fecharComanda(umaComanda({ status: "paga" }));

    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.erro.codigo).toBe("COMANDA_NAO_ABERTA");
  });
});

describe("reabrir uma Comanda", () => {
  it("volta de fechada para aberta registrando o motivo", () => {
    const fechada = umaComanda({ status: "fechada", fechadaEm: "2026-11-05T21:00:00.000Z" });

    const resultado = reabrirComanda(fechada, "cliente pediu uma agua");

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.status).toBe("aberta");
    expect(resultado.valor.fechadaEm).toBeNull();
    expect(resultado.valor.motivoDeReabertura).toBe("cliente pediu uma agua");
  });

  it("exige um motivo", () => {
    const resultado = reabrirComanda(umaComanda({ status: "fechada" }), "   ");

    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.erro.codigo).toBe("MOTIVO_OBRIGATORIO");
  });

  it("recusa uma Comanda paga, que e terminal", () => {
    const resultado = reabrirComanda(umaComanda({ status: "paga" }), "erro de caixa");

    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.erro.codigo).toBe("COMANDA_NAO_FECHADA");
  });
});

describe("cancelar uma Comanda", () => {
  it("recusa quando ja existe consumo lancado", () => {
    const comConsumo = umaComanda({ pedidos: [umPedido()] });

    const resultado = cancelarComanda(comConsumo);

    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.erro.codigo).toBe("COMANDA_COM_CONSUMO");
  });

  it("aceita uma Comanda aberta por engano, sem consumo", () => {
    const resultado = cancelarComanda(umaComanda({ pedidos: [] }));

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.status).toBe("cancelada");
  });
});

describe("lancar um Pedido numa Comanda", () => {
  it("anexa o Pedido e numera a rodada em sequencia", () => {
    const comUmaRodada = umaComanda({ pedidos: [umPedido({ numero: 1 })] });

    const resultado = lancarPedido(comUmaRodada, umPedido({ id: "pedido-2", numero: 99 }));

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.pedidos).toHaveLength(2);
    expect(resultado.valor.pedidos[1]?.numero).toBe(2);
  });

  it("recusa lancamento em Comanda fechada", () => {
    const resultado = lancarPedido(umaComanda({ status: "fechada" }), umPedido());

    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.erro.codigo).toBe("COMANDA_NAO_ABERTA");
  });
});

describe("status derivado de um Pedido", () => {
  it("esta pendente quando nenhum Destino comecou", () => {
    expect(statusDoPedido(umPedido({ preparo: { cozinha: "pendente", bar: "pendente" } }))).toBe(
      "pendente",
    );
  });

  it("esta em preparo quando um Destino ja terminou e o outro nao", () => {
    expect(statusDoPedido(umPedido({ preparo: { cozinha: "pronto", bar: "pendente" } }))).toBe(
      "em_preparo",
    );
  });

  it("so esta pronto quando todos os Destinos estao prontos", () => {
    expect(statusDoPedido(umPedido({ preparo: { cozinha: "pronto", bar: "pronto" } }))).toBe(
      "pronto",
    );
  });

  it("prioriza os estados terminais sobre o preparo", () => {
    const base = { cozinha: "pronto", bar: "pronto" } as const;
    expect(statusDoPedido(umPedido({ preparo: base, entregue: true }))).toBe("entregue");
    expect(statusDoPedido(umPedido({ preparo: base, entregue: true, cancelado: true }))).toBe(
      "cancelado",
    );
  });
});

describe("avancar o preparo de um Destino", () => {
  it("leva pendente para em_preparo e depois para pronto", () => {
    const pedido = umPedido({ preparo: { bar: "pendente" } });

    const iniciado = avancarPreparo(pedido, "bar", "bar");
    expect(iniciado.ok && iniciado.valor.preparo.bar).toBe("em_preparo");

    const pronto = avancarPreparo(iniciado.ok ? iniciado.valor : pedido, "bar", "bar");
    expect(pronto.ok && pronto.valor.preparo.bar).toBe("pronto");
  });

  it("recusa quem nao e responsavel pelo Destino", () => {
    const resultado = avancarPreparo(umPedido({ preparo: { bar: "pendente" } }), "bar", "cozinha");

    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.erro.codigo).toBe("PAPEL_SEM_PERMISSAO");
  });

  it("recusa um Destino que nao existe neste Pedido", () => {
    const resultado = avancarPreparo(umPedido({ preparo: { bar: "pendente" } }), "cozinha", "cozinha");

    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.erro.codigo).toBe("DESTINO_AUSENTE");
  });

  it("recusa avancar um Destino que ja esta pronto", () => {
    const resultado = avancarPreparo(umPedido({ preparo: { bar: "pronto" } }), "bar", "bar");

    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.erro.codigo).toBe("PREPARO_JA_CONCLUIDO");
  });
});

describe("entregar e cancelar um Pedido", () => {
  it("so o Garcom entrega, e so o que esta pronto", () => {
    const pronto = umPedido({ preparo: { bar: "pronto" } });

    expect(marcarEntregue(pronto, "garcom").ok).toBe(true);
    const porOutroPapel = marcarEntregue(pronto, "caixa");
    expect(porOutroPapel.ok).toBe(false);
    if (!porOutroPapel.ok) expect(porOutroPapel.erro.codigo).toBe("PAPEL_SEM_PERMISSAO");

    const aindaPendente = marcarEntregue(umPedido({ preparo: { bar: "pendente" } }), "garcom");
    expect(aindaPendente.ok).toBe(false);
    if (!aindaPendente.ok) expect(aindaPendente.erro.codigo).toBe("PEDIDO_NAO_PRONTO");
  });

  it("cancela em preparo, mas nao depois de pronto", () => {
    expect(cancelarPedido(umPedido({ preparo: { bar: "em_preparo" } })).ok).toBe(true);

    const jaPronto = cancelarPedido(umPedido({ preparo: { bar: "pronto" } }));
    expect(jaPronto.ok).toBe(false);
    if (!jaPronto.ok) expect(jaPronto.erro.codigo).toBe("PEDIDO_JA_PRONTO");
  });

  it("cancelar o Pedido cancela todos os seus Itens", () => {
    const resultado = cancelarPedido(umPedido({ preparo: { bar: "pendente" } }));

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.itens.every((item) => item.cancelado)).toBe(true);
  });
});

describe("status derivado de uma Mesa", () => {
  it("e livre sem Comanda, ocupada com Comanda aberta e conta_pedida com Comanda fechada", () => {
    expect(statusDaMesa(null)).toBe("livre");
    expect(statusDaMesa(umaComanda({ status: "aberta" }))).toBe("ocupada");
    expect(statusDaMesa(umaComanda({ status: "fechada" }))).toBe("conta_pedida");
  });

  it("volta a ser livre quando a Comanda e paga ou cancelada", () => {
    expect(statusDaMesa(umaComanda({ status: "paga" }))).toBe("livre");
    expect(statusDaMesa(umaComanda({ status: "cancelada" }))).toBe("livre");
  });
});

describe("registrar pagamento", () => {
  /** 2 chopps a 18,90 + porcao 32,50 = 70,30 de consumo; com taxa, 77,33. */
  const fechadaDe7733 = () =>
    comTotais(
      umaComanda({
        status: "fechada",
        fechadaEm: "2026-11-05T22:00:00.000Z",
        pedidos: [
          umPedido({
            itens: [
              umItemDoPedido({ id: "i1", precoUnitarioEmCentavos: 1890, quantidade: 2 }),
              umItemDoPedido({ id: "i2", precoUnitarioEmCentavos: 3250, quantidade: 1 }),
            ],
          }),
        ],
      }),
    );

  it("recusa pagamento em Comanda que nao esta fechada", () => {
    const resultado = registrarPagamento(umaComanda({ status: "aberta" }), "pix", 1000);

    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.erro.codigo).toBe("COMANDA_NAO_FECHADA");
  });

  it("recusa valor zero ou negativo", () => {
    const resultado = registrarPagamento(fechadaDe7733(), "dinheiro", 0);

    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.erro.codigo).toBe("VALOR_INVALIDO");
  });

  it("mantem a Comanda fechada enquanto o pagamento e parcial", () => {
    const resultado = registrarPagamento(fechadaDe7733(), "pix", 4000);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.status).toBe("fechada");
    expect(resultado.valor.totais.saldoEmCentavos).toBe(3733);
    expect(resultado.valor.pagaEm).toBeNull();
  });

  it("quita a Comanda quando a soma dos pagamentos cobre o total", () => {
    const primeiro = registrarPagamento(fechadaDe7733(), "pix", 4000);
    expect(primeiro.ok).toBe(true);
    if (!primeiro.ok) return;

    const segundo = registrarPagamento(primeiro.valor, "credito", 3733);
    expect(segundo.ok).toBe(true);
    if (!segundo.ok) return;
    expect(segundo.valor.status).toBe("paga");
    expect(segundo.valor.pagaEm).not.toBeNull();
    expect(segundo.valor.pagamentos).toHaveLength(2);
    expect(segundo.valor.totais.saldoEmCentavos).toBe(0);
  });

  it("aceita pagamento acima do total e registra o troco como saldo negativo", () => {
    const resultado = registrarPagamento(fechadaDe7733(), "dinheiro", 8000);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.status).toBe("paga");
    expect(resultado.valor.totais.saldoEmCentavos).toBe(-267);
  });
});

describe("alternar a taxa de servico", () => {
  it("recalcula o total ao recusar a taxa", () => {
    const comTaxa = comTotais(
      umaComanda({
        status: "fechada",
        pedidos: [umPedido({ itens: [umItemDoPedido({ precoUnitarioEmCentavos: 1000 })] })],
      }),
    );
    expect(comTaxa.totais.totalEmCentavos).toBe(1100);

    const resultado = aplicarTaxaDeServico(comTaxa, false);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.totais.taxaDeServicoEmCentavos).toBe(0);
    expect(resultado.valor.totais.totalEmCentavos).toBe(1000);
  });

  it("recusa alterar a taxa de uma Comanda ja paga", () => {
    const resultado = aplicarTaxaDeServico(umaComanda({ status: "paga" }), false);

    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.erro.codigo).toBe("COMANDA_ENCERRADA");
  });
});
