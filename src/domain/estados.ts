import { calcularTotais, estaQuitada } from "./pricing";
import type {
  Centavos,
  Comanda,
  Destino,
  FormaDePagamento,
  Pagamento,
  Papel,
  Pedido,
  StatusMesa,
  StatusPedido,
  StatusPreparo,
} from "./tipos";

export interface ErroDeTransicao {
  codigo: string;
  mensagem: string;
}

export type Transicao<T> = { ok: true; valor: T } | { ok: false; erro: ErroDeTransicao };

function recusar(codigo: string, mensagem: string): Transicao<never> {
  return { ok: false, erro: { codigo, mensagem } };
}

export function fecharComanda(comanda: Comanda, agora = new Date()): Transicao<Comanda> {
  if (comanda.status !== "aberta") {
    return recusar("COMANDA_NAO_ABERTA", "Somente uma Comanda aberta pode ser fechada.");
  }
  return { ok: true, valor: { ...comanda, status: "fechada", fechadaEm: agora.toISOString() } };
}

export function reabrirComanda(comanda: Comanda, motivo: string): Transicao<Comanda> {
  if (comanda.status !== "fechada") {
    return recusar("COMANDA_NAO_FECHADA", "Somente uma Comanda fechada pode ser reaberta.");
  }
  if (motivo.trim() === "") {
    return recusar("MOTIVO_OBRIGATORIO", "Informe o motivo da reabertura.");
  }
  return {
    ok: true,
    valor: { ...comanda, status: "aberta", fechadaEm: null, motivoDeReabertura: motivo.trim() },
  };
}

export function cancelarComanda(comanda: Comanda): Transicao<Comanda> {
  if (comanda.status !== "aberta") {
    return recusar("COMANDA_NAO_ABERTA", "Somente uma Comanda aberta pode ser cancelada.");
  }
  if (comanda.pedidos.length > 0) {
    return recusar(
      "COMANDA_COM_CONSUMO",
      "Esta Comanda tem consumo lancado; cancele os Pedidos antes.",
    );
  }
  return { ok: true, valor: { ...comanda, status: "cancelada" } };
}

export function lancarPedido(comanda: Comanda, pedido: Pedido): Transicao<Comanda> {
  if (comanda.status !== "aberta") {
    return recusar("COMANDA_NAO_ABERTA", "Somente uma Comanda aberta aceita lancamento.");
  }
  const numero = comanda.pedidos.length + 1;
  return {
    ok: true,
    valor: {
      ...comanda,
      pedidos: [...comanda.pedidos, { ...pedido, numero, comandaId: comanda.id }],
    },
  };
}

const PROXIMO_PREPARO: Record<StatusPreparo, StatusPreparo | null> = {
  pendente: "em_preparo",
  em_preparo: "pronto",
  pronto: null,
};

/** Cozinha e Bar respondem pelo Destino de mesmo nome; os outros papeis, por nenhum. */
export function destinoDoPapel(papel: Papel): Destino | null {
  return papel === "cozinha" || papel === "bar" ? papel : null;
}

/**
 * Um Pedido so esta pronto quando TODOS os seus Destinos estao prontos (docs/adr e Q18);
 * com um Destino pronto e outro nao, o Pedido esta em preparo.
 */
export function statusDoPedido(pedido: Pedido): StatusPedido {
  if (pedido.cancelado) return "cancelado";
  if (pedido.entregue) return "entregue";

  const estados = Object.values(pedido.preparo).filter(
    (estado): estado is StatusPreparo => estado !== undefined,
  );
  if (estados.length === 0) return "pendente";
  if (estados.every((estado) => estado === "pronto")) return "pronto";
  if (estados.some((estado) => estado !== "pendente")) return "em_preparo";
  return "pendente";
}

