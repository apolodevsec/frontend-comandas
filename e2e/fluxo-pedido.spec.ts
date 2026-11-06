import { expect, test } from "@playwright/test";
import { adicionarAoPedido, comecarLimpo, entrarComo, sair } from "./apoio";

/**
 * Fluxo 1: abrir mesa -> lancar rodada -> Cozinha e Bar preparam -> Garcom entrega.
 * Atravessa os tres papeis e prova que o Pedido so fica pronto quando os dois
 * Destinos terminam (Q18).
 */

test.use({ viewport: { width: 390, height: 844 } });

test("do lancamento na mesa a entrega pelo garcom", async ({ page }) => {
  await comecarLimpo(page);

  await test.step("Garcom abre a comanda da mesa 3 e lanca uma rodada", async () => {
    await entrarComo(page, "garcom");

    await page
      .locator("li", { hasText: /^3/ })
      .getByRole("button", { name: "Abrir comanda" })
      .click();

    await expect(page.getByRole("heading", { name: "Lancar pedido" })).toBeVisible();

    await adicionarAoPedido(page, "Chopp Pilsen 500ml");
    await adicionarAoPedido(page, "Porcao de mandioca frita");

    await page.getByRole("button", { name: "Lancar rodada" }).click();

    // 18,90 + 32,50 = 51,40 de consumo; com 10% de taxa, 56,54.
    await expect(page.getByTestId("total")).toHaveText("R$ 56,54");
    await expect(page.getByText("Pendente")).toBeVisible();
  });

  await test.step("Cozinha prepara a sua parte e o Pedido ainda nao esta pronto", async () => {
    await sair(page);
    await entrarComo(page, "cozinha");

    await expect(page.getByText("Mesa 3")).toBeVisible();
    await expect(page.getByText("Porcao de mandioca frita")).toBeVisible();
    await expect(page.getByText("Chopp Pilsen 500ml")).toHaveCount(0);

    await page.getByRole("button", { name: "Iniciar preparo" }).click();
    await page.getByRole("button", { name: "Marcar pronto" }).click();

    await expect(page.getByText("Aguardando o garcom retirar")).toBeVisible();
  });

  await test.step("Bar prepara a bebida e o Pedido fica pronto", async () => {
    await sair(page);
    await entrarComo(page, "bar");

    await expect(page.getByText("Chopp Pilsen 500ml")).toBeVisible();
    await page.getByRole("button", { name: "Iniciar preparo" }).click();
    await page.getByRole("button", { name: "Marcar pronto" }).click();
  });

  await test.step("Garcom encontra o pedido na fila de entregas e entrega", async () => {
    await sair(page);
    await entrarComo(page, "garcom");

    await page.getByRole("link", { name: "Entregas" }).click();

    await expect(page.getByText("Mesa 3")).toBeVisible();
    await page.getByRole("button", { name: "Entreguei" }).click();

    await expect(page.getByText("Nada pronto agora")).toBeVisible();
  });
});
