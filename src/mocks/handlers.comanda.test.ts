import { describe, expect, it } from "vitest";
import type { Comanda } from "@/domain/tipos";
import {
  API,
  abrirComandaNaMesa,
  comandaComConsumo,
  comoCaixa,
  comoGarcom,
  fecharComandaNaApi,
  lancarRodada,
  prepararContrato,
} from "@/test/contrato";

/** Seam 3 (continuacao): consumo, fechamento e pagamento. Este arquivo E a especificacao. */
prepararContrato();

describe("POST /api/comandas/:id/pedidos", () => {
  it("lanca a rodada e devolve os totais calculados pelo servidor", async () => {
    const comanda = await comandaComConsumo();

    expect(comanda.pedidos).toHaveLength(1);
    expect(comanda.pedidos[0]?.numero).toBe(1);
    expect(comanda.totais.consumoEmCentavos).toBe(7030);
    expect(comanda.totais.taxaDeServicoEmCentavos).toBe(703);
    expect(comanda.totais.totalEmCentavos).toBe(7733);
  });

  it("congela nome, preco e Destino do Item do Cardapio no lancamento", async () => {
    const comanda = await comandaComConsumo();
    const itens = comanda.pedidos[0]?.itens ?? [];

    expect(itens[0]).toMatchObject({
      itemDoCardapioId: "c-1",
      nome: "Chopp Pilsen 500ml",
      precoUnitarioEmCentavos: 1890,
      destino: "bar",
      quantidade: 2,
      cancelado: false,
    });
    expect(itens[1]).toMatchObject({ destino: "cozinha", observacao: "sem sal" });
  });

  it("abre o preparo pendente em cada Destino presente na rodada", async () => {
    const comanda = await comandaComConsumo();

    expect(comanda.pedidos[0]?.preparo).toEqual({ bar: "pendente", cozinha: "pendente" });
  });

  it("numera a segunda rodada em sequencia", async () => {
    const comanda = await comandaComConsumo();

    const comSegundaRodada: Comanda = await (
      await lancarRodada(comanda.id, [{ itemDoCardapioId: "c-4", quantidade: 1 }])
    ).json();

    expect(comSegundaRodada.pedidos).toHaveLength(2);
    expect(comSegundaRodada.pedidos[1]?.numero).toBe(2);
  });

  it("recusa Item indisponivel com 409", async () => {
    const aberta: Comanda = await (await abrirComandaNaMesa("mesa-6")).json();

    const resposta = await lancarRodada(aberta.id, [{ itemDoCardapioId: "c-6", quantidade: 1 }]);

    expect(resposta.status).toBe(409);
    expect((await resposta.json()).erro.codigo).toBe("ITEM_INDISPONIVEL");
  });

  it("recusa rodada vazia com 422", async () => {
    const aberta: Comanda = await (await abrirComandaNaMesa("mesa-8")).json();

    const resposta = await lancarRodada(aberta.id, []);

    expect(resposta.status).toBe(422);
  });

  it("recusa quantidade invalida com 422", async () => {
    const aberta: Comanda = await (await abrirComandaNaMesa("mesa-10")).json();

    const resposta = await lancarRodada(aberta.id, [{ itemDoCardapioId: "c-1", quantidade: 0 }]);

    expect(resposta.status).toBe(422);
  });

  it("recusa lancamento em Comanda fechada com 409", async () => {
    const comanda = await comandaComConsumo();
    await fecharComandaNaApi(comanda.id);

    const resposta = await lancarRodada(comanda.id, [{ itemDoCardapioId: "c-1", quantidade: 1 }]);

    expect(resposta.status).toBe(409);
    expect((await resposta.json()).erro.codigo).toBe("COMANDA_NAO_ABERTA");
  });
});

