import type { Comanda, ItemDoPedido, Pedido, TotaisDaComanda } from "@/domain/tipos";

const TOTAIS_ZERADOS: TotaisDaComanda = {
  consumoEmCentavos: 0,
  taxaDeServicoEmCentavos: 0,
  totalEmCentavos: 0,
  pagoEmCentavos: 0,
  saldoEmCentavos: 0,
};

export function umItemDoPedido(sobrescrever: Partial<ItemDoPedido> = {}): ItemDoPedido {
  return {
    id: "item-1",
    itemDoCardapioId: "cardapio-1",
    nome: "Chopp 500ml",
    precoUnitarioEmCentavos: 1890,
    quantidade: 1,
    destino: "bar",
    observacao: null,
    cancelado: false,
    ...sobrescrever,
  };
}

export function umPedido(sobrescrever: Partial<Pedido> = {}): Pedido {
  const itens = sobrescrever.itens ?? [umItemDoPedido()];
  return {
    id: "pedido-1",
    comandaId: "comanda-1",
    numero: 1,
    criadoEm: "2026-11-05T19:00:00.000Z",
    itens,
    preparo: { bar: "pendente" },
    entregue: false,
    cancelado: false,
    ...sobrescrever,
  };
}

export function umaComanda(sobrescrever: Partial<Comanda> = {}): Comanda {
  return {
    id: "comanda-1",
    numero: 1,
    mesaId: "mesa-7",
    status: "aberta",
    abertaEm: "2026-11-05T19:00:00.000Z",
    fechadaEm: null,
    pagaEm: null,
    garcomId: "u-garcom",
    taxaDeServicoAplicada: true,
    motivoDeReabertura: null,
    pedidos: [],
    pagamentos: [],
    totais: TOTAIS_ZERADOS,
    ...sobrescrever,
  };
}
