import type { Centavos } from "@/domain/tipos";

/**
 * Formatacao propria em vez de Intl.NumberFormat: Intl insere espaco nao-quebravel
 * entre "R$" e o numero, o que varia por runtime e vaza para teste e para snapshot.
 */
export function formatarReais(centavos: Centavos): string {
  const negativo = centavos < 0;
  const absoluto = Math.abs(Math.trunc(centavos));
  const reais = Math.trunc(absoluto / 100);
  const resto = absoluto % 100;

  const comMilhar = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimais = String(resto).padStart(2, "0");

  return `${negativo ? "-" : ""}R$ ${comMilhar},${decimais}`;
}

/** Le o que o Caixa digita ("19,90", "1.234,56", "R$ 7,50", "8.5") em centavos. */
export function lerReaisEmCentavos(entrada: string): Centavos | null {
  const limpo = entrada.replace(/[R$\s]/g, "");
  if (limpo === "") return null;

  // Ultimo separador manda: em "1.234,56" é a virgula; em "8.5" é o ponto.
  const posicaoDecimal = Math.max(limpo.lastIndexOf(","), limpo.lastIndexOf("."));
  let inteiros = limpo;
  let decimais = "0";

  if (posicaoDecimal !== -1) {
    const cauda = limpo.slice(posicaoDecimal + 1);
    // Separador de milhar (3 digitos apos o ultimo ponto) nao é decimal.
    if (!(cauda.length === 3 && limpo[posicaoDecimal] === ".")) {
      inteiros = limpo.slice(0, posicaoDecimal);
      decimais = cauda;
    }
  }

  const soDigitos = inteiros.replace(/[.,]/g, "");
  if (!/^\d*$/.test(soDigitos) || !/^\d*$/.test(decimais)) return null;
  if (soDigitos === "" && decimais === "") return null;

  const centavos =
    Number(soDigitos || "0") * 100 + Number(decimais.padEnd(2, "0").slice(0, 2) || "0");

  return Number.isFinite(centavos) ? centavos : null;
}