describe("fechar, reabrir e cancelar uma Comanda", () => {
  it("fecha a Comanda e deixa a Mesa em conta_pedida", async () => {
    const comanda = await comandaComConsumo();

    const fechada: Comanda = await (await fecharComandaNaApi(comanda.id)).json();
    expect(fechada.status).toBe("fechada");
    expect(fechada.fechadaEm).not.toBeNull();

    const mesas = await (await fetch(`${API}/api/mesas`)).json();
    const mesa5 = mesas.find((mesa: { id: string }) => mesa.id === "mesa-5");
    expect(mesa5.status).toBe("conta_pedida");
  });

  it("recusa fechar duas vezes com 409", async () => {
    const comanda = await comandaComConsumo();
    await fecharComandaNaApi(comanda.id);

    const repetido = await fecharComandaNaApi(comanda.id);

    expect(repetido.status).toBe(409);
    expect((await repetido.json()).erro.codigo).toBe("COMANDA_NAO_ABERTA");
  });

  it("reabre com motivo e recusa reabertura sem motivo", async () => {
    const comanda = await comandaComConsumo();
    await fecharComandaNaApi(comanda.id);

    const semMotivo = await fetch(`${API}/api/comandas/${comanda.id}/reabrir`, {
      method: "POST",
      headers: comoCaixa,
      body: JSON.stringify({ motivo: "  " }),
    });
    expect(semMotivo.status).toBe(422);

    const comMotivo = await fetch(`${API}/api/comandas/${comanda.id}/reabrir`, {
      method: "POST",
      headers: comoCaixa,
      body: JSON.stringify({ motivo: "cliente pediu agua" }),
    });
    expect(comMotivo.status).toBe(200);
    const reaberta: Comanda = await comMotivo.json();
    expect(reaberta.status).toBe("aberta");
    expect(reaberta.fechadaEm).toBeNull();
    expect(reaberta.motivoDeReabertura).toBe("cliente pediu agua");
  });

  it("recusa cancelar Comanda que ja tem consumo", async () => {
    const comanda = await comandaComConsumo();

    const resposta = await fetch(`${API}/api/comandas/${comanda.id}/cancelar`, {
      method: "POST",
      headers: comoGarcom,
    });

    expect(resposta.status).toBe(409);
    expect((await resposta.json()).erro.codigo).toBe("COMANDA_COM_CONSUMO");
  });

  it("cancela Comanda aberta por engano, sem consumo", async () => {
    const aberta: Comanda = await (await abrirComandaNaMesa("mesa-11")).json();

    const resposta = await fetch(`${API}/api/comandas/${aberta.id}/cancelar`, {
      method: "POST",
      headers: comoGarcom,
    });

    expect(resposta.status).toBe(200);
    expect((await resposta.json()).status).toBe("cancelada");

    const mesas = await (await fetch(`${API}/api/mesas`)).json();
    const mesa11 = mesas.find((mesa: { id: string }) => mesa.id === "mesa-11");
    expect(mesa11.status).toBe("livre");
  });
});

describe("PATCH /api/comandas/:id/taxa-de-servico", () => {
  it("recalcula o total quando o cliente recusa a taxa", async () => {
    const comanda = await comandaComConsumo();

    const resposta = await fetch(`${API}/api/comandas/${comanda.id}/taxa-de-servico`, {
      method: "PATCH",
      headers: comoCaixa,
      body: JSON.stringify({ aplicada: false }),
    });

    expect(resposta.status).toBe(200);
    const semTaxa: Comanda = await resposta.json();
    expect(semTaxa.taxaDeServicoAplicada).toBe(false);
    expect(semTaxa.totais.taxaDeServicoEmCentavos).toBe(0);
    expect(semTaxa.totais.totalEmCentavos).toBe(7030);
  });
});

describe("POST /api/comandas/:id/pagamentos", () => {
  it("recusa pagamento em Comanda aberta com 409", async () => {
    const aberta = await comandaComConsumo();

    const resposta = await fetch(`${API}/api/comandas/${aberta.id}/pagamentos`, {
      method: "POST",
      headers: comoCaixa,
      body: JSON.stringify({ forma: "pix", valorEmCentavos: 1000 }),
    });

    expect(resposta.status).toBe(409);
    expect((await resposta.json()).erro.codigo).toBe("COMANDA_NAO_FECHADA");
  });

  it("acumula pagamentos parciais e quita quando cobrem o total", async () => {
    const comanda = await comandaComConsumo();
    await fecharComandaNaApi(comanda.id);

    const parcial: Comanda = await (
      await fetch(`${API}/api/comandas/${comanda.id}/pagamentos`, {
        method: "POST",
        headers: comoCaixa,
        body: JSON.stringify({ forma: "pix", valorEmCentavos: 4000 }),
      })
    ).json();
    expect(parcial.status).toBe("fechada");
    expect(parcial.totais.saldoEmCentavos).toBe(3733);

    const quitada: Comanda = await (
      await fetch(`${API}/api/comandas/${comanda.id}/pagamentos`, {
        method: "POST",
        headers: comoCaixa,
        body: JSON.stringify({ forma: "credito", valorEmCentavos: 3733 }),
      })
    ).json();
    expect(quitada.status).toBe("paga");
    expect(quitada.pagaEm).not.toBeNull();
    expect(quitada.totais.saldoEmCentavos).toBe(0);
    expect(quitada.pagamentos).toHaveLength(2);
  });

  it("recusa valor zero com 422", async () => {
    const comanda = await comandaComConsumo();
    await fecharComandaNaApi(comanda.id);

    const resposta = await fetch(`${API}/api/comandas/${comanda.id}/pagamentos`, {
      method: "POST",
      headers: comoCaixa,
      body: JSON.stringify({ forma: "dinheiro", valorEmCentavos: 0 }),
    });

    expect(resposta.status).toBe(422);
  });
});

describe("GET /api/comandas", () => {
  it("filtra por status", async () => {
    const primeira = await comandaComConsumo();
    await abrirComandaNaMesa("mesa-9");
    await fecharComandaNaApi(primeira.id);

    const abertas: Comanda[] = await (await fetch(`${API}/api/comandas?status=aberta`)).json();
    const fechadas: Comanda[] = await (await fetch(`${API}/api/comandas?status=fechada`)).json();
    const todas: Comanda[] = await (await fetch(`${API}/api/comandas`)).json();

    expect(abertas).toHaveLength(1);
    expect(fechadas).toHaveLength(1);
    expect(todas).toHaveLength(2);
  });
});
