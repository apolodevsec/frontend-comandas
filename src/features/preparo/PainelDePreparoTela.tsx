import { useState } from "react";
import { ErroDaApi } from "@/api/cliente";
import { useAvancarPreparo, useTicketsDePreparo } from "@/api/preparo";
import { AvisoDeErro, Botao, Carregando, Cartao, Etiqueta, Vazio } from "@/components/ui";
import type { Destino, StatusPreparo, TicketDePreparo } from "@/domain/tipos";
import { useSessao } from "@/features/auth/sessao";
import { horaCurta, minutosDesde } from "@/lib/datas";
import { cn } from "@/lib/cn";

/**
 * Tela 7. Um painel so, filtrado por Destino (Q18). Cozinha e Bar veem a mesma
 * tela com recortes diferentes, e cada um avanca apenas o seu Destino.
 */

const COLUNAS: Array<{ status: StatusPreparo; titulo: string; tom: "pendente" | "preparo" | "pronto" }> = [
  { status: "pendente", titulo: "Na fila", tom: "pendente" },
  { status: "em_preparo", titulo: "Em preparo", tom: "preparo" },
  { status: "pronto", titulo: "Pronto", tom: "pronto" },
];

const ACAO: Record<StatusPreparo, string | null> = {
  pendente: "Iniciar preparo",
  em_preparo: "Marcar pronto",
  pronto: null,
};

export function PainelDePreparoTela() {
  const papel = useSessao((estado) => estado.sessao?.usuario.papel);
  const destinoDoUsuario: Destino = papel === "bar" ? "bar" : "cozinha";
  const [destino, setDestino] = useState<Destino>(destinoDoUsuario);

  const tickets = useTicketsDePreparo(destino);
  const avancar = useAvancarPreparo();

  const podeAvancar = destino === destinoDoUsuario;

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-texto">
          Painel de preparo · {destino === "cozinha" ? "Cozinha" : "Bar"}
        </h2>

        <div className="flex gap-2" role="group" aria-label="Filtrar por destino">
          {(["cozinha", "bar"] as Destino[]).map((candidato) => (
            <Botao
              key={candidato}
              variante={destino === candidato ? "primaria" : "secundaria"}
              tamanho="sm"
              aria-pressed={destino === candidato}
              onClick={() => setDestino(candidato)}
            >
              {candidato === "cozinha" ? "Cozinha" : "Bar"}
            </Botao>
          ))}
        </div>
      </header>

      {!podeAvancar ? (
        <p className="rounded-lg border border-borda bg-superficie p-3 text-sm text-texto-suave">
          Visualizando o destino {destino}. Somente {destinoDoUsuario} pode avancar o preparo
          daqui.
        </p>
      ) : null}

      {avancar.error instanceof ErroDaApi ? <AvisoDeErro mensagem={avancar.error.message} /> : null}

      {tickets.isPending ? <Carregando rotulo="Carregando tickets..." /> : null}

      {tickets.isError ? (
        <AvisoDeErro
          mensagem="Nao foi possivel carregar o painel."
          aoTentarNovamente={() => void tickets.refetch()}
        />
      ) : null}

      {tickets.isSuccess ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUNAS.map((coluna) => {
            const daColuna = tickets.data.filter((ticket) => ticket.status === coluna.status);
            return (
              <div key={coluna.status} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-texto-suave">
                    {coluna.titulo}
                  </h3>
                  <Etiqueta tom={coluna.tom}>{daColuna.length}</Etiqueta>
                </div>

                {daColuna.length === 0 ? (
                  <Cartao className="p-4 text-sm text-texto-suave">Vazio</Cartao>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {daColuna.map((ticket) => (
                      <li key={`${ticket.pedidoId}-${ticket.destino}`}>
                        <CartaoDeTicket
                          ticket={ticket}
                          podeAvancar={podeAvancar}
                          avancando={
                            avancar.isPending && avancar.variables?.pedidoId === ticket.pedidoId
                          }
                          aoAvancar={() =>
                            avancar.mutate({ pedidoId: ticket.pedidoId, destino: ticket.destino })
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {tickets.isSuccess && tickets.data.length === 0 ? (
        <Vazio titulo="Nenhum pedido no painel" descricao="Os tickets aparecem assim que o salao lanca." />
      ) : null}
    </section>
  );
}

function CartaoDeTicket({
  ticket,
  podeAvancar,
  avancando,
  aoAvancar,
}: {
  ticket: TicketDePreparo;
  podeAvancar: boolean;
  avancando: boolean;
  aoAvancar: () => void;
}) {
  const minutos = minutosDesde(ticket.criadoEm);
  const acao = ACAO[ticket.status];

  return (
    <Cartao className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-lg font-semibold text-texto">
          {ticket.mesaNumero === null ? "Balcao" : `Mesa ${ticket.mesaNumero}`}
        </p>
        <p className={cn("text-xs tabular-nums", minutos >= 15 ? "text-perigo" : "text-texto-suave")}>
          {horaCurta(ticket.criadoEm)} · {minutos} min
        </p>
      </div>

      <p className="text-xs text-texto-suave">
        Comanda {ticket.numeroDaComanda} · rodada {ticket.numeroDoPedido}
      </p>

      <ul className="flex flex-col gap-1.5 text-sm text-texto">
        {ticket.itens.map((item, indice) => (
          <li key={`${ticket.pedidoId}-${indice}`}>
            <span className="font-medium">{item.quantidade}x</span> {item.nome}
            {item.observacao !== null ? (
              <em className="block text-xs not-italic text-pendente">obs: {item.observacao}</em>
            ) : null}
          </li>
        ))}
      </ul>

      {acao !== null ? (
        <Botao
          largura="cheia"
          tamanho="lg"
          disabled={!podeAvancar}
          carregando={avancando}
          onClick={aoAvancar}
        >
          {acao}
        </Botao>
      ) : (
        <p className="text-center text-xs text-texto-suave">Aguardando o garcom retirar</p>
      )}
    </Cartao>
  );
}
