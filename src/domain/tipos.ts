/**
 * O CONTRATO. Estes tipos sao a especificacao que o backend implementa.
 * Vocabulario em portugues por decisao registrada em docs/adr/0003.
 * Dinheiro sempre em centavos inteiros por decisao registrada em docs/adr/0002.
 */

export type Centavos = number;

export type Papel = "garcom" | "cozinha" | "bar" | "caixa";

export type Destino = "cozinha" | "bar";

/** Estados de preparo, por Destino. */
export type StatusPreparo = "pendente" | "em_preparo" | "pronto";

/** Estado observavel de um Pedido: preparo + os dois estados terminais. */
export type StatusPedido = StatusPreparo | "entregue" | "cancelado";

export type StatusComanda = "aberta" | "fechada" | "paga" | "cancelada";

/** Derivado da Comanda vinculada; a Mesa nao guarda estado proprio. */
export type StatusMesa = "livre" | "ocupada" | "conta_pedida";

export type FormaDePagamento = "dinheiro" | "debito" | "credito" | "pix";

export interface Usuario {
  id: string;
  nome: string;
  papel: Papel;
}

export interface Mesa {
  id: string;
  numero: number;
  capacidade: number;
}

export interface ItemDoCardapio {
  id: string;
  nome: string;
  categoria: string;
  precoEmCentavos: Centavos;
  destino: Destino;
  disponivel: boolean;
}

export interface ItemDoPedido {
  id: string;
  itemDoCardapioId: string;
  /** Snapshot do nome e do preco no momento do lancamento. */
  nome: string;
  precoUnitarioEmCentavos: Centavos;
  quantidade: number;
  destino: Destino;
  observacao: string | null;
  cancelado: boolean;
}

export interface Pedido {
  id: string;
  comandaId: string;
  /** Sequencial por Comanda: a rodada 1, 2, 3... */
  numero: number;
  criadoEm: string;
  itens: ItemDoPedido[];
  /** Apenas os Destinos presentes nos itens aparecem aqui. */
  preparo: Partial<Record<Destino, StatusPreparo>>;
  entregue: boolean;
  cancelado: boolean;
}

export interface Pagamento {
  id: string;
  forma: FormaDePagamento;
  valorEmCentavos: Centavos;
  registradoEm: string;
}

/** Calculado pelo servidor. O front nunca soma a conta (docs/adr/0002). */
export interface TotaisDaComanda {
  consumoEmCentavos: Centavos;
  taxaDeServicoEmCentavos: Centavos;
  totalEmCentavos: Centavos;
  pagoEmCentavos: Centavos;
  saldoEmCentavos: Centavos;
}

export interface Comanda {
  id: string;
  numero: number;
  /** null em Comanda Avulsa (balcao). */
  mesaId: string | null;
  status: StatusComanda;
  abertaEm: string;
  fechadaEm: string | null;
  pagaEm: string | null;
  garcomId: string;
  taxaDeServicoAplicada: boolean;
  motivoDeReabertura: string | null;
  pedidos: Pedido[];
  pagamentos: Pagamento[];
  totais: TotaisDaComanda;
}

export const PERCENTUAL_TAXA_DE_SERVICO = 10;

/** Visao de Mesa devolvida por GET /api/mesas: Mesa + estado derivado da Comanda. */
export interface MesaNaVisao extends Mesa {
  status: StatusMesa;
  comandaId: string | null;
}

/** Visao de GET /api/preparo: um ticket por Pedido e por Destino, so com os itens daquele Destino. */
export interface TicketDePreparo {
  pedidoId: string;
  comandaId: string;
  numeroDaComanda: number;
  numeroDoPedido: number;
  mesaNumero: number | null;
  criadoEm: string;
  destino: Destino;
  status: StatusPreparo;
  itens: Array<{ nome: string; quantidade: number; observacao: string | null }>;
}

/** Visao de GET /api/entregas: Pedido pronto em todos os Destinos, aguardando o Garcom. */
export interface EntregaPendente {
  pedidoId: string;
  comandaId: string;
  numeroDaComanda: number;
  numeroDoPedido: number;
  mesaNumero: number | null;
  criadoEm: string;
  itens: Array<{ nome: string; quantidade: number; observacao: string | null }>;
}