export function avancarPreparo(
  pedido: Pedido,
  destino: Destino,
  papel: Papel,
): Transicao<Pedido> {
  if (destinoDoPapel(papel) !== destino) {
    return recusar("PAPEL_SEM_PERMISSAO", `O papel ${papel} nao responde pelo destino ${destino}.`);
  }
  if (pedido.cancelado) {
    return recusar("PEDIDO_CANCELADO", "Este Pedido foi cancelado.");
  }
  const atual = pedido.preparo[destino];
  if (atual === undefined) {
    return recusar("DESTINO_AUSENTE", `Este Pedido nao tem itens de ${destino}.`);
  }
  const proximo = PROXIMO_PREPARO[atual];
  if (proximo === null) {
    return recusar("PREPARO_JA_CONCLUIDO", `O preparo de ${destino} ja esta pronto.`);
  }
  return { ok: true, valor: { ...pedido, preparo: { ...pedido.preparo, [destino]: proximo } } };
}

export function marcarEntregue(pedido: Pedido, papel: Papel): Transicao<Pedido> {
  if (papel !== "garcom") {
    return recusar("PAPEL_SEM_PERMISSAO", "Somente o Garcom entrega um Pedido.");
  }
  if (statusDoPedido(pedido) !== "pronto") {
    return recusar("PEDIDO_NAO_PRONTO", "O Pedido ainda nao esta pronto em todos os Destinos.");
  }
  return { ok: true, valor: { ...pedido, entregue: true } };
}

export function cancelarPedido(pedido: Pedido): Transicao<Pedido> {
  const status = statusDoPedido(pedido);
  if (status === "cancelado") {
    return recusar("PEDIDO_CANCELADO", "Este Pedido ja foi cancelado.");
  }
  if (status === "pronto" || status === "entregue") {
    return recusar("PEDIDO_JA_PRONTO", "Um Pedido pronto nao pode ser cancelado.");
  }
  return {
    ok: true,
    valor: {
      ...pedido,
      cancelado: true,
      itens: pedido.itens.map((item) => ({ ...item, cancelado: true })),
    },
  };
}

/** A Mesa nao guarda estado: ele vem da Comanda vinculada. */
export function statusDaMesa(comanda: Comanda | null): StatusMesa {
  if (comanda === null) return "livre";
  if (comanda.status === "aberta") return "ocupada";
  if (comanda.status === "fechada") return "conta_pedida";
  return "livre";
}

/** Reaplica os totais calculados pelo servidor. Todo retorno de mutacao passa por aqui. */
export function comTotais(comanda: Comanda): Comanda {
  return { ...comanda, totais: calcularTotais(comanda) };
}

export function aplicarTaxaDeServico(comanda: Comanda, aplicada: boolean): Transicao<Comanda> {
  if (comanda.status === "paga" || comanda.status === "cancelada") {
    return recusar("COMANDA_ENCERRADA", "Esta Comanda ja esta encerrada.");
  }
  return { ok: true, valor: comTotais({ ...comanda, taxaDeServicoAplicada: aplicada }) };
}

export function registrarPagamento(
  comanda: Comanda,
  forma: FormaDePagamento,
  valorEmCentavos: Centavos,
  agora = new Date(),
): Transicao<Comanda> {
  if (comanda.status !== "fechada") {
    return recusar("COMANDA_NAO_FECHADA", "Somente uma Comanda fechada recebe pagamento.");
  }
  if (!Number.isInteger(valorEmCentavos) || valorEmCentavos <= 0) {
    return recusar("VALOR_INVALIDO", "O valor do pagamento deve ser maior que zero.");
  }

  const pagamento: Pagamento = {
    id: `pagamento-${comanda.pagamentos.length + 1}-${comanda.id}`,
    forma,
    valorEmCentavos,
    registradoEm: agora.toISOString(),
  };

  const comPagamento = comTotais({
    ...comanda,
    pagamentos: [...comanda.pagamentos, pagamento],
  });

  if (!estaQuitada(comPagamento.totais)) {
    return { ok: true, valor: comPagamento };
  }

  return {
    ok: true,
    valor: { ...comPagamento, status: "paga", pagaEm: agora.toISOString() },
  };
}
