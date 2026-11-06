import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { Comanda } from "@/domain/tipos";
import { comandaComConsumo, fecharComandaNaApi, prepararContrato } from "@/test/contrato";
import { entrarComo, renderizarEm, sair } from "@/test/render";

/**
 * Seam 4: Fechamento e Pagamento. O que estes testes protegem e que a Taxa de
 * Servico e o saldo exibidos vem do servidor a cada operacao (ADR-0002), e que a
 * divisao de conta e feita com pagamentos parciais (Q24).
 */
prepararContrato();

afterEach(sair);

async function comandaFechada(): Promise<Comanda> {
  const comanda = await comandaComConsumo();
  return (await fecharComandaNaApi(comanda.id)).json();
}

describe("tela de Fechamento", () => {
  it("recalcula o total quando o cliente recusa a taxa de servico", async () => {
    const usuario = userEvent.setup();
    entrarComo("caixa");
    const comanda = await comandaFechada();

    renderizarEm(`/caixa/comandas/${comanda.id}/fechamento`);

    await waitFor(() => expect(screen.getByTestId("total")).toHaveTextContent("R$ 77,33"));
    expect(screen.getByTestId("taxa")).toHaveTextContent("R$ 7,03");

    await usuario.click(screen.getByRole("button", { name: /cobrando/i }));

    await waitFor(() => expect(screen.getByTestId("total")).toHaveTextContent("R$ 70,30"));
    expect(screen.getByTestId("taxa")).toHaveTextContent("R$ 0,00");
    expect(screen.getByRole("button", { name: /nao cobrando/i })).toBeInTheDocument();
  });

  it("exige motivo para reabrir a comanda", async () => {
    const usuario = userEvent.setup();
    entrarComo("caixa");
    const comanda = await comandaFechada();

    renderizarEm(`/caixa/comandas/${comanda.id}/fechamento`);

    await usuario.click(await screen.findByRole("button", { name: /reabrir comanda/i }));
    await usuario.click(screen.getByRole("button", { name: /confirmar reabertura/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/motivo/i));
  });
});

describe("tela de Pagamento", () => {
  it("divide o saldo por 2 e quita a comanda com dois pagamentos parciais", async () => {
    const usuario = userEvent.setup();
    entrarComo("caixa");
    const comanda = await comandaFechada();

    renderizarEm(`/caixa/comandas/${comanda.id}/pagamento`);

    await waitFor(() => expect(screen.getByTestId("total")).toHaveTextContent("R$ 77,33"));

    // 7733 / 2 = 3866,5 -> arredonda para cima: 38,67 para o primeiro pagante.
    await usuario.click(screen.getByRole("button", { name: /por 2/i }));
    expect(screen.getByLabelText(/valor recebido/i)).toHaveValue("38,67");

    await usuario.click(screen.getByRole("button", { name: /registrar pagamento/i }));

    await waitFor(() => expect(screen.getByTestId("saldo")).toHaveTextContent("R$ 38,66"));
    expect(screen.getByText(/pagamentos registrados \(1\)/i)).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: /saldo inteiro/i }));
    await usuario.click(screen.getByRole("button", { name: /registrar pagamento/i }));

    await waitFor(() => expect(screen.getByText(/comanda quitada/i)).toBeInTheDocument());
  });

  it("recusa valor em branco sem chamar a API", async () => {
    const usuario = userEvent.setup();
    entrarComo("caixa");
    const comanda = await comandaFechada();

    renderizarEm(`/caixa/comandas/${comanda.id}/pagamento`);

    await usuario.click(await screen.findByRole("button", { name: /registrar pagamento/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/valor maior que zero/i),
    );
    expect(screen.getByTestId("total")).toHaveTextContent("R$ 77,33");
  });
});
