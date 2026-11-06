import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Rotas } from "@/app/App";
import { criarClienteDeQuery } from "@/app/query";
import type { Papel } from "@/domain/tipos";
import { useSessao } from "@/features/auth/sessao";
import { USUARIOS } from "@/mocks/fixtures";

/**
 * Renderiza o app de verdade (rotas, guarda de papel e providers) sobre o MSW,
 * para que o teste exercite a tela pelo mesmo caminho que o usuario.
 */
export function entrarComo(papel: Papel): void {
  const encontrado = USUARIOS.find((usuario) => usuario.papel === papel);
  if (encontrado === undefined) throw new Error(`Sem usuario de demonstracao para ${papel}.`);
  const { senha: _senha, ...usuario } = encontrado;
  useSessao.getState().entrar({ token: `mock-${usuario.id}`, usuario });
}

export function sair(): void {
  useSessao.getState().sair();
}

export function renderizarEm(rota: string): RenderResult {
  const cliente = criarClienteDeQuery();
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[rota]}>
        <Rotas />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
