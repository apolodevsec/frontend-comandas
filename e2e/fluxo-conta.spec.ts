import { expect, test } from "@playwright/test";
import { adicionarAoPedido, comecarLimpo, entrarComo, sair } from "./apoio";

/**
 * Fluxos 2 e 3: fechamento com Taxa de Servico e pagamento dividido.
 * Prova que o total vem do servidor a cada operacao (ADR-0002) e que dividir a
 * conta e registrar pagamentos parciais (Q24).
 */

async function abrirConsumoNaMesa4(page: import("@playwright/test").Page): Promise<void> {
  await entrarComo(page, "garcom");
  await page
    .locator("li", { hasText: /^4/ })
    .getByRole("button", { name: "Abrir comanda" })
    .click();
  await adicionarAoPedido(page, "Chopp Pilsen 500ml");
  await adicionarAoPedido(page, "Chopp Pilsen 500ml");
  await adicionarAoPedido(page, "Porcao de mandioca frita");
  await page.getByRole("button", { name: "Lancar rodada" }).click();
  // 2x18,90 + 32,50 = 70,30; com taxa, 77,33.
  await expect(page.getByTestId("total")).toHaveText("R$ 77,33");
  await page.getByRole("button", { name: "Pedir a conta" }).click();
  await expect(page.getByText("Aguardando pagamento")).toBeVisible();
}

test("Caixa alterna a taxa de servico e o total e recalculado pelo servidor", async ({ page }) => {
  await comecarLimpo(page);
  await abrirConsumoNaMesa4(page);

  await sair(page);
  await entrarComo(page, "caixa");

  await expect(page.getByRole("heading", { name: /Aguardando pagamento/ })).toBeVisible();
  await page.getByRole("button", { name: "Receber" }).click();

  await expect(page.getByTestId("total")).toHaveText("R$ 77,33");

  await page.getByRole("link", { name: "Ajustar fechamento" }).click();

  await expect(page.getByTestId("taxa")).toHaveText("R$ 7,03");
  await page.getByRole("button", { name: "Cobrando" }).click();

  await expect(page.getByTestId("taxa")).toHaveText("R$ 0,00");
  await expect(page.getByTestId("total")).toHaveText("R$ 70,30");
});

test("Caixa divide a conta por 2 e quita com dois pagamentos", async ({ page }) => {
  await comecarLimpo(page);
  await abrirConsumoNaMesa4(page);

  await sair(page);
  await entrarComo(page, "caixa");
  await page.getByRole("button", { name: "Receber" }).click();

  await expect(page.getByTestId("total")).toHaveText("R$ 77,33");

  await page.getByRole("button", { name: "Pix" }).click();
  await page.getByRole("button", { name: "por 2" }).click();
  await expect(page.getByLabel("Valor recebido")).toHaveValue("38,67");
  await page.getByRole("button", { name: "Registrar pagamento" }).click();

  await expect(page.getByTestId("saldo")).toHaveText("R$ 38,66");
  await expect(page.getByText("Pagamentos registrados (1)")).toBeVisible();

  await page.getByRole("button", { name: "Credito" }).click();
  await page.getByRole("button", { name: "saldo inteiro" }).click();
  await page.getByRole("button", { name: "Registrar pagamento" }).click();

  await expect(page.getByText("Comanda quitada")).toBeVisible();
  await expect(page.getByText("Pagamentos registrados (2)")).toBeVisible();
});
