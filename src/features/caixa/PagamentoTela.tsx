import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErroDaApi } from "@/api/cliente";
import { useComanda, useRegistrarPagamento } from "@/api/comandas";
import { EtiquetaDaComanda, ResumoDeTotais, TituloDaComanda } from "@/components/dominio";
import { AvisoDeErro, Botao, Campo, Carregando, Cartao} from "@/components/ui";
import { estilosDeBotao } from "@/components/ui/estilos";
import type { FormaDePagamento } from "@/domain/tipos";
import { horaCurta } from "@/lib/datas";
import { formatarReais, lerReaisEmCentavos } from "@/lib/money";

/**
 * Tela 10. Divisao de conta e isto: varios pagamentos parciais sobre a mesma
 * Comanda, com um atalho para dividir o saldo por N (Q24).
 */

const FORMAS: Array<{ forma: FormaDePagamento; rotulo: string }> = [
  { forma: "dinheiro", rotulo: "Dinheiro" },
  { forma: "debito", rotulo: "Debito" },
  { forma: "credito", rotulo: "Credito" },
  { forma: "pix", rotulo: "Pix" },
];

export function PagamentoTela() {
  const { comandaId = "" } = useParams();
  const comanda = useComanda(comandaId);
  const registrar = useRegistrarPagamento();

  const [forma, setForma] = useState<FormaDePagamento>("credito");
  const [valor, setValor] = useState("");
  const [erroDoCampo, setErroDoCampo] = useState<string | null>(null);

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
  const quitada = atual.status === "paga";

  function registrarPagamento() {
    const centavos = lerReaisEmCentavos(valor);
    if (centavos === null || centavos <= 0) {
      setErroDoCampo("Informe um valor maior que zero.");
      return;
    }
    setErroDoCampo(null);
    registrar.mutate(
      { comandaId: atual.id, forma, valorEmCentavos: centavos },
      { onSuccess: () => setValor("") },
    );
  }

  function dividirPor(partes: number) {
    const porPessoa = Math.ceil(atual.totais.saldoEmCentavos / partes);
    setValor((porPessoa / 100).toFixed(2).replace(".", ","));
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-texto">
            Pagamento · <TituloDaComanda comanda={atual} />
          </h2>
          <Link
            to={`/caixa/comandas/${atual.id}/fechamento`}
            className="text-sm font-medium text-primaria underline"
          >
            Ajustar fechamento
          </Link>
        </div>
        <EtiquetaDaComanda status={atual.status} />
      </header>

      <ResumoDeTotais totais={atual.totais} taxaAplicada={atual.taxaDeServicoAplicada} />

      {quitada ? (
        <Cartao className="p-5 text-center">
          <p className="text-base font-semibold text-pronto">Comanda quitada</p>
          {atual.totais.saldoEmCentavos < 0 ? (
            <p className="mt-1 text-sm text-texto">
              Troco: {formatarReais(Math.abs(atual.totais.saldoEmCentavos))}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-texto-suave">
            Paga as {atual.pagaEm === null ? "--:--" : horaCurta(atual.pagaEm)}
          </p>
          <Link
            to="/caixa"
            className={estilosDeBotao({ variante: "secundaria", className: "mt-4" })}
          >
            Voltar a fila
          </Link>
        </Cartao>
      ) : (
        <Cartao className="flex flex-col gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-texto">Forma de pagamento</p>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Forma de pagamento">
              {FORMAS.map((opcao) => (
                <Botao
                  key={opcao.forma}
                  variante={forma === opcao.forma ? "primaria" : "secundaria"}
                  aria-pressed={forma === opcao.forma}
                  onClick={() => setForma(opcao.forma)}
                >
                  {opcao.rotulo}
                </Botao>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-texto">Dividir o saldo</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[2, 3, 4].map((partes) => (
                <Botao
                  key={partes}
                  variante="secundaria"
                  tamanho="sm"
                  onClick={() => dividirPor(partes)}
                >
                  por {partes}
                </Botao>
              ))}
              <Botao
                variante="secundaria"
                tamanho="sm"
                onClick={() => setValor((atual.totais.saldoEmCentavos / 100).toFixed(2).replace(".", ","))}
              >
                saldo inteiro
              </Botao>
            </div>
          </div>

          <Campo
            etiqueta="Valor recebido"
            inputMode="decimal"
            placeholder="0,00"
            value={valor}
            erro={erroDoCampo}
            onChange={(evento) => setValor(evento.target.value)}
          />

          {registrar.error instanceof ErroDaApi ? (
            <AvisoDeErro mensagem={registrar.error.message} />
          ) : null}

          <Botao
            tamanho="lg"
            largura="cheia"
            carregando={registrar.isPending}
            onClick={registrarPagamento}
          >
            Registrar pagamento
          </Botao>
        </Cartao>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-texto-suave">
          Pagamentos registrados ({atual.pagamentos.length})
        </h3>
        {atual.pagamentos.length === 0 ? (
          <p className="text-sm text-texto-suave">Nenhum pagamento ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {atual.pagamentos.map((pagamento) => (
              <li key={pagamento.id}>
                <Cartao className="flex items-center justify-between gap-3 p-3 text-sm">
                  <span className="capitalize text-texto">{pagamento.forma}</span>
                  <span className="text-xs text-texto-suave">
                    {horaCurta(pagamento.registradoEm)}
                  </span>
                  <span className="font-semibold tabular-nums text-texto">
                    {formatarReais(pagamento.valorEmCentavos)}
                  </span>
                </Cartao>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
