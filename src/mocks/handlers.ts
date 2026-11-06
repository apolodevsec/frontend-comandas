import { HttpResponse, http } from "msw";
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
} from "@/domain/estados";
import type { ErroDeTransicao, Transicao } from "@/domain/estados";
import type {
  Comanda,
  Destino,
  EntregaPendente,
  FormaDePagamento,
  ItemDoPedido,
  MesaNaVisao,
  Papel,
  Pedido,
  StatusComanda,
  StatusPreparo,
  TicketDePreparo,
} from "@/domain/tipos";
import { CATALOGO, gravarEstado, lerEstado } from "./store";

/**
 * O CONTRATO em forma executavel (docs/adr/0001). Cada handler aqui e um endpoint que
 * o backend precisa implementar com o mesmo corpo e o mesmo status. docs/CONTRATO.md
 * descreve a mesma coisa em prosa.
 *
 * Mapa de status: 401 credenciais | 403 papel sem permissao | 404 recurso ausente
 *                 409 conflito de estado | 422 payload invalido
 */

const CODIGOS_422 = new Set(["MOTIVO_OBRIGATORIO", "VALOR_INVALIDO", "PAYLOAD_INVALIDO"]);

function statusDoErro(codigo: string): number {
  if (codigo === "CREDENCIAIS_INVALIDAS") return 401;
  if (codigo === "PAPEL_SEM_PERMISSAO") return 403;
  if (codigo.endsWith("_NAO_ENCONTRADA") || codigo.endsWith("_NAO_ENCONTRADO")) return 404;
  if (CODIGOS_422.has(codigo)) return 422;
  return 409;
}

function erro(codigo: string, mensagem: string) {
  return HttpResponse.json({ erro: { codigo, mensagem } }, { status: statusDoErro(codigo) });
}

function recusar(codigo: string, mensagem: string): Transicao<never> {
  return { ok: false, erro: { codigo, mensagem } };
}

function responderErroDeTransicao(detalhe: ErroDeTransicao) {
  return erro(detalhe.codigo, detalhe.mensagem);
}

function comandaAtivaDaMesa(comandas: Comanda[], mesaId: string): Comanda | null {
  return (
    comandas.find(
      (comanda) =>
        comanda.mesaId === mesaId && (comanda.status === "aberta" || comanda.status === "fechada"),
    ) ?? null
  );
}

function buscarComanda(id: string): Comanda | null {
  return lerEstado().comandas.find((comanda) => comanda.id === id) ?? null;
}

function salvarComanda(comanda: Comanda): Comanda {
  const estado = lerEstado();
  gravarEstado({
    ...estado,
    comandas: estado.comandas.map((atual) => (atual.id === comanda.id ? comanda : atual)),
  });
  return comanda;
}

/** Aplica uma transicao do dominio a Comanda carregada e persiste o resultado. */
function responderTransicao(id: string, transicionar: (comanda: Comanda) => Transicao<Comanda>) {
  const comanda = buscarComanda(id);
  if (comanda === null) {
    return erro("COMANDA_NAO_ENCONTRADA", "Esta Comanda nao existe.");
  }
  const resultado = transicionar(comanda);
  if (!resultado.ok) {
    return responderErroDeTransicao(resultado.erro);
  }
  return HttpResponse.json(salvarComanda(comTotais(resultado.valor)));
}

interface ItemSolicitado {
  itemDoCardapioId: string;
  quantidade: number;
  observacao?: string | null;
}

/** Congela nome, preco e Destino do Cardapio no momento do lancamento. */
function montarPedido(comanda: Comanda, solicitados: ItemSolicitado[]): Transicao<Pedido> {
  if (!Array.isArray(solicitados) || solicitados.length === 0) {
    return recusar("PAYLOAD_INVALIDO", "Informe ao menos um item na rodada.");
  }

  const itens: ItemDoPedido[] = [];

  for (const [indice, solicitado] of solicitados.entries()) {
    if (!Number.isInteger(solicitado.quantidade) || solicitado.quantidade < 1) {
      return recusar("PAYLOAD_INVALIDO", "A quantidade deve ser um inteiro maior que zero.");
    }
    const doCardapio = CATALOGO.cardapio.find((item) => item.id === solicitado.itemDoCardapioId);
    if (doCardapio === undefined) {
      return recusar("ITEM_NAO_ENCONTRADO", "Este item nao existe no Cardapio.");
    }
    if (!doCardapio.disponivel) {
      return recusar("ITEM_INDISPONIVEL", `${doCardapio.nome} esta indisponivel.`);
    }
    itens.push({
      id: `item-${comanda.id}-${comanda.pedidos.length + 1}-${indice + 1}`,
      itemDoCardapioId: doCardapio.id,
      nome: doCardapio.nome,
      precoUnitarioEmCentavos: doCardapio.precoEmCentavos,
      quantidade: solicitado.quantidade,
      destino: doCardapio.destino,
      observacao: solicitado.observacao ?? null,
      cancelado: false,
    });
  }

  const preparo: Partial<Record<Destino, StatusPreparo>> = {};
  for (const item of itens) {
    preparo[item.destino] = "pendente";
  }

  return {
    ok: true,
    valor: {
      id: `pedido-${comanda.id}-${comanda.pedidos.length + 1}`,
      comandaId: comanda.id,
      numero: comanda.pedidos.length + 1,
      criadoEm: new Date().toISOString(),
      itens,
      preparo,
      entregue: false,
      cancelado: false,
    },
  };
}


