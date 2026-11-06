import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ErroDaApi } from "@/api/cliente";
import {
  useAlternarTaxaDeServico,
  useComanda,
  useFecharComanda,
  useReabrirComanda,
} from "@/api/comandas";
import { ConsumoDaComanda, EtiquetaDaComanda, ResumoDeTotais, TituloDaComanda } from "@/components/dominio";
import { AvisoDeErro, Botao, Campo, Carregando, Cartao, Modal } from "@/components/ui";

/** Tela 9. Conta totalizada, Taxa de Servico alternavel e reabertura com motivo. */
export function FechamentoTela() {
  const { comandaId = "" } = useParams();
  const comanda = useComanda(comandaId);
  const alternarTaxa = useAlternarTaxaDeServico();
  const fechar = useFecharComanda();
  const reabrir = useReabrirComanda();
  const navegar = useNavigate();

  const [reaberturaAberta, setReaberturaAberta] = useState(false);
  const [motivo, setMotivo] = useState("");

  if (comanda.isPending) return <Carregando rotulo="Carregando comanda..." />;
  if (comanda.isError) {
    return (
      <AvisoDeErro
        mensagem="Comanda nao encontrada."
        aoTentarNovamente={() => void comanda.refetch()}
      />
    );
  }

  const atual = comanda.data;
  const erro = [alternarTaxa.error, fechar.error].find(
    (candidato) => candidato instanceof ErroDaApi,
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold text-texto">
          Fechamento · <TituloDaComanda comanda={atual} />
        </h2>
        <EtiquetaDaComanda status={atual.status} />
      </header>

      {erro instanceof ErroDaApi ? <AvisoDeErro mensagem={erro.message} /> : null}

      <ConsumoDaComanda comanda={atual} />

      <Cartao className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm font-medium text-texto">Taxa de servico (10%)</p>
          <p className="text-xs text-texto-suave">O cliente pode recusar.</p>
        </div>
        <Botao
          variante={atual.taxaDeServicoAplicada ? "primaria" : "secundaria"}
          aria-pressed={atual.taxaDeServicoAplicada}
          carregando={alternarTaxa.isPending}
          onClick={() =>
            alternarTaxa.mutate({
              comandaId: atual.id,
              aplicada: !atual.taxaDeServicoAplicada,
            })
          }
        >
          {atual.taxaDeServicoAplicada ? "Cobrando" : "Nao cobrando"}
        </Botao>
      </Cartao>

      <ResumoDeTotais totais={atual.totais} taxaAplicada={atual.taxaDeServicoAplicada} />

      <div className="flex flex-wrap gap-3">
        {atual.status === "aberta" ? (
          <Botao tamanho="lg" carregando={fechar.isPending} onClick={() => fechar.mutate(atual.id)}>
            Fechar comanda
          </Botao>
        ) : null}

        {atual.status === "fechada" ? (
          <>
            <Botao tamanho="lg" onClick={() => navegar(`/caixa/comandas/${atual.id}/pagamento`)}>
              Receber pagamento
            </Botao>
            <Botao variante="secundaria" tamanho="lg" onClick={() => setReaberturaAberta(true)}>
              Reabrir comanda
            </Botao>
          </>
        ) : null}
      </div>

      <Modal
        aberto={reaberturaAberta}
        aoFechar={() => setReaberturaAberta(false)}
        titulo="Reabrir comanda"
        descricao="A reabertura fica registrada. Informe o motivo."
      >
        <div className="flex flex-col gap-4">
          <Campo
            etiqueta="Motivo"
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            placeholder="cliente pediu mais uma agua"
          />

          {reabrir.error instanceof ErroDaApi ? (
            <AvisoDeErro mensagem={reabrir.error.message} />
          ) : null}
          <Botao
            largura="cheia"
            tamanho="lg"
            carregando={reabrir.isPending}
            onClick={() =>
              reabrir.mutate(
                { comandaId: atual.id, motivo },
                {
                  onSuccess: () => {
                    setReaberturaAberta(false);
                    setMotivo("");
                  },
                },
              )
            }
          >
            Confirmar reabertura
          </Botao>
        </div>
      </Modal>
    </div>
  );
}
