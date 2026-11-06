import { Plus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ErroDaApi } from "@/api/cliente";
import { useComanda, useFecharComanda } from "@/api/comandas";
import { useCancelarPedido, useEntregarPedido } from "@/api/preparo";
import { ConsumoDaComanda, EtiquetaDaComanda, ResumoDeTotais, TituloDaComanda } from "@/components/dominio";
import { AvisoDeErro, Botao, Carregando } from "@/components/ui";
import { statusDoPedido } from "@/domain/estados";

/** Tela 3. O consumo da mesa na mao do Garcom, com as acoes que ele pode tomar. */
export function ComandaTela() {
  const { comandaId } = useParams();
  const comanda = useComanda(comandaId);
  const fechar = useFecharComanda();
  const entregar = useEntregarPedido();
  const cancelar = useCancelarPedido();
  const navegar = useNavigate();

  if (comanda.isPending) return <Carregando rotulo="Carregando comanda..." />;
  if (comanda.isError) {
    return <AvisoDeErro mensagem="Comanda nao encontrada." aoTentarNovamente={() => void comanda.refetch()} />;
  }

  const atual = comanda.data;
  const estaAberta = atual.status === "aberta";
  const erroDeAcao = [fechar.error, entregar.error, cancelar.error].find(
    (erro) => erro instanceof ErroDaApi,
  );

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-texto">
          <TituloDaComanda comanda={atual} />
        </h2>
        <EtiquetaDaComanda status={atual.status} />
      </header>

      {estaAberta ? (
        <Botao tamanho="lg" largura="cheia" onClick={() => navegar(`/salao/comandas/${atual.id}/lancar`)}>
          <Plus className="size-5" aria-hidden />
          Lancar pedido
        </Botao>
      ) : null}

      {erroDeAcao instanceof ErroDaApi ? <AvisoDeErro mensagem={erroDeAcao.message} /> : null}

      <ConsumoDaComanda
        comanda={atual}
        acoesDoPedido={(pedido) => {
          const status = statusDoPedido(pedido);
          return (
            <>
              {status === "pronto" ? (
                <Botao
                  tamanho="sm"
                  carregando={entregar.isPending && entregar.variables === pedido.id}
                  onClick={() => entregar.mutate(pedido.id)}
                >
                  Marcar entregue
                </Botao>
              ) : null}
              {status === "pendente" || status === "em_preparo" ? (
                <Botao
                  variante="secundaria"
                  tamanho="sm"
                  carregando={cancelar.isPending && cancelar.variables === pedido.id}
                  onClick={() => cancelar.mutate(pedido.id)}
                >
                  Cancelar rodada
                </Botao>
              ) : null}
            </>
          );
        }}
      />

      <ResumoDeTotais totais={atual.totais} taxaAplicada={atual.taxaDeServicoAplicada} />

      {estaAberta ? (
        <Botao
          variante="secundaria"
          tamanho="lg"
          largura="cheia"
          carregando={fechar.isPending}
          onClick={() => fechar.mutate(atual.id)}
        >
          Pedir a conta
        </Botao>
      ) : (
        <p className="text-center text-sm text-texto-suave">
          A conta esta com o Caixa.{" "}
          <Link className="font-medium text-primaria underline" to="/salao">
            Voltar ao salao
          </Link>
        </p>
      )}
    </section>
  );
}
