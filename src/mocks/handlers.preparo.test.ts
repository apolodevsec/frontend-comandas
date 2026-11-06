import { describe, expect, it } from "vitest";
import type { Comanda, EntregaPendente, TicketDePreparo } from "@/domain/tipos";
import {
  API,
  comandaComConsumo,
  comoBar,
  comoCaixa,
  comoCozinha,
  comoGarcom,
  prepararContrato,
} from "@/test/contrato";

/** Seam 3 (continuacao): preparo por Destino, entrega e cancelamento de Pedido. */
prepararContrato();

function tickets(destino: string): Promise<Response> {
  return fetch(`${API}/api/preparo?destino=${destino}`);
}

function avancar(pedidoId: string, destino: string, headers: Record<string, string>) {
  return fetch(`${API}/api/pedidos/${pedidoId}/avancar`, {
    method: "POST",
    headers,
    body: JSON.stringify({ destino }),
  });
}

describe("GET /api/preparo", () => {
  it("entrega ao Destino apenas os itens que sao dele", async () => {
    await comandaComConsumo();

    const daCozinha: TicketDePreparo[] = await (await tickets("cozinha")).json();
    const doBar: TicketDePreparo[] = await (await tickets("bar")).json();

    expect(daCozinha).toHaveLength(1);
    expect(daCozinha[0]?.destino).toBe("cozinha");
    expect(daCozinha[0]?.itens.map((item) => item.nome)).toEqual([
      "Porcao de mandioca frita",
    ]);
    expect(daCozinha[0]?.itens[0]?.observacao).toBe("sem sal");
    expect(daCozinha[0]?.mesaNumero).toBe(5);

    expect(doBar).toHaveLength(1);
    expect(doBar[0]?.itens.map((item) => item.nome)).toEqual(["Chopp Pilsen 500ml"]);
  });

  it("recusa consulta sem Destino com 422", async () => {
    const resposta = await fetch(`${API}/api/preparo`);

    expect(resposta.status).toBe(422);
  });
});

describe("POST /api/pedidos/:id/avancar", () => {
  it("recusa quem nao responde pelo Destino com 403", async () => {
    const comanda = await comandaComConsumo();
    const pedidoId = comanda.pedidos[0]?.id ?? "";

    const resposta = await avancar(pedidoId, "cozinha", comoBar);

    expect(resposta.status).toBe(403);
    expect((await resposta.json()).erro.codigo).toBe("PAPEL_SEM_PERMISSAO");
  });

  it("leva o Destino de pendente a pronto e recusa o passo seguinte", async () => {
    const comanda = await comandaComConsumo();
    const pedidoId = comanda.pedidos[0]?.id ?? "";

    const emPreparo: Comanda = await (await avancar(pedidoId, "cozinha", comoCozinha)).json();
    expect(emPreparo.pedidos[0]?.preparo.cozinha).toBe("em_preparo");

    const pronto: Comanda = await (await avancar(pedidoId, "cozinha", comoCozinha)).json();
    expect(pronto.pedidos[0]?.preparo.cozinha).toBe("pronto");

    const demais = await avancar(pedidoId, "cozinha", comoCozinha);
    expect(demais.status).toBe(409);
    expect((await demais.json()).erro.codigo).toBe("PREPARO_JA_CONCLUIDO");
  });

  it("responde 404 para Pedido inexistente", async () => {
    const resposta = await avancar("pedido-que-nao-existe", "cozinha", comoCozinha);

    expect(resposta.status).toBe(404);
  });
});