const DESTINOS: Destino[] = ["cozinha", "bar"];

function papelDaRequisicao(request: Request): Papel {
  return (request.headers.get("x-papel") ?? "garcom") as Papel;
}

function numeroDaMesa(mesaId: string | null): number | null {
  if (mesaId === null) return null;
  return CATALOGO.mesas.find((mesa) => mesa.id === mesaId)?.numero ?? null;
}

/** Comandas que ainda estao em operacao: as pagas e canceladas saem dos paineis. */
function comandasEmOperacao(): Comanda[] {
  return lerEstado().comandas.filter(
    (comanda) => comanda.status === "aberta" || comanda.status === "fechada",
  );
}

function localizarPedido(pedidoId: string): { comanda: Comanda; pedido: Pedido } | null {
  for (const comanda of lerEstado().comandas) {
    const pedido = comanda.pedidos.find((atual) => atual.id === pedidoId);
    if (pedido !== undefined) return { comanda, pedido };
  }
  return null;
}

/** Aplica uma transicao a um Pedido e devolve a Comanda inteira, com totais refeitos. */
function responderTransicaoDePedido(
  pedidoId: string,
  transicionar: (pedido: Pedido) => Transicao<Pedido>,
) {
  const encontrado = localizarPedido(pedidoId);
  if (encontrado === null) {
    return erro("PEDIDO_NAO_ENCONTRADO", "Este Pedido nao existe.");
  }
  const resultado = transicionar(encontrado.pedido);
  if (!resultado.ok) {
    return responderErroDeTransicao(resultado.erro);
  }
  const atualizada: Comanda = {
    ...encontrado.comanda,
    pedidos: encontrado.comanda.pedidos.map((atual) =>
      atual.id === pedidoId ? resultado.valor : atual,
    ),
  };
  return HttpResponse.json(salvarComanda(comTotais(atualizada)));
}

function itensDaVisao(pedido: Pedido, destino: Destino | null) {
  return pedido.itens
    .filter((item) => !item.cancelado && (destino === null || item.destino === destino))
    .map((item) => ({
      nome: item.nome,
      quantidade: item.quantidade,
      observacao: item.observacao,
    }));
}

