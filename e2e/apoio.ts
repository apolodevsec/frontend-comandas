import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/** Usuarios de demonstracao servidos pelo mock (src/mocks/fixtures.ts). */
export const USUARIOS = {
  garcom: "u-1",
  cozinha: "u-2",
  bar: "u-3",
  caixa: "u-4",
} as const;

const SENHA = "123456";

/**
 * O mock guarda o estado em localStorage (docs/adr/0001), entao cada teste comeca
 * limpando, para nao herdar comandas do teste anterior.
 */
export async function comecarLimpo(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
}

export async function entrarComo(page: Page, usuario: keyof typeof USUARIOS): Promise<void> {
  await page.goto("/entrar");
  await page.getByLabel("Usuario").fill(USUARIOS[usuario]);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
}

export async function sair(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
}

/** Clica no botao "Adicionar" do cartao daquele item do cardapio. */
export async function adicionarAoPedido(page: Page, nomeDoItem: string): Promise<void> {
  const cartao = page.locator("li", { hasText: nomeDoItem }).last();
  await cartao.getByRole("button", { name: "Adicionar", exact: true }).click();
}