describe("entrega de um Pedido", () => {
  async function prontoNosDoisDestinos(): Promise<string> {
    const comanda = await comandaComConsumo();
    const pedidoId = comanda.pedidos[0]?.id ?? "";
    await avancar(pedidoId, "cozinha", comoCozinha);
    await avancar(pedidoId, "cozinha", comoCozinha);
    await avancar(pedidoId, "bar", comoBar);
    await avancar(pedidoId, "bar", comoBar);
    return pedidoId;
  }

  it("so entra na fila de entregas quando todos os Destinos ficam prontos", async () => {
    const comanda = await comandaComConsumo();
    const pedidoId = comanda.pedidos[0]?.id ?? "";

    await avancar(pedidoId, "cozinha", comoCozinha);
    await avancar(pedidoId, "cozinha", comoCozinha);
    const aindaNao: EntregaPendente[] = await (await fetch(`${API}/api/entregas`)).json();
    expect(aindaNao).toHaveLength(0);

    await avancar(pedidoId, "bar", comoBar);
    await avancar(pedidoId, "bar", comoBar);
    const agora: EntregaPendente[] = await (await fetch(`${API}/api/entregas`)).json();
    expect(agora).toHaveLength(1);
    expect(agora[0]?.mesaNumero).toBe(5);
    expect(agora[0]?.itens).toHaveLength(2);
  });

  it("somente o Garcom entrega", async () => {
    const pedidoId = await prontoNosDoisDestinos();

    const peloCaixa = await fetch(`${API}/api/pedidos/${pedidoId}/entregar`, {
      method: "POST",
      headers: comoCaixa,
    });
    expect(peloCaixa.status).toBe(403);

    const peloGarcom = await fetch(`${API}/api/pedidos/${pedidoId}/entregar`, {
      method: "POST",
      headers: comoGarcom,
    });
    expect(peloGarcom.status).toBe(200);
  });

  it("sai da fila de entregas e do painel de preparo depois de entregue", async () => {
    const pedidoId = await prontoNosDoisDestinos();
    await fetch(`${API}/api/pedidos/${pedidoId}/entregar`, { method: "POST", headers: comoGarcom });

    const entregas: EntregaPendente[] = await (await fetch(`${API}/api/entregas`)).json();
    const preparo: TicketDePreparo[] = await (await tickets("cozinha")).json();

    expect(entregas).toHaveLength(0);
    expect(preparo).toHaveLength(0);
  });

  it("recusa entregar um Pedido que ainda nao esta pronto", async () => {
    const comanda = await comandaComConsumo();
    const pedidoId = comanda.pedidos[0]?.id ?? "";

    const resposta = await fetch(`${API}/api/pedidos/${pedidoId}/entregar`, {
      method: "POST",
      headers: comoGarcom,
    });

    expect(resposta.status).toBe(409);
    expect((await resposta.json()).erro.codigo).toBe("PEDIDO_NAO_PRONTO");
  });
});

describe("POST /api/pedidos/:id/cancelar", () => {
  it("cancela o Pedido e tira o consumo do total", async () => {
    const comanda = await comandaComConsumo();
    expect(comanda.totais.totalEmCentavos).toBe(7733);
    const pedidoId = comanda.pedidos[0]?.id ?? "";

    const resposta = await fetch(`${API}/api/pedidos/${pedidoId}/cancelar`, {
      method: "POST",
      headers: comoGarcom,
    });

    expect(resposta.status).toBe(200);
    const semConsumo: Comanda = await resposta.json();
    expect(semConsumo.pedidos[0]?.cancelado).toBe(true);
    expect(semConsumo.pedidos[0]?.itens.every((item) => item.cancelado)).toBe(true);
    expect(semConsumo.totais.totalEmCentavos).toBe(0);
  });

  it("recusa cancelar um Pedido ja pronto com 409", async () => {
    const comanda = await comandaComConsumo();
    const pedidoId = comanda.pedidos[0]?.id ?? "";
    await avancar(pedidoId, "cozinha", comoCozinha);
    await avancar(pedidoId, "cozinha", comoCozinha);
    await avancar(pedidoId, "bar", comoBar);
    await avancar(pedidoId, "bar", comoBar);

    const resposta = await fetch(`${API}/api/pedidos/${pedidoId}/cancelar`, {
      method: "POST",
      headers: comoGarcom,
    });

    expect(resposta.status).toBe(409);
    expect((await resposta.json()).erro.codigo).toBe("PEDIDO_JA_PRONTO");
  });
});