export const handlers = [
  http.post("/api/sessao", async ({ request }) => {
    const { usuario, senha } = (await request.json()) as { usuario: string; senha: string };
    const encontrado = CATALOGO.usuarios.find(
      (candidato) => candidato.id === usuario && candidato.senha === senha,
    );
    if (encontrado === undefined) {
      return erro("CREDENCIAIS_INVALIDAS", "Usuario ou senha incorretos.");
    }
    const { senha: _senha, ...semSenha } = encontrado;
    return HttpResponse.json({ token: `mock-${encontrado.id}`, usuario: semSenha });
  }),

  http.get("/api/cardapio", () => HttpResponse.json(CATALOGO.cardapio)),

  http.get("/api/mesas", () => {
    const { comandas } = lerEstado();
    const visao: MesaNaVisao[] = CATALOGO.mesas.map((mesa) => {
      const comanda = comandaAtivaDaMesa(comandas, mesa.id);
      return { ...mesa, status: statusDaMesa(comanda), comandaId: comanda?.id ?? null };
    });
    return HttpResponse.json(visao);
  }),

  http.get("/api/comandas", ({ request }) => {
    const status = new URL(request.url).searchParams.get("status") as StatusComanda | null;
    const { comandas } = lerEstado();
    const filtradas = status === null ? comandas : comandas.filter((c) => c.status === status);
    return HttpResponse.json(filtradas);
  }),

  http.post("/api/comandas", async ({ request }) => {
    const { mesaId, garcomId } = (await request.json()) as {
      mesaId: string | null;
      garcomId: string;
    };
    const estado = lerEstado();

    if (mesaId !== null) {
      if (!CATALOGO.mesas.some((mesa) => mesa.id === mesaId)) {
        return erro("MESA_NAO_ENCONTRADA", "Esta Mesa nao existe.");
      }
      if (comandaAtivaDaMesa(estado.comandas, mesaId) !== null) {
        return erro("MESA_OCUPADA", "Esta Mesa ja tem uma Comanda em aberto.");
      }
    }

    const numero = estado.proximoNumeroDeComanda;
    const nova = comTotais({
      id: `comanda-${numero}`,
      numero,
      mesaId,
      status: "aberta",
      abertaEm: new Date().toISOString(),
      fechadaEm: null,
      pagaEm: null,
      garcomId,
      taxaDeServicoAplicada: true,
      motivoDeReabertura: null,
      pedidos: [],
      pagamentos: [],
      totais: {
        consumoEmCentavos: 0,
        taxaDeServicoEmCentavos: 0,
        totalEmCentavos: 0,
        pagoEmCentavos: 0,
        saldoEmCentavos: 0,
      },
    });

    gravarEstado({ comandas: [...estado.comandas, nova], proximoNumeroDeComanda: numero + 1 });

    return HttpResponse.json(nova, { status: 201 });
  }),

  http.get("/api/comandas/:id", ({ params }) => {
    const comanda = buscarComanda(String(params.id));
    if (comanda === null) {
      return erro("COMANDA_NAO_ENCONTRADA", "Esta Comanda nao existe.");
    }
    return HttpResponse.json(comanda);
  }),

  http.post("/api/comandas/:id/pedidos", async ({ params, request }) => {
    const { itens } = (await request.json()) as { itens: ItemSolicitado[] };
    const comanda = buscarComanda(String(params.id));
    if (comanda === null) {
      return erro("COMANDA_NAO_ENCONTRADA", "Esta Comanda nao existe.");
    }
    if (comanda.status !== "aberta") {
      return erro("COMANDA_NAO_ABERTA", "Somente uma Comanda aberta aceita lancamento.");
    }

    const pedido = montarPedido(comanda, itens);
    if (!pedido.ok) {
      return responderErroDeTransicao(pedido.erro);
    }

    const comRodada = lancarPedido(comanda, pedido.valor);
    if (!comRodada.ok) {
      return responderErroDeTransicao(comRodada.erro);
    }

    return HttpResponse.json(salvarComanda(comTotais(comRodada.valor)), { status: 201 });
  }),

  http.post("/api/comandas/:id/fechar", ({ params }) =>
    responderTransicao(String(params.id), (comanda) => fecharComanda(comanda)),
  ),

  http.post("/api/comandas/:id/reabrir", async ({ params, request }) => {
    const { motivo } = (await request.json()) as { motivo: string };
    return responderTransicao(String(params.id), (comanda) => reabrirComanda(comanda, motivo ?? ""));
  }),

  http.post("/api/comandas/:id/cancelar", ({ params }) =>
    responderTransicao(String(params.id), (comanda) => cancelarComanda(comanda)),
  ),

  http.patch("/api/comandas/:id/taxa-de-servico", async ({ params, request }) => {
    const { aplicada } = (await request.json()) as { aplicada: boolean };
    return responderTransicao(String(params.id), (comanda) =>
      aplicarTaxaDeServico(comanda, aplicada === true),
    );
  }),

  http.post("/api/comandas/:id/pagamentos", async ({ params, request }) => {
    const { forma, valorEmCentavos } = (await request.json()) as {
      forma: FormaDePagamento;
      valorEmCentavos: number;
    };
    return responderTransicao(String(params.id), (comanda) =>
      registrarPagamento(comanda, forma, valorEmCentavos),
    );
  }),

  http.get("/api/preparo", ({ request }) => {
    const destino = new URL(request.url).searchParams.get("destino") as Destino | null;
    if (destino === null || !DESTINOS.includes(destino)) {
      return erro("PAYLOAD_INVALIDO", "Informe o destino: cozinha ou bar.");
    }

    const tickets: TicketDePreparo[] = comandasEmOperacao().flatMap((comanda) =>
      comanda.pedidos
        .filter((pedido) => !pedido.cancelado && !pedido.entregue)
        .flatMap((pedido) => {
          const status = pedido.preparo[destino];
          if (status === undefined) return [];
          return [
            {
              pedidoId: pedido.id,
              comandaId: comanda.id,
              numeroDaComanda: comanda.numero,
              numeroDoPedido: pedido.numero,
              mesaNumero: numeroDaMesa(comanda.mesaId),
              criadoEm: pedido.criadoEm,
              destino,
              status,
              itens: itensDaVisao(pedido, destino),
            },
          ];
        }),
    );

    return HttpResponse.json(tickets);
  }),

  http.get("/api/entregas", () => {
    const entregas: EntregaPendente[] = comandasEmOperacao().flatMap((comanda) =>
      comanda.pedidos
        .filter((pedido) => statusDoPedido(pedido) === "pronto")
        .map((pedido) => ({
          pedidoId: pedido.id,
          comandaId: comanda.id,
          numeroDaComanda: comanda.numero,
          numeroDoPedido: pedido.numero,
          mesaNumero: numeroDaMesa(comanda.mesaId),
          criadoEm: pedido.criadoEm,
          itens: itensDaVisao(pedido, null),
        })),
    );

    return HttpResponse.json(entregas);
  }),

  http.post("/api/pedidos/:id/avancar", async ({ params, request }) => {
    const { destino } = (await request.json()) as { destino: Destino };
    const papel = papelDaRequisicao(request);
    return responderTransicaoDePedido(String(params.id), (pedido) =>
      avancarPreparo(pedido, destino, papel),
    );
  }),

  http.post("/api/pedidos/:id/entregar", ({ params, request }) =>
    responderTransicaoDePedido(String(params.id), (pedido) =>
      marcarEntregue(pedido, papelDaRequisicao(request)),
    ),
  ),

  http.post("/api/pedidos/:id/cancelar", ({ params }) =>
    responderTransicaoDePedido(String(params.id), (pedido) => cancelarPedido(pedido)),
  ),
];
