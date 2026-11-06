import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { comandaComConsumo, prepararContrato } from "@/test/contrato";
import { entrarComo, renderizarEm, sair } from "@/test/render";

/**
 * Seam 4: o Painel de Preparo e um so, filtrado por Destino (Q18). O que este
 * teste protege e o recorte: a Cozinha nao ve bebida, e so avanca o seu Destino.
 */
prepararContrato();

afterEach(sair);

/** Coluna identificada pelo titulo, para nao depender de posicao no grid. */
function coluna(titulo: string): HTMLElement {
  const cabecalho = screen.getByRole("heading", { name: titulo });
  const container = cabecalho.closest("div")?.parentElement;
  if (container == null) throw new Error(`Coluna ${titulo} nao encontrada.`);
  return container;
}

describe("Painel de Preparo", () => {
  it("mostra a Cozinha apenas o que e da Cozinha", async () => {
    entrarComo("cozinha");
    await comandaComConsumo();

    renderizarEm("/preparo");

    await waitFor(() => expect(screen.getByText("Mesa 5")).toBeInTheDocument());
    expect(screen.getByText(/Porcao de mandioca frita/)).toBeInTheDocument();
    expect(screen.queryByText(/Chopp Pilsen/)).not.toBeInTheDocument();
    expect(screen.getByText(/obs: sem sal/i)).toBeInTheDocument();
  });

  it("avanca o ticket da fila para em preparo", async () => {
    const usuario = userEvent.setup();
    entrarComo("cozinha");
    await comandaComConsumo();

    renderizarEm("/preparo");

    await waitFor(() => expect(within(coluna("Na fila")).getByText("Mesa 5")).toBeInTheDocument());

    await usuario.click(screen.getByRole("button", { name: /iniciar preparo/i }));

    await waitFor(() =>
      expect(within(coluna("Em preparo")).getByText("Mesa 5")).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /marcar pronto/i })).toBeInTheDocument();
  });

  it("deixa olhar o outro Destino, mas nao deixa avancar o preparo dele", async () => {
    const usuario = userEvent.setup();
    entrarComo("cozinha");
    await comandaComConsumo();

    renderizarEm("/preparo");
    await waitFor(() => expect(screen.getByText(/Porcao de mandioca frita/)).toBeInTheDocument());

    await usuario.click(screen.getByRole("button", { name: "Bar", pressed: false }));

    await waitFor(() => expect(screen.getByText(/Chopp Pilsen/)).toBeInTheDocument());
    expect(screen.getByText(/somente cozinha pode avancar/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar preparo/i })).toBeDisabled();
  });
});
