import { describe, expect, it } from "vitest";
import type { Comanda, ItemDoCardapio } from "@/domain/tipos";
import { API, abrirComandaNaMesa, prepararContrato } from "@/test/contrato";

/**
 * Seam 3: o contrato da API, exercitado por HTTP real (docs/adr/0001).
 * Estes testes SAO a especificacao que o backend precisa satisfazer.
 */
prepararContrato();

describe("POST /api/sessao", () => {
  it("autentica e devolve o papel do usuario", async () => {
    const resposta = await fetch(`${API}/api/sessao`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ usuario: "u-1", senha: "123456" }),
    });

    expect(resposta.status).toBe(200);
    const corpo = await resposta.json();
    expect(corpo.usuario.papel).toBe("garcom");
    expect(corpo.token).toBeTruthy();
    expect(corpo.usuario.senha).toBeUndefined();
  });

  it("recusa senha errada com 401", async () => {
    const resposta = await fetch(`${API}/api/sessao`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ usuario: "u-1", senha: "errada" }),
    });

    expect(resposta.status).toBe(401);
    expect((await resposta.json()).erro.codigo).toBe("CREDENCIAIS_INVALIDAS");
  });
});

describe("GET /api/cardapio", () => {
  it("entrega os itens com Destino e disponibilidade", async () => {
    const resposta = await fetch(`${API}/api/cardapio`);

    expect(resposta.status).toBe(200);
    const itens: ItemDoCardapio[] = await resposta.json();
    expect(itens.length).toBeGreaterThan(10);
    expect(itens.some((item) => item.destino === "bar")).toBe(true);
    expect(itens.some((item) => item.destino === "cozinha")).toBe(true);
    expect(itens.some((item) => !item.disponivel)).toBe(true);
  });
});

describe("GET /api/mesas", () => {
  it("devolve toda Mesa como livre antes de qualquer Comanda", async () => {
    const resposta = await fetch(`${API}/api/mesas`);

    expect(resposta.status).toBe(200);
    const mesas = await resposta.json();
    expect(mesas).toHaveLength(12);
    expect(mesas.every((mesa: { status: string }) => mesa.status === "livre")).toBe(true);
  });

  it("marca a Mesa como ocupada depois de abrir a Comanda", async () => {
    await abrirComandaNaMesa("mesa-7");

    const mesas = await (await fetch(`${API}/api/mesas`)).json();
    const mesa7 = mesas.find((mesa: { id: string }) => mesa.id === "mesa-7");
    expect(mesa7.status).toBe("ocupada");
    expect(mesa7.comandaId).toBeTruthy();
  });
});

describe("POST /api/comandas", () => {
  it("abre a Comanda na Mesa e numera em sequencia", async () => {
    const primeira = await abrirComandaNaMesa("mesa-1");
    expect(primeira.status).toBe(201);
    const comanda: Comanda = await primeira.json();
    expect(comanda.status).toBe("aberta");
    expect(comanda.numero).toBe(1);
    expect(comanda.mesaId).toBe("mesa-1");
    expect(comanda.totais.totalEmCentavos).toBe(0);

    const segunda = await abrirComandaNaMesa("mesa-2");
    expect((await segunda.json()).numero).toBe(2);
  });

  it("recusa uma segunda Comanda na mesma Mesa com 409", async () => {
    await abrirComandaNaMesa("mesa-3");

    const repetida = await abrirComandaNaMesa("mesa-3");

    expect(repetida.status).toBe(409);
    expect((await repetida.json()).erro.codigo).toBe("MESA_OCUPADA");
  });

  it("abre Comanda Avulsa sem Mesa", async () => {
    const resposta = await abrirComandaNaMesa(null);

    expect(resposta.status).toBe(201);
    expect((await resposta.json()).mesaId).toBeNull();
  });

  it("recusa Mesa inexistente com 404", async () => {
    const resposta = await abrirComandaNaMesa("mesa-999");

    expect(resposta.status).toBe(404);
  });
});

describe("GET /api/comandas/:id", () => {
  it("responde 404 para Comanda inexistente", async () => {
    const resposta = await fetch(`${API}/api/comandas/nao-existe`);

    expect(resposta.status).toBe(404);
    expect((await resposta.json()).erro.codigo).toBe("COMANDA_NAO_ENCONTRADA");
  });
});
