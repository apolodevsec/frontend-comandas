import { useNavigate } from "react-router-dom";
import { useAbrirComanda, useMesas } from "@/api/comandas";
import { AvisoDeErro, Botao, Carregando, Cartao, Etiqueta } from "@/components/ui";
import type { MesaNaVisao, StatusMesa } from "@/domain/tipos";
import { useSessao } from "@/features/auth/sessao";

/** Tela 2. Home do Garcom: o salao inteiro em um toque de distancia. */

const APARENCIA: Record<StatusMesa, { rotulo: string; tom: "neutro" | "preparo" | "pendente" }> = {
  livre: { rotulo: "Livre", tom: "neutro" },
  ocupada: { rotulo: "Ocupada", tom: "preparo" },
  conta_pedida: { rotulo: "Conta pedida", tom: "pendente" },
};

export function MapaDeMesasTela() {
  const mesas = useMesas();
  const abrir = useAbrirComanda();
  const navegar = useNavigate();
  const garcomId = useSessao((estado) => estado.sessao?.usuario.id ?? "");

  if (mesas.isPending) return <Carregando rotulo="Carregando mesas..." />;
  if (mesas.isError) {
    return <AvisoDeErro mensagem="Nao foi possivel carregar as mesas." aoTentarNovamente={() => void mesas.refetch()} />;
  }

  function aoTocar(mesa: MesaNaVisao) {
    if (mesa.comandaId !== null) {
      navegar(`/salao/comandas/${mesa.comandaId}`);
      return;
    }
    abrir.mutate(
      { mesaId: mesa.id, garcomId },
      { onSuccess: (comanda) => navegar(`/salao/comandas/${comanda.id}/lancar`) },
    );
  }

  return (
    <section aria-labelledby="titulo-mesas" className="flex flex-col gap-4">
      <h2 id="titulo-mesas" className="text-sm font-medium text-texto-suave">
        Toque numa mesa livre para abrir a comanda
      </h2>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {mesas.data.map((mesa) => {
          const aparencia = APARENCIA[mesa.status];
          return (
            <li key={mesa.id}>
              <Cartao className="flex h-full flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl font-semibold text-texto">{mesa.numero}</span>
                  <Etiqueta tom={aparencia.tom}>{aparencia.rotulo}</Etiqueta>
                </div>
                <p className="text-xs text-texto-suave">{mesa.capacidade} lugares</p>
                <Botao
                  largura="cheia"
                  variante={mesa.status === "livre" ? "primaria" : "secundaria"}
                  carregando={abrir.isPending && abrir.variables?.mesaId === mesa.id}
                  onClick={() => aoTocar(mesa)}
                >
                  {mesa.status === "livre" ? "Abrir comanda" : "Ver comanda"}
                </Botao>
              </Cartao>
            </li>
          );
        })}
      </ul>

      {abrir.isError ? <AvisoDeErro mensagem="Nao foi possivel abrir a comanda." /> : null}
    </section>
  );
}
