import { Link, useParams } from "react-router-dom";
import { useComanda } from "@/api/comandas";
import { ConsumoDaComanda, EtiquetaDaComanda, ResumoDeTotais, TituloDaComanda } from "@/components/dominio";
import { AvisoDeErro, Carregando} from "@/components/ui";
import { estilosDeBotao } from "@/components/ui/estilos";
import { horaCurta } from "@/lib/datas";

/** Tela 11. Conferencia do consumo pelo Caixa, sem acao de salao. */
export function ComandaLeituraTela() {
  const { comandaId = "" } = useParams();
  const comanda = useComanda(comandaId);

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

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-texto">
            <TituloDaComanda comanda={atual} />
          </h2>
          <p className="mt-1 text-xs text-texto-suave">
            Aberta as {horaCurta(atual.abertaEm)}
            {atual.motivoDeReabertura === null
              ? ""
              : ` · reaberta: ${atual.motivoDeReabertura}`}
          </p>
        </div>
        <EtiquetaDaComanda status={atual.status} />
      </header>

      <ConsumoDaComanda comanda={atual} />

      <ResumoDeTotais totais={atual.totais} taxaAplicada={atual.taxaDeServicoAplicada} />

      <div className="flex flex-wrap gap-3">
        <Link to="/caixa" className={estilosDeBotao({ variante: "secundaria" })}>
          Voltar a fila
        </Link>
        <Link to={`/caixa/comandas/${atual.id}/fechamento`} className={estilosDeBotao()}>
          Ir para o fechamento
        </Link>
      </div>
    </div>
  );
}
