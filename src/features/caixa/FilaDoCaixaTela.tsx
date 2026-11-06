import { useNavigate } from "react-router-dom";
import { useComandas } from "@/api/comandas";
import { EtiquetaDaComanda, TituloDaComanda } from "@/components/dominio";
import { AvisoDeErro, Botao, Carregando, Cartao, Vazio } from "@/components/ui";
import type { Comanda } from "@/domain/tipos";
import { horaCurta } from "@/lib/datas";
import { formatarReais } from "@/lib/money";

/** Tela 8. Home do Caixa: quem esta esperando para pagar vem primeiro. */
export function FilaDoCaixaTela() {
  const comandas = useComandas();
  const navegar = useNavigate();

  if (comandas.isPending) return <Carregando rotulo="Carregando comandas..." />;
  if (comandas.isError) {
    return (
      <AvisoDeErro
        mensagem="Nao foi possivel carregar as comandas."
        aoTentarNovamente={() => void comandas.refetch()}
      />
    );
  }

  const aguardandoPagamento = comandas.data.filter((comanda) => comanda.status === "fechada");
  const emAberto = comandas.data.filter((comanda) => comanda.status === "aberta");

  return (
    <div className="flex flex-col gap-8">
      <Secao
        titulo="Aguardando pagamento"
        vazio="Nenhuma conta pedida agora."
        comandas={aguardandoPagamento}
        rotuloDaAcao="Receber"
        aoAgir={(comanda) => navegar(`/caixa/comandas/${comanda.id}/pagamento`)}
      />
      <Secao
        titulo="Em aberto no salao"
        vazio="Nenhuma comanda aberta."
        comandas={emAberto}
        rotuloDaAcao="Ver comanda"
        aoAgir={(comanda) => navegar(`/caixa/comandas/${comanda.id}`)}
      />
    </div>
  );
}

function Secao({
  titulo,
  vazio,
  comandas,
  rotuloDaAcao,
  aoAgir,
}: {
  titulo: string;
  vazio: string;
  comandas: Comanda[];
  rotuloDaAcao: string;
  aoAgir: (comanda: Comanda) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-texto">
        {titulo} <span className="text-texto-suave">({comandas.length})</span>
      </h2>

      {comandas.length === 0 ? (
        <Vazio titulo={vazio} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {comandas.map((comanda) => (
            <li key={comanda.id}>
              <Cartao className="flex h-full flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-texto">
                    <TituloDaComanda comanda={comanda} />
                  </p>
                  <EtiquetaDaComanda status={comanda.status} />
                </div>

                <dl className="flex flex-col gap-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-texto-suave">Aberta as</dt>
                    <dd className="tabular-nums text-texto">{horaCurta(comanda.abertaEm)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-texto-suave">Total</dt>
                    <dd className="font-semibold tabular-nums text-texto">
                      {formatarReais(comanda.totais.totalEmCentavos)}
                    </dd>
                  </div>
                  {comanda.totais.pagoEmCentavos > 0 ? (
                    <div className="flex justify-between">
                      <dt className="text-texto-suave">Falta</dt>
                      <dd className="tabular-nums text-pendente">
                        {formatarReais(comanda.totais.saldoEmCentavos)}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <Botao largura="cheia" className="mt-auto" onClick={() => aoAgir(comanda)}>
                  {rotuloDaAcao}
                </Botao>
              </Cartao>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
