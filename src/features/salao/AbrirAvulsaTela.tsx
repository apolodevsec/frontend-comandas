import { useNavigate } from "react-router-dom";
import { ErroDaApi } from "@/api/cliente";
import { useAbrirComanda, useComandas } from "@/api/comandas";
import { EtiquetaDaComanda } from "@/components/dominio";
import { AvisoDeErro, Botao, Carregando, Cartao, Vazio } from "@/components/ui";
import { useSessao } from "@/features/auth/sessao";
import { formatarReais } from "@/lib/money";

/** Tela 6. Consumo de balcao: Comanda Avulsa, sem Mesa. */
export function AbrirAvulsaTela() {
  const abertas = useComandas("aberta");
  const abrir = useAbrirComanda();
  const navegar = useNavigate();
  const garcomId = useSessao((estado) => estado.sessao?.usuario.id ?? "");

  const avulsas = (abertas.data ?? []).filter((comanda) => comanda.mesaId === null);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-texto">Balcao</h2>
        <p className="mt-1 text-sm text-texto-suave">
          Comanda avulsa, para quem consome sem ocupar mesa.
        </p>
      </div>

      {abrir.error instanceof ErroDaApi ? <AvisoDeErro mensagem={abrir.error.message} /> : null}

      <Botao
        tamanho="lg"
        largura="cheia"
        carregando={abrir.isPending}
        onClick={() =>
          abrir.mutate(
            { mesaId: null, garcomId },
            { onSuccess: (comanda) => navegar(`/salao/comandas/${comanda.id}/lancar`) },
          )
        }
      >
        Abrir comanda de balcao
      </Botao>

      <h3 className="text-sm font-medium text-texto-suave">Avulsas em aberto</h3>

      {abertas.isPending ? <Carregando /> : null}

      {!abertas.isPending && avulsas.length === 0 ? (
        <Vazio titulo="Nenhuma comanda de balcao aberta" />
      ) : (
        <ul className="flex flex-col gap-2">
          {avulsas.map((comanda) => (
            <li key={comanda.id}>
              <Cartao className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold text-texto">Comanda {comanda.numero}</p>
                  <p className="text-xs tabular-nums text-texto-suave">
                    {formatarReais(comanda.totais.totalEmCentavos)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <EtiquetaDaComanda status={comanda.status} />
                  <Botao
                    variante="secundaria"
                    tamanho="sm"
                    onClick={() => navegar(`/salao/comandas/${comanda.id}`)}
                  >
                    Abrir
                  </Botao>
                </div>
              </Cartao>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
