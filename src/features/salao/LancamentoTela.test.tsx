import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { Comanda } from "@/domain/tipos";
import { abrirComandaNaMesa, prepararContrato } from "@/test/contrato";
import { entrarComo, renderizarEm, sair } from "@/test/render";
import { useRodada } from "./rodada";

/**
 * Seam 4: comportamento da tela de Lancamento. O que este teste protege e a regra
 * do ADR-0002: o total exibido vem do servidor, nao de uma soma no componente.
 */
prepararContrato();

afterEach(() => {
  sair();
  useRodada.setState({ comandaId: null, linhas: [] });
});

async function comandaAberta(): Promise<Comanda> {
  return (await abrirComandaNaMesa("mesa-2")).json();
}

/** Busca pelo cartao do item no cardapio, nao por posicao: itens indisponiveis nao tem botao. */
async function botaoDeAdicionar(nomeDoItem: string): Promise<HTMLElement> {
  const titulo = await screen.findByText(nomeDoItem);
  const cartao = titulo.closest("li");
  if (cartao === null) throw new Error(`Cartao de ${nomeDoItem} nao encontrado.`);
  return within(cartao).getByRole("button", { name: "Adicionar" });
}

describe("tela de Lancamento", () => {
  it("monta a rodada e mostra a previa do que foi escolhido", async () => {
    const usuario = userEvent.setup();
    entrarComo("garcom");
    const comanda = await comandaAberta();

    renderizarEm(`/salao/comandas/${comanda.id}/lancar`);

    const chopp = await botaoDeAdicionar("Chopp Pilsen 500ml");
    await usuario.click(chopp);
    await usuario.click(chopp);

    // 2 chopps a R$ 18,90 = R$ 37,80, conferido a mao
    await waitFor(() =>
      expect(screen.getByTestId("previa-da-rodada")).toHaveTextContent("R$ 37,80"),
    );
  });

  it("nao deixa lancar item indisponivel", async () => {
    entrarComo("garcom");
    const comanda = await comandaAberta();

    renderizarEm(`/salao/comandas/${comanda.id}/lancar`);

    const titulo = await screen.findByText("Suco de laranja 400ml");
    const cartao = titulo.closest("li");
    if (cartao === null) throw new Error("Cartao do item indisponivel nao encontrado.");

    expect(within(cartao).getByRole("button", { name: /indisponivel/i })).toBeDisabled();
  });

  it("lanca a rodada e exibe o total que o servidor calculou", async () => {
    const usuario = userEvent.setup();
    entrarComo("garcom");
    const comanda = await comandaAberta();

    renderizarEm(`/salao/comandas/${comanda.id}/lancar`);

    const chopp = await botaoDeAdicionar("Chopp Pilsen 500ml");
    await usuario.click(chopp);
    await usuario.click(chopp);
    await usuario.click(await botaoDeAdicionar("Porcao de mandioca frita"));

    await usuario.click(screen.getByRole("button", { name: /lancar rodada/i }));

    // 2x18,90 + 1x32,50 = 70,30 de consumo; com 10% de taxa, 77,33.
    await waitFor(() => expect(screen.getByTestId("total")).toHaveTextContent("R$ 77,33"));
    expect(screen.getByTestId("consumo")).toHaveTextContent("R$ 70,30");
    expect(screen.getByTestId("taxa")).toHaveTextContent("R$ 7,03");
  });

  it("escreve a observacao no item e a leva para a comanda", async () => {
    const usuario = userEvent.setup();
    entrarComo("garcom");
    const comanda = await comandaAberta();

    renderizarEm(`/salao/comandas/${comanda.id}/lancar`);

    await usuario.click(await botaoDeAdicionar("Porcao de mandioca frita"));

    await usuario.type(screen.getByLabelText(/observacao para/i), "sem sal");
    await usuario.click(screen.getByRole("button", { name: /lancar rodada/i }));

    await waitFor(() => expect(screen.getByText(/obs: sem sal/i)).toBeInTheDocument());
  });
});
