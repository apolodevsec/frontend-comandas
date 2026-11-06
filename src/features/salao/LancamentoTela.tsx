import { Minus, Plus } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ErroDaApi } from "@/api/cliente";
import { useCardapio, useLancarRodada } from "@/api/comandas";
import { AvisoDeErro, Botao, Carregando, Cartao, Etiqueta } from "@/components/ui";
import { previaDaRodada } from "@/domain/pricing";
import type { ItemDoCardapio } from "@/domain/tipos";
import { formatarReais } from "@/lib/money";
import { useRodada } from "./rodada";

/** Tela 4. Cardapio + rodada em montagem + observacao por item. */
export function LancamentoTela() {
  const { comandaId = "" } = useParams();
  const cardapio = useCardapio();
  const lancar = useLancarRodada();
  const navegar = useNavigate();

  const { linhas, comecar, adicionar, remover, definirObservacao, limpar } = useRodada();

  useEffect(() => comecar(comandaId), [comandaId, comecar]);

  const porCategoria = useMemo(() => {
    const agrupado = new Map<string, ItemDoCardapio[]>();
    for (const item of cardapio.data ?? []) {
      agrupado.set(item.categoria, [...(agrupado.get(item.categoria) ?? []), item]);
    }
    return [...agrupado.entries()];
  }, [cardapio.data]);

  if (cardapio.isPending) return <Carregando rotulo="Carregando cardapio..." />;
  if (cardapio.isError) {
    return (
      <AvisoDeErro
        mensagem="Nao foi possivel carregar o cardapio."
        aoTentarNovamente={() => void cardapio.refetch()}
      />
    );
  }

  const previa = previaDaRodada(
    linhas.map((linha) => ({
      precoUnitarioEmCentavos: linha.item.precoEmCentavos,
      quantidade: linha.quantidade,
    })),
  );

  function enviar() {
    lancar.mutate(
      {
        comandaId,
        itens: linhas.map((linha) => ({
          itemDoCardapioId: linha.item.id,
          quantidade: linha.quantidade,
          observacao: linha.observacao.trim() === "" ? null : linha.observacao.trim(),
        })),
      },
      {
        onSuccess: () => {
          limpar();
          navegar(`/salao/comandas/${comandaId}`);
        },
      },
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-texto">Lancar pedido</h2>

      {linhas.length > 0 ? (
        <Cartao className="flex flex-col gap-3 p-4">
          <p className="text-sm font-semibold text-texto">Rodada em montagem</p>

          <ul className="flex flex-col gap-3">
            {linhas.map((linha) => (
              <li key={linha.item.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-texto">
                    {linha.quantidade}x {linha.item.nome}
                  </span>
                  <div className="flex items-center gap-1">
                    <Botao
                      variante="secundaria"
                      tamanho="sm"
                      aria-label={`Remover um ${linha.item.nome}`}
                      onClick={() => remover(linha.item.id)}
                    >
                      <Minus className="size-4" aria-hidden />
                    </Botao>
                    <Botao
                      variante="secundaria"
                      tamanho="sm"
                      aria-label={`Adicionar um ${linha.item.nome}`}
                      onClick={() => adicionar(linha.item)}
                    >
                      <Plus className="size-4" aria-hidden />
                    </Botao>
                  </div>
                </div>
                <input
                  className="min-h-toque rounded-lg border border-borda bg-fundo px-3 text-sm text-texto placeholder:text-texto-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria"
                  placeholder="Observacao (ex: sem cebola)"
                  aria-label={`Observacao para ${linha.item.nome}`}
                  value={linha.observacao}
                  onChange={(evento) => definirObservacao(linha.item.id, evento.target.value)}
                />
              </li>
            ))}
          </ul>

          <p className="border-t border-borda pt-3 text-sm text-texto-suave">
            Previa desta rodada:{" "}
            <strong className="tabular-nums text-texto" data-testid="previa-da-rodada">
              {formatarReais(previa)}
            </strong>
          </p>

          {lancar.error instanceof ErroDaApi ? (
            <AvisoDeErro mensagem={lancar.error.message} />
          ) : null}

          <Botao tamanho="lg" largura="cheia" carregando={lancar.isPending} onClick={enviar}>
            Lancar rodada
          </Botao>
        </Cartao>
      ) : (
        <p className="text-sm text-texto-suave">
          Toque nos itens do cardapio para montar a rodada.
        </p>
      )}

      {porCategoria.map(([categoria, itens]) => (
        <div key={categoria} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-texto-suave">{categoria}</h3>
          <ul className="flex flex-col gap-2">
            {itens.map((item) => (
              <li key={item.id}>
                <Cartao className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-texto">{item.nome}</p>
                    <p className="flex items-center gap-2 text-xs text-texto-suave">
                      <span className="tabular-nums">{formatarReais(item.precoEmCentavos)}</span>
                      <Etiqueta tom="neutro">{item.destino}</Etiqueta>
                    </p>
                  </div>
                  <Botao
                    tamanho="sm"
                    variante={item.disponivel ? "primaria" : "secundaria"}
                    disabled={!item.disponivel}
                    onClick={() => adicionar(item)}
                  >
                    {item.disponivel ? "Adicionar" : "Indisponivel"}
                  </Botao>
                </Cartao>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
