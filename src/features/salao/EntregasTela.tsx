import { useNavigate } from "react-router-dom";
import { ErroDaApi } from "@/api/cliente";
import { useEntregarPedido, useEntregasPendentes } from "@/api/preparo";
import { AvisoDeErro, Botao, Carregando, Cartao, Vazio } from "@/components/ui";
import { horaCurta, minutosDesde } from "@/lib/datas";

/** Tela 5. O que esta pronto no balcao esperando o Garcom levar. */
export function EntregasTela() {
  const entregas = useEntregasPendentes();
  const entregar = useEntregarPedido();
  const navegar = useNavigate();

  if (entregas.isPending) return <Carregando rotulo="Carregando entregas..." />;
  if (entregas.isError) {
    return (
      <AvisoDeErro
        mensagem="Nao foi possivel carregar as entregas."
        aoTentarNovamente={() => void entregas.refetch()}
      />
    );
  }

  if (entregas.data.length === 0) {
    return <Vazio titulo="Nada pronto agora" descricao="Os pedidos aparecem aqui quando ficam prontos." />;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-texto-suave">
        {entregas.data.length} pedido(s) pronto(s) para levar
      </h2>

      {entregar.error instanceof ErroDaApi ? <AvisoDeErro mensagem={entregar.error.message} /> : null}

      <ul className="flex flex-col gap-3">
        {entregas.data.map((entrega) => (
          <li key={entrega.pedidoId}>
            <Cartao className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-base font-semibold text-texto">
                  {entrega.mesaNumero === null ? "Balcao" : `Mesa ${entrega.mesaNumero}`}
                </p>
                <p className="text-xs text-texto-suave">
                  {horaCurta(entrega.criadoEm)} · {minutosDesde(entrega.criadoEm)} min
                </p>
              </div>

              <ul className="flex flex-col gap-1 text-sm text-texto">
                {entrega.itens.map((item, indice) => (
                  <li key={`${entrega.pedidoId}-${indice}`}>
                    {item.quantidade}x {item.nome}
                    {item.observacao !== null ? (
                      <em className="block text-xs not-italic text-texto-suave">
                        obs: {item.observacao}
                      </em>
                    ) : null}
                  </li>
                ))}
              </ul>

              <div className="flex gap-2">
                <Botao
                  tamanho="lg"
                  largura="cheia"
                  carregando={entregar.isPending && entregar.variables === entrega.pedidoId}
                  onClick={() => entregar.mutate(entrega.pedidoId)}
                >
                  Entreguei
                </Botao>
                <Botao
                  variante="secundaria"
                  tamanho="lg"
                  onClick={() => navegar(`/salao/comandas/${entrega.comandaId}`)}
                >
                  Comanda
                </Botao>
              </div>
            </Cartao>
          </li>
        ))}
      </ul>
    </section>
  );
}
