import { PERCENTUAL_TAXA_DE_SERVICO } from "./tipos";
import type { Centavos, Comanda, TotaisDaComanda } from "./tipos";

/**
 * Fonte de verdade dos valores de uma Comanda (docs/adr/0002).
 * Roda no servidor; no ambiente de mock, dentro do handler do MSW.
 * Nenhum componente deve chamar esta funcao.
 */
export function calcularTotais(comanda: Comanda): TotaisDaComanda {
  const consumoEmCentavos = comanda.pedidos
    .filter((pedido) => !pedido.cancelado)
    .flatMap((pedido) => pedido.itens)
    .filter((item) => !item.cancelado)
    .reduce((soma, item) => soma + item.precoUnitarioEmCentavos * item.quantidade, 0);

  const taxaDeServicoEmCentavos = comanda.taxaDeServicoAplicada
    ? Math.round((consumoEmCentavos * PERCENTUAL_TAXA_DE_SERVICO) / 100)
    : 0;

  const totalEmCentavos = consumoEmCentavos + taxaDeServicoEmCentavos;

  const pagoEmCentavos = comanda.pagamentos.reduce(
    (soma, pagamento) => soma + pagamento.valorEmCentavos,
    0,
  );

  return {
    consumoEmCentavos,
    taxaDeServicoEmCentavos,
    totalEmCentavos,
    pagoEmCentavos,
    saldoEmCentavos: totalEmCentavos - pagoEmCentavos,
  };
}

/** Saldo zero ou negativo (troco) quita a Comanda. */
export function estaQuitada(totais: { saldoEmCentavos: Centavos }): boolean {
  return totais.saldoEmCentavos <= 0;
}

/**
 * Previa do que o Garcom montou na tela de Lancamento. NAO e o total da Comanda:
 * aquele vem sempre do servidor (docs/adr/0002). Mora aqui, com teste, para que
 * nenhum componente faca conta de dinheiro.
 */
export function previaDaRodada(
  itens: Array<{ precoUnitarioEmCentavos: Centavos; quantidade: number }>,
): Centavos {
  return itens.reduce((soma, item) => soma + item.precoUnitarioEmCentavos * item.quantidade, 0);
}
