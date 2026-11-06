import { statusDoPedido } from "@/domain/estados";
import type { Comanda, Pedido, StatusComanda, StatusPedido, TotaisDaComanda } from "@/domain/tipos";
import { horaCurta } from "@/lib/datas";
import { formatarReais } from "@/lib/money";
import { Cartao, Etiqueta } from "./ui";

/** Vocabulario visual do dominio, compartilhado pelas telas dos tres papeis. */

const TOM_DO_PEDIDO: Record<StatusPedido, "neutro" | "pendente" | "preparo" | "pronto" | "perigo"> =
  {
    pendente: "pendente",
    em_preparo: "preparo",
    pronto: "pronto",
    entregue: "neutro",
    cancelado: "perigo",
  };

const ROTULO_DO_PEDIDO: Record<StatusPedido, string> = {
  pendente: "Pendente",
  em_preparo: "Em preparo",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export function EtiquetaDoPedido({ pedido }: { pedido: Pedido }) {
  const status = statusDoPedido(pedido);
  return <Etiqueta tom={TOM_DO_PEDIDO[status]}>{ROTULO_DO_PEDIDO[status]}</Etiqueta>;
}

const ROTULO_DA_COMANDA: Record<StatusComanda, string> = {
  aberta: "Aberta",
  fechada: "Aguardando pagamento",
  paga: "Paga",
  cancelada: "Cancelada",
};

const TOM_DA_COMANDA: Record<StatusComanda, "neutro" | "preparo" | "pendente" | "pronto" | "perigo"> =
  {
    aberta: "preparo",
    fechada: "pendente",
    paga: "pronto",
    cancelada: "perigo",
  };

export function EtiquetaDaComanda({ status }: { status: StatusComanda }) {
  return <Etiqueta tom={TOM_DA_COMANDA[status]}>{ROTULO_DA_COMANDA[status]}</Etiqueta>;
}

export function TituloDaComanda({ comanda }: { comanda: Comanda }) {
  return (
    <span>
      Comanda {comanda.numero}
      {comanda.mesaId === null ? " · Balcao" : ` · Mesa ${comanda.mesaId.replace("mesa-", "")}`}
    </span>
  );
}

/**
 * Lista o consumo lancado. Os valores exibidos vem de comanda.totais, calculado
 * pelo servidor: nenhuma soma acontece aqui (docs/adr/0002).
 */
export function ConsumoDaComanda({
  comanda,
  acoesDoPedido,
}: {
  comanda: Comanda;
  acoesDoPedido?: (pedido: Pedido) => React.ReactNode;
}) {
  if (comanda.pedidos.length === 0) {
    return (
      <Cartao className="p-4 text-sm text-texto-suave">
        Nenhum consumo lancado nesta comanda.
      </Cartao>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {comanda.pedidos.map((pedido) => (
        <li key={pedido.id}>
          <Cartao className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-texto">
                Rodada {pedido.numero} · {horaCurta(pedido.criadoEm)}
              </p>
              <EtiquetaDoPedido pedido={pedido} />
            </div>

            <ul className="mt-3 flex flex-col gap-2">
              {pedido.itens.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className={item.cancelado ? "text-texto-suave line-through" : "text-texto"}>
                    {item.quantidade}x {item.nome}
                    {item.observacao !== null ? (
                      <em className="block text-xs not-italic text-texto-suave">
                        obs: {item.observacao}
                      </em>
                    ) : null}
                  </span>
                  <span className="shrink-0 tabular-nums text-texto-suave">
                    {formatarReais(item.precoUnitarioEmCentavos * item.quantidade)}
                  </span>
                </li>
              ))}
            </ul>

            {acoesDoPedido !== undefined ? (
              <div className="mt-3 flex gap-2">{acoesDoPedido(pedido)}</div>
            ) : null}
          </Cartao>
        </li>
      ))}
    </ul>
  );
}

export function ResumoDeTotais({
  totais,
  taxaAplicada,
}: {
  totais: TotaisDaComanda;
  taxaAplicada: boolean;
}) {
  return (
    <Cartao className="p-4">
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-texto-suave">Consumo</dt>
          <dd className="tabular-nums text-texto" data-testid="consumo">
            {formatarReais(totais.consumoEmCentavos)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-texto-suave">Taxa de servico {taxaAplicada ? "(10%)" : "(recusada)"}</dt>
          <dd className="tabular-nums text-texto" data-testid="taxa">
            {formatarReais(totais.taxaDeServicoEmCentavos)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-borda pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums" data-testid="total">
            {formatarReais(totais.totalEmCentavos)}
          </dd>
        </div>
        {totais.pagoEmCentavos > 0 ? (
          <>
            <div className="flex justify-between">
              <dt className="text-texto-suave">Pago</dt>
              <dd className="tabular-nums text-texto" data-testid="pago">
                {formatarReais(totais.pagoEmCentavos)}
              </dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>{totais.saldoEmCentavos < 0 ? "Troco" : "Saldo"}</dt>
              <dd className="tabular-nums" data-testid="saldo">
                {formatarReais(Math.abs(totais.saldoEmCentavos))}
              </dd>
            </div>
          </>
        ) : null}
      </dl>
    </Cartao>
  );
}
