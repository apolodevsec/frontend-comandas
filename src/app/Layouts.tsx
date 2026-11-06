import { BellRing, ChefHat, LayoutGrid, LogOut, Receipt } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Botao } from "@/components/ui";
import { useSessao } from "@/features/auth/sessao";
import { cn } from "@/lib/cn";

function Cabecalho({ titulo }: { titulo: ReactNode }) {
  const sessao = useSessao((estado) => estado.sessao);
  const sair = useSessao((estado) => estado.sair);
  const navegar = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-borda bg-superficie px-4 py-3">
      <div className="min-w-0">
        <div className="truncate text-base font-semibold text-texto">{titulo}</div>
        <p className="truncate text-xs text-texto-suave">{sessao?.usuario.nome}</p>
      </div>
      <Botao
        variante="fantasma"
        tamanho="sm"
        onClick={() => {
          sair();
          navegar("/entrar", { replace: true });
        }}
      >
        <LogOut className="size-4" aria-hidden />
        Sair
      </Botao>
    </header>
  );
}

const ABAS_DO_SALAO = [
  { para: "/salao", rotulo: "Mesas", Icone: LayoutGrid },
  { para: "/salao/entregas", rotulo: "Entregas", Icone: BellRing },
  { para: "/salao/avulsa", rotulo: "Balcao", Icone: Receipt },
];

/** Garcom: mobile-first, navegacao no rodape, onde o polegar alcanca. */
export function LayoutDoSalao() {
  return (
    <div className="flex min-h-full flex-col bg-fundo">
      <Cabecalho titulo="Salao" />
      <main className="flex-1 px-4 py-4 pb-24">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-3 border-t border-borda bg-superficie pb-[env(safe-area-inset-bottom)]">
        {ABAS_DO_SALAO.map(({ para, rotulo, Icone }) => (
          <NavLink
            key={para}
            to={para}
            end={para === "/salao"}
            className={({ isActive }) =>
              cn(
                "flex min-h-toque flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium",
                isActive ? "text-primaria" : "text-texto-suave",
              )
            }
          >
            <Icone className="size-5" aria-hidden />
            {rotulo}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

/** Preparo e Caixa: desktop-first, sem navegacao de rodape. */
export function LayoutDeDesktop() {
  const papel = useSessao((estado) => estado.sessao?.usuario.papel);
  const ehPreparo = papel === "cozinha" || papel === "bar";

  return (
    <div className={cn("flex min-h-full flex-col", ehPreparo && "dark")}>
      <div className="flex min-h-full flex-col bg-fundo">
        <Cabecalho
          titulo={
            ehPreparo ? (
              <span className="flex items-center gap-2">
                <ChefHat className="size-4" aria-hidden /> Preparo
              </span>
            ) : (
              "Caixa"
            )
          }
        />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
